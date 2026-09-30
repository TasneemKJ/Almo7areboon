# Tactical Encounters

Status: authorized for implementation and the normal review/PR/merge workflow. The user explicitly authorized continued work without additional design-approval pauses. This PR precedes a separate economy/mastery PR.

## Goal and evidence

Make players read incoming formations and choose deployment timing and composition using the existing three troop buttons. Retain six ages, three units per age, automatic movement, the three existing skills, and the cute, slightly creepy, chubby Levantine direction.

The current simulation uses the same five waves in every age. A read-only public-action probe at timeline 1, matching player/enemy age, no cards or upgrades, produced these baselines:

| Policy | First Fires | Age index 2 | Age indices 3 / 4 / 5 |
| --- | --- | --- | --- |
| Deploy melee immediately whenever affordable | Win, 118.8s | Loss, 92.5s | Loss, 85.0s each |
| Wait 10s, then deploy melee whenever affordable | Win, 56.1s | Win, 100.0s | Win, 160.0s each |
| Wait 10s, repeat heavy/ranged/melee/ranged | Win, 64.0s | Win, 65.2s | Win, 50.7s each; eight deployments, full base HP |

## Global constraints

- Keep exactly six ages and three unit kinds: melee `0`, ranged `1`, heavy `2`.
- Keep automatic lanes and movement; add no manual targeting, lane selection, menu, panel, or combat input.
- Preserve touch deployment, keyboard `1/2/3`, skills `Q/W/E`, pause, and current input isolation.
- Do not change save schemas, currencies, reward formulas, card bonuses, prices, unlock rules, or progression in this PR.
- Start with guard reduction `0.25`, pierce bonus `0.35`, sweep fraction `0.40`, and sweep radius `32` world units.
- Change encounter tuning or trait values only with recorded before/after public-action balance evidence and the reason for the change.
- Use the existing fixed simulation clock and deterministic ordering; no random encounters, wall-clock combat state, or adaptive difficulty.
- Keep normal combat readable at 320px and 390px without an additional persistent HUD surface.

## Authored encounters

Select encounters by `profile.enemyAge`, independently of the player's age and unlocks. Each chapter has five waves. A wave launches at its absolute battle time; members arrive at that time plus their individual delay. `M`, `R`, and `H` mean unit kinds `0`, `1`, and `2`; `@n` means a delay of `n` seconds, otherwise zero. The table is the exact initial schedule, subject only to evidence-backed tuning. Intent applies no hidden buff. Early victory cancels pending arrivals. First Fires reduces ten enemies to eight; later chapters stay near ten. Record changed kill earnings without changing reward math.

| Enemy age / chapter | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 | Enemies |
| --- | --- | --- | --- | --- | --- | --- |
| 0 First Fires | 3s Rush: M | 14s Rush: M, M@0.4 | 24s Volley: M, R@1.2 | 38s Rush: M, M@0.6 | 52s Bulwark: H | 8 |
| 1 Olive Terraces | 4s Rush: M | 15s Rush: M, M@0.6 | 27s Volley: M, R@1.4 | 41s Volley: M, R@1.2, R@2.4 | 56s Bulwark: H, M@1.0 | 10 |
| 2 Harbor Watch | 3s Rush: M | 13s Rush: M, M@0.5, M@1.0 | 26s Bulwark: H, M@1.2 | 40s Rush: M, M@0.4 | 54s Volley: R, R@1.4 | 10 |
| 3 Lantern Quarter | 4s Rush: M | 16s Volley: M, R@1.4 | 28s Volley: M, R@1.2, R@2.4 | 42s Bulwark: H, R@1.2 | 57s Rush: M, M@0.5 | 10 |
| 4 Hillside Watch | 3s Rush: M | 14s Rush: M, M@1.2 | 28s Volley: R, R@1.0 | 43s Volley: M, R@0.5, R@1.0 | 58s Bulwark: H, R@1.4 | 10 |
| 5 Courtyards Beyond | 4s Rush: M, M@0.5, M@1.0 | 15s Rush: M | 29s Volley: M, R@1.2, R@2.4 | 44s Bulwark: H, R@1.2 | 60s Bulwark: H, M@1.0 | 11 |

