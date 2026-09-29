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
