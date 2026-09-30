# Tactical Encounters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deepen battles through six readable encounter schedules and automatic troop specialties, using existing controls.

**Architecture:** Pure encounter/preview and role-hit helpers feed the fixed-step simulation. Optional resolved hit metadata feeds existing effects; the existing wave chip, guidance, and role lines explain decisions. Task 2 consumes Task 1's contracts.

**Tech Stack:** TypeScript, Phaser 3, Node 22 type-stripping tests, Vite, existing Playwright review infrastructure.

**Spec:** `docs/superpowers/specs/2026-09-29-tactical-encounters.md`

## Global Constraints

- Keep exactly six ages and three unit kinds: melee `0`, ranged `1`, heavy `2`.
- Keep automatic lanes and movement; add no manual targeting, lane selection, menu, panel, or combat input.
- Preserve touch deployment, keyboard `1/2/3`, skills `Q/W/E`, pause, and current input isolation.
- Do not change save schemas, currencies, reward formulas, card bonuses, prices, unlock rules, or progression in this PR.
- Start with guard reduction `0.25`, pierce bonus `0.35`, sweep fraction `0.40`, and sweep radius `32` world units.
- Change encounter tuning or trait values only with recorded before/after public-action balance evidence and the reason for the change.
- Use the existing fixed simulation clock and deterministic ordering; no random encounters, wall-clock combat state, or adaptive difficulty.
- Keep normal combat readable at 320px and 390px without an additional persistent HUD surface.

The user authorized continued implementation/PR/merge without design-approval pauses. The coordinator owns commits, task briefs, independent reviews, and publication; task agents commit only if delegated explicitly.

## Review Focus

- Final delayed arrivals must prevent premature clearance while the field is empty.
- Restored victory and mixed player/enemy ages must select the right encounter without replaying arrivals.
- A primary kill followed by sweep must not duplicate rewards or source projectiles.
- Locked counters and immediate beginner deployment must retain fair completion paths.
- Narrow touch layouts, reduced motion, and keyboard focus isolation must preserve usable controls.

---

### Task 1: Encounter simulation, specialties, tests, and balance

**Files:** Create `src/game/encounters.ts`, `src/game/role-traits.ts`, `tests/encounters.test.ts`, `tests/role-traits.test.ts`, `scripts/simulate-encounters.ts`, and `docs/tactical-encounters-balance.md`. Modify `src/game/simulation.ts`, `src/game/types.ts`, `tests/campaign.test.ts`, and `tests/game.test.ts`.

**Interfaces:** Consume existing `Unit`, `UnitKind`, fixed-step `Game`, and public actions. Produce the spec's exact `Encounter`, `ScheduledSpawn`, `WavePreview`, `WaveStatus`, `encounterForAge`, `scheduledSpawns`, and `wavePreview` exports from `encounters.ts`; produce `CombatTrait`, `TraitHit`, `ROLE_TRAITS`, `resolveRoleHit`, and `sweepTarget` from `role-traits.ts`. Extend `Game.waveStatus(): WaveStatus` and add only optional `GameEvent.trait?: CombatTrait`. Keep save contracts unchanged.

- [x] **Step 1: Write failing helper tests.** Assert all six exact schedules, five waves each, distinct serialized tables, invalid-age fallback, stable arrival ties, preview clamping/counts, and input immutability. Pin `resolveRoleHit(1,0,100)` to `{damage:75,trait:'guard'}`, `(1,2,100)` to `{damage:135,trait:'pierce'}`, `(2,1,100,true)` to `{damage:40,trait:'sweep'}`, `(0,2,100)` to `{damage:100}`, and nonfinite damage to `{damage:0}`. Sweep selection includes exactly 32 units, excludes dead/friendly/primary, and breaks equal distance by ID. First Fires preview at time 23/launched 2 has `nextIn:1`, counts `[1,1,0]`.
- [x] **Step 2: Run RED.** `node --experimental-strip-types --test tests/encounters.test.ts tests/role-traits.test.ts` must fail on the absent helpers before implementation.
- [x] **Step 3: Implement pure modules.** Copy the spec's exact schedules/contracts/constants. Flatten absolute arrivals by time/wave/member order; use `hypot(dx,laneDelta*10)` for sweep. Do not tune initial values yet.
- [x] **Step 4: Add failing integration tests.** Assert delayed arrivals versus nominal launches, final pending-member clearance, pause versus freeze, one-time capacity rejection, early victory cancellation, every battle-reset path, and restored pending victory. Player age 4/enemy age 1 uses encounter 1. Identical action ticks with `1/60`, `1/30`, and `1/20` frame chunks produce equivalent state/events. Assert actual damage/kill credit exactly once, one secondary after a primary kill, and unchanged skill/base accounting. Run the Step 2 command plus `tests/game.test.ts` and record RED.
- [x] **Step 5: Integrate and verify GREEN.** Add battle-only encounter/schedule/cursor state and consume all due arrivals before unit actions. Apply role math once after card/timeline power; retain the killed primary's location for sweep. Emit actual-damage hit metadata and extended `waveStatus`. Run the Step 4 command; require all helper/integration tests pass.
- [x] **Step 6: Implement and run the balance matrix.** `node --experimental-strip-types scripts/simulate-encounters.ts` must produce the spec's 144 policy rows and 12 controls through public actions. Record command, revision, initial tuning, metrics, and comparisons in `docs/tactical-encounters-balance.md`. Keep historical baseline measurements distinct from new results.
- [x] **Step 7: Replace the universal campaign script and tune from evidence.** `tests/campaign.test.ts` owns the spec's opening-fairness, level-2 melee/mixed viability, no-deployment, and two later-chapter threat-aware advantage assertions. Run `node --experimental-strip-types --test tests/campaign.test.ts`. If a gate fails, tune encounter spacing/composition before traits, record exact before/after rows and rationale, update the spec table, and rerun relevant gates/matrix. Do not weaken gates to preserve a dominant fixed policy.
- [x] **Step 8: Full gate and handoff.** Run `npm test` and `npm run build`; both must pass. Report changed files, concrete balance comparisons, limitations, and evidence. Coordinator obtains independent review and checkpoints the task; do not call the PR complete before Task 2.