## Pure encounter and preview interfaces

Create `src/game/encounters.ts`, exporting these readonly contracts:

```ts
export type WaveIntent = 'rush' | 'volley' | 'bulwark';
export interface WaveMember { readonly kind: UnitKind; readonly delay: number; }
export interface EncounterWave { readonly time: number; readonly intent: WaveIntent; readonly members: readonly WaveMember[]; }
export interface Encounter { readonly age: number; readonly waves: readonly EncounterWave[]; }
export interface ScheduledSpawn { readonly time: number; readonly waveIndex: number; readonly memberIndex: number; readonly kind: UnitKind; }
export interface WavePreview { readonly number: number; readonly total: number; readonly intent: WaveIntent; readonly counts: readonly [number, number, number]; readonly nextIn: number; }
export interface WaveStatus {
  readonly spawned: number; readonly total: number; readonly nextIn: number | null;
  readonly enemiesRemaining: number; readonly pendingEnemies: number;
  readonly cleared: boolean; readonly preview: WavePreview | null;
}
export function encounterForAge(age: number): Encounter;
export function scheduledSpawns(encounter: Encounter): readonly ScheduledSpawn[];
export function wavePreview(encounter: Encounter, time: number, wavesLaunched: number): WavePreview | null;
```

`encounterForAge` returns age zero for anything other than an integer in `0..5`. `scheduledSpawns` sorts by absolute time, then wave index, then member index. `wavePreview` returns the next unlaunched wave; its counts include every member of that wave, `number` is one-based, and `nextIn` is nonnegative. Invalid time is treated as zero; invalid launched count is treated as zero, and finite counts are floored and clamped to `0..waves.length`. Inputs and returned encounter tables are never mutated.

`Game.waveStatus(): WaveStatus` retains existing fields and adds `preview` and `pendingEnemies`. The latter counts unattempted members of already launched waves, excluding members of future waves. `state.wave` counts nominal launches, not member arrivals. `cleared` requires all five waves launched, every scheduled spawn attempted, and no living enemy. The renderer must not announce clearance while a delayed final member is pending.

The simulation owns a battle-only encounter, flattened schedule, and next-spawn cursor. Each fixed tick consumes all due launches and member arrivals before unit actions. A spawn rejected by the existing capacity limit is consumed once, matching existing finite-wave behavior. Retry/next/evolve/select-battle rebuild this state. Pause freezes it; freeze stops enemy action but does not postpone scheduled arrivals. Existing pending-victory reconstruction still reports a completed battle with no pending arrivals.

## Automatic troop specialties

Create `src/game/role-traits.ts`. Preserve nearest-target selection, body spacing, troop definitions, and normal primary-attack timing.

```ts
export type CombatTrait = 'guard' | 'pierce' | 'sweep';
export interface TraitHit { readonly damage: number; readonly trait?: CombatTrait; }
export const ROLE_TRAITS: Readonly<{ guardReduction: number; pierceBonus: number; sweepFraction: number; sweepRadius: number }>;
export function resolveRoleHit(attacker: UnitKind, defender: UnitKind, damage: number, secondary?: boolean): TraitHit;
export function sweepTarget(source: Unit, primary: Unit, candidates: readonly Unit[]): Unit | null;
```

