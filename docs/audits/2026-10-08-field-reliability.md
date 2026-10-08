# Current field review — cycles 22–28, 2026-10-08

Baseline: main `ac2910163205f467248bec9e68632fd9bf650591`. Existing PR186 is separate work. These are seven distinct player scenarios, not seven counts of a shared helper. English remains the shipped locale under CLAUDE.md; this batch does not claim Arabic/RTL completion. Checked against DESIGN_RULES.md, DESIGN.md and UX-CONTRACT.md; no design-rule violations found. Save schema/key, combat, currencies and published card prices remain unchanged.

## 22 — Preserve urgent gate guidance

IDEAL / 5Ws: identify canonical base danger being dropped by the physical adapter; define a clear urgent choice for the player, on the active field, when their gate reaches danger, so optional teaching cannot conceal a threatened loss; explore below; act by retaining canonical priority; look back through the actual field controller with overlapping first-deployment and skill cues.
Twenty ideas: 1 retain danger copy; 2 prioritize it over first deployment; 3 prioritize it over stored-food teaching; 4 retain skill alternatives; 5 retain pause priority; 6 avoid a new banner; 7 reuse the one cue line; 8 keep the gate visible; 9 preserve native recruit costs; 10 avoid sound repetition; 11 preserve reduced motion; 12 test three enemies; 13 test zero deployments; 14 test low food; 15 test a safe gate; 16 retain canonical threshold; 17 avoid duplicate predicates; 18 keep current reinforcement rules; 19 check narrow wrapping; 20 compare native screenshots. Selected: actual canonical danger through the existing field cue.

## 23 — Explain the available supplies alternative

IDEAL / 5Ws: identify a food countdown replacing the canonical once-per-battle Food Drop alternative; define an actionable wait choice for the new player, beside their field supplies, after food runs low, so waiting is deliberate rather than unexplained inactivity; explore below; act by adapting the canonical sentence to Supplies; look back through unused, spent and captain-replacement cases.
Twenty ideas: 1 name Supplies; 2 name Food Drop; 3 show the real ten-food amount; 4 retain the once-per-battle limit; 5 retain waiting as a choice; 6 retain exact wait time; 7 omit a spent skill; 8 honor captain replacements; 9 preserve danger priority; 10 preserve first-deployment guidance; 11 avoid opening a panel automatically; 12 keep the existing target; 13 retain focusable availability; 14 keep the food cap; 15 retain current skill admission; 16 test a one-second wait; 17 test an empty purse; 18 test after spending Food Drop; 19 verify the contextual button; 20 check narrow wrapping. Selected: a short physical route to the existing unused support skill.

## 24 — Preserve formation, wave and mission information

IDEAL / 5Ws: identify the physical adapter returning an empty line for later tactical guidance; define a useful next action for new and returning players, on the field, once opening skill prompts have passed, so the existing strategy and authored objectives stay learnable; explore below; act by preserving canonical guidance with physical wording; look back through ranged-only armies, incoming waves and Chronicle objectives.
Twenty ideas: 1 retain ranged cover advice; 2 retain volley warnings; 3 retain rush warnings; 4 retain heavy-enemy counters; 5 retain mastery goals; 6 retain formation advice; 7 retain storage warning; 8 name the physical defender; 9 place unlock advice after battle; 10 name physical skill routes; 11 retain Chronicle objective text; 12 retain critical gate priority; 13 retain food readiness; 14 avoid two competing banners; 15 preserve authored mission numbers; 16 keep pause semantics; 17 avoid spawning resources; 18 test experienced players; 19 test no preview; 20 inspect landscape wrapping. Selected: canonical tactical continuity in one field line, with active Chronicle objectives using their existing domain guidance.

## 25 — Make the road shelter a Meteor target

