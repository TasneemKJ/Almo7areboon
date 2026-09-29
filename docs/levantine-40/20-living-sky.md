# 20 — Living sky

Baseline: `d601f81` (main after #25).

## Audit finding
Once #24 let the chapter intro recede during combat, the upper third of every chapter was exposed as a large, static, empty sky. It was the least alive part of the frame.

## What changed (`src/view/living-sky.ts`)
- **Parallax cloud banks**: three depth banks (3+3+2 clouds). Far clouds are small, pale and slow; near clouds are larger, shaded and faster. Each cloud is a shaded base, a lit body and a warm crest, tinted per chapter (rose dusk for chapters 1–5, cold blue for chapter 6). They are drawn as pooled quads of the existing soft-light texture.
- **Twinkling stars**: 12–30 per chapter (most in chapter 6), twinkling out of phase and held still under reduced motion.
- **Shooting star**: at most one per 11s window, visible for 0.7s, and never under reduced motion.
- Everything stays inside the band above the tallest authored skyline (`SKY_CEILING` = .42 × groundY), and all of it is drawn behind outposts, troops and scenery.

A first pass at `cloudAlpha` ≈ .2 was invisible once the soft texture's falloff applied, repeating the low-energy mistake #18 fixed. It was raised about 2.3×.

## Verification
Five new tests (bounds, parallax ordering, reduced-motion stillness, shooting-star frequency of 3–10% of the time, and layer order). 273/273; build passes; six-chapter render with zero page errors. Evidence: [sky before/after](evidence/20-living-sky.jpg).