- **Guard:** ranged-kind (`1`) primary attacks against melee-kind (`0`) deal `damage * 0.75`, marked `guard`. This identifies troop kinds, not projectile artwork: cannon shots do not become ranged-kind attacks.
- **Pierce:** ranged-kind (`1`) primary attacks against heavy-kind (`2`) deal `damage * 1.35`, marked `pierce`.
- **Sweep:** after a heavy-kind (`2`) primary attack against a unit, one other living enemy within `32` of that primary receives `originalPoweredDamage * 0.40`, marked `sweep`. Use `hypot(dx, laneDifference * 10)`, inclusive radius, nearest then lowest ID. Source and primary are excluded. The secondary may lie outside the attacker's primary range. The primary may have died; its resolved position remains the splash center. Sweep cannot recurse or hit bases.
- All other primary unit hits return unchanged damage and no trait. A secondary call applies sweep only for a heavy attacker; it does not combine guard/pierce. Nonfinite or nonpositive input damage resolves to zero with no trait.
- Specialties are symmetric for both armies and identical across ages. Card/timeline power is applied once before specialty resolution. `hurt` still caps actual damage to remaining HP, accounts statistics, and grants death rewards exactly once.
- Skills and base attacks bypass specialty resolution. Base damage earnings therefore retain their existing arithmetic.

Add optional `trait?: CombatTrait` to `GameEvent`. Only resolved unit `hit` events carry it; their `amount` remains actual damage after HP clamping. A sweep emits a separate hit event with its own target coordinates. Existing events without the field remain valid. No new field is required in `Unit`, `Profile`, or saved battle statistics.

## Existing HUD, teaching, and feedback

Extend `src/ui/battle-hud.ts` with `waveLabel(status: WaveStatus): string`; extend `battleGuidance(profile, state, preview?: WavePreview | null): string` without breaking its two-argument callers. Running labels use the existing chip: `VOLLEY 3/5 · 1M 2R · 8s` (omit zero counts, use `M/R/H`). Its accessible label expands role names; never announce every countdown tick through a live region. With no next wave, show `FINAL WAVE · N INCOMING` while delayed members remain, then the existing enemies-remaining/cleared messaging.

Extend each existing `.unit-role` line to `Melee · Guard`, `Ranged · Pierce`, or `Heavy · Sweep`; retain the role word first. Append the specialty's plain-language effect to the existing button accessible label/title. No hover is needed to understand the actionable hint.

Guidance priority remains ready/result/paused/base-danger, then a useful affordable opening action, food waiting, and the next-wave counter. On first deployment say `Deploy a melee warrior. Save some food for the next wave.` Do not tell a beginner that all immediate deployment is wrong. Counter guidance is conditional on unlocks:

- Rush with heavy unlocked: `A rush is coming. A heavy warrior can hit two enemies.`
- Volley: `Ranged enemies are coming. Melee guards take less damage from them.`
- Bulwark with ranged unlocked: `A heavy enemy is coming. Ranged troops deal extra damage to it.`
- Missing recommended unlock: `A stronger wave is coming. Save food and send melee warriors together.` Never make a locked troop the only offered answer.

Use current source/impact effect plumbing for short shield, piercing spark, and sweep accents. Add a pure `traitCueForHit(event: GameEvent): { trait: CombatTrait; x: number; lane: number } | null` in `src/view/combat-feedback.ts`; accept only positive resolved unit hits with finite coordinates and a recognized trait. The renderer consumes the event, never recalculates the trait. Suppress the ordinary projectile for secondary `sweep` hits so one cannon attack does not invent two source projectiles. Preserve source-lane sorting, base layering, Canvas/WebGL support, and existing effect pool bounds. Reduced motion uses a brief static accent, without camera shake or extra travel animation. Missing metadata is visually unchanged. Do not repaint assets or add floating explanation panels.

## Balance and completion gates

Implement `scripts/simulate-encounters.ts`, runnable with Node's existing type stripping. Emit JSON rows with age, timeline, upgrades, policy, outcome, time, surviving base HP, deployments, food spent, damage taken/dealt, waves launched, kills, and earnings. Include an evidence summary in `docs/tactical-encounters-balance.md`; record source revision, command, initial tuning, changed values, and before/after rows for every tuning change.

