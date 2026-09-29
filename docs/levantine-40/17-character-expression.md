# 17 — Gaze, expression and controlled exaggeration

Baseline: merged asymmetric-foreground PR #17, main merge `868edab020cab4a7e1f972bc00cb847d430c692b`.

## Design philosophy
This pass uses **gaze direction**, **controlled exaggeration**, **facial action hierarchy**, and **role personality**. At a 128×144 troop scale the face cannot carry realistic micro-expression; it needs a few deliberate changes that survive mobile rendering without turning characters into caricatures.

The outer head silhouette, complexion palette, headwear, body proportions and faction geometry remain unchanged. Only eyes/catchlights, brows and mouth move. The same facial geometry is used for both factions.

## Expression grammar
- **Ready:** calm forward focus.
- **Stride A/B/C:** small gaze and brow shifts so walking does not look like a frozen mask.
- **Attack anticipation:** melee lowers/angles brows strongly, ranged looks farther toward the target while staying composed, heavy narrows into a stern compressed read.
- **Follow-through:** melee briefly opens the mouth with exertion, ranged returns to a controlled focus, heavy remains set and grounded.

A source-art review caught the first melee/heavy anticipation mouth reading as worried. A new regression was added, observed RED, and the mouth was changed to a near-horizontal set line before final verification.

## Implementation
- Added pure presentation model `src/view/character-expression.ts` with bounded gaze X/Y, eye openness, brow tilt, intent and mouth shape.
- `src/view/unit-illustrations.ts` now delegates eyes, gaze, brows and mouth to that source instead of static face markup.
- Expression is frame-aware across all six sprite cells and role-aware for melee/ranged/heavy.
- Helper contains no faction input; player/enemy face geometry is identical.
- Existing head outline, nose/cheek, skin palette, clothing, weapons, frame anchors and texture dimensions are unchanged.
- No gameplay state, hitbox, targeting, attack timing, save, action or dependency changes.

## Verification
Initial six expression regressions were observed RED before the model existed. Five went GREEN after the first implementation; source-art review then produced one additional RED regression for the worried mouth and it went GREEN after correction.

Fresh final verification:
- `npm test`: **252/252 passing**.
- `npm run build`: passed; existing Phaser chunk-size warning remains.
- Standalone art QA: **216 faction poses, 36 sprite sheets, 12 bases, six foregrounds, 30 cards, zero errors**.
- A role × six-frame face contact sheet was rasterized from the production sprite sheets and inspected as **ASSET QA**.

Browser/mobile/Safari, touch and in-engine facial readability remain unverified under the existing browser restriction. This is refinement 17/40. No scheduler.
