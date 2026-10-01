# Restored Village Life Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Chronicle's already-saved oven, courtyard, and workshop restoration visibly return life to every painted settlement without changing gameplay or adding UI.

**Architecture:** Extend the existing pure `villageFrame` presentation model with a sanitized restoration mask, source-anchored restoration lights, and deterministic occupancy of the two already-measured apertures. The battlefield renderer consumes those marks through the existing shared light texture and ambience graphics, then deletes the old three-pixel Chronicle marker. All state remains derived from the saved profile plus the existing pause-aware village mood clock.

**Tech Stack:** TypeScript, Phaser 3, Node test runner, Vite, Playwright in GitHub Actions.

**Spec:** `docs/superpowers/plans/2026-10-01-restored-village-life.md` (IDEAL and Five Ws below)

## Global Constraints

- No combat, economy, reward, route, save-schema, input, audio, timing, or progression changes.
- Use only measured anchors in the six existing 900×1000 storybook paintings and the existing shared radial-light resource.
- Alarm, pause, hidden ownership, reduced motion, source cropping, and HUD avoidance remain authoritative.
- Restoration must remain understandable without color alone: oven/workshop are spatially distinct, while the courtyard is expressed by the number of inhabited apertures.
- Production browser execution remains GitHub Actions only; fixtures are disclosed preparation states, not earned victories.

## IDEAL

