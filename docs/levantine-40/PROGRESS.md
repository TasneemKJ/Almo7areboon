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


## 05 — Original dusk soundscape
Original chapter-specific plucked/airy music and environmental textures now use the existing gesture-created audio context, with a master Sound control and a separately stored Atmosphere switch. Pause, menus, hidden tabs, inactive screens and battle results silence ambience. A cancellable worker generates only the requested chapter, and one cached buffer plus bounded fade voices prevents playback accumulation. Full details, observed failures, concurrency ruling and reproduction commands: [05-soundscape.md](05-soundscape.md).
Fresh suite: 189 passing tests; production build and diff check pass. Built-worker PCM matches the generator for all six chapters in a Node-thread test. Offline WAVs/metrics are not real-device listening or browser verification. No gameplay or artwork changes; src/game remains byte-identical. This is one connected fifth batch toward forty, not six because there are six chapters. Author self-review only. No scheduler, merge, browser workaround or explicit deployment request.


## 06 — Material hierarchy
Applied selective masonry, pottery, banner, textile and equipment detail under a figure/ground rule: detail clusters around landmarks and silhouettes while the road stays quiet. Four regressions RED→GREEN; full suite 193/193 and production build passed; full source-art QA remains zero-error. Details: [06-material-hierarchy.md](06-material-hierarchy.md).

## 07 — Cinematic depth
Added a separate depth layer between distant land and the focal settlement using atmospheric perspective, detail falloff and rhythmic repetition. Small distant homes/cypress/haze remain low-weight; banners, torches and chapter landmarks grow stronger toward the focal area. Four regressions RED→GREEN; combined suite 197/197 and production build passed; source-art QA remains zero-error. Details: [07-cinematic-depth.md](07-cinematic-depth.md).

Seven connected refinements are now implemented toward forty. Asset boards, tests and per-chapter counts are evidence, not extra iterations. Browser/mobile acceptance and independent review remain outstanding. No scheduler.


## 08 — Simultaneous contrast for troop silhouettes
Added two bounded, low-alpha faction-tinted focus fields behind each active troop using the existing shadow Graphics layer. Lane/role scale affects field geometry; hit flash strengthens it within an alpha cap; freeze stays cool. The approach uses simultaneous contrast rather than outlines so increasingly detailed scenery does not swallow playable figures. Five regressions RED→GREEN; full suite 202/202 and production build passed. Details: [08-silhouette-focus.md](08-silhouette-focus.md).

Eight connected refinements are now implemented toward forty. No scheduler; browser/mobile acceptance remains open.


## 09 — Warm/cool lighting hierarchy
Added source-registered warm practical-light pools and weaker cool atmospheric support through the existing ambience Graphics layer. The road remains neutral; reduced motion freezes the complete composition. Seven regressions RED→GREEN; full suite 209/209 and production build passed. Details: [09-lighting-hierarchy.md](09-lighting-hierarchy.md).

Nine connected refinements are now implemented toward forty. No scheduler; browser/mobile acceptance remains open.


## 10 — Crafted UI material language
Added a lightweight post-baseline CSS layer using ornament as structure: brass seams, inset card frames, parchment directionality, button edge light and shared dialog/card framing. It never targets the playfield, adds no panels/assets/fonts/animations, and leaves touch-target sizing to existing CSS. Five regressions RED→GREEN; full suite 214/214 and production build passed. Details: [10-material-language.md](10-material-language.md).

Ten connected refinements are now implemented toward forty. No scheduler; rendered mobile acceptance remains open.


## 11 — Line of action and role weight
Added a bounded view-only gesture model over existing sprite frames: melee commits forward, ranged attacks recoil while staying upright, and heavy units compress. Faction direction mirrors the same geometry; reduced motion is neutral. Five regressions RED→GREEN; full suite 219/219 and production build passed. Details: [11-character-gesture.md](11-character-gesture.md).

