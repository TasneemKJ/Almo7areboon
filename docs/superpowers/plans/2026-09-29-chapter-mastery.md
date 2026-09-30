# Chapter Mastery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give six chapters earned-once mastery rewards and preserve forward progress through evolution, rematches, reloads, and safe saves.

**Architecture:** Pure mastery helpers own objectives, bounded records, reward calculations, and advancement availability. The fixed-step simulation settles outcomes synchronously; existing DOM surfaces consume the same helpers and route every mutation/persistence request through the production save-session guard. Task 2 consumes Task 1's exact contracts below.

**Tech Stack:** TypeScript, Phaser 3, Node 22 type-stripping tests, Vite, existing Playwright browser/CI infrastructure; no new dependency.

**Spec:** `docs/superpowers/specs/2026-09-29-chapter-mastery.md`

## Global Constraints

- Implement after the tactical encounters/specialties PR and the production save-session guard are integrated. Read their current files and `docs/superpowers/specs/2026-09-30-save-session-conflicts.md` before editing overlapping code.
- Keep the existing battlefield, result dialog, battle picker, evolution screen, coins, gems, cards, and controls. Add no screen, persistent panel, currency, daily gate, streak, or mandatory mastery requirement.
- This PR must not duplicate wave definitions, change traits, or require manual lanes or new combat controls.
- Keep exactly six mastery records for the current timeline; use schema version 3 while retaining version-1/2 migration and future-version protection.
- Rewards per chapter scale `S = 8 ** enemyAge`: Clear `150*S` coins/20 gems; Gate Unbroken `50*S`/15; third seal `100*S`/15. No card multiplier on mastery rewards. Normal rewards, prices, summon odds, and quests stay unchanged.
- Use simulation time and successful public actions. Outcome acceptance traces must not fabricate HP, statistics, wins, or currency; crafted inputs are allowed for isolated validation/boundary unit tests only.
- The 345.7-second economic projection is historical pre-tactical evidence. Rerun the campaign on merged code; the reported tactical opening earns 260 normal coins, not a promised 323.
- Root owns integration, commits, independent reviews, PR, and merge. Task agents do not commit or request another approval round.

## Review Focus

- A save conflict arriving during result/evolution handling must retain the recovery dialog and forbid stale writes, including pending-win and pagehide saves. Task 1 tests guarded persistence; Task 2 tests the actual recovery/UI priority.
- Valid paid masks must survive independently corrupt best-time/best-damage values and repeated migration/export/import. Task 1 pins the ledger invariants.
- A legacy pending win has no Clear bit: preserve Continue through evolution/reload and reject optional retry, except the terminal return route. Tasks 1 and 2 exercise both simulation and reachable controls.
- A lost final rematch reloads as ready: its current-timeline Clear must still enable Next Timeline, while an older selected chapter must not relock the frontier. Tasks 1 and 2 test both routes.
- Delayed tactical spawns, duplicate/disabled inputs, pause, and 2× speed must not invent skill targets or repeat settlement. Task 1 tests authoritative counts/time; Task 2 tests controls and modal isolation.

---

### Task 1: Pure mastery, saved progression, settlement, and economy traces

**Files:** Create `src/game/mastery.ts`, `tests/mastery.test.ts`, `tests/mastery-campaign.test.ts`, `scripts/simulate-mastery.ts`, and `docs/chapter-mastery-balance.md`. Modify `src/game/types.ts`, `src/game/statistics.ts`, `src/game/save.ts`, `src/game/simulation.ts`, and affected fixtures/assertions in `tests/game.test.ts`, `tests/progression.test.ts`, `tests/recovery.test.ts`, and `tests/robustness.test.ts`. Extend the production guard's `tests/save-session.test.ts` only for schema-3/mastery interoperability; do not redesign its protocol.

