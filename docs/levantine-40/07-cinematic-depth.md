# 07 — Cinematic depth: detail falls away with distance

## Design philosophy
The concept-art target uses **atmospheric perspective**, **detail falloff**, **balanced asymmetry**, and **rhythm/repetition**. The horizon should not compete with the playable layer. Small, low-contrast houses and cypress silhouettes sit far away; stronger banners, torches and landmark accents increase in visual weight toward the settlement focal area. This converts the scene from a flat collection of shapes into a depth hierarchy.

The goal is not cinematic darkness. Warm practical accents sit against cool dusk fields while the combat road remains neutral. This is a figure/ground decision: actions and units must win the contrast competition during play.

## Implementation
- Added `src/view/cinematic-depth.ts` and inserted it between the distant-landscape and focal-settlement layers.
- Every chapter has at least three far-detail groups and five mid-detail groups with increasing authored visual weight.
- Far forms include haze, small inhabited buildings and cypress rhythm. Chapter-specific silhouettes add harbor boats, terrace contours, future beacons or distant paths.
- Mid forms use faction-neutral landscape geometry with blue/coral banners as navigation accents, restrained torches and chapter-specific props.
- All source clusters stay at or above y 590, clear of the road.
- Existing scenery, unit, gameplay, sound, saves and UI controls remain structurally unchanged.

## Verification
Four new depth tests were observed failing before implementation and passing afterward. Fresh combined suite after material + depth passes: 197/197. TypeScript/Vite production build passed. Full standalone art QA remained clean: 216 poses, 36 atlases, 12 bases, six foreground overlays and 30 cards, zero errors.

The design review board compares exact source art before/after. It is asset QA, not a rendered gameplay screenshot. Browser, Safari/iOS, touch and measured performance remain open gates.

This is the seventh connected refinement toward forty.
