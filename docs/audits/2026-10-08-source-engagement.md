# Almo7areboon bounded source audit — 8 October 2026

Base: `ac2910163205f467248bec9e68632fd9bf650591`. Branch: `review/2026-10-08-engagement`.

Seven independent defects have observed failing regression tests followed by passing production fixes. These are seven **source-verified candidate iterations**, not seven native-accepted iterations. The parent owns independent review and integration. Local Chromium exits with SIGTRAP before a page exists; no local screenshot or mobile acceptance is claimed. Existing PR 186’s field controller, gate label, world-play stylesheet and gate readiness test are excluded.

The idea record below documents the bounded decisions made during the RED/GREEN work. Deferred ideas are checks or alternatives; they are not implemented features or extra cycle counts. Platform research favors immediate feedback, fair complete loops and interruption safety; it supplies no popularity or retention guarantee.

## Candidate 1: Discoveries stay readable

**Identify:** A successful discovery replaces the detailed receipt with the compact result, which has no story-discoveries node.
**Define / 5Ws:** Who: The player who deliberately explores a won battlefield. What: the named defect. Where: Result Details after a fragment or provision selection. When: this precise existing transition. Why: Keep the accepted story outcome visible without granting a second reward.
**Explore:** twenty bounded ideas:

1. Keep the existing detailed receipt after an accepted discovery.
2. Open the existing discovery disclosure after refresh.
3. Retain the found fragment’s exact narrative copy.
4. Show the selected provision in the existing receipt.
5. Keep compact completion as the default first result.
6. Preserve Back to result as the explicit exit.
7. Read the canonical discoveries bitmask.
8. Check the pending receipt remains byte-identical.
9. Check coins do not change when redisplaying.
10. Avoid a second persistence call for an already detailed result.
11. Keep session recovery authoritative.
12. Keep the same result modal identity.
13. Retain read-only rendering.
14. Reuse current chapter artwork.
15. Retain ordinary Details keyboard entry.
16. Check an already-found button is disabled.
17. Retain reduced-motion result policy.
18. Inspect disclosure scroll and focus natively.
19. Inspect the story paragraph on a short phone.
20. Do not add a notification panel or reward animation.

**Act:** implement the smallest shared production correction and execute the actual shell functions or real Game/presenter in a failing regression first.
**Look back:** `tests/main-integration.test.ts`: accepted discovery stays in expanded receipt and shows the newly found story; checks the disclosure receives `open`, found copy, unchanged coins and held receipt. Observed RED → GREEN. Full-suite/build verification is recorded below. Native visual, focus, touch, rotation and 200%-text verification remain pending.

## Candidate 2: Available modal focus

**Identify:** Same-modal refresh prefers a disabled prior/requested command; native focus silently fails and leaves the replaced control stranded.
**Define / 5Ws:** Who: A keyboard player whose next action becomes unavailable. What: the named defect. Where: The shared modal animation-frame focus restore after refresh. When: this precise existing transition. Why: Choose a live action while retaining the established focus and scroll owner.
**Explore:** twenty bounded ideas:

1. Exclude disabled previous commands.
2. Exclude disabled requested commands.
3. Also respect aria-disabled commands.
4. Retain enabled requested-command priority.
5. Retain enabled previous-command priority.
6. Keep enabled Chronicle action matching.
7. Keep fresh outcome-heading focus.
8. Fall back to the existing available control list.
9. Keep the dialog fallback when no control exists.
10. Preserve same-modal scroll.
11. Reset scroll only on a cross-modal transition.
12. Retain modal-version cancellation.
13. Retain disposed/hidden guards.
14. Keep background inert ownership.
15. Reuse native focus instead of custom keyboard logic.
16. Verify the action actually accepts focus in a native browser.
17. Check 200%-text focus reveal.
18. Check touch dismissal remains guarded.
19. Do not add a dedicated focus menu.
20. Exercise requested and previous cases in one shared fix.

**Act:** implement the smallest shared production correction and execute the actual shell functions or real Game/presenter in a failing regression first.
**Look back:** `tests/modal-focus.test.ts`: disabled requested and previous commands both fall back to the available action while retaining scroll. Observed RED → GREEN. Full-suite/build verification is recorded below. Native visual, focus, touch, rotation and 200%-text verification remain pending.

## Candidate 3: Honest summon conflict outcome

**Identify:** An accepted summon followed by a save conflict enters the unavailable-pack branch and falsely says gems were not spent.
**Define / 5Ws:** Who: A player spending existing gems in Cards. What: the named defect. Where: Immediately after canonical summon dispatch and guarded persistence. When: this precise existing transition. Why: Let recovery describe ownership without denying the transaction that already settled in memory.
**Explore:** twenty bounded ideas:

