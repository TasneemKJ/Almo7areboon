# Chapter mastery and forward evolution

Status: implementation after merged tactical PR37 and locally integrated production save-session guard; guard browser acceptance/merge remains a release dependency. This document authorizes no overlapping encounter or trait implementation.

## Intent and scope

Give each visit to the six Levantine chapters a visible purpose: win the battle, protect the quiet settlement, or improve one specific part of the commander's play. Evolution should strengthen the army without erasing the journey. Keep the existing battlefield, result dialog, battle picker, evolution screen, coins, gems, cards, and controls. Add no screen, persistent panel, currency, daily gate, streak, or mandatory mastery requirement.

The preceding tactical PR owns authored waves, threat telegraphs, and automatic guard/pierce/sweep behavior. This PR consumes that combat through normal actions. It must not duplicate wave definitions, change traits, or require manual lanes or new combat controls.

## Evidence and pacing target

The read-only audit used the deterministic simulation at 60 Hz. With no cards, upgrades, or skills, immediate Stone-age melee deployment won in 118.77 seconds; waiting ten seconds before deploying won in 56.07 seconds. Both earned 323 coins and kept full gate health. In later chapters, stockpiled melee took 160 seconds, including 34.32 seconds after the enemy army was gone; mixed deployment took 50.73 seconds.

Evolution currently resets the selected and furthest opponent to zero. A newly evolved Space-age army needed four trivial victories, totaling 142.79 seconds, before it could afford its first current-age food upgrade. Five preliminary victories consumed 185.47 seconds before the equal-age opponent. Prices use the army's age, while earnings use the opponent's age; this reset creates the mismatch. This PR removes that backtracking without replacing the entire economy.

The original audit preceded concurrent main changes. Current retention rewards include ten gems per victory, 100 per new timeline, ten lifetime quests totaling 1,650 gems, and an optional local-calendar reward of 30–90 gems. Preserve these existing systems and their saved daily fields. A single card costs 100 gems. Mastery adds finite, legible rewards within this updated loop; fresh traces must report quest and daily claims explicitly rather than assuming the old 200-gem quest budget.

Target a first timeline of approximately 6–12 minutes of active combat for a competent new player, with room for optional rematches. No mastery seal is necessary to advance. The merged tactical build, not the old audit, determines whether these targets are actually met.

## Six records and eighteen seals

Add `profile.mastery` containing `timeline` and exactly six chapter records, indexed by `enemyAge`. Each record contains:

- `earnedMask`: integer 0–7; bit 1 is Clear, bit 2 is Gate Unbroken, bit 4 is the chapter's third seal.
- `bestSeconds`: nullable best winning simulation time.
- `bestGateDamage`: nullable lowest actual gate damage during a winning attempt.

The mask is the settlement ledger as well as the visible earned state. Its Clear bit also proves that this chapter may be advanced past, even after a later rematch is lost. It is not a claim queue. Keep only the current timeline's six records. There is no expanding array of timeline history, timestamp system, or attempt history. Personal bests are descriptive and never determine whether a reward has already been credited or whether a chapter is cleared.

All seals require a real transition from `running` to `won`. Losses keep normal combat earnings but grant no seals. Replays, older opponents, stronger armies, and existing card bonuses are eligible: improvement through progression is part of this game. Do not silently normalize armies or impose a second challenge mode.

Every chapter shares:

- **Clear:** destroy the enemy gate and win.
- **Gate Unbroken:** win with `gateDamageTaken === 0` throughout the attempt. Healing, upgrading the gate, or finishing at full health cannot undo a previous hit.

The third seal is fixed for each chapter:

| Chapter | Seal | Exact winning condition | Player-facing instruction |
| --- | --- | --- | --- |
| First Fires | Before the Embers Fade | `state.time <= 75` simulation seconds | Win within 1:15. |
| Olive Terraces | Every Hand | Every entry of `deployedByKind` is at least 1 | Win after deploying all three troop roles. |
| Harbor Watch | A Steady Watch | `stats.skillsCast <= 1` | Win using at most one skill. |
| Lantern Quarter | A Moment of Stillness | `maxFreezeTargets >= 3` | Freeze at least three living enemies together, then win. |
| Hillside Watch | Break the Gathering | `meteorKills >= 3` | Defeat at least three enemies with one meteor, then win. |
| Courtyards Beyond | A Small Company | `stats.deployed <= 18` | Win with no more than eighteen deployments. |

