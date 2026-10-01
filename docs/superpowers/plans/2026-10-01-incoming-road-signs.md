# Incoming Road Signs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a truthful four-second enemy-wave approach signal in the battlefield without changing gameplay or adding UI.

**Architecture:** `Game.waveStatus()` remains the sole schedule/preview authority and becomes an optional read-only capability on the existing view port. A new pure `wave-arrival` module sanitizes that preview into bounded storybook geometry; `battlefield.ts` owns one pooled graphics object and only paints the frame. The existing Chronicle browser journey supplies native execution and screenshot evidence.

**Tech Stack:** TypeScript, Phaser 3, Node test runner, Vite, Playwright Chromium in GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-01-incoming-road-signs.md`

## Global Constraints

- Do not change encounter timing, spawn behavior, combat, economy, rewards, saves, controls, pause ownership, or audio.
- Consume the existing `WaveStatus.preview`; do not reconstruct encounters in presentation code.
- Cap output at five role marks and four countdown knots and reject non-finite geometry.
- Encode intent and role using geometry as well as pigment.
- Use a single pooled graphics object below bases and actors; create no runtime resource per frame.
- Local browser execution is prohibited; native Chromium runs only in GitHub Actions.

## Review Focus

- Malformed or adversarial preview numbers must produce finite bounded output or no frame.
- Chronicle-modified rush/volley/bulwark schedules must reach the renderer through the same authoritative query as the HUD.
- A preview at exactly four seconds and exactly zero seconds must render, while values above four must not.
- Pause and reduced motion must not create an independent animation clock or presentation save write.
- The signal must remain behind bases/actors and clear of HUD/objective/input surfaces at 320, 390, and 1024 widths.

---

### Task 1: Pure wave-arrival contract

**Files:**
- Create: `src/view/wave-arrival.ts`
- Create: `tests/wave-arrival.test.ts`

**Interfaces:**
- Consumes: `WaveStatus.preview`, battle phase, pause, and reduced-motion flags.
- Produces: `waveArrivalFrame(input: WaveArrivalInput): WaveArrivalFrame | null`, with finite banner, role marks, countdown knots, progress, and fixed depth offset.

- [ ] **Step 1: Write failing tests** for phase/threshold gates, exact four/zero-second boundaries, all intent banners, all role marks, malformed counts/timing, five-mark/four-knot caps, reduced-motion fixed pose, pause stability, immutability, and finite bounds.
- [ ] **Step 2: Run the focused test** with `node --experimental-strip-types --test tests/wave-arrival.test.ts` and confirm it fails because the module is absent.
- [ ] **Step 3: Implement the minimal pure model** in `src/view/wave-arrival.ts`, consuming preview values only and returning frozen bounded data.
- [ ] **Step 4: Run the focused test** and confirm every wave-arrival case passes.
- [ ] **Step 5: Commit** the pure contract and tests.

### Task 2: Phaser integration and schedule boundary

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/view/battlefield.ts`
- Modify: `tests/presentation.test.ts`
- Modify: `tests/main-integration.test.ts`

**Interfaces:**
- Consumes: optional `GamePort.waveStatus(): WaveStatus` and `waveArrivalFrame`.
- Produces: one pooled `Phaser.GameObjects.Graphics` plus `canvas.dataset.waveArrival` diagnostics.

- [ ] **Step 1: Write failing source/integration tests** that require the optional read-only port, one allocation, exact preview delegation, fixed depth beneath bases/actors, dataset cleanup, and no save/input/model mutation.
- [ ] **Step 2: Run the focused tests** and confirm the missing integration fails.
- [ ] **Step 3: Add the optional port and painter** with intent-specific banner geometry, role-specific marks, four knots, and exact dataset fields; clear/delete it whenever no frame exists.
- [ ] **Step 4: Run all focused presentation/integration tests** and `git diff --check`.
- [ ] **Step 5: Commit** the integration.

### Task 3: Native journey and release evidence

**Files:**
- Modify: `scripts/review-chronicle.mjs`
- Modify: `tests/chronicle-browser-contract.test.ts`
- Modify: `docs/superpowers/plans/2026-10-01-incoming-road-signs.md`

**Interfaces:**
- Consumes: public Battle and Pause controls and `canvas.dataset.waveArrival`.
- Produces: original rush/volley/bulwark screenshots and report assertions at 320/390/1024.

- [ ] **Step 1: Write failing browser-contract tests** for the three disclosed commander fixtures, public pause, exact diagnostic assertions, save inertness, screenshots, and report copy.
- [ ] **Step 2: Extend the read-only Chronicle journey** to wait for each real preview, pause atomically, prove state stability across an autosave boundary, check bounds/overflow/errors, and capture originals.
- [ ] **Step 3: Run focused tests, all source tests, production build, script syntax, and `git diff --check` locally; do not launch a browser locally.**
- [ ] **Step 4: Push the isolated branch, open a PR, run focused and full GitHub Actions, inspect every required completed job log, download and inspect original screenshots, and resolve supported failures.**
- [ ] **Step 5: Obtain independent code review and bug audit; fix supported findings test-first and rerun all affected gates.**
- [ ] **Step 6: Verify expected PR head and reviewed tree, merge only after every actual outcome passes, compare merged source, and independently verify the exact Vercel production deployment.**

## Self-review record

- Spec coverage: all IDEAL, Five Ws, guardrails, and acceptance items map to Tasks 1–3.
- Step scan: every implementation step has a focused failing/passing check; browser execution is explicitly deferred to CI.
- Type consistency: the pure function and optional `GamePort.waveStatus()` names are used consistently by tests, renderer, and browser journey.
- Review focus: malformed input, exact boundaries, Chronicle schedules, pause/reduced motion, and depth/viewport risks each have an owning test step.
- Proportion: the plan fixes interfaces and evidence boundaries without transcribing implementation bodies.
