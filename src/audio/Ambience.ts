import { AudioEngine } from './AudioEngine';
import { AtmosphereType } from '../config';

export class AmbienceManager {
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  private chopperOsc: OscillatorNode | null = null;
  private chopperGain: GainNode | null = null;
  private chopperMod: OscillatorNode | null = null;
  private isChopperPlaying: boolean = false;

  private thunderTimeout: number | null = null;

  constructor(private readonly engine: AudioEngine) {}

  public start(): void {
    const ctx = this.engine.ctx;
    const dest = this.engine.ambienceGain;
    if (!ctx || !dest) return;

    this.startRain(ctx, dest);
    this.startWind(ctx, dest);
  }

  public setAtmosphere(type: AtmosphereType): void {
    const now = this.engine.ctx?.currentTime || 0;
    if (type === 'sunset') {
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(0.06, now, 0.1);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(320, now, 0.1);
    } else if (type === 'sunrise') {
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(0.02, now, 0.1);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(240, now, 0.1);
    } else {
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(0.18, now, 0.1);
      if (this.windFilter) this.windFilter.frequency.setTargetAtTime(480, now, 0.1);
    }
  }

  private startRain(ctx: AudioContext, dest: GainNode): void {
    if (this.rainNode) return;

    // Generate 5-second seamless white noise buffer
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * 5, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.rainNode = ctx.createBufferSource();
    this.rainNode.buffer = buffer;
    this.rainNode.loop = true;

    // Bandpass + highpass filter for crisp rooftop rain patter
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 0.9;

    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0.18;

    this.rainNode.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(dest);

    this.rainNode.start();
  }

  private startWind(ctx: AudioContext, dest: GainNode): void {
    if (this.windNode) return;

    // Generate 6-second noise buffer for low wind gusts
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * 6, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise
      lastOut = data[i];
      data[i] *= 3.5;
    }

    this.windNode = ctx.createBufferSource();
    this.windNode.buffer = buffer;
    this.windNode.loop = true;

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 220;

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.22;

    this.windNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(dest);

    this.windNode.start();
  }

  public update(time: number): void {
    if (!this.windFilter || !this.windGain) return;
    const ctx = this.engine.ctx;
    if (!ctx) return;

    // Slowly modulate wind frequency and gain to simulate rooftop gusts
    const gust = Math.sin(time * 0.4) * 0.5 + Math.sin(time * 0.17) * 0.5;
    const targetFreq = 180 + gust * 140;
    this.windFilter.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.5);
    this.windGain.gain.setTargetAtTime(0.18 + gust * 0.12, ctx.currentTime, 0.5);
  }

  public triggerThunder(delaySeconds: number = 0.8): void {
    const ctx = this.engine.ctx;
    const dest = this.engine.ambienceGain;
    if (!ctx || !dest) return;

    if (this.thunderTimeout) clearTimeout(this.thunderTimeout);

    this.thunderTimeout = window.setTimeout(() => {
      this.playThunderRoll(ctx, dest);
    }, delaySeconds * 1000);
  }

  private playThunderRoll(ctx: AudioContext, dest: GainNode): void {
    const duration = 3.5;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.98 * b1 + b0 * 0.05;
      b2 = 0.97 * b2 + b1 * 0.05;
      data[i] = b2 * 4.0;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start();
  }

  public startChopperRescue(): void {
    const ctx = this.engine.ctx;
    const dest = this.engine.ambienceGain;
    if (!ctx || !dest || this.isChopperPlaying) return;
    this.isChopperPlaying = true;

    // Helicopter rotor blade pulse
    this.chopperOsc = ctx.createOscillator();
    this.chopperOsc.type = 'sawtooth';
    this.chopperOsc.frequency.value = 65; // Base engine hum

    // Amplitude modulation at ~18 Hz (rotor blades chopping air)
    this.chopperMod = ctx.createOscillator();
    this.chopperMod.type = 'square';
    this.chopperMod.frequency.value = 18;

    const modGain = ctx.createGain();
    modGain.gain.value = 0.6;

    this.chopperGain = ctx.createGain();
    this.chopperGain.gain.setValueAtTime(0.001, ctx.currentTime);
    // Swell up as helicopter arrives
    this.chopperGain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 4.0);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;

    this.chopperMod.connect(modGain);
    this.chopperOsc.connect(this.chopperGain);
    this.chopperGain.connect(filter);
    filter.connect(dest);

    this.chopperOsc.start();
    this.chopperMod.start();
  }
}
