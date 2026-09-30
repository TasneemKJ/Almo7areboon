# Tactical encounter balance evidence

Measured on 2026-09-29 from base revision `25b934821c0ff37113423443845fedd0eceba982` plus the Task 1 working changes. `revisions.json` records SHA-256 hashes of each encounter revision and the unchanged simulation/trait/probe sources. Final raw measurements: `docs/evidence/tactical-encounters-final.csv`. Intermediate trial evidence: `.superpowers/sdd/2026-09-29-tactical-encounters/`.

Run `node --experimental-strip-types scripts/simulate-encounters.ts`. Each JSONL matrix has 144 main rows (6 ages × 2 timelines × 2 upgrade levels × 6 policies) and 12 timeline-1 no-deployment controls. Fixtures use matching ages, empty cards, default profiles and `1000 * eraEconomyScale(age)` coins. Unlocks and food/base levels are purchased through public actions before start. Each run attempts one deployment per 1/60 tick, advances desired-kind sequences only on successful deployment, and caps at 180 seconds. Threat sequences reset only on preview-number changes, including transition to final fallback. No run edits state, outcomes, or HP, buys during combat, or casts skills.

## Historical pre-feature measurement

These values come from the approved spec's earlier public-action probe, not the new matrix. They use timeline 1, no upgrades/cards, and matching ages; mixed bought both unlocks.

| Policy | First Fires | Age 2 | Ages 3 / 4 / 5 |
| --- | --- | --- | --- |
| Immediate melee | Win 118.8s | Loss 92.5s | Loss 85.0s each |
| Banked melee after 10s | Win 56.1s | Win 100.0s | Win 160.0s each |
| Fixed mixed after 10s | Win 64.0s | Win 65.2s | Win 50.7s each; 8 deployments, full base HP |

## Accepted results

First Fires, timeline 1, level 0: immediate melee wins in **41.97s**, banked melee in **45.93s**. Immediate deployment is 8.64% faster; both meet 120 seconds.

All 156 final rows have finite state, nonnegative resources/HP, armies within the 60-per-side capacity, and no crashes. All 12 no-deployment controls lose. Timeline 3 is diagnostic and carries no universal no-upgrade win requirement.

| Age | Level-2 melee winner | Time | Fastest mixed winner | Time |
| --- | --- | ---: | --- | ---: |
| 0 | immediate-melee | 39.95s | threat-aware | 43.22s |
| 1 | immediate-melee | 38.40s | threat-aware | 44.42s |
| 2 | banked-melee | 58.52s | fixed-mixed | 49.88s |
| 3 | immediate-melee | 37.58s | threat-aware | 49.58s |
| 4 | immediate-melee | 37.50s | threat-aware | 41.42s |
| 5 | banked-melee | 54.85s | threat-aware | 41.70s |

At the identical timeline-1 / level-2 budget:

| Chapter | Threat time / damage taken | Fixed time / damage taken | Benefit |
| --- | --- | --- | --- |
| 4 | 41.42s / 255.069 | 42.77s / 318.960 | 3.16% faster; 20.03% less damage |
| 5 | 41.70s / 431.930 | 47.93s / 1646.730 | 13.00% faster; 73.77% less damage |

Hillside's damage advantage is only 0.03 percentage points above the gate. This is deterministic evidence for the prescribed probe, not proof of a robust optimal strategy. Courtyards' faster completion also takes 73.77% less damage.

The initial authored encounter matrix (`matrix-initial.jsonl`) passed opening, progression, and control gates but had no qualifying later threat-aware comparisons. Accepted changes keep five waves and enemy budgets at 10 for Hillside / 11 for Courtyards. Hillside swaps its second-wave H for M (Bulwark→Rush) and two fourth-wave M for R (Rush→Volley); this makes the Volley response useful while avoiding the early heavy that prevented melee progress in the intermediate trial. Courtyards moves its two delayed second-wave melee to the opening at 0.5s and 1s delays, so an early heavy can sweep a Rush instead of waiting behind a scripted opening. The exact spec table is synchronized. Guard 0.25, pierce 0.35, sweep 0.40, and radius 32 remain unchanged.

## Sequential tuning ledger