### Task 2: Existing HUD, tutorial, feedback, and browser verification

**Files:** Modify `src/ui/battle-hud.ts`, `src/ui/army-screen.ts`, `src/main.ts`, `src/ui/combat-focus.css`, `src/view/combat-feedback.ts`, `src/view/battlefield.ts`, `tests/interface.test.ts`, `tests/visuals.test.ts`, and `scripts/capture-browser-review.mjs`. Create `tests/combat-feedback.test.ts`; extend `tests/fixtures/layering.ts` and its README only as necessary for repeatable trait captures.

**Interfaces:** Consume Task 1's `WaveStatus`, `WavePreview`, `CombatTrait`, and optional event `trait`. Produce `waveLabel(status:WaveStatus):string`, backward-compatible `battleGuidance(profile:Profile,state:BattleState,preview?:WavePreview|null):string`, and `traitCueForHit(event:GameEvent):{trait:CombatTrait;x:number;lane:number}|null`. `projectileForHit` returns null for a secondary sweep event. Do not independently retune combat.

- [ ] **Step 1: Write failing behavioral tests.** Pin `VOLLEY 3/5 · 1M 2R · 8s`, omitted zero counts, final pending-member messaging, expanded accessible roles, opening guidance, all intent hints, locked-counter fallback, pause/danger precedence, and two-argument compatibility. Assert the three `Role · Specialty` labels retain name/cost semantics. Cue tests accept positive resolved unit hits with finite coordinates, reject absent/unknown metadata and non-unit/zero hits, and suppress only sweep projectiles. Prefer output/DOM assertions over source-string tests.
- [ ] **Step 2: Run RED.** `node --experimental-strip-types --test tests/interface.test.ts tests/visuals.test.ts tests/combat-feedback.test.ts` must fail on the missing helpers/copy.
- [ ] **Step 3: Implement existing-surface copy.** Use spec functions/copy in `battle-hud.ts`; pass preview in `main.ts`, provide an expanded accessible wave label without a countdown live region, and extend existing role labels/titles in `army-screen.ts`. Preserve prices, locks, and button areas. In `combat-focus.css`, fit 320px labels without midword wrapping: specifically fix the observed `Food / Productio / n` break, retaining whole words, visible battlefield space, and touch targets.
- [ ] **Step 4: Implement resolved cue rendering.** Add the pure cue helper and sweep-projectile suppression, then route shield/pierce/sweep accents through current bounded effects in `battlefield.ts`. Do not re-query targets or compute damage. Preserve source-lane/base layering and Canvas/WebGL; clear on reset; reduced motion gets a static brief accent; missing metadata is unchanged. Run Step 2 plus `tests/ground-effects.test.ts` and `tests/combat-choreography.test.ts`; require GREEN.
- [ ] **Step 5: Add production browser assertions.** In equally seeded sessions, real click/touch (`hasTouch:true`) and keyboard `1/2/3` each produce one affordable deployment; locked/disabled/repeated/menu/editable-focus cases never spend/deploy improperly; `Q/W/E` retain existing skills. Observe public save counters/food/DOM, without shipping test-state globals. At 320x640 and 390x844 assert no overflow, wave-chip bounds/no skill overlap, readable role and upgrade labels without midword breaks, and troop hit targets at least 44px. Use the existing test-only layering fixture for deterministic resolved trait events; preserve its default cases.
- [ ] **Step 6: Production verification and visual inspection.** Run `npm test`, `npm run build`, `npm run review:browser`, and `npm run review:layering`. Require no runtime errors or missing-art fallback. Inspect First Fires opening, incoming Volley/Bulwark, and reduced-motion trait captures at both widths; verify actual label readability, including Food Production. If local Chromium is unavailable, report that and use the established CI browser gate.
- [ ] **Step 7: Coordinator handoff.** Supply exact verification, balance evidence, and screenshot paths. Coordinator resolves independent whole-branch review, commits, opens the tactical PR, and merges after required checks under existing authorization. Economy/mastery remains the following PR.

## Self-review

Task 1 covers simulation, lifecycle, cheap-only fairness, and every balance gate; Task 2 covers teaching, feedback, input, and layout. Interfaces match the spec and each other. Every Review Focus condition has an owning regression step. No save/economy redesign, extra panels, manual lanes, or artwork repaint is included.