The checks are inclusive. Speed means simulation time; 2× speed, frame rate, pause time, and browser suspension do not change the criterion. A successfully deployed unit counts even if it later dies. Rejected deployment and skill actions count nothing. Three skills remain once per battle as currently defined. Third seals intentionally test several existing verbs without depending on the names or cosmetic metadata of the tactical traits.

Evaluate all three seals independently on every new victory; award any newly satisfied combination together. For example, a replay can earn only Gate Unbroken if Clear and the third seal were already earned. Previously earned seals never become unearned after a worse result.

## Minimal authoritative metrics

Extend `BattleStats` and its sanitizer with only:

- `gateDamageTaken`: actual damage subtracted from the player gate, excluding damage to friendly units. Increment at the authoritative base-damage calculation; never decrement after an upgrade.
- `deployedByKind`: exactly three nonnegative integer counts, incremented only after a successful player spawn.
- `maxFreezeTargets`: maximum living enemy count captured at the moment a successful freeze is dispatched. It counts the current enemies affected, not future spawns during the freeze duration.
- `meteorKills`: enemies whose health reaches zero during that successful meteor's damage resolution. With the existing once-per-battle skill, this is the single-cast count.

Use existing `skillsCast`, `deployed`, simulation time, food, living units, and used skills for everything else. These are simulation counters, not aggregates reconstructed by the renderer from drained events. Initialize them in `newBattle()`, retain them in new pending victories, and reset them on retry. Optional old statistics default safely for display but must never be evaluated for new rewards during load.

## Exact provisional reward budget

For chapter `b`, let `S = eraEconomyScale(b) = 8 ** b`. Use the opponent's chapter, not the player's current army age. Mastery coin amounts are fixed and **do not receive card coin multipliers**; normal combat rewards retain their existing multipliers.

| Newly earned seal | Coins | Gems |
| --- | ---: | ---: |
| Clear | `150 * S` | 20 |
| Gate Unbroken | `50 * S` | 15 |
| Third seal | `100 * S` | 15 |
| Complete chapter | `300 * S` | 50 |

| Chapter | Maximum one-time mastery coins |
| --- | ---: |
| First Fires | 300 |
| Olive Terraces | 2,400 |
| Harbor Watch | 19,200 |
| Lantern Quarter | 153,600 |
| Hillside Watch | 1,228,800 |
| Courtyards Beyond | 9,830,400 |

The clear coin reward funds one initial ranged unlock at a matched army age. Gate Unbroken funds one initial food upgrade. The historical pre-tactical opening earned 323 normal coins; its 623-coin perfect-win forecast is not a claim about the new encounters. The latest reported tactical opening trace earns 260 normal coins because an early victory cancels later arrivals. With all three proposed seals that example gives 560 coins: enough for both unlocks (550), or an unlock plus production improvements, but not both unlocks plus food (600). Other action traces can earn different combat coins. Preserve this meaningful spending choice; verify the actual first-win budget again on the merged tactical build rather than assuming the historical buy-everything outcome. A clear without the optional seals must still offer a useful purchase decision.

Six first victories with only Clear award 120 extra gems; all eighteen seals award 300 extra gems. Including the unchanged six victory rewards and 100-gem timeline reward, that is **280–460 gems per six-win timeline** before any extra replay victories. Add the existing 100 starting gems, only the lifetime quests actually reached and claimed, and any explicitly recorded daily claim. The ten lifetime quests total 1,650 gems across their milestones; that total is not a guaranteed first-timeline award. Fresh campaign traces must show each claim and the resulting wallet rather than assume a fixed first-timeline maximum. Replays still earn normal combat coins and ten victory gems; they do not repeat mastery rewards.

These values are provisional balancing constants, not a promise that all seals will be earned on a first pass. Do not alter card prices, summon odds, base combat rewards, quest rewards, or the timeline reward in this PR.

### Existing-combat economic projection

A scratch-only projection credited the proposed seals and preserved the opponent after the existing evolution action; product source remained unchanged. Combat therefore used the pre-tactical game. The policy used the starter summon, claimed available quests and bought affordable single cards between attempts, spent food after ten seconds, used food after eight seconds, meteor after 33 seconds when at least three enemies were alive, and freeze after 44 seconds. Before an attempt it evolved if affordable; otherwise it bought ranged, food toward level three, heavy if affordable, then more food. Deployment cycled heavy/ranged/melee/ranged when available, ranged/melee/ranged with only ranged unlocked, or melee alone.

