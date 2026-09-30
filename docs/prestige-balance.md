# Prestige core evidence — 2026-09-30

This report covers the authoritative core and deterministic public-action probes. It does not claim a player-retention improvement, universal choice balance, fresh rank-three attainability, or timeline-1000 viability. The UI and native browser/release gates remain separate required work.

## Revision and reproduction

Production game source measured at core checkpoint `ed573f46d5e5339f0175db195929c7cf29ec4808`, game tree `0e605a3db9374fb7fbe2cce6ec7eb8fa376f4b7f`. Step 7 adds the reviewed runner and tests in the working tree without changing that game source. Runner Git blob: `00d274fdf672737f90476a3902fd92bab92c7fc4`. Root owns the next checkpoint commit, dependency reconciliation and release review. Recheck on that integrated revision before UI/release.

Commands run from the repository root with Node v24.19.0:

```sh
node --experimental-strip-types scripts/simulate-prestige.ts campaign hearth 3 100 mixed adaptive 1
node --experimental-strip-types scripts/simulate-prestige.ts campaign watch 2 100 minimal adaptive 1
node --experimental-strip-types scripts/simulate-prestige.ts prepared-seals
node --experimental-strip-types scripts/simulate-prestige.ts clear-only
node --experimental-strip-types scripts/simulate-prestige.ts comparisons
node --experimental-strip-types scripts/simulate-prestige.ts campaign hearth 30 600 mixed adaptive 1
node --experimental-strip-types scripts/simulate-prestige.ts campaign watch 30 600 mixed adaptive 1
node --experimental-strip-types scripts/simulate-prestige.ts campaign stillness 30 600 mixed adaptive 1
node --experimental-strip-types scripts/simulate-prestige.ts campaign hearth 30 600 mixed fixed 1
node --experimental-strip-types scripts/simulate-prestige.ts campaign hearth 30 600 mixed adaptive 0
```

Each command emits complete JSON: accepted actions with simulation time and before/after wallets, real attempt outcomes/stats/receipts, purchases/evolution, transitions with old seals/new rank/choice, card identities/copies/rarities/factors, and actual gem/coin ledgers. Local evidence files are `.superpowers/prestige-{fresh-mixed,fresh-minimal,prepared-seals,clear-only,comparisons,longrun-hearth,longrun-watch,longrun-stillness,longrun-fixed,longrun-no-summons}.json`. These are reproducible probe output, not saved player state or a new in-game archive.

All combat uses fixed 1/60-second simulation steps and accepted Start/Retry/Next/Prestige. Attempts stop only at actual won/lost states or an explicit 900-second still-running timeout. Timeouts count as an attempt but never as a win/loss; no Retry or transition is invented. The maximum-gate boundary test exercises that timeout branch. No probe assigns HP, combat outcomes, seal masks, counters, wallets, card draws or random seeds after constructing its disclosed starting profile. Every fresh run starts from the default profile and untouched deterministic RNG stream. No daily reward is claimed in these runs.

`mixed` reserves the first ten seconds, cycles available heavy/ranged/melee/ranged, uses food after eight seconds, meteor after 33 seconds with three living enemies, and freeze after 44 seconds with three living enemies. Preparation evolves when legal, unlocks ranged, buys food to level three, unlocks heavy, then buys food to level six. Actual quests are claimed and available paid packs/singles are bought. `adaptive` selects the preceding earned-Clear chapter after two consecutive zero-coin defeats, then wins/evolves/Continues normally. `fixed` does not make that recovery selection. These are bounded policies, not optimal-play claims.

`minimal` is a deliberately different fresh policy: chapter one opens immediately; later chapters wait for real gate damage before deployment/skills, omit chapter four's Freeze and chapter five's Meteor objectives, and use only melee for chapter two. It earns a legitimate low-seal reset rather than manufacturing historical seals. The prepared `clear-only` policy also waits for real gate damage, misses each optional objective, and earns exactly one Clear per chapter.

## Fresh earned progression and actual income

| Run | Attempts / wins / losses | Active seconds | Earned seals before reset | New rank | Paid copies at reset | Resulting gems |
| --- | --- | ---: | --- | --- | --- | ---: |
| Fresh mixed, first timeline | 7 / 6 / 1 | 594.52 | 14 | 2 | 7, all common | 100 |
| Same fresh mixed run through second timeline | 16 / 12 / 4 cumulative | 1,233.80 cumulative | 15 in second ledger | 2 retained | 13, all common | 165 |
| Fresh minimal, first timeline | 9 / 6 / 3 | 681.72 | 8 | 1 | 6, all common | 110 |

The competent mixed first win earns 560 actual coins, including 300 mastery coins. A useful first purchase is affordable. The eight measured first/second-timeline evolution purchase windows obtain a useful upgrade/unlock within at most one win and one loss; the tests retain the requirement of no more than one win/two losses. Evolution leaves the selected opponent and frontier intact. None of these routes requires a daily claim.

