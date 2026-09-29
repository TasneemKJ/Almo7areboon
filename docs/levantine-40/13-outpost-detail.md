# 13 — Outpost architectural micro-detail

Baseline: merged collectible-art PR #10, main merge `df188d6f708eb8b630df0120aaa8544a74dd73c7`.

## Design philosophy
This pass applies **material legibility**, **tectonic detail**, and **silhouette preservation** to the twelve combat outposts. The base shape remains the first read; small architectural cues explain construction and chapter identity without expanding the footprint or turning the outpost into background clutter.

Faction identity remains heraldic rather than architectural. Player and enemy use identical geometry; only blue/coral accent and bright trim colors change. This keeps the two sides visually distinct without implying different cultures or civilian architecture.

## Implementation
- Added `src/view/outpost-detail.ts` with six bounded detail grammars.
- First Fires adds stone scoring, rope and pegs; Olive Terraces adds brackets, jars and shutters; Harbor Watch adds hinges, mooring ring/rope and drainage hardware; Lantern Quarter adds canopy/workshop fittings; Hillside Watch adds radio/cable/plate detail; Courtyards Beyond adds luminous seams and panel hardware.
- All detail stays within the authored 160×160 base boundary and is inserted before practical-light rendering.
- Player/enemy geometry is byte-equivalent after faction color normalization.
- No base size, origin, health logic, collision, damage-stage behavior, game state or save data changes.

## Verification
Five focused regressions were observed RED before implementation. Four went GREEN immediately; one test then exposed an overbroad external-URL regex that matched the mandatory SVG namespace. The test was narrowed to external `href`/`src` content and the same production implementation then passed all five checks.

Fresh full suite: **229/229 passing**. TypeScript/Vite production build passed. Standalone asset QA still reports **216 faction poses, 36 sprite sheets, 12 bases, six foreground overlays and 30 cards with zero errors**.

A 12-base source-art contact sheet was rendered and inspected. It is asset QA, not a browser/game screenshot. Browser/mobile/Safari and measured runtime performance remain unverified under the existing browser restriction.

This is refinement 13/40. No scheduler.