1. Separate accepted dispatch from post-save playability.
2. Return immediately when recovery takes ownership.
3. Show card results only while the session remains playable.
4. Keep rejected-pack feedback for real admission rejection.
5. Keep exact canonical gem costs.
6. Check the canonical summon count advances once.
7. Check in-memory gems reflect the accepted cost.
8. Retain the authoritative recovery modal.
9. Avoid a false unspent-gems toast.
10. Do not refund or redispatch from presentation.
11. Do not overwrite the saved profile on conflict.
12. Keep current random seed rules.
13. Reuse the current summoned-card presenter.
14. Keep existing summon-audio gates.
15. Keep owned successful summons unchanged.
16. Check temporary play follows existing persistence policy.
17. Check a quota failure remains distinguished from a conflict.
18. Inspect Cards return focus natively.
19. Retain existing pack odds disclosure.
20. Avoid new monetization or remote recovery features.

**Act:** implement the smallest shared production correction and execute the actual shell functions or real Game/presenter in a failing regression first.
**Look back:** `tests/main-integration.test.ts`: accepted summon followed by save conflict checks the canonical 100-gem spend, one draw, session recovery and absence of false rejection. Observed RED → GREEN. Full-suite/build verification is recorded below. Native visual, focus, touch, rotation and 200%-text verification remain pending.

## Candidate 4: Stable save-status recovery

**Identify:** Late save failure/recovery updates savedWarning but leaves open Preferences or Save recovery copy stale.
**Define / 5Ws:** Who: A player reviewing preferences or exporting a backup. What: the named defect. Where: The stable status row after an owned persistence attempt. When: this precise existing transition. Why: Keep visible data-safety advice current without replacing fields or moving focus.
**Explore:** twenty bounded ideas:

1. Refresh the existing Preferences status after persistence.
2. Give the existing recovery status a stable ID.
3. Refresh recovery status after persistence.
4. Reuse preferenceNotice as the single copy owner.
5. Keep field DOM nodes unchanged.
6. Keep the active field focus unchanged.
7. Keep dialog version unchanged.
8. Keep scroll unchanged.
9. Check both failure and successful retry.
10. Keep the canonical savedWarning boolean.
11. Keep lastSavedAt memory-only.
12. Do not change the live profile while saving lastSeen.
13. Skip repaint after ownership loss.
14. Keep temporary-session explanation authoritative.
15. Do not add a new warning modal.
16. Keep one initial failure toast.
17. Do not add background retries.
18. Check export remains available.
19. Inspect persistent copy while the dialog scrolls.
20. Keep the save key and schema unchanged.

**Act:** implement the smallest shared production correction and execute the actual shell functions or real Game/presenter in a failing regression first.
**Look back:** `tests/main-integration.test.ts`: late save failure and recovery check both stable status rows, focus, markup/version and unmodified profile. Observed RED → GREEN. Full-suite/build verification is recorded below. Native visual, focus, touch, rotation and 200%-text verification remain pending.

## Candidate 5: Expedition receipt direction

**Identify:** A won expedition receipt advertises the next ordinary chapter and paints its landscape although the next encounter remains in the current chapter.
**Define / 5Ws:** Who: A player completing one of the three expedition encounters. What: the named defect. Where: The full optional receipt before explicit provision/continuation. When: this precise existing transition. Why: Describe the actual ongoing route so the completion choice teaches the real loop.
**Explore:** twenty bounded ideas:

1. Read the canonical active expedition.
2. Name the completed encounter number.
3. Direct intermediate encounters to explicit provisions.
4. Direct the last encounter to bringing the company home.
5. Keep ordinary chapter continuation wording unchanged.
6. Keep the expedition’s current chapter landscape.
7. Retain the existing expedition controls.
8. Do not auto-select a provision.
9. Do not settle by rendering.
10. Check actual Game expedition victory.
11. Check ordinary progression remains unaffected.
12. Keep loss teaching unchanged.
13. Preserve route consequence copy.
14. Preserve carried-food numbers.
15. Keep the earned receipt intact.
16. Reuse the existing writing tone.
17. Do not add travel-map chrome.
18. Inspect long receipt scrolling on mobile.
19. Check title/landscape agreement.
20. Keep expedition economics entirely canonical.

**Act:** implement the smallest shared production correction and execute the actual shell functions or real Game/presenter in a failing regression first.
**Look back:** `tests/simple-results.test.ts`: an actual expedition victory must describe encounter 1 and provisions, with read-only profile/state. Observed RED → GREEN. Full-suite/build verification is recorded below. Native visual, focus, touch, rotation and 200%-text verification remain pending.

## Candidate 6: Timeline-limit expedition continuation

**Identify:** The compact result checks ordinary timeline completion before an active expedition, hiding a continuation the canonical Game accepts.
**Define / 5Ws:** Who: A player voluntarily replaying an expedition at the retained timeline limit. What: the named defect. Where: Won compact result with an active expedition in timeline 1000/chapter 6. When: this precise existing transition. Why: Keep the three-encounter loop complete without bypassing the ordinary timeline cap.
**Explore:** twenty bounded ideas:

