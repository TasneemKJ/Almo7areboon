# 11 — Line of action and weight distribution

Baseline: merged crafted-UI PR #8, main merge `bf2dfbe22e7af68267a6e40c1b475cd5657610f3`.

## Design philosophy
This pass uses **line of action**, **weight distribution**, **anticipation/recoil**, and **role silhouette**. The six authored sprite frames remain the primary animation; the runtime adds only a small presentation transform so each role carries its mass differently.

Melee units commit their center of mass forward. Ranged units stay upright and recoil slightly instead of lunging. Heavy units compress under force rather than bouncing. These are small enough to preserve the established sprite art, collision reading and mobile-scale clarity.

## Implementation
- Added pure view model `src/view/character-gesture.ts` with bounded forward shift, lift, lean and x/y scale.
- Faction direction mirrors forward shift and lean; player/enemy geometry remains equivalent.
- Moving melee/ranged/heavy cadence is progressively steadier by role.
- Attack melee commits, ranged recoils and heavy compresses.
- Reduced-motion mode returns an exactly neutral transform.
- Battlefield composes gesture with existing sprite frames and hit reaction only at rendering time. Simulation positions, targeting, collision distances and attack timing are untouched.

## Verification
Five focused regressions were observed RED before implementation and GREEN afterward. Fresh full suite: **219/219 passing**. TypeScript/Vite production build passed; the existing Phaser vendor-size warning remains.

No sprite SVG source was changed, so prior asset-raster validation is not recounted as new art evidence. Browser/mobile/Safari and measured animation quality remain open under the existing browser restriction. This is refinement 11/40. No scheduler.
