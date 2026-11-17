import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FinalFXPass } from './FinalFX';
import { QualityManager } from '../core/Quality';

export class GameRenderer {
  public readonly renderer: THREE.WebGLRenderer;
  public readonly worldScene: THREE.Scene;
  public readonly weaponScene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly weaponCamera: THREE.PerspectiveCamera;
  public readonly composer: EffectComposer;
  public readonly finalFX: FinalFXPass;
  private readonly bloomPass: UnrealBloomPass;
  private width: number = window.innerWidth;
  private height: number = window.innerHeight;

  constructor(private readonly quality: QualityManager) {
    // 1. World Scene & Weapon Scene
    this.worldScene = new THREE.Scene();
    this.worldScene.fog = new THREE.FogExp2(0x080c18, 0.018);

    this.weaponScene = new THREE.Scene();

    // 2. Cameras
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.weaponCamera = new THREE.PerspectiveCamera(75, aspect, 0.01, 10);

    // 3. WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false, // Handled via HalfFloat / MSAA composer
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }

    // 4. EffectComposer (HalfFloat render target for HDR bloom)
    const renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      samples: this.quality.getSettings().msaa,
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);

    // Pass 1: World Scene
    const worldPass = new RenderPass(this.worldScene, this.camera);
    this.composer.addPass(worldPass);

    // Pass 2: Weapon Scene (clear = false, clearDepth = true prevents weapon clipping)
    const weaponPass = new RenderPass(this.weaponScene, this.weaponCamera);
    weaponPass.clear = false;
    weaponPass.clearDepth = true;
    this.composer.addPass(weaponPass);

    // Pass 3: Unreal Bloom (HDR bloom for laser, sparks, eyes, neon)
    const bloomSettings = this.quality.getSettings();
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width * bloomSettings.bloomScale, this.height * bloomSettings.bloomScale),
      0.9, // Strength
      0.55, // Radius
      0.82 // Threshold
    );
    this.composer.addPass(this.bloomPass);

    // Pass 4: OutputPass (Tone mapping & Color space transform)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    // Pass 5: FinalFX (Vignette, film grain, low-HP tint/desaturation, chromatic aberration)
    this.finalFX = new FinalFXPass();
    this.composer.addPass(this.finalFX.pass);

    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const aspect = this.width / this.height;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.weaponCamera.aspect = aspect;
    this.weaponCamera.updateProjectionMatrix();

    const scale = this.quality.getResolutionScale();
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5) * scale;

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(pixelRatio);
    this.composer.setSize(this.width, this.height);
    this.finalFX.setSize(this.width, this.height);
  };

  public updateFinalFX(dt: number, time: number, hpRatio: number, hitAberration: number): void {
    this.finalFX.update(dt, time, hpRatio, hitAberration);
  }

  public syncWeaponCamera(): void {
    // Copy main camera world transform and FOV to weapon camera
    this.weaponCamera.position.copy(this.camera.position);
    this.weaponCamera.quaternion.copy(this.camera.quaternion);
    this.weaponCamera.fov = this.camera.fov;
    this.weaponCamera.updateProjectionMatrix();
  }

  public render(): void {
    this.syncWeaponCamera();
    this.composer.render();
  }
}
