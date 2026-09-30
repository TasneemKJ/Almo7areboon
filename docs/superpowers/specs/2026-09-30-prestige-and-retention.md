# Prestige and a lasting legacy

Status: one follow-up PR released after chapter mastery and the production save-session guard have landed. Isolated core implementation may use their integrated, independently reviewed checkpoint while required browser acceptance runs; UI integration and release still wait for both merged dependencies. This document contains no implemented-feature or player-retention claim. It does not replace the reviewed chapter-mastery spec or plan.

## Intent and dependencies

Make finishing a timeline feel like bringing something useful home, then choosing how to approach the next journey. The player should understand the reset before accepting it, retain the permanent collection they earned, and have a reason to revisit unfinished chapter goals without an attendance obligation.

The user asked to also work on prestige and retention. The working assumption is that this means lasting progress and interesting reasons to play again, rather than increasing session length or adding another schedule. Success for this iteration means a truthful, reversible-to-preview reset flow; a finite permanent benefit; a meaningful choice among existing combat verbs; and measured economy/save correctness. Actual player return rates are unknown.

Implement only after these dependencies are integrated:

1. Tactical encounters and automatic troop specialties, including external milestone quests and daily rewards merged into that branch.
2. The production save-session guard. Use its existing central guarded action/persistence paths and recovery precedence.
3. `2026-09-29-chapter-mastery.md`: six current-timeline records, eighteen optional seals, schema 3, exact-once settlement, preserved opponents on evolution, durable Clear-based continuation, and terminal timeline-1000 navigation.

The original external baseline was `439306f7d3683bc2127b774d9ce6fcd52429c98f`; tactical integration reached `984481a` during that audit. This design was rechecked against accepted mastery core `e7df70b5c97a9e5c342e8bedc9a327d99d2bbe85` on 2026-09-30. Integration moved to `92f0a037a89bbca365a4708e4f1395df20608b8f` during the probe, with the identical `src/game` tree `e24c3b4f30543bd228da2583142b7edf9c27b8f7` and no working game-source differences. Combat/UI contracts must be checked again on the eventual merged base. The old three-quest/200-gem assumption and pre-tactical combat projection are not budget forecasts for this iteration.

## What remains after mastery

Cards, gems, quests, and lifetime totals already survive a timeline reset. The reset grants 100 gems, returns the local army/economy to the beginning, and raises the enemy multiplier from `1 + 0.22*(T-1)` to `1 + 0.22*T`. Cards provide lasting randomized power, while chapter mastery supplies finite, visible accomplishments and rewards inside each timeline.

Those pieces leave three concrete gaps:

- A timeline completion gives no deterministic, player-selected permanent benefit beyond the existing gem payout.
- The final result currently performs its reset through a single Next Timeline action. Its short sentence does not provide the exact before/after inventory or a separate confirmation.
- Chapter records intentionally disappear on reset. There is no small permanent acknowledgement that a player chose to finish more of those optional goals before moving on.

This follow-up addresses those gaps. It does not rebalance summon odds, add content to the wave schedule, or claim to solve long-term content variety after the finite legacy is complete.

## Approaches considered

| Approach | Benefit | Cost or limitation | Decision |
| --- | --- | --- | --- |
| A finite legacy rank with one active preparation choice | Deterministic carryover, gives optional seals lasting meaning, lets players adapt existing tactics, bounded save and strength | Requires one saved record, a few simulation hooks, and comparative combat traces | **Selected** |
| A guaranteed card or increasing gem bonus at every reset | Reuses the collection and reward surfaces | Adds income to an economy already receiving mastery, milestone, and daily gems; card bonus/storage caps complicate honest value; little tactical choice | Defer |
| Rotating challenge timelines or a contract board | Can vary replay rules substantially | Adds encounter variants, challenge eligibility, more save state and balance work, and another interface before mastery is proven | Defer |

