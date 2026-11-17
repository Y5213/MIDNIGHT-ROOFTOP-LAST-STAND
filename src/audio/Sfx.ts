import { AudioEngine } from './AudioEngine';

export class SfxManager {
  private shaperCurve: Float32Array;

  constructor(private readonly audio: AudioEngine) {
    this.shaperCurve = this.makeTanhCurve(3.5);
  }

  private makeTanhCurve(k: number): Float32Array {
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(k * x);
    }
    return curve;
  }

  /**
   * Synthesizes the ARC-7 Laser Pulse Blast
   */
  public playLaserShot(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;

    const now = ctx.currentTime;
    const rand = 1.0 + (Math.random() - 0.5) * 0.16; // +-8% pitch variance

    // 1. Sawtooth Laser Sweep (2200 Hz -> 160 Hz over 0.16s)
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.setValueAtTime(2200 * rand, now);
    saw.frequency.exponentialRampToValueAtTime(160 * rand, now + 0.16);

    const sawGain = ctx.createGain();
    sawGain.gain.setValueAtTime(0.38, now);
    sawGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    // 2. High Octave Square Zap Bite (~4400 Hz for 0.06s)
    const sq = ctx.createOscillator();
    sq.type = 'square';
    sq.frequency.setValueAtTime(4200 * rand, now);
    sq.frequency.exponentialRampToValueAtTime(800 * rand, now + 0.06);

    const sqGain = ctx.createGain();
    sqGain.gain.setValueAtTime(0.18, now);
    sqGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    // 3. White Noise Sizzle Burst through 5 kHz High-Pass (40ms)
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(4800, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    // 4. Low Sine Sub-Thump (120 Hz -> 45 Hz over 90ms)
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.09);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.42, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    // WaveShaper soft-clipping saturation
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.shaperCurve;

    // Route voices to shaper
    saw.connect(sawGain);
    sq.connect(sqGain);
    sub.connect(subGain);
    noise.connect(hpFilter);
    hpFilter.connect(noiseGain);

    sawGain.connect(shaper);
    sqGain.connect(shaper);
    subGain.connect(shaper);
    noiseGain.connect(shaper);

    shaper.connect(this.audio.sfxGain!);

    // Reverb send (~18%)
    const reverbNode = this.audio.getReverbNode();
    if (reverbNode) {
      const send = ctx.createGain();
      send.gain.setValueAtTime(0.18, now);
      shaper.connect(send);
      send.connect(reverbNode);
    }

    saw.start(now);
    sq.start(now);
    sub.start(now);
    noise.start(now);

    saw.stop(now + 0.17);
    sq.stop(now + 0.07);
    sub.stop(now + 0.1);
    noise.stop(now + 0.05);
  }

  public playReloadSequence(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;

    const now = ctx.currentTime;

    // 1. Eject Click (at 0.1s)
    const eject = ctx.createOscillator();
    const ejectGain = ctx.createGain();
    eject.frequency.setValueAtTime(950, now + 0.1);
    eject.frequency.exponentialRampToValueAtTime(300, now + 0.18);
    ejectGain.gain.setValueAtTime(0.2, now + 0.1);
    ejectGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    eject.connect(ejectGain);
    ejectGain.connect(this.audio.sfxGain!);
    eject.start(now + 0.1);
    eject.stop(now + 0.19);

    // 2. Servo Whine (at 0.6s)
    const servo = ctx.createOscillator();
    const servoGain = ctx.createGain();
    servo.type = 'sawtooth';
    servo.frequency.setValueAtTime(320, now + 0.6);
    servo.frequency.exponentialRampToValueAtTime(780, now + 1.1);
    servoGain.gain.setValueAtTime(0.08, now + 0.6);
    servoGain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
    servo.connect(servoGain);
    servoGain.connect(this.audio.sfxGain!);
    servo.start(now + 0.6);
    servo.stop(now + 1.16);

    // 3. Power-Up Chime & Chamber Lock (at 1.35s)
    const lock = ctx.createOscillator();
    const lockGain = ctx.createGain();
    lock.type = 'triangle';
    lock.frequency.setValueAtTime(600, now + 1.35);
    lock.frequency.setValueAtTime(1200, now + 1.45);
    lockGain.gain.setValueAtTime(0.22, now + 1.35);
    lockGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    lock.connect(lockGain);
    lockGain.connect(this.audio.sfxGain!);
    lock.start(now + 1.35);
    lock.stop(now + 1.61);
  }

  public playDryFire(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    const click = ctx.createOscillator();
    const gain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(800, now);
    click.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    click.connect(gain);
    gain.connect(this.audio.sfxGain!);
    click.start(now);
    click.stop(now + 0.05);
  }

  public playImpactSizzle(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(3200, now);
    bp.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(bp);
    bp.connect(gain);
    gain.connect(this.audio.sfxGain!);

    noise.start(now);
    noise.stop(now + 0.085);
  }

  public playPlankHit(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playPlankBreak(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Splinter noise burst
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, now);
    bp.frequency.exponentialRampToValueAtTime(350, now + 0.25);
    bp.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(bp);
    bp.connect(gain);
    gain.connect(this.audio.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.26);
  }

  public playRepair(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Hammer impact
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playZombieGrowl(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Low guttural FM synthesis
    const carrier = ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(95 + (Math.random() - 0.5) * 20, now);
    carrier.frequency.exponentialRampToValueAtTime(65, now + 0.45);

    const mod = ctx.createOscillator();
    mod.type = 'sawtooth';
    mod.frequency.setValueAtTime(35, now);

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(80, now);

    const outGain = ctx.createGain();
    outGain.gain.setValueAtTime(0.18, now);
    outGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(filter);
    filter.connect(outGain);
    outGain.connect(this.audio.sfxGain!);

    mod.start(now);
    carrier.start(now);
    mod.stop(now + 0.46);
    carrier.stop(now + 0.46);
  }

  public playZombieDeath(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // High sizzle dissolve screech
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playPlayerHurt(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    sub.connect(gain);
    gain.connect(this.audio.sfxGain!);
    sub.start(now);
    sub.stop(now + 0.21);
  }

  public playPickup(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playFootstep(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Wet concrete slap / click
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + (Math.random() - 0.5) * 20, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playPistolShot(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Snappy high-frequency plasma crack
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;

    osc.connect(bp);
    bp.connect(gain);
    gain.connect(this.audio.sfxGain!);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playShurikenThrow(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Aerodynamic whoosh
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playShurikenHit(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Metallic slash impact
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playInspectRustle(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playShurikenCatch(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Metallic blade snap/catch
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.audio.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playMedkit(): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Soft rising healing chord
    [520, 650, 780].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.35);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audio.sfxGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + 0.42);
    });
  }

  public playLevelFanfare(level: number): void {
    const ctx = this.audio.ctx;
    if (!ctx || this.audio.isMuted) return;
    const now = ctx.currentTime;

    // Bold cinematic sci-fi level transition fanfare
    const baseFreq = 160 + level * 20;
    const chords = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2.0];
    chords.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.6);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audio.sfxGain!);

      osc.start(now + i * 0.08);
      osc.stop(now + 1.25);
    });
  }
}
