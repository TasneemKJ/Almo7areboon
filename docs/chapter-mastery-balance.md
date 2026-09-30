# Chapter mastery balance evidence

Revision: `91d15beb9a683436082780aec93b4dbdd60d3774` plus the Task 1 simulator and regression changes. The core checkpoint is `b268cb2897005dab36f58e95e3803122070e1b90`. Recorded on 2026-09-30.

Reproduce all three complete machine-readable action traces:

```sh
node --experimental-strip-types scripts/simulate-mastery.ts
```

Each output line contains accepted actions and simulation times, purchases, initial and ending wallets for every attempt, authoritative stats, settled masks/credits, cards, claims, evolution and next transitions. Each campaign starts from `defaultProfile()` and uses only `Game.dispatch`, `Game.step`, and tactical `waveStatus`; no outcome, HP, counter, wallet, seed, or card is fabricated. The original deterministic summon stream produces only common cards for these campaigns.

The immediate policy deploys melee as soon as legal. The reserve policy banks ten seconds of starting food and uses the authored next-wave intent to cycle rush `[heavy, melee, ranged]`, volley `[melee, melee, heavy, ranged]`, bulwark `[melee, ranged, ranged]`, or final `[melee, ranged, melee]`, omitting locked roles. Mixed banks the same food and cycles `[heavy, ranged, melee, ranged]`, also omitting locked roles. That reserve is an explicit formation tactic; no additional delay is inserted to meet a campaign-time minimum. Food is attempted after eight seconds; meteor after 33 seconds with at least three living enemies; freeze after 44 seconds with at least three living enemies. Rejected inputs are not counted as actions or objective progress.

Before an attempt, the policy evolves if legal and affordable, then buys ranged (except immediate), food toward level three, heavy (except immediate), and food toward level six. It claims only completed lifetime quests and buys affordable single cards between attempts. After evolution, it records the first actual troop/food purchase against the retained opponent. Losses retry normally. Victories Continue normally, with one explicit final timeline reset.

| Policy | Active combat | Attempts / losses | Seals | Claimed quest gems | Daily gems | Paid cards | Final gems |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| immediate | 587.32s (9.79min) | 9 / 3 | 15 | 300 | 0 | 7 common | 115 |
| reserve-and-counter | 588.30s (9.81min) | 7 / 1 | 14 | 300 | 0 | 7 common | 100 |
| mixed | 594.52s (9.91min) | 7 / 1 | 14 | 300 | 0 | 7 common | 100 |

All three paths finish within the approximate 6–12 minute target without requiring all seals. No rewards, criteria, encounter, trait, cost, odds, or normal combat constants needed tuning. The competent reserve/mixed paths finish with army age four against chapter five; no six-evolution requirement is imposed. These traces are reproducible representative policies, not a promise that every action strategy wins within the target.

The actual first victory earns **260 combat + 300 mastery = 560 coins** and **10 victory + 50 mastery = 60 gems**. The 560 coins permit both troop unlocks (550), or a ranged unlock plus food improvements, while both unlocks plus the first food upgrade cost 600. Even the Clear-only counterfactual adds 150 to the same 260 combat coins: 410 permits ranged (150), heavy (400), or production (50). This is useful choice rather than compulsory flawless play.

The claimed quests in every run are `first-blood` (50), `commander` (50), `conqueror` (100), and `battalion` (100): **300 actually claimed gems**. The full ten-quest lifetime catalog remains **1,650 gems**; unearned milestones are not added to these budgets. The three primary traces claim no calendar reward (`dailyDay=0`, `dailyStreak=0` remain untouched). A separate regression runs the mixed path with one explicit day-20726 claim: **30 daily gems**, one successful daily action, and a completed timeline. It does not farm future dates.

