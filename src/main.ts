import * as THREE from 'three';
import { QualityManager } from './core/Quality';
import { GameRenderer } from './render/Renderer';
import { CollisionSystem } from './world/Colliders';
import { InputManager } from './core/Input';
import { LightingManager } from './render/Lighting';
import { SkyManager } from './render/Sky';
import { Rooftop } from './world/Rooftop';
import { BulkheadManager } from './world/Bulkhead';
import { RooftopProps } from './world/Props';
import { Barricade } from './world/Barricade';
import { Player } from './player/Player';
import { LaserRifle } from './player/LaserRifle';
import { BeamFXManager } from './player/BeamFX';
import { ImpactFXManager } from './player/ImpactFX';
import { WeaponController } from './player/WeaponController';
import { ZombieManager } from './enemies/ZombieManager';
import { WaveDirector } from './enemies/WaveDirector';
import { PickupManager } from './player/Pickups';
import { AudioEngine } from './audio/AudioEngine';
import { SfxManager } from './audio/Sfx';
import { AmbienceManager } from './audio/Ambience';
import { RainSystem } from './render/Rain';
import { GameHUD } from './ui/HUD';
import { MenuSystem } from './ui/Menus';
import { DebugHUD } from './core/Debug';
import { DamageNumberManager } from './ui/DamageNumbers';
import { Loop } from './core/Loop';
import { CONFIG, AtmosphereType, ATMOSPHERES } from './config';

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'INTERMISSION' | 'GAMEOVER' | 'VICTORY';

// 1. Touch device guard check
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice && window.innerWidth < 900) {
  const guard = document.getElementById('touch-guard');
  if (guard) guard.classList.remove('hidden');
}

// 2. Core Audio & Subsystems
const audio = new AudioEngine();
const sfx = new SfxManager(audio);
const ambience = new AmbienceManager(audio);
const quality = new QualityManager();
const renderEngine = new GameRenderer(quality);
const collisions = new CollisionSystem();
const debug = new DebugHUD();
const input = new InputManager(renderEngine.renderer.domElement, debug.isDebugMode);
const lighting = new LightingManager(renderEngine.worldScene, renderEngine.weaponScene);
const sky = new SkyManager();
renderEngine.worldScene.add(sky.mesh);

// Rain & Weather
const rain = new RainSystem();
renderEngine.worldScene.add(rain.mesh);
renderEngine.worldScene.add(rain.splashMesh);

// 3. World Construction
const rooftop = new Rooftop(collisions);
renderEngine.worldScene.add(rooftop.mesh);

const bulkheads = new BulkheadManager(collisions);
renderEngine.worldScene.add(bulkheads.mesh);

const props = new RooftopProps(collisions);
renderEngine.worldScene.add(props.mesh);

// 3 Barricades (North, East, West)
const barricades: Barricade[] = bulkheads.gates.map((g) => {
  const b = new Barricade(g, collisions, sfx);
  renderEngine.worldScene.add(b.group);
  return b;
});

// 4. Entities & Multi-Weapon Systems
const player = new Player(renderEngine.camera, input, collisions, lighting, sfx);
const beamFX = new BeamFXManager();
renderEngine.worldScene.add(beamFX.mesh);

const impactFX = new ImpactFXManager();
renderEngine.worldScene.add(impactFX.mesh);

const damageNumbers = new DamageNumberManager();
const rifle = new LaserRifle();
const zombies = new ZombieManager(renderEngine.worldScene);
const pickups = new PickupManager(renderEngine.worldScene, sfx);

const weapon = new WeaponController(
  rifle,
  beamFX,
  impactFX,
  sfx,
  lighting,
  collisions,
  zombies,
  pickups,
  input,
  player,
  renderEngine.camera,
  renderEngine.weaponScene,
  renderEngine.worldScene,
  damageNumbers
);

const waveDirector = new WaveDirector(zombies, barricades, player, weapon);

// 5. UI & Game State Machine
const hud = new GameHUD();
const menus = new MenuSystem();

let gameState: GameState = debug.isDebugMode ? 'PLAYING' : 'MENU';
if (debug.isDebugMode) {
  menus.hide();
  input.requestLock();
  audio.init();
  ambience.start();
}