| Opponent chapter | Army index | Food level | Win time | New seals |
| --- | ---: | ---: | ---: | --- |
| First Fires | 0 | 0 | 47.3s | All three |
| Olive Terraces | 0 | 4 | 64.3s | Clear, gate |
| Harbor Watch | 1 | 0 | 59.3s | Clear, gate |
| Lantern Quarter | 2 | 0 | 58.5s | Clear, gate |
| Hillside Watch | 3 | 0 | 57.8s | Clear, gate |
| Courtyards Beyond | 4 | 0 | 58.5s | Clear, gate |

Total: 345.7 seconds, thirteen seals, five purchased cards before the final victory, and 85 remaining gems before the 100-gem timeline award. This is a budget forecast, **not an implemented-feature test or evidence about the upcoming tactical balance**. Finishing with a younger army remains valid; do not require six evolutions simply to prolong the campaign.

## Settlement and pending victories

Settle in the simulation's existing one-time win transition, after normal victory rewards and before publishing the win event or allowing a save of the completed result:

1. Evaluate eligibility from this attempt's authoritative metrics.
2. Compute `newMask = eligibleMask & ~record.earnedMask`.
3. Calculate the fixed coin/gem amounts for `newMask`, apply the existing wallet caps, and capture the actual amounts credited.
4. Update the record mask and personal bests, wallets, and the new settled `pendingVictory` together as one in-memory profile update. Award subsequent battle access in that same update: `furthestBattle = Math.max(furthestBattle, Math.min(5, enemyAge + 1))`. Thus earned access exists before the player can choose a rematch; it does not depend on pressing Continue.
5. Persist that complete profile through the existing save path; rendering, retry, next, evolution, loading, and dialog reopening never run settlement.

Extend pending victory with a discriminated settlement snapshot:

- New results use `settlement: 'mastery-v1'` plus `eligibleMask`, `newMask`, `masteryCoins`, and `masteryGems`.
- Old results use `settlement: 'legacy'` and no newly credited mastery.

The snapshot records actual credited amounts, including wallet-cap effects. Mark an eligible seal earned even if a wallet cap reduces its payout; there is no deferred claim. `state.earned` and `pendingVictory.earned` include normal plus mastery coins, while the snapshot permits the result dialog to show the breakdown without adding it twice. The new snapshot and record mask must agree; invalid optional settlement metadata is discarded as legacy display data, never interpreted as an instruction to pay.

Keep the complete profile in the existing single serialized save. A reload before that profile was saved sees the previous state; a reload after it was saved sees both the credit and settled ledger. Retain existing write-failure reporting and backup recovery. This design adds no cross-device or anti-rollback guarantees.

## Evolution, advance, and timeline reset

Evolution still requires and spends its configured cost, clears the remaining coin wallet, resets food/base upgrades and troop unlocks, and advances the player's age. **It leaves `enemyAge`, `furthestBattle`, and all six mastery records unchanged.** Cards, gems, quests, lifetime counters, summon state, and settings retain their existing behavior. The player can immediately fight the current obstacle or choose any unlocked earlier opponent.

If evolution occurs while a settled victory is awaiting Continue, preserve that pending result and its won phase. Evolving must not force the player to win the same opponent again to recover Continue. Reuse a side-effect-free pending-victory restoration path after rebuilding age-dependent battle values; retain recorded stats, time, earnings, and settlement unchanged. Ready/lost evolution creates a fresh ready battle as usual.

### Durable continuation after rematches

Production-safe design decision: use the existing saved Clear bit, not a new campaign-history field or a fabricated victory, to authorize continuation. Restricting rematches to after normal Continue would prevent a same-timeline final-chapter rematch because that Continue resets the timeline. The durable Clear rule supports both ordinary and final rematches with one contract.

The existing `next` action is allowed exactly when the battle is not `running` and either the current state is `won` or the current timeline's record for the **selected** `enemyAge` has its Clear bit set. Reject it during all running battles, including paused battles. Also reject it unconditionally when `enemyAge === 5 && timeline === 1000`. Use a shared status/helper for this rule and UI availability; missing or wrong-timeline records do not prove Clear.

