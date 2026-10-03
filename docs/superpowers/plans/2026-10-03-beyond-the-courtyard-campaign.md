# Beyond the Courtyard — Campaign and Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add the expansion content model, 60-mission campaign graph, version-6 persistence, battle preparation and atomic first-clear settlement without changing original campaign semantics.

**Architecture:** New pure TypeScript modules live under `src/game/frontier/`. Original `age/enemyAge/furthestBattle` remain six-era state; expansion progress uses stable content IDs and a discriminated battle mode. The simulation consumes validated immutable mission specifications; storage continues through the existing profile/save owner.

**Tech Stack:** TypeScript, Node test runner, Vite; no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-03-beyond-the-courtyard-design.md`, content catalogue, and acceptance criteria.

## Global Constraints
- Exactly 6 regions, 48 main missions including 6 bosses, 12 optional missions.
- Original tale, Chronicle, mastery, currencies, prestige and supported v1-v5 saves retain their meaning.
- Expansion unlocks after durable first-road-victory evidence; no random or optional gate for essential content.
- Stable IDs own clears/rewards; array order and display names never grant again.
- Profile v6 retains current storage keys, 100,000-character ceiling, primary-first backup behavior and future-schema protection.
- No Phaser/DOM imports in campaign/progress modules.
- No new currency, stamina, online service, or live-battle serialization.

## Review Focus
- Malformed/unknown mission IDs cannot unlock or reward content.
- v1-v5 pending victories survive v6 migration with identical original semantics.
- First-clear settlement is idempotent across reload, retry, double-tap and prestige.
- Interrupted expansion battles reload ready; settled results restore presentation without re-credit.
- Optional missions can never become prerequisites of the main path.

---

### Task 1: Typed frontier catalogue and validator
**Files:** Create `src/game/frontier/types.ts`, `src/game/frontier/content/regions.ts`, `missions.ts`, `rewards.ts`, `validate.ts`; test `tests/frontier-content.test.ts`.
**Interfaces:** Produces `RegionId`, `MissionId`, `FrontierMission`, `FrontierCatalogue`, `validateFrontierCatalogue(catalogue): ValidationResult`, `missionById(id)`.
- [ ] Write failing CT01–CT07 tests for exact counts, IDs, references, finite spawn budgets, acyclic/reachable graph and content-schema version.
- [ ] Run `node --experimental-strip-types --test tests/frontier-content.test.ts`; expect failures because modules do not exist.
- [ ] Implement the catalogue using all 60 canonical entries and reward/grant references from the approved content catalogue.
- [ ] Run the focused test; expect 0 failures.
- [ ] Commit `feat: add validated frontier campaign catalogue`.

### Task 2: Expansion progress and unlock derivation
**Files:** Create `src/game/frontier/progress.ts`; test `tests/frontier-progress.test.ts`.
**Interfaces:** Consumes Task 1 IDs. Produces `FrontierProgress`, `createFrontierProgress()`, `availableMissions(profile)`, `isTribeUnlocked`, `isSkillUnlocked`, `isRelicUnlocked`, `normalizeFrontierProgress`.
- [ ] Write tests for entry evidence, sequential regions, c1/c2 gates, all essential grants, prestige persistence and unknown-ID rejection.
- [ ] Verify red.
- [ ] Implement derived unlocks from clear records; do not duplicate unlock wallets.
- [ ] Verify green and commit `feat: add frontier progression graph`.

### Task 3: Profile v6 migration and compatibility
**Files:** Modify `src/game/types.ts`, `src/game/save.ts`; create `tests/save-v6-frontier.test.ts`.
**Interfaces:** Adds optional/normalized `frontier` state and discriminated expansion receipt while preserving original `PendingVictory`.
- [ ] Write SV01–SV04 tests with representative v1-v5 fixtures, future schemas, corrupt/oversized records, primary/backup failures and old pending victories.
- [ ] Verify red.
- [ ] Implement version 6 normalization/migration with supported content schema and default locked frontier state.
- [ ] Verify focused tests plus existing save/session tests.
- [ ] Commit `feat: migrate saves to frontier-aware v6`.

### Task 4: Mission preparation and immutable battle snapshot
**Files:** Create `src/game/frontier/prepare.ts`; modify `src/game/types.ts`; test `tests/frontier-prepare.test.ts`.
**Interfaces:** Produces `prepareFrontierBattle(profile, missionId, loadout): PreparedFrontierBattle | Rejection`; snapshot contains frozen era, difficulty, rewards, tribe, skills, relic and authored waves.
- [ ] Test locked/unknown missions, illegal loadouts, four/duplicate skills, locked equipment, and snapshot immutability.
- [ ] Verify red.
- [ ] Implement preparation without reading cards/taps after Start for difficulty.
- [ ] Verify green and commit `feat: prepare immutable frontier battles`.

### Task 5: Expansion settlement authority
**Files:** Create `src/game/frontier/settlement.ts`; modify profile receipt types; test `tests/frontier-settlement.test.ts`.
**Interfaces:** Produces `settleFrontierVictory(profile, result): SettlementResult` and receipt restore/consume helpers.
- [ ] Write DM10/SV05/SV09 tests for ticket budgets, first-clear rewards, caps, retreat, replay, double dispatch, reload and prestige.
- [ ] Verify red.
- [ ] Implement one accepted settlement snapshot keyed by mission/attempt; presentation restore never grants.
- [ ] Verify green and commit `feat: add idempotent frontier settlement`.

### Task 6: Integrate mode selection with Game without changing Original tale
**Files:** Modify `src/game/simulation.ts`, `src/game/types.ts`; test `tests/frontier-mode.test.ts` and existing original simulation tests.
**Interfaces:** Add explicit original/frontier battle discriminator and mission selection actions; original action behavior remains unchanged.
- [ ] Write tests for switching modes only while preparable, original-state preservation, frontier ready reload and no Chronicle/mastery writes from frontier.
- [ ] Verify red.
- [ ] Wire Tasks 1–5 into Game while keeping original encounter path intact.
- [ ] Run focused tests, then `npm test` and `npm run build`.
- [ ] Commit `feat: integrate frontier campaign mode`.
