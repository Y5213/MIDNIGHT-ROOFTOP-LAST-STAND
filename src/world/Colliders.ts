import * as THREE from 'three';

export interface AABB {
  min: THREE.Vector3;
  max: THREE.Vector3;
  tag?: string;
}

export class CollisionSystem {
  public readonly colliders: AABB[] = [];

  public addAABB(min: THREE.Vector3, max: THREE.Vector3, tag?: string): AABB {
    const box: AABB = { min, max, tag };
    this.colliders.push(box);
    return box;
  }

  public removeAABB(box: AABB): void {
    const idx = this.colliders.indexOf(box);
    if (idx !== -1) this.colliders.splice(idx, 1);
  }

  /**
   * Resolves player circle position in XZ against static AABBs.
   * If player is standing above or clearing the box vertically, ignores XZ blocking.
   */
  public resolveCircle(pos: THREE.Vector3, radius: number): void {
    for (const box of this.colliders) {
      // Check vertical overlap: player feet at pos.y, head at pos.y + 1.8
      if (pos.y >= box.max.y - 0.08 || pos.y + 1.7 <= box.min.y) {
        continue;
      }

      const closestX = Math.max(box.min.x, Math.min(pos.x, box.max.x));
      const closestZ = Math.max(box.min.z, Math.min(pos.z, box.max.z));

      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius && distSq > 0.000001) {
        const dist = Math.sqrt(distSq);
        const overlap = radius - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
      } else if (distSq === 0) {
        const left = pos.x - box.min.x;
        const right = box.max.x - pos.x;
        const top = pos.z - box.min.z;
        const bottom = box.max.z - pos.z;
        const minOverlap = Math.min(left, right, top, bottom);

        if (minOverlap === left) pos.x = box.min.x - radius;
        else if (minOverlap === right) pos.x = box.max.x + radius;
        else if (minOverlap === top) pos.z = box.min.z - radius;
        else pos.z = box.max.z + radius;
      }
    }
  }

  /**
   * Returns the height of the solid surface under the player at (x, z).
   * Returns -999 if the player is stepping out into the void over the terrace edge.
   */
  public getGroundHeight(x: number, z: number, currentY: number): number {
    let floorY = -999.0;

    // 1. Concrete Roof Slab: 36m x 28m (x: -18 to +18, z: -14 to +14)
    if (Math.abs(x) <= 18.0 && Math.abs(z) <= 14.0) {
      floorY = 0.0;
    }

    // 2. Stairwell Bulkhead Floors (North, East, West) so zombies and player have solid ground inside sheds
    // North Bulkhead: x in [-2.6, 2.6], z in [-17.5, -13.8]
    if (Math.abs(x) <= 2.6 && z <= -13.8 && z >= -17.5) {
      floorY = 0.0;
    }
    // East Bulkhead: x in [17.8, 21.5], z in [1.4, 6.6]
    if (x >= 17.8 && x <= 21.5 && z >= 1.4 && z <= 6.6) {
      floorY = 0.0;
    }
    // West Bulkhead: x in [-21.5, -17.8], z in [1.4, 6.6]
    if (x <= -17.8 && x >= -21.5 && z >= 1.4 && z <= 6.6) {
      floorY = 0.0;
    }

    // 3. Climbable tops of props, crates, and AC units
    for (const box of this.colliders) {
      if (x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z) {
        // If player is at or above the surface (or stepping up)
        if (currentY >= box.max.y - 0.45 && box.max.y > floorY) {
          floorY = box.max.y;
        }
      }
    }

    return floorY;
  }

  /**
   * Fast ray-AABB hit test
   */
  public raycast(ray: THREE.Ray, maxDistance: number): { distance: number; point: THREE.Vector3; normal: THREE.Vector3 } | null {
    let closestDist = maxDistance;
    let hitPoint: THREE.Vector3 | null = null;
    let hitNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

    const box = new THREE.Box3();
    const point = new THREE.Vector3();

    for (const c of this.colliders) {
      box.set(c.min, c.max);
      if (ray.intersectBox(box, point)) {
        const d = ray.origin.distanceTo(point);
        if (d < closestDist) {
          closestDist = d;
          hitPoint = point.clone();

          // Approximate surface normal from AABB face
          const eps = 0.05;
          if (Math.abs(point.x - box.min.x) < eps) hitNormal.set(-1, 0, 0);
          else if (Math.abs(point.x - box.max.x) < eps) hitNormal.set(1, 0, 0);
          else if (Math.abs(point.y - box.min.y) < eps) hitNormal.set(0, -1, 0);
          else if (Math.abs(point.y - box.max.y) < eps) hitNormal.set(0, 1, 0);
          else if (Math.abs(point.z - box.min.z) < eps) hitNormal.set(0, 0, -1);
          else hitNormal.set(0, 0, 1);
        }
      }
    }

    if (hitPoint) {
      return { distance: closestDist, point: hitPoint, normal: hitNormal };
    }
    return null;
  }
}