- For selected chapters 0–4, Next sets `enemyAge` to that chapter plus one, retains `Math.max(existingFurthestBattle, nextChapter)`, clears any pending result, and starts a ready battle. It does not jump to the furthest opponent or lower previously earned access. A replay of chapter 1 with chapter 5 already unlocked still continues to chapter 2 and leaves chapter 5 available.
- For selected chapter 5 below timeline 1000, Next Timeline performs the existing explicit campaign/economy reset, increments `timeline`, grants the existing 100 gems exactly once, and creates six empty records tagged with the new timeline. It may follow a fresh win, a lost rematch of that cleared chapter, or a ready state restored after that rematch. Show that seals and their rewards start afresh while cards, gems, quests, and lifetime records remain.
- Advancing from a ready/lost cleared chapter never increments wins, pays another battle or mastery reward, changes the recorded outcome to won, or reconstructs a previous winning army. The only payout in this action remains the explicitly selected timeline transition's existing 100 gems.
- Retry clears `pendingVictory` and battle-only state as currently defined. It retains the Clear bit, all other earned seals, and furthest access. Pending victory is a receipt for the latest settled win, not the sole proof of permission to advance. A lost rematch can retain its truthful Regroup result and still offer Continue.

Narrow legacy exception: a migrated won result can have a valid pending victory but no earned Clear bit. It must use Continue before optional rematching; do not expose a “Try for remaining seals” button there, and reject `retry` from that won/no-Clear state until it advances. This preserves its unadvanced victory without inventing a new paid seal or historical-performance field. Ordinary chapters can then be replayed through the picker; an old final victory continues into the new timeline, where mastery is available normally. The terminal timeline-1000 Return to chapters route below is allowed even for this legacy result because further advancement is already prohibited. Loss retry and new settled wins with Clear retain their normal behavior.

### Reachable result and preparation routes

The current result dialog cannot be dismissed and makes the background inert; its `resultShown` guard also suppresses automatic reopening in the same phase. Do not rely on background navigation, Escape-to-dismiss, or a second phase transition to make these routes work.

| Starting surface | Visible action and exact route |
| --- | --- |
| Won result | Keep Continue/Next Timeline primary. When its saved Clear bit exists, offer “Try for remaining seals” through the existing `retry` action if any seal is missing, or “Replay” if all three are earned; that bit protects advancement. A migrated won result without Clear uses the Continue-first exception above. |
| Won result, another army age available | Show an explicit **Evolve · [current cost]** action when the age/opponent prerequisite holds; disable it if coins are insufficient. It replaces the result with the existing evolution confirmation dialog. |
| Evolution confirmation entered from the result | Cancel, its close button, and Escape explicitly call the result-opening path. Successful confirmation dispatches evolution, then explicitly reopens the result. Do not merely close the modal or depend on `resultShown` becoming different. Keep modal isolation/focus valid during replacement. |
| Reopened result after evolution | Recompute the current age, next evolution cost, affordability, and age/opponent prerequisite from the updated profile. Keep the original outcome/receipt and Continue; do not use a cached cost or grant a reward. A rejected evolution keeps the confirmation open with refreshed availability and a working return route. |
| Lost rematch of a cleared chapter | Keep Regroup and Retry truthful. Add **Continue to [next chapter]** or **Next Timeline** using the shared `next` availability rule. An uncleared loss offers no continuation. |
| Ready state, including reload after a lost rematch | The existing battle picker is available. If its currently selected chapter is cleared, its existing modal footer includes **Continue to [next chapter]** or **Next Timeline**. It dispatches the same `next` action and closes to the new ready battle. Selecting a chapter still selects it for normal replay; do not repurpose the chapter-selection button or start a battle automatically. |

The battle picker's Next Timeline action includes the same concise reset explanation as the final result. This existing modal footer is the reload recovery route; add no persistent panel or new gameplay control. Saving a loss still does not serialize active battle state. On reload the player returns to ready, with the saved Clear bit and access intact.