The selected option is deliberately finite. Repeating a fast, minimally cleared timeline still earns the existing gems and card opportunities. Staying for twelve or eighteen seals can improve the permanent legacy instead. Both routes remain valid.

## Legacy rank and three choices

Add one saved `legacy` record:

```ts
type LegacyChoice = 'hearth' | 'watch' | 'stillness';
type LegacyProgress = { rank: 0 | 1 | 2 | 3; selected: LegacyChoice };
```

Rank 0 has no effect. On an accepted final timeline transition, compute the candidate rank from the timeline being left, before replacing its mastery records:

| Completion evidence | Candidate rank |
| --- | ---: |
| Any legitimate completed-timeline transition, including a migrated legacy victory | 1 |
| At least 12 earned seals in the six current-timeline records | 2 |
| All 18 earned seals in those records | 3 |

Set `rank = max(previousRank, candidateRank)`. A rank can rise from 0 to 3 on one exceptionally complete journey. It never decays, costs currency, stacks by repetition, or depends on a day, streak, playtime, or card draw. Count set bits in validated current-timeline masks only. Wrong-timeline records, personal-best values, and the pending result's displayed earnings are not evidence. Completion eligibility comes from mastery's shared advancement rule, not from seal count alone.

Ranks apply to all three available choices. Exactly one choice is active. These are initial balance constants to verify on the merged simulation:

| Choice | Rank 0 | Rank 1 | Rank 2 | Rank 3 | Purpose |
| --- | ---: | ---: | ---: | ---: | --- |
| **Hearth** | 6 starting food | 8 | 10 | 12 | An earlier opening formation; production rate and later food costs are unchanged |
| **Watch** | ×1 gate health | ×1.10 | ×1.20 | ×1.30 | More room to recover when the line breaks; unit health and damage are unchanged |
| **Stillness** | 7-second freeze | 8 seconds | 9 seconds | 10 seconds | More control from the existing once-per-battle freeze; no extra cast or changed mastery target count |

When Hearth is inactive, starting food is 6. When Watch is inactive, the gate multiplier is 1. When Stillness is inactive, freeze lasts 7 simulation seconds. Do not combine the three columns of benefits. None changes coins, gems, card odds, mastery rewards, upgrade prices, troop damage, or enemy strength.

Watch joins the existing base-health product before the final rounding: `round(180 * 1.65**age * (1 + 0.4*baseLevel) * cardBase * watchFactor)`. Use the same calculation for a fresh battle, upgrade preview, and legitimate base refresh. Watch cannot erase recorded gate damage or qualify a damaged gate for Gate Unbroken.

Stillness preserves existing freeze semantics, including how delayed enemies are affected by the active interval. Mastery's freeze-target statistic remains the living enemies actually present at cast time. A longer freeze never retroactively counts future arrivals as targets. Simulation time, pause behavior, and the once-per-battle skill rule stay authoritative.

All freeze descriptions must consume that same active effect, including the battle skill-button title, accessible description, and existing Skills screen, which currently say seven seconds. Refresh them after selection, reset, and load. The reset preview may show the proposed next effect, clearly labeled as next-timeline preparation; it must not change the current effect before confirmation.

The player chooses a legacy in the timeline-reset preview. It becomes active in the new ready battle, after the rank update. On the existing Evolution surface they may also change the active choice while the battle is **ready** and rank is positive. This is a reversible preparation action: no payment, rank grant, or permanent lock-in. Rebuild the clean ready battle's derived values; preserve the profile's coins, access, records, and counters. Reject changes during running, paused, won, and lost states; Retry/Continue already provide truthful routes back to ready. This also makes legacy selection usable in terminal timeline 1000.

The tradeoff is choosing one useful tool for the next attempt, not losing owned progress when experimenting. The label must say that choices can be changed before a battle. There is no new top-level screen or persistent HUD panel.

## Explicit, truthful timeline reset

