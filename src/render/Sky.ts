import * as THREE from 'three';
import { TextureFactory } from './TextureFactory';
import { ATMOSPHERES, AtmosphereType } from '../config';

export class SkyManager {
  public readonly mesh: THREE.Group;
  private readonly skyDomeMat: THREE.ShaderMaterial;
  private readonly celestialMesh: THREE.Mesh;
  private readonly celestialMat: THREE.MeshBasicMaterial;
  private buildingsMesh: THREE.InstancedMesh | null = null;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'sky_and_city';

    // 1. Procedural Gradient Sky Dome
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;

      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;

    this.skyDomeMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        topColor: { value: new THREE.Color(0x04060c) },
        bottomColor: { value: new THREE.Color(0x0c1426) }, // City horizon glow
        offset: { value: 33 },
        exponent: { value: 0.6 },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });

    const skyGeo = new THREE.SphereGeometry(300, 32, 16);
    const skyDome = new THREE.Mesh(skyGeo, this.skyDomeMat);
    this.mesh.add(skyDome);

    // 2. Celestial Body (Moon in Midnight / Sun in Sunset & Sunrise)
    const celestialGeo = new THREE.CircleGeometry(12, 32);
    this.celestialMat = new THREE.MeshBasicMaterial({
      color: 0xd8eeff,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.celestialMesh = new THREE.Mesh(celestialGeo, this.celestialMat);
    this.celestialMesh.position.set(120, 150, -180);
    this.celestialMesh.lookAt(0, 0, 0);
    this.mesh.add(this.celestialMesh);

    // 3. 70 Distant City Buildings with lit windows
    this.createDistantSkyline();
  }

  private createDistantSkyline(): void {
    const count = 72;
    const windowTex = TextureFactory.createCityWindowsTexture();

    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e16,
      map: windowTex,
      roughness: 0.8,
      metalness: 0.3,
    });

    this.buildingsMesh = new THREE.InstancedMesh(buildingGeo, buildingMat, count);
    const dummy = new THREE.Object3D();

    const radius = 95;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
      const dist = radius + (Math.random() - 0.5) * 35;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const width = 14 + Math.random() * 20;
      const height = 40 + Math.random() * 110;
      const depth = 14 + Math.random() * 20;

      dummy.position.set(x, height / 2 - 40, z);
      dummy.scale.set(width, height, depth);
      dummy.rotation.y = angle + Math.PI / 2;
      dummy.updateMatrix();

      this.buildingsMesh.setMatrixAt(i, dummy.matrix);
    }

    this.buildingsMesh.instanceMatrix.needsUpdate = true;
    this.mesh.add(this.buildingsMesh);
  }

  public setAtmosphere(type: AtmosphereType): void {
    const cfg = ATMOSPHERES[type];
    this.skyDomeMat.uniforms.topColor.value.setHex(cfg.skyTop);
    this.skyDomeMat.uniforms.bottomColor.value.setHex(cfg.skyBottom);
    this.skyDomeMat.uniforms.exponent.value = cfg.skyExponent;

    this.celestialMat.color.setHex(cfg.celestialColor);
    this.celestialMesh.position.set(cfg.celestialPos[0], cfg.celestialPos[1], cfg.celestialPos[2]);
    this.celestialMesh.scale.setScalar(cfg.celestialScale);
    this.celestialMesh.lookAt(0, 0, 0);
  }

  public setDawnFactor(factor: number): void {
    // Smooth transition from dark midnight (factor = 0) to dawn rescue (factor = 1)
    const bottom = new THREE.Color(0x0c1426).lerp(new THREE.Color(0xff6a3d), factor);
    const top = new THREE.Color(0x04060c).lerp(new THREE.Color(0x405580), factor);
    this.skyDomeMat.uniforms.bottomColor.value.copy(bottom);
    this.skyDomeMat.uniforms.topColor.value.copy(top);
  }
}
