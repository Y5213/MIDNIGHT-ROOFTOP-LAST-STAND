import * as THREE from 'three';
import { CONFIG, ATMOSPHERES, AtmosphereType } from '../config';

export class RainSystem {
  public readonly mesh: THREE.InstancedMesh;
  public readonly splashMesh: THREE.InstancedMesh;
  private readonly rainCount: number = CONFIG.RAIN_STREAKS_DEFAULT;
  private readonly splashCount: number = 140;
  private readonly bounds = { x: 38, y: 22, z: 38 };
  private speedMultiplier: number = 1.0;

  // CPU arrays for streak positions
  private readonly dropPositions: Float32Array;
  private readonly dropSpeeds: Float32Array;
  private readonly dummy = new THREE.Object3D();

  // Splashes
  private readonly splashTimes: Float32Array;
  private readonly splashLifetimes: Float32Array;
  private readonly splashPositions: Float32Array;
  private nextSplashIdx: number = 0;

  constructor() {
    // 1. Rain Streaks (Instanced Quads - refined density and softer opacity)
    const streakGeo = new THREE.PlaneGeometry(0.012, 0.42);
    streakGeo.rotateZ(0.18); // Pre-tilt for wind slant

    const streakMat = new THREE.MeshBasicMaterial({
      color: 0x8aa8c8,
      transparent: true,
      opacity: CONFIG.RAIN_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.InstancedMesh(streakGeo, streakMat, this.rainCount);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.dropPositions = new Float32Array(this.rainCount * 3);
    this.dropSpeeds = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      this.dropPositions[i * 3 + 0] = (Math.random() - 0.5) * this.bounds.x;
      this.dropPositions[i * 3 + 1] = Math.random() * this.bounds.y;
      this.dropPositions[i * 3 + 2] = (Math.random() - 0.5) * this.bounds.z;
      this.dropSpeeds[i] = 22.0 + Math.random() * 8.0;

      this.dummy.position.set(
        this.dropPositions[i * 3 + 0],
        this.dropPositions[i * 3 + 1],
        this.dropPositions[i * 3 + 2]
      );
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    // 2. Splash rings on roof floor (Instanced Circle / Ring)
    const splashGeo = new THREE.RingGeometry(0.04, 0.16, 12);
    splashGeo.rotateX(-Math.PI / 2); // Flat on ground

    const splashMat = new THREE.MeshBasicMaterial({
      color: 0xa4c8e8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.splashMesh = new THREE.InstancedMesh(splashGeo, splashMat, this.splashCount);
    this.splashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.splashTimes = new Float32Array(this.splashCount);
    this.splashLifetimes = new Float32Array(this.splashCount);
    this.splashPositions = new Float32Array(this.splashCount * 3);

    for (let i = 0; i < this.splashCount; i++) {
      this.splashTimes[i] = 999.0; // Inactive
      this.splashLifetimes[i] = 0.25;
      this.dummy.scale.set(0, 0, 0);
      this.dummy.position.set(0, -100, 0);
      this.dummy.updateMatrix();
      this.splashMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.splashMesh.instanceMatrix.needsUpdate = true;
  }

  public setAtmosphere(type: AtmosphereType): void {
    const cfg = ATMOSPHERES[type];
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = cfg.rainOpacity;
    (this.splashMesh.material as THREE.MeshBasicMaterial).opacity = cfg.rainOpacity * 1.5;
    this.speedMultiplier = cfg.rainSpeed;
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    // 1. Move streaks with wind and wrap around player
    const windX = 3.5;
    const windZ = 0.8;

    for (let i = 0; i < this.rainCount; i++) {
      let x = this.dropPositions[i * 3 + 0];
      let y = this.dropPositions[i * 3 + 1];
      let z = this.dropPositions[i * 3 + 2];

      y -= this.dropSpeeds[i] * dt * this.speedMultiplier;
      x += windX * dt * this.speedMultiplier;
      z += windZ * dt * this.speedMultiplier;

      // Wrap vertically relative to player
      if (y < 0.0) {
        // Spawn ground splash if within rooftop bounds (~18 x 14)
        if (Math.abs(x) < 18.0 && Math.abs(z) < 14.0 && Math.random() < 0.25) {
          this.spawnSplash(x, 0.02, z);
        }
        y = this.bounds.y;
      }

      // Wrap horizontally around player position
      const relX = x - playerPos.x;
      const relZ = z - playerPos.z;
      const halfX = this.bounds.x * 0.5;
      const halfZ = this.bounds.z * 0.5;

      if (relX > halfX) x -= this.bounds.x;
      else if (relX < -halfX) x += this.bounds.x;

      if (relZ > halfZ) z -= this.bounds.z;
      else if (relZ < -halfZ) z += this.bounds.z;

      this.dropPositions[i * 3 + 0] = x;
      this.dropPositions[i * 3 + 1] = y;
      this.dropPositions[i * 3 + 2] = z;

      this.dummy.position.set(x, y, z);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    // 2. Update splashes
    for (let i = 0; i < this.splashCount; i++) {
      if (this.splashTimes[i] < this.splashLifetimes[i]) {
        this.splashTimes[i] += dt;
        const progress = this.splashTimes[i] / this.splashLifetimes[i];
        const scale = 1.0 + progress * 2.2;

        this.dummy.position.set(
          this.splashPositions[i * 3 + 0],
          this.splashPositions[i * 3 + 1],
          this.splashPositions[i * 3 + 2]
        );
        this.dummy.scale.set(scale, scale, scale);
        this.dummy.updateMatrix();
        this.splashMesh.setMatrixAt(i, this.dummy.matrix);
      } else if (this.splashTimes[i] < 900) {
        this.splashTimes[i] = 999.0;
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.splashMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }
    this.splashMesh.instanceMatrix.needsUpdate = true;
  }

  private spawnSplash(x: number, y: number, z: number): void {
    const idx = this.nextSplashIdx;
    this.nextSplashIdx = (this.nextSplashIdx + 1) % this.splashCount;

    this.splashPositions[idx * 3 + 0] = x;
    this.splashPositions[idx * 3 + 1] = y;
    this.splashPositions[idx * 3 + 2] = z;
    this.splashTimes[idx] = 0.0;
    this.splashLifetimes[idx] = 0.2 + Math.random() * 0.1;
  }
}