At timeline 1000, reject the final `next` action without resetting mastery, paying another timeline reward, or trapping the user in the result. A won final result, or a lost rematch of that cleared final chapter, provides **Return to chapters**. This dispatches existing `retry` to obtain a real ready state, closes the result, and opens the existing battle picker; retain coins, earned masks, personal bests, and battle access. Escape on this terminal result invokes that same route. The picker has its ordinary working close/Escape controls, no Next Timeline action, and permits replay and access to settings once closed. From a ready reload, open the same picker directly. A legacy pending final win can also return this way without receiving new mastery awards. Describe the completed journey when proven by a win/Clear; otherwise use neutral “The final timeline” copy rather than inventing a result.

## Save compatibility

Use save schema version 3. Continue decoding versions 1 and 2, including the existing version-1 card identity mapping. Keep the current save key, backups, size bound, unknown-future-version protection, and import/export behavior.

On version-1/2 migration, preserve all existing validated progress and currencies. Initialize six empty mastery records tagged with the current timeline. Do not infer a clean gate, speed, composition, or any paid mastery seal from `furthestBattle`; old access remains available, and real replays may earn the newly introduced rewards. Loading itself grants nothing.

An old `pendingVictory` remains a valid won result with its existing already-credited earnings and `settlement: 'legacy'`. Do not evaluate its missing/new counters or retroactively award a seal. Continue works immediately. Until that continuation, a legacy won result without Clear cannot begin an optional rematch that would discard its only proof of victory. After Continue, a subsequent real replay can earn mastery; a legacy final victory begins its new timeline first. The explicit terminal return route remains available at timeline 1000.

Validate the reward ledger independently of descriptive personal-best values. In each record, retain a valid finite integer `earnedMask` in `0..7` even if either best field is absent, a string, negative, nonfinite, or otherwise malformed. Sanitize each bad best value to `null` individually; do not reset the record, its valid mask, its sibling best value, or the other five records. In particular, `{ earnedMask: 7, bestSeconds: 'bad', bestGateDamage: null }` remains fully earned and cannot repay any seal on the next final-chapter win. Missing or nonobject records initialize empty; malformed mask values initialize that mask to zero without granting currency. Sanitize new combat counters separately with finite, nonnegative bounds.

Discard mastery records tagged for another timeline rather than attaching their rewards to the current one. Unknown future schemas must continue failing closed so an older build cannot overwrite a newer save. Recovery from malformed optional display data must never turn a valid paid seal back into an unpaid reward.

## Existing-screen presentation and next-attempt advice

Use three small olive, gate, and chapter-seal marks within the existing result and battle-option layouts. Keep the chapter landscape, warm manuscript colors, and quiet settlement language. Earned marks need a shape/check difference and accessible labels, not color alone. Motion is brief and respects reduced motion. These are accomplishments in a storybook journey, not another currency bar.

- **Results:** show newly earned seals, already earned seals, exact credited coins/gems, and the unmet third criterion with the achieved value. Use the explicit continuation, rematch, evolution, and terminal routes above. A rematch loss remains a loss even when previous Clear permits advancement.
- **Battle picker:** show three earned/unearned marks, the third criterion, and remaining one-time rewards inside each existing chapter option. Retain personal-best time only where it fits without crowding the mobile layout. The selected cleared chapter's footer provides the continuation route above, including after a reload; it never pays a reward simply by opening or selecting.
- **Evolution:** replace every claim that unlocked battles reset. Explain the local economy reset and retained opponent/access in the existing confirmation copy. Explain the seal reset at Next Timeline.
- **Battlefield:** reuse the existing guidance text slot for the relevant objective or tactical advice. Add no persistent panel; threat telegraphs from the tactical PR take priority during immediate danger.

Choose one concrete retry suggestion from actual evidence. Prefer: no successful deployment; affordable food left unused at defeat; only ranged deployments when the gate was hit; an unused skill with an appropriate surviving enemy group; an affordable troop unlock; then the nearest unearned chapter objective and its actual result. Use current `food`, `skillsUsed`, living units, wallet, new counters, and existing stats. Do not record another history for advice and do not always prescribe food production. Never claim that a suggestion guarantees victory.

## Implementation boundaries

