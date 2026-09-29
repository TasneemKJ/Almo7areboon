# Levantine refinement record

Current objective: continue refining until the user asks to stop. Forty remains a requested milestone, not a claimed count. No scheduler.

## Baseline and ownership
- Live starting PR #4: 5bf43dc4cd129639b80be8e85b4daa809f024508.
- Exact recovered tree: 8f555c36773b62dfa4f46f2df116b9dd93bc76b1 from Actions run 36536017796.
- Current execution resumed its own interrupted reservation 5886777545; earlier preview boards are not source-code evidence.
- Fresh baseline: 139 tests passed. All following work keeps src/game byte-identical.

## 01 — Character wardrobe and expression
Observation: merged characters used generic straw hats, a Spartan crest and a European-style tricorn; head/face rendering and costume barely varied by role. The requested cultural direction was present only in documentation.
Change: six original wardrobe constructions: early wraps, farming layers and selective cloth headwear, restrained bronze armor, an open historic-town coat, fictional modern outerwear and future armor with woven sashes. Face proportions are calmer; skin palettes vary by character but not faction. Existing faction colors, weapons, cavalry/vehicle silhouettes and six-cell pose anchors remain.
Evidence: 5 new regression tests observed failing before implementation, then passing. Full suite: 144 passed; TypeScript/Vite build passed. Existing standalone asset checker: 216 poses, 36 sheets, 12 bases, 6 foregrounds, 30 cards, 0 errors. Before/after source roster board inspected. These are asset/template checks, not gameplay screenshots or device verification.
Status: implemented and asset-reviewed; rendered mobile/browser acceptance remains pending. Count this as ONE connected refinement, not one per troop, file or assertion.

## Reference grounding
- The Met, Man's Damir Coat with Short Sleeves, C.I.39.91.26, Syria (Aleppo or Damascus), late nineteenth/early twentieth century: https://www.metmuseum.org/art/collection/search/126815
- UNESCO, Battir terraces and irrigation: https://whc.unesco.org/en/list/1492
- UNESCO, As-Salt yellow-limestone urban fabric: https://whc.unesco.org/en/list/689
The coat is a cut/material reference for an imagined historic chapter, not a claim of a Renaissance uniform. Original geometric trim is not presented as copied or authenticated Palestinian embroidery. Both factions share the same cultural and complexion range.

## Boundaries and next batch
The user added restrained dread and atmosphere: express it through dusk, quiet inhabited spaces, shadowed distance and warm practical light, not sinister ethnic caricatures or unreadable black overlays. Scenery is next. Old scene names are still present until the presentation-mapping batch. Full Arabic/RTL localization and music are not yet implemented.
No browser-policy bypass, merge or deployment request. The existing Phaser vendor-size warning remains. Author self-review only; no independent reviewer was available.

## 02 — Levantine dusk settings and outposts
Observation: the wardrobe pass still stood in the old windmill/temple/citadel/alien backdrops. The requested regional atmosphere was not part of the environments or bases.
Change: replaced those backdrops with six original fictional settings: a sheltered valley, olive terraces, a coastal quay, a courtyard workshop quarter, hillside homes and future courtyards. Rebuilt all twelve faction outposts with consistent stone, timber, trim and warm lamps. Sparse moonlit distance and closed thresholds provide restrained unease; no ethnic, religious or real-conflict enemy coding. The transparent edge frames stay separate from the road.
Verification: three new scene assertions failed before implementation; three companion compatibility checks were already green. All six now pass, and the full suite is 150/150. TypeScript/Vite build passed. The existing foreground test also caught reused frame shapes (4 distinct instead of 6); real chapter-specific framing corrected it. Full existing art QA: 216 poses, 36 sheets, 12 bases, 6 foregrounds, 30 cards, zero errors. New raster heuristics cover all six full canvases, a transparent central-road overlay mask, and road/near-ground contrast above 2.15. These heuristics are not WCAG or browser acceptance. Source-art boards were inspected and corrected for a false dark disc around the moon, disconnected hillside buildings, and missing terrace/coastal structure.
Status: ONE additional connected refinement, implemented and asset-reviewed. The new 40-target has two such batches, not forty completed cycles; browser acceptance remains open. All src/game blobs match the prior published wardrobe head 8c669f7a229a398f013ba4e8ab6300d064f3f3a5.
Sources checked for this batch: UNESCO Battir (https://whc.unesco.org/en/list/1492/) for terraces, olives/vines and irrigation; As-Salt (https://whc.unesco.org/en/list/689/) for a hillside stone urban reference; Tyre (https://whc.unesco.org/en/list/299/) for coastal trading context. New drawings are fictional compositions, not traced site plans, exact reconstructions or licensed photos. The early and future chapters are explicitly imagined.
Remaining: chapter naming still uses existing internal era labels; presentation mapping follows separately. Arabic/RTL, new music, genuine browser screenshots and physical-device playtesting are not implemented or verified here. No scheduled job, merge or deployment request. Existing Phaser vendor warning unchanged. Author self-review only.

## 03 — Consistent chapter presentation
Recovered the interrupted presentation task from the exact published dusk tree. The recovered main.ts matches the already uploaded blob c34f4b8d8a591ee21d2e92cc266d639af5e161e1; recovery is not counted as another iteration.
First Fires, Olive Terraces, Harbor Watch, Lantern Quarter, Hillside Watch and Courtyards Beyond now share one immutable presentation map across the HUD, troop labels, battle selection, evolution, results, unlock messages and import preview. Decorative selector thumbnails and the result backdrop reuse cached original landscape SVGs. Internal era names, prices, action IDs and save schema remain unchanged. Fictional chapter periods replace misleading historical dates.
Fresh verification on the recovered task: eight new assertions failed against the 150-test published baseline before restoration; all 158 tests then passed, as did the TypeScript/Vite build and diff check. Updated one existing evolution-screen expectation to the approved chapter names; its cost, reset-warning and gate checks remain. Profile non-mutation, next-enemy versus player-era naming, invalid-index fallbacks, cache reuse and decorative image bounds are covered. CSS/source checks do not establish rendered mobile acceptance.
This is the third connected implemented batch of the requested forty, not forty completed or browser-accepted loops. Arabic/RTL and new music are not delivered. Review was author self-review, not an independent review. No scheduler, merge, browser workaround or explicit deployment request.


## 04 — Living dusk
Added low valley mist, anchored lamp halos and water ripples through the existing atmosphere layer. No new game objects, textures, control layers or gameplay state. Source placement, slow intensity changes, reduced motion, draw budget and the untouched combat-road mask are verified. Full details and commands are in [04-living-dusk.md](04-living-dusk.md).
Fresh suite: 166 passing tests and production build success; 18 animated-time source composites plus six static reduced-motion composites pass pixel checks. The renderer changes only the atmosphere integration; src/game remains byte-identical. Author self-review, not independent review. This is the fourth connected implemented batch toward forty; browser acceptance is still pending.
Published preceding checkpoint: 5c47fcb566cbfd8ddbed86aef253d043a190c539, tree 043107dd8ddef8328b3607a307cc4c69723792dc; its Actions run 36555746159 passed. Check the newer atmosphere head separately before calling its CI successful.
