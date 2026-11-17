export type UpdateCallback = (fixedDt: number) => void;
export type RenderCallback = (alpha: number) => void;

export class Loop {
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedDt: number = 1 / 60; // 60Hz physics/gameplay
  private readonly maxFrameTime: number = 0.1; // clamp to prevent spiral of death
  private rafId: number | null = null;

  constructor(
    private readonly onUpdate: UpdateCallback,
    private readonly onRender: RenderCallback
  ) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (currentTime: number): void => {
    if (!this.isRunning) return;

    let delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (delta > this.maxFrameTime) {
      delta = this.maxFrameTime;
    }

    this.accumulator += delta;

    while (this.accumulator >= this.fixedDt) {
      this.onUpdate(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    const alpha = this.accumulator / this.fixedDt;
    this.onRender(alpha);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