IDEAL / 5Ws: identify canonical Meteor admission on intact cover without any living enemy, while the physical target is hidden; define a touch route for the tactical player, at the painted road shelter, before an enemy arrives, so a legal skill does not require a keyboard; explore below; act by adapting the existing tactical target to cover; look back through unbroken, broken, spent, paused and ordinary-enemy scenarios.
Twenty ideas: 1 use the existing target; 2 anchor it to the shelter; 3 label the shelter; 4 expose only valid Meteor; 5 retain enemy precedence; 6 retain selected-enemy focus; 7 clear after use; 8 clear after cover breaks; 9 honor pause; 10 honor session guards; 11 preserve one skill charge; 12 avoid a new toolbar; 13 retain native focus; 14 retain the existing 48px footprint; 15 use canonical landmark geometry; 16 reject other landmark kinds; 17 retain keyboard W; 18 preserve effects and costs; 19 test no enemies; 20 inspect shelter/tap alignment. Selected: one existing physical tactical target gains the valid cover fallback.

## 26 — Name the captain's real support action

IDEAL / 5Ws: identify a visible generic Use supplies button when a captain replaces Food Drop; define an understandable commitment for the player, in the deliberate supplies context, before activating support, so the promised effect matches the current captain; explore below; act through skillCue's canonical name; look back through both captains and ordinary Food Drop.
Twenty ideas: 1 show Food Drop by name; 2 show Gatekeeper's skill; 3 show Lantern keeper's skill; 4 reuse canonical labels; 5 retain the accessible effect; 6 retain used-state admission; 7 retain Back; 8 avoid extra buttons; 9 escape text correctly; 10 preserve once-per-battle use; 11 update after profile replacement; 12 retain pause cleanup; 13 retain focus; 14 keep short labels; 15 preserve target meaning; 16 leave audio unchanged; 17 verify button dispatch; 18 test the no-captain path; 19 test captain switching; 20 inspect narrow context width. Selected: the visible button uses the existing actual skill name.

## 27 — Choose card quantity before one summon command

IDEAL / 5Ws: identify three competing purchase buttons on the Cards leaf; define one deliberate draw action for the collecting player, in Cards, after selecting quantity, so exact cost and purchase ownership are clear; explore below; act on the existing TODO-approved native quantity/cost preview; look back through all three quantities, affordability, collection limits, focus and repeated activation.
Twenty ideas: 1 use one native quantity field; 2 retain 1/10/50 choices; 3 preview exact canonical cost; 4 show current gems; 5 retain collection capacity; 6 retain no-draw refusal; 7 retain published odds; 8 retain card art; 9 use one Summon button; 10 preserve the selected field; 11 keep selection read-only; 12 recheck canonical admission; 13 prevent duplicate modal click-through; 14 preserve receipts; 15 keep Cards return ownership; 16 retain session conflict guard; 17 keep 44px controls; 18 support keyboard changes; 19 test all costs unchanged; 20 inspect portrait and landscape. Selected acceptance: one active summon command plus native quantity choices, stable exact cardPackCost and no double purchase.

## 28 — Announce decisions without countdown chatter

IDEAL / 5Ws: identify a polite live region changing its spoken field hint every second; define quiet but useful announcements for screen-reader players, on the field, during resource and objective countdowns, so a new danger or instruction can be heard; explore below; act by separating visible countdowns from meaningful guidance announcements; look back through second-by-second updates and actual status changes.
Twenty ideas: 1 keep visible countdowns; 2 remove live semantics from their node; 3 use a stable announcement owner; 4 normalize timing-only changes; 5 announce a new danger; 6 announce a new tactical instruction; 7 retain accessible inspection; 8 avoid repeating food amounts; 9 avoid per-frame mutations; 10 preserve pause silence; 11 clear outside battle; 12 retain result announcements; 13 retain action-result toasts; 14 avoid a new visible element; 15 retain narrative objectives; 16 test same-message updates; 17 test a changed wave intent; 18 test resumed guidance; 19 inspect accessibility properties; 20 keep physical-device reader acceptance separate. Selected: a quiet visible hint with one stable meaningful live announcement.

## Evidence ledger

Each cycle is complete only after its distinct red/green scenario is recorded. Baseline build and 1,288 PR-fast tests passed locally before these edits. The fast gate excludes six slow suites; it is not the required all-tests gate. Native screenshots, touch, software Chromium performance and actual phone behavior are separate evidence categories.


