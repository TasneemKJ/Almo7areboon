# 04 — Living dusk, without hiding combat

## Approved scope and implementation plan
Ruling: continue the already approved Levantine/dread/atmosphere direction without another approval prompt. This is a bounded presentation change in the existing atmosphere layer, not a new game subsystem. No scheduler.

The current landscapes have static practical lights, while runtime atmosphere still consists mostly of generic floating marks. Add slow low valley mist, soft halos registered to actual painted lamps and subtle water ripples registered to the stream/quay/courtyard water. Do not introduce ghosts, black screen overlays, flashes, a new HUD, real-conflict symbolism or additional game mechanics.

1. Observe failing tests for a pure `duskAtmosphereFrame` geometry model, stable reduced motion, invalid input, bounded draw budget, source-light registration and integration.
2. Add the presentation model and a painter using only existing Phaser Graphics operations. Reuse the scene's existing atmosphere Graphics and uniform background placement. Its existing paused/hidden clock remains authoritative.
3. Rasterize source-art compositions at multiple times; inspect and check that no new mark enters the combat road. Run the complete test suite, production build and existing source-art validators.
4. Recheck the remote head, compare the complete tested/uploaded tree and push a separate commit to PR #4. Record actual results below; browser/device acceptance stays outstanding.

No src/game, saves, pause ownership, actions, textures, product dependencies or CI/security edits are allowed. Individual assets and verification samples are not separate iterations. Author self-review is not independent review.

## Implemented checkpoint
- Reused the existing atmosphere Graphics: two low-opacity drifting mist banks, soft illumination at the actual authored light anchors, and calm ripples in the valley stream, irrigation channel, harbor and courtyard water. The modern hill chapter has no visible water, so it has no invented ripple layer.
- All marks share the exact landscape crop transform, stay in source-space above y=605, and render behind bases/troops. The source combat road begins below this region. No additional textures, shaders or scene objects were introduced. At most 21 ellipse draw operations are emitted per chapter/frame.
- Existing pause/hidden timing is unchanged. Reduced motion uses a stable time-zero composition; lights are not removed. Intensity changes remain slow and bounded rather than flashing.
- Eight focused regressions were observed failing before their fixes. A source-art review caught harbor ripple placement intersecting painted hulls; a regression was observed failing, then the water band was moved below those hulls. This is part of the same fourth batch, not an extra iteration.
- Fresh full suite: 166 tests passed. TypeScript/Vite production build passed. Source-art validators: 216 poses, 36 atlases, 12 bases, 6 foreground overlays and 30 cards, zero errors. Eighteen new chapter/time composites and six reduced-motion composites passed pixel checks; the entire source road mask [0,615,900,760] was unchanged. RGB rather than RGBA image differences are used so a zero difference-alpha channel cannot conceal color changes.
- Review was author self-review only. The diagnostic image board is uniformly scaled source art, not a browser screenshot. No actual device, Safari, touch, runtime performance or independent review is claimed. The Phaser vendor-size warning remains.

## Reproduce source checks
```
node --experimental-strip-types scripts/export-dusk-review.mjs artifacts/dusk-review
python scripts/verify-dusk-review.py artifacts/dusk-review
```
Pillow and CairoSVG are optional local art-QA dependencies, not game dependencies.

Publication check: an unattached upload had the player health-bar color transcribed incorrectly. The blob hash comparison detected the mismatch before any branch update; the upload was corrected to match the tested renderer exactly. That erroneous blob was never committed to this branch.
