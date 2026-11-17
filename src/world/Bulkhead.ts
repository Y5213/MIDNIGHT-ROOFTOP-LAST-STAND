import * as THREE from 'three';
import { CONFIG } from '../config';
import { CollisionSystem } from './Colliders';

export interface GateInfo {
  id: 'north' | 'east' | 'west';
  name: string;
  doorCenter: THREE.Vector3;
  spawnPoint: THREE.Vector3;
  forward: THREE.Vector3;
}

export class BulkheadManager {
  public readonly mesh: THREE.Group;
  public readonly gates: GateInfo[] = [];

  constructor(collisions: CollisionSystem) {
    this.mesh = new THREE.Group();
    this.mesh.name = 'bulkhead_assembly';

    // 1. North Bulkhead: centered at x = 0, z = -14; door faces +Z
    this.createBulkhead(
      'north',
      'NORTH BULKHEAD',
      new THREE.Vector3(0, 0, -14 - CONFIG.BULKHEAD_DEPTH / 2),
      0, // rotation Y
      new THREE.Vector3(0, 0, 1),
      collisions
    );

    // 2. East Bulkhead: centered at x = 18 + depth/2, z = 4; door faces -X
    this.createBulkhead(
      'east',
      'EAST BULKHEAD',
      new THREE.Vector3(18 + CONFIG.BULKHEAD_DEPTH / 2, 0, 4),
      -Math.PI / 2, // rotation Y
      new THREE.Vector3(-1, 0, 0),
      collisions
    );

    // 3. West Bulkhead: centered at x = -18 - depth/2, z = 4; door faces +X
    this.createBulkhead(
      'west',
      'WEST BULKHEAD',
      new THREE.Vector3(-18 - CONFIG.BULKHEAD_DEPTH / 2, 0, 4),
      Math.PI / 2, // rotation Y
      new THREE.Vector3(1, 0, 0),
      collisions
    );
  }

  private createBulkhead(
    id: 'north' | 'east' | 'west',
    name: string,
    center: THREE.Vector3,
    rotY: number,
    forward: THREE.Vector3,
    collisions: CollisionSystem
  ): void {
    const group = new THREE.Group();
    group.position.copy(center);
    group.rotation.y = rotY;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x12151b,
      roughness: 0.88,
      metalness: 0.1,
    });

    const W = CONFIG.BULKHEAD_WIDTH; // 5.0
    const H = CONFIG.BULKHEAD_HEIGHT; // 3.2
    const D = CONFIG.BULKHEAD_DEPTH; // 3.0
    const doorW = CONFIG.DOORWAY_WIDTH; // 2.4
    const doorH = CONFIG.DOORWAY_HEIGHT; // 2.4
    const sideW = (W - doorW) / 2; // 1.3 on each side
    const headerH = H - doorH; // 0.8 above door
    const wallT = 0.35;

    // A. Left front jamb wall
    const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(sideW, doorH, wallT), wallMat);
    leftJamb.position.set(-W / 2 + sideW / 2, doorH / 2, D / 2 - wallT / 2);
    leftJamb.castShadow = true;
    leftJamb.receiveShadow = true;
    group.add(leftJamb);

    // B. Right front jamb wall
    const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(sideW, doorH, wallT), wallMat);
    rightJamb.position.set(W / 2 - sideW / 2, doorH / 2, D / 2 - wallT / 2);
    rightJamb.castShadow = true;
    rightJamb.receiveShadow = true;
    group.add(rightJamb);

    // C. Header wall above doorway
    const headerWall = new THREE.Mesh(new THREE.BoxGeometry(W, headerH, wallT), wallMat);
    headerWall.position.set(0, doorH + headerH / 2, D / 2 - wallT / 2);
    headerWall.castShadow = true;
    headerWall.receiveShadow = true;
    group.add(headerWall);

    // D. Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, wallT), wallMat);
    backWall.position.set(0, H / 2, -D / 2 + wallT / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    // E. Left side wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, H, D), wallMat);
    leftWall.position.set(-W / 2 + wallT / 2, H / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    // F. Right side wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, H, D), wallMat);
    rightWall.position.set(W / 2 - wallT / 2, H / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // G. Roof slab
    const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.3, D + 0.3), wallMat);
    roof.position.set(0, H + 0.15, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    // H. Concrete Floor Slab under stairwell shed (walkable ground for zombies and player)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.25, D), wallMat);
    floor.position.set(0, -0.125, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // I. Interior moody emergency stairwell bulb
    const interiorLight = new THREE.PointLight(0xff2200, 2.5, 7.0);
    interiorLight.position.set(0, H - 0.5, -D * 0.2);
    group.add(interiorLight);

    const lampMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff3300 })
    );
    lampMesh.position.copy(interiorLight.position);
    group.add(lampMesh);

    this.mesh.add(group);

    // Calculate door world center and zombie spawn point inside
    const doorLocal = new THREE.Vector3(0, doorH / 2, D / 2);
    const doorWorld = doorLocal.clone().applyEuler(new THREE.Euler(0, rotY, 0)).add(center);

    const spawnLocal = new THREE.Vector3(0, 0, -D * 0.25);
    const spawnWorld = spawnLocal.clone().applyEuler(new THREE.Euler(0, rotY, 0)).add(center);

    this.gates.push({
      id,
      name,
      doorCenter: doorWorld,
      spawnPoint: spawnWorld,
      forward,
    });

    // Add AABB collision volumes in world space for INDIVIDUAL WALLS
    // DO NOT use a single bounding box for the entire group, as that blocks the doorway!
    const addMeshAABB = (m: THREE.Mesh, tag: string) => {
      m.updateWorldMatrix(true, false);
      const b = new THREE.Box3().setFromObject(m);
      collisions.addAABB(b.min, b.max, tag);
    };

    addMeshAABB(leftJamb, `bulkhead_${id}_leftJamb`);
    addMeshAABB(rightJamb, `bulkhead_${id}_rightJamb`);
    addMeshAABB(leftWall, `bulkhead_${id}_leftWall`);
    addMeshAABB(rightWall, `bulkhead_${id}_rightWall`);
    addMeshAABB(backWall, `bulkhead_${id}_backWall`);
  }
}
