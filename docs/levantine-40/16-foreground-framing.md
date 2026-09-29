# 16 — Asymmetric foreground framing and edge depth

Baseline: merged environmental-storytelling PR #16, main merge `04396e211e060aacebbe61bb04d114e52baf2c47`.

## Design philosophy
This pass applies **frame-within-a-frame composition**, **asymmetric balance**, **occlusion depth**, and **negative-space protection**. The near camera edge should feel materially close and chapter-specific, but the player still needs a clean visual tunnel through the center of the battlefield.

The existing foreground treatment used broadly mirrored edge geometry. This refinement keeps those structural plants/stones while adding small left/right vignettes that deliberately differ from each other. The result should feel composed rather than mirrored, with the center left open for combat.

## Chapter framing
- **First Fires:** lantern shelf / reed basket on the left; olive rock / jar step on the right.
- **Olive Terraces:** harvest baskets / terrace stone; vine post / grape crate.
- **Harbor Watch:** rope post / mooring jars; net bundle / sail cloth.
- **Lantern Quarter:** pottery step / brass lantern; awning edge / tool crate.
- **Hillside Watch:** utility railing / planter; antenna edge / cable rail.
- **Courtyards Beyond:** garden arch / light stone; luminous planter / service rail.

## Implementation
- Added `src/view/foreground-vignettes.ts` with six distinct asymmetric left/right compositions.
- Every authored anchor carries `data-side`, `data-vignette`, `data-x`, and `data-y` metadata for verification.
- All x anchors stay at or beyond the edge bands (`x <= 160` or `x >= 740`); all y anchors live in the foreground depth band (`790–985`).
- The vignette layer is included only in the standalone foreground overlay, preserving the existing renderer sandwich above actors and below combat cues.
- No new texture entries, scene objects, shaders, dependencies, game state, actions, saves or timers.

## Verification
Five focused tests were observed RED before the new grammar/integration and GREEN afterward.

Fresh full verification on the exact recovered refinement-15 workspace:
- `npm test`: **246/246 passing**.
- `npm run build`: passed; the existing Phaser chunk-size warning remains.
- Standalone art QA: **216 faction poses, 36 sprite sheets, 12 bases, six foregrounds, 30 cards, zero errors**.
- Levantine scene heuristics: every chapter still reports **road-overlay alpha 0** and road/near-ground ratios between **2.151 and 2.520**.
- A six-panel foreground contact sheet was rendered and inspected as **ASSET QA**. The center remains visibly open while left/right framing differs by chapter.

These checks do not establish browser/mobile/Safari/touch/frame-rate acceptance. The existing browser restriction was not bypassed.

This is refinement 16/40. No scheduler.
