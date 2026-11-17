import { CONFIG } from '../config';

export type QualityPreset = 'low' | 'medium' | 'high';

export class QualityManager {
  private currentPreset: QualityPreset = 'high';
  private resolutionScale: number = 1.0;
  private frameTimes: number[] = [];
  private readonly maxSamples: number = 60;
  private highLatencyDuration: number = 0;
  private lowLatencyDuration: number = 0;

  constructor() {
    this.detectOptimalPreset();
  }

  private detectOptimalPreset(): void {
    // Basic heuristic: check hardware concurrency & devicePixelRatio
    const cores = navigator.hardwareConcurrency || 4;
    const isMobileGPU = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    if (isMobileGPU || cores <= 4) {
      this.currentPreset = 'medium';
    } else {
      this.currentPreset = 'high';
    }
  }

  public getPreset(): QualityPreset {
    return this.currentPreset;
  }

  public setPreset(preset: QualityPreset): void {
    this.currentPreset = preset;
  }

  public getSettings() {
    return CONFIG.QUALITY[this.currentPreset];
  }

  public getResolutionScale(): number {
    return this.resolutionScale;
  }

  public recordFrameTime(frameMs: number, dt: number): void {
    this.frameTimes.push(frameMs);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }

    const avgMs = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    // Adaptive resolution scaling
    if (avgMs > 20.0) {
      this.highLatencyDuration += dt;
      this.lowLatencyDuration = 0;
      if (this.highLatencyDuration >= 3.0 && this.resolutionScale > 0.6) {
        this.resolutionScale = Math.max(0.6, parseFloat((this.resolutionScale - 0.1).toFixed(2)));
        this.highLatencyDuration = 0;
      }
    } else if (avgMs < 14.0) {
      this.lowLatencyDuration += dt;
      this.highLatencyDuration = 0;
      if (this.lowLatencyDuration >= 5.0 && this.resolutionScale < 1.0) {
        this.resolutionScale = Math.min(1.0, parseFloat((this.resolutionScale + 0.1).toFixed(2)));
        this.lowLatencyDuration = 0;
      }
    } else {
      this.highLatencyDuration = 0;
      this.lowLatencyDuration = 0;
    }
  }
}