Every trial ran the full 156-row matrix with the same probe. Each `matrix-tuning-N.jsonl` contains complete before/after evidence relative to the preceding matrix; `encounters-tuning-N.ts` preserves exact values. Reverting a rejected candidate is stated explicitly. Rows below show fixed-mixed and threat-aware level-2/timeline-1 results as `outcome seconds / damage`. Full kill/earnings and all other policies remain in raw JSONL.

| Trial | Exact change and reason | Before → after, affected chapters | Decision |
| --- | --- | --- | --- |
| 1 | Hillside: move final Rush M@1 to opening M@0.5. Courtyards: move wave-2 M@1 to opening M@0.5. Test formation-sensitive benefit while retaining melee progress. | Age 4: fixed-mixed: won 52.65/1104.000 → won 50.03/1060.469; threat-aware: won 47.57/1250.941 → won 44.85/968.829; Age 5: fixed-mixed: won 43.50/560.990 → won 43.70/560.990; threat-aware: won 41.70/564.940 → won 41.70/496.320 | Rejected: Hillside loses both melee policies. |
| 2 | Restore Hillside members; first launch 3→4s. Courtyards: move remaining delayed wave-2 M@0.5 into opening M@1. Test formation-sensitive benefit while retaining melee progress. | Age 4: fixed-mixed: won 50.03/1060.469 → won 52.65/1104.000; threat-aware: won 44.85/968.829 → won 47.57/1250.941; Age 5: fixed-mixed: won 43.70/560.990 → won 47.93/1646.730; threat-aware: won 41.70/496.320 → won 41.70/431.930 | Keep Courtyards redistribution; Hillside provides no advantage. |
| 3 | Hillside: first launch 4→3s; wave 2 H/M@1.2→M/H@1.2. Test formation-sensitive benefit while retaining melee progress. | Age 4: fixed-mixed: won 52.65/1104.000 → won 50.42/981.086; threat-aware: won 47.57/1250.941 → won 45.77/1114.829 | Rejected: banked melee times out. |
| 4 | Hillside: restore wave-2 H/M lead order; wave-4 launch 43→40s. Test formation-sensitive benefit while retaining melee progress. | Age 4: fixed-mixed: won 50.42/981.086 → won 51.03/1060.469; threat-aware: won 45.77/1114.829 → won 53.12/1382.832 | Rejected: threat-aware is slower than fixed. |
| 5 | Restore Hillside wave 4 to 43s. Lantern: move wave-3 M to opening M@0.5; remaining ranged delays 1.2/2.4→0/1.2. Test formation-sensitive benefit while retaining melee progress. | Age 3: fixed-mixed: won 49.95/698.576 → won 49.95/751.000; threat-aware: won 49.58/701.808 → won 49.25/854.088; Age 4: fixed-mixed: won 51.03/1060.469 → won 52.65/1104.000; threat-aware: won 53.12/1382.832 → won 47.57/1250.941 | Rejected: no qualifying Lantern benefit. |
| 6 | Lantern: move wave-2 M into opening M@1; remaining wave-2 R delay 1.4→0. Test formation-sensitive benefit while retaining melee progress. | Age 3: fixed-mixed: won 49.95/751.000 → won 49.95/717.040; threat-aware: won 49.25/854.088 → won 49.42/854.088 | Rejected: no qualifying Lantern benefit. |
| 7 | Restore Lantern initial schedule. Olive: move one wave-2 M and wave-3 M into opening M@0.5/M@1; remaining wave-3 R delay 1.4→0. Test formation-sensitive benefit while retaining melee progress. | Age 1: fixed-mixed: won 46.50/138.175 → won 47.85/128.540; threat-aware: won 44.42/181.890 → won 48.18/224.700; Age 3: fixed-mixed: won 49.95/717.040 → won 49.95/698.576; threat-aware: won 49.42/854.088 → won 49.58/701.808 | Rejected: no qualifying Olive benefit. |
| 8 | Restore Olive initial schedule. Harbor: move two delayed wave-2 M into opening M@0.5/M@1. Test formation-sensitive benefit while retaining melee progress. | Age 1: fixed-mixed: won 47.85/128.540 → won 46.50/138.175; threat-aware: won 48.18/224.700 → won 44.42/181.890; Age 2: fixed-mixed: won 49.88/260.880 → won 49.63/245.840; threat-aware: won 50.45/436.712 → won 50.45/436.712 | Rejected: no qualifying Harbor benefit. |
| 9 | Restore Harbor initial schedule. Hillside: wave-3 launch 28→30s. Test formation-sensitive benefit while retaining melee progress. | Age 2: fixed-mixed: won 49.63/245.840 → won 49.88/260.880; threat-aware: won 50.45/436.712 → won 50.45/436.712; Age 4: fixed-mixed: won 52.65/1104.000 → won 52.65/1104.000; threat-aware: won 47.57/1250.941 → won 47.85/1258.752 | Rejected: banked melee times out. |
| 10 | Hillside: wave-3 launch 30→26s. Test formation-sensitive benefit while retaining melee progress. | Age 4: fixed-mixed: won 52.65/1104.000 → won 52.65/1104.000; threat-aware: won 47.85/1258.752 → won 47.57/1250.941 | Rejected: both melee policies lose. |
| 11 | Hillside: restore wave-3 launch 28s; wave-4 M/M@0.5/M@1→M/R@0.5/R@1, intent Rush→Volley. Test formation-sensitive benefit while retaining melee progress. | Age 4: fixed-mixed: won 52.65/1104.000 → won 54.57/1407.046; threat-aware: won 47.57/1250.941 → won 46.32/1209.581 | Benefit qualifies, but rejected alone: both melee policies lose. |
| 12 | Hillside: wave-2 H→M, intent Bulwark→Rush; all delays unchanged. Test formation-sensitive benefit while retaining melee progress. | Age 4: fixed-mixed: won 54.57/1407.046 → won 42.77/318.960; threat-aware: won 46.32/1209.581 → won 41.42/255.069 | Accepted with Courtyards redistribution: all gates pass. |

