# 18 — Cinematic grade: value range, practical light and team reading

Baseline: `c23d7b2` (main after #20).

## Why
Batches 04–17 kept every light field at alpha ≤ 0.1 and avoided shader state. Each was individually tasteful, but together the battlefield sat inside one narrow mid-grey band: sky, buildings, road and troops shared a value, nothing glowed, and blue and red armies were separated only by small accents. This pass supplies the missing value and colour range.

## What changed
- **Camera colour grade** (`gradeMatrix`): per-chapter saturation about Rec.709 luma, contrast about mid-grey and a split-tone gain/lift, applied as one `postFX` ColorMatrix pass on WebGL only. Canvas renderers keep the ungraded, still-lit scene.
- **Stage vignette** (`vignetteStops`): one cached 256² radial texture per chapter with a clear centre on the lane, and receding edges plus a darker empty foreground strip. It sits beneath health bars and HUD text.
- **Key light rays** (`keyLightRays`): 4–6 faint additive shafts fanning from each chapter's practical light onto the lane. Alpha ≤ 0.06; they hold still under reduced motion.
- **Team beacons and halos** (`stageGlow`, `teamHalo`): a cool cyan pool at the player outpost and an ember pool at the enemy's, which brighten as a base weakens. Every troop gets an additive team-coloured ground halo that flares on hit and turns icy when frozen.
- **Additive combat light** (`projectileGlow`, flares): bullets, arrows, shells, energy bolts and meteors carry a light and trail; stones stay unlit. Impacts, spawns, deaths and victory emit short flares. Meteor and victory add a brief camera flash. Everything that flashes is skipped under reduced motion.
- **Foreground mist** (`foregroundMist`): four slow bands in the strip below the lane, never above `groundY+34`.

## Rejected
Phaser's `Bloom` FX has no threshold: at any useful strength it blurred and milked the entire frame, including base HP numbers. It was removed, and a source contract now forbids `addBloom`. Glow comes only from the explicit additive layers.

## Verification
- `tests/cinematic-grade.test.ts`: nine tests covering grade bounds (no clipped whites, no crushed shadow steps, widened mid-tones, richer muted colour), vignette monotonicity and clear lane, ray and mist bounds, reduced-motion stillness, team hue separation, and source contracts (WebGL-only grade, additive layers, bars above glow, no flash under reduced motion).
- Full suite 261/261; production build passes.
- **Rendered browser check**: headless Chromium (SwiftShader WebGL) at 430×900 @2x, all six chapters, a live battle with deployments, and zero page errors. Evidence: [before/after](evidence/18-before-after.jpg) and [six-chapter grid](evidence/18-v3-grid.jpg). Real-device, Safari and low-end GPU performance remain unmeasured.
