# 18 — Cinematic grade: value range, practical light and team reading

Baseline: `c23d7b2` (main after #20).

## Why
Batches 04–17 kept every light field at alpha ≤ 0.1 and avoided shader state. Each was individually tasteful, but together the battlefield sat inside one narrow mid-grey band: sky, buildings, road and troops shared a value, nothing glowed, and blue and red armies were separated only by small accents. This pass supplies the missing value and colour range.

## What changed
- **Baked colour grade** (`gradeMatrix`, `gradePixels`): per-chapter saturation about Rec.709 luma, contrast about mid-grey and a split-tone gain/lift. It is baked once per chapter into the landscape, foreground, outpost and troop-sheet textures when that chapter is first shown. There is no per-frame cost, and Canvas and WebGL look the same. A tainted or unavailable canvas leaves the art ungraded and never throws.
- **Baked stage finish**: static key-light rays (additive) and the stage vignette are painted into the landscape and foreground art in their own source space. The vignette's clear core (`vignetteAlphaAt`) covers the whole lane, *including both outposts*, so only sky, corners and the empty foreground strip recede. `source-atop` keeps transparent foreground pixels transparent.
- **Live soft light**: cool-cyan and ember team beacons that brighten as a base weakens, plus slow foreground mist. Each is one tinted quad from a cached radial-falloff texture, not tessellated nested ellipses.
- **Team halos** (`teamHalo`): an additive team-coloured ground halo per troop that flares on hit and turns icy when frozen.
- **Additive combat light** (`projectileGlow`, flares): bullets, arrows, shells, energy bolts and meteors carry a light and trail; stones stay unlit. Impacts, spawns, deaths and victory emit short flares, and meteor and victory add a brief camera flash. Everything that flashes is skipped under reduced motion.

## Rejected after devil's-advocate review (PR #21)
- **Phaser `Bloom`**: it has no threshold, so it milked the whole frame. A contract forbids it.
- **Camera `postFX` ColorMatrix**: it cost ~20% frame rate every frame for a static grade.
- **Per-frame vignette and ray layers**: full-screen blended quads are fill-rate bound; the vignette alone cost ~5 fps under SwiftShader. The first vignette also darkened both outposts by 23–27%.

Frame rate (headless Chromium, SwiftShader, 430×900 @2x, chapter 4, 3 runs): main **41–42 fps**; first draft **32**; final **36.5–39**. The remaining ~10% comes from live beacons, mist, halos and combat glow.

## Verification
- `tests/cinematic-grade.test.ts`: eleven tests covering grade bounds (no clipped whites, no crushed shadow steps, widened mid-tones, richer muted colour), vignette monotonicity and clear lane, ray and mist bounds, reduced-motion stillness, team hue separation, and outpost-clear vignette, pixel-bake parity with the matrix, and source contracts (no postFX or bloom, no full-screen per-frame layers, `source-atop` bake, bars above glow, no flash under reduced motion).
- Full suite 263/263; production build passes.
- **Rendered browser check**: headless Chromium (SwiftShader WebGL) at 430×900 @2x, all six chapters, a live battle with deployments, and zero page errors. Evidence: [before/after](evidence/18-before-after.jpg) and [six-chapter grid](evidence/18-grid.jpg). Real-device, Safari and low-end GPU performance remain unmeasured.