## Kill earnings and diagnostics

Reward formulas are unchanged. Encounter order and early victory alter realized kills and earnings; values below are same-budget runs, not compensation targets.

| Age / policy | Initial kills / earnings | Final kills / earnings |
| --- | --- | --- |
| 4 / immediate-melee | 2 / 294912 | 5 / 4870144 |
| 4 / banked-melee | 10 / 6160384 | 8 / 5533696 |
| 4 / fixed-mixed | 8 / 5533696 | 5 / 4870144 |
| 4 / threat-aware | 8 / 5533696 | 5 / 4870144 |
| 5 / immediate-melee | 5 / 6881280 | 7 / 11730944 |
| 5 / banked-melee | 9 / 60424192 | 9 / 60424192 |
| 5 / fixed-mixed | 7 / 54558720 | 9 / 60424192 |
| 5 / threat-aware | 7 / 54558720 | 7 / 54558720 |

| Timeline 3 levels | Wins | Losses | Timeouts |
| --- | ---: | ---: | ---: |
| 0 | 21 | 15 | 0 |
| 2 | 28 | 8 | 0 |

## Verification

- Pure RED: missing encounter and role modules; `pure-red.log`.
- Integration RED: six intended scheduler/trait failures against the old wave script; `integration-red.log`. One fixture's rounded time was corrected from 14.983s to exactly 15s before GREEN.
- Campaign RED: missing probe, then initial gate-4 assertion failure; `campaign-red.log`, `campaign-initial.log`.
- Final focused command: `node --experimental-strip-types --test tests/encounters.test.ts tests/role-traits.test.ts tests/game.test.ts tests/campaign.test.ts`; **40 pass**.
- `npm test`: **301 pass, 0 fail**.
- `npm run build`: **passes TypeScript and Vite**; existing large Phaser chunk and npm environment warnings remain.

The tests pin exact arrival contracts, invalid helper normalization, stable ties, deep immutable encounters, delayed clearance, capacity consumption, freeze/pause, enemy-age selection, battle reset/reconstructed victory, clamped hit events and exactly-once deaths, symmetric specialties, untouched meteor/base rules, and 1/60–1/30–1/20 frame parity. Campaign tests pin both documented later comparisons. Production lifecycle characterization additionally covers terminal no-new-arrivals/actions/events and legacy statless/invalid pending victories. HUD/renderer/browser verification belongs to subsequent tasks.
