import * as THREE from 'three';

export interface HitSphere {
  center: THREE.Vector3;
  radius: number;
  isHead: boolean;
}

export interface RayHitResult {
  hit: boolean;
  distance: number;
  isHeadshot: boolean;
  hitPoint: THREE.Vector3;
}

export class HitTest {
  /**
   * Analytic ray vs sphere intersection test
   */
  public static intersectRaySphere(
    rayOrigin: THREE.Vector3,
    rayDir: THREE.Vector3,
    sphereCenter: THREE.Vector3,
    sphereRadius: number
  ): number | null {
    const oc = rayOrigin.clone().sub(sphereCenter);
    const b = oc.dot(rayDir);
    const c = oc.dot(oc) - sphereRadius * sphereRadius;
    const discriminant = b * b - c;

    if (discriminant < 0) return null;

    const t = -b - Math.sqrt(discriminant);
    if (t > 0) return t;

    const t2 = -b + Math.sqrt(discriminant);
    if (t2 > 0) return t2;

    return null;
  }

  public static testZombie(
    ray: THREE.Ray,
    spheres: HitSphere[],
    maxDistance: number
  ): RayHitResult | null {
    let closestDist = maxDistance;
    let headshot = false;

    for (const s of spheres) {
      const d = HitTest.intersectRaySphere(ray.origin, ray.direction, s.center, s.radius);
      if (d !== null && d < closestDist) {
        closestDist = d;
        headshot = s.isHead;
      }
    }

    if (closestDist < maxDistance) {
      const hitPoint = ray.origin.clone().addScaledVector(ray.direction, closestDist);
      return {
        hit: true,
        distance: closestDist,
        isHeadshot: headshot,
        hitPoint,
      };
    }

    return null;
  }
}
