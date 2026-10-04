# Battle banner and Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add earned tactical orders, visible next goals and coordinated mobile presentation.
**Architecture:** Deterministic order rules in game/, derived Journey in ui/, bounded Phaser marks in view/, existing main guarded actions and modal primitives connect them.
**Tech Stack:** TypeScript, Phaser 3, Vite, native DOM/CSS, Node tests and Playwright CI. No new product dependencies.
**Spec:** docs/superpowers/specs/2026-10-04-battle-banner-journey-design.md

## Global Constraints
320px phone support; 44px controls; existing saves and optional statistics migration; pause freezes gameplay time; safe-area/close-row fixes stay; offline build list stays complete; reduced motion affects visuals only. Orders: 12 deployment / 8 kill / 100 cap / 60 cost / 10 seconds / 1.2 attack / 1.15 movement / .75 defense. No new reward grants.

## Review Focus
- Invalid or duplicate commands while paused/result/session blocked must leave state unchanged (Task 1 and 2 tests).
- Old pending receipts and retry must never restore transient order strength or award again (Task 1 and 2 tests).
- Completed veteran ladders and zero goals must show truthful destinations (Task 2 tests).
- Scrolled/narrow dialogs must retain close hit testing, controls and manual pause (Task 3 browser checks).
- Canvas marks remain bounded and cleared after reset and with reduced motion (Task 3 geometry and browser checks).

### Task 1: Earned battle orders
**Files:** src/game/battle-orders.ts, types.ts, statistics.ts, simulation.ts; tests/battle-orders.test.ts.
**Interfaces:** Produces BattleOrder='advance'|'hold'; BattleOrders={charge:number,active:BattleOrder|null,until:number}; createBattleOrders(), earnMomentum(state,amount), activeBattleOrder(state,time), canIssueOrder(state,order), issueBattleOrder(state,order). Consumes BattleState; optional state.orders initializes in newBattle, optional stats.ordersCast restored via battleStats.
- [ ] Write regressions: five accepted spawns reach60; denied spawn adds0; invalid/paused/duplicate order mutation-free; sixty spent once; exact ten-second expiry/pause; retry resets; matched deterministic fights prove +20% normal damage and .75 received damage.
- [ ] Run `node --experimental-strip-types --test tests/battle-orders.test.ts`. Expected: missing module/behavior before implementation.
- [ ] Implement module/rules and authoritative action `order` with BattleOrder; add bounded `order` event carrying order; normal attacks/movement consume active multipliers, defense applies in hurt and enemy hurtBase.
- [ ] Run `npm test && npm run build`. Expected: all passing.
- [ ] Commit Task 1.

### Task 2: Banner controls and Journey
**Files:** src/ui/battle-orders.ts, journey-screen.ts, battle-banner.css; src/main.ts, results-screen.ts; DESIGN.md, UX-CONTRACT.md; tests/journey-screen.test.ts, main-integration.test.ts, main-reset-integration.test.ts.
**Interfaces:** Consumes Task1 BattleOrders/action; journeyGoals(profile) returns three derived quest-progress entries; journeyScreenHtml(profile,state) uses existing data-command, data-claim and data-tab; banner updater uses existing DOM-state functions and native buttons.
- [ ] Write regressions for earned/unearned/completed goals, exact quest payouts and nonmutating generation; actual main handlers order dispatch, Journey opens and menu pause/guarded claim stays correct.
- [ ] Run targeted tests. Expected: missing modules/commands fail before implementation.
- [ ] Add banner row outside canvas, charge meter, Advance/Hold buttons with explanatory names and countdown, Journey ready/result entry and Journey-aware claim updates/navigation. Document native controls/modal/toast ownership and canonical token mapping. Use existing quest economics.
- [ ] Run `npm test && npm run build`. Expected: all passing, old fixtures adapted only for additive imports/DOM.
- [ ] Commit Task2.

### Task 3: Visual cadence and mobile acceptance
**Files:** src/view/order-presentation.ts, battlefield.ts; tests/order-presentation.test.ts; scripts/verify-battle-banner.mjs; .github/workflows/battle-banner-review.yml; docs/BATTLE-BANNER.md.
**Interfaces:** Consumes active order and living player units; produces bounded frame of aura/pennant coordinates from simulation state and layout, no rules/view mutation. CI records exact revision, actual native touch assertions and PNG screenshots.
- [ ] Write geometry regressions: dead/enemy excluded, maximum marks bounded, static reduced-motion and inactive/reset frames empty.
- [ ] Run target test. Expected: missing module before implementation.
- [ ] Paint reusable bounded graphics behind units; transient order event text; improve shared portrait/readiness and banner material treatments. Implement Chromium/WebKit QA at320x568,390x844 and844x390, Journey/claims/orders/pause/rotation/reload/offline and20 cycles; add permanent review workflow and evidence docs.
- [ ] Run full tests/build, syntax/diff checks, premium static audit and design lint; publish branch and run CI. Expected: source/build pass; inspect every browser result and representative screenshots; disclose driver/device limits.
- [ ] Commit task; dispatch fresh whole-branch reviewer per executing-plans. Fix important findings with RED→GREEN/full suite, publish updated reviewable PR with evidence.
