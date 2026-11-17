# MIDNIGHT ROOFTOP: LAST STAND

> A tense, claustrophobic neon-noir first-person survival horror game built entirely from scratch with vanilla Three.js (WebGL2) and TypeScript.

---

## 1. Game Concept
Midnight on a storm-lashed city rooftop. The streets below have fallen to the undead horde. Armed with an **ARC-7 prototype pulse laser rifle**, a tactical flashlight, and salvaged wooden planks, you must hold off 10 waves of zombies emerging from three stairwell bulkheads until the dawn rescue helicopter arrives.

---

## 2. Controls (Desktop Only)
| Action | Key / Input |
|---|---|
| **Move** | `W`, `A`, `S`, `D` |
| **Sprint** | `Shift` (lowers weapon, blocks firing) |
| **Jump** | `Spacebar` (jump onto crates & vantage decks) |
| **Look** | Mouse (Pointer Lock) |
| **Aim Down Sights (ADS)** | `Right Mouse Button` (Hold to zoom FOV & center weapon) |
| **Fire / Throw** | `Left Mouse Button` |
| **Inspect Weapon** | `T` or `I` (Gun chamber check / Shuriken airborne spin & catch) |
| **Weapon Slots** | Keys `1`, `2`, `3` or `Mouse Scroll Wheel` |
| **Slot 1: ARC-7 Pulse Laser** | Full-auto pulse rifle (6 shots/sec, 30-round cell) |
| **Slot 2: Talon-9 Tactical Pistol** | Heavy semi-auto sidearm (48 DMG, clean matte finish) |
| **Slot 3: Cyber-Shuriken** | High-velocity aerodynamic ninja star (90 DMG slice) |
| **Reload** | `R` (1.7s cell/mag swap) |
| **Toggle Flashlight** | `F` |
| **Cycle Atmosphere** | `O` (Cycle Midnight Noir / Blood Sunset / Golden Dawn) |
| **Repair Gate Plank** | Hold `E` (within 2.5m of doorway, costs 1 scrap) |
| **Skip Intermission** | `Enter` or `N` |
| **Pause & Settings** | `Esc` (Audio sliders & Sensitivity calibration) |
| **Mute Audio** | `M` |
| **Toggle Debug HUD** | `F3` or `~` (or URL `?debug=1`) |

---

## 3. Advanced Combat & Survival Mechanics
- **Aim Down Sights (ADS):** Holding Right Mouse Button zooms camera FOV from 75° to 50°, damps look sensitivity, and centers the active firearm/tritium sights for pinpoint precision.
- **Three-Tier Arsenal:**
  - *ARC-7 Laser Rifle:* Continuous rapid fire for crowd suppression.
  - *Talon-9 Plasma Pistol:* High single-shot damage and ammo efficiency.
  - *Cyber-Shuriken:* Throw razor stars at oncoming zombies with slice criticals.
- **Verticality & Climbable Vantage Decks:** Jump across stepped crates (0.6m, 1.2m) to reach elevated 1.8m sniper platforms to rain fire on horde clusters.
- **Void Abyss Peril:** The rooftop perimeter has low parapets; falling over the edge into the abyss triggers terminal velocity free-fall and instant death.
- **Floating Combat Damage Text:** Direct hits pop floating damage indicators above enemy heads (cyan regular hits, orange critical/slice damage).
- **Barricade & Breach Alarm:** Zombies rapidly batter stairwell barricades plank by plank (Walkers break a plank in ~1.7s, Runners in ~1.65s, Brutes shatter a plank in a single 1.1s blow). Full breaches trigger siren warnings and horde rush, demanding urgent barricade defense and repair.
- **Dynamic Wave Progression:** Wave 1 starts with 4 slow walkers, progressively ramping up enemy density and movement speeds across 10 levels.
- **Psychological Horror & Dizziness Hallucinations:**
  - *Horror Disclaimer Screen:* Before entering the game, a grim neuro-trauma advisory warns that zombies can turn invisible when you are dizzy. Clicking anywhere launches the game and locks controls.
  - *Dizziness Cloaking Mechanic:* When the player suffers heavy concussive strikes (`hitAberration > 0.15`) or low health ($<40\%$), perceptual collapse causes zombies to periodically vanish into pitch darkness as invisible phantoms. Attacking claw swings or player weapon impacts momentarily illuminate them.
- **Reference-Accurate Anatomical Zombie Models:**
  - *The Walker:* Realistic human proportions with forward spinal slump, snarling grimace with exposed teeth, cloudy dead white eyes, open khaki work shirt over dark undershirt with blood stains, and classic worn blue denim jeans with gaping ripped knee holes revealing raw red decaying muscle tissue.
  - *The Brute:* Colossal muscular tank silhouette with massive trapezius shoulders, bulging vascular biceps, broad barrel chest, ragged work shirt wide open over a stained white ribbed tank top with deep bloody claw gashes, dark charcoal work pants with silver belt buckle, and heavy combat boots.
- **Dynamic Sky & Atmosphere Engine:**
  - *Midnight Noir:* Deep blue-black rainstorm, moonlit reflections, wet asphalt gloss, thunder/lightning flashes, and heavy rain streaks.
  - *Blood Sunset:* Dramatic golden-hour horizon with a low crimson-orange sun disk casting long rooftop shadows and amber volumetric sky bloom.
  - *Golden Dawn:* Crisp morning sun rising above the skyline, gentle mist, soft warm ambient lighting, and serene dawn winds.
  - *Real-Time Switching:* Change atmospheres dynamically via the pause/settings menu, press `O` to cycle anytime, or pass URL parameters (`?atmosphere=sunset`, `?atmosphere=sunrise`).

---

## 3. Technology & Architecture
- **Vanilla Three.js (WebGL2):** Zero UI/3D abstraction frameworks (no React, no Tone.js, no external physics libraries).
- **Dual-Scene Multi-Pass Pipeline:** World Scene and Weapon Scene rendered with independent cameras to eliminate wall-clipping, processed through `UnrealBloomPass`, `OutputPass`, and custom `FinalFX` post-processing.
- **Procedural Synthesized Assets:**
  - 100% code-generated 3D geometry (`RoundedBoxGeometry`, instanced meshes).
  - Procedural HTML5 Canvas textures (concrete, puddles, wood grain, holo HUDs).
  - Pure Web Audio API synthesis (cross-plane V8 / laser synthesis, noise explosions, algorithmic IR reverb, ambient storm).
- **Deterministic 60Hz Physics & Logic:** Fixed-timestep accumulator loop with analytic sphere/AABB hitboxes.

---

## 4. Design Decisions
- *Canvas-Synthesized Textures:* Generating albedo, normal, and roughness maps directly via 2D Canvas routines avoids loading external image assets while achieving micro-scratch metal reflections and wet concrete puddles.
- *Dual-Scene Rendering:* Keeping the weapon in a dedicated `weaponScene` with its own camera prevents the viewmodel from penetrating nearby props and walls during tight cornering.
- *Analytic Ray-Sphere Hit Testing:* For an arcade shooter with up to 40 fast-moving entities, analytic ray-sphere intersections achieve sub-millisecond precision with zero memory allocation.

---

## 5. Development & Build Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript strict type-check & production build
npm run build

# Preview production build locally
npm run preview
```
