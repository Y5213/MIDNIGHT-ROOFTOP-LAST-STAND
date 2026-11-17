import * as THREE from 'three';

interface SparkParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ImpactFXManager {
  public readonly mesh: THREE.Group;
  private readonly sparkPoints: THREE.Points;
  private readonly sparkPositions: Float32Array;
  private readonly sparkColors: Float32Array;
  private readonly sparks: SparkParticle[] = [];
  private readonly maxSparks: number = 256;

  private readonly flareMesh: THREE.Mesh;
  private flareTimer: number = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'laser_impact_fx';

    // 1. Impact Flare Mesh
    const flareGeo = new THREE.PlaneGeometry(0.35, 0.35);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.flareMesh = new THREE.Mesh(flareGeo, flareMat);
    this.flareMesh.visible = false;
    this.mesh.add(this.flareMesh);

    // 2. Spark Particles System
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    this.mesh.add(this.sparkPoints);
  }

  public triggerImpact(point: THREE.Vector3, normal: THREE.Vector3): void {
    // Show flare
    this.flareMesh.position.copy(point).addScaledVector(normal, 0.02);
    this.flareMesh.lookAt(point.clone().add(normal));
    this.flareMesh.visible = true;
    this.flareTimer = 0.12;

    // Spawn 14 sparks biased along surface normal
    const numSparks = 14;
    for (let i = 0; i < numSparks; i++) {
      if (this.sparks.length >= this.maxSparks) this.sparks.shift();

      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2
      );
      const vel = normal.clone().multiplyScalar(4.5 + Math.random() * 3.5).add(spread);

      this.sparks.push({
        position: point.clone(),
        velocity: vel,
        life: 0.45 + Math.random() * 0.15,
        maxLife: 0.6,
      });
    }
  }

  public update(dt: number): void {
    // Flare decay
    if (this.flareTimer > 0) {
      this.flareTimer -= dt;
      const scale = Math.max(0.01, (this.flareTimer / 0.12) * 0.35);
      this.flareMesh.scale.set(scale, scale, 1);
      if (this.flareTimer <= 0) {
        this.flareMesh.visible = false;
      }
    }

    // Sparks simulation
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;

      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }

      s.velocity.y -= 9.8 * dt; // Gravity
      s.position.addScaledVector(s.velocity, dt);

      const idx = i * 3;
      this.sparkPositions[idx] = s.position.x;
      this.sparkPositions[idx + 1] = s.position.y;
      this.sparkPositions[idx + 2] = s.position.z;

      // Color shifts White -> Cyan -> Dim
      const alpha = s.life / s.maxLife;
      this.sparkColors[idx] = alpha > 0.5 ? 1.0 : 0.0;
      this.sparkColors[idx + 1] = alpha * 0.9;
      this.sparkColors[idx + 2] = 1.0;
    }

    // Zero out unused points
    for (let i = this.sparks.length; i < this.maxSparks; i++) {
      const idx = i * 3;
      this.sparkPositions[idx] = 0;
      this.sparkPositions[idx + 1] = -999;
      this.sparkPositions[idx + 2] = 0;
    }

    this.sparkPoints.geometry.attributes.position.needsUpdate = true;
    this.sparkPoints.geometry.attributes.color.needsUpdate = true;
  }
}