The final result and the ready-state cleared-final picker footer open the same preview instead of immediately dispatching the reset. A lost final rematch uses this route as allowed by mastery, while remaining visibly a loss. The preview uses current simulation/profile values and contains:

- Current and next timeline numbers, and the enemy-strength multiplier before and after. For timeline 1 to 2, show `1.00× → 1.22×`; do not imply a constant 22% relative increase at every later timeline.
- Current earned seals `/18`, permanent rank before and after, and exact effects for the selected next legacy. If another rank is attainable, state the remaining seal count as an optional opportunity. At rank 3 say the legacy is complete, without a progress bar toward a nonexistent rank 4.
- A concrete reset table: coins `[current] → 0`; army age to the first age; selected/unlocked chapters to chapter 1; food/base upgrades to level 0; ranged/heavy unlocks to locked; current six mastery records to empty. Explain that personal bests in those records also reset.
- A retained table: cards and their copies/bonuses; gems; permanent legacy rank; claimed quests; lifetime kills/wins/deployments; summon count/seed; daily claim/streak fields; and preferences. The daily system keeps its existing behavior but is not a prerequisite, multiplier, or promotional message in this flow.
- The exact timeline gem credit: `min(100, 10_000_000 - currentGems)` and resulting wallet. Show a reduced or zero credit truthfully at the wallet cap; rank advancement is still valid. Do not advertise another victory/mastery payout: those settled before this preview.

Use native labeled radio inputs for the three choices, explanatory text linked to each input, and native buttons. Keep all information legible at 320×568 and 390×844 with vertical scrolling and no horizontal overflow. Earned/rank states require text and shape, not color alone. Brief optional motion respects reduced motion.

Primary confirmation: **Begin timeline [N]**. Secondary action: **Keep exploring this timeline**. Do not focus the destructive confirmation by default. Cancel, close, and Escape restore the exact origin surface explicitly, using mastery's result-return pattern even when `resultShown` has not changed. The origin result/picker and the pending receipt remain untouched by opening, changing a draft radio choice, or cancelling. A recovery dialog always takes precedence over restoring either surface.

At timeline 1000, no reset preview/confirmation or timeline reward is available. Keep mastery's Return to chapters route and ordinary ready-state legacy selection. Display the completed journey only when a win/Clear proves completion. No silent reset of timeline 1000 and no invented timeline 1001.

## Authoritative transition and persistence

Keep rules outside the renderer and DOM. A focused pure `src/game/prestige.ts` module owns legacy normalization/effects, current seal count, candidate rank, and the preview values. UI code consumes these outputs and grants nothing.

Use a distinct action for the irreversible transition:

```ts
{ type: 'prestige'; expectedTimeline: number; legacy: LegacyChoice }
{ type: 'select-legacy'; legacy: LegacyChoice }
```

After this follow-up, ordinary `next` advances only chapters 0–4; at a final chapter it returns false. The existing final UI command opens the preview, and only its confirmation dispatches `prestige`. This is an intentional extension of the already-implemented mastery contract, with its final-next callers/tests updated in this PR. `advanceStatus(...).target === 'timeline'` continues to mean the reset route is available.

The prestige action rechecks shared advancement eligibility, `expectedTimeline === profile.timeline`, the `<1000` bound, and a valid choice. It must reject running/paused battles, uncleared final losses, a selected earlier chapter, invalid arguments, and stale confirmation after another reset. A durable final Clear or a valid migrated final won receipt retains its existing eligibility.

In one synchronous simulation transition: calculate the old timeline's candidate rank; retain the higher permanent rank and selected choice; credit the actual capped 100-gem award; increment the timeline; reset the specified local economy and six mastery records; clear the pending victory; and create the ready battle using the new rank/choice. No await, DOM callback, reward event replay, or separate claim step may split that update. Repeat dispatch immediately afterward rejects and grants nothing.