1. Prioritize active won expedition continuation.
2. Keep intermediate provision choices explicit.
3. Keep final Bring company home action.
4. Retain three compact result buttons.
5. Retain ordinary Return to chapters at the cap.
6. Check canonical provision dispatch succeeds.
7. Check canonical continue dispatch succeeds.
8. Check the chapter stays at six.
9. Check the expedition advances exactly one stage.
10. Check no render mutation.
11. Do not change timeline admission.
12. Do not change save schema.
13. Do not award a new timeline.
14. Keep Home preserving the receipt.
15. Keep Details available.
16. Keep Escape from silently retrying a held capped expedition receipt.
17. Inspect the two provision targets natively.
18. Check final encounter action label.
19. Use the same existing continuation handler.
20. Avoid a special alternate game mode.

**Act:** implement the smallest shared production correction and execute the actual shell functions or real Game/presenter in a failing regression first.
**Look back:** `tests/simple-results.test.ts`: final-timeline expedition output retains three controls and accepts canonical provision/continue, stage 0→1 in chapter 6. `tests/main-integration.test.ts`: Escape retains its exact held terminal receipt instead of silently retrying. Observed RED → GREEN. Full-suite/build verification is recorded below. Native visual, focus, touch, rotation and 200%-text verification remain pending.

## Candidate 7: Mastery gem receipt honesty

**Identify:** The full settled mastery receipt still advertises a legacy up-to-10-gem victory bonus even when the actual credited mastery payout is 50 gems.
**Define / 5Ws:** Who: A player reading the reward breakdown after a first clear or replay. What: the named defect. Where: The optional full receipt after the canonical mastery settlement. When: this precise existing transition. Why: Describe credited rewards accurately without changing any reward amount.
**Explore:** twenty bounded ideas:

1. Identify mastery-v1 settled receipts.
2. Suppress the legacy bonus claim for those receipts.
3. Keep the existing exact mastery gem breakdown.
4. Keep migrated legacy receipt wording.
5. Check a real first-clear settlement credits 50 gems.
6. Keep the canonical earned-mask reward.
7. Check rendering does not grant gems.
8. Check rendering does not alter coins.
9. Keep normal combat separate in the existing breakdown.
10. Keep newly earned seals visible.
11. Keep replay admission unchanged.
12. Keep gem cap rules unchanged.
13. Keep ordinary compact reward copy unchanged.
14. Keep current coin-count animation policy.
15. Do not add reward fireworks.
16. Do not add a new earnings panel.
17. Use existing English number formatting.
18. Inspect reward hierarchy in the full receipt.
19. Keep original world art.
20. Treat clarity as a testable fix, not a retention guarantee.

**Act:** implement the smallest shared production correction and execute the actual shell functions or real Game/presenter in a failing regression first.
**Look back:** `tests/simple-results.test.ts`: an actual first clear credits 50 mastery gems and the full receipt reports that number without the legacy bonus promise. `tests/interface.test.ts` retains saved/reloaded output equality using the canonical payout. Observed RED → GREEN. Full-suite/build verification is recorded below. Native visual, focus, touch, rotation and 200%-text verification remain pending.

## Acceptance and remaining evidence

- [x] Seven independently reproduced source defects; source tests use real shell functions/presenters and canonical Game dispatch.
- [x] Preserve PR 186’s four files.
- [x] Preserve original artwork, progression, save key/schema, pause/session owners, no analytics/accounts or remote assets.
- [ ] Exact candidate native screenshots at 390×844 and 1280×800, personally inspected.
- [ ] Required touch/rotation/4× CPU/200%-text matrix, focus and backgrounding acceptance.
- [ ] Independent exact-diff review and external CI before integration.

Parent production play confirms deployment, enemy selection, Freeze and Meteor are reachable and change battle feedback. That live build is separate from this local candidate. The desktop recruit target is inside the viewport but crowded near its bottom edge; this is a salience observation, not a proven fold or mobile failure. No overlapping stylesheet change is made.

## Final source verification

- Fresh `npm test`: **1,345 / 1,345 pass**, zero skipped/cancelled, exit 0 (209.4 seconds).
- Final `npm run build`: TypeScript, Vite and size gate pass, exit 0; total gzip JavaScript **487,948 / 512,000 bytes**. Vite’s existing Phaser chunk warning is informational.
- Focused final shell/modal/result suite: **176 / 176 pass**.
- `git diff --check`: clean. All four PR 186 files have an empty diff.
- The preceding full run was 1,343 / 1,344: its sole failure was the older interface assertion demanding the obsolete 10-gem promise on a real 50-gem mastery receipt. That assertion now derives the amount from the canonical receipt while retaining reload equality.
- Native/mobile/screenshot acceptance: **not executed for this candidate**; environment blocks Chromium before page creation. Seven source-verified candidate iterations; zero native-accepted iterations.
- Independent review and external integration remain parent-owned and pending. No remote push, PR, merge or deployment was performed by this worker.
