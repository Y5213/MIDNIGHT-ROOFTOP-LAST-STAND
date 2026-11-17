export const CONFIG = {
  // Theme & Identity
  LASER_COLOR: 0x00e5ff,
  LASER_HEX: '#00e5ff',
  AMBER_EYES: 0xffaa00,
  RUNNER_EYES: 0xff2200,

  // Flashlight Tuning
  FLASHLIGHT_INTENSITY: 55, // Soft tactical illumination without blown-out bloom
  FLASHLIGHT_DECAY: 2.0,
  FLASHLIGHT_DISTANCE: 42,
  FLASHLIGHT_ANGLE: 0.45,
  FLASHLIGHT_PENUMBRA: 0.8,

  // Rooftop Geometry (Meters, surface at y=0)
  ROOF_WIDTH: 36, // X: -18 to +18
  ROOF_DEPTH: 28, // Z: -14 to +14
  PARAPET_HEIGHT: 1.1,
  PARAPET_THICKNESS: 0.35,
  VOID_DEATH_Y: -12.0, // Falling off the building triggers void death

  // Stairwell Bulkheads (North, East, West)
  BULKHEAD_WIDTH: 5.0,
  BULKHEAD_HEIGHT: 3.2,
  BULKHEAD_DEPTH: 3.0,
  DOORWAY_WIDTH: 2.4,
  DOORWAY_HEIGHT: 2.4,

  // Player & Movement
  PLAYER_RADIUS: 0.35,
  PLAYER_EYE_HEIGHT: 1.7,
  PLAYER_SPAWN: { x: 0, y: 0, z: 6 },
  WALK_SPEED: 4.0, // m/s
  SPRINT_SPEED: 6.2, // m/s
  ACCELERATION: 18.0,
  FRICTION: 12.0,
  JUMP_FORCE: 6.5, // m/s vertical jump impulse
  GRAVITY: 18.0, // m/s^2
  HEAD_BOB_FREQ: 9.0,
  HEAD_BOB_AMP: 0.045,
  MAX_HP: 100,
  MEDKIT_HEAL: 35,
  MOUSE_SENSITIVITY_DEFAULT: 0.0022,
  DEFAULT_FOV: 75,
  ADS_FOV: 50, // Zoomed in for precision aiming

  // Weapon 1: ARC-7 Pulse Laser Rifle
  ROF: 6.0, // shots per second
  CELL_CAPACITY: 30,
  START_SPARE_CELLS: 4,
  START_SCRAP: 8,
  RELOAD_TIME: 1.7,
  DAMAGE_BODY: 26,
  DAMAGE_HEAD_MULT: 2.5,
  MAX_RANGE: 80.0,
  SPREAD_REST: 0.0026,
  SPREAD_MOVING: 0.0087,
  SPREAD_ADS: 0.0005, // Pinpoint precision in ADS
  RECOIL_K: 220.0,
  RECOIL_C: 18.0,
  RECOIL_M: 1.0,
  RECOIL_IMPULSE_Z: 0.95,
  RECOIL_IMPULSE_PITCH: 0.65,
  CAMERA_KICK_IMPULSE: 0.25,

  // Weapon 2: Talon-9 Heavy Plasma Pistol (Secondary)
  PISTOL_DAMAGE: 48,
  PISTOL_HEAD_MULT: 2.5,
  PISTOL_ROF: 3.5, // Semi-auto click
  PISTOL_MAG_CAPACITY: 12,
  PISTOL_RELOAD_TIME: 1.1,

  // Weapon 3: Cyber-Shuriken / Ninja Star (Throwable Melee Projectile)
  SHURIKEN_DAMAGE: 90,
  SHURIKEN_SPEED: 32.0,
  SHURIKEN_COOLDOWN: 0.5,
  SHURIKEN_CAPACITY: 6,

  // Barricades & Planks (Fast urgent zombie breaches)
  PLANKS_PER_GATE: 6,
  PLANK_HP: 50, // Calibrated for fast, urgent barricade breaches
  PLANK_WIDTH: 2.2,
  PLANK_HEIGHT: 0.22,
  PLANK_THICKNESS: 0.05,
  REPAIR_TIME: 1.0, // Quick defense repair
  REPAIR_DISTANCE: 2.6,
  REPAIR_COST: 1, // scrap
  REPAIR_SCORE_REWARD: 50,

  // Enemies & AI Tuning
  MAX_ZOMBIES_ALIVE: 40,
  ZOMBIE_ATTACK_DIST: 0.85, // Decreased by >1m so player can dodge
  ZOMBIE_ATTACK_BREAKOFF: 1.15,
  ZOMBIE_DISINTEGRATE_TIME: 0.7,
  // Rain & Atmosphere Tuning
  RAIN_STREAKS_DEFAULT: 1600, // Reduced from 8000 for crystal clear visibility
  RAIN_OPACITY: 0.22,
  DEFAULT_ATMOSPHERE: 'midnight' as const,

  // Weapon Inspect Timings
  INSPECT_TIME_GUN: 2.2,
  INSPECT_TIME_SHURIKEN: 2.0,

  // Drop Chances & Economy (Zombies drop ammo, shurikens, health, and scrap)
  DROP_CHANCE_AMMO: 0.28,
  DROP_CHANCE_SHURIKEN: 0.22,
  DROP_CHANCE_HEALTH: 0.20,
  DROP_CHANCE_SCRAP: 0.25,
  PICKUP_DESPAWN_TIME: 25.0,
  PICKUP_MAGNET_DIST: 2.8,

  ZOMBIE_TYPES: {
    walker: {
      hp: 55,
      speed: 1.4,
      damage: 10,
      attackInterval: 1.1,
      plankDamage: 25, // 2 hits to break a 50HP plank (1.7s per plank)
      plankAttackInterval: 0.85,
      scale: 1.0,
      cost: 1,
    },
    runner: {
      hp: 30,
      speed: 3.2,
      damage: 7,
      attackInterval: 0.8,
      plankDamage: 18, // 3 fast hits to break a plank (1.65s per plank)
      plankAttackInterval: 0.55,
      scale: 0.95,
      cost: 2,
    },
    brute: {
      hp: 300,
      speed: 0.95,
      damage: 26,
      attackInterval: 1.7,
      plankDamage: 50, // 1 devastating hit shatters a plank (1.1s per plank)
      plankAttackInterval: 1.1,
      scale: 1.55,
      cost: 6,
    },
  },

  // Waves & Levels Progression
  TOTAL_WAVES: 10,
  INTERMISSION_TIME: 12.0,
  INTERMISSION_REWARD_CELLS: 4,
  INTERMISSION_REWARD_SCRAP: 5,

  // Quality Presets
  QUALITY: {
    low: {
      msaa: 0,
      shadowMapSize: 0,
      bloomScale: 0.25,
      rainStreaks: 800,
      dustMotes: 60,
    },
    medium: {
      msaa: 0,
      shadowMapSize: 512,
      bloomScale: 0.5,
      rainStreaks: 2000,
      dustMotes: 120,
    },
    high: {
      msaa: 4,
      shadowMapSize: 1024,
      bloomScale: 1.0,
      rainStreaks: 3500,
      dustMotes: 220,
    },
  },
} as const;