Persist the complete profile only through the integrated guard. Perform the existing ownership/conflict check before dispatch; use the existing guarded save afterward. Import, automatic saving, pending-result saving, and pagehide must use that same writer. A conflict blocks further mutation and preserves recovery UI priority. Explicit temporary play may change memory while writing neither save key, as the guard already defines. A write failure must remain visible as unsaved progress; the preview/confirmation must not claim durable success when storage failed. This is a single-browser save contract, not cross-device or anti-rollback protection.

No additional reward ledger is needed: the accepted transition changes the timeline and removes its old final-clear records/receipt atomically with its payout. The saved rank is monotone achievement state, not currency or an unclaimed payout. Reopening a view, changing the active choice, loading a save, and importing a backup do not run prestige settlement.

## Bounded save and migration

Use schema 4 after mastery ships schema 3. Keep the same save key, backup ordering, 100,000-character bound, and unknown-future-version protection. Preserve versions 1–3, including version-1 card identity mapping and mastery's pending-victory/paid-mask rules.

For migrated versions 1–3, initialize rank 1 when the validated `timeline > 1` proves at least one prior timeline transition; otherwise rank 0. Select Hearth by default. This is a deterministic compatibility entitlement, not a gem/card payment. Do not infer ranks 2/3 from timeline number, wins, old personal bests, or unseen historical seals. A schema-3 timeline-1 save with all eighteen seals gains its appropriate rank only at its next actual reset. Preserve every existing wallet, card, receipt, valid mastery mask, quest claim, and daily field.

For schema 4, validate rank as a finite integer in `0..3`, independently from the enum choice. An invalid choice becomes Hearth without deleting valid rank. An invalid/missing rank falls back to 1 for a validated timeline above 1, otherwise 0. Do not turn a huge or fractional malformed value into rank 3. Valid rank is retained even if mastery's optional personal-best data is malformed. Keep the six mastery records, thirty card entries, and bounded claim identifiers; add no attempt log, rank history, per-timeline archive, or timestamp collection.

All effects have fixed maxima: +6 initial food **or** ×1.30 gate health **or** +3 freeze seconds. Preserve timeline limit 1000, existing wallet bounds, 100 upgrade levels, thirty cards with 1,000 copies each, and the existing effective card-bonus level cap of 100. Do not add another exponential power curve, remove a numeric cap, or change overflow behavior to finance prestige. The existing discrepancy between effective card power and continued duplicate collection is a separate economy issue; this design awards no guaranteed duplicates into that flat region.

## Economy and replay evidence

The source-backed gem budget now includes:

| Source | Existing/proposed amount | Scope |
| --- | ---: | --- |
| Starting wallet | 100 | Fresh profile once |
| Ordinary victories | 10 per real win | Repeatable, subject to wallet cap |
| Timeline transition | 100 nominal | Once per accepted transition below 1000 |
| Mastery dependency | 20 per Clear; 15 per other seal | At most 300 per current timeline |
| Ten existing quests | 1,650 total | Lifetime, each claim once; not all attainable in six wins |
| Existing daily reward | 30–90 per eligible day | Optional; use actual claims and elapsed local days |
| This legacy iteration | 0 coins, 0 gems, 0 card copies | Only the bounded selected combat effect |

A six-victory timeline contributes 280–460 gems from battle/timeline/mastery before replay wins, quest claims, daily claims, or spending. With the fresh starting wallet this is 380–560 plus **actually earned and claimed** quest/daily gems. Do not add all 1,650 quest gems to a six-win first-run forecast: the Warlord milestone alone needs 30 lifetime wins. The daily schedule totals 420 gems across its first seven consecutive claims and 2,490 across its first thirty; those are arithmetic schedules, not observed player behavior or available same-session income.

Before implementing any reward tuning, run reproducible public-action traces on the merged game. Record revision, seed/policy, real attempts and outcomes, simulation seconds, purchases/evolution, seal counts, wallet ledger by source, rank transitions, chosen legacy, and next-attempt effects. Keep quest/daily/card spending as separate columns so added income cannot be mistaken for the new legacy's effect.

