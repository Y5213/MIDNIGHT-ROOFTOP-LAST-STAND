import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CONFIG } from '../config';

export class LaserRifle {
  public readonly mesh: THREE.Group;
  public readonly muzzlePoint: THREE.Vector3 = new THREE.Vector3();

  // Dynamic elements
  private energyCore: THREE.Mesh;
  private energyCoreMat: THREE.MeshStandardMaterial;
  private coils: THREE.Mesh[] = [];
  private coilMats: THREE.MeshStandardMaterial[] = [];
  private focusLensMat: THREE.MeshStandardMaterial;
  private heatVentMat: THREE.MeshStandardMaterial;
  private holoTexture: THREE.CanvasTexture;
  private holoContext: CanvasRenderingContext2D;

  // Staggered coil charge animation state
  private coilTimes: number[] = [0, 0, 0, 0];
  private heat: number = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'arc7_laser_rifle';

    // 1. Materials
    const gunmetalMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      metalness: 0.92,
      roughness: 0.32,
    });

    const matteBlackMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      metalness: 0.5,
      roughness: 0.7,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a2636,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
    });

    this.energyCoreMat = new THREE.MeshStandardMaterial({
      color: CONFIG.LASER_COLOR,
      emissive: CONFIG.LASER_COLOR,
      emissiveIntensity: 3.5, // HDR glow caught by bloom
      roughness: 0.2,
    });

    this.focusLensMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: CONFIG.LASER_COLOR,
      emissiveIntensity: 4.5,
      roughness: 0.1,
    });

    this.heatVentMat = new THREE.MeshStandardMaterial({
      color: 0x1f2228,
      emissive: 0xff3300,
      emissiveIntensity: 0.0,
      roughness: 0.5,
    });

    // 2. Main Receiver (~0.085 x 0.12 x 0.36m)
    const receiver = new THREE.Mesh(
      new RoundedBoxGeometry(0.085, 0.12, 0.36, 4, 0.012),
      gunmetalMat
    );
    receiver.position.set(0, 0, 0);
    this.mesh.add(receiver);

    // Matte Black Upper Shroud
    const topShroud = new THREE.Mesh(
      new RoundedBoxGeometry(0.075, 0.03, 0.32, 3, 0.008),
      matteBlackMat
    );
    topShroud.position.set(0, 0.075, -0.01);
    this.mesh.add(topShroud);

    // Top Picatinny Rail with Cyan Ticks
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.26), gunmetalMat);
    rail.position.set(0, 0.095, -0.01);
    this.mesh.add(rail);

    // 3. Energy Cell Chamber (Glass cylinder with glowing core)
    const chamberGroup = new THREE.Group();
    chamberGroup.position.set(0, 0.02, 0.03);

    const glassCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.2, 24),
      glassMat
    );
    glassCylinder.rotation.x = Math.PI / 2;
    chamberGroup.add(glassCylinder);

    this.energyCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.18, 16),
      this.energyCoreMat
    );
    this.energyCore.rotation.x = Math.PI / 2;
    chamberGroup.add(this.energyCore);

    this.mesh.add(chamberGroup);

    // 4. Barrel: Twin Parallel Emitter Rails & 4 Capacitor Coils
    const barrelLength = 0.34;
    const barrelZ = -0.18 - barrelLength / 2;

    // Top & Bottom / Left & Right Emitter Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.95, roughness: 0.2 });
    const railLeft = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, barrelLength), railMat);
    railLeft.position.set(-0.02, 0.015, barrelZ);
    this.mesh.add(railLeft);

    const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, barrelLength), railMat);
    railRight.position.set(0.02, 0.015, barrelZ);
    this.mesh.add(railRight);

    // 4 Capacitor Coils (Torus rings staggered along barrel)
    const coilZPositions = [-0.22, -0.28, -0.34, -0.40];
    coilZPositions.forEach((zPos) => {
      const mat = new THREE.MeshStandardMaterial({
        color: CONFIG.LASER_COLOR,
        emissive: CONFIG.LASER_COLOR,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.007, 12, 24), mat);
      coil.position.set(0, 0.015, zPos);
      this.mesh.add(coil);
      this.coils.push(coil);
      this.coilMats.push(mat);
    });

    // 5. Muzzle Ring & Focus Lens
    const muzzleZ = -0.18 - barrelLength - 0.015;
    const muzzleRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.035, 0.03, 24),
      gunmetalMat
    );
    muzzleRing.rotation.x = Math.PI / 2;
    muzzleRing.position.set(0, 0.015, muzzleZ);
    this.mesh.add(muzzleRing);

    const focusLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.022, 24),
      this.focusLensMat
    );
    focusLens.position.set(0, 0.015, muzzleZ - 0.016);
    focusLens.rotation.y = Math.PI;
    this.mesh.add(focusLens);

    // World muzzle position anchor
    this.muzzlePoint.set(0, 0.015, muzzleZ - 0.02);

    // 6. Heat Vents (Top-rear cooling fins)
    for (let f = 0; f < 5; f++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.014, 0.008), this.heatVentMat);
      fin.position.set(0, 0.065, 0.08 + f * 0.022);
      this.mesh.add(fin);
    }

    // 7. Tactical Ergonomics: Pistol Grip & Angled Foregrip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.06), matteBlackMat);
    grip.position.set(0, -0.11, 0.1);
    grip.rotation.x = -0.25;
    this.mesh.add(grip);

    const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 8, 16, Math.PI), gunmetalMat);
    triggerGuard.position.set(0, -0.07, 0.05);
    triggerGuard.rotation.y = Math.PI / 2;
    this.mesh.add(triggerGuard);

    const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.05), matteBlackMat);
    foregrip.position.set(0, -0.08, -0.18);
    foregrip.rotation.x = 0.2;
    this.mesh.add(foregrip);

    // 8. Holo Ammo Readout Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    this.holoContext = canvas.getContext('2d')!;
    this.holoTexture = new THREE.CanvasTexture(canvas);

    const holoScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.055, 0.028),
      new THREE.MeshBasicMaterial({
        map: this.holoTexture,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      })
    );
    holoScreen.position.set(0.044, 0.045, -0.04);
    holoScreen.rotation.y = Math.PI / 2;
    this.mesh.add(holoScreen);

    this.updateHoloDisplay(30, 30);
  }

  public triggerCoilChargeSequence(): void {
    // 18ms stagger rear to front
    this.coilTimes[0] = 0.11;
    this.coilTimes[1] = 0.092;
    this.coilTimes[2] = 0.074;
    this.coilTimes[3] = 0.056;

    // Flash focus lens
    this.focusLensMat.emissiveIntensity = 8.0;

    // Add heat
    this.heat = Math.min(1.0, this.heat + 0.07);
  }

  public update(dt: number, ammo: number, maxAmmo: number): void {
    // 1. Coil charge-through decay
    for (let i = 0; i < 4; i++) {
      if (this.coilTimes[i] > 0) {
        this.coilTimes[i] -= dt;
        this.coilMats[i].emissiveIntensity = 1.5 + (this.coilTimes[i] / 0.11) * 4.5;
      } else {
        this.coilMats[i].emissiveIntensity = 1.5;
      }
    }

    // 2. Lens flare decay
    if (this.focusLensMat.emissiveIntensity > 4.5) {
      this.focusLensMat.emissiveIntensity = Math.max(4.5, this.focusLensMat.emissiveIntensity - dt * 25);
    }

    // 3. Heat decay
    this.heat = Math.max(0, this.heat - dt * 0.5);
    this.heatVentMat.emissiveIntensity = this.heat * 2.8;

    // 4. Energy Core Scale & Color Tracking
    const ratio = Math.max(0.05, ammo / maxAmmo);
    this.energyCore.scale.set(1, ratio, 1);

    if (ammo <= 5) {
      const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;
      this.energyCoreMat.color.setHex(pulse > 0.5 ? 0xff2200 : 0xff8800);
      this.energyCoreMat.emissive.setHex(pulse > 0.5 ? 0xff2200 : 0xff8800);
    } else {
      this.energyCoreMat.color.setHex(CONFIG.LASER_COLOR);
      this.energyCoreMat.emissive.setHex(CONFIG.LASER_COLOR);
    }
  }

  public updateHoloDisplay(ammo: number, maxAmmo: number): void {
    const ctx = this.holoContext;
    ctx.clearRect(0, 0, 128, 64);

    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, 128, 64);

    const isLow = ammo <= 5;
    ctx.fillStyle = isLow ? '#ff2a2a' : CONFIG.LASER_HEX;
    ctx.font = 'bold 28px monospace';
    ctx.fillText(ammo.toString().padStart(2, '0'), 12, 36);

    ctx.font = '9px monospace';
    ctx.fillText('ARC-7 PULSE', 60, 22);

    // Segmented bar
    const barW = 104;
    const barH = 8;
    const fillW = Math.round((ammo / maxAmmo) * barW);
    ctx.fillStyle = '#1b263a';
    ctx.fillRect(12, 46, barW, barH);

    ctx.fillStyle = isLow ? '#ff2a2a' : CONFIG.LASER_HEX;
    ctx.fillRect(12, 46, fillW, barH);

    this.holoTexture.needsUpdate = true;
  }
}
