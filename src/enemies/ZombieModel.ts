import * as THREE from 'three';
import { CONFIG } from '../config';
import { HitSphere } from './HitTest';
import { TextureFactory } from '../render/TextureFactory';

interface ZombieMaterials {
  skinMat: THREE.MeshStandardMaterial;
  faceMat: THREE.MeshStandardMaterial;
  shirtMat: THREE.MeshStandardMaterial;
  pantsMat: THREE.MeshStandardMaterial;
  bootsMat: THREE.MeshStandardMaterial;
  woundMat: THREE.MeshStandardMaterial;
  deadEyeMat: THREE.MeshStandardMaterial;
  teethMat: THREE.MeshStandardMaterial;
  beltMat: THREE.MeshStandardMaterial;
}

export class ZombieModel {
  private static materialsCache: Record<string, ZombieMaterials> = {};

  public readonly mesh: THREE.Group;
  public readonly headMesh: THREE.Group;
  public readonly leftArm: THREE.Group;
  public readonly rightArm: THREE.Group;
  public readonly leftLeg: THREE.Group;
  public readonly rightLeg: THREE.Group;

  public readonly skinMat: THREE.MeshStandardMaterial;
  public readonly faceMat: THREE.MeshStandardMaterial;
  public readonly shirtMat: THREE.MeshStandardMaterial;
  public readonly pantsMat: THREE.MeshStandardMaterial;
  public readonly bootsMat: THREE.MeshStandardMaterial;
  public readonly woundMat: THREE.MeshStandardMaterial;
  public readonly deadEyeMat: THREE.MeshStandardMaterial;
  public readonly teethMat: THREE.MeshStandardMaterial;
  public readonly beltMat: THREE.MeshStandardMaterial;

  constructor(public readonly type: 'walker' | 'runner' | 'brute') {
    this.mesh = new THREE.Group();
    this.mesh.name = `zombie_${type}`;

    const isBrute = type === 'brute';
    const isRunner = type === 'runner';

    // 1. Shared Material Cache Initialization
    if (!ZombieModel.materialsCache[type]) {
      const skinTex = TextureFactory.createZombieSkinTexture(type);
      const faceTex = TextureFactory.createZombieFaceTexture(type);
      const shirtTex = TextureFactory.createShirtTexture(type);
      const jeansTex = isBrute ? TextureFactory.createShirtTexture('brute') : TextureFactory.createJeansTexture();
      const bootsTex = TextureFactory.createBootsTexture();

      ZombieModel.materialsCache[type] = {
        skinMat: new THREE.MeshStandardMaterial({
          map: skinTex,
          color: isBrute ? 0x8a8c88 : isRunner ? 0x687866 : 0x757f72,
          roughness: 0.85,
          metalness: 0.05,
        }),
        faceMat: new THREE.MeshStandardMaterial({
          map: faceTex,
          roughness: 0.82,
          metalness: 0.05,
        }),
        shirtMat: new THREE.MeshStandardMaterial({
          map: shirtTex,
          roughness: 0.90,
          metalness: 0.05,
        }),
        pantsMat: new THREE.MeshStandardMaterial({
          map: jeansTex,
          color: isBrute ? 0x303338 : 0x485e7a, // Dark work trousers or blue denim
          roughness: 0.88,
          metalness: 0.05,
        }),
        bootsMat: new THREE.MeshStandardMaterial({
          map: bootsTex,
          roughness: 0.70,
          metalness: 0.15,
        }),
        woundMat: new THREE.MeshStandardMaterial({
          color: isBrute ? 0x581010 : 0x6e1414,
          roughness: 0.35,
          metalness: 0.05,
        }),
        deadEyeMat: new THREE.MeshStandardMaterial({
          color: 0xebf2e8,
          emissive: isBrute ? 0x222620 : 0x182018,
          roughness: 0.25,
          metalness: 0.1,
        }),
        teethMat: new THREE.MeshStandardMaterial({
          color: 0xd4c892,
          roughness: 0.6,
          metalness: 0.05,
        }),
        beltMat: new THREE.MeshStandardMaterial({
          color: 0x1e1914,
          roughness: 0.65,
          metalness: 0.2,
        }),
      };
    }

    const mats = ZombieModel.materialsCache[type];
    this.skinMat = mats.skinMat;
    this.faceMat = mats.faceMat;
    this.shirtMat = mats.shirtMat;
    this.pantsMat = mats.pantsMat;
    this.bootsMat = mats.bootsMat;
    this.woundMat = mats.woundMat;
    this.deadEyeMat = mats.deadEyeMat;
    this.teethMat = mats.teethMat;
    this.beltMat = mats.beltMat;

    // 2. Anatomical Construction
    if (isBrute) {
      // -------------------------------------------------------------
      // THE BRUTE / TANK (Image 1: Massive muscular hulking beast)
      // -------------------------------------------------------------

      // Pelvis / Hips (y = 0.88m)
      const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.28, 0.38), this.pantsMat);
      pelvis.position.set(0, 0.88, 0);
      this.mesh.add(pelvis);

