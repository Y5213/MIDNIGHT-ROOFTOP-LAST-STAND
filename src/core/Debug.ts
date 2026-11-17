export class DebugHUD {
  private element: HTMLElement;
  private isVisible: boolean = false;
  private fps: number = 60;
  private frameMs: number = 16.6;
  private drawCalls: number = 0;
  private triangles: number = 0;
  private aliveZombies: number = 0;
  private activeParticles: number = 0;
  private resolutionScale: number = 1.0;
  public readonly isDebugMode: boolean;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    this.isDebugMode = params.get('debug') === '1';

    this.element = document.createElement('div');
    this.element.id = 'debug-hud';
    this.element.className = 'debug-hud hidden';
    document.body.appendChild(this.element);

    if (this.isDebugMode) {
      this.isVisible = true;
      this.element.classList.remove('hidden');
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F3' || e.key === '`') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.element.classList.remove('hidden');
    } else {
      this.element.classList.add('hidden');
    }
  }

  public updateStats(data: {
    fps: number;
    frameMs: number;
    drawCalls: number;
    triangles: number;
    aliveZombies: number;
    activeParticles: number;
    resolutionScale: number;
  }): void {
    if (!this.isVisible) return;
    this.fps = data.fps;
    this.frameMs = data.frameMs;
    this.drawCalls = data.drawCalls;
    this.triangles = data.triangles;
    this.aliveZombies = data.aliveZombies;
    this.activeParticles = data.activeParticles;
    this.resolutionScale = data.resolutionScale;
    this.render();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="debug-title">DEBUG TELEMETRY [F3]</div>
      <div>FPS: <b>${this.fps}</b> (${this.frameMs.toFixed(1)} ms)</div>
      <div>DRAWS: <b>${this.drawCalls}</b> | TRIS: <b>${this.triangles}</b></div>
      <div>ZOMBIES: <b>${this.aliveZombies}</b> | PARTICLES: <b>${this.activeParticles}</b></div>
      <div>RES SCALE: <b>${(this.resolutionScale * 100).toFixed(0)}%</b></div>
    `;
  }
}
