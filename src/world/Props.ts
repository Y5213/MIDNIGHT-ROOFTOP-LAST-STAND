import * as THREE from 'three';
import { CollisionSystem } from './Colliders';

export class RooftopProps {
  public readonly mesh: THREE.Group;
  private beaconLight: THREE.PointLight | null = null;
  private beaconMesh: THREE.Mesh | null = null;

  constructor(collisions: CollisionSystem) {
    this.mesh = new THREE.Group();
    this.mesh.name = 'rooftop_props';

    // 1. Water Tower (at x = -10, z = -7)
    this.createWaterTower(new THREE.Vector3(-10, 0, -7), collisions);

    // 2. Rooftop AC Units (at x = 8, z = -6 and x = -6, z = 7)
    this.createACUnit(new THREE.Vector3(8, 0, -6), collisions);
    this.createACUnit(new THREE.Vector3(-6, 0, 7), collisions);

    // 3. Wooden Crate Stack & Fuel Drums (Cover near helipad, at x = 7, z = 5)
    this.createCoverStack(new THREE.Vector3(7, 0, 5), collisions);

    // 4. Radio Antenna Mast with Blinking Beacon (at x = -13, z = 10)
    this.createAntennaMast(new THREE.Vector3(-13, 0, 10), collisions);

    // 5. Climbable Vantage Points (Stepped Crates & Sniper Deck)
    this.createClimbableVantagePoint(new THREE.Vector3(11, 0, -1), collisions);
    this.createClimbableVantagePoint(new THREE.Vector3(-11, 0, 3), collisions);
  }