**Consumes:** Existing `Game.dispatch(action:Action):boolean`, `Game.step(dt:number):void`, `Game.waveStatus():WaveStatus`, and tactical `WaveStatus.preview`, `pendingEnemies`, and `cleared`. Use the merged encounter schedule and role-hit resolution without editing them. The production guard exports `SaveSession.check():boolean`, `save(profile:Profile):{ok:boolean;reason:null|'inactive'|'conflict'|'unavailable'|'unsupported'|'write-failed'}`, and `status`; only `active` and explicit `temporary` are playable. Temporary `save` performs zero writes. `restoreBackupWithSave(current:Game,candidate:Profile,commit:(profile:Profile)=>boolean)` is the guarded import seam. Simulation/mastery helpers perform no storage writes.

**Produces in `types.ts`:** `ChapterMasteryRecord = {earnedMask:number;bestSeconds:number|null;bestGateDamage:number|null}`, `MasteryProgress = {timeline:number;chapters:[ChapterMasteryRecord,ChapterMasteryRecord,ChapterMasteryRecord,ChapterMasteryRecord,ChapterMasteryRecord,ChapterMasteryRecord]}`, required `Profile.mastery`, and `Profile.version:3`. Add `gateDamageTaken:number`, `deployedByKind:[number,number,number]`, `maxFreezeTargets:number`, and `meteorKills:number` to `BattleStats`. Make `PendingVictory` its existing receipt fields intersected with this exact discriminator:

```ts
type VictorySettlement =
  | { settlement: 'legacy' }
  | { settlement: 'mastery-v1'; eligibleMask: number; newMask: number;
      masteryCoins: number; masteryGems: number };
```

**Produces from `mastery.ts`:** These names/signatures are the shared contract; later UI code must not guess alternatives.

```ts
interface MasteryAward {
  record: ChapterMasteryRecord; eligibleMask: number; newMask: number;
  coins: number; gems: number; // actual credits after existing wallet caps
}
interface ChapterMasteryView {
  record: ChapterMasteryRecord; thirdTitle: string; thirdRequirement: string;
  remainingCoins: number; remainingGems: number; // fixed advertised budget
}
interface ObjectiveProgress {
  value: number; target: number; comparison: 'at-most' | 'at-least';
  unit: 'seconds' | 'roles' | 'skills' | 'enemies' | 'deployments';
}
interface AdvanceStatus {
  allowed: boolean; reason: 'available' | 'running' | 'uncleared' | 'complete' | 'invalid';
  target: 'battle' | 'timeline' | 'none'; nextBattle: number | null;
}
function createMastery(timeline: number): MasteryProgress;
function normalizeMastery(value: unknown, timeline: number): MasteryProgress;
function masteryEligibleMask(chapter: number, state: BattleState): number;
function masteryReward(chapter: number, mask: number): { coins: number; gems: number };
function masteryAward(profile: Profile, state: BattleState): MasteryAward;
function chapterMastery(profile: Profile, chapter: number): ChapterMasteryView;
function masteryObjectiveProgress(chapter: number, state: BattleState): ObjectiveProgress;
function advanceStatus(profile: Profile, state: Pick<BattleState, 'phase'>): AdvanceStatus;
function canRetry(profile: Profile, state: Pick<BattleState, 'phase'>): boolean;
```

All helpers are pure and return detached records. Eligibility requires `won`; award calculations never mutate wallets or records. `masteryAward` is called after ordinary victory credits, so returned credits respect remaining capacity. Invalid chapter/reward-mask inputs produce zero reward/eligibility; `advanceStatus` rejects invalid selected chapter/timeline, returns `none/null` when blocked, and otherwise reports adjacent chapter or timeline/zero. `canRetry` permits losses and won-with-Clear, rejects ready/running and legacy won-without-Clear, and permits the won final/timeline-1000 terminal exception. Empty or wrong-timeline mastery never proves Clear.