- **Identify:** The Chronicle promises that settlement lights return as the oven, courtyard, and workshop are restored, but current battles show only three 4×6 rectangles at the player-base edge. They are nearly invisible in current mobile captures and do not inhabit the painted village.
- **Discover:** Re-read the restoration/save rules, village-life model, mood ownership, painting registrations, recent PR126/127 evidence, and the six original village plates on 2026-10-01. The [official Kingdom Two Crowns page](https://kingdomthegame.com/kingdom-two-crowns/) describes building a kingdom, recruiting subjects, and protecting it; the bounded design inference is that persistent settlement progress should be visible in the settlement and its people, not merely in a HUD-like token. No competitor mechanic, code, or asset is copied.
- **Explore:** Considered help copy, base-edge icons, new prop sprites, repainting all six backgrounds, and reusing measured apertures. Copy repeats recent teaching work; icons add a second visual language; new props or repaints add disproportionate art risk. Choose existing-window activity because it is authored, source-anchored, readable at the point of meaning, and already governed by danger/recovery behavior.
- **Act:** Oven restoration adds a steady hearth wash at the first aperture. Courtyard restoration keeps both measured rooms inhabited during quiet/late recovery instead of the ordinary single visiting silhouette. Workshop restoration adds a distinct, gently breathing work light at the second aperture. Alarm dims the lights and clears neighbors; reduced motion uses the same static restoration state. The renderer uses a fixed six-quad light pool (four authored lamps plus two restoration lights) and no per-frame object allocation.
- **Look back:** Prove mask sanitation, bit-specific output, measured bounds, alarm/recovery behavior, reduced-motion and pause invariance, hard bounds, renderer pool size, save immutability, all source tests/build, native Chromium at 320/390/1024, original screenshot inspection, independent review, exact-tree merge, and production deployment.

## Five Ws

- **Who:** Returning and progressing players, including reduced-motion users, who need their village restoration to feel persistent without learning a new control.
- **What:** A bounded layer of restored warmth and habitation derived from the three existing restoration bits.
- **Where:** Inside the actual measured windows of the current chapter's painted settlement, behind combat actors and outside HUD surfaces.
- **When:** In ready and battle states whenever the corresponding saved restoration bit exists; the existing alarm/recovery clock controls whether neighbors remain visible and how much warmth survives danger.
- **Why:** Turn an abstract permanent unlock into an observable homecoming, strengthening atmosphere and progression continuity with no menu complexity.

## Review Focus

- Malformed restoration values must yield a finite 0–7 mask and never create unbounded marks (Task 1 tests).
- The courtyard must not duplicate polygons when the ordinary visitor already occupies the same aperture (Task 1 tests).
- Alarm and early recovery must not show restored residents while the settlement is still visually evacuated (Task 1 tests).
- Reduced motion and paused presentation clocks must keep a stable, fully informative composition (Tasks 1 and 2 tests).
- Added light quads must stay fixed at six and reuse the one cached 64×64 texture (Task 2 tests).

---

### Task 1: Pure restored-settlement frame

**Files:**
- Modify: `src/view/village-life.ts`
- Test: `tests/village-life.test.ts`
- Test: `tests/village-integration.test.ts`

**Interfaces:**
- Consumes: `VillageFrameInput.restoration?: number`, existing `VillageMoodSnapshot`, plate apertures, placement, and reduced-motion clock.
- Produces: `VillageFrame.restorationLights: readonly VillageHalo[]`; `residents` remains the single bounded polygon collection.

- [ ] **Step 1: Write failing tests** for bit-specific restoration lights, dual courtyard occupancy, alarm/late-recovery gating, malformed masks, finite measured bounds, static reduced motion, immutability, and total bounds.
- [ ] **Step 2: Run `node --experimental-strip-types --test tests/village-life.test.ts tests/village-integration.test.ts`** and confirm failures identify the missing restoration input/output.
- [ ] **Step 3: Implement the minimal pure model** in `src/view/village-life.ts`, deriving all positions from registered aperture bounds and capping output at two restoration lights/two residents.
- [ ] **Step 4: Re-run the focused tests** and confirm they pass.

### Task 2: Existing renderer integration and obsolete marker removal

**Files:**
- Modify: `src/view/battlefield.ts`
- Modify: `src/view/chronicle-view.ts`
- Test: `tests/village-integration.test.ts`

**Interfaces:**
- Consumes: `game.profile.chronicle?.restoration`, `VillageFrame.restorationLights`.
- Produces: six fixed scene-lifetime light quads; no Chronicle base-edge restoration rectangles.

- [ ] **Step 1: Write failing source-contract tests** for passing the saved mask, six pooled lights, painting authored plus restoration lights, and removal of the obsolete rectangles.
- [ ] **Step 2: Run the focused tests** and confirm the renderer contract fails before production edits.
- [ ] **Step 3: Implement minimal renderer wiring** using the existing `village-light` texture and combined bounded light list.
- [ ] **Step 4: Re-run focused tests, all 761+ source tests, and `npm run build`.**

### Task 3: Native visual evidence and release gates

**Files:**
- Modify: `scripts/review-chronicle.mjs`
- Modify: `.github/workflows/chronicle-review.yml` only if the existing artifact scope cannot carry the added captures.

**Interfaces:**
- Consumes: disclosed profiles with restoration masks 0 and 7, real application boot, existing native Chronicle review.
- Produces: original screenshots comparing unrestored/restored settlements and a report asserting no presentation save writes, errors, asset failures, or overflow.

- [ ] **Step 1: Add disclosed before/after fixtures** at 390×844 plus the existing 320/390/1024 regression journey.
- [ ] **Step 2: Publish an isolated PR and run focused plus full GitHub Actions workflows.**
- [ ] **Step 3: Inspect completed job logs and every new original PNG; reject loading, collision, crop, or style mismatch evidence.**
- [ ] **Step 4: Obtain independent code review and bug audit; apply only supported findings with a new failing test first.**
- [ ] **Step 5: Re-run required gates, verify reviewed head/tree, merge without force, compare merged tree, and independently verify the Vercel production deployment.**

## Evidence Boundaries

Source tests establish deterministic contracts, and GitHub Actions Chromium establishes behavior at captured software-rendered viewports. They do not establish physical-device/Safari acceptance, subjective atmosphere, organic comprehension, low-end performance, measured retention, or bug-free software.
