import * as THREE from 'three';
import { CONFIG } from '../config';
import { CollisionSystem } from './Colliders';
import { TextureFactory } from '../render/TextureFactory';

export class Rooftop {
  public readonly mesh: THREE.Group;

  constructor(collisions: CollisionSystem) {
    this.mesh = new THREE.Group();
    this.mesh.name = 'rooftop_environment';

    const { map, roughnessMap } = TextureFactory.createWetConcreteTexture();

    // 1. Main Roof Concrete Slab (36 x 28 m)
    const slabGeo = new THREE.BoxGeometry(CONFIG.ROOF_WIDTH, 1.0, CONFIG.ROOF_DEPTH);
    const slabMat = new THREE.MeshStandardMaterial({
      map,
      roughnessMap,
      metalness: 0.15,
      roughness: 0.75,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(0, -0.5, 0);
    slab.receiveShadow = true;
    this.mesh.add(slab);

    // 2. Parapets (1.2m high, 0.35m thick all around)
    const parapetMat = new THREE.MeshStandardMaterial({
      color: 0x181c22,
      roughness: 0.85,
      metalness: 0.2,
    });

    const halfW = CONFIG.ROOF_WIDTH / 2;
    const halfD = CONFIG.ROOF_DEPTH / 2;
    const h = CONFIG.PARAPET_HEIGHT;
    const t = CONFIG.PARAPET_THICKNESS;

    // North Parapet
    const northP = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOF_WIDTH, h, t), parapetMat);
    northP.position.set(0, h / 2, -halfD + t / 2);
    northP.castShadow = true;
    northP.receiveShadow = true;
    this.mesh.add(northP);
    collisions.addAABB(
      new THREE.Vector3(-halfW, 0, -halfD),
      new THREE.Vector3(halfW, h, -halfD + t),
      'parapet_north'
    );

    // South Parapet
    const southP = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOF_WIDTH, h, t), parapetMat);
    southP.position.set(0, h / 2, halfD - t / 2);
    southP.castShadow = true;
    southP.receiveShadow = true;
    this.mesh.add(southP);
    collisions.addAABB(
      new THREE.Vector3(-halfW, 0, halfD - t),
      new THREE.Vector3(halfW, h, halfD),
      'parapet_south'
    );

    // West Parapet
    const westP = new THREE.Mesh(new THREE.BoxGeometry(t, h, CONFIG.ROOF_DEPTH), parapetMat);
    westP.position.set(-halfW + t / 2, h / 2, 0);
    westP.castShadow = true;
    westP.receiveShadow = true;
    this.mesh.add(westP);
    collisions.addAABB(
      new THREE.Vector3(-halfW, 0, -halfD),
      new THREE.Vector3(-halfW + t, h, halfD),
      'parapet_west'
    );

    // East Parapet
    const eastP = new THREE.Mesh(new THREE.BoxGeometry(t, h, CONFIG.ROOF_DEPTH), parapetMat);
    eastP.position.set(halfW - t / 2, h / 2, 0);
    eastP.castShadow = true;
    eastP.receiveShadow = true;
    this.mesh.add(eastP);
    collisions.addAABB(
      new THREE.Vector3(halfW - t, 0, -halfD),
      new THREE.Vector3(halfW, h, halfD),
      'parapet_east'
    );

    // 3. Painted Helipad "H" Marking (Centre-South: at z = 4)
    this.createHelipadDecal();
  }

  private createHelipadDecal(): void {
    const helipadGroup = new THREE.Group();
    helipadGroup.position.set(0, 0.005, 4);

    const markMat = new THREE.MeshBasicMaterial({
      color: 0xffd000,
      transparent: true,
      opacity: 0.35,
    });

    // Yellow Ring
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.8, 48), markMat);
    ring.rotation.x = -Math.PI / 2;
    helipadGroup.add(ring);

    // Yellow "H"
    const barLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4.0), markMat);
    barLeft.rotation.x = -Math.PI / 2;
    barLeft.position.set(-1.4, 0, 0);
    helipadGroup.add(barLeft);

    const barRight = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4.0), markMat);
    barRight.rotation.x = -Math.PI / 2;
    barRight.position.set(1.4, 0, 0);
    helipadGroup.add(barRight);

    const barCross = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.5), markMat);
    barCross.rotation.x = -Math.PI / 2;
    helipadGroup.add(barCross);

    this.mesh.add(helipadGroup);
  }
}