- [ ] **Step 1: Write pure RED tests.** In `tests/mastery.test.ts`, pin the six third criteria to `<=75s`, all three successful roles, `<=1` successful skill, `>=3` freeze targets, `>=3` meteor kills, and `<=18` deployments. Check inclusive boundaries and won-only eligibility; Clear=1, gate=2 only at exactly zero actual gate damage, third=4. Assert `masteryReward(0,7)={coins:300,gems:50}`, `masteryReward(5,7)={coins:9830400,gems:50}`, masked repeat credits zero, one newly satisfied bit credits only its reward, capped wallets record actual credits, card coin bonuses do not multiply mastery, and inputs remain unchanged. Pin `advanceStatus`/`canRetry` for each phase, paused running, selected older chapter, final cap, wrong timeline, and legacy exception. Run `node --experimental-strip-types --test tests/mastery.test.ts`; require failure on the missing exports.
- [ ] **Step 2: Implement the pure contract and schema types.** Add the six definitions/titles/instructions from the spec. Implement fixed reward sums, current-timeline lookup, objective progress, masks, bests, and shared action availability. For allowed next, ordinary `nextBattle=enemyAge+1`; final `target='timeline',nextBattle=0`. Timeline 1000/final returns `complete`. Keep fixed stats/objective counters separate from trait-event metadata.
- [ ] **Step 3: Add migration/guard RED tests.** Cover v1 card mapping, v2 empty mastery, six-record bounds, legacy pending receipts, invalid optional settlement, future primary/backup protection, and export/import round trips. Assert `{earnedMask:7,bestSeconds:'bad',bestGateDamage:12}` retains mask 7 and damage 12 while time becomes null; independently corrupt the other field and test partial mask 3. Save/reload then real replay must never repay valid old bits. Through `SaveSession.save`/guarded import, verify schema-3 records and receipts persist together; a conflict preserves both stored byte strings and temporary play writes neither key. Run `node --experimental-strip-types --test tests/mastery.test.ts tests/recovery.test.ts tests/save-session.test.ts`; record the expected failing cases.
- [ ] **Step 4: Implement serialization and stat normalization.** Update `defaultProfile`, `decodeSave`, validation, and `battleStats` without changing keys, backup order, size limits, guard protocol, or legacy card mapping. Normalize each descriptive best independently from a valid paid mask; missing counters display as safe defaults, never trigger retroactive evaluation. New receipts use `mastery-v1`; old or invalid optional receipt metadata becomes legacy display data without clearing a valid ledger. Keep the guarded import seam intact. Run Step 3 to GREEN.
- [ ] **Step 5: Add simulation RED regressions and integrate authoritative settlement.** Increment the four counters only at successful spawn, actual gate damage, successful freeze over currently living enemies, and meteor death resolution. Scheduled future arrivals never count toward the freeze snapshot. At the real win transition apply `masteryAward`, update the record/wallet/earned receipt synchronously, and set `furthestBattle=max(old,min(5,enemyAge+1))` before publication/save. Preserve the settled won receipt across evolution using side-effect-free reconstruction; retain enemyAge/furthest/mastery. Route `next` and `retry` through the shared helpers. Cleared ready/lost continuation creates no win/reward; final next pays only the existing 100-gem timeline bonus once and replaces six records. Run `node --experimental-strip-types --test tests/mastery.test.ts tests/game.test.ts tests/progression.test.ts tests/recovery.test.ts tests/encounters.test.ts` to GREEN.
- [ ] **Step 6: Prove real action paths.** `tests/mastery-campaign.test.ts` must earn each seal through deployments/skills and normal battle resolution. Include first win→retry→real loss→next and the separate loss→save/reload→ready→next path for ordinary/final chapters; assert access retained, losses remain truthful, no duplicate wins/mastery, and one final reset. Replay an older chapter with a farther frontier; next advances one chapter without relocking it. Test legacy Continue-first through evolution/reload, terminal legacy retry exception, and next rejection while running/paused. Compare equivalent simulation-time action scripts at different frame partitions and 1×/2× pacing, and repeated rejected skill/spawn/next calls. Prepared profiles may represent lawful purchases; outcomes cannot be forced.
- [ ] **Step 7: Produce first-timeline economy evidence.** Add `scripts/simulate-mastery.ts`, using public actions and tactical `waveStatus` for immediate, reserve-and-counter, and mixed policies. Start a full trace from `defaultProfile`; report policy/action timing, attempt/outcome/time, selected/army age, starting/ending wallets, purchases, newly earned bits/credits, cards, and evolution/next transitions. Include a viable common-only deterministic collection path and post-evolution purchase timing. Run `node --experimental-strip-types scripts/simulate-mastery.ts`; record revision, command, and results in `docs/chapter-mastery-balance.md`. Assess the approximate 6–12 minute target, useful first-victory purchase, and purchase within one retained-opponent victory or two representative losses. Record faster natural play honestly; do not add waiting to hit a time floor. If a requirement fails, report/tune only authorized reward constants or third thresholds with evidence; do not fabricate traces or silently weaken tests.
- [ ] **Step 8: Verify and hand off the producer contract.** Run `npm test` and `npm run build`; require GREEN, including unchanged tactical/guard gates. Summarize exact exports, migrations, real campaign evidence, and any pacing discrepancy. Root obtains independent review and checkpoints Task 1 before UI integration; no agent commit.

