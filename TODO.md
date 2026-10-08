# TODO

Ordered tasks. Tick a task when it is done and never delete finished tasks. This file replaces `docs/TODO.md` (its content is the Standing goals below).

## Standing goals (from the former docs/TODO.md)
- Continue increasing direct battlefield agency without creating a second balance or reward path.
- Keep village life and command reactions tied to real simulation events and current authored storybook art.
- Exercise fresh and returning save paths whenever progression or upgrade behavior changes.
- Add/maintain Arabic and RTL acceptance where affected; English-first fixtures are not full RTL evidence.
- Keep physical-device/Safari and low-end performance validation separate from hosted browser automation.
- Evaluate progression and replay with lawful real-action traces; do not infer retention from test counts.
- Every visual iteration needs three current before views and matching exact-head after evidence before merge.

## Done
- [x] Ready-screen Journey button names the nearest reward (`src/ui/next-goal.ts`)
- [x] Hide the boxed focus ring on programmatic dialog-title focus unless keyboard-focused
- [x] Fast `verify` gate (build + `test:fast`); heavy workflows manual; `weekly-full.yml` safety net; failure-only trimmed CI evidence
- [x] Direct battlefield orders (#158)

- [x] Landscape side rail (battlefield left, deck right, no page scroll) and Gather spacing (round 3)
- [x] Lazy-load Phaser after the shell; Open Graph preview; result Journey button names the next reward
- [x] Touch check `npm run review:mobile-touch` (320-412 portrait, 844x390, 4x CPU, #158 tap orders to a result)

## Next
- [ ] Weekly suite records the performance budgets in `docs/performance-budgets.md`; add frame-rate capture
- [x] First-battle teaching ring on the first troop card (0.3.8) and again while food piles up (0.3.12)
- [x] Count-up battle earnings on the result (round 6); victory/defeat motifs already existed
- [x] Settings and other dialogs in short landscape: no empty header band (round 6)
- [x] Colour-blind-safe troop-type shapes (shipped in 0.3.6, see below)
- [x] Streak grace day (optional `graceDay` field)
- [x] Colour-independent troop shapes (Settings, optional `marks` field)
- [ ] Optional haptics
- [x] Streak grace day (shipped in 0.3.7, see above)
- [ ] Capture and review victory/defeat, Journey, Chronicle and evolve-confirm screens on touch devices at 320, 360 and 412 widths
- [ ] Migrate Phaser 4, TypeScript 7 and Vite 8 as separate batches (Dependabot #161 closed: 126 type errors, Vite 8 `manualChunks` must be a function)
- [x] Compact dialog header in short landscape (round 4)
- [ ] Record the production domain and make `og:image` absolute
- [ ] Add `review:mobile-touch` to the weekly suite once its runtime is under ten minutes per engine
- [x] Evolution reveal: one-shot card flare, static with reduced motion (round 5)
- [x] First-Freeze cue when three enemies gather (Advance/Hold already cued by the order banner) (round 5)
- [x] True hit-stop on heavy hits (0.3.11; 50 ms, rate-limited, none with reduced motion) — original note: True hit-stop on heavy hits (heavy base hits already shake the camera, absent with reduced motion; a render freeze needs its own design)
- [x] Unearned seals shown on the chapter picker (already present via `masteryMarksHtml`; verified round 4)
- [x] RUSH wave panel moved out of the lane into the sky band (round 4)

## Shipped 2026-10-05 and 2026-10-06 (0.3.4 to 0.3.14)
- [x] First-Meteor cue (0.3.4); defeat recap naming the top damage dealer (0.3.5); weekly goal and skill badge target ring (0.3.13)
- [x] Settings last-saved line, heavier heavy deaths, opaque landscape dialog header (0.3.9); welcome-back line (0.3.10); hit-stop (0.3.11)
- [x] Weekly goal edge: week opens at battle start and a first-seen win counts its own seals (0.3.14)
- [ ] Feel check of hit-stop and heavy deaths on a physical phone (headless software rendering cannot measure the freeze)
- [ ] GPU-backed or physical-device frame-rate capture (headless measured 8-14 fps at 4x throttle on software WebGL)

## Prior-main regression pass, 2026-10-06 (after 0.3.13)
These incoming results describe that prior-main source and do not replace the exact-head physical field/Camp/Preferences/Quests release gate.
- [x] `review:mobile-touch` at 390x844, 844x390, 320x568 (victory by touch, 4x throttle), `review:overlap`, `review:clip`, `review:monkey`, `review:contrast`, `review:save-sessions` (16 cases), `review:browser`, `review:layering` (91 cases) pass; `npm test` twice
- [ ] `review:upgrade-text` fails at `320x568-root16-ready` ("clipped upgrades require an internal reflow scroll"); it fails identically on the v0.2.0 build, so it predates 0.3.x and needs its own look
- [ ] `review:mastery` did not finish inside 590 s with software WebGL (exit by timeout, no assertion failure); run it on a quieter machine or in the weekly suite
- [ ] The review scripts hard-code ports 4175, 4176 and 4177, which other repos on a shared machine also use (the save-session and browser reviews fail against a foreign server on 4175); make the port an environment variable
- [ ] `review:contrast` reports setting-row labels at 4.05:1 (Motion and Troop shapes status chips) and the daily-reward button at 4.41:1 as candidates; confirm or fix

## Village command response, 2026-10-05
- [x] Implement quieter gate readiness from authoritative Hold/Advance validity, with static reduced-motion parity
- [x] Route accepted simulation order events to distinct bounded Hold/Advance accents; test rejected input, draining, mute and voice limits
- [ ] Capture and inspect current before/after readiness and active-command screenshots at required phone/landscape/desktop sizes before verified visual release
- [ ] Listen to the new command contours alongside battle/atmosphere on browser and physical mobile output
- [ ] Complete the original cinematic atmosphere roadmap in real, behavior-tested slices; forty visually verified refinements are still unfinished

## First Fires depth, 2026-10-05
- [x] Inspect exact-current phone, landscape and desktop baseline views and register two hill-air pockets and two masonry reflections to the original 900×1000 painting
- [x] Implement a bounded immutable depth mesh in the real storybook branch, with crop/HUD/source-ink exclusions and static reduced motion
- [x] Add near-hearth/far-valley synthesis within the existing First Fires buffer; retain byte-identical audio for the five other chapters
- [x] Verify source registration and actual Phaser triangle-command decoding; run combined source tests and the unchanged engine-inclusive 500 KiB JS budget
- [ ] Capture and inspect exact-payload after views plus Canvas/WebGL, touch, crop/chapter changes and same-scenario 4× CPU evidence before visual release
- [ ] Complete browser OfflineAudioContext checks, listening review and physical mobile acceptance for First Fires spatial audio

## Arena-first active command deck — 2026-10-05

- [x] Inspect exact 8086b00 gameplay captures at 320, 360, 390, 412 portrait, 844 landscape and desktop; preserve the existing storybook identity.
- [x] Record IDEAL/5Ws and twenty candidates in docs/audits/2026-10-05-arena-first-controls.md.
- [x] Reproduce absent compact-live CSS contracts before implementation; preserve original troop markup in every chapter.
- [x] Compact the existing active roster/food/nav surfaces and narrow the landscape rail without changing actions or gameplay.
- [ ] Verify full source/build, independent review and same-scene native before/after gains, touch/focus/scroll, cost/lock/warning and repeated state transitions before release.

## Simple opening redesign (5 October 2026)
- [ ] Verify the new two-control Home and short results in native320/390/844browser captures, including save recovery, return focus and expedition choices.
- [ ] Replace the dense active deployment/navigation/upgrade/power layout with legible direct world interactions and at most3UI controls; preserve real troop/skill/order/Gather access.
- [ ] Record genuine empty-profile120second play and representative later saves; audit actual world targets separately from UI chrome.

## Physical-field UI simplification
- [x] Source slice: shared painted/native recruit anchors, physical gate/standard/supply interaction and contextual tactical controls.
- [ ] Exact-source native first120seconds from an empty profile, returning saves, keyboard/touch/rotation and visual review.
- [ ] Replace retained Camp catalogues, result Details actions and long Preferences with focused surfaces; current source is not all-screen acceptance.

- [x] Give the temporary-session notice its own intrinsic row beneath physical play; retain optional role shapes on waiting recruits.
- [ ] Native verify temporary-session warning, actual recruit ownership after resize, role shapes and later Camp/Chronicle paths on the integrated source.

## Flat Preferences and Home/Camp ownership — 2026-10-06
- [x] Source: seven flat native preference fields, three actions, focused save/recovery and explicit import/reset confirmation owners.
- [x] Source: Pause Resume/Settings/Home, actual-play Home history, receipt-first Continue and confirmed canonical leave-battle to noncombat ready Camp.
- [x] Source: preference node/focus preservation, persistent save warning, session conflict interruption, optional exact-true history normalization/reset tests.
- [ ] Exact-candidate native verification: seven fields/three actions, 320px/portrait/short-landscape, keyboard/reader semantics, focus/scroll, reset/import cancellation, temporary/future/conflict saves, held receipts and expedition provision paths.
- [ ] Adapt inherited browser scripts that still assume old Settings buttons, one-step retreat and pre-physical-field dashboard; they are not final-candidate acceptance evidence.
- [ ] Replace existing dense Camp and result Details catalogue in a separate approved slice; this batch is not all-screen simplicity acceptance.
- [ ] Native blocker from exact base 27917fe2: at 320×568 Camp food upgrade y528–572 is effectively 40px and covered by bottom navigation. Resolve through the next Camp redesign, preserving the real upgrade and 44px minimum; source-green Preferences is not publication acceptance.

## Physical ready Camp — 2026-10-06
- [x] Review approved written design and concrete implementation plan; view original 27917fe paused-state 320px failure without mislabelling it current ready evidence.
- [x] Source: separate illustrated four-place Camp with Battle/Home, canonical local food/gate/recruit/preparation actions and transient ready-only owner.
- [x] Source: read-only visit, exact economy boundaries, old-hidden-control rejection, origin-aware return, deliberate Start and recovery-precedence regression tests.
- [ ] Exact candidate native matrix: touch/focus/topmost44px/short-phone/safe-area/200%-text/rotation/background/all-six-age art and real audio; no browser/server was run in this source slice.
- [ ] Replace retained dense chapter/Chronicle/Journey/Cards/Quests/Evolution/result Details leaves with reviewed focused models. Temporary handoffs preserve access but are not all-screen acceptance.
- [ ] Future cards: native quantity/cost preview; future quests: read-only records + selected Claim/Back; future chapters/routes: genuine illustrated spatial travel with selected Travel/Back, no binary picker maze.

- [x] Integrate main badaba22 timestamp/evidence hooks; keep the welcome line as quiet Home subtitle rather than a boot toast. Cover recovery/failure priority and deliberate entry clearing, and align both lockfile versions.

## Incoming hit-stop reconciliation — 6 October 2026
- [x] Reconcile main 0.3.11, align both lockfile version fields, and keep minute-rounded lastSeen on saved copies.
- [x] Reproduce and correct transient hit-stop/cooldown leaking past scene, pause, visibility, motion and canonical state replacement boundaries; exercise the real update/event/reset and main step/pause owners.
- [ ] Verify the integrated hit-stop visually and by native frame timing with representative combat, reduced motion and reset/recovery flows; the separate pinned Camp run is not acceptance of this integration.
- [x] Reproduce ready Camp incorrectly entering the field draw path; gate the caller with its authoritative field/Camp presentation owner and verify actual predicate, update, resize and mount-readiness seams.
- [ ] Native-check the separate Camp animation delay on the corrected render gate; no CSS duration or timeout adjustment is part of this source correction.

## Main weekly and food-cue reconciliation — 6 October 2026
- [x] Reconcile exact main 0bd42c4/0.3.13 over the lifecycle-corrected physical field source, preserving prior Home, Camp, Preferences and receipt owners.
- [x] Reproduce the dead physical food cue and reuse the waiting defender/ring with canonical trigger and priorities.
- [x] Reproduce fractional-week admission, unguarded Quests synchronization and first-win baseline loss after week rollover/import/reset; repair the current owners without changing 3 seals/60 gems.
- [x] Keep import/reset initialization inside the existing guarded replacement transaction; test failed writes, once-only claims, held receipts and paused/unowned frames.
- [ ] Exact-source native review of food cue/ring and weekly flows, including reduced motion, real week rollover and reset/import/recovery. No images or browser acceptance are included in this source-only reconciliation.
- [ ] Replace retained dense Quests/other advanced leaves with reviewed simple models; do not count this integration as all-screen simplicity acceptance.
- [x] Characterize the inherited weekly rollback/stale-token reward duplication on sealed v1 and the incoming-stage source; retain exact week/gems/claim sequences.
- [x] V2 source: refuse backward sync, make rejected claims mutation-free, require a current local-week UI token, and test forward earning, repeat clicks, failed persistence, held receipts, import/reset and invalid/future/old tokens. No reward or schema change.

## Grounded Camp composition — 6 October 2026
IDEAL + 5Ws: a phone player preparing the company needs the four actual places to belong to the existing dusk courtyard, rather than float over its skyline. The previous original390px frame showed a floating gate, vector work props and an empty middle band. Selected bounded scope: lower-plane composition, matching journal work prop, shared art/button footprints and contact shadows.
Twenty ideas: (1) lower the gate; (2) lower the storehouse; (3) group company on the same courtyard; (4) replace journal vector with painted work table; (5) restrained contact shadows; (6) keep names visible; (7) match native footprints to art containers; (8) keep Battle/Home; (9) preserve chapter art; (10) retain original asset provenance; (11) normalize every portrait; (12) add fireflies; (13) add drifting smoke; (14) add new game time; (15) replace the whole background; (16) add a compass; (17) add more root destinations; (18) add a welcome toast; (19) add background door hotspots; (20) animate upgrades. Select1–10. Defer11; reject12–20 for this bounded slice.
- [x] Recover and preserve the approved journal original; ship a512px WebP derivative rather than the1.66MB original.
- [x] Journal root/focus source regression RED→GREEN; preserve canonical simulation/actions.
- [x] Move the four existing places into a responsive lower courtyard layout with contact shadows.
- [x] Replace the mismatched Storehouse vector with a distinct painted provisioning awning; keep its original and optimized derivative provenance.
- [ ] Review the final composed phone/landscape/desktop originals before visual acceptance.
- [ ] Verify combined incoming-main/lifecycle source, purchases, rotation, large text and later chapters before publication.
Advanced Camp leaves remain dense and unaccepted. This work does not claim all-screen simplicity or physical-device performance.

## Focused quest records — 6 October 2026
- [x] Replace the dense Quests leaf with one native Goal field, exact selected record and Claim/Back; keep all twelve choices and canonical rewards.
- [x] Test real native change/click handlers for selection/focus preservation, once-only live claims, stale tokens/day rollover, session recovery, failed/temporary persistence, held receipts and Camp return.
- [ ] Complete exact-source browser and physical-device picker, keyboard, touch/rotation/200%-text and visual review before publication; keep remaining dense leaves explicitly unaccepted.
- [x] Refresh open quest details across midnight/Monday without sync/save/reward; retain native focus, explain future/invalid device dates, and verify existing returning-save Journey routes.

### Desktop Camp contact bounds
- [x] Record the actual 1280px station bounds: 476px native buttons surrounded much narrower painted objects.
- [x] Limit each shared object/label button to210px and center it in the unchanged grid. Phone and short-landscape columns are already narrower.
- [ ] Recheck native center/corner/label contact, empty-courtyard rejection and unchanged phone composition on the final combined source.

## PR182 reconciliation with the physical-world batch
- [x] Preserve integer/monotonic weekly admission, mutation-free claims, reset/import ownership and no repeated rollback checks.
- [x] Count a just-settled receipt when Monday begins between pre-step baseline and event drain; retain accepted-start-only synchronization.
- [ ] Recheck exact reconciled source, native weekly ownership, required CI and unchanged main before the root merge decision.

- [x] Juice 1: Role-weighted recruit arrival; mutation behavior test passes; [20-idea audit](docs/audits/2026-10-08-juice-01.md).
- [ ] Juice 1: required mobile touch, CPU throttle, rotation and viewed before/after screenshots before shipping.

- [x] Juice 2: Grounded recruit contact prints; mutation behavior test passes; [20-idea audit](docs/audits/2026-10-08-juice-02.md).
- [ ] Juice 2: required mobile touch, CPU throttle, rotation and viewed before/after screenshots before shipping.

- [x] Juice 3: Ballistic projectile glow continuity; mutation behavior test passes; [20-idea audit](docs/audits/2026-10-08-juice-03.md).
- [ ] Juice 3: required mobile touch, CPU throttle, rotation and viewed before/after screenshots before shipping.

- [x] Juice 4: Authoritative thaw fracture cue; mutation behavior test passes; [20-idea audit](docs/audits/2026-10-08-juice-04.md).
- [ ] Juice 4: required mobile touch, CPU throttle, rotation and viewed before/after screenshots before shipping.

- [x] Juice 5: Food Drop settles at the camp; mutation behavior test passes; [20-idea audit](docs/audits/2026-10-08-juice-05.md).
- [ ] Juice 5: required mobile touch, CPU throttle, rotation and viewed before/after screenshots before shipping.

- [x] Juice 6: Meteor pressure at physical arrival; mutation behavior test passes; [20-idea audit](docs/audits/2026-10-08-juice-06.md).
- [ ] Juice 6: required mobile touch, CPU throttle, rotation and viewed before/after screenshots before shipping.

## Current juice design review (2026-10-08)

The earlier short idea lists were expanded during review into twenty concrete action/object alternatives per behavior, with selected, deferred and rejected reasons. This documentation refinement adds no iteration count. The full IDEAL/5Ws and all twenty ideas for each cycle are recorded here:

- Juice 1: Role-weighted recruit arrival — [20 concrete alternatives and decisions](docs/audits/2026-10-08-juice-01.md).
- Juice 2: Grounded recruit contact prints — [20 concrete alternatives and decisions](docs/audits/2026-10-08-juice-02.md).
- Juice 3: Ballistic projectile glow continuity — [20 concrete alternatives and decisions](docs/audits/2026-10-08-juice-03.md).
- Juice 4: Authoritative thaw fracture cue — [20 concrete alternatives and decisions](docs/audits/2026-10-08-juice-04.md).
- Juice 5: Food Drop settles at the camp — [20 concrete alternatives and decisions](docs/audits/2026-10-08-juice-05.md).
- Juice 6: Meteor pressure at physical arrival — [20 concrete alternatives and decisions](docs/audits/2026-10-08-juice-06.md).

Review verification: existing reset-order and faction gesture contracts are preserved. Current checks require matching image/vector faction composition and prohibit simulation coordinate writes. Accepted Meteor retains current enemy targets, cap and truthful no-target fallback while adding reduced-motion contact. Coordinator serial full verification and required browser acceptance remain pending.
