# Illustrated visual overhaul — 2026-09-29

Branch: `feat/illustrated-visual-overhaul`; PR #2. Base: merged core commit `474fe734f3f05d3d979d95d807197cfd7ffd3e15`.

## Delivered presentation

Six original illustrated environments replace the single flat field: emerald cliffs and a waterfall; golden farmland and windmills; a marble coast; a sunset citadel; a wooded modern frontier; and an alien landscape. The actual campaign identities remain Stone, Farm, Spartan, Renaissance, Modern and Space.

All 18 troop designs have coordinated blue/coral faction art, shared combat and portrait sources, and six animation cells per sheet. Cavalry has lances; heavy vehicles have firing poses. Twelve faction/era bases have contact shadows and padded texture boundaries. Thirty collectible cards now have distinct object illustrations.

The interface uses parchment, enamel blue and brass: clearer resource controls, visible troop roles, illustrated evolution panels, matching collections and result dialogs. Portraits have separate label/art/price slots. Compact screens hide the disabled battle selector during combat rather than placing it over the army. All of this remains an unverified rendered layout until browser QA is completed.

Actors use uniform scaling instead of stretching with the viewport. Combat feedback includes distinct rocks, sling stones, arrows, bullets, cannonballs, shells, energy bolts and meteors; impact rings and bounded particles; and short fading death visuals so a killed target does not immediately disappear before the projectile reaches it. These residues are not units, targets or colliders and never affect simulation, rewards or saves. Reduced motion removes their animation immediately.

No files under `src/game` were changed. The existing gameplay and save suite is preserved.

## Evidence

- `npm test`: **121 passed, 0 failed** on the current local tree.
- `npm run build`: TypeScript and Vite production build passed.
- `git diff --check`: clean.
- First visual checkpoint `df53471eaaa56801e759b64cd598aa9e23c92d81` passed GitHub Actions run `36501123490`; atmosphere checkpoint `87714e9a4c4c7f48621789312a522c8543e276bf` passed run `36509123095`. A newly published commit still requires its own exact-head CI result.
- The uploaded tree was compared against an alternate local Git index after each transfer; the complete source tree must match before publication.
- The scene manifest has 54 unique inline SVG texture assets and a declared initial pixel budget below 42 MB RGBA. This arithmetic budget excludes browser/GPU overhead and is not a measured memory claim.

### Actual problems reproduced and corrected

1. Phaser 3.90's data-URL loader decodes inline data as base64. Percent-encoded DOM image URLs raised `Invalid character`. A regression uses the pinned Phaser loader itself; scene URLs now use base64, while DOM portraits remain percent-encoded.
2. Asset review found 14 unsafe edges across 108 player poses. All frame artwork now has sampling margins and an independent per-cell clip, without changing the foot anchor.
3. Cannon, tank and spacecraft firing frames were identical to idle. Firing poses now include recoil or engine feedback.
4. The pale Dino Ribs collectible lacked a readable outline. It now has a dark structural silhouette.
5. The Stone Age base accidentally replaced its shadow markup. Both faction variants retain it now. The modern base touched the right texture edge; base artwork is padded around its existing ground anchor.
6. Generic glowing projectiles did not communicate weapon type. The renderer now paints tested weapon-specific glyph geometry.
7. Portrait labels and crest/weapon tips shared the same vertical band. CSS now reserves separate art space between labels and prices; this is source-contract verification, not a browser-layout result.
8. Defeated sprites disappeared before delayed projectile impacts. A bounded, view-only residue lasts at most 0.28 seconds, pauses with the scene and disposes on expiry, eviction, reset or reduced motion. Four tests exercise this lifecycle.

9. The six battlefields shared one generic floating-mote treatment after the static background pass. A presentation-only atmosphere model now gives each era its own bounded motion language behind the bases: Stone fireflies, Farm pollen, Spartan gulls, Renaissance embers, Modern windblown leaves and Space starlight. Reduced motion freezes these accents into a small static composition instead of removing visual identity, and malformed timing/viewport inputs fail soft without touching simulation state. A standalone composited keyframe board was inspected to keep fireflies/stars accent-sized; this is asset/presentation QA, not an in-game screenshot.

10. Bases previously stayed visually pristine until the instant they disappeared, so progress against the objective was carried almost entirely by the health bar. A presentation-only destruction model now adds era-material cracks and rubble below 72% health, then bounded smoke/sparks below 35%. Both factions mirror the structural treatment; Stone/Farm/Spartan damage reads as broken natural material while Renaissance/Modern/Space add restrained ember or energy accents. Ranged base hits defer debris and hit rings until the displayed projectile arrives, heavy impacts receive a very small shake, and reduced motion keeps the persistent damage state but suppresses the animated hit ring and freezes smoke/sparks. A standalone 24-panel base-state board (six eras × player/enemy worn/critical) was rasterized and inspected; this is asset/presentation QA, not browser gameplay evidence.

## Repeatable standalone asset QA

```sh
node --experimental-strip-types scripts/export-art-review.mjs artifacts/visual-assets
python scripts/verify-art.py artifacts/visual-assets
```

The Python checker requires Pillow and CairoSVG in the local QA environment; neither is an application dependency. It never opens a browser or accesses a game URL.

The latest raster run checked **216 faction/pose images, 36 sprite sheets, 12 bases and 30 card illustrations**, with zero recorded errors. It checks two-pixel sampling margins, nonempty artwork and atlas/standalone alpha differences with a tolerance of three intensity levels. Contact shadows are checked structurally. Preview boards and before/after comparisons are production-asset reviews, not in-game screenshots.

## Remaining limits

The earlier blocked browser route was not bypassed. No actual mobile touch, Safari/iOS, DOM focus, runtime WebGL/canvas fallback or frame-rate test was performed. Pixel-exact reference equivalence is not claimed. Full rendered gameplay QA still needs the 320x568, 390x844, short-landscape and desktop cases.

The production build still reports the pre-existing Phaser vendor-size warning (~1.21 MB raw / 332 KB gzip). No new product dependency or remote asset request was added. Review was author self-review because an independent reviewer tool was unavailable; it is not independent sign-off.

This document records a visual-development checkpoint, not a merged release. PR #2 is intentionally separate from already-merged core PR #1.