### Task 2: Existing-screen mastery, reachable progression routes, and browser flows

**Files:** Create `src/ui/mastery-presentation.ts`, `tests/mastery-interface.test.ts`, and `scripts/capture-mastery-review.mjs`. Modify `src/ui/results-screen.ts`, `src/ui/progression-screen.ts`, `src/ui/evolution-screen.ts`, `src/ui/battle-hud.ts`, `src/main.ts`, and `src/ui/continuation.css` only where existing layout needs seal/action styling. Update `package.json` and `.github/workflows/verify.yml` for a required `review:mastery` gate and artifact upload, preserving existing test/build/browser/layering/save-session gates. Update `docs/VERIFICATION.md` with actual commands/results.

**Consumes:** Task 1's exact `chapterMastery`, `masteryObjectiveProgress`, `advanceStatus`, `canRetry`, and discriminated pending receipt. Existing `resultsHtml(profile,state)`, `battleSelectionHtml(profile,state)`, `evolutionDialogHtml(profile,state)`, `evolutionScreenHtml(profile,state)`, and tactical `battleGuidance(profile,state,preview?)` remain compatible. Use `chapterPresentation` for names/art. Use the integrated main `action` path (checks `SaveSession.check` before dispatch) and `persist` path (`SaveSession.save`); do not call `saveProfile`, bypass the guard with direct dispatch, or add another writer/session wrapper. Recovery dialogs take priority over automatic **and explicit** result opening; only active/temporary status permits playable result routes.

**Produces from `mastery-presentation.ts`:** `masteryMarksHtml(profile:Profile,chapter:number):string`, `masteryAttemptText(profile:Profile,state:BattleState):string`, and `masteryAdvice(profile:Profile,state:BattleState):string`. These pure presentation helpers consume Task 1 outputs; they grant nothing. Marks use labeled shapes/checks as well as color. Attempt text shows the actual third-objective measure; legacy results describe future opportunities without treating missing counters as earned evidence. Advice chooses one supported fact in spec priority, not a universal food-upgrade recommendation.