Matrix fixtures set matching player/enemy age, empty cards, timeline `1` and `3`, initial coins `1000 * eraEconomyScale(age)`, and otherwise default profiles. Use public unlock/upgrade actions before start; no outcome/state mutation during runs. Run each age at food/base levels `(0,0)` and `(2,2)`. Only the two melee policies leave ranged/heavy locked; other policies buy both unlocks. No midbattle purchases or skills in the main matrix. Every run uses `1/60` steps and a 180-second cap; attempt at most one deployment per tick.

| Policy | Start deployment | Desired kinds, repeating |
| --- | --- | --- |
| immediate-melee | 0s | `[0]` |
| banked-melee | after 10s | `[0]` |
| ranged-supported | after 10s | `[0,1,1]` |
| heavy-supported | after 10s | `[2,0,0]` |
| fixed-mixed | after 10s | `[2,1,0,1]` |
| threat-aware | 0s | Next preview Rush `[2,0,1]`, Volley `[0,0,2,1]`, Bulwark `[0,1,1]`; reset sequence only when preview wave number changes; after final preview use `[0,1,0]` |

Wait until the desired kind is affordable; advance a policy sequence only on successful deployment. These policies are reproducible probes, not claims about optimal play. Also run a no-deployment control at timeline 1 for every age/upgrade pair. Record all 144 main-matrix rows and 12 controls.

Required gates:

1. First Fires at timeline 1 with no upgrades/cards/skills: immediate melee and banked melee both win within 120s. Immediate play is at most 25% slower than banked play; the opening tutorial must not retain the measured twofold penalty.
2. Every same-age chapter at timeline 1 with only melee unlocked and food/base level 2 has a melee policy win within 180s. Locked counters never hard-gate normal progress. At least one mixed policy also wins every such chapter within 120s.
3. No-deployment controls lose, and no run crashes, creates invalid state, or exceeds declared capacities. Timeline 3 results are documented diagnostics, not a new no-upgrade win requirement.
4. The threat-aware policy must show a practical advantage over fixed-mixed in at least two later chapters at the same level-2/timeline-1 budget: win versus loss, or at least 10% faster, or at least 20% less total damage taken with completion no more than 10% slower. Record those concrete comparisons; tune encounter timing/composition first if this fails.
5. Trait unit tests prove the exact counter arithmetic independently of campaign balance. Do not replace deterministic assertions with a blanket requirement that every composition wins.

## Verification boundary

Simulation tests cover schedule/preview agreement, distinct schedules, exact delayed spawn times and stable ordering, last-member clearance, battle resets, restored victory, freeze/pause behavior, frame-chunk determinism, mixed player/enemy ages, invalid helper inputs, and capped spawn consumption. Trait tests cover exact values, inclusive radius, tie order, dead/friendly exclusions, clamped damage, one secondary only, no base/skill change, and exactly-once rewards. Replace the universal wait-ten-seconds campaign contract with the gates above; retain ordinary action validation.

Browser verification uses the production page and public controls. At 320x640 and 390x844, assert no horizontal overflow, readable upgrade labels without midword wrapping (fix the observed `Food / Productio / n` break), three specialty labels readable inside their cards, the existing wave chip inside the world bounds, no overlap with skills/pause, and unchanged troop hit targets of at least 44px. In separate equally seeded sessions, tapping/clicking a troop and pressing its number must each cause exactly one affordable deployment; disabled/locked state must not spend food or deploy, and keyboard shortcuts must remain ignored in menus, editable controls, and repeated keydown. Verify `Q/W/E` still operate the existing skills.

Capture First Fires opening, an incoming Volley, a Bulwark, and reduced-motion trait feedback. Assert no runtime errors or missing-art fallback. Use existing preview infrastructure and fixture conventions; do not add test-only simulation controls to the shipped page. A test-only fixture may supply deterministic resolved events to production rendering for repeatable feedback screenshots. Retain the existing layering suite to protect the recent artwork work.
