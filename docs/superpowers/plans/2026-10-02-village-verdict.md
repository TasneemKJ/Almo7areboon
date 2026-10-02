# Village Answers the Verdict Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the painted settlement visibly and truthfully answer the existing win/loss verdict before the unchanged result sheet.

**Architecture:** Add one pure outcome/timing model, then let the existing `villageFrame` translate that intent through its registered window geometry. The existing battlefield ambience graphics and six-light pool render the result and expose webdriver-only evidence; gameplay and persistence remain untouched.

**Tech Stack:** TypeScript, Phaser 3, Node test runner, Vite, Playwright in GitHub Actions.

**Spec:** `docs/designs/2026-10-02-village-verdict.md`

## Global Constraints

- No save, reward, result-timing, control, economy, balance, target, audio, profile-schema or progression changes.
- Geometry comes only from the six registered 900×1000 storybook plates and stays behind bases/troops and outside HUD surfaces.
- Reuse the existing ambience graphics and fixed six-light pool; allocate no textures or scene-lifetime objects.
- Pause and hidden ownership freeze the shared presentation clock. Reduced motion uses a complete static response.
- Native browser execution remains GitHub Actions only; disclosed fixtures are not claims of organic victory or retention.

## Review Focus

- A result event and terminal phase must agree; stale phase without the authoritative aftermath owner must not manufacture a reaction.
- Huge finite or malformed elapsed values must produce finite bounded progress and geometry.
- Victory occupancy must not duplicate ordinary/restored residents; loss must not leave a stale silhouette.
- Retry, new battle identity and shutdown must remove webdriver diagnostics and restore normal village life.
- Light attenuation/brightening must return new values without mutating the source frame or saved restoration mask.

---

### Task 1: Pure verdict intent and measured village composition

**Files:**
- Create: `src/view/village-verdict.ts`
- Modify: `src/view/village-life.ts`
- Create: `tests/village-verdict.test.ts`
- Modify: `tests/village-life.test.ts`

**Interfaces:**
- Consumes: `Phase`, `elapsed`, `reduced`, optional `VillageFrameInput.verdict`.
- Produces: `villageVerdictFrame(input): Readonly<VillageVerdictFrame>|null`; `VillageFrame.verdictStrokes`; verdict-aware residents and light descriptions.

- [ ] **Step 1:** Write failing model tests for terminal-only truth, exact 0/0.6 progress boundaries, reduced-motion completion, malformed/huge time, immutability and non-mutation.
- [ ] **Step 2:** Write failing village tests for two victory witnesses/six rays, zero loss witnesses/four shutter strokes, measured finite bounds, bit-mask preservation, no duplicate occupancy and hard output caps.
- [ ] **Step 3:** Run `node --experimental-strip-types --test tests/village-verdict.test.ts tests/village-life.test.ts` and confirm failure is the missing contract.
- [ ] **Step 4:** Implement the minimal pure model and measured composition.
- [ ] **Step 5:** Re-run the focused tests and confirm they pass.
- [ ] **Step 6:** Commit the pure slice.

### Task 2: Existing renderer ownership and diagnostics

**Files:**
- Modify: `src/view/battlefield.ts`
- Modify: `tests/village-integration.test.ts`

**Interfaces:**
- Consumes: the existing authoritative `this.aftermath`, pause-aware `this.clock`, `VillageFrame.verdictStrokes`, residents and lights.
- Produces: existing-layer drawing plus webdriver-only `dataset.villageVerdict` with bounded summary fields.

- [ ] **Step 1:** Write failing source/integration tests for authoritative aftermath ownership, pause-aware elapsed time, existing ambience/light pools, diagnostics gating and reset/shutdown cleanup.
- [ ] **Step 2:** Run `node --experimental-strip-types --test tests/village-verdict.test.ts tests/village-life.test.ts tests/village-integration.test.ts tests/battle-aftermath-integration.test.ts` and confirm the renderer contract fails.
- [ ] **Step 3:** Wire the verdict through `drawAtmosphere`, paint strokes on ambience, summarize only under webdriver, and clear every lifecycle boundary.
- [ ] **Step 4:** Re-run focused tests, all source tests and `npm run build`.
- [ ] **Step 5:** Commit the renderer slice.

### Task 3: Native evidence and release gate

**Files:**
- Modify: `scripts/review-chronicle.mjs`
- Modify: `tests/chronicle-aftermath-review.test.ts`
- Modify: `docs/FOLKTALE-TACTICS.md`

**Interfaces:**
- Consumes: existing natural win/loss public-action fixtures and Phaser post-render snapshots.
- Produces: validated village-verdict diagnostics and original pre-result screenshots at 320, 390 and 1024.

- [ ] **Step 1:** Write failing harness-contract tests requiring the new diagnostic, exact outcome mode, bounded progress/marks/lights and save-inert public pause comparison.
- [ ] **Step 2:** Run the focused harness test and confirm it fails for missing evidence.
- [ ] **Step 3:** Extend the existing survivor-verdict capture instead of creating another browser journey; document the bounded continuation.
- [ ] **Step 4:** Re-run focused tests, all source tests and production build.
- [ ] **Step 5:** Commit, push, open a PR, run both GitHub Actions workflows, inspect every original screenshot and completed job log, obtain independent code and bug review, fix supported findings tests-first, verify exact head/tree, merge and independently verify production.

## Evidence Boundaries

Source tests establish deterministic contracts, and GitHub Actions Chromium establishes the captured software-rendered states. They do not establish physical-device/Safari acceptance, subjective atmosphere quality, organic comprehension, measured retention or low-end performance.
