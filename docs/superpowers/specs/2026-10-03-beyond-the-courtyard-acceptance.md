# Beyond the Courtyard — acceptance and release criteria

**Status:** Test requirements for the proposed expansion, not results of executed gameplay tests.
**Parent:** [Expansion specification](2026-10-03-beyond-the-courtyard-design.md).
**Content authority:** [Mission, tribe, skill and relic catalogue](2026-10-03-beyond-the-courtyard-content.md).
**Baseline:** `720a818d27cffe9ab999369c1b392f98eb43ce28`.

## 1. Evidence contract

Record scenario ID, source revision, exact content hash, profile/fixture, browser and version, viewport/device, steps, expected result, observed result, screenshot/report path and disposition. Distinguish new behavior coverage from inherited regression executions and browser repetitions.

A passing DOM check is not painted-frame evidence. A generated image is not a reviewed image. A deterministic simulation is not a touchscreen playthrough. A passing test before the fix does not prove that the test catches its alleged defect.

Use isolated profiles and explicitly disclosed fault injection; never inspect or replace a real player's saves. Preserve raw failures, then add a separate disposition when investigating environment limitations. Do not rewrite them as passes.

## 2. Content and unlock graph

| ID | Required evidence |
|---|---|
| CT01 | Exactly six regions, 48 main missions and 12 optional missions; no duplicate canonical IDs. Six bosses are included in the 48. |
| CT02 | Every prerequisite, asset, tribe, unit, skill, relic and reward reference resolves. Unknown IDs fail validation, not silently select another mission. |
| CT03 | The progression graph is acyclic; its full main path is reachable from entry without optional clears, relics or random summons. |
| CT04 | Each of eight tribe kits contains exactly three role variants; 24 distinct variant IDs and art sets exist. Twelve skill IDs include exactly seven new mechanics. Twelve relic IDs have one defined grant each. |
| CT05 | Each essential grant occurs before any encounter that teaches its use. Starter skills and guaranteed units remain a valid main-path solution. |
| CT06 | Every mission has finite wave/conditional-spawn budgets, valid world coordinates, positive timers, a defeat/stalemate path and a reviewed briefing. No repeated health multiplier alone counts as an authored mission. |
| CT07 | Content-ID additions advance the content schema; display-name changes do not reset clear records or issue another reward. |

## 3. Domain and balancing

| ID | Required evidence |
|---|---|
| DM01 | All 60 objectives reach correct wins and losses; destruction of the gate wins the tie as defeat. Escort/cage/landmark progress cannot be triggered by dead units or decoys. |
| DM02 | All 48 main missions have a deterministic winning policy using only guaranteed recruitment, zero cards, no relic and Freeze/Meteor/Food Drop. Record loadout, spawn choices and timing; do not set victory state directly. |
| DM03 | Repeat the reachable main-path balancing matrix at six eras and timelines 1, 2 and 10. Higher timeline enemies do not accidentally inherit original timeline scaling as well as expansion difficulty. Report 864 combinations separately from unique mission coverage. |
| DM04 | All six bosses: wind-up, interrupt, exposure, phase threshold, simultaneous death, finite adds and deadline. No required counter is earned only after its boss. |
| DM05 | All eight tribes: trait applicability, friendly/enemy parity, aura overlap, interrupted wind-up, pull clamps, conceal/reveal/contact and deterministic target ties. |
| DM06 | All 12 skills: legal use, repeated use, invalid IDs, missing targets, zone boundaries, rejected cast while paused/terminal/unowned, target cancellation and stale input after retry. |
| DM07 | All 12 relics: eligible and ineligible triggers, once-per-battle flags, retry reset, non-recursion, decoy exclusions and combined caps. |
| DM08 | Small/large delta partitions, pause/resume and 1×/2× speed produce equivalent domain outcomes within the existing fixed-step tolerance. Reduced-motion changes produce no gameplay differences. |
| DM09 | Reject attempts to equip four skills, duplicates, locked tribes/relics, or change gear mid-battle; snapshots of profile, state and event queue remain unchanged. |
| DM10 | Repeat/first-clear payouts, all enemy tickets, cap saturation, retreat, reload and prestige: no duplicate gems, progression awards or extra reward budget. |

Start balance evaluation at zero random bonuses; separately exercise highly progressed original saves so overflow or extreme damage does not skip settlement. The proposed timing/economy numbers are tuned against these results. Do not make the starter profile artificially rich to call a mission fair.

## 4. Persistence and lifecycle