Required scenarios are a fresh common-only path without daily claims; the actual existing claimable quests; a second timeline after a minimally cleared reset; and matched prepared profiles testing each rank-1/rank-3 choice against representative chapters. An optional daily sensitivity trace uses legitimate advancing day inputs and reports those days explicitly; it must not be necessary for progression. Include rank 0, mature card collections, and capped arithmetic fixtures as boundary tests, not claimed campaign achievements.

The mastery dependency's first-useful-purchase and post-evolution affordability requirements still apply. Compare each choice against an otherwise identical rank-0/other-choice action policy, and record food opening, gate survival/damage, freeze timing, outcome, and attempt time. Each option needs at least one concrete useful situation; if one universally dominates or provides no useful choice in these scenarios, retune only these three constants and rerun the affected comparison. Do not claim a retention lift, invent a time-to-return statistic, or prolong combat to meet a session-duration target.

### Bounded long-run recheck on actual mastery

The accepted first-timeline mixed trace completes in seven attempts/594.52 active seconds, earns fourteen seals/240 mastery gems, and buys seven common cards after its actual claims and reset. Mastery supplies at most 300 gems per timeline, not an automatic 300 credit. Its forward evolution also removes mandatory earlier-chapter wins; comparison with pre-mastery income must count those real extra wins separately.

A read-only default-profile probe extended the same mixed deployment/timed-skill policy across timelines. Preparation evolves when legal before unlocking ranged, buying food to level three, unlocking heavy, and buying food to level six. It claims only attained quests, spends available gems on lawful packs/singles, uses fixed 1/60-second steps, and claims no daily reward. It asserts accepted Start/Retry/Next and stops explicitly on a 900-second still-running attempt. No outcome, HP, wallet, card, seed, counter, or saved state is assigned.

| Mastery policy, maximum 600 actual attempts | Reached | Attempts | Paid card copies | Final gems | Interpretation |
| --- | --- | ---: | ---: | ---: | --- |
| Fixed mixed, no summons | Timeline 6, final chapter | 600 | 0 | 3,605 | 528 successive real defeats; no universal progression claim |
| Fixed mixed, spends gems | Timeline 10, final chapter | 600 | 53 | 10 | 496 successive real defeats after evolution; army age four, zero coins, no kill income |
| Same mixed, after two zero-coin defeats selects the preceding earned-Clear chapter, then wins/evolves/Continues normally | Timeline 30, chapter one ready | 549 | 131 | 180 | Bounded recovery succeeds; no wall found before timeline 30 for this policy |

The adaptive run completes 29 timelines with 185 actual wins, maximum losing streak six, and 46,844.57 active combat seconds. Its exact gem ledger is `100 starting + 1,650 actual lifetime claims + 6,780 mastery + 1,850 ordinary wins + 2,900 resets - 13,100 spending = 180`. It obtains 123 common and eight rare copies, with no epic/legendary draw; only the initial accepted first-timeline trace is common-only. Damage/health card factors finish at approximately 2.735/4.314; base/food/coin factors remain one. Before leaving timeline nine it owns 49 copies; before leaving nineteen it owns 88; before leaving twenty-nine it owns 131. Completed journeys earn 11–16 seals, so this policy does not prove all-eighteen-seal attainment or a rank-three journey.

The production probe at `012a90cde5f881f37c4b908813bf01e75022b9a2` ends each attempt at 400 seconds without checking that a real terminal outcome occurred or that Retry/Start succeeded. A stricter reproduction reaches a still-running timeline-one/chapter-four battle on attempt ten even at 900 seconds. Its earlier timeline-10/11 wall summary is therefore insufficient evidence of an economy limit. The accepted mixed policy on that pre-mastery core instead reaches timeline 20 in 564 attempts with 391 wins/74 paid copies; its evolution repeatedly returns to earlier opponents. These are different progression contracts, not a controlled reward-only A/B test.