Eleven connected refinements are now implemented toward forty. No scheduler; browser/mobile acceptance remains open.


## 12 — Collectible art hierarchy
Added a shared rarity-frame grammar around all 30 original collectible objects: protected central negative space, grounded plinth/shadow, and progressively stronger common/rare/epic/legendary ornament. Collection and summon surfaces expose the same rarity metadata. Five regressions RED→GREEN; full suite 224/224, production build passed, and standalone asset QA still reports 30 cards with zero errors. Details: [12-card-art-hierarchy.md](12-card-art-hierarchy.md).

Twelve connected refinements are now implemented toward forty. No scheduler; rendered mobile acceptance remains open.


## 13 — Outpost architectural micro-detail
Added six bounded architectural-detail grammars across all 12 faction outposts while preserving the existing silhouettes. Player/enemy geometry remains identical after faction color normalization. Five regressions RED→GREEN after correcting one overbroad test regex; full suite 229/229, production build passed, and standalone asset QA still reports 12 bases with zero errors. Details: [13-outpost-detail.md](13-outpost-detail.md).

Thirteen connected refinements are now implemented toward forty. No scheduler; rendered mobile acceptance remains open.

## 14 — Material-specific impact choreography
Replaced the one-size-fits-all unit-hit burst with a bounded contact→breakup→dissipation grammar: earth/stone chips and dust, bronze sparks, powder smoke, steel fragments and energy pulses. Heavy units carry more visual mass without multiplying effect count; projectile impacts wait for the visible projectile to land; reduced motion uses a static contact composition. Seven regressions RED→GREEN; full suite 236/236 and production build passed. Details: [14-impact-material.md](14-impact-material.md).

Fourteen connected refinements are now implemented toward forty. No scheduler; rendered mobile acceptance remains open.


## 15 — Environmental storytelling micro-vignettes
Added chapter-specific functional set dressing above the combat road: water/storage, agriculture, harbor work, workshop craft, civilian utilities and future garden infrastructure. Five regressions RED→GREEN; full suite 241/241, build passed, asset QA stayed zero-error, and source road-mask checks stayed unchanged. Details: [15-environment-vignettes.md](15-environment-vignettes.md).

Fifteen connected refinements are now implemented toward forty. No scheduler; rendered mobile acceptance remains open.


## 16 — Asymmetric foreground framing
Added chapter-specific left/right foreground vignettes using frame-within-frame composition and asymmetric balance while keeping the central corridor open. Five regressions RED→GREEN; full suite 246/246, build passed, asset QA stayed zero-error, and scene road-overlay alpha remains zero. Details: [16-foreground-framing.md](16-foreground-framing.md).

Sixteen connected refinements are now implemented toward forty. No scheduler; rendered mobile acceptance remains open.


## 17 — Gaze and character expression
Replaced static face details with a bounded role/frame expression source: controlled gaze, eye openness, brow angle and mouth shape across all six animation cells. A source-art review caught a worried attack mouth; a new RED→GREEN regression corrected it before publication. Final full suite 252/252, build passed, and full asset QA remains zero-error. Details: [17-character-expression.md](17-character-expression.md).

Seventeen connected refinements are now implemented toward forty. No scheduler; rendered mobile acceptance remains open.


## 18 — Cinematic grade and practical light
Added a per-chapter colour grade, stage vignette and key-light rays baked into the static art, cool/ember team beacons, per-troop additive team halos, lit projectiles and impact flares, and foreground mist. A devil's-advocate review rejected bloom, a camera post pass (−20% fps) and per-frame vignette layers (they darkened the outposts), so the finished pass costs ~10% fps under software GL. Eleven new tests; full suite 263/263, build passed. This is the first batch with rendered-browser evidence (headless Chromium, all six chapters, zero page errors). Details: [18-cinematic-grade.md](18-cinematic-grade.md).

Eighteen connected refinements are now implemented toward forty. Real-device and Safari acceptance remain open.