- `src/game/mastery.ts`: six definitions, reward constants, pure eligibility and settlement calculation, record initialization/validation helpers.
- `src/game/types.ts`, `statistics.ts`: bounded record/snapshot types and the four metrics.
- `src/game/simulation.ts`: authoritative metric increments, one-time settlement and immediate access unlock, shared durable-Clear advancement status, forward evolution, pending-victory restoration, explicit new-timeline reset.
- `src/game/save.ts`: schema migration, validation, and pending settlement handling; preserve backup invariants.
- Existing HUD, results, progression, and evolution modules plus necessary main event wiring: present the simulation's result and reuse actions. Explicitly return from result-origin evolution confirmations, refresh affordability/cost, and provide ready-state and terminal continuation routes. No reward computation in DOM code.
- Existing campaign, progression, recovery, and interface tests, plus a focused mastery test module if it keeps fixtures legible.

Do not change the tactical encounter module or troop traits in this economy PR. If their merged API changes a metric hook, adapt to the authoritative simulation path rather than inventing a parallel combat model.

## Acceptance and verification

1. Demonstrate every seal through reproducible public actions on the merged tactical build. No acceptance test may assign enemy HP to zero, fabricate combat stats, or manually award wallets to prove a seal. Prepared profiles may represent legitimately purchased rosters/cards, but at least one complete first-timeline trace must start from `defaultProfile()`.
2. Run three fresh-profile policies: immediate deployment, reserve-and-counter, and mixed formation. Record attempts, real win/loss times, purchases, seals, and gems/cards. The competent reserve/mixed path should complete within 6–12 minutes of active combat, with no required flawless seals or favorable random draw. An unlucky/common-only deterministic card path must remain viable.
3. The first real victory must fund a useful troop or production purchase. After evolution, a meaningful purchase must be available within one ordinary victory or at most two representative losses against the retained opponent; no compulsory sequence of earlier trivial wins is allowed. Record any failure as a balancing issue rather than loosening the assertion silently.
4. Replay the same chapter without changing its criteria: normal rewards continue, mastery credits are zero. Improve a previously unmet criterion: only its new reward is credited. Verify reward totals against the table, including capped wallets and coin-bonus cards.
5. Exercise a real win → save/reload → result Evolve → cancel/close/Escape → result; repeat with confirmation → refreshed result → Continue. Assert the same saved receipt, no duplicate payouts, refreshed age/cost/affordability, modal isolation/focus, and a working Continue despite unchanged won phase. Verify rejected/insufficient-funds evolution, legacy pending wins, missing metrics, backup recovery, and unknown future versions. A migrated won result with no Clear must reject optional retry, offer its working Continue, and retain that route after evolution/reload; test ordinary and final legacy victories plus the terminal exception. Specifically load a fully paid final chapter with malformed `bestSeconds` and/or `bestGateDamage`, save/reload it, then win a real replay: the valid mask remains 7, each malformed best independently becomes `null`, and mastery credits remain zero. Include a partially paid mask to prove only genuinely unearned seals can subsequently pay.
6. Verify evolution retains exact selected/furthest opponent access and records; new timelines clear only the current-timeline records as specified. Check first win → immediate furthest unlock → retry → real loss → Continue, and the separate branch loss → save/reload to ready → battle picker → Continue. Wins and battle/mastery payouts do not increase on continuation. Run both branches for an ordinary chapter and the final chapter; the latter grants the timeline reward once, clears records once, and rejects a duplicate next action. Repeat an older cleared chapter when furthest access is beyond it: advancing one chapter cannot relock the frontier. An uncleared ready/lost chapter and any running/paused battle must reject next.
7. Exercise pause, 2× speed, and different frame-delta partitions with the same simulation-time actions. Seal results remain deterministic. Test exact boundary rules, zero versus positive gate damage, rejected actions, and three versus two affected enemies.
8. Browser-play a fresh win, failed attempt, mastery replay, evolution, and timeline transition at 320×568 and 390×844. Exercise the exact won→evolve return routes and cleared-rematch loss→reload→picker continuation route, including the final chapter. At timeline 1000 verify final next is rejected, the explicit Return to chapters action and Escape both reach the picker through ready, picker close/Escape restores usable background controls/settings, and reload cannot reopen an inescapable result. Include a legacy terminal pending victory. All troop/skill/upgrade controls remain usable; the next objective, credited reward, and reset consequences are understandable without opening a new screen. Check keyboard and reduced-motion behavior.

Before merging, replace the forecast with a concise recorded result from the merged tactical simulation and browser playthrough. Adjust only the provisional mastery reward constants or third-seal thresholds if the concrete traces justify it; explain any changed target. Broader card/evolution-cost/encounter rebalance belongs in a separately reviewed follow-up.
