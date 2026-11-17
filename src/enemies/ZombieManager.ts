import * as THREE from 'three';
import { CONFIG } from '../config';
import { Zombie } from './Zombie';
import { ZombieModel } from './ZombieModel';
import { HitTest } from './HitTest';
import { Barricade } from '../world/Barricade';
import { Player } from '../player/Player';
import { CollisionSystem } from '../world/Colliders';

export class ZombieManager {
  public readonly mesh: THREE.Group;
  public readonly zombies: Zombie[] = [];
  public totalKills: number = 0;
  public totalHeadshots: number = 0;
  public speedMultiplier: number = 1.0;

  constructor(worldScene: THREE.Scene) {
    this.mesh = new THREE.Group();
    this.mesh.name = 'zombie_horde_manager';
    worldScene.add(this.mesh);

    // Pre-allocate pool of 40 zombies (30 walkers, 8 runners, 2 brutes)
    for (let i = 0; i < 30; i++) this.createZombie('walker');
    for (let i = 0; i < 8; i++) this.createZombie('runner');
    for (let i = 0; i < 2; i++) this.createZombie('brute');
  }

  private createZombie(type: 'walker' | 'runner' | 'brute'): Zombie {
    const model = new ZombieModel(type);
    model.mesh.visible = false;
    this.mesh.add(model.mesh);

    const zombie = new Zombie(model, type);
    zombie.isAlive = false;
    this.zombies.push(zombie);
    return zombie;
  }

  public getAliveCount(): number {
    return this.zombies.filter((z) => z.isAlive).length;
  }

  public spawn(type: 'walker' | 'runner' | 'brute', gate: Barricade): boolean {
    const count = this.getAliveCount();
    if (count >= CONFIG.MAX_ZOMBIES_ALIVE) return false;

    // Find pooled inactive zombie of this type
    const candidate = this.zombies.find((z) => !z.isAlive && z.type === type);
    if (!candidate) return false;

    // Add small random jitter inside spawn bulkhead
    const spawnPos = gate.gate.spawnPoint.clone().add(
      new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5)
    );

    candidate.spawn(spawnPos, gate, this.speedMultiplier);
    return true;
  }

  public killAll(): void {
    for (const z of this.zombies) {
      if (z.isAlive) {
        z.takeDamage(9999);
      }
    }
  }

  public raycastZombies(
    ray: THREE.Ray,
    maxDistance: number
  ): { zombie: Zombie; hitPoint: THREE.Vector3; isHeadshot: boolean } | null {
    let closestDist = maxDistance;
    let hitZombie: Zombie | null = null;
    let hitPoint: THREE.Vector3 | null = null;
    let isHeadshot = false;

    for (const z of this.zombies) {
      if (!z.isAlive || z.state === 'DISINTEGRATING') continue;

      const spheres = z.model.getHitSpheres();
      const res = HitTest.testZombie(ray, spheres, closestDist);
      if (res && res.distance < closestDist) {
        closestDist = res.distance;
        hitZombie = z;
        hitPoint = res.hitPoint;
        isHeadshot = res.isHeadshot;
      }
    }

    if (hitZombie && hitPoint) {
      return { zombie: hitZombie, hitPoint, isHeadshot };
    }
    return null;
  }

  public update(dt: number, time: number, player: Player, collisions: CollisionSystem): void {
    for (const z of this.zombies) {
      if (z.isAlive) {
        z.update(dt, time, player, collisions);
      }
    }
  }
}
