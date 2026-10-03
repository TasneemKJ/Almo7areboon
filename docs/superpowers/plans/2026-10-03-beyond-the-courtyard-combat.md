# Beyond the Courtyard — Tribes and Combat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Implement eight tribe kits, 24 role variants, twelve selectable skills, twelve relics, expansion objectives and bosses as deterministic simulation rules.

**Architecture:** Combat rules live in focused pure modules under `src/game/frontier/combat/`; the existing fixed-step Game remains authoritative. Units carry explicit tribe/variant identity. Skills accept typed targets and emit events; no renderer callback owns gameplay.

**Tech Stack:** TypeScript, existing fixed-step simulation and Node tests.

**Spec:** approved Beyond the Courtyard design/content/acceptance docs.

## Global Constraints
- Eight tribes × three roles = 24 variants; same advertised tribe rules apply to player/enemy units.
- Three equipped once-per-battle skills; twelve skill IDs, exactly seven new mechanics.
- One relic or none; twelve relic IDs; no recursive triggers.
- Temporary reduction and slow caps are 60%; root is separate; simulation time owns durations.
- Deterministic target ties: distance then unit ID.
- Decoys never count as troops, kills, survivors or rewards.
- No input-reading counter-AI, unbounded spawn loop or hidden scaling against loadout/cards.

## Review Focus
- Simultaneous death resolves gate destruction as defeat.
- Large/small delta partitions and 1×/2× speed remain equivalent within fixed-step tolerance.
- Targeting cancellation/retry cannot cast into the next battle.
- Boss/add/decoy entities cannot mint reward tickets.
- Aura/status overlap respects strongest-source and combined caps.

---

### Task 1: Tribe roster definitions and role resolution
**Files:** Create `src/game/frontier/content/tribes.ts`, `combat/tribes.ts`; test `tests/frontier-tribes.test.ts`.
**Interfaces:** `TribeId`, `VariantId`, `tribeDefinition(id)`, `frontierUnitDef(era, tribe, kind, side)`.
- [ ] Write CT04/DM05 tests for eight IDs, 24 variants, exact catalogue modifiers, parity and deterministic ties.
- [ ] Verify red; implement; verify green.
- [ ] Commit `feat: add eight frontier tribe kits`.

### Task 2: Unified temporary effects and damage pipeline
**Files:** Create `combat/effects.ts`, `combat/damage.ts`; modify frontier unit state types; test `tests/frontier-effects.test.ts`.
**Interfaces:** `applyEffect`, `tickEffects`, `resolveFrontierDamage(context)`.
- [ ] Test caps, strongest aura, reveal/conceal/contact, roots, pulls, DOT non-proc and expiry.
- [ ] Verify red; implement deterministic pipeline; verify green.
- [ ] Commit `feat: add frontier effect pipeline`.

### Task 3: Twelve skills and targeting transaction
**Files:** Create `content/skills.ts`, `combat/skills.ts`, `combat/targeting.ts`; test `tests/frontier-skills.test.ts`.
**Interfaces:** `SkillId`, `TargetBand`, `beginSkillTarget`, `cancelSkillTarget`, `castFrontierSkill`.
- [ ] Test all 12 legal effects plus duplicate use, missing target, paused/terminal/unowned state, zone boundaries, Escape/cancel and stale attempt sequence.
- [ ] Verify red.
- [ ] Implement adapters for Freeze/Meteor/Food and captain-derived skills plus seven new mechanics using exact spec values.
- [ ] Verify green and commit `feat: add frontier skill loadouts`.

### Task 4: Twelve relic triggers
**Files:** Create `content/relics.ts`, `combat/relics.ts`; test `tests/frontier-relics.test.ts`.
**Interfaces:** `RelicId`, `applyRelicEvent(context,event)`, per-battle use flags.
- [ ] Test each eligible/ineligible trigger, once-only reset, non-recursion, Star Map preview width and decoy exclusions.
- [ ] Verify red; implement exact catalogue rules; verify green.
- [ ] Commit `feat: add frontier relic system`.

### Task 5: Expansion objective primitives
**Files:** Create `combat/objectives.ts`; test `tests/frontier-objectives.test.ts`.
**Interfaces:** `FrontierObjectiveState`, `tickFrontierObjective`, `frontierOutcome`.
- [ ] Test escort/rescue/hold/landmark plus sequenced landmarks, vulnerability, decoys, healing pulses, siege volleys, deadlines and dead/decoy exclusions.
- [ ] Verify red; implement finite state transitions; verify green.
- [ ] Commit `feat: add frontier mission objectives`.

### Task 6: Six boss controllers
**Files:** Create `combat/bosses.ts`; test `tests/frontier-bosses.test.ts`.
**Interfaces:** `BossState`, `tickBoss`, `interruptBoss`; content IDs from catalogue.
- [ ] Test six bosses for warning minimums, counters, thresholds, finite adds, simultaneous death, deadline and 2× behavior.
- [ ] Verify red; implement; verify green.
- [ ] Commit `feat: add six frontier bosses`.

### Task 7: Integrate combat modules into fixed-step simulation
**Files:** Modify `src/game/simulation.ts`, frontier prepared-battle state; test `tests/frontier-combat-integration.test.ts`.
**Interfaces:** Game consumes PreparedFrontierBattle and typed skill/target actions.
- [ ] Write integration tests for all 60 objective win/loss fixtures and rejection-without-mutation.
- [ ] Verify red; wire modules without Phaser/DOM dependencies.
- [ ] Run focused tests, `npm test`, `npm run build`.
- [ ] Commit `feat: integrate frontier combat simulation`.

### Task 8: Deterministic balance matrix
**Files:** Create `scripts/simulate-frontier.ts`; test catalogue policies in `tests/frontier-balance.test.ts`.
**Interfaces:** deterministic policy runner over mission × era × timeline.
- [ ] Add guaranteed-roster winning policies without direct victory mutation.
- [ ] Execute 48 main missions × six eras × timelines 1/2/10 = 864 combinations and record failures.
- [ ] Tune authored numbers only with evidence; rerun until the accepted matrix is green or document specific blockers.
- [ ] Commit `test: verify frontier campaign balance matrix`.