| Gem ledger | Starting | Ordinary wins | Mastery | Resets | Actually claimed quests | Daily | Paid spending | Final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mixed first timeline | 100 | 60 | 240 | 100 | 300 | 0 | 700 | 100 |
| Mixed through second timeline | 100 | 120 | 495 | 200 | 550 | 0 | 1,300 | 165 |
| Minimal first timeline | 100 | 60 | 150 | 100 | 300 | 0 | 600 | 110 |

The first timeline actually claims First Blood (50), Commander (50), Conqueror (100), and Battalion (100). The mixed second timeline adds Veteran (100) and Champion (150). The ten lifetime quests' full 1,650 gems are not an assumed six-win budget.

The runner derives ordinary win gems from the actual battle wallet delta minus the validated mastery receipt. It never blindly adds a nominal ten at the cap. A prepared final-battle wallet of 9,999,955 receives ten ordinary gems, 35 mastery gems, zero reset gems, and ends at 10,000,000. Separate core tests cover reset credit 50 at 9,999,950 and zero at the cap. Coin accounting separates ordinary combat, mastery, upgrade/unlock spending and coins discarded by evolution/reset. Every completed or timed-out run asserts both wallet equations.

Legacy adds zero currency and zero card copies. Preparing a different ready choice does not pay anything. The bounded benefit is exactly one of starting food `6 + 2*rank`, gate factor `1 + .10*rank`, or Freeze `7 + rank` simulation seconds. Watch applies before the only final rounding: no cards, age one, base level one, rank one gives **457 HP**, not the incorrectly early-rounded 458. The independent expected-value regression rejects that mutant.

## Conditional prepared mechanics routes

| Disclosed starting profile | Current starting ledger | Attempts / real wins | Seconds after preparation | Seals earned in that one ledger | Rank after real reset | Gem equation |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Age five, food level 12, all roles unlocked, no cards | All six records empty | 6 / 6 | 226.07 | 18 | 3 / Stillness | 100 + 60 + 300 + 100 + 200 - 0 = 760 |
| Age five, food level 100, all roles unlocked, no cards | All six records empty | 6 / 6 | 406.38 | 6 Clear seals only | 1 / Stillness | 100 + 60 + 120 + 100 + 300 - 0 = 680 |

These profiles are prepared historical boundary fixtures. Their preparation was not earned or costed by this trace. The eighteen seals are earned by six real battles in the same current-timeline ledger; no records from separate fixtures are combined. This proves a conditional rank-three mechanics route from that preparation. It proves neither fresh-profile reachability, realistic preparation cost nor time to rank three. The seconds above begin **after** preparation. The separate fresh traces establish early earned progression and ranks one/two.

## Matched preparations: one useful case per choice

The 27 comparisons start otherwise identical prepared profiles for rank zero, one and three, with each of the three choices. Rank-zero choices produce byte-equivalent combat outcomes/times. Cards are absent, mastery starts empty, and no derived stats or outcomes are fabricated. These comparisons isolate effects; they are **not earned campaign histories**.

Opening: first army/first chapter, immediate melee deployment. Gate pressure: army age one/base level one against the first chapter, no deployment, Freeze on the first actual gate hit. Control: army age two/food level zero/all roles against chapter four, mixed timed deployment/skills. Freeze targets always refer to the living cast-time snapshot.

| Prepared case and active choice | Rank 0 seconds | Rank 1 seconds | Rank 3 seconds | Actual outcome / useful evidence |
| --- | ---: | ---: | ---: | --- |
| Opening / Hearth | 39.62 | 35.42 | 35.15 | All win; starting food 6 / 8 / 12, more immediate formation |
| Opening / Watch | 39.62 | 39.62 | 39.62 | All win; extra gate HP unused in this case |
| Opening / Stillness | 39.62 | 39.62 | 39.62 | All win before a Freeze cast |
| Gate pressure / Hearth | 62.45 | 62.45 | 62.45 | All lose; extra food unused without deployment |
| Gate pressure / Watch | 62.45 | 64.38 | 67.85 | All lose; gate 416 / 457 / 541, extra 1.93 / 5.40 seconds to act |
| Gate pressure / Stillness | 62.45 | 63.45 | 65.45 | All lose; extra Freeze buys 1 / 3 seconds |
| Control / Hearth | 113.32 | 97.03 | 79.68 | All win; extra opening food useful |
| Control / Watch | 113.32 | 113.32 | 113.32 | All win without gate damage; gate benefit unused |
| Control / Stillness | 113.32 | 112.25 | 89.53 | All win; three actual targets, cast at 57.00, expires 64 / 65 / 67 |

Hearth improves an opening; Watch creates more recovery time under actual damage; Stillness improves the control fight. Watch's larger gate gives more time than Stillness in the prepared pressure case, whereas Hearth cannot help that no-deployment case. This does not demonstrate universal dominance or uselessness, so the three specified constants remain unchanged. Watch's pressure trace is explicitly a loss, not an invented rescue. Optional further policies could give different results.

Core behavioral tests separately observe real enemies unable to move or attack beyond the baseline seventh second through each eight/nine/ten-second interval, delayed arrivals suppressed without retroactive target credit, resumption on the first eligible movement step, normal attack cooldown resumption, pause and equivalent 1x/2x frame partitions. A second cast remains rejected; upgrades retain recorded gate damage.