For reserve/mixed, currency accounts exactly: 100 starting + 60 normal victory + 240 mastery + 300 claimed quests + 100 final timeline = 800 gems; seven paid singles spend 700, leaving 100. Immediate earns 255 mastery gems instead, leaving 115 after the same seven singles. Replay farming is absent; the extra attempts are real losses, which award no seals or victory gems.

## Real attempts

Masks use Clear=1, Gate Unbroken=2, third=4. Starting wallet is after that attempt's recorded preparation purchases. Ending wallet is before subsequent claims, summons, or purchases. All coin earnings include actual credited mastery.

### immediate

| Attempt | Chapter / army | Food level | Start coins / gems | Outcome | Seconds | Total earned coins | New mask | Mastery coins / gems | End coins / gems |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 / 0 | 0 | 0 / 0 | won | 39.45 | 560 | 7 | 300 / 50 | 560 / 60 |
| 2 | 1 / 0 | 4 | 195 / 60 | won | 49.30 | 5640 | 3 | 1600 / 35 | 5835 / 105 |
| 3 | 2 / 1 | 0 | 0 / 5 | lost | 109.67 | 14592 | 0 | 0 / 0 | 14592 / 5 |
| 4 | 2 / 1 | 6 | 7737 / 5 | won | 59.53 | 64128 | 3 | 12800 / 35 | 71865 / 50 |
| 5 | 3 / 2 | 0 | 0 / 50 | lost | 89.88 | 144896 | 0 | 0 / 0 | 144896 / 50 |
| 6 | 3 / 2 | 6 | 90051 / 50 | won | 52.87 | 651264 | 3 | 102400 / 35 | 741315 / 95 |
| 7 | 4 / 3 | 0 | 0 / 95 | won | 52.92 | 6762496 | 7 | 1228800 / 50 | 6762496 / 155 |
| 8 | 5 / 4 | 0 | 0 / 55 | lost | 92.48 | 17072128 | 0 | 0 / 0 | 17072128 / 55 |
| 9 | 5 / 5 | 0 | 0 / 55 | won | 41.22 | 64389120 | 7 | 9830400 / 50 | 64389120 / 115 |

### reserve-and-counter

| Attempt | Chapter / army | Food level | Start coins / gems | Outcome | Seconds | Total earned coins | New mask | Mastery coins / gems | End coins / gems |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 / 0 | 0 | 0 / 0 | won | 44.98 | 560 | 7 | 300 / 50 | 560 / 60 |
| 2 | 1 / 0 | 4 | 45 / 60 | won | 70.35 | 6144 | 3 | 1600 / 35 | 6189 / 105 |
| 3 | 2 / 1 | 0 | 0 / 5 | lost | 124.03 | 14592 | 0 | 0 / 0 | 14592 / 5 |
| 4 | 2 / 1 | 6 | 3337 / 5 | won | 56.08 | 70528 | 7 | 19200 / 50 | 73865 / 65 |
| 5 | 3 / 2 | 0 | 0 / 65 | won | 68.30 | 681984 | 3 | 102400 / 35 | 681984 / 110 |
| 6 | 4 / 3 | 0 | 0 / 10 | won | 55.53 | 6762496 | 7 | 1228800 / 50 | 6762496 / 70 |
| 7 | 5 / 4 | 0 | 0 / 70 | won | 169.02 | 70156288 | 1 | 4915200 / 20 | 70156288 / 100 |

### mixed

| Attempt | Chapter / army | Food level | Start coins / gems | Outcome | Seconds | Total earned coins | New mask | Mastery coins / gems | End coins / gems |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 / 0 | 0 | 0 / 0 | won | 44.98 | 560 | 7 | 300 / 50 | 560 / 60 |
| 2 | 1 / 0 | 4 | 45 / 60 | won | 74.75 | 6144 | 3 | 1600 / 35 | 6189 / 105 |
| 3 | 2 / 1 | 0 | 0 / 5 | lost | 124.03 | 14592 | 0 | 0 / 0 | 14592 / 5 |
| 4 | 2 / 1 | 6 | 3337 / 5 | won | 57.90 | 70528 | 7 | 19200 / 50 | 73865 / 65 |
| 5 | 3 / 2 | 0 | 0 / 65 | won | 68.30 | 681984 | 3 | 102400 / 35 | 681984 / 110 |
| 6 | 4 / 3 | 0 | 0 / 10 | won | 55.53 | 6762496 | 7 | 1228800 / 50 | 6762496 / 70 |
| 7 | 5 / 4 | 0 | 0 / 70 | won | 169.02 | 70156288 | 1 | 4915200 / 20 | 70156288 / 100 |

