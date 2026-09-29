# 10 — Ornament as structure in the interface

Baseline: merged lighting-hierarchy PR #7, main merge `5631c7a70c58061239a27a85a570b0dd39b2fa3e`.

## Design philosophy
The interface now follows **material honesty**, **tectonics**, and **ornament as structure**. Decoration belongs where parts meet: seams, card frames, heading rules, dialog edges and selected navigation. It should explain hierarchy and affordance rather than fill empty space.

Parchment gets only a faint directional fiber impression; enamel controls use edge light and a darker foot; brass is reserved for seams and selection. The playfield itself is excluded from this craft layer so world readability is not traded for UI richness.

## Implementation
- Added `src/ui/material-language.css`, loaded after baseline and continuation styles.
- Defines a small craft token set for brass highlight/mid/shadow, stone, paper line and ink.
- Adds a single brass seam at the tactical deployment boundary, inset unit-card frames, heading rules, button bevels, dialog/card edge language and a restrained navigation seam.
- No new HTML panels, fonts, image URLs, animations, fixed overlays or playfield selectors.
- Existing touch target dimensions remain owned by the baseline CSS.

## Verification
Five source-contract regressions were observed RED before the craft layer existed and GREEN afterward. Fresh full suite: **214/214 passing**. TypeScript/Vite production build passed. CSS payload increased only through this small local stylesheet; the pre-existing Phaser vendor-size warning remains.

This is CSS/source verification, not rendered mobile acceptance. The earlier browser restriction remains; no screenshot, Safari/touch or measured frame-rate claim is made. This is the tenth connected refinement toward forty. No scheduler.
