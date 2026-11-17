import * as THREE from 'three';
import { CONFIG, ATMOSPHERES, AtmosphereType } from '../config';
import { VolumetricFlashlight } from './Flashlight';

export class LightingManager {
  public readonly hemiLight: THREE.HemisphereLight;
  public readonly moonLight: THREE.DirectionalLight;
  public readonly neonPink: THREE.PointLight;
  public readonly neonCyan: THREE.PointLight;
  public readonly flashlight: THREE.SpotLight;
  public readonly volumetricFlashlight: VolumetricFlashlight;
  public readonly muzzleLightWorld: THREE.PointLight;
  public readonly muzzleLightWeapon: THREE.PointLight;
  public readonly impactLight: THREE.PointLight;

  private isFlashlightOn: boolean = true;
  private lightningTimer: number = 0;
  private isLightningActive: boolean = false;
  private baseSunIntensity: number = 0.55;
  private baseHemiIntensity: number = 0.45;

  constructor(worldScene: THREE.Scene, weaponScene: THREE.Scene) {
    // 1. Cool Dim Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0x223355, 0x080c14, 0.45);
    worldScene.add(this.hemiLight);

    // 2. Faint Blue Directional "Moon" (no shadow map for perf)
    this.moonLight = new THREE.DirectionalLight(0xaaccff, 0.55);
    this.moonLight.position.set(12, 25, -18);
    worldScene.add(this.moonLight);

    // 3. Flickering City Neon Signs (Point Lights)
    this.neonPink = new THREE.PointLight(0xff0066, 2.5, 25);
    this.neonPink.position.set(-16, 3.5, -12);
    worldScene.add(this.neonPink);

    this.neonCyan = new THREE.PointLight(CONFIG.LASER_COLOR, 2.2, 25);
    this.neonCyan.position.set(16, 3.5, -10);
    worldScene.add(this.neonCyan);

    // 4. Chest-Mounted Tactical Flashlight SpotLight (Softened to eliminate glare)
    this.flashlight = new THREE.SpotLight(0xdbe6f5, CONFIG.FLASHLIGHT_INTENSITY);
    this.flashlight.decay = CONFIG.FLASHLIGHT_DECAY;
    this.flashlight.distance = CONFIG.FLASHLIGHT_DISTANCE;
    this.flashlight.angle = CONFIG.FLASHLIGHT_ANGLE;
    this.flashlight.penumbra = CONFIG.FLASHLIGHT_PENUMBRA;
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.camera.near = 0.2;
    this.flashlight.shadow.camera.far = 45;
    worldScene.add(this.flashlight);
    worldScene.add(this.flashlight.target);

    // 4b. Volumetric Beam Cone & Dust Motes
    this.volumetricFlashlight = new VolumetricFlashlight();
    worldScene.add(this.volumetricFlashlight.group);

    // 5. Pooled Muzzle Light (One in World Scene, One in Weapon Scene)
    this.muzzleLightWorld = new THREE.PointLight(CONFIG.LASER_COLOR, 0, 12);
    worldScene.add(this.muzzleLightWorld);

    this.muzzleLightWeapon = new THREE.PointLight(CONFIG.LASER_COLOR, 0, 5);
    weaponScene.add(this.muzzleLightWeapon);

    // 6. Pooled Impact Light
    this.impactLight = new THREE.PointLight(CONFIG.LASER_COLOR, 0, 10);
    worldScene.add(this.impactLight);

    // 7. Weapon Scene ambient fill
    const weaponAmbient = new THREE.AmbientLight(0x223348, 1.2);
    weaponScene.add(weaponAmbient);

    const weaponKey = new THREE.DirectionalLight(0xffffff, 1.8);
    weaponKey.position.set(-1, 2, 1);
    weaponScene.add(weaponKey);
  }

  public toggleFlashlight(): boolean {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.visible = this.isFlashlightOn;
    this.volumetricFlashlight.setVisible(this.isFlashlightOn);
    return this.isFlashlightOn;
  }

  public setAtmosphere(type: AtmosphereType, worldScene: THREE.Scene): void {
    const cfg = ATMOSPHERES[type];
    this.hemiLight.color.setHex(cfg.hemiSky);
    this.hemiLight.groundColor.setHex(cfg.hemiGround);
    this.hemiLight.intensity = cfg.hemiIntensity;
    this.baseHemiIntensity = cfg.hemiIntensity;

    this.moonLight.color.setHex(cfg.sunColor);
    this.moonLight.intensity = cfg.sunIntensity;
    this.baseSunIntensity = cfg.sunIntensity;
    this.moonLight.position.set(cfg.sunPos[0], cfg.sunPos[1], cfg.sunPos[2]);

    if (worldScene.fog instanceof THREE.FogExp2) {
      worldScene.fog.color.setHex(cfg.fogColor);
      worldScene.fog.density = cfg.fogDensity;
    }

    if (type === 'sunset') {
      this.neonPink.color.setHex(0xff2255);
      this.neonCyan.color.setHex(0xffaa22);
    } else if (type === 'sunrise') {
      this.neonPink.color.setHex(0xff3377);
      this.neonCyan.color.setHex(0x00d8f5);
    } else {
      this.neonPink.color.setHex(0xff0066);
      this.neonCyan.color.setHex(CONFIG.LASER_COLOR);
    }
  }

  public triggerLightning(): void {
    this.isLightningActive = true;
    this.lightningTimer = 0.15;
    this.moonLight.intensity = 4.5;
    this.hemiLight.intensity = 2.5;
  }

  public update(dt: number, time: number): void {
    // Neon subtle electric flicker
    this.volumetricFlashlight.update(dt, time);
    const noisePink = (Math.sin(time * 12.0) + Math.cos(time * 33.0)) * 0.15;
    this.neonPink.intensity = 2.5 + noisePink;

    const noiseCyan = (Math.sin(time * 9.0) + Math.cos(time * 28.0)) * 0.12;
    this.neonCyan.intensity = 2.2 + noiseCyan;

    // Decay muzzle and impact pulses
    if (this.muzzleLightWorld.intensity > 0) {
      this.muzzleLightWorld.intensity = Math.max(0, this.muzzleLightWorld.intensity - dt * 45);
      this.muzzleLightWeapon.intensity = this.muzzleLightWorld.intensity;
    }
    if (this.impactLight.intensity > 0) {
      this.impactLight.intensity = Math.max(0, this.impactLight.intensity - dt * 35);
    }

    // Lightning decay
    if (this.isLightningActive) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.isLightningActive = false;
        this.moonLight.intensity = this.baseSunIntensity;
        this.hemiLight.intensity = this.baseHemiIntensity;
      }
    }
  }
}
