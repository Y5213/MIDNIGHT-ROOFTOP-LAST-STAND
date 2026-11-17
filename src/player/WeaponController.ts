import * as THREE from 'three';
import { CONFIG } from '../config';
import { LaserRifle } from './LaserRifle';
import { PistolModel } from './PistolModel';
import { ShurikenModel, FlyingShuriken } from './ShurikenModel';
import { BeamFXManager } from './BeamFX';
import { ImpactFXManager } from './ImpactFX';
import { SfxManager } from '../audio/Sfx';
import { LightingManager } from '../render/Lighting';
import { CollisionSystem } from '../world/Colliders';
import { InputManager } from '../core/Input';
import { Player } from './Player';
import { ZombieManager } from '../enemies/ZombieManager';
import { PickupManager } from './Pickups';
import { DamageNumberManager } from '../ui/DamageNumbers';

export class WeaponController {
  // Weapon Slots: 1 = ARC-7 Rifle, 2 = Talon-9 Pistol, 3 = Cyber-Shuriken
  public currentSlot: 1 | 2 | 3 = 1;

  // Ammo States
  public ammo: number = CONFIG.CELL_CAPACITY;
  public spareCells: number = CONFIG.START_SPARE_CELLS;
  public pistolAmmo: number = CONFIG.PISTOL_MAG_CAPACITY;
  public sparePistolMags: number = 4;
  public shurikenCount: number = CONFIG.SHURIKEN_CAPACITY;

  public isReloading: boolean = false;
  private reloadTimer: number = 0;
  private fireTimer: number = 0;
  private hadMouseDown: boolean = false; // For semi-auto pistol

  // Recoil physics
  private recoilZ: number = 0;
  private recoilZVel: number = 0;
  private recoilPitch: number = 0;
  private recoilPitchVel: number = 0;
  public cameraKickPitch: number = 0;
  private cameraKickVel: number = 0;

  // Viewmodel Sway
  private swayX: number = 0;
  private swayY: number = 0;

  // Inspect Animation
  public isInspecting: boolean = false;
  private inspectTimer: number = 0;
  private inspectDuration: number = 2.2;
  private playedCatchSound: boolean = false;

  // Active models
  public readonly rifle: LaserRifle;
  public readonly pistol: PistolModel;
  public readonly shurikenViewmodel: THREE.Group;
  private readonly flyingShurikens: FlyingShuriken[] = [];

  constructor(
    rifle: LaserRifle,
    private readonly beamFX: BeamFXManager,
    private readonly impactFX: ImpactFXManager,
    private readonly sfx: SfxManager,
    private readonly lighting: LightingManager,
    private readonly collisions: CollisionSystem,
    private readonly zombies: ZombieManager,
    private readonly pickups: PickupManager,
    private readonly input: InputManager,
    private readonly player: Player,
    private readonly camera: THREE.PerspectiveCamera,
    weaponScene: THREE.Scene,
    private readonly worldScene: THREE.Scene,
    private readonly damageNumbers: DamageNumberManager
  ) {
    this.rifle = rifle;
    this.pistol = new PistolModel();
    this.shurikenViewmodel = ShurikenModel.createMesh();

    weaponScene.add(this.rifle.mesh);
    weaponScene.add(this.pistol.mesh);
    weaponScene.add(this.shurikenViewmodel);

    this.updateActiveWeaponVisibility();

    // Wheel Weapon Switcher
    window.addEventListener('wheel', (e) => {
      if (this.isReloading) return;
      if (e.deltaY > 0) {
        const next = this.currentSlot === 3 ? 1 : ((this.currentSlot + 1) as 1 | 2 | 3);
        this.selectSlot(next);
      } else if (e.deltaY < 0) {
        const prev = this.currentSlot === 1 ? 3 : ((this.currentSlot - 1) as 1 | 2 | 3);
        this.selectSlot(prev);
      }
    });
  }

  public startInspect(): void {
    if (this.isReloading || this.player.isSprinting || this.isInspecting) return;
    this.isInspecting = true;
    this.inspectDuration = this.currentSlot === 3 ? CONFIG.INSPECT_TIME_SHURIKEN : CONFIG.INSPECT_TIME_GUN;
    this.inspectTimer = this.inspectDuration;
    this.playedCatchSound = false;

    if (this.currentSlot === 3) {
      this.sfx.playShurikenThrow();
    } else {
      this.sfx.playInspectRustle();
    }
  }

