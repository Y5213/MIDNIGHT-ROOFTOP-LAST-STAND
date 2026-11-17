# AGENTS.md — Standing Operational Guidelines
**Project:** MIDNIGHT ROOFTOP: LAST STAND (v1.0)
**Role:** Senior Real-Time Graphics & Gameplay Engineer / Technical Artist

---

## 1. Stack & Hard Rules (Non-Negotiable)
- **Engine & Core:** Vite + TypeScript (strict) + `three` (latest stable WebGL2) + `@types/three`. Vanilla Three.js (NO React / react-three-fiber).
- **Post-Processing:** `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass`, custom `ShaderPass` for FinalFX (vignette, film grain, damage tint, chromatic aberration).
- **Zero External Assets & No CDNs:** No external 3D models, textures, or audio files. All geometries are procedurally generated in code; all textures are synthesized on HTML5 Canvases; all sound effects and ambiences are synthesized via the raw Web Audio API.
- **Strictly Forbidden in v1:** WebGPURenderer / TSL, WASM physics engines (Rapier / Jolt / Ammo), Web Workers / SharedArrayBuffer / COOP-COEP headers, compute shaders, WebSockets / multiplayer, Tone.js, GLB / FBX models, navmesh / external A* libraries. Must deploy cleanly as a static web application.
- **Deterministic Imports:** Confirm every `three/addons/...` import exists physically under `node_modules/three/examples/jsm/` before using it. Zero deprecation warnings.
- **Quality & Hygiene:**
  - Zero TypeScript compile errors (`tsc --noEmit`).
  - Zero browser console errors or warnings during gameplay.
  - Files kept under ~400 lines; single-responsibility modules.
  - No TODO stubs or placeholder hacks.
  - Every single tunable value lives in `src/config.ts`.
  - `LASER_COLOR = 0x00e5ff` is the single source of truth for all weapon and UI glow themes.

---

## 2. Target File Architecture
```
src/
  main.ts          # State machine: MENU | PLAYING | PAUSED | INTERMISSION | GAMEOVER | VICTORY
  config.ts        # Single source of truth for all tunable numbers
  core/
    Loop.ts        # Fixed 60Hz logic step + accumulator + clamped delta
    Input.ts       # PointerLock, smoothed mouse delta, keyboard state, touch check
    Pool.ts        # Generic Object Pool for zero runtime allocations
    Quality.ts     # Quality presets (Low / Med / High) & adaptive resolution scale
    Debug.ts       # FPS / Draw call / Triangle / Entity HUD & test hooks (?debug=1)
  render/
    Renderer.ts    # WebGL2 renderer, dual-scene composer, multi-pass pipeline
    Lighting.ts    # Fixed light rig (Hemisphere, Moon, Neon points, Muzzle/Impact lights)
    Sky.ts         # Sky gradient dome, moon, procedural 70-building neon skyline
    Rain.ts        # 3,500 instanced rain streaks (vertex shader animated) + splash sprites
    Flashlight.ts  # Volumetric soft-edge cone shader + 200 drifting dust motes
    FinalFX.ts     # Post-tonemap ShaderPass: vignette, grain, low-HP desat, aberration
    TextureFactory.ts # Canvas texture generator (concrete, puddles, wood, scratches, holo)
  world/
    Rooftop.ts     # 36m x 28m concrete slab, 1.2m parapet, painted helipad H
    Props.ts       # Water tower on legs, AC units, crates, fuel drums, antenna mast
    Colliders.ts   # Static AABB list + player circle push-out & slide physics
    Bulkhead.ts    # 3 stairwell sheds (North, East, West) with 2.4x2.4m doorways
    Barricade.ts   # 6 procedural wooden planks per gate, damage stages, ballistic break
  player/
    Player.ts      # Kinematics, walking/sprinting, head-bob, HP, damage feedback
    LaserRifle.ts  # ARC-7 procedural 3D model, materials, capacitor coils, holo HUD
    WeaponController.ts # Spring-mass-damper recoil, animations, ammo, reload sequence
    BeamFX.ts      # 3-layer additive laser beam, travelling pulse head, lens flare
    ImpactFX.ts    # Sparks, impact flare, scorch decals, point light pulse
    Pickups.ts     # Bobbing glowing scrap & energy cell drops with magnetic attract
  enemies/
    ZombieModel.ts # Procedural articulated zombie mesh, emissive eyes, grime
    Zombie.ts      # AI state machine: Spawn -> AttackGate -> Breach -> Chase -> Attack
    ZombieManager.ts # Entity pool (up to 40 active), spatial update, death dissolve
    HitTest.ts     # Analytic ray-sphere & ray-AABB tests for hitscan combat
    WaveDirector.ts # 10-wave point budget, spawn intervals, composition, intermission
  audio/
    AudioEngine.ts # Web Audio context, master compressor, algorithmic IR reverb
    Sfx.ts         # Synthesized laser blast, impact sizzle, reload servos, plank break
    Ambience.ts    # Synthesized rain, howling wind, rolling thunder, rescue chopper
  ui/
    HUD.ts         # Sci-fi DOM overlay: dynamic crosshair, ammo bar, gate status, HP
    Menus.ts       # Title screen, pause settings, game-over, victory stats
    styles.css     # Minimal neon-noir CSS styling, zero CSS libraries
```

---

## 3. Performance Targets
- **Framerate:** $\ge 60$ FPS at 1080p on integrated graphics with 40 zombies active.
- **Draw Calls:** $\le 300$ draw calls typical.
- **Zero Garbage Collection Spikes:** Zero Vector3 / Quaternion / Matrix allocations in the `update()` or `render()` loops. All calculations reuse cached module-level temporaries.
- **Shader Stability:** All scene lights are allocated once at initialization and never dynamically added or removed from the scene graph.

---

## 4. Definition of Done
1. `npm run build` succeeds with 0 TypeScript errors.
2. `npm run preview` runs with 0 console errors or warnings across a full 10-wave playthrough.
3. Complete gameplay loop verified: Title $\to$ Waves 1–10 $\to$ Dawn / Victory (or Defeat) $\to$ Clean restart without page reload.
4. Laser Quality Gate (T16) verified with screenshots.
5. All 9 Milestones (M0–M8) documented with verified screenshots in `docs/screenshots/`.
