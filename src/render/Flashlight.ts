import * as THREE from 'three';

export class VolumetricFlashlight {
  public readonly group: THREE.Group;
  private readonly coneMesh: THREE.Mesh;
  private readonly dustPoints: THREE.Points;
  private readonly dustPositions: Float32Array;
  private readonly dustVelocities: Float32Array;
  private readonly coneMaterial: THREE.ShaderMaterial;
  private isEnabled: boolean = true;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'volumetric_flashlight';

    // 1. Open-ended cone geometry pointing along -Z
    // Length 25m, radius 4.5m at base
    const coneLength = 26.0;
    const coneRadius = 4.2;
    const segments = 32;

    const coneGeo = new THREE.CylinderGeometry(0.08, coneRadius, coneLength, segments, 1, true);
    // Cylinder is along Y by default. Rotate so apex is at origin and points down -Z
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, -coneLength / 2);

    this.coneMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(0xa8c4dc) },
        uIntensity: { value: 0.025 },
        uLength: { value: coneLength },
      },
      vertexShader: /* glsl */ `
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        varying float vDepthProgress;

        uniform float uLength;

        void main() {
          vDepthProgress = clamp(-position.z / uLength, 0.0, 1.0);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vec4 mvPosition = viewMatrix * worldPos;
          vViewPosition = mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        varying float vDepthProgress;

        uniform vec3 uColor;
        uniform float uIntensity;

        void main() {
          // Soft longitudinal falloff: bright near source, fades smoothly along length
          float longitudinalFade = pow(1.0 - vDepthProgress, 1.8);
          // Soft apex fade so it doesn't hard-clip at the flashlight lens
          float apexFade = smoothstep(0.0, 0.08, vDepthProgress);

          // View normal rim / grazing angle fade
          float alpha = uIntensity * longitudinalFade * apexFade;

          gl_FragColor = vec4(uColor * 0.8, alpha);
        }
      `,
    });

    this.coneMesh = new THREE.Mesh(coneGeo, this.coneMaterial);
    this.group.add(this.coneMesh);

    // 2. Dust Motes (~200 particles floating inside the cone)
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(dustCount * 3);
    this.dustVelocities = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const z = -(Math.random() * 18 + 0.5);
      const spread = (-z / coneLength) * (coneRadius * 0.85);
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * spread;

      this.dustPositions[i * 3 + 0] = Math.cos(angle) * r;
      this.dustPositions[i * 3 + 1] = Math.sin(angle) * r;
      this.dustPositions[i * 3 + 2] = z;

      this.dustVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.15;
      this.dustVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
      this.dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

    // Circular dust sprite texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.4, 'rgba(210, 235, 255, 0.5)');
    grad.addColorStop(1, 'rgba(210, 235, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const dustTexture = new THREE.CanvasTexture(canvas);

    const dustMat = new THREE.PointsMaterial({
      size: 0.12,
      map: dustTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xdae9ff,
      opacity: 0.6,
    });

    this.dustPoints = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.dustPoints);
  }

  public setVisible(visible: boolean): void {
    this.isEnabled = visible;
    this.group.visible = visible;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    this.group.visible = this.isEnabled;
    return this.isEnabled;
  }

  public update(dt: number, time: number): void {
    if (!this.isEnabled) return;

    // Subtle breathing pulse in light dust
    const posAttr = this.dustPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const count = arr.length / 3;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] += this.dustVelocities[i * 3 + 0] * dt;
      arr[i * 3 + 1] += (this.dustVelocities[i * 3 + 1] + Math.sin(time + i) * 0.05) * dt;
      arr[i * 3 + 2] += this.dustVelocities[i * 3 + 2] * dt;

      // Wrap if drifted out of bounds
      if (arr[i * 3 + 2] < -24.0) arr[i * 3 + 2] = -0.6;
      if (arr[i * 3 + 2] > -0.5) arr[i * 3 + 2] = -23.0;
    }

    posAttr.needsUpdate = true;
  }
}