- [ ] **Step 1: Write UI RED tests.** Assert three accessible marks and remaining rewards; an exact settled-credit breakdown with no double-counted earned coins; truthful Regroup plus Continue for a cleared loss; no Continue for an uncleared loss; ready selected-clear picker footer using `advanceStatus`; final reset copy and cap absence of Next Timeline. Assert **Replay** when mask=7 versus **Try for remaining seals** when Clear exists and some bits are absent. Legacy no-Clear results offer Continue but no optional retry. Pin Evolve's current cost/prerequisite/disabled affordability and existing no-battle-reset copy. Test concrete unused-food, absent-frontline, unused-skill, available-unlock, and objective advice conditions. Run `node --experimental-strip-types --test tests/mastery-interface.test.ts tests/interface.test.ts`; require RED.
- [ ] **Step 2: Implement the existing-surface presentation.** Add the pure helpers, result seals/breakdown/actions, selected chapter's picker continuation footer, and correct evolution/timeline copy. Reuse `advanceStatus`/`canRetry`; do not separately infer permission from phase, personal bests, or pending receipt alone. Preserve the tactical guidance/preview API and urgent threat priority. Keep each chapter row a selection button; continuation is a separate footer button, never a nested button. Run Step 1 to GREEN.
- [ ] **Step 3: Implement explicit guarded modal routes in `main.ts`.** A won-result Evolve action replaces the result with the existing confirmation and remembers that UI return context. Cancel, close, and Escape reopen the result explicitly; successful guarded evolution refreshes and explicitly opens it, regardless of `resultShown`. Recompute cost/affordability after evolution; rejected affordability keeps a working confirmation/return route. If the save-session guard blocks/conflicts, retain its recovery dialog instead of reopening the result or closing isolation. Continue/retry/picker continuation use central `action` only. At final/timeline1000, Return to chapters and terminal Escape dispatch permitted retry, close to real ready, and open the normal picker; picker close/Escape restores usable navigation. No fabricated won state, direct profile mutation, or new persistent route flag.
- [ ] **Step 4: Add real browser progression checks.** Create the focused script with the existing bounded preview startup/Chromium/error/finally-cleanup pattern and no production test globals. Build seed saves through Task 1's real-action simulation before browser startup; drive all UI flows with real clicks/keys afterward. At 320×568 and 390×844 run win→Evolve→cancel/close/Escape and confirm→updated result→Continue; successful and insufficient funds; won→retry→loss→reload→ready picker→Continue for ordinary/final chapters; older replay retaining furthest; legacy Continue-first; and new/legacy cap1000 Return to chapters/Escape. Inspect saved masks/wallets/counts and DOM labels, not screenshots alone. Seeding historical profiles is permitted, but do not force a live browser outcome or mutate its Game.
- [ ] **Step 5: Cover guarded lifecycle and input precedence.** In a shared Playwright context, use the production save-session recovery flow to verify a blocked/stale tab cannot trigger mastery/evolution/next or overwrite credits; an injected foreign storage change must leave recovery on top even when a result-return handler would otherwise run. Reacquire and reload the authoritative settled receipt without repaying. Explicit temporary play may advance in memory but leaves both save keys unchanged. Check rapid/double activation, disabled and legacy retry, Escape context, focus trap/restoration, paused controls, and keyboard input isolation. Do not duplicate the guard's general ownership implementation or weaken its tests.
- [ ] **Step 6: Add the required gate and inspect the rendered flows.** Define `review:mastery` as `node --experimental-strip-types scripts/capture-mastery-review.mjs`; write screenshots and machine-readable checks under `artifacts/browser-review/mastery/`. Add its required verdict/artifact handling to `verify.yml` without replacing existing gates. Run `npm test`, `npm run build`, `npm run review:mastery`, `npm run review:browser`, and `npm run review:save-sessions`; use established CI browser execution if local Chromium is unavailable and report that boundary. Inspect narrow result/picker/evolution layouts, readable painted seal states, focus targets, and reduced motion; assert no horizontal overflow, hidden actions, runtime errors, or missing-art fallback.
- [ ] **Step 7: Coordinator handoff.** Supply passing commands, real progression/reward traces, screenshot paths, save-session compatibility evidence, and any remaining limitation. Root performs whole-branch review, commits, PR, required checks, and merge under the existing authorization. Do not describe the work as bug-free or production-ready solely because unit tests pass.

## Self-review

Task 1 owns every saved field, authoritative metric, reward/progression permission, migration, and quantitative economy trace. Task 2 owns only presentation, reachable routes, guarded central integration, and real browser coverage. The UI uses the exact exported shared helpers, including ready-state continuation; all five Review Focus items have named owning steps. Legacy and terminal exceptions, independent paid-mask sanitization, tactical delayed arrivals, and production save-session priority are covered without adding a third implementation task or a second persistence path.
