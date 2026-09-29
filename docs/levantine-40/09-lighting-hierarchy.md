# 09 — Chiaroscuro without sacrificing the playfield

Baseline: merged silhouette-focus PR #6, main merge `b6046e9b373433c8cb626254eaff167d5f99303c`.

## Design philosophy
This pass uses **chiaroscuro**, **warm/cool contrast**, and **focal hierarchy** as navigation tools rather than spectacle. Warm practical light should pull attention toward inhabited architecture, gates and chapter landmarks. Cooler, weaker fields support atmospheric perspective farther away. The combat road remains visually neutral so the moving army wins figure/ground competition.

This is not global bloom. No full-screen color wash, vignette, shader or post-process is introduced. Every field is local, low-alpha and source-registered.

## Implementation
- New pure view model `src/view/lighting-hierarchy.ts` derives warm hierarchy pools from the real authored dusk lamp anchors.
- Each lamp receives a soft upright warm field and a wider, flatter bounce pool; six chapters also receive two weaker cool atmospheric support fields.
- Warm alpha remains at or below `0.10` and always exceeds cool focal intensity. All source extents remain above y 590, while the road begins below that region.
- Reduced-motion mode freezes all breathing/drift into the same complete composition.
- The existing `ambience` Phaser Graphics layer paints three nested ellipses per mark using the exact landscape crop transform. No new scene object, texture, dependency, timer, save field or simulation state.

## Verification
Seven focused regressions were observed RED before production code and GREEN afterward. Fresh full suite: **209/209 passing**. TypeScript/Vite production build passed; the existing Phaser vendor-size warning remains.

Browser/mobile/Safari, physical-device brightness and measured frame rate remain unverified under the existing browser restriction. This is the ninth connected refinement toward forty. No scheduler.
