import * as THREE from 'three';
import { CONFIG } from '../config';
import { InputManager } from '../core/Input';
import { CollisionSystem } from '../world/Colliders';
import { LightingManager } from '../render/Lighting';
import { SfxManager } from '../audio/Sfx';

export class Player {
  public readonly position: THREE.Vector3;
  public readonly velocity: THREE.Vector3 = new THREE.Vector3();
  public yaw: number = 0;
  public pitch: number = 0;
  public hp: number = CONFIG.MAX_HP;
  public isSprinting: boolean = false;
  public isMoving: boolean = false;
  public isGrounded: boolean = true;
  public isAiming: boolean = false;
  public adsProgress: number = 0; // 0.0 (Hip) to 1.0 (Full ADS)
  public hitAberration: number = 0;
  public fellInVoid: boolean = false;
  public sensitivityMultiplier: number = 1.0;

  public get isDizzy(): boolean {
    return this.hitAberration > 0.1 || this.hp < 40;
  }

  public get dizzinessLevel(): number {
    const lowHpDizzy = this.hp < 40 ? (40 - this.hp) / 40 : 0;
    return Math.min(1.0, this.hitAberration + lowHpDizzy * 0.7);
  }

  private bobTimer: number = 0;
  private lastStepPhase: number = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly input: InputManager,
    private readonly collisions: CollisionSystem,
    private readonly lighting: LightingManager,
    private readonly sfx: SfxManager
  ) {
    this.position = new THREE.Vector3(
      CONFIG.PLAYER_SPAWN.x,
      CONFIG.PLAYER_SPAWN.y,
      CONFIG.PLAYER_SPAWN.z
    );
    this.camera.position.set(this.position.x, this.position.y + CONFIG.PLAYER_EYE_HEIGHT, this.position.z);
  }

  public update(dt: number): void {
    // 1. Aim Down Sights (ADS)
    this.isAiming = this.input.isRightMouseDown && !this.isSprinting;
    const targetAds = this.isAiming ? 1.0 : 0.0;
    this.adsProgress = THREE.MathUtils.lerp(this.adsProgress, targetAds, dt * 14.0);

    // Zoom camera FOV during ADS
    const targetFov = THREE.MathUtils.lerp(CONFIG.DEFAULT_FOV, CONFIG.ADS_FOV, this.adsProgress);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }

    // 2. Mouse Look Orientation (Sensitivity damped during ADS)
    const { dx, dy } = this.input.consumeMouseDeltas();
    const sens = CONFIG.MOUSE_SENSITIVITY_DEFAULT * this.sensitivityMultiplier * (1.0 - this.adsProgress * 0.45);
    this.yaw -= dx * sens;
    this.pitch -= dy * sens;

    // Clamp pitch to avoid gimbal flips
    const maxPitch = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // 3. Kinematics (WASD Movement)
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const moveInput = new THREE.Vector3();
    if (this.input.isKeyDown('KeyW')) moveInput.add(forward);
    if (this.input.isKeyDown('KeyS')) moveInput.sub(forward);
    if (this.input.isKeyDown('KeyD')) moveInput.add(right);
    if (this.input.isKeyDown('KeyA')) moveInput.sub(right);

    this.isMoving = moveInput.lengthSq() > 0.001;
    this.isSprinting = this.isMoving && this.input.isKeyDown('ShiftLeft') && !this.isAiming;

    const baseSpeed = this.isSprinting ? CONFIG.SPRINT_SPEED : CONFIG.WALK_SPEED;
    const targetSpeed = this.isAiming ? baseSpeed * 0.6 : baseSpeed;

    if (this.isMoving) {
      moveInput.normalize().multiplyScalar(targetSpeed);
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveInput.x, CONFIG.ACCELERATION * dt);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveInput.z, CONFIG.ACCELERATION * dt);
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, CONFIG.FRICTION * dt);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, CONFIG.FRICTION * dt);
    }

    // 4. Jump & 3D Ground Collision
    const groundY = this.collisions.getGroundHeight(this.position.x, this.position.z, this.position.y);

    if (this.isGrounded) {
      if (this.input.isKeyDown('Space')) {
        this.velocity.y = CONFIG.JUMP_FORCE;
        this.isGrounded = false;
      }
    } else {
      this.velocity.y -= CONFIG.GRAVITY * dt;
    }

    // Integrate vertical velocity
    this.position.y += this.velocity.y * dt;

    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else if (this.position.y > groundY + 0.08) {
      this.isGrounded = false;
    }

    // Void Fall check
    if (this.position.y < CONFIG.VOID_DEATH_Y) {
      this.hp = 0;
      this.fellInVoid = true;
    }

    // Integrate horizontal position & push out against walls
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.collisions.resolveCircle(this.position, CONFIG.PLAYER_RADIUS);

    // 5. Head Bob & Footstep Audio (Dampened in ADS)
    let bobX = 0;
    let bobY = 0;
    if (this.isMoving && this.isGrounded) {
      const speedNorm = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z) / CONFIG.WALK_SPEED;
      this.bobTimer += dt * CONFIG.HEAD_BOB_FREQ * speedNorm;
      const bobMult = this.isAiming ? 0.2 : 1.0;
      bobX = Math.cos(this.bobTimer * 0.5) * (CONFIG.HEAD_BOB_AMP * 0.6) * bobMult;
      bobY = Math.abs(Math.sin(this.bobTimer)) * CONFIG.HEAD_BOB_AMP * bobMult;

      const currentPhase = Math.floor(this.bobTimer / Math.PI);
      if (currentPhase !== this.lastStepPhase) {
        this.lastStepPhase = currentPhase;
        this.sfx.playFootstep();
      }
    } else {
      this.bobTimer = 0;
      this.lastStepPhase = 0;
    }

    // Decay damage aberration
    if (this.hitAberration > 0) {
      this.hitAberration = Math.max(0, this.hitAberration - dt * 3.5);
    }

    // 6. Camera Position (Player feet + eye height + bob)
    this.camera.position.set(
      this.position.x + bobX,
      this.position.y + CONFIG.PLAYER_EYE_HEIGHT + bobY,
      this.position.z
    );

    // 7. Chest Flashlight & Volumetric Soft Beam
    const leftOffset = new THREE.Vector3(-0.20, -0.16, 0).applyEuler(this.camera.rotation);
    const flashPos = this.camera.position.clone().add(leftOffset);
    this.lighting.flashlight.position.copy(flashPos);

    const aimDir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    const targetPoint = this.camera.position.clone().add(aimDir.clone().multiplyScalar(15));
    this.lighting.flashlight.target.position.copy(targetPoint);

    this.lighting.volumetricFlashlight.group.position.copy(flashPos);
    this.lighting.volumetricFlashlight.group.lookAt(targetPoint);
  }

  public takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    this.hitAberration = 1.0;
    this.sfx.playPlayerHurt();
  }

  public heal(amount: number): void {
    this.hp = Math.min(CONFIG.MAX_HP, this.hp + amount);
  }
}
