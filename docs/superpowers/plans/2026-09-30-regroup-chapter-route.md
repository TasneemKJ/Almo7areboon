# Recovery through chapter choice

Base: main `db182057f423bf7721a757daadb59b8ab3d5fec4`, clean isolated branch `feat/regroup-chapter-route`. No open PRs on the initial live check. User authorized autonomous implementation, independent review, native CI, merge and deployment verification.

## IDEAL

- Identify: an explicitly prepared age-4 / enemy-5 / frontier-5 profile with zero coins, no cards/upgrades/skills, deploying melee whenever possible loses in 38.7 simulation seconds with zero income. Selecting chapter index 4 through public dispatch wins in 41 seconds for 5,689,344 coins; index 3 wins in 33.42 seconds for 585,728. These are deterministic policy results, not a universal softlock or guaranteed win.
- Define: let a defeated player reach existing chapter choice directly, understand a reasonable earlier opponent to try, keep all preparation and economy decisions voluntary.
- Explore: more help copy alone leaves navigation opaque; automatically lowering the opponent removes agency; an optional loss action opening the existing picker connects explanation to a real decision. Choose the third.
- Act: add a loss-only action when an earlier chapter exists. Retry via the existing guarded action, then open the picker with the suggested earlier chapter focused and explained. Suggest the highest unlocked earlier chapter no higher than the player's army. Opening never selects, spends, starts combat or grants rewards. The picker may be dismissed or any unlocked opponent chosen. Existing retry and terminal routes remain.
- Look back: meaningful RED/GREEN regressions, full suite/build, native 320/390px keyboard and mouse flows with source/save receipts, original screenshot review, independent code/bug audit, exact-head and merged-tree checks.

## Five Ws

- Who: players recovering after defeat, especially after evolution resets funds and unlocks.
- What: optional direct chapter selection plus a truthful suggested opponent.
- Where: existing result and chapter picker, no new HUD panel or saved tutorial state.
- When: a real loss/retreat and at least one earlier unlocked opponent.
- Why: make existing recovery choices discoverable without increasing rewards or forcing purchases.

## Contract and sequence

1. Reproduce the case through public simulation; add failing presentation and real-handler tests for availability, suggested target, no spending/selection, stale invocation and save ownership precedence.
2. Implement presentation, guarded route and focus using existing modal mechanics. Preserve pending-win guards, save schema, locks, pause/input, sound/motion and economy. Ordinary picker remains unchanged unless opened for recovery.
3. Add production Playwright coverage to the existing regroup gate: disclosed zero-coin preparation at both sizes, actual defeat, keyboard open, unchanged profile until explicit opponent choice, choice/reload/start, real melee-only victory and usable earned coins. Add cancel and foreign-save cases. Existing native gates remain required.
4. Run all source tests/build, inspect diff, publish PR, independently review/bug-audit, fix supported issues, inspect completed job outcomes and original PNGs, merge only reviewed source tree, verify merged tree and production alias separately.

Research: PONOS's official Battle Cats page (https://www.ponos.jp/en/games/thebattlecats/, checked September 30) describes stage clearing feeding upgrades and a simple tap-based battle system. Design inference: expose the existing stage-to-preparation loop through one voluntary route; do not add a subsystem or copy assets/code. Retention/fun effects remain unmeasured. Broader atmosphere, animation, combat and audio remain roadmap goals beyond this recovery slice.