export type AtmosphereType = 'midnight' | 'sunset' | 'sunrise';

export const ATMOSPHERES = {
  midnight: {
    label: 'MIDNIGHT NOIR',
    skyTop: 0x04060c,
    skyBottom: 0x0c1426,
    skyExponent: 0.6,
    fogColor: 0x080c18,
    fogDensity: 0.018,
    hemiSky: 0x223355,
    hemiGround: 0x080c14,
    hemiIntensity: 0.45,
    sunColor: 0xaaccff,
    sunIntensity: 0.55,
    sunPos: [12, 25, -18] as const,
    celestialColor: 0xd8eeff,
    celestialPos: [120, 150, -180] as const,
    celestialScale: 1.0,
    rainOpacity: 0.22,
    rainSpeed: 1.0,
  },
  sunset: {
    label: 'BLOOD SUNSET',
    skyTop: 0x1e0e2e,
    skyBottom: 0xff4814,
    skyExponent: 0.42,
    fogColor: 0x26101d,
    fogDensity: 0.012,
    hemiSky: 0xff6638,
    hemiGround: 0x1f0e22,
    hemiIntensity: 0.95,
    sunColor: 0xff7728,
    sunIntensity: 1.45,
    sunPos: [-28, 9, -24] as const,
    celestialColor: 0xff6618,
    celestialPos: [-180, 26, -190] as const,
    celestialScale: 2.2,
    rainOpacity: 0.10,
    rainSpeed: 0.8,
  },
  sunrise: {
    label: 'GOLDEN DAWN',
    skyTop: 0x203c6e,
    skyBottom: 0xffba66,
    skyExponent: 0.5,
    fogColor: 0x1a2638,
    fogDensity: 0.011,
    hemiSky: 0x5a8acc,
    hemiGround: 0x222a36,
    hemiIntensity: 1.15,
    sunColor: 0xffe6a8,
    sunIntensity: 1.65,
    sunPos: [28, 14, -22] as const,
    celestialColor: 0xfff0c4,
    celestialPos: [180, 42, -170] as const,
    celestialScale: 1.7,
    rainOpacity: 0.04,
    rainSpeed: 0.6,
  },
} as const;
