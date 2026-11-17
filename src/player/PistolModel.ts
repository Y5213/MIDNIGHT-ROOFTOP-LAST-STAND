import * as THREE from 'three';

export class PistolModel {
  public readonly mesh: THREE.Group;
  public readonly muzzlePoint: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'talon9_tactical_pistol';

    // Tactical Matte Gunmetal & Polymer Materials (Clean, simple, zero emissive glow)
    const slideMat = new THREE.MeshStandardMaterial({
      color: 0x1f2329,
      metalness: 0.8,
      roughness: 0.38,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x14171b,
      metalness: 0.4,
      roughness: 0.65,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x0c0e10,
      roughness: 0.92,
      metalness: 0.1,
    });
    const sightMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.7,
      metalness: 0.1,
    });

    // 1. Slide (Clean rectangular upper frame with bevel)
    const slideGeo = new THREE.BoxGeometry(0.052, 0.058, 0.25);
    const slide = new THREE.Mesh(slideGeo, slideMat);
    slide.position.set(0, 0.03, -0.055);
    this.mesh.add(slide);

    // Ejection port cutout detail on slide
    const ejectionGeo = new THREE.BoxGeometry(0.02, 0.022, 0.05);
    const ejection = new THREE.Mesh(ejectionGeo, frameMat);
    ejection.position.set(0.02, 0.045, -0.04);
    this.mesh.add(ejection);

    // 2. Heavy Barrel (Slightly exposed at muzzle)
    const barrelGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.12, 16);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, slideMat);
    barrel.position.set(0, 0.03, -0.19);
    this.mesh.add(barrel);

    // 3. Lower Frame & Trigger Guard
    const lowerGeo = new THREE.BoxGeometry(0.048, 0.038, 0.22);
    const lower = new THREE.Mesh(lowerGeo, frameMat);
    lower.position.set(0, -0.01, -0.04);
    this.mesh.add(lower);

    // Trigger Guard
    const guardGeo = new THREE.BoxGeometry(0.014, 0.042, 0.07);
    const guard = new THREE.Mesh(guardGeo, frameMat);
    guard.position.set(0, -0.045, -0.02);
    this.mesh.add(guard);

    // 4. Ergonomic Textured Grip (Angled backward)
    const gripGeo = new THREE.BoxGeometry(0.044, 0.145, 0.065);
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.08, 0.02);
    grip.rotation.x = -0.22;
    this.mesh.add(grip);

    // 5. Tactical Low-Profile Sights (Clean white dots for precision ADS)
    const sightGeo = new THREE.BoxGeometry(0.006, 0.012, 0.008);

    const frontSight = new THREE.Mesh(sightGeo, sightMat);
    frontSight.position.set(0, 0.065, -0.17);
    this.mesh.add(frontSight);

    const rearSightL = new THREE.Mesh(sightGeo, sightMat);
    rearSightL.position.set(-0.016, 0.065, 0.06);
    this.mesh.add(rearSightL);

    const rearSightR = new THREE.Mesh(sightGeo, sightMat);
    rearSightR.position.set(0.016, 0.065, 0.06);
    this.mesh.add(rearSightR);

    // Muzzle point
    this.muzzlePoint.set(0, 0.03, -0.26);
  }
}
