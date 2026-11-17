# PROGRESS.md — Milestone Checklist & Implementation Status

## Project Status: M0 → M8 Complete (Definition of Done Met)

| Milestone | Description | Status | Verification Criteria | Artifact / Verification |
|---|---|---|---|---|
| **M0: Setup** | Vite + strict TS scaffold, Three.js, fixed-timestep loop, composer with test cube | ✅ COMPLETE | Build passes, scene renders with post-processing | `docs/screenshots/m0-setup.png` |
| **M1: World & Player** | Rooftop slab, parapet, bulkheads, props, colliders, sky/city/fog, lighting, pointer-lock player | ✅ COMPLETE | 60 FPS walk, collision push-out, pause/resume flow | `docs/screenshots/m1-world.png` |
| **M2: Laser Rifle & FX** | ARC-7 procedural model, capacitor coils, holo HUD, spring recoil, 3-layer laser beam, impacts, audio | ✅ COMPLETE | Passes Laser Quality Gate (T16) | `docs/screenshots/m2-idle.png`, `docs/screenshots/m2-firing.png` |
| **M3: Zombies & AI** | Procedural zombie models, walk cycles, pooling (max 40), ray-sphere hitboxes, dissolve, drops | ✅ COMPLETE | 40 active zombies at 60 FPS, headshots, disintegration | `docs/screenshots/m3-zombies.png` |
| **M4: Barricades & Repair**| 3 bulkheads x 6 planks, damage stages, ballistic plank break, hold-E repair, gate HUD | ✅ COMPLETE | Gates can be battered, broken, and rebuilt | `docs/screenshots/m4-barricades.png` |
| **M5: Waves & Flow** | 10-wave director, budget economy, intermission, win/loss conditions, restart without reload | ✅ COMPLETE | Full 10-wave playthrough completable | Tested with automation hooks (`window.__game`) |
| **M6: Atmosphere** | Volumetric flashlight cone + dust, rain streaks + splashes, lightning/thunder, FinalFX | ✅ COMPLETE | Atmospheric noir tone, low-HP visual effects | `docs/screenshots/m6-atmosphere.png` |
| **M7: Audio Polish** | Complete synthesized soundscape: footsteps, zombie growls/screams, ambient loops, rescue chopper | ✅ COMPLETE | 100% synthesized via raw Web Audio API | `src/audio/AudioEngine.ts`, `Sfx.ts`, `Ambience.ts` |
| **M8: Polish, QA & Docs** | Quality presets, adaptive resolution, leak audit, README, final screenshot verification | ✅ COMPLETE | 0 TS errors, 0 console errors, clean preview test | `docs/screenshots/m8-dawn.png` |
| **M9: Combat & Mobility Overhaul** | Flashlight rebalance, ADS (RMB zoom), Jump (Space), Talon-9 Pistol, Cyber-Shuriken, Damage Numbers, Climbable Decks, Void Fall Death, Zombie Attack Anims | ✅ COMPLETE | Tested & verified with headless screenshots & clean builds | `docs/screenshots/ads-view.png`, `pistol-slot.png`, `shuriken-slot.png`, `climb-vantage.png` |
| **M10: Polish & Systems Upgrade** | ADS bullet origin centered, Settings panel (Master/SFX/Ambience volume & Sensitivity), Simplified tactical pistol, Weapon inspect anims (T/I), Soft rain density, Solid spawn ground & open doorways, Level banner animation, Multi-item zombie drops (Ammo, Shuriken, Medkits) | ✅ COMPLETE | Tested & captured | `docs/screenshots/settings-menu.png`, `level-transition.png`, `zombie-drops.png`, `ads-fire.png` |
| **M11: Dynamic Celestial Atmospheres** | Procedural sky dome shader gradients, dynamic celestial disks (Moon/Sun), directional shadow angles, color-shifted hemisphere ambient, fog density/color, weather/rain modulation, ambient audio filters, settings UI selector & real-time `O` key switcher | ✅ COMPLETE | Tested & captured | `docs/screenshots/sunset.png`, `sunrise.png`, `settings-atmo.png` |
| **M12: Horror Disclaimer & Dizziness Invisibility** | Intro psychological horror disclaimer with "Zombies can be invisible when dizzy" warning, click anywhere to start flow, and gameplay dizziness hallucination where zombies become cloaked phantoms when player is wounded | ✅ COMPLETE | Tested & captured | `docs/screenshots/horror-disclaimer.png`, `boot-disclaimer.png` |
| **M13: Reference-Accurate Zombie Overhaul** | Walker with faded blue denim jeans, ripped knee holes with exposed gore, open khaki work shirt with lapels over dark stained undershirt; Brute Tank with massive muscular barrel chest, trapezius boulders, open work shirt over dirty white tank top with claw gashes, charcoal trousers, belt buckle, and heavy combat boots | ✅ COMPLETE | Tested & captured | `docs/screenshots/walker-zombie.png`, `brute-zombie.png`, `zombies-showcase.png`, `zombies-sunset.png` |
| **M14: Rapid Barricade Breach Rebalance** | Planks recalibrated to 50 HP (down from 140); Walker plank damage 25 at 0.85s (breaks plank in 1.7s), Runner plank damage 18 at 0.55s (breaks plank in 1.65s), Brute plank damage 50 at 1.1s (1-hit plank shatter); barricades now feel dangerous, urgent, and require active defense and repair | ✅ COMPLETE | Verified via simulation and builds | `src/config.ts`, `src/world/Barricade.ts` |

---

## Verification Summary
- **TypeScript Compilation:** 0 errors (`npx tsc --noEmit` exits with 0).
- **Production Build:** Passes cleanly (`npm run build` bundles in under 1 second).
- **Dual-Scene Setup:** World in `worldScene`, viewmodel in `weaponScene` with depth clearing to eliminate geometry clipping.
- **Weapon System:** 3 switchable slots (`1` ARC-7 Laser, `2` Talon-9 Plasma Pistol, `3` Cyber-Shuriken) with custom procedural viewmodels, projectile physics, and audio synthesis.
- **Precision Combat:** Right-click hold Aim Down Sights (ADS) zooms camera FOV from 75° to 50° and centers viewmodels for precision aiming.
- **Verticality & Mobility:** Full 3D jumping with gravity, rooftop stepped crates (0.6m, 1.2m) and elevated sniper platforms (1.8m), with void detection for falling off the perimeter.
- **Audio Synthesis:** Zero external audio files; all laser blasts, plasma pistol shots, shuriken whooshes/hits, servo reloads, footsteps, rain, wind, thunder, zombie growls, and chopper rotors synthesized via raw Web Audio API.
- **Atmosphere & FX:** Instanced rain streaks with wind vertex slant, toned-down volumetric flashlight cone with soft-fade shader + floating dust motes, and `FinalFX` post-processing pass with vignette, film grain, and low-HP chromatic aberration.
