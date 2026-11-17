import * as THREE from 'three';
import { CONFIG } from '../config';
import { ZombieModel } from './ZombieModel';
import { Barricade } from '../world/Barricade';
import { Player } from '../player/Player';
import { CollisionSystem } from '../world/Colliders';

export type ZombieState =
  | 'SPAWN'
  | 'APPROACH_GATE'
  | 'ATTACK_GATE'
  | 'BREACH'
  | 'CHASE_PLAYER'
  | 'ATTACK_PLAYER'
  | 'DISINTEGRATING';

export class Zombie {
  public state: ZombieState = 'SPAWN';
  public hp: number;
  public maxHp: number;
  public speed: number;
  public damage: number;
  public attackInterval: number;
  public plankDamage: number;
  public plankAttackInterval: number;

  private attackCooldown: number = 0;
  private plankCooldown: number = 0;
  private disintegrateTimer: number = 0;
  private targetGate: Barricade | null = null;
  public isAlive: boolean = true;
  public isInvisibleDizzy: boolean = false;

  constructor(
    public readonly model: ZombieModel,
    public readonly type: 'walker' | 'runner' | 'brute'
  ) {
    const cfg = CONFIG.ZOMBIE_TYPES[type];
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.attackInterval = cfg.attackInterval;
    this.plankDamage = cfg.plankDamage;
    this.plankAttackInterval = cfg.plankAttackInterval;
  }

  public spawn(pos: THREE.Vector3, gate: Barricade, speedMult: number = 1.0): void {
    this.state = 'SPAWN';
    this.targetGate = gate;
    this.isAlive = true;
    this.isInvisibleDizzy = false;
    this.hp = this.maxHp;
    this.speed = CONFIG.ZOMBIE_TYPES[this.type].speed * speedMult;
    this.model.mesh.position.copy(pos);
    this.model.setInvisibility(false);
    this.model.mesh.visible = true;
    this.model.mesh.scale.setScalar(CONFIG.ZOMBIE_TYPES[this.type].scale);
  }

  public update(dt: number, time: number, player: Player, collisions: CollisionSystem): void {
    if (!this.isAlive) return;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.plankCooldown > 0) this.plankCooldown -= dt;

    if (this.state === 'DISINTEGRATING') {
      if (this.isInvisibleDizzy) {
        this.isInvisibleDizzy = false;
        this.model.setInvisibility(false);
      }
      this.disintegrateTimer -= dt;
      const progress = 1.0 - this.disintegrateTimer / CONFIG.ZOMBIE_DISINTEGRATE_TIME;
      const scale = (1.0 - progress) * CONFIG.ZOMBIE_TYPES[this.type].scale;
      this.model.mesh.scale.setScalar(Math.max(0.001, scale));

      if (this.disintegrateTimer <= 0) {
        this.isAlive = false;
        this.model.mesh.visible = false;
      }
      return;
    }

    const pos = this.model.mesh.position;

    // Perceptual Invisibility Distortion when player is dizzy (concussion / trauma / low HP)
    if (player.isDizzy && this.state !== 'SPAWN') {
      const spatialSeed = ((pos.x * 5.3 + pos.z * 11.7) % 3.0 + 3.0) % 3.0;
      const cycle = (time * 1.6 + spatialSeed) % 3.0;
      // Invisibility window active during ~1.3s of the 3.0s cycle
      const shouldCloak = cycle < 1.3 && player.dizzinessLevel > 0.15;
      if (shouldCloak !== this.isInvisibleDizzy) {
        this.isInvisibleDizzy = shouldCloak;
        this.model.setInvisibility(shouldCloak);
      }
    } else if (this.isInvisibleDizzy) {
      this.isInvisibleDizzy = false;
      this.model.setInvisibility(false);
    }

    // AI State Transitions
    if (this.state === 'SPAWN' || this.state === 'APPROACH_GATE') {
      if (!this.targetGate) {
        this.state = 'CHASE_PLAYER';
        return;
      }

      const doorPos = this.targetGate.gate.doorCenter;
      const distToDoor = pos.distanceTo(doorPos);

      if (distToDoor > 1.2) {
        // Move toward door
        const dir = doorPos.clone().sub(pos).normalize();
        pos.x += dir.x * this.speed * dt;
        pos.z += dir.z * this.speed * dt;
        this.model.mesh.lookAt(doorPos.x, pos.y, doorPos.z);
        this.model.animateWalk(time, this.speed);
      } else {
        // At the gate
        if (this.targetGate.getActivePlankCount() > 0) {
          this.state = 'ATTACK_GATE';
        } else {
          this.state = 'BREACH';
        }
      }
    } else if (this.state === 'ATTACK_GATE') {
      if (!this.targetGate || this.targetGate.getActivePlankCount() === 0) {
        this.state = 'BREACH';
        return;
      }

      // Attack barricade plank with claw swipe animation
      const attackProgress = Math.min(1.0, 1.0 - (this.plankCooldown / this.plankAttackInterval));
      this.model.animateAttack(attackProgress);

      if (this.plankCooldown <= 0) {
        this.targetGate.damageLowestPlank(this.plankDamage);
        this.plankCooldown = this.plankAttackInterval;
      }
    } else if (this.state === 'BREACH') {
      // Step through doorway onto roof
      const forward = this.targetGate!.gate.forward;
      pos.x += forward.x * this.speed * dt;
      pos.z += forward.z * this.speed * dt;

      const doorPos = this.targetGate!.gate.doorCenter;
      if (pos.distanceTo(doorPos) > 2.0) {
        this.state = 'CHASE_PLAYER';
      }
    } else if (this.state === 'CHASE_PLAYER') {
      const distToPlayer = pos.distanceTo(player.position);

      if (distToPlayer <= CONFIG.ZOMBIE_ATTACK_DIST) {
        this.state = 'ATTACK_PLAYER';
      } else {
        // Steer toward player
        const dir = player.position.clone().sub(pos).normalize();
        pos.x += dir.x * this.speed * dt;
        pos.z += dir.z * this.speed * dt;

        // Slide against static AABBs
        collisions.resolveCircle(pos, 0.4);

        this.model.mesh.lookAt(player.position.x, pos.y, player.position.z);
        this.model.animateWalk(time, this.speed);
      }
    } else if (this.state === 'ATTACK_PLAYER') {
      const distToPlayer = pos.distanceTo(player.position);
      if (distToPlayer > CONFIG.ZOMBIE_ATTACK_BREAKOFF) {
        this.state = 'CHASE_PLAYER';
      } else {
        this.model.mesh.lookAt(player.position.x, pos.y, player.position.z);
        const attackProgress = Math.min(1.0, 1.0 - (this.attackCooldown / this.attackInterval));
        this.model.animateAttack(attackProgress);

        // Flash visible on forward claw strike for terrifying jump-scare
        if (this.isInvisibleDizzy && attackProgress > 0.35) {
          this.isInvisibleDizzy = false;
          this.model.setInvisibility(false);
        }

        if (this.attackCooldown <= 0) {
          player.takeDamage(this.damage);
          this.attackCooldown = this.attackInterval;
        }
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.state === 'DISINTEGRATING' || !this.isAlive) return false;

    // Bullet/laser impact reveals cloaked zombie
    if (this.isInvisibleDizzy) {
      this.isInvisibleDizzy = false;
      this.model.setInvisibility(false);
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.state = 'DISINTEGRATING';
      this.disintegrateTimer = CONFIG.ZOMBIE_DISINTEGRATE_TIME;
      return true; // Killed
    }
    return false;
  }
}
