# Survivor Verdicts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate truthful, role-specific survivor poses during the existing battle-result transition without changing gameplay or result timing.

**Architecture:** A new pure `battle-aftermath` module converts terminal phase, side, role, elapsed presentation time, and reduced-motion preference into a bounded pose. `battlefield.ts` observes the existing terminal event, applies the pose to its current pooled actors, and exposes a temporary diagnostic dataset; the simulation and main result flow remain authoritative and unchanged. The existing Chronicle GitHub Actions journey supplies native public-action execution and screenshot evidence.

**Tech Stack:** TypeScript, Phaser 3, Node test runner, Vite, Playwright Chromium in GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-01-survivor-verdicts.md`

## Global Constraints

- Do not change result timing, outcomes, unit positions, combat, rewards, economy, saves, controls, pause ownership, or audio.
- Consume only a fresh `win`/`lose` event and read-only actor fields; restored terminal saves do not fabricate a tableau.
- Reuse existing actor objects and frames; allocate no runtime asset, emitter, listener, DOM node, or control.
- Keep full-motion translation at or below four pixels, rotation at or below four degrees, and scale delta at or below four percent.
- Reduced motion is static and uses zero translation.
- Local browser execution is prohibited; native Chromium runs only in GitHub Actions.

## Review Focus

- A terminal save restored without its original event must not replay a celebration or change persistence.
- Result-modal timing and focus must remain byte-for-byte unchanged while the renderer uses the existing uncovered interval.
- Winner/defeated ownership must reverse correctly for loss and for enemy survivors on victory.
- Paused, hidden, reduced-motion, reset, retry, and scene-replacement paths must not leak or advance an old tableau.
- Sprite-sheet and vector fallback actors must remain finite, depth-stable, and correctly faced across all roles and both sides.

---

### Task 1: Pure survivor pose contract

**Files:**
- Create: `src/view/battle-aftermath.ts`
- Create: `tests/battle-aftermath.test.ts`

**Interfaces:**
- Consumes: terminal `Phase`, `Side`, unit kind, elapsed presentation seconds, and reduced-motion flag.
- Produces: `battleAftermathPose(input: BattleAftermathInput): BattleAftermathPose | null` with mode, frame, facing, translation, lift, angle, and scale.

- [x] **Step 1: Write failing tests** for nonterminal absence, win/loss side reversal, pairwise role silhouettes, defeated home-facing, exact bounds, reduced-motion time invariance, malformed input, immutability, and finite values.
- [x] **Step 2: Run** `node --experimental-strip-types --test tests/battle-aftermath.test.ts` and confirm failure because the module is absent.
- [x] **Step 3: Implement** the minimal pure finite pose model in `src/view/battle-aftermath.ts`.
- [x] **Step 4: Run the focused test** and confirm every survivor-pose case passes.
- [x] **Step 5: Commit** the pure contract and tests.

### Task 2: Phaser event and actor integration

**Files:**
- Modify: `src/view/battlefield.ts`
- Create: `tests/battle-aftermath-integration.test.ts`

**Interfaces:**
- Consumes: `battleAftermathPose`, the existing terminal event batch, current actor pool, renderer presentation clock, phase, and reduced-motion state.
- Produces: transformed existing actors plus temporary `canvas.dataset.battleAftermath` diagnostics.

- [x] **Step 1: Write failing source/integration tests** for terminal-event ownership, reset/scene cleanup, no fresh event on restored result, current-actor reuse, vector fallback transforms, pause/visibility clock ownership, dataset cleanup, unchanged result timing, and no save/model mutation.
- [x] **Step 2: Run the focused integration tests** and confirm the missing wiring fails.
- [x] **Step 3: Integrate** one scene-local terminal timestamp/phase, apply pure poses in `drawArmy`, report bounded diagnostics, and clear the state on nonterminal identity or shutdown.
- [x] **Step 4: Run focused presentation/integration tests** and `git diff --check`.
- [x] **Step 5: Commit** the renderer integration.

### Task 3: Native journey and release evidence

**Files:**
- Modify: `scripts/review-chronicle.mjs`
- Modify: `docs/superpowers/plans/2026-10-01-survivor-verdicts.md`

**Interfaces:**
- Consumes: disclosed prepared profiles, public Battle/deployment/speed controls, natural terminal outcomes, and `canvas.dataset.battleAftermath`.
- Produces: original victory/defeat tableau screenshots and report assertions at 320/390/1024.

- [x] **Step 1: Write failing browser-contract tests** for public-action natural results, diagnostic bounds, result-sheet timing, save inertness after terminal settlement, screenshots, and report copy.
- [x] **Step 2: Extend the read-only Chronicle journey** to reach real outcomes, observe the fresh tableau before the unchanged result sheet, check overflow/errors/assets, and capture originals.
- [x] **Step 3: Run focused tests, all source tests, production build, script syntax, and `git diff --check` locally; do not launch a browser locally.**
- [ ] **Step 4: Push the isolated branch, open a PR, run focused and full GitHub Actions, inspect every required completed job log, download and inspect original screenshots, and resolve supported failures.**
- [ ] **Step 5: Obtain independent code review and bug audit; fix supported findings test-first and rerun all affected gates.**
- [ ] **Step 6: Verify expected PR head and reviewed tree, merge only after every actual outcome passes, compare merged source, and independently verify the exact Vercel production deployment.**

## Self-review record

- Spec coverage: every IDEAL, Five Ws, guardrail, and acceptance item maps to Tasks 1–3.
- Step scan: the pure model, renderer boundary, and native evidence each own an independently checkable red/green cycle.
- Type consistency: `BattleAftermathInput`, `BattleAftermathPose`, and `battleAftermathPose` are used consistently by tests and renderer.
- Review focus: restore, result timing, side reversal, lifecycle cleanup, and fallback/depth risks each have an owning test step.
- Proportion: the plan fixes interfaces, bounds, and evidence boundaries without transcribing implementation bodies.
