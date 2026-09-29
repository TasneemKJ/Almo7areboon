# 12 — Collectible framing, rarity rhythm and negative space

Baseline: merged character-gesture PR #9, main merge `29aedffcf5638ceb53382258bf82e699d3729306`.

## Design philosophy
This pass uses **negative-space discipline**, **rarity rhythm**, **object grounding**, and **progressive ornament**. The collectible object remains the subject; framing grows around the perimeter instead of consuming its center. Common cards stay quiet, rare introduces one crest, epic uses three repeated accents, and legendary uses five with stronger brass edge rhythm.

The frame is intentionally a presentation grammar rather than thirty unrelated treatments. That gives the collection a museum/cabinet feeling while preserving the individuality of all thirty object drawings. A soft plinth and ground shadow give each object weight without turning the image into a miniature scene.

## Implementation
- Added `src/view/card-frame.ts` with four bounded rarity specs and a shared SVG framing grammar.
- Every card illustration now has explicit `card-frame`, `card-ground`, and `card-object` layers plus rarity metadata.
- The central clear radius stays at least 43 source pixels; ornament lives on the perimeter and lower plinth.
- All thirty existing object illustrations remain distinct.
- Collection cards and summon results expose `data-rarity` so the surrounding UI can reinforce the same hierarchy.
- Material-language CSS increases edge emphasis by rarity without animation, fixed overlays, extra menus or new assets.

## Verification
Five new regressions were observed RED against the previous system and GREEN after implementation. Fresh full suite: **224/224 passing**. TypeScript/Vite production build passed. Standalone asset QA still reports **216 faction poses, 36 sprite sheets, 12 bases, six foreground overlays and 30 cards with zero errors**.

A 30-card source-art contact sheet was rendered and inspected. It is asset QA, not a browser screenshot. Actual mobile/Safari layout, touch and measured performance remain unverified under the existing browser restriction.

This is refinement 12/40. No scheduler.
