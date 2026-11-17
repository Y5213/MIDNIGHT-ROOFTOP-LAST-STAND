export class AudioEngine {
  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public sfxGain: GainNode | null = null;
  public ambienceGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  public isMuted: boolean = false;

  constructor() {
    // Initialized on first user interaction
  }

  public init(): void {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Compressor
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
    compressor.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(compressor);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.ambienceGain.connect(this.masterGain);

    // Algorithmic Synthetic Reverb (1.6s exponential decay noise impulse response)
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this.buildImpulseResponse(1.6, 2.5);
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.convolver.connect(reverbGain);
    reverbGain.connect(this.masterGain);
  }

  private buildImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const buffer = this.ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const factor = Math.exp(-t * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return buffer;
  }

  public getReverbNode(): ConvolverNode | null {
    return this.convolver;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0.001 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  private masterVolume: number = 0.85;
  private sfxVolume: number = 0.9;
  private ambienceVolume: number = 0.5;

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setAmbienceVolume(val: number): void {
    this.ambienceVolume = Math.max(0, Math.min(1, val));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(this.ambienceVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getMasterVolume(): number { return this.masterVolume; }
  public getSfxVolume(): number { return this.sfxVolume; }
  public getAmbienceVolume(): number { return this.ambienceVolume; }
}
