import * as THREE from 'three';
import { CONFIG } from '../config';
import { Player } from './Player';
import { WeaponController } from './WeaponController';
import { SfxManager } from '../audio/Sfx';
import { ShurikenModel } from './ShurikenModel';

export type PickupType = 'ammo' | 'shuriken' | 'health' | 'scrap';

interface Pickup {
  object: THREE.Object3D;
  type: PickupType;
  life: number;
}

export class PickupManager {
  public readonly mesh: THREE.Group;
  private readonly pickups: Pickup[] = [];
  public scrapCount: number = CONFIG.START_SCRAP;
  public onCollectNotification?: (text: string, color: string) => void;

  constructor(worldScene: THREE.Scene, private readonly sfx?: SfxManager) {
    this.mesh = new THREE.Group();
    this.mesh.name = 'pickups_layer';
    worldScene.add(this.mesh);
  }

  public spawnDrop(pos: THREE.Vector3): void {
    const roll = Math.random();
    if (roll < CONFIG.DROP_CHANCE_AMMO) {
      this.createPickup('ammo', pos);
    } else if (roll < CONFIG.DROP_CHANCE_AMMO + CONFIG.DROP_CHANCE_SHURIKEN) {
      this.createPickup('shuriken', pos);
    } else if (roll < CONFIG.DROP_CHANCE_AMMO + CONFIG.DROP_CHANCE_SHURIKEN + CONFIG.DROP_CHANCE_HEALTH) {
      this.createPickup('health', pos);
    } else {
      this.createPickup('scrap', pos);
    }
  }

  private createPickup(type: PickupType, pos: THREE.Vector3): void {
    let obj: THREE.Object3D;

    if (type === 'ammo') {
      // Glowing Cyan Plasma Cell
      const geo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: CONFIG.LASER_COLOR,
        emissive: CONFIG.LASER_COLOR,
        emissiveIntensity: 2.8,
        metalness: 0.8,
        roughness: 0.2,
      });
      obj = new THREE.Mesh(geo, mat);
    } else if (type === 'shuriken') {
      // Spinning Mini Cyber-Shuriken
      const star = ShurikenModel.createMesh();
      star.scale.setScalar(0.45);
      obj = star;
    } else if (type === 'health') {
      // Emerald Green Nanite Medkit Cross
      const group = new THREE.Group();
      const crossMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 3.0,
        metalness: 0.6,
        roughness: 0.25,
      });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), crossMat);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.08), crossMat);
      group.add(b1, b2);
      obj = group;
    } else {
      // Amber Salvaged Metal Scrap
      const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 2.2,
        metalness: 0.9,
        roughness: 0.3,
      });
      obj = new THREE.Mesh(geo, mat);
    }

    obj.position.set(pos.x, 0.28, pos.z);
    this.mesh.add(obj);

    this.pickups.push({
      object: obj,
      type,
      life: CONFIG.PICKUP_DESPAWN_TIME,
    });
  }

  public update(dt: number, time: number, player: Player, weapon: WeaponController): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.mesh.remove(p.object);
        this.pickups.splice(i, 1);
        continue;
      }

      // Bobbing & Rotation
      if (p.type === 'shuriken') {
        p.object.rotation.z += 6.0 * dt;
        p.object.rotation.y += 3.0 * dt;
      } else {
        p.object.rotation.y += 2.2 * dt;
      }
      p.object.position.y = 0.28 + Math.sin(time * 3.5 + i) * 0.08;

      // Magnetic Attraction toward Player
      const dist = p.object.position.distanceTo(player.position);
      if (dist < CONFIG.PICKUP_MAGNET_DIST) {
        p.object.position.lerp(player.position, 8.5 * dt);

        if (dist < 0.65) {
          // Collected by Player!
          if (p.type === 'ammo') {
            weapon.spareCells = Math.min(8, weapon.spareCells + 1);
            weapon.sparePistolMags = Math.min(8, weapon.sparePistolMags + 1);
            this.sfx?.playPickup();
            this.onCollectNotification?.('+AMMO RESUPPLY (RIFLE & PISTOL)', CONFIG.LASER_HEX);
          } else if (p.type === 'shuriken') {
            weapon.shurikenCount = Math.min(CONFIG.SHURIKEN_CAPACITY, weapon.shurikenCount + 2);
            this.sfx?.playShurikenCatch();
            this.onCollectNotification?.('+2 CYBER-SHURIKENS', '#00e5ff');
          } else if (p.type === 'health') {
            player.heal(CONFIG.MEDKIT_HEAL);
            this.sfx?.playMedkit();
            this.onCollectNotification?.(`+${CONFIG.MEDKIT_HEAL} HEALTH RESTORED`, '#00ff88');
          } else {
            this.scrapCount++;
            this.sfx?.playPickup();
            this.onCollectNotification?.('+1 SALVAGED SCRAP', '#ffaa00');
          }

          this.mesh.remove(p.object);
          this.pickups.splice(i, 1);
        }
      }
    }
  }
}