  public cancelInspect(): void {
    this.isInspecting = false;
    this.inspectTimer = 0;
  }

  public selectSlot(slot: 1 | 2 | 3): void {
    if (this.currentSlot === slot || this.isReloading) return;
    this.currentSlot = slot;
    this.updateActiveWeaponVisibility();
    this.sfx.playFootstep(); // Subtle equip click
  }

  private updateActiveWeaponVisibility(): void {
    this.rifle.mesh.visible = this.currentSlot === 1;
    this.pistol.mesh.visible = this.currentSlot === 2;
    this.shurikenViewmodel.visible = this.currentSlot === 3;

    if (this.currentSlot === 1) {
      this.rifle.updateHoloDisplay(this.ammo, CONFIG.CELL_CAPACITY);
    }
  }

  public update(dt: number): void {
    if (this.fireTimer > 0) this.fireTimer -= dt;

    // Slot Hotkeys
    if (this.input.isKeyDown('Digit1')) this.selectSlot(1);
    if (this.input.isKeyDown('Digit2')) this.selectSlot(2);
    if (this.input.isKeyDown('Digit3')) this.selectSlot(3);

    // Inspect Key (T or I)
    if (this.input.isKeyDown('KeyT') || this.input.isKeyDown('KeyI')) {
      this.startInspect();
    }

    // Inspect State Update
    if (this.isInspecting) {
      this.inspectTimer -= dt;
      if (this.inspectTimer <= 0) {
        this.isInspecting = false;
      }
      if (this.player.isAiming || this.player.isSprinting || this.isReloading) {
        this.cancelInspect();
      }
    }

    // 1. Reloading logic
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        if (this.currentSlot === 1) {
          this.ammo = CONFIG.CELL_CAPACITY;
          this.rifle.updateHoloDisplay(this.ammo, CONFIG.CELL_CAPACITY);
        } else if (this.currentSlot === 2) {
          this.pistolAmmo = CONFIG.PISTOL_MAG_CAPACITY;
        }
      }
    } else if (this.input.isKeyDown('KeyR')) {
      if (this.currentSlot === 1 && this.ammo < CONFIG.CELL_CAPACITY && this.spareCells > 0) {
        this.startReload();
      } else if (this.currentSlot === 2 && this.pistolAmmo < CONFIG.PISTOL_MAG_CAPACITY && this.sparePistolMags > 0) {
        this.startReload();
      }
    }

    // 2. Firing Logic
    const isMouseDown = this.input.isMouseDown;
    const isLmbTrigger = isMouseDown && !this.hadMouseDown;

    if (!this.isReloading && !this.player.isSprinting) {
      if (this.currentSlot === 1) {
        // Full Auto Laser Rifle
        if (isMouseDown) {
          if (this.ammo > 0 && this.fireTimer <= 0) {
            this.shootRifle();
          } else if (this.ammo === 0 && this.fireTimer <= 0) {
            this.sfx.playDryFire();
            this.fireTimer = 0.25;
          }
        }
      } else if (this.currentSlot === 2) {
        // Semi-Auto Heavy Pistol (click per shot)
        if (isLmbTrigger) {
          if (this.pistolAmmo > 0 && this.fireTimer <= 0) {
            this.shootPistol();
          } else if (this.pistolAmmo === 0) {
            this.sfx.playDryFire();
          }
        }
      } else if (this.currentSlot === 3) {
        // Throwable Shuriken
        if (isLmbTrigger && this.shurikenCount > 0 && this.fireTimer <= 0) {
          this.throwShuriken();
        }
      }
    }
    this.hadMouseDown = isMouseDown;

    // 3. Recoil Spring-Mass-Damper
    const k = CONFIG.RECOIL_K;
    const c = CONFIG.RECOIL_C;
    const m = CONFIG.RECOIL_M;

    const accelZ = (-k * this.recoilZ - c * this.recoilZVel) / m;
    this.recoilZVel += accelZ * dt;
    this.recoilZ += this.recoilZVel * dt;

    const accelPitch = (-k * this.recoilPitch - c * this.recoilPitchVel) / m;
    this.recoilPitchVel += accelPitch * dt;
    this.recoilPitch += this.recoilPitchVel * dt;

    const accelCam = (-k * 0.8 * this.cameraKickPitch - c * 1.2 * this.cameraKickVel) / m;
    this.cameraKickVel += accelCam * dt;
    this.cameraKickPitch += this.cameraKickVel * dt;

    // 4. Sway Inertia
    const { dx, dy } = { dx: this.input.mouseDeltaX, dy: this.input.mouseDeltaY };
    this.swayX = THREE.MathUtils.lerp(this.swayX, -dx * 0.0004, dt * 10);
    this.swayY = THREE.MathUtils.lerp(this.swayY, dy * 0.0004, dt * 10);

    // 5. Position Active Viewmodel (with ADS transition)
    this.updateViewmodelTransform(dt);

    // 6. Update Projectiles & Subsystems
    this.updateFlyingShurikens(dt);
    this.beamFX.update(dt);
    this.impactFX.update(dt);
    this.damageNumbers.update(dt, this.camera);
  }

  private updateViewmodelTransform(dt: number): void {
    const ads = this.player.adsProgress;

    // Base Hip vs ADS placements
    let hipPos: THREE.Vector3;
    let adsPos: THREE.Vector3;
    let activeMesh: THREE.Object3D;

    if (this.currentSlot === 1) {
      hipPos = new THREE.Vector3(0.20, -0.19, -0.42);
      adsPos = new THREE.Vector3(0.00, -0.155, -0.34);
      activeMesh = this.rifle.mesh;
      this.rifle.update(dt, this.ammo, CONFIG.CELL_CAPACITY);
    } else if (this.currentSlot === 2) {
      hipPos = new THREE.Vector3(0.18, -0.18, -0.36);
      adsPos = new THREE.Vector3(0.00, -0.115, -0.28);
      activeMesh = this.pistol.mesh;
    } else {
      hipPos = new THREE.Vector3(0.22, -0.20, -0.38);
      adsPos = new THREE.Vector3(0.08, -0.16, -0.35);
      activeMesh = this.shurikenViewmodel;
      this.shurikenViewmodel.rotation.z += dt * 3.0; // Idle slow spin in hand
    }

    const localPos = hipPos.clone().lerp(adsPos, ads);
    localPos.x += this.swayX * (1.0 - ads * 0.7);
    localPos.y += this.swayY * (1.0 - ads * 0.7);
    localPos.z += this.recoilZ;

    if (this.player.isSprinting) {
      localPos.y -= 0.12;
      localPos.z -= 0.08;
    }

    if (this.isReloading) {
      const reloadTime = this.currentSlot === 1 ? CONFIG.RELOAD_TIME : CONFIG.PISTOL_RELOAD_TIME;
      const reloadProgress = 1.0 - this.reloadTimer / reloadTime;
      const tilt = Math.sin(reloadProgress * Math.PI) * 0.35;
      localPos.y -= tilt * 0.3;
      localPos.x -= tilt * 0.2;
    }

    // Inspect Animation Positioning & Rotation
    let inspectRoll = 0;
    let inspectYaw = 0;
    let inspectPitch = 0;

    if (this.isInspecting) {
      const p = 1.0 - this.inspectTimer / this.inspectDuration;
      const s = Math.sin(p * Math.PI);

      if (this.currentSlot === 3) {
        // Ninja star inspect: tossed up in air, spins rapidly, arcs down and caught!
        localPos.y += s * 0.32;
        localPos.z -= s * 0.12;
        localPos.x -= s * 0.04;
        this.shurikenViewmodel.rotation.z += dt * 36.0;
        this.shurikenViewmodel.rotation.x += dt * 14.0;

        if (p > 0.88 && !this.playedCatchSound) {
          this.playedCatchSound = true;
          this.sfx.playShurikenCatch();
        }
      } else {
        // Firearms: tilt sideways to inspect ejection port, chamber, and sights
        localPos.x -= s * 0.08;
        localPos.y += s * 0.04;
        localPos.z += s * 0.05;
        inspectRoll = s * 0.70;
        inspectYaw = s * 0.38;
        inspectPitch = -s * 0.20;
      }
    }

    const worldPos = localPos.applyQuaternion(this.camera.quaternion).add(this.camera.position);
    activeMesh.position.copy(worldPos);
    activeMesh.quaternion.copy(this.camera.quaternion);
    activeMesh.rotateX(this.recoilPitch + (this.player.isSprinting ? 0.35 : 0) + inspectPitch);
    activeMesh.rotateY(this.swayX * 1.5 + inspectYaw);
    if (this.isReloading) activeMesh.rotateZ(-0.4);
    if (inspectRoll !== 0) activeMesh.rotateZ(inspectRoll);
  }

  // --- SLOT 1: ARC-7 PULSE LASER ---
  private shootRifle(): void {
    this.cancelInspect();
    this.ammo--;
    this.fireTimer = 1.0 / CONFIG.ROF;
    this.rifle.updateHoloDisplay(this.ammo, CONFIG.CELL_CAPACITY);
    this.sfx.playLaserShot();
    this.rifle.triggerCoilChargeSequence();

    this.recoilZVel += CONFIG.RECOIL_IMPULSE_Z;
    this.recoilPitchVel += CONFIG.RECOIL_IMPULSE_PITCH;
    this.cameraKickVel += CONFIG.CAMERA_KICK_IMPULSE;

    this.lighting.muzzleLightWorld.intensity = 4.5;
    this.lighting.muzzleLightWeapon.intensity = 5.0;

    const spread = this.player.isAiming
      ? CONFIG.SPREAD_ADS
      : this.player.isMoving
      ? CONFIG.SPREAD_MOVING
      : CONFIG.SPREAD_REST;

    this.executeHitscanShot(CONFIG.DAMAGE_BODY, CONFIG.DAMAGE_HEAD_MULT, spread, true);
  }

  // --- SLOT 2: TALON-9 HEAVY PLASMA PISTOL ---
  private shootPistol(): void {
    this.cancelInspect();
    this.pistolAmmo--;
    this.fireTimer = 1.0 / CONFIG.PISTOL_ROF;
    this.sfx.playPistolShot();

    this.recoilZVel += 0.8;
    this.recoilPitchVel += 0.5;
    this.cameraKickVel += 0.18;

    this.lighting.muzzleLightWorld.intensity = 3.5;
    this.lighting.muzzleLightWeapon.intensity = 4.0;

    const spread = this.player.isAiming ? 0.0004 : 0.002;
    this.executeHitscanShot(CONFIG.PISTOL_DAMAGE, CONFIG.PISTOL_HEAD_MULT, spread, true);
  }

  private executeHitscanShot(
    baseDamage: number,
    headMult: number,
    spread: number,
    spawnBeam: boolean
  ): void {
    const ray = new THREE.Ray();
    ray.origin.copy(this.camera.position);

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    const spreadAngle = (Math.random() - 0.5) * spread;
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
    ray.direction.copy(forward).normalize();

    // Dynamically calculate muzzle position based on hip vs ADS progress!
    const ads = this.player.adsProgress;
    let localMuzzle: THREE.Vector3;
    if (this.currentSlot === 1) {
      // Rifle muzzle moves directly to center (0.00) in ADS
      localMuzzle = new THREE.Vector3(
        0.20 * (1.0 - ads),
        -0.175 + ads * 0.02,
        -0.72 + ads * 0.04
      );
    } else {
      // Pistol muzzle moves directly to center (0.00) in ADS
      localMuzzle = new THREE.Vector3(
        0.18 * (1.0 - ads),
        -0.15 + ads * 0.035,
        -0.48 + ads * 0.04
      );
    }

    const worldMuzzle = this.camera.position.clone().add(localMuzzle.applyEuler(this.camera.rotation));
    this.lighting.muzzleLightWorld.position.copy(worldMuzzle);

    const zombieHit = this.zombies.raycastZombies(ray, CONFIG.MAX_RANGE);
    const worldHit = this.collisions.raycast(ray, CONFIG.MAX_RANGE);

    let hitPoint: THREE.Vector3;
    let hitNormal = new THREE.Vector3(0, 1, 0);

    if (zombieHit && (!worldHit || zombieHit.hitPoint.distanceTo(ray.origin) < worldHit.distance)) {
      hitPoint = zombieHit.hitPoint;
      const damage = Math.round(zombieHit.isHeadshot ? baseDamage * headMult : baseDamage);

      const killed = zombieHit.zombie.takeDamage(damage);
      this.damageNumbers.spawn(hitPoint, damage, zombieHit.isHeadshot, zombieHit.isHeadshot ? 'CRIT' : undefined);

      if (killed) {
        this.zombies.totalKills++;
        if (zombieHit.isHeadshot) this.zombies.totalHeadshots++;
        this.sfx.playZombieDeath();
        this.pickups.spawnDrop(hitPoint);
      }

      this.impactFX.triggerImpact(hitPoint, new THREE.Vector3(0, 1, 0));
      this.lighting.impactLight.position.copy(hitPoint);
      this.lighting.impactLight.intensity = 4.0;
      this.sfx.playImpactSizzle();
    } else if (worldHit) {
      hitPoint = worldHit.point;
      hitNormal = worldHit.normal;
      this.impactFX.triggerImpact(hitPoint, hitNormal);
      this.lighting.impactLight.position.copy(hitPoint).addScaledVector(hitNormal, 0.2);
      this.lighting.impactLight.intensity = 3.5;
      this.sfx.playImpactSizzle();
    } else {
      hitPoint = ray.origin.clone().addScaledVector(ray.direction, CONFIG.MAX_RANGE);
    }

    if (spawnBeam) {
      this.beamFX.fireBeam(worldMuzzle, hitPoint);
    }
  }

  // --- SLOT 3: CYBER-SHURIKEN / NINJA STAR ---
  private throwShuriken(): void {
    this.shurikenCount--;
    this.fireTimer = CONFIG.SHURIKEN_COOLDOWN;
    this.sfx.playShurikenThrow();

    const aimDir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation).normalize();
    const spawnPos = this.camera.position.clone().add(aimDir.clone().multiplyScalar(0.4));

    const shurikenMesh = ShurikenModel.createMesh();
    shurikenMesh.position.copy(spawnPos);
    shurikenMesh.scale.setScalar(1.2);
    this.worldScene.add(shurikenMesh);

    this.flyingShurikens.push({
      mesh: shurikenMesh,
      pos: spawnPos,
      velocity: aimDir.multiplyScalar(CONFIG.SHURIKEN_SPEED),
      life: 2.5,
    });
  }

  private updateFlyingShurikens(dt: number): void {
    for (let i = this.flyingShurikens.length - 1; i >= 0; i--) {
      const s = this.flyingShurikens[i];
      s.life -= dt;

      // Move forward & spin
      s.pos.addScaledVector(s.velocity, dt);
      s.mesh.position.copy(s.pos);
      s.mesh.rotation.z += dt * 50.0;
      s.mesh.rotation.y += dt * 15.0;

      // Check hit against active zombies
      const ray = new THREE.Ray(s.pos, s.velocity.clone().normalize());
      const hit = this.zombies.raycastZombies(ray, 1.2);

      if (hit && hit.zombie.isAlive) {
        const damage = CONFIG.SHURIKEN_DAMAGE;
        const killed = hit.zombie.takeDamage(damage);
        this.damageNumbers.spawn(hit.hitPoint, damage, false, 'SLICE');
        this.sfx.playShurikenHit();
        this.impactFX.triggerImpact(hit.hitPoint, new THREE.Vector3(0, 1, 0));

        if (killed) {
          this.zombies.totalKills++;
          this.sfx.playZombieDeath();
          this.pickups.spawnDrop(hit.hitPoint);
        }

        this.worldScene.remove(s.mesh);
        this.flyingShurikens.splice(i, 1);
        continue;
      }

      if (s.life <= 0) {
        this.worldScene.remove(s.mesh);
        this.flyingShurikens.splice(i, 1);
      }
    }
  }

  public startReload(): void {
    if (this.isReloading) return;
    if (this.currentSlot === 1 && this.spareCells > 0) {
      this.isReloading = true;
      this.reloadTimer = CONFIG.RELOAD_TIME;
      this.spareCells--;
      this.sfx.playReloadSequence();
    } else if (this.currentSlot === 2 && this.sparePistolMags > 0) {
      this.isReloading = true;
      this.reloadTimer = CONFIG.PISTOL_RELOAD_TIME;
      this.sparePistolMags--;
      this.sfx.playReloadSequence();
    }
  }

  public shoot(): void {
    if (this.currentSlot === 1) this.shootRifle();
    else if (this.currentSlot === 2) this.shootPistol();
    else if (this.currentSlot === 3) this.throwShuriken();
  }
}
