# Lantern Cat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the already-authored epilogue cat as a bounded, state-truthful battlefield guide without changing gameplay.

**Architecture:** Add a pure presentation model beside the existing rescue model, then paint its finite frame through the existing pooled `ChronicleView`. Extend the permanent read-only browser journey with public-action epilogue fixtures and webdriver-only snapshots.

**Tech Stack:** TypeScript, Node test runner, Phaser 3 Graphics, Playwright in GitHub Actions.

**Spec:** `docs/designs/2026-10-02-lantern-cat.md`

## Global Constraints

- No new gameplay state, actions, targets, rewards, timers, persistence, economy, audio or input.
- Cat admission requires discovery bit `4` and route `whisper`.
- Pause freezes presentation; reduced motion uses a fixed pose and zero animated translation.
- Reuse pooled graphics; do not allocate per frame.
- Native Chromium runs only in GitHub Actions.

## Review Focus

- Malformed clocks/positions must produce finite bounded frames.
- Ordinary `scout` rescue must not inherit the epilogue cat.
- Cat must remain below front actors and behind the cage/scout endpoints.
- Repeated updates and route changes must clear old graphics and webdriver metadata.
- Browser fixtures must use disclosed saved preparation plus public controls and must prove save inertness.

---

### Task 1: Deterministic cat presentation model

**Files:**
- Create: `tests/chronicle-cat.test.ts`
- Create: `src/view/chronicle-cat.ts`

**Interfaces:**
- Produces: `chronicleCatFrame(input): ChronicleCatFrame | null`
- Produces: `chronicleCatRenderPlan(groundY, frame): ChronicleCatRenderPlan`

- [x] **Step 1: Write failing model tests** for admission, leading/watching/home transitions, malformed inputs, pause/reduced motion and depth bounds.
- [x] **Step 2: Run `node --experimental-strip-types --test tests/chronicle-cat.test.ts`** and verify failure because the module is missing.
- [x] **Step 3: Implement the minimal pure model** with no mutation or runtime allocation ownership.
- [x] **Step 4: Re-run the focused test** and verify it passes.

### Task 2: Pooled Chronicle renderer integration

**Files:**
- Modify: `tests/chronicle-cat.test.ts`
- Modify: `src/view/chronicle-view.ts`

**Interfaces:**
- Consumes: the Task 1 frame and render-plan functions.
- Produces: pooled cat/ground graphics and webdriver snapshot `canvas.dataset.chronicleCat`.

- [x] **Step 1: Add failing source/integration assertions** for pooled ownership, route/discovery inputs, clearing, dataset lifecycle and layer membership.
- [x] **Step 2: Run the focused test** and verify the integration assertions fail for missing production wiring.
- [x] **Step 3: Paint the minimal cat silhouette and paw marks** in the established ink/pigment language, with shape/direction cues independent of colour.
- [x] **Step 4: Re-run focused and nearby rescue tests** and verify they pass.

### Task 3: Native journey evidence and documentation

**Files:**
- Modify: `tests/chronicle-cat.test.ts`
- Modify: `scripts/review-chronicle.mjs`
- Modify: `docs/FOLKTALE-TACTICS.md`

**Interfaces:**
- Consumes: public battle controls and webdriver snapshot from Task 2.
- Produces: lead/watch/home screenshots at 320, 390 and 1024 plus report checks.

- [x] **Step 1: Add failing harness-contract assertions** requiring all three states, viewports, pause/static/save-inert checks and original screenshot filenames.
- [x] **Step 2: Run the focused test** and verify the harness contract fails.
- [x] **Step 3: Extend the permanent journey** with a disclosed all-discoveries `whisper` profile and public deployments/pause controls; never write state from the harness.
- [x] **Step 4: Update the folktale acceptance record** with scope and explicit evidence limits.
- [x] **Step 5: Run focused tests, all tests, build and `git diff --check`** before publication.

### Task 4: Review, native verification and merge

**Files:**
- Modify only if independent review or failing evidence supports a correction.

**Interfaces:**
- Produces: exact reviewed head/tree, PR, two independent review verdicts, successful GitHub Actions outcomes, inspected originals, merge reconciliation and independent production deployment evidence.

- [ ] **Step 1: Commit and publish the isolated branch; open a PR.**
- [ ] **Step 2: Obtain independent code review and bug audit; apply supported findings through fresh failing tests.**
- [ ] **Step 3: Inspect every required GitHub Actions job log and original mobile screenshot.**
- [ ] **Step 4: Verify expected PR head and exact reviewed tree, merge, compare merged source, and independently verify Vercel production.**
