# Verification — 2026-09-29

## Fresh local evidence

- `npm test`: **82 tests passed, 0 failed**, exit 0.
- `npm run build`: TypeScript validation and Vite production build passed, exit 0.
- `git diff --check`: passed.
- Author self-review completed; no independent reviewer tool was available.

The environment used Node 22.16.0 and dependencies recovered from the repository's GitHub Actions workspace. No new product dependency was installed. The documented Node minimum remains 22.18+. A subsequent GitHub Actions run verifies the pushed tree separately; a pending run must not be described as passing.

## What the tests demonstrate

Combat, spending, limits, fixed-step timing, pause behavior, progression, card packs, migration, save recovery, victory reloads, statistics and extreme-profile numeric bounds are exercised through the real simulation or stable component functions. Interface tests exercise template output, focus calculations, pause ownership and update caching. Layout and entry-point wiring checks explicitly inspect CSS/source; they are not rendered browser tests.

All six same-age mixed armies win using ordinary purchase, deploy and step actions within a 90-second simulation budget. Basic-only armies also win within 180 seconds. These are bounded deterministic campaign fixtures, not evidence that every strategy, timeline or human session is balanced.

## Baseline and test changes

The original checkpoint reproduced **37 passing / 6 failing tests** and a failing production type check. The recovered core reached 59 passing tests and a clean build; interface, audio, layout-contract and robustness checks brought the final suite to 82.

Two old prototype assertions were deliberately updated: evolution now clears all coins under the approved reset rule, and save migration produces the 30-card collection instead of the six prototype slots. The original basic-only campaign's 150-second limit was raised to 180 after a normal-action probe showed later armies winning at approximately 160 seconds. A stricter 90-second mixed-army campaign was added; no win or base-health mutation is used in that campaign test.

Focused RED-to-GREEN runs covered restored core behavior, component integration, optional audio failure handling, responsive source contracts and the final CI artifact gate. Some recovery tests were already green on the recovered implementation; those are characterization checks, not claimed test-first new work.

## Final review correction

The build artifact originally depended only on a successful build, so failed tests could still produce an artifact labeled verified. The regression assertion was observed failing, the workflow gate was changed to require both tests and build, and the assertion passed. The complete suite and build were then rerun.

## Not verified / release gates

Browser access to the local app was blocked previously. It was not bypassed with another port, driver or browser. Consequently there are no new screenshots, actual DOM interaction runs, measured mobile layouts, Safari/iOS tests, WebGL fallback checks or device performance measurements in this delivery.

Outstanding visual acceptance: 320x568 and 390x844 portrait, narrow/short landscape, desktop, real touch deployment, modal focus and import/export behavior, troop/projectile appearance, audio gestures and reloads in the browser. CSS source checks do not clear these gates. Passes 36 and 37 in the iteration record remain pending visual sign-off. The branch should not be represented as release-ready or merged on the strength of unit tests alone.

Phaser's vendor chunk is approximately 1.21 MB uncompressed / 332 KB gzip and emits Vite's chunk-size warning. Other code and CSS build successfully. There is no measured frame-rate claim.

## Fidelity scope

Original code and vector art are retained. The reference's hidden economy and complete live-service systems are not reproduced; no pixel-exact comparison has been performed. See the README for explicit exclusions.