  private createWaterTower(pos: THREE.Vector3, collisions: CollisionSystem): void {
    const group = new THREE.Group();
    group.position.copy(pos);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x3a404a,
      metalness: 0.85,
      roughness: 0.4,
    });
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      metalness: 0.9,
      roughness: 0.5,
    });

    // 4 Angled Legs (3.5m high)
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 12);
    const legPositions = [
      [-1.1, 1.75, -1.1],
      [1.1, 1.75, -1.1],
      [-1.1, 1.75, 1.1],
      [1.1, 1.75, 1.1],
    ];
    for (const [lx, ly, lz] of legPositions) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      group.add(leg);
    }

    // Wooden/Metal Tank (radius 1.6m, height 2.4m)
    const tankGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.4, 24);
    const tank = new THREE.Mesh(tankGeo, metalMat);
    tank.position.set(0, 3.5 + 1.2, 0);
    tank.castShadow = true;
    group.add(tank);

    // Conical Roof
    const roofGeo = new THREE.ConeGeometry(1.75, 0.9, 24);
    const roof = new THREE.Mesh(roofGeo, metalMat);
    roof.position.set(0, 3.5 + 2.4 + 0.45, 0);
    roof.castShadow = true;
    group.add(roof);

    this.mesh.add(group);

    // Collider covers legs base
    collisions.addAABB(
      new THREE.Vector3(pos.x - 1.4, 0, pos.z - 1.4),
      new THREE.Vector3(pos.x + 1.4, 6.0, pos.z + 1.4),
      'prop_watertower'
    );
  }

  private createACUnit(pos: THREE.Vector3, collisions: CollisionSystem): void {
    const geo = new THREE.BoxGeometry(2.4, 1.4, 1.5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x22262e,
      metalness: 0.75,
      roughness: 0.45,
    });
    const ac = new THREE.Mesh(geo, mat);
    ac.position.set(pos.x, 0.7, pos.z);
    ac.castShadow = true;
    ac.receiveShadow = true;

    // Fan exhaust ring on top
    const fanGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, metalness: 0.9, roughness: 0.3 });
    const fan = new THREE.Mesh(fanGeo, fanMat);
    fan.position.set(0, 0.75, 0);
    ac.add(fan);

    this.mesh.add(ac);

    collisions.addAABB(
      new THREE.Vector3(pos.x - 1.25, 0, pos.z - 0.8),
      new THREE.Vector3(pos.x + 1.25, 1.5, pos.z + 0.8),
      'prop_ac_unit'
    );
  }

  private createCoverStack(pos: THREE.Vector3, collisions: CollisionSystem): void {
    const group = new THREE.Group();
    group.position.copy(pos);

    const crateMat = new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 0.8, metalness: 0.1 });
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x1f3448, roughness: 0.35, metalness: 0.85 });

    // 2 Crates
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), crateMat);
    c1.position.set(0, 0.5, 0);
    c1.castShadow = true;
    group.add(c1);

    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), crateMat);
    c2.position.set(0.85, 0.45, 0.2);
    c2.rotation.y = 0.2;
    c2.castShadow = true;
    group.add(c2);

    // 2 Fuel Drums
    const drumGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.95, 18);
    const d1 = new THREE.Mesh(drumGeo, drumMat);
    d1.position.set(-0.7, 0.475, 0.3);
    d1.castShadow = true;
    group.add(d1);

    const d2 = new THREE.Mesh(drumGeo, drumMat);
    d2.position.set(-0.6, 0.475, -0.4);
    d2.castShadow = true;
    group.add(d2);

    this.mesh.add(group);

    collisions.addAABB(
      new THREE.Vector3(pos.x - 1.2, 0, pos.z - 0.9),
      new THREE.Vector3(pos.x + 1.5, 1.1, pos.z + 0.9),
      'prop_cover_stack'
    );
  }

  private createAntennaMast(pos: THREE.Vector3, collisions: CollisionSystem): void {
    const group = new THREE.Group();
    group.position.copy(pos);

    const mastGeo = new THREE.CylinderGeometry(0.04, 0.12, 9.0, 12);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x8a929e, metalness: 0.9, roughness: 0.3 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 4.5, 0);
    mast.castShadow = true;
    group.add(mast);

    // Red blinking beacon at top (y = 9.0)
    const beaconGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconMesh.position.set(0, 9.0, 0);
    group.add(this.beaconMesh);

    this.beaconLight = new THREE.PointLight(0xff0022, 1.5, 12);
    this.beaconLight.position.set(0, 9.0, 0);
    group.add(this.beaconLight);

    this.mesh.add(group);

    collisions.addAABB(
      new THREE.Vector3(pos.x - 0.4, 0, pos.z - 0.4),
      new THREE.Vector3(pos.x + 0.4, 9.0, pos.z + 0.4),
      'prop_antenna'
    );
  }

  private createClimbableVantagePoint(pos: THREE.Vector3, collisions: CollisionSystem): void {
    const group = new THREE.Group();
    group.position.copy(pos);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4d3826, roughness: 0.85, metalness: 0.1 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x272c35, roughness: 0.4, metalness: 0.8 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3, metalness: 0.8 });

    // Step 1: Low Crate (Height = 0.6m)
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.0), woodMat);
    step1.position.set(0, 0.3, 1.6);
    step1.castShadow = true;
    step1.receiveShadow = true;
    group.add(step1);
    collisions.addAABB(
      new THREE.Vector3(pos.x - 0.6, 0, pos.z + 1.1),
      new THREE.Vector3(pos.x + 0.6, 0.6, pos.z + 2.1),
      'climb_step1'
    );

    // Step 2: Mid Crate (Height = 1.2m)
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 1.1), woodMat);
    step2.position.set(0, 0.6, 0.65);
    step2.castShadow = true;
    step2.receiveShadow = true;
    group.add(step2);
    collisions.addAABB(
      new THREE.Vector3(pos.x - 0.65, 0, pos.z + 0.1),
      new THREE.Vector3(pos.x + 0.65, 1.2, pos.z + 1.2),
      'climb_step2'
    );

    // Step 3: High Platform Deck (Height = 1.8m)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.0), metalMat);
    deck.position.set(0, 0.9, -0.8);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Safety guard railing on platform
    const railPostGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
    const rail1 = new THREE.Mesh(railPostGeo, railMat);
    rail1.position.set(-1.15, 2.1, -1.75);
    group.add(rail1);

    const rail2 = new THREE.Mesh(railPostGeo, railMat);
    rail2.position.set(1.15, 2.1, -1.75);
    group.add(rail2);

    this.mesh.add(group);

    collisions.addAABB(
      new THREE.Vector3(pos.x - 1.2, 0, pos.z - 1.8),
      new THREE.Vector3(pos.x + 1.2, 1.8, pos.z + 0.2),
      'climb_platform'
    );
  }

  public update(time: number): void {
    // Pulse red aviation beacon every 1.2s
    if (this.beaconLight && this.beaconMesh) {
      const pulse = Math.sin(time * 5.0) > 0.3 ? 1.8 : 0.1;
      this.beaconLight.intensity = pulse;
      (this.beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(pulse > 1.0 ? 0xff0022 : 0x440008);
    }
  }
}
