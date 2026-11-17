import * as THREE from 'three';
import { CONFIG } from '../config';

interface ActiveBeam {
  group: THREE.Group;
  core: THREE.Mesh;
  inner: THREE.Mesh;
  halo: THREE.Mesh;
  pulseHead: THREE.Mesh;
  start: THREE.Vector3;
  end: THREE.Vector3;
  distance: number;
  life: number;
  maxLife: number;
}

export class BeamFXManager {
  public readonly mesh: THREE.Group;
  private readonly pool: ActiveBeam[] = [];
  private readonly activeBeams: ActiveBeam[] = [];
  private muzzleFlashSprite: THREE.Sprite;
  private muzzleFlashTimer: number = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'laser_beam_fx';

    // Build pooled beams (16 instances)
    const poolSize = 16;
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(this.createBeamInstance());
    }

    // Muzzle Flash Sprite
    const flashCanvas = document.createElement('canvas');
    flashCanvas.width = 128;
    flashCanvas.height = 128;
    const fCtx = flashCanvas.getContext('2d')!;
    const grad = fCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, CONFIG.LASER_HEX);
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    fCtx.fillStyle = grad;
    fCtx.fillRect(0, 0, 128, 128);

    const flashTex = new THREE.CanvasTexture(flashCanvas);
    const flashMat = new THREE.SpriteMaterial({
      map: flashTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.muzzleFlashSprite = new THREE.Sprite(flashMat);
    this.muzzleFlashSprite.scale.set(0.32, 0.32, 1);
    this.muzzleFlashSprite.visible = false;
    this.mesh.add(this.muzzleFlashSprite);
  }

  private createBeamInstance(): ActiveBeam {
    const group = new THREE.Group();
    group.visible = false;

    // Unit cylinder aligned to +Z (from 0 to 1)
    const baseGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
    baseGeo.rotateX(Math.PI / 2);
    baseGeo.translate(0, 0, 0.5);

    // 1. White-Hot Core (r ~0.006)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const core = new THREE.Mesh(baseGeo, coreMat);
    core.scale.set(0.006, 0.006, 1);
    group.add(core);

    // 2. Cyan Inner Glow (r ~0.018)
    const innerMat = new THREE.MeshBasicMaterial({
      color: CONFIG.LASER_COLOR,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const inner = new THREE.Mesh(baseGeo, innerMat);
    inner.scale.set(0.018, 0.018, 1);
    group.add(inner);

    // 3. Soft Outer Halo (r ~0.06)
    const haloMat = new THREE.MeshBasicMaterial({
      color: CONFIG.LASER_COLOR,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const halo = new THREE.Mesh(baseGeo, haloMat);
    halo.scale.set(0.06, 0.06, 1);
    group.add(halo);

    // 4. Travelling Pulse Head Sprite
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulseHead = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), pulseMat);
    group.add(pulseHead);

    this.mesh.add(group);

    return {
      group,
      core,
      inner,
      halo,
      pulseHead,
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      distance: 0,
      life: 0,
      maxLife: 0.12,
    };
  }

  public fireBeam(start: THREE.Vector3, end: THREE.Vector3): void {
    const beam = this.pool.pop() || this.createBeamInstance();
    beam.start.copy(start);
    beam.end.copy(end);
    beam.distance = start.distanceTo(end);
    beam.life = 0.12;
    beam.maxLife = 0.12;

    beam.group.position.copy(start);
    beam.group.lookAt(end);
    beam.group.visible = true;

    // Scale along Z = distance
    beam.core.scale.z = beam.distance;
    beam.inner.scale.z = beam.distance;
    beam.halo.scale.z = beam.distance;

    this.activeBeams.push(beam);

    // Trigger Muzzle Flash
    this.muzzleFlashSprite.position.copy(start);
    this.muzzleFlashSprite.visible = true;
    this.muzzleFlashTimer = 0.05;
  }

  public update(dt: number): void {
    // Update Muzzle Flash
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashSprite.visible = false;
      }
    }

    // Update active beams
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      const beam = this.activeBeams[i];
      beam.life -= dt;

      if (beam.life <= 0) {
        beam.group.visible = false;
        this.activeBeams.splice(i, 1);
        this.pool.push(beam);
        continue;
      }

      const progress = 1.0 - beam.life / beam.maxLife; // 0 -> 1
      const alpha = Math.max(0, beam.life / beam.maxLife);

      // Radial decay (1 -> 0.15 ease-out)
      const radiusFactor = 1.0 - Math.pow(progress, 2) * 0.85;
      beam.core.scale.x = 0.006 * radiusFactor;
      beam.core.scale.y = 0.006 * radiusFactor;
      beam.inner.scale.x = 0.018 * radiusFactor;
      beam.inner.scale.y = 0.018 * radiusFactor;
      beam.halo.scale.x = 0.06 * radiusFactor;
      beam.halo.scale.y = 0.06 * radiusFactor;

      (beam.core.material as THREE.MeshBasicMaterial).opacity = alpha;
      (beam.inner.material as THREE.MeshBasicMaterial).opacity = 0.85 * alpha;
      (beam.halo.material as THREE.MeshBasicMaterial).opacity = 0.32 * alpha;

      // Pulse head races along beam in ~40ms
      const pulseSpeed = Math.min(1.0, progress / 0.35);
      beam.pulseHead.position.set(0, 0, beam.distance * pulseSpeed);
      beam.pulseHead.visible = pulseSpeed < 0.98;
    }
  }
}