      // Belt with silver buckle
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.08, 0.40), this.beltMat);
      belt.position.set(0, 0.98, 0);
      this.mesh.add(belt);

      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.03), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 }));
      buckle.position.set(0, 0.98, -0.21);
      this.mesh.add(buckle);

      // Torso: Massive Hunched Barrel Chest
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, 1.25, -0.06);
      torsoGroup.rotation.x = 0.22;

      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.62, 0.46), this.shirtMat);
      torsoGroup.add(chest);

      // Massive Trapezius muscles flanking the neck
      const trapL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.20, 0.26), this.skinMat);
      trapL.position.set(0.26, 0.32, -0.04);
      trapL.rotation.z = -0.35;
      torsoGroup.add(trapL);

      const trapR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.20, 0.26), this.skinMat);
      trapR.position.set(-0.26, 0.32, -0.04);
      trapR.rotation.z = 0.35;
      torsoGroup.add(trapR);

      // Deep chest lacerations / claw gashes
      const chestGore = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.04), this.woundMat);
      chestGore.position.set(0.04, 0.08, -0.24);
      torsoGroup.add(chestGore);

      this.mesh.add(torsoGroup);

      // Head & Neck
      this.headMesh = new THREE.Group();
      this.headMesh.position.set(0, 1.74, -0.20);
      this.headMesh.rotation.x = 0.16;

      // Thick muscular neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.20, 8), this.skinMat);
      neck.position.set(0, -0.14, 0.04);
      this.headMesh.add(neck);

      // Brutal bald skull cranium
      const headCranium = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.32), this.faceMat);
      this.headMesh.add(headCranium);

      // Heavy square snarling jaw
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.24), this.skinMat);
      jaw.position.set(0, -0.16, -0.08);
      this.headMesh.add(jaw);

      // 3D Cloudy dead milky eyes
      const eyeGeo = new THREE.SphereGeometry(0.034, 8, 8);
      const eyeL = new THREE.Mesh(eyeGeo, this.deadEyeMat);
      eyeL.position.set(0.09, 0.04, -0.17);
      this.headMesh.add(eyeL);

      const eyeR = new THREE.Mesh(eyeGeo, this.deadEyeMat);
      eyeR.position.set(-0.09, 0.04, -0.17);
      this.headMesh.add(eyeR);

      // Exposed rotting teeth in snarling mouth
      for (let t = -3; t <= 3; t++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.04, 0.02), this.teethMat);
        tooth.position.set(t * 0.032, -0.09, -0.17);
        this.headMesh.add(tooth);
      }

      this.mesh.add(this.headMesh);

      // Massive Muscular Arms (Shoulders, Biceps, Bulging Forearms, Claws)
      this.leftArm = new THREE.Group();
      this.leftArm.position.set(0.50, 1.48, -0.08);

      const deltoidL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.28), this.skinMat);
      deltoidL.position.set(0, -0.10, 0);
      this.leftArm.add(deltoidL);

      const bicepL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.24), this.skinMat);
      bicepL.position.set(0.04, -0.32, -0.08);
      bicepL.rotation.x = -0.45;
      this.leftArm.add(bicepL);

      const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.22), this.skinMat);
      forearmL.position.set(0.05, -0.55, -0.25);
      forearmL.rotation.x = -0.95;
      this.leftArm.add(forearmL);

      // Heavy clawed hand with splayed fingers
      const handL = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.12, 0.22), this.skinMat);
      handL.position.set(0.05, -0.72, -0.42);
      this.leftArm.add(handL);

      this.mesh.add(this.leftArm);

      this.rightArm = new THREE.Group();
      this.rightArm.position.set(-0.50, 1.48, -0.08);

      const deltoidR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.28), this.skinMat);
      deltoidR.position.set(0, -0.10, 0);
      this.rightArm.add(deltoidR);

      const bicepR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.24), this.skinMat);
      bicepR.position.set(-0.04, -0.32, -0.08);
      bicepR.rotation.x = -0.45;
      this.rightArm.add(bicepR);

      const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.22), this.skinMat);
      forearmR.position.set(-0.05, -0.55, -0.25);
      forearmR.rotation.x = -0.95;
      this.rightArm.add(forearmR);

      const handR = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.12, 0.22), this.skinMat);
      handR.position.set(-0.05, -0.72, -0.42);
      this.rightArm.add(handR);

      this.mesh.add(this.rightArm);

      // Heavy Muscular Legs & Combat Boots
      this.leftLeg = new THREE.Group();
      this.leftLeg.position.set(0.20, 0.88, 0);

      const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.44, 0.27), this.pantsMat);
      thighL.position.set(0, -0.22, 0);
      this.leftLeg.add(thighL);

      // Knee tear with bloody gore inset
      const kneeGoreL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.05), this.woundMat);
      kneeGoreL.position.set(0, -0.44, -0.13);
      this.leftLeg.add(kneeGoreL);

      const calfL = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.42, 0.25), this.pantsMat);
      calfL.position.set(0, -0.66, 0);
      this.leftLeg.add(calfL);

      const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.18, 0.36), this.bootsMat);
      bootL.position.set(0, -0.88, -0.06);
      this.leftLeg.add(bootL);

      this.mesh.add(this.leftLeg);

      this.rightLeg = new THREE.Group();
      this.rightLeg.position.set(-0.20, 0.88, 0);

      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.44, 0.27), this.pantsMat);
      thighR.position.set(0, -0.22, 0);
      this.rightLeg.add(thighR);

      const kneeGoreR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.05), this.woundMat);
      kneeGoreR.position.set(0, -0.44, -0.13);
      this.rightLeg.add(kneeGoreR);

      const calfR = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.42, 0.25), this.pantsMat);
      calfR.position.set(0, -0.66, 0);
      this.rightLeg.add(calfR);

      const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.18, 0.36), this.bootsMat);
      bootR.position.set(0, -0.88, -0.06);
      this.rightLeg.add(bootR);

      this.mesh.add(this.rightLeg);
    } else {
      // -------------------------------------------------------------
      // THE WALKER / RUNNER (Image 2: Classic denim jeans & open shirt)
      // -------------------------------------------------------------

      // Pelvis in Denim Jeans (y = 0.82m)
      const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.25), this.pantsMat);
      pelvis.position.set(0, 0.82, 0);
      this.mesh.add(pelvis);

      // Belt
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.06, 0.27), this.beltMat);
      belt.position.set(0, 0.91, 0);
      this.mesh.add(belt);

      // Torso: Hunched upper body with Khaki shirt open over dark undershirt
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, 1.15, -0.06);
      torsoGroup.rotation.x = isRunner ? 0.28 : 0.18;

      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.28), this.shirtMat);
      torsoGroup.add(chest);

      // 3D Shirt Collar framing the open chest
      const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.06), this.shirtMat);
      collarL.position.set(0.12, 0.22, -0.15);
      collarL.rotation.z = -0.3;
      torsoGroup.add(collarL);

      const collarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.06), this.shirtMat);
      collarR.position.set(-0.12, 0.22, -0.15);
      collarR.rotation.z = 0.3;
      torsoGroup.add(collarR);

      this.mesh.add(torsoGroup);

      // Head & Neck
      this.headMesh = new THREE.Group();
      this.headMesh.position.set(0, 1.58, -0.15);
      this.headMesh.rotation.x = 0.15;
      this.headMesh.rotation.z = isRunner ? 0.08 : -0.06;

      // Neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.18, 8), this.skinMat);
      neck.position.set(0, -0.12, 0.02);
      this.headMesh.add(neck);

      // Head Cranium with detailed face map
      const headCranium = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.24), this.faceMat);
      this.headMesh.add(headCranium);

      // Protruding snarling lower jaw
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.08, 0.16), this.skinMat);
      jaw.position.set(0, -0.12, -0.06);
      this.headMesh.add(jaw);

      // 3D Cloudy dead milky eyes
      const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const eyeL = new THREE.Mesh(eyeGeo, this.deadEyeMat);
      eyeL.position.set(0.06, 0.04, -0.13);
      this.headMesh.add(eyeL);

      const eyeR = new THREE.Mesh(eyeGeo, this.deadEyeMat);
      eyeR.position.set(-0.06, 0.04, -0.13);
      this.headMesh.add(eyeR);

      // Rotting teeth in open jaw
      for (let t = -2; t <= 2; t++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.03, 0.015), this.teethMat);
        tooth.position.set(t * 0.026, -0.07, -0.13);
        this.headMesh.add(tooth);
      }

      this.mesh.add(this.headMesh);

      // Reaching Arms (Tattered short sleeves, pale forearms, claw fingers)
      this.leftArm = new THREE.Group();
      this.leftArm.position.set(0.27, 1.34, -0.05);

      const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.14), this.shirtMat);
      sleeveL.position.set(0, -0.06, 0);
      this.leftArm.add(sleeveL);

      const bicepL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.11), this.skinMat);
      bicepL.position.set(0.02, -0.22, -0.06);
      bicepL.rotation.x = -0.55;
      this.leftArm.add(bicepL);

      const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.28, 0.10), this.skinMat);
      forearmL.position.set(0.02, -0.40, -0.20);
      forearmL.rotation.x = -1.05;
      this.leftArm.add(forearmL);

      // Extended clawed zombie fingers reaching out
      const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.15), this.skinMat);
      clawL.position.set(0.02, -0.52, -0.34);
      this.leftArm.add(clawL);

      this.mesh.add(this.leftArm);

      this.rightArm = new THREE.Group();
      this.rightArm.position.set(-0.27, 1.34, -0.05);

      const sleeveR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.14), this.shirtMat);
      sleeveR.position.set(0, -0.06, 0);
      this.rightArm.add(sleeveR);

      const bicepR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.11), this.skinMat);
      bicepR.position.set(-0.02, -0.22, -0.06);
      bicepR.rotation.x = -0.55;
      this.rightArm.add(bicepR);

      const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.28, 0.10), this.skinMat);
      forearmR.position.set(-0.02, -0.40, -0.20);
      forearmR.rotation.x = -1.05;
      this.rightArm.add(forearmR);

      const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.15), this.skinMat);
      clawR.position.set(-0.02, -0.52, -0.34);
      this.rightArm.add(clawR);

      this.mesh.add(this.rightArm);

      // Legs in Blue Jeans with Ripped Knee Holes
      this.leftLeg = new THREE.Group();
      this.leftLeg.position.set(0.13, 0.82, 0);

      const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.17), this.pantsMat);
      thighL.position.set(0, -0.18, 0);
      this.leftLeg.add(thighL);

      // Ripped knee hole showing raw deep red bloody muscle tissue
      const kneeGoreL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.04), this.woundMat);
      kneeGoreL.position.set(0, -0.36, -0.08);
      this.leftLeg.add(kneeGoreL);

      const calfL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.16), this.pantsMat);
      calfL.position.set(0, -0.56, 0);
      this.leftLeg.add(calfL);

      // Bare rotting undead foot
      const footL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), this.skinMat);
      footL.position.set(0, -0.78, -0.04);
      this.leftLeg.add(footL);

      this.mesh.add(this.leftLeg);

      this.rightLeg = new THREE.Group();
      this.rightLeg.position.set(-0.13, 0.82, 0);

      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.17), this.pantsMat);
      thighR.position.set(0, -0.18, 0);
      this.rightLeg.add(thighR);

      const kneeGoreR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.04), this.woundMat);
      kneeGoreR.position.set(0, -0.36, -0.08);
      this.rightLeg.add(kneeGoreR);

      const calfR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.16), this.pantsMat);
      calfR.position.set(0, -0.56, 0);
      this.rightLeg.add(calfR);

      const footR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), this.skinMat);
      footR.position.set(0, -0.78, -0.04);
      this.rightLeg.add(footR);

      this.mesh.add(this.rightLeg);
    }

    // Overall scale according to config
    const scale = CONFIG.ZOMBIE_TYPES[type].scale;
    this.mesh.scale.set(scale, scale, scale);
  }

  public animateWalk(time: number, speed: number): void {
    const isBrute = this.type === 'brute';
    const cycle = time * speed * (isBrute ? 3.6 : 4.8);

    // Natural stride swing
    this.leftLeg.rotation.x = Math.sin(cycle) * (isBrute ? 0.35 : 0.48);
    this.rightLeg.rotation.x = -Math.sin(cycle) * (isBrute ? 0.35 : 0.48);

    // Torso sway & aggressive arm reach
    this.leftArm.rotation.x = Math.sin(cycle + 0.3) * 0.20;
    this.rightArm.rotation.x = -Math.sin(cycle + 0.3) * 0.20;
    this.leftArm.rotation.z = Math.sin(cycle * 0.5) * 0.06;
    this.rightArm.rotation.z = -Math.sin(cycle * 0.5) * 0.06;

    // Menacing head bob
    this.headMesh.rotation.y = Math.sin(cycle * 0.5) * 0.10;
    this.mesh.rotation.z = Math.sin(cycle * 0.5) * (isBrute ? 0.03 : 0.06);
  }

  public animateAttack(progress: number): void {
    const isBrute = this.type === 'brute';
    const strike = Math.sin(progress * Math.PI);

    if (isBrute) {
      this.leftArm.rotation.x = -strike * 1.5;
      this.rightArm.rotation.x = -strike * 1.8;
      this.leftArm.rotation.z = strike * 0.35;
      this.rightArm.rotation.z = -strike * 0.35;
      this.headMesh.rotation.x = 0.18 + strike * 0.45;
    } else {
      this.leftArm.rotation.x = -strike * 1.25;
      this.rightArm.rotation.x = -strike * 1.45;
      this.leftArm.rotation.z = strike * 0.38;
      this.rightArm.rotation.z = -strike * 0.38;
      this.headMesh.rotation.x = 0.15 + strike * 0.35;
    }
  }

  public getHitSpheres(): HitSphere[] {
    const scale = this.mesh.scale.y;
    const pos = this.mesh.position;
    const isBrute = this.type === 'brute';

    if (isBrute) {
      return [
        {
          center: new THREE.Vector3(pos.x, pos.y + 1.74 * scale, pos.z - 0.20 * scale),
          radius: 0.32 * scale,
          isHead: true,
        },
        {
          center: new THREE.Vector3(pos.x, pos.y + 1.25 * scale, pos.z - 0.06 * scale),
          radius: 0.52 * scale,
          isHead: false,
        },
        {
          center: new THREE.Vector3(pos.x, pos.y + 0.88 * scale, pos.z),
          radius: 0.44 * scale,
          isHead: false,
        },
        {
          center: new THREE.Vector3(pos.x, pos.y + 0.44 * scale, pos.z),
          radius: 0.40 * scale,
          isHead: false,
        },
      ];
    }

    return [
      {
        center: new THREE.Vector3(pos.x, pos.y + 1.58 * scale, pos.z - 0.15 * scale),
        radius: 0.24 * scale,
        isHead: true,
      },
      {
        center: new THREE.Vector3(pos.x, pos.y + 1.15 * scale, pos.z - 0.06 * scale),
        radius: 0.36 * scale,
        isHead: false,
      },
      {
        center: new THREE.Vector3(pos.x, pos.y + 0.82 * scale, pos.z),
        radius: 0.32 * scale,
        isHead: false,
      },
      {
        center: new THREE.Vector3(pos.x, pos.y + 0.40 * scale, pos.z),
        radius: 0.28 * scale,
        isHead: false,
      },
    ];
  }

  public setInvisibility(invisible: boolean): void {
    this.mesh.visible = !invisible;
  }
}