| Cycle | Observed red scenario | Implemented result and evidence |
| --- | --- | --- |
| 22 | The actual controller replaced critical gate danger with the first-deployment instruction. | Danger retains canonical priority for zero and later deployments; presentation remains mutation-free. |
| 23 | Food shortage produced only a countdown, omitting the available Food Drop alternative. | The canonical unused support alternative names Supplies, ten food and the once-per-battle limit; spent and captain cases keep their existing predicates. |
| 24 | Ranged-only cover, incoming-wave and hold-mission instructions were discarded by the physical adapter. | Canonical tactics and authored objectives remain visible. Independent review also reproduced route/ranged-unlock overlaps hiding piling/Freeze/Meteor, paused first deployment and progressed Road wave counters; the added controller cases are green. Imminent road-wave advice uses the existing eight-second teaching boundary before generic formation; other authored objectives remain intact. |
| 25 | Intact road cover admitted Meteor through the domain but exposed no physical target when no enemy was alive. | The existing native target uses the painted shelter anchor and only Meteor; the actual canonical cast breaks cover, consumes one use and rejects a second. Enemy, pause, spent-skill and removed-cover paths are retained. |
| 26 | The visible commitment said “Use supplies” for every support skill. | Food Drop, Stand together and Borrowed dawn use the canonical skill name and effect. No captain effect or price changed. |
| 27 | Cards rendered three active purchase commands; no native quantity field updated a single cost/commit; the actual route accepted a stale purchase invocation during a receipt. | One quantity selector (1/10/50), one exact-cost preview and one guarded Summon. Prices stay **100 / 950 / 4,600 gems**. Real change/click handlers with DOM boundary doubles verify read-only selection, retained focus, one purchase, modal/closed-surface refusal and save-owner recovery. The existing QA campaign case 24 now changes Quantity before its unchanged cost assertions. |
| 28 | The visible guidance itself was a polite live region and no separate stable decision status existed. | Visible progress remains readable; one hidden status normalizes changing seconds/progress. Actual-controller tests show one food/hold announcement across repeated updates, changed danger/wave announcements, and clearing outside the battle. |

### Final source verification

- Required **all-tests gate: 1,354 / 1,354 passed**, zero failures, cancellations or skips, 77.32 seconds. Command: `node --experimental-strip-types --test --test-concurrency=2 tests/*.test.ts`, the full `npm test` file set with two workers. All six campaign/simulation/soundscape suites excluded by the fast gate ran here.
- The first all-tests attempt passed 1,353 and failed the shared size-budget wrapper because the runner's default `/tmp` did not exist (`ENOENT` from `mkdtemp`). Setting `TMPDIR` to the provided writable scratch directory resolved the environment failure in the complete rerun. No source or assertion was changed to obtain a pass.
- The earlier post-implementation PR-fast run passed **1,306 / 1,306** before the final progressed-wave regression was added. It is recorded as fast evidence, not counted as the full gate. The final all-tests result above supersedes it.
- `npm run lint`, `npm run build`, `node --check scripts/qa40/campaign.mjs` and `git diff --check` passed. Production JavaScript is **488,889 gzip bytes** against the unchanged **512,000-byte** budget (baseline 487,807). The existing large-Phaser-chunk advisory remains.
- Independent read-only review: **205 / 205** actual-controller/listener/economy/copy tests passed, zero failures/skips; nineteen reviewed production/test/QA-script blobs were hashed. Both reported guidance priority overlaps were reproduced before correction. No remaining scoped Critical/Important source finding.
- Native attempt: `scripts/mobile-touch-check.mjs` against the local production preview with the shared installed Chromium 153 and browser lock exited with `SIGTRAP` before any browser page or context opened. No gameplay assertion, screenshot, frame measurement, screen-reader session or physical-phone observation ran. The local preview was stopped. Native touch/rotation/text/AT and rendered release acceptance remain open.

The tests above exercise changed behavior through existing public domain/controllers/listeners. They do not establish uncoached comprehension, fun, return play, popularity, Arabic support or physical-device performance. All seven cycles are new scenarios against the pinned main baseline; historical QA40 cases and pre-existing PR186 are not counted as this work.


