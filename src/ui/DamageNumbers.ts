import * as THREE from 'three';

interface ActiveNumber {
  element: HTMLDivElement;
  pos: THREE.Vector3;
  life: number;
  maxLife: number;
  offsetY: number;
}

export class DamageNumberManager {
  private readonly container: HTMLDivElement;
  private readonly pool: ActiveNumber[] = [];
  private readonly projPos: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'damage-numbers-layer';
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.overflow = 'hidden';
    this.container.style.zIndex = '50';
    document.body.appendChild(this.container);
  }

  public spawn(worldPos: THREE.Vector3, damage: number, isHeadshot: boolean, label?: string): void {
    const el = document.createElement('div');
    el.className = `damage-pop ${isHeadshot ? 'headshot-pop' : ''}`;
    el.textContent = label ? `${label} -${damage}` : `-${damage}`;

    this.container.appendChild(el);

    this.pool.push({
      element: el,
      pos: worldPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.4, (Math.random() - 0.5) * 0.2)),
      life: 0.75,
      maxLife: 0.75,
      offsetY: 0,
    });
  }

  public update(dt: number, camera: THREE.PerspectiveCamera): void {
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;

    for (let i = this.pool.length - 1; i >= 0; i--) {
      const item = this.pool[i];
      item.life -= dt;
      item.offsetY += dt * 0.9; // Drift upward

      if (item.life <= 0) {
        this.container.removeChild(item.element);
        this.pool.splice(i, 1);
        continue;
      }

      // Project world position to NDC screen space
      this.projPos.copy(item.pos);
      this.projPos.y += item.offsetY;
      this.projPos.project(camera);

      // Check if behind camera
      if (this.projPos.z > 1.0) {
        item.element.style.display = 'none';
        continue;
      }

      item.element.style.display = 'block';
      const screenX = this.projPos.x * widthHalf + widthHalf;
      const screenY = -(this.projPos.y * heightHalf) + heightHalf;

      const progress = 1.0 - item.life / item.maxLife;
      const opacity = item.life < 0.25 ? item.life / 0.25 : 1.0;
      const scale = 1.0 + Math.sin(progress * Math.PI * 0.5) * 0.3;

      item.element.style.transform = `translate(-50%, -50%) translate3d(${screenX}px, ${screenY}px, 0) scale(${scale})`;
      item.element.style.opacity = `${opacity}`;
    }
  }

  public clear(): void {
    for (const item of this.pool) {
      if (item.element.parentElement) {
        this.container.removeChild(item.element);
      }
    }
    this.pool.length = 0;
  }
}