## Finite long run and late defeat recovery

All three adaptive paid-draw runs reached timeline 30, chapter one ready, below the maximum 600 actual attempts. No daily claim, RNG override, extra coins/gems or fabricated outcome was used. All earn rank two; none earn eighteen seals in a fresh timeline.

| Active choice after earned resets | Attempts / wins / losses | Active seconds | Maximum losing streak | Copies / rarity | Current gems | Seals per completed journey |
| --- | --- | ---: | ---: | --- | ---: | --- |
| Hearth | 500 / 183 / 317 | 42,227.13 | 6 | 133: 125 common + 8 rare | 125 | 12–15 |
| Watch | 547 / 185 / 362 | 46,886.98 | 6 | 131: 123 common + 8 rare | 150 | 11–16 |
| Stillness | 522 / 184 / 338 | 45,685.70 | 6 | 131: 123 common + 8 rare | 140 | 12–15 |

| Actual long-run gem ledger | Starting | Ordinary wins | Mastery | Resets | Quests | Daily | Spending | Final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Hearth | 100 | 1,830 | 6,945 | 2,900 | 1,650 | 0 | 13,300 | 125 |
| Watch | 100 | 1,850 | 6,750 | 2,900 | 1,650 | 0 | 13,100 | 150 |
| Stillness | 100 | 1,840 | 6,750 | 2,900 | 1,650 | 0 | 13,100 | 140 |

All three leave timeline nine with 49 copies and nineteen with 89; after twenty-nine they have 133 / 131 / 131. Final damage/health card factors are approximately 2.734804 / 4.313586; gate/food/coin card factors remain one. No epic or legendary copy was drawn. These later traces are therefore not common-only, while the fresh first/second-timeline traces are. The deterministic draw outcomes are observed payments, not guaranteed retention benefits.

The adaptive policy makes 9 / 11 / 10 successful earlier-chapter recovery selections. A matched fixed-policy Hearth run spends earned gems but stops at timeline 11's final chapter after 600 attempts: 483 successive real losses, army age four, zero coins and zero kills/income in its final attempts, 56 paid copies and 35 gems. Its exact gem ledger is `100 + 650 + 2,635 + 1,000 + 1,250 - 5,600 = 35`. That demonstrates a policy trap, not a universal economy wall: the adaptive paid policy reaches 30 using the same game contract.

The no-summon adaptive Hearth policy also stops at timeline 11's final chapter after 600 attempts, with 326 successive losses, army age five, 5,865 gems and a capped 1,000,000,000-coin wallet. It still makes ten kills per final loss but cannot turn that capped wallet into progress under its food-level-six/no-base-upgrade policy. Its gem ledger is `100 + 660 + 2,455 + 1,000 + 1,650 = 5,865`. This is an observed policy limitation; it is not proof that spending, replay, or another tactic is universally mandatory.

The older pre-mastery `simulate-progression` report is historical and uses a different evolution/opponent contract; it is not a measured reward-only A/B comparison. Its current script uses real terminal outcomes and the explicit prestige action, and reports timeouts. No reward retuning is justified by these finite traces. Zero-income late losses and finite content variety remain risks; rank three and timeline 1000 remain unproven from a fresh profile.

## Verification and remaining gates

```sh
node --experimental-strip-types --test tests/prestige.test.ts tests/prestige-campaign.test.ts tests/mastery.test.ts tests/mastery-campaign.test.ts tests/progression.test.ts tests/recovery.test.ts tests/save-session.test.ts
npm test
npm run build
git diff --check
```

Core checkpoint had 88 focused / 486 full tests and build green. Step 7 adds a Watch rounding regression, public-action fresh/capped/prepared/choice/timeout evidence and ledger assertions. Fresh final verification: **95 focused / 493 full tests green; build green** with the existing large-bundle warning. No dependencies, prices, summon odds, traits, encounters, mastery payouts, save-session ownership or UI were changed by this producer.

Schema 1–4 round trips, version-one identities, independent rank/choice normalization, paid masks despite corrupt optional bests, pending receipt retention, version-five primary/backup protection, reset/ready/terminal bounds, stale confirmations, import/backup conflict rejection and temporary no-write behavior are covered in the core tests. Browser execution was not attempted in this environment because the root-established local launch limitation is SIGTRAP. Native predecessor gates, final dependency reconciliation, independent review, Task 2 guarded UI/focus/copy and prestige browser acceptance remain release requirements. Source/test success alone does not waive them.

Final integration acceptance harness now retains the 37 mastery scenarios and adds native prestige preview returns from result/picker, keyboard radios, narrow screenshots, capped credits, each subsequent-battle choice, 999→1000 reload, ownership recovery, temporary play and quota visibility. These additions await execution on the reviewed integrated SHA through CI; the harness alone is not passing browser evidence. Root’s separate integrated fresh public-action traces reach timeline 3 in 16 attempts with rank 2 and 165 gems for each choice, with coin/gem ledgers reconciled; they do not establish retention or universal choice balance.