## Integration with current main — 8 October 2026

PR190 head `49e0a67323d6bbadbe06cedb8ac0fdfd2fadd324` was reconciled with current main `d8eb374d81dd827118c74894195d56da6592836b`, whose only intervening change is PR188's offline dependency-retention fix. This is integration of the existing seven cycles, not another improvement batch. The PR had no conversation comments, review submissions or inline threads at the integration read.

Only the append-only `DESIGN.md` and `TODO.md` sections conflicted; both original blocks were retained. All nineteen original PR production/test/QA-script blobs are unchanged. Current main's `public/sw.js`, `tests/service-worker.test.ts` and bug-audit document are also unchanged. The worker protects generated installation dependencies while the PR's UI modules remain in the ordinary emitted bundles; neither side changes progression, prices, save compatibility or the other's ownership rules.

Verification on the combined source:

- Refreshed-main worker/download baseline: **29 tests passed** and build passed.
- Combined affected worker/controller/listener/cards/interface group: **235 tests passed**.
- Required complete suite: **1,356 tests passed**, zero failures, cancellations or skips, **36.87 seconds**, using `node --experimental-strip-types --test --test-concurrency=2 tests/*.test.ts` with a writable `TMPDIR`.
- Lint, build, QA-script syntax and diff checks passed. Production JavaScript is **488,910 gzip bytes** against the existing **512,000-byte** budget. The prior 1,354-test/488,889-byte results above remain the original PR-head evidence; these combined results supersede them for integration.
- Inspection of the actual built HTML and service worker confirms that all **five emitted JavaScript/CSS bundles** are protected by the page or the **69-entry installation manifest**, including battlefield, Phaser and the audio worker. This supplements the root/nested worker regressions; it is not native offline-play evidence.

No browser, workflow or deployment action was performed for this reconciliation. Required rendered/mobile/offline acceptance remains open, without a waiver or weakened gate. Remote PR-head publication and merge remain with the coordinating reviewer.


## Reconciliation with subsequent physical-field main — 8 October 2026

The published integration head `3e671b35d2ceb7b22d1b06663651bccea839f3c1` was reconciled with main `a4bb3985868dcbefb17ac3b668874a8f867a7927` (PR189). This is the same seven-cycle batch. Both append-only design/task/interaction histories remain. Conflicts affected the field controller, controls, skill guidance, Meteor cues, interaction contract and shared DOM test boundary; no economy, save, Cards transaction, offline-worker, dependency or workflow rule changed.

One physical guidance entrypoint delegates to the reviewed danger/food/opening-skill/imminent-wave/Chronicle priority resolver. Main's captain-supply lesson is adapted there, and one normalized announcement function feeds one status node. The newer dedicated native cover target and its focus handoff are retained; the redundant older cover selector is removed. Living enemies retain their ordinary tactical target. Meteor preserves the cover-only badge/opportunity and also explains its shelter effect when living enemies exist. Main's Regroup advice and owned review-server startup remain. Original behavioral assertions remain, with only the reconciled status/cover node identities and equivalent supplies prompt adjusted.

Verification on the frozen combined source: targeted controller/skill/focus/review-server tests **45/45 pass**; full `TMPDIR=<writable scratch> npm test` **1,375/1,375 pass**, zero failures, cancellations or skips, **18,393.139615 ms**; `npm run build` (including TypeScript checking) passes at **489,329/512,000 gzip bytes**. The targeted first pass exposed one fake-DOM assertion expecting a dynamic shelter label; it now checks the real native control markup. Two integration regressions verify Meteor's combined enemy/shelter explanation and the captain lesson yielding to an imminent wave counter. The known Phaser chunk warning remains. Source/build logs are retained in the integration evidence, separately from earlier-head results.

No browser attempt, workflow trigger or deployment was made for this reconciliation. A separate production play session exercised deployment, Food Drop, Freeze, Meteor, Advance and Pause, but did not reach a reward; it is not evidence for this PR tree. Required exact-head rendered/mobile/offline acceptance remains open without a waiver. Remote publication and merge remain with the coordinating reviewer.
