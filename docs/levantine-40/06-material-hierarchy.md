# 06 — Material hierarchy: detail where attention belongs

Baseline: merged PR #4 tree `ec8253bed169702d411ce52f178e748ca5365a32` / main merge `c5d8040496d481677808f812224ec18b73468753`.

## Design philosophy
This pass treats "more detail" as an information-design problem, not an ornament count. It uses **Gestalt figure/ground** and **visual hierarchy**: the road and fighting silhouettes remain simple enough to read, while detail clusters around architecture, equipment and near-camera edges. **Material legibility** is carried by small cues—mortar joints, pottery rims, cloth stitches, belt hardware, rivets and edge highlights—rather than uniform texture noise.

Role silhouettes stay primary. Micro-detail must remain inside the existing 128×144 frame and cannot extend the footprint of a fighter. Faction identity stays in trim colors rather than complexion or cultural geometry.

## Implementation
- Added `src/view/design-detail.ts` as a presentation-only source for bounded scene and character detail.
- Six chapters receive distinct material clusters: pottery, stone joints, banners, awnings, olive/cypress accents and small focal props.
- All clusters advertise a source-space y position; the maximum is 590, above the protected battle-road paint beginning at source y 622.
- All three roles receive different equipment micro-detail. Melee emphasizes scabbard/belt hardware, ranged uses strap/pouch detail, heavy uses reinforcement plates. Chapter material changes preserve that role grammar.
- No new texture asset, product dependency, network request, simulation field, save field or action ID.

## Verification
Four focused tests were observed failing before implementation, then passing. Full suite after this pass: 193/193. TypeScript/Vite production build passed. Standalone SVG QA still reports 216 faction poses, 36 sprite sheets, 12 bases, six foreground overlays and 30 cards with zero errors.

Source-art boards were inspected at landscape and portrait scale. They are not browser/game screenshots and do not establish actual mobile layout, touch performance or device frame rate.

This is the sixth connected refinement toward the requested forty.