## Purchases after evolution

Every evolution preserves the exact selected chapter and frontier and clears only the configured local army economy. All current-age purchases below occur without visiting a previous opponent. Availability is established through accepted purchases, not injected currency. The first retained-opponent loss or victory funds each purchase; this is within the one-victory/two-loss acceptance bound.

| Policy | New army / retained chapter | Battle outcome funding first purchase | Active seconds to purchase | Actual first purchase |
| --- | --- | --- | ---: | --- |
| immediate | 1 / 2 | 0 win, 1 loss | 109.67s | food upgrade |
| immediate | 2 / 3 | 0 win, 1 loss | 89.88s | food upgrade |
| immediate | 3 / 4 | 1 win, 0 loss | 52.92s | food upgrade |
| immediate | 4 / 5 | 0 win, 1 loss | 92.48s | food upgrade |
| immediate | 5 / 5 | 1 win, 0 loss | 41.22s | food upgrade |
| reserve-and-counter | 1 / 2 | 0 win, 1 loss | 124.03s | unlock role 1 |
| reserve-and-counter | 2 / 3 | 1 win, 0 loss | 68.30s | unlock role 1 |
| reserve-and-counter | 3 / 4 | 1 win, 0 loss | 55.53s | unlock role 1 |
| reserve-and-counter | 4 / 5 | 1 win, 0 loss | 169.02s | unlock role 1 |
| mixed | 1 / 2 | 0 win, 1 loss | 124.03s | unlock role 1 |
| mixed | 2 / 3 | 1 win, 0 loss | 68.30s | unlock role 1 |
| mixed | 3 / 4 | 1 win, 0 loss | 55.53s | unlock role 1 |
| mixed | 4 / 5 | 1 win, 0 loss | 169.02s | unlock role 1 |

## Regression and integration evidence

Public-action tests earn all eighteen seals with lawful prepared army/upgrade fixtures; they do not force outcomes. Other real runs prove ordinary/final win → retry → loss → Continue and loss → save/reload → ready → Continue, truthful lost results, one timeline reward/reset, older-chapter adjacent continuation without relocking the frontier, legacy Continue-first through evolution/reload, terminal retry, no repeat paid bits after independently corrupted best fields, and simulation-time partition/pacing equality. A real freeze snapshot ignores scheduled future arrivals; a real gate hit remains recorded after a base upgrade.

The production `SaveSession` interoperability test saves the schema-3 ledger and receipt together, round-trips them through export/import and `restoreBackupWithSave`, rejects an import after a foreign backup change without changing either string, and makes no writes in explicit temporary play. Existing ownership/future-schema/quota tests remain intact. UI/result-browser acceptance belongs to Task 2; no local browser acceptance is claimed here.

Fresh final verification on this producer state:

```sh
node --experimental-strip-types --test --test-reporter=tap tests/mastery.test.ts tests/mastery-campaign.test.ts tests/game.test.ts tests/progression.test.ts tests/recovery.test.ts tests/encounters.test.ts tests/save-session.test.ts
NODE_OPTIONS='--test-reporter=tap' npm test
npm run build
```

Focused: **100/100** passed. Full suite: **381/381** passed, zero failed/skipped/cancelled. Build: **exit 0**, TypeScript and production Vite complete. The existing large-Phaser-chunk and npm proxy-configuration warnings remain; no new build error remains.