| ID | Required evidence |
|---|---|
| SV01 | Import representative v1–v5 saves, including each original pending-victory type, and compare all pre-existing progression/settings before and after v6 round-trip. |
| SV02 | Entry migration recognizes only documented durable evidence. A new profile does not receive unexplained clears, coins or recruitment. |
| SV03 | Future outer/content schemas stay protected. Missing, corrupt, truncated, oversized and unknown-ID records cannot mint rewards or unlocks. |
| SV04 | Primary/backup precedence, failed reads, quota exhaustion and failed primary write retain the prior durable profile. An unsaved result is labeled accurately. |
| SV05 | One accepted win updates wallet, clear record and receipt together; loading the receipt is presentation-only. Retry/Continue/Back/double tap cannot re-credit it. |
| SV06 | Delayed imports after dismissal or ownership loss, overlapping file selections, temporary play and two real tabs retain existing ownership and mutation guards. |
| SV07 | Switching Original tale/expansion, evolution, prestige, confirmed Start over and cancelled reset preserve the documented keep/reset boundaries. |
| SV08 | Actual history navigation plus synthetic visibility probes are recorded separately. No suspended simulation catch-up, orphan target selection, unexpected audio or expired effect in the next battle. |
| SV09 | Interrupted expansion battle reloads ready without a victory grant; a settled victory reloads the correct mission/result even after mode selection changes. |

Do not call a two-key localStorage operation atomic. Inject failure between primary and backup writes and verify the documented behavior.

## 5. Player-facing browser acceptance

Primary mobile engines are Chromium and WebKit; Firefox gets an independent smoke pass. Baseline portrait coverage: 320×568, 360×640, 390×844 and 430×932, plus a 320×480 stress viewport and 844×390 landscape. Rotate within a session, not only between fresh contexts. Hardware-notch injection is identified separately from real-device testing.

The release matrix includes:
- Every mission's ready briefing, critical objective transition and actual outcome; at least one normal-motion and one reduced-motion visual path per boss.
- All eight player tribe kits and all 24 variants deployed through touch controls, with correct side, silhouette, ability feedback and role label.
- All 12 skill animations and authoritative outcomes, including cancelled targeting, invalid target, near-boundary taps and keyboard zone selection.
- Recruitment/relic reward, equipment persistence, locked-option explanation, original-mode return, evolution and prestige/reset summaries.
- 44×44 hit regions for normal controls; no overlapping actions, clipped caption, inaccessible close button or click-through after dismissal.
- Keyboard focus entry/trap/return, Escape, assistive names, non-color boss tells, 200% text reflow and no horizontal document overflow.
- Console exceptions and failed asset responses recorded for every session.

All main mission solutions are exercised on a browser, but combinatorial loadout/era permutations are domain tests, not claimed browser runs. Representative visual review is mapped to specific screenshots rather than a global “all screenshots checked” claim.

## 6. Rendering, assets and offline release gate

The known WebKit blank-battlefield case remains an open risk. Reproduce the original repeated battle → menu → retreat → retry sequence and the new expansion selector/loadout sequence. Run at least 20 consecutive cycles in each engine, capture actual world pixels and inspect baseline, midpoint and final frames.

A nonzero canvas, live context or stable DOM count is insufficient. When a blank frame appears, compare a renderer post-render capture and the composed page screenshot; record the discrepancy without assuming either proves a harmless flake. An unresolved reproducible blank expansion battlefield blocks a clean-release claim. Any explicitly accepted risk is documented separately, not silently closed by this specification.

Offline checks begin with a fresh profile/cache, verify the entire required pack, then reload without network and actually start, deploy, cast and finish or retreat. Exercise partial pack download, missing image, failed manifest hash, HTTP 503, cache unavailability, old/new worker overlap and failed update. Keep the last complete playable pack.

Explicitly record WebKit `setOffline` internal errors as unverified browser checks when applicable. Neither Chromium success nor a linked upstream issue certifies physical Safari. A real iPhone/Safari offline-return check and a real Android/Chrome check are separate release evidence.

Measure compressed transfer sizes and decoded texture estimates against the parent budgets. Run a ten-minute repeated combat/selection session on representative mobile hardware and report frame-time distribution, visible stalls and memory trend. No claim of device acceptance may be inferred from a fast CI runner. Failure to access hardware remains a documented gap.

## 7. CI and PR discipline

This specification changes no workflows. `Verify game` remains manual-only. During implementation, the inexpensive source/content tests and build are the automatic baseline. Run the extensive mission/browser matrix deliberately at integration milestones, not on every documentation edit or tiny commit.

Do not open more diagnostic branches merely because a browser anomaly is intermittent. Record one reproducible hypothesis, the bounded probe and its result. Stop speculative product patches when the probe does not identify a game-side cause.

The eventual implementation PR must distinguish:
1. Completed playable content and verified fixes.
2. Source tests, domain simulations, browser executions and screenshots actually inspected.
3. Migration and original-game compatibility evidence.
4. Failing checks, accepted risks and untested device/performance paths.

A specification-only draft is not a playable expansion. A first-region slice is not the 60-mission release. The game is not described as bug-free merely because its selected tests pass.

## 8. Written-spec self-review

Before submission, verify counts and unique codes; check the unlock graph and all grant references; cross-check status/targeting rules; confirm the old/new save and campaign boundaries; and reject placeholder entries.

Resolved decisions include separating region IDs from original eras, preserving original captain functionality, making all essential grants main-path rewards, limiting equipment to three skills/one relic, replacing an ambiguous duration relic with Star Map's explicit widened-zone rule, and treating visual and offline browser gaps as unresolved until verified.

The results of this document review are not product test results. Written-spec review is followed by implementation planning; implementation, new art and the acceptance matrix above are still to be executed.