// 5. Atmosphere Management (Midnight / Sunset / Sunrise)
let currentAtmosphere: AtmosphereType = CONFIG.DEFAULT_ATMOSPHERE;

const applyAtmosphere = (type: AtmosphereType) => {
  currentAtmosphere = type;
  menus.currentAtmosphere = type;
  sky.setAtmosphere(type);
  lighting.setAtmosphere(type, renderEngine.worldScene);
  rain.setAtmosphere(type);
  ambience.setAtmosphere(type);
};

// Check URL param at boot (?atmosphere=sunset or ?atmosphere=sunrise)
const urlAtmo = new URLSearchParams(window.location.search).get('atmosphere') as AtmosphereType | null;
if (urlAtmo && (urlAtmo === 'sunset' || urlAtmo === 'sunrise' || urlAtmo === 'midnight')) {
  applyAtmosphere(urlAtmo);
}

// Connect Settings & Menu Callbacks
menus.onMasterVolumeChange = (v) => audio.setMasterVolume(v);
menus.onSfxVolumeChange = (v) => audio.setSfxVolume(v);
menus.onAmbienceVolumeChange = (v) => audio.setAmbienceVolume(v);
menus.onSensitivityChange = (s) => { player.sensitivityMultiplier = s; };
menus.onAtmosphereChange = (type) => {
  applyAtmosphere(type);
  hud.showPickupToast(`ATMOSPHERE: ${ATMOSPHERES[type].label}`, '#00e5ff');
};

waveDirector.onWaveStart = (w) => {
  hud.showLevelBanner(w);
  sfx.playLevelFanfare(w);
};

pickups.onCollectNotification = (text, color) => {
  hud.showPickupToast(text, color);
};

menus.onStartGame = () => {
  audio.init();
  ambience.start();
  waveDirector.startWave(1);
  gameState = 'PLAYING';
  input.requestLock();
};

menus.onResumeGame = () => {
  gameState = 'PLAYING';
  input.requestLock();
};

menus.onRestartGame = () => {
  player.position.set(0, 0, 6);
  player.velocity.set(0, 0, 0);
  player.hp = 100;
  player.fellInVoid = false;
  player.isGrounded = true;
  weapon.ammo = CONFIG.CELL_CAPACITY;
  weapon.spareCells = CONFIG.START_SPARE_CELLS;
  weapon.pistolAmmo = CONFIG.PISTOL_MAG_CAPACITY;
  weapon.sparePistolMags = 4;
  weapon.shurikenCount = CONFIG.SHURIKEN_CAPACITY;
  weapon.selectSlot(1);
  pickups.scrapCount = CONFIG.START_SCRAP;
  damageNumbers.clear();
  zombies.killAll();
  barricades.forEach((b) => {
    while (b.getActivePlankCount() < CONFIG.PLANKS_PER_GATE) {
      b.repairOneSlot();
    }
  });
  waveDirector.startWave(1);
  gameState = 'PLAYING';
  input.requestLock();
};

const triggerLightningEffect = () => {
  lighting.triggerLightning();
  ambience.triggerThunder(0.5 + Math.random() * 0.7);
};

// Global Hotkeys & Weapon Slots
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && gameState === 'PLAYING') {
    gameState = 'PAUSED';
    document.exitPointerLock?.();
    menus.showPauseMenu();
  }
  if (e.key.toLowerCase() === 'm') {
    audio.toggleMute();
  }
  if (e.key.toLowerCase() === 'f') {
    lighting.toggleFlashlight();
  }
  if (e.key === 'Enter' || e.key.toLowerCase() === 'n') {
    waveDirector.skipIntermission();
  }
  if (e.key.toLowerCase() === 'o') {
    const atmoOrder: AtmosphereType[] = ['midnight', 'sunset', 'sunrise'];
    const nextIdx = (atmoOrder.indexOf(currentAtmosphere) + 1) % atmoOrder.length;
    applyAtmosphere(atmoOrder[nextIdx]);
    hud.showPickupToast(`ATMOSPHERE: ${ATMOSPHERES[atmoOrder[nextIdx]].label}`, '#00e5ff');
  }

  // Weapon slot selection (1: Laser, 2: Pistol, 3: Shuriken)
  if (gameState === 'PLAYING') {
    if (e.key === '1') weapon.selectSlot(1);
    if (e.key === '2') weapon.selectSlot(2);
    if (e.key === '3') weapon.selectSlot(3);
    if (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'i') weapon.startInspect();
  }

  // Debug Cheats (?debug=1)
  if (debug.isDebugMode) {
    if (e.key.toLowerCase() === 'k') zombies.killAll();
    if (e.key.toLowerCase() === 'g') player.hp = 9999;
    if (e.key.toLowerCase() === 'l') triggerLightningEffect();
  }
});

