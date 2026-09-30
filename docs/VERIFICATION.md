# Verification — 2026-09-29

## Chapter mastery browser gate — 2026-09-30

`npm run review:mastery` runs `node --experimental-strip-types scripts/capture-mastery-review.mjs` against the built app. The required CI gate uses the existing Playwright Chromium installation and preserves the simulation, build, portrait, layering, and save-session gates. Screenshots and machine-readable seed/action, saved-ledger, modal-layout, runtime-error and verdict evidence are uploaded as `mastery-browser-review` from `artifacts/browser-review/mastery/diagnostics.json` and its sibling PNGs.

Seed victories use the public `Game.dispatch` and fixed-step simulation before browser startup. Historical purchased rosters and holdings are identified as fixtures; no live browser Game is modified and no combat outcome is forced. Legacy fixtures migrate real receipts as schema 2. Browser checks drive real controls and keys at 320×568 and 390×844: evolution return/cancel/close/Escape and confirmation, insufficient funds, rematch losses and ready reload continuation for ordinary/final chapters, older replay, legacy Continue-first, and new/legacy terminal Return to chapters/Escape. Shared-context checks cover stale tabs, foreign saves during result-origin evolution, authoritative receipt reacquisition and explicit temporary advancement with unchanged save keys. The 37 bounded scenarios additionally cover fresh live victories at both sizes, actual clear-only remaining-seal results, refreshed evolution cost/affordability, paused controls, double activation, focus isolation, reduced motion, action visibility, overflow and art/runtime errors.

Local Chromium crashes before a page can open in the current execution environment. No browser replacement or workaround is used. `node --check scripts/capture-mastery-review.mjs` and `git diff --check` passed locally on 2026-09-30. A syntax pass does not establish that the 37 browser scenarios pass. Each scenario has a 210-second budget, natural battle results have a 150-second wait, and the combined workflow has a 30-minute budget. The first complete runtime verdict must come from the required CI gate. Pending CI and uncaptured screenshots remain unverified; later results should be recorded against their exact revision.

## Current production integration and mastery readability — 2026-09-30

The local no-commit merge of production `9828941b18981a97f0a1bd633e58e48fa55fc7b9` into mastery `346d8ca` retains all review commands, including overlap, monkey and mastery. Fresh `NODE_OPTIONS='--test-reporter=tap' npm test` passed **463 tests / 0 failures**, with no skips or cancellations; `npm run build`, syntax checks for mastery/save-session/monkey/overlap scripts, and staged/unstaged diff checks exited 0.

The scoped readability adjustment raises visible mastery seal titles, objectives, remaining rewards, gate-damage and credited-receipt information to at least 11px, removes the small-phone title reduction, and uses flexible width/text wrapping. The 37-case browser gate now records native computed font sizes for visible mastery information and requires the 11px floor alongside existing viewport/action bounds and screenshots. Existing compact picker symbols retain accessible seal names. No CSS source-mirroring test was added. Actual 320px fit and rendered font acceptance require the new CI screenshots/verdict; no local browser launch was retried.

## Protected-save integration and harness timing — 2026-09-30

The local no-commit integration of production `e29b3e11560d0490d2280e775291baa456a37252` into mastery `d997a84` preserves both `review:mastery` and `review:monkey`, the current main `cueFor` audio mapping, and all mastery result/evolution guard routes. Fresh `NODE_OPTIONS='--test-reporter=tap' npm test` passed **460 tests / 0 failures**, with no skips or cancellations; `npm run build`, syntax checks for all three changed browser scripts, and staged/unstaged `git diff --check` exited 0.

A deterministic orchestration regression runs an autosave after every browser task. It first demonstrated that the mastery foreign-Escape case let autosave detect the fault, while close/confirmation lost their controls before input. The three scenarios now inject unannounced save bytes and invoke the actual selected handler synchronously in one browser task; exact stored-byte, recovery priority, rescue receipt and reload checks are unchanged. Ordinary native click/keyboard routes remain separate. Native deployment clicks have a 750ms bound and excuse failure only after observing a natural won/lost transition; running/ready failures still propagate, and the original outcome/receipt assertions remain mandatory. The seven new mastery orchestration/boundary regressions plus the two production save-harness regressions pass. This is harness timing evidence, not a browser runtime pass; required CI remains the rendered acceptance boundary.

## Chapter mastery local evidence — 2026-09-30

On baseline `92f0a03` plus the Task 2 followup, `NODE_OPTIONS='--test-reporter=tap' npm test` passed **442 tests / 0 failures**, with no skips or cancellations; `npm run build`, `node --check scripts/capture-mastery-review.mjs`, and `git diff --check` each exited 0. The build retains the existing Phaser chunk-size warning.

UI RED tests first failed on absent mastery helpers, reward breakdown, rematch/footer routes and guarded result-return wiring; the focused presentation/compatibility suite then passed. Additional tests execute the actual extracted main click/dismiss functions over real-action settled and legacy receipts: cancel/return, evolution confirmation/rejected affordability, refreshed cost, both save-check and save-persistence recovery priority, and terminal Return/Escape. A review regression demonstrated a real first loss at timeline 1000 falsely claiming completion; it now retains Regroup with neutral final-timeline copy unless the selected chapter is won or previously cleared. The focused mastery/main suite passes 27 tests. Pure browser seed helpers were also executed independently: chapter-1 funded victory was 53.30 seconds/mask 7, intentionally missed optional chapter-0 victory 98.72 seconds/mask 1, and terminal historical-roster victory 22.68 seconds/mask 3. These establish lawful seeds, not rendered browser outcomes.

`review:mastery`, `review:browser`, and `review:save-sessions` were not rerun locally because the established Chromium launch crashes before page creation. The new gate is required in CI; runtime, screenshots and layout acceptance remain pending that verdict. No runtime pass is inferred from the syntax, unit or build results above.

## Earlier local evidence

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
