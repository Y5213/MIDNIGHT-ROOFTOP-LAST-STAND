import * as THREE from 'three';
import { CONFIG } from '../config';

export class ShurikenModel {
  public static createMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'cyber_shuriken';

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x2b313a,
      metalness: 0.95,
      roughness: 0.18,
    });

    const edgeMat = new THREE.MeshStandardMaterial({
      color: CONFIG.LASER_COLOR,
      emissive: CONFIG.LASER_COLOR,
      emissiveIntensity: 4.0,
      roughness: 0.1,
    });

    // 1. Center Disc (radius 0.04m, thickness 0.012m)
    const discGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.012, 16);
    discGeo.rotateX(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, metalMat);
    group.add(disc);

    // Center Core Glow
    const coreGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.014, 12);
    coreGeo.rotateX(Math.PI / 2);
    const core = new THREE.Mesh(coreGeo, edgeMat);
    group.add(core);

    // 2. 4 Tapered Razor Blades
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const bladeGeo = new THREE.ConeGeometry(0.035, 0.14, 4);
      bladeGeo.rotateZ(Math.PI / 2);
      bladeGeo.translate(0.09, 0, 0);

      const blade = new THREE.Mesh(bladeGeo, metalMat);
      blade.rotation.z = angle;
      group.add(blade);

      // Glowing cutting edge
      const tipGeo = new THREE.ConeGeometry(0.015, 0.05, 4);
      tipGeo.rotateZ(Math.PI / 2);
      tipGeo.translate(0.14, 0, 0);

      const tip = new THREE.Mesh(tipGeo, edgeMat);
      tip.rotation.z = angle;
      group.add(tip);
    }

    return group;
  }
}

export interface FlyingShuriken {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
}
