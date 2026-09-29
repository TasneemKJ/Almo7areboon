# 15 — Environmental storytelling without road clutter

Baseline: `main` at `546f13c12bed149d6c48d1862875ba7a5588b1a1` when the branch was created.

## Design philosophy
This pass uses **environmental storytelling**, **affordance**, **implied human presence**, and **selective detail density**. The goal is to make settlements feel lived in without putting more visual noise into the combat corridor. Props are functional rather than decorative: they imply water, food, work, trade, maintenance and cultivation.

The chapter vocabulary remains fictional and deliberately non-sacred/non-militarized. No real population, religious icon, modern conflict symbol or copied site plan is introduced. The six chapters carry distinct functional prop sets instead of one repeated market kit.

## Chapter vignettes
- **First Fires:** water jars, stacked firewood, a woven mat and suspended herb rack.
- **Olive Terraces:** harvest baskets, irrigation bucket, terrace ladder and press crates.
- **Harbor Watch:** rope coils, fishing net, quay crates and storage jars.
- **Lantern Quarter:** copper tray, tool rack, fabric rolls and a small workbench.
- **Hillside Watch:** rooftop water tank, civilian antenna, cable spool and utility box.
- **Courtyards Beyond:** garden planter, water node, solar canopy and service pod.

## Implementation
- Added `src/view/environment-vignettes.ts` as source-art-only presentation code.
- Every vignette has an explicit functional identifier and source-space y coordinate.
- Each chapter has at least four distinct clusters; all cluster anchors stay at or above source y 585.
- The layer is inserted after settlement architecture and before generic material detail, so it enriches the authored place without touching the road or foreground occlusion plane.
- No new textures, network assets, dependencies, UI panels, timers, saves, action IDs or simulation state.

## Verification
The five new regressions were first run against the branch with no production module: **236 prior tests passed and all five new tests failed** for the expected missing-module/integration reasons. After implementation, the targeted five passed.

Fresh full verification on the same recovered Actions workspace:
- `npm test`: **241/241 passing**.
- `npm run build`: passed; the existing Phaser chunk-size warning remains.
- Standalone art QA: **216 faction poses, 36 sprite sheets, 12 bases, six foreground overlays, 30 cards, zero errors**.
- Dusk source QA: 18 animated compositions + six reduced-motion compositions, **zero changed pixels in the protected road mask `[0,615,900,760]`**.
- Levantine scene heuristics: all six scenes retain zero road-overlay alpha and road/near-ground luminance ratios from **2.151 to 2.520**.

These are source-art and build checks, not browser/game screenshots, mobile touch evidence, Safari verification or measured frame-rate evidence. The existing browser restriction was not bypassed.

This is refinement 15/40. No scheduler.
