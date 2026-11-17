import * as THREE from 'three';
import { CONFIG } from '../config';
import { TextureFactory } from '../render/TextureFactory';
import { GateInfo } from './Bulkhead';
import { CollisionSystem, AABB } from './Colliders';
import { SfxManager } from '../audio/Sfx';

export interface PlankSlot {
  mesh: THREE.Mesh;
  hp: number;
  maxHp: number;
  initialY: number;
  initialRotZ: number;
  isBroken: boolean;
}

export class Barricade {
  public readonly group: THREE.Group;
  public readonly planks: PlankSlot[] = [];
  private doorwayCollider: AABB | null = null;
  private plankTexture: THREE.CanvasTexture;

  constructor(
    public readonly gate: GateInfo,
    private readonly collisions: CollisionSystem,
    private readonly sfx: SfxManager
  ) {
    this.group = new THREE.Group();
    this.group.name = `barricade_${gate.id}`;
    this.group.position.copy(gate.doorCenter);

    // Orient to gate forward
    if (gate.id === 'east') this.group.rotation.y = -Math.PI / 2;
    if (gate.id === 'west') this.group.rotation.y = Math.PI / 2;

    this.plankTexture = TextureFactory.createWoodPlankTexture();

    // Create 6 horizontal planks across the 2.4 x 2.4m doorway
    const count = CONFIG.PLANKS_PER_GATE; // 6
    const slotHeight = CONFIG.DOORWAY_HEIGHT / count; // 0.4m

    for (let i = 0; i < count; i++) {
      const y = i * slotHeight + slotHeight / 2 - CONFIG.DOORWAY_HEIGHT / 2;
      const rotZ = (Math.random() - 0.5) * 0.05;

      const geo = new THREE.BoxGeometry(
        CONFIG.PLANK_WIDTH,
        CONFIG.PLANK_HEIGHT,
        CONFIG.PLANK_THICKNESS
      );
      const mat = new THREE.MeshStandardMaterial({
        map: this.plankTexture,
        roughness: 0.8,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, y, 0);
      mesh.rotation.z = rotZ;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.group.add(mesh);

      this.planks.push({
        mesh,
        hp: CONFIG.PLANK_HP,
        maxHp: CONFIG.PLANK_HP,
        initialY: y,
        initialRotZ: rotZ,
        isBroken: false,
      });
    }

    // Add doorway solid collider blocking passage while planks exist
    this.updateDoorwayCollider();
  }

  public getActivePlankCount(): number {
    return this.planks.filter((p) => !p.isBroken).length;
  }

  public getIntegrityPercentage(): number {
    const totalMax = this.planks.length * CONFIG.PLANK_HP;
    const current = this.planks.reduce((sum, p) => sum + (p.isBroken ? 0 : p.hp), 0);
    return (current / totalMax) * 100;
  }

  public damageLowestPlank(amount: number): boolean {
    // Attack lowest active plank first
    const target = this.planks.find((p) => !p.isBroken);
    if (!target) return false;

    target.hp -= amount;

    // Visual damage states: tilt and darken
    if (target.hp <= target.maxHp * 0.33) {
      target.mesh.rotation.z = target.initialRotZ + (Math.random() > 0.5 ? 0.18 : -0.18);
      (target.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x2a1e16);
    } else if (target.hp <= target.maxHp * 0.66) {
      target.mesh.rotation.z = target.initialRotZ + (Math.random() > 0.5 ? 0.08 : -0.08);
      (target.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x3d2b1f);
    }

    if (target.hp <= 0) {
      target.hp = 0;
      target.isBroken = true;
      target.mesh.visible = false;
      this.sfx.playPlankBreak();
      this.updateDoorwayCollider();
    } else {
      this.sfx.playPlankHit();
    }

    return true;
  }

  public repairOneSlot(): boolean {
    // 1. Rebuild lowest broken plank if any
    const broken = this.planks.find((p) => p.isBroken);
    if (broken) {
      broken.isBroken = false;
      broken.hp = broken.maxHp;
      broken.mesh.visible = true;
      broken.mesh.rotation.z = broken.initialRotZ;
      (broken.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
      this.updateDoorwayCollider();
      this.sfx.playRepair();
      return true;
    }

    // 2. Otherwise heal the most damaged plank
    let mostDamaged: PlankSlot | null = null;
    let lowestHp: number = CONFIG.PLANK_HP;
    for (const p of this.planks) {
      if (!p.isBroken && p.hp < lowestHp) {
        lowestHp = p.hp;
        mostDamaged = p;
      }
    }

    if (mostDamaged && mostDamaged.hp < mostDamaged.maxHp) {
      mostDamaged.hp = mostDamaged.maxHp;
      mostDamaged.mesh.rotation.z = mostDamaged.initialRotZ;
      (mostDamaged.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
      this.sfx.playRepair();
      return true;
    }

    return false;
  }

  private updateDoorwayCollider(): void {
    const hasPlanks = this.getActivePlankCount() > 0;
    if (hasPlanks && !this.doorwayCollider) {
      // Create AABB in world space
      const box = new THREE.Box3().setFromObject(this.group);
      this.doorwayCollider = this.collisions.addAABB(box.min, box.max, `gate_${this.gate.id}`);
    } else if (!hasPlanks && this.doorwayCollider) {
      this.collisions.removeAABB(this.doorwayCollider);
      this.doorwayCollider = null;
    }
  }
}