Decision: retain three finite ranks, the three provisional single effects, and zero added currency. Mastery accelerates lawful card growth, and available replay choices move the observed policy limit beyond timeline 30. These data justify neither increasing reset income nor promising timeline-1000 viability. A zero-income late defeat is a real risk to cover in the next-attempt/choice comparison; no new compulsory replay or encounter rebalance is added. Rerun on the final implementation SHA with each legacy choice; ordinary earlier-chapter replay still earns only ordinary rewards for already-paid masks. The ignored audit script/output and exact commands are recorded in `.superpowers/prestige-retention-audit.md`; the implementation plan promotes a reviewed reproducible script/report as part of Task 1.

## Verification and implementation boundary

The future PR may add `src/game/prestige.ts`, focused prestige/progression/save tests, and one deterministic comparison script/report. It may modify types/save/simulation and the existing result, progression, Evolution, and central modal/action wiring. Reuse existing styles and native controls. No encounter/trait redesign, additional currency, new navigation tab, telemetry service, notification schedule, streak mechanic, or implementation in this document.

Acceptance gates:

1. Pure rank boundaries cover 0, 11, 12, 17, and 18 seals; a legitimate completion with no migrated seals grants rank 1; repeat low-seal journeys never lower rank. Current masks alone determine optional rank thresholds.
2. Exact effect tests prove only the selected effect applies, numeric bounds stay finite at all supported caps, no economy multiplier changes, and previews/upgrade values match the authoritative result. Freeze control titles, accessible descriptions, and Skills-screen copy show the actual active duration after selection/reset/load. Ready selection works; all other phases reject without mutation.
3. Real-action campaign traces earn the necessary Clear/seals and complete at least one reset with no fabricated HP, wins, metrics, or wallet credits. Prepared historical profiles are allowed for isolated migration/cap/effect tests. A disclosed prepared starting profile with an empty current mastery ledger may earn all eighteen seals through real actions in that same ledger and perform a real reset as proof of the conditional mechanics route. It does not prove fresh-profile reachability, realistic preparation cost, or time to rank three; do not fabricate masks or combine separate fixtures. A fresh lawful campaign remains required for earned early progression and rank evidence.
4. Final win → preview → cancel/reopen → confirm pays one timeline reward. Repeat clicks, repeated dispatch, save/reload, result reopening, and import/reload pay zero extra. Test capped gems, legacy pending final wins, and cleared-final loss/reload routes. The ordinary victory/mastery receipt is never settled again.
5. Timeline 999 → 1000 works once; final timeline 1000 cannot reset or pay a timeline reward. The player can return to chapters, access settings, and change a legacy from ready.
6. Round-trip versions 1–4, preserve existing paid masks despite corrupt descriptive bests, preserve rank despite a corrupt choice, reject future schemas without overwriting primary or backup, and retain daily/quest/card state. Bad rank values do not manufacture rank 3. The serialized save remains below its fixed size bound.
7. Use the production two-tab/recovery tests to interrupt an open confirmation with an ownership conflict. No stale payout or write occurs; recovery stays on top; reacquiring reloads the authoritative rank/wallet/timeline. Temporary play writes neither key. Report write failure truthfully.
8. Browser checks at both narrow sizes cover native keyboard selection, visible focus, focus containment/return, cancel/close/Escape to each origin, double confirmation, disabled terminal/running routes, reduced motion, and actual before/after saved values. Merely matching a screenshot is insufficient.

Run the repository's required test/build and existing browser/mastery/save-session checks after implementation, then the focused prestige gate. Keep exact commands, revision, numerical traces, and any unresolved choice-balance issue in the resulting verification report. This candidate's completion means the design and audit are reviewable; product behavior remains unchanged until that later implementation.