// Automation Test Interface
(window as any).__game = {
  fire: () => weapon.shoot(),
  reload: () => weapon.startReload(),
  selectSlot: (n: 1 | 2 | 3) => weapon.selectSlot(n),
  spawn: (type: 'walker' | 'runner' | 'brute') => zombies.spawn(type, barricades[0]),
  killAll: () => zombies.killAll(),
  godMode: (val: boolean) => { player.hp = val ? 9999 : 100; },
  setWave: (n: number) => waveDirector.startWave(n),
  lightning: () => triggerLightningEffect(),
  setAtmosphere: (type: AtmosphereType) => applyAtmosphere(type),
  getPlayer: () => player,
  getWeapon: () => weapon,
  getZombies: () => zombies,
  getBarricades: () => barricades,
};

// URL Test Automation Action Hook
const urlAction = new URLSearchParams(window.location.search).get('action');
let hasHandledUrlAction = false;

// 6. Repair Logic Timer
let repairProgressTimer = 0;
let nextLightningTime = 25.0 + Math.random() * 15.0;

// 7. Game Loop (Fixed 60Hz logic)
let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 60;
let totalTime = 0;

const loop = new Loop(
  (fixedDt: number) => {
    if (gameState !== 'PLAYING') return;

    totalTime += fixedDt;

    // First-tick automation hook for deterministic captures
    if (!hasHandledUrlAction && urlAction) {
      hasHandledUrlAction = true;
      if (urlAction === 'fire') {
        weapon.shoot();
      } else if (urlAction === 'zombies') {
        const z1 = zombies.zombies[0];
        z1.spawn(new THREE.Vector3(-1.0, 0, 3.2), barricades[0]);
        z1.state = 'ATTACK_PLAYER';
        z1.model.animateAttack(0.65);
        z1.model.mesh.lookAt(player.position.x, 0, player.position.z);

        const z2 = zombies.zombies[30];
        z2.spawn(new THREE.Vector3(1.2, 0, 3.6), barricades[0]);
        z2.state = 'CHASE_PLAYER';
        z2.model.mesh.lookAt(player.position.x, 0, player.position.z);

        const z3 = zombies.zombies[38];
        z3.spawn(new THREE.Vector3(0, 0, 2.0), barricades[0]);
        z3.state = 'ATTACK_PLAYER';
        z3.model.animateAttack(0.4);
        z3.model.mesh.lookAt(player.position.x, 0, player.position.z);

        damageNumbers.spawn(new THREE.Vector3(0, 1.9, 2.0), 48, false);
        damageNumbers.spawn(new THREE.Vector3(-1.0, 2.1, 3.2), 90, true);
      } else if (urlAction === 'barricades') {
        player.position.set(0, 0, -7.5);
        barricades[0].damageLowestPlank(50);
        barricades[0].damageLowestPlank(50);
        barricades[0].damageLowestPlank(25);
      } else if (urlAction === 'ads') {
        player.isAiming = true;
        player.adsProgress = 1.0;
      } else if (urlAction === 'ads-fire') {
        player.isAiming = true;
        player.adsProgress = 1.0;
        weapon.shoot();
      } else if (urlAction === 'pistol') {
        weapon.selectSlot(2);
      } else if (urlAction === 'shuriken') {
        weapon.selectSlot(3);
      } else if (urlAction === 'climb') {
        // Player elevated on high-ground sniper vantage deck overlooking rooftop
        player.position.set(11, 1.8, -1.5);
        player.yaw = -1.7; // Look inward across the roof and helipad
        player.pitch = -0.25; // Look down at rooftop below
        player.velocity.set(0, 0, 0);
        player.isGrounded = true;
      } else if (urlAction === 'atmosphere') {
        triggerLightningEffect();
      } else if (urlAction === 'sunset') {
        applyAtmosphere('sunset');
      } else if (urlAction === 'sunrise') {
        applyAtmosphere('sunrise');
      } else if (urlAction === 'midnight') {
        applyAtmosphere('midnight');
      } else if (urlAction === 'dawn') {
        sky.setDawnFactor(1.0);
      } else if (urlAction === 'settings') {
        menus.showSettingsScreen();
      } else if (urlAction === 'disclaimer') {
        menus.showHorrorDisclaimer();
      } else if (urlAction === 'dizzy-zombies') {
        player.hp = 30;
        player.hitAberration = 1.0;
        const z1 = zombies.zombies[0];
        z1.spawn(new THREE.Vector3(-0.5, 0, 3.5), barricades[0]);
        z1.state = 'CHASE_PLAYER';
      } else if (urlAction === 'level') {
        hud.showLevelBanner(2);
      } else if (urlAction === 'inspect-shuriken') {
        weapon.selectSlot(3);
        weapon.startInspect();
      } else if (urlAction === 'inspect-gun') {
        weapon.selectSlot(2);
        weapon.startInspect();
      } else if (urlAction === 'show-walker') {
        player.pitch = -0.12;
        const zw = zombies.zombies[0];
        zw.spawn(new THREE.Vector3(0, 0, 2.6), barricades[0]);
        zw.state = 'ATTACK_PLAYER';
        zw.model.mesh.lookAt(player.position.x, 0, player.position.z);
        zw.model.animateWalk(0.5, 1.0);
      } else if (urlAction === 'show-brute') {
        player.pitch = -0.12;
        const zb = zombies.zombies[38];
        zb.spawn(new THREE.Vector3(0, 0, 2.4), barricades[0]);
        zb.state = 'ATTACK_PLAYER';
        zb.model.mesh.lookAt(player.position.x, 0, player.position.z);
        zb.model.animateAttack(0.4);
      } else if (urlAction === 'show-both') {
        player.pitch = -0.12;
        const zw = zombies.zombies[0];
        zw.spawn(new THREE.Vector3(1.1, 0, 2.6), barricades[0]);
        zw.state = 'ATTACK_PLAYER';
        zw.model.mesh.lookAt(player.position.x, 0, player.position.z);
        zw.model.animateWalk(0.4, 1.0);

        const zb = zombies.zombies[38];
        zb.spawn(new THREE.Vector3(-1.1, 0, 2.3), barricades[0]);
        zb.state = 'ATTACK_PLAYER';
        zb.model.mesh.lookAt(player.position.x, 0, player.position.z);
        zb.model.animateAttack(0.5);
      } else if (urlAction === 'drops') {
        pickups.spawnDrop(new THREE.Vector3(-1.2, 0, 4.0));
        pickups.spawnDrop(new THREE.Vector3(-0.4, 0, 4.2));
        pickups.spawnDrop(new THREE.Vector3(0.4, 0, 4.2));
        pickups.spawnDrop(new THREE.Vector3(1.2, 0, 4.0));
        hud.showPickupToast('+AMMO RESUPPLY (RIFLE & PISTOL)', '#00e5ff');
        hud.showPickupToast('+35 HEALTH RESTORED', '#00ff88');
      }
    }

    // A. Player & Weapon Kinematics
    player.update(fixedDt);
    weapon.update(fixedDt);

    // Weather & Atmosphere
    rain.update(fixedDt, player.position);
    ambience.update(totalTime);

    if (totalTime >= nextLightningTime) {
      triggerLightningEffect();
      nextLightningTime = totalTime + 28.0 + Math.random() * 20.0;
    }

    // B. Check Game Over
    if (player.hp <= 0) {
      gameState = 'GAMEOVER';
      document.exitPointerLock?.();
      menus.showGameOver({
        wave: waveDirector.currentWave,
        kills: zombies.totalKills,
        reason: player.fellInVoid ? 'VOID' : 'OVERRUN',
      });
      return;
    }

    // C. Check Victory
    if (waveDirector.isVictory) {
      gameState = 'VICTORY';
      sky.setDawnFactor(1.0);
      ambience.startChopperRescue();
      document.exitPointerLock?.();
      menus.showVictory({
        kills: zombies.totalKills,
        accuracy: 65,
      });
      return;
    }

    // D. Enemies & Waves
    waveDirector.update(fixedDt);
    zombies.update(fixedDt, totalTime, player, collisions);
    pickups.update(fixedDt, totalTime, player, weapon);

    // E. Barricade Repair Detection
    let nearGate: Barricade | null = null;
    for (const b of barricades) {
      if (player.position.distanceTo(b.gate.doorCenter) < CONFIG.REPAIR_DISTANCE) {
        nearGate = b;
        break;
      }
    }

    if (nearGate && nearGate.getIntegrityPercentage() < 100 && pickups.scrapCount > 0) {
      hud.showPrompt(`[HOLD E] REPAIR PLANK (${pickups.scrapCount} SCRAP)`);
      if (input.isKeyDown('KeyE')) {
        repairProgressTimer += fixedDt;
        if (repairProgressTimer >= CONFIG.REPAIR_TIME) {
          nearGate.repairOneSlot();
          pickups.scrapCount -= CONFIG.REPAIR_COST;
          repairProgressTimer = 0;
        }
      } else {
        repairProgressTimer = 0;
      }
    } else {
      hud.hidePrompt();
      repairProgressTimer = 0;
    }

    // F. Props & Lighting
    props.update(totalTime);
    lighting.update(fixedDt, totalTime);

    // G. HUD Update
    const gateN = barricades.find((b) => b.gate.id === 'north')!.getIntegrityPercentage();
    const gateE = barricades.find((b) => b.gate.id === 'east')!.getIntegrityPercentage();
    const gateW = barricades.find((b) => b.gate.id === 'west')!.getIntegrityPercentage();

    const currentSlot = weapon.currentSlot;
    const weaponName =
      currentSlot === 1
        ? 'ARC-7 PULSE LASER'
        : currentSlot === 2
        ? 'TALON-9 PLASMA PISTOL'
        : 'CYBER-SHURIKEN';

    const activeAmmo =
      currentSlot === 1
        ? weapon.ammo
        : currentSlot === 2
        ? weapon.pistolAmmo
        : weapon.shurikenCount;

    const maxAmmo =
      currentSlot === 1
        ? CONFIG.CELL_CAPACITY
        : currentSlot === 2
        ? CONFIG.PISTOL_MAG_CAPACITY
        : CONFIG.SHURIKEN_CAPACITY;

    const spareCells =
      currentSlot === 1
        ? weapon.spareCells
        : currentSlot === 2
        ? weapon.sparePistolMags
        : 0;

    const reserveLabel =
      currentSlot === 1
        ? 'SPARE CELLS:'
        : currentSlot === 2
        ? 'SPARE MAGS:'
        : 'READY STARS:';

    hud.updateStats({
      hp: player.hp,
      ammo: activeAmmo,
      maxAmmo,
      spareCells,
      reserveLabel,
      weaponName,
      currentSlot,
      scrap: pickups.scrapCount,
      wave: waveDirector.currentWave,
      zombiesRemaining: zombies.getAliveCount() + Math.ceil(waveDirector.waveBudgetRemaining),
      gateN,
      gateE,
      gateW,
    });
  },
  (_alpha: number) => {
    renderEngine.updateFinalFX(
      1 / 60,
      totalTime,
      player.hp / CONFIG.MAX_HP,
      player.hitAberration
    );
    renderEngine.render();

    // Telemetry Tracking
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 500) {
      currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
      frameCount = 0;
      lastFpsTime = now;

      debug.updateStats({
        fps: currentFps,
        frameMs: 1000 / (currentFps || 60),
        drawCalls: renderEngine.renderer.info.render.calls,
        triangles: renderEngine.renderer.info.render.triangles,
        aliveZombies: zombies.getAliveCount(),
        activeParticles: 180,
        resolutionScale: quality.getResolutionScale(),
      });
    }
  }
);

loop.start();
console.log('MIDNIGHT ROOFTOP: LAST STAND — Full Multi-Weapon Combat Ready');
