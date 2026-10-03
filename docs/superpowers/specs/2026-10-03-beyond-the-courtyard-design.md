# Beyond the Courtyard — expansion specification

**Status:** The campaign-and-tribes direction was approved on October 3, 2026. This written specification is submitted for review; gameplay implementation has not started.
**Repository baseline:** `TasneemKJ/Almo7areboon` at `720a818d27cffe9ab999369c1b392f98eb43ce28`.
**Scope:** A mobile-first, single-player, offline-capable expansion of the existing illustrated Phaser game, not a framework rewrite.
**Companion specifications:** [Content catalogue](2026-10-03-beyond-the-courtyard-content.md) · [Acceptance and release criteria](2026-10-03-beyond-the-courtyard-acceptance.md).

## 1. Player outcome and release contract

The player should have substantially more places to fight, opponents to understand, armies to recruit, and tactical combinations to learn, without a larger permanent combat interface. Progress should reward understanding a mechanic rather than repeatedly buying a higher number.

The full expansion contains exactly:

| Deliverable | Release target and counting rule |
|---|---|
| New regions | Six: Red Dunes, Reed Marshes, Cedar Pass, Basalt Foundries, Glass Oasis, Starfall Basin. |
| Additional authored missions | 60: eight main-path and two optional missions per region. Six boss finales are included in the 48 main-path missions. |
| Recruitable tribes | Eight new kits, including the initial Hearthguard kit. Existing original armies remain available in the original campaign. |
| Troop variants | 24: melee, ranged and heavy for each tribe. Three equipped deployment controls, not 24 buttons. |
| Selectable expansion skills | 12: three existing core skills, two existing captain mechanics adapted as explicit skills, seven genuinely new mechanics. |
| Relics | 12 optional passives; one equipped or none. |
| Compatibility | Existing supported saves, original campaign, Chronicle, collection, currencies, prestige and settings remain usable. |

Reskins, repeated browser executions, difficulty multipliers and existing Chronicle objectives do not count as new content. Every mission needs a distinct composition, objective sequence or tactical rule plus authored waves and a reviewed encounter brief.

Numbers in the catalogue are initial balancing values, not measured evidence of fun, solvability or performance. Changes to those values require updated balancing evidence; changes to counts, progression ownership or compatibility require a specification amendment.

## 2. Scope boundaries and explicit design choices

The original campaign remains a distinct **Original tale**. The new content is **Beyond the Courtyard**, reached through the existing battle/story selection surface. This distinction is visible, not another persistent bottom-navigation tab.

Original battles retain their current era armies, three core skill positions, captain substitution, tales, preparation, mastery and prestige rules. New tribe kits, custom skill slots and relics apply to expansion missions. This prevents the expansion from silently changing the established original balance or invalidating existing tests and saves. Extending loadouts into original missions is a later, separately scoped change.

New regions are independent of the six era indices. Era remains the player's existing 0–5 army/economy progression. A region is not a seventh era; an expansion mission is not another value of `enemyAge`. The existing six-element mastery and Chronicle records are not stretched or repurposed.

Retain TypeScript, Vite, Phaser and the DOM interface. No React migration, new backend, online account, multiplayer, seasonal economy, stamina, recruitment timers, new currency, procedural conquest or additional permanent combat panels are included.

All tribes are fictional communities in the game's world. Their identity comes from tactics, clothing, tools and silhouettes rather than claims about real ethnic groups.

## 3. Entry, progression and the ordinary play loop

Expansion entry unlocks after the first original road victory. Migration may recognize equivalent durable progress: original `furthestBattle >= 1`, `timeline > 1`, a validated original chapter-zero victory receipt, or the first chapter's road-clear bit. Arbitrary lifetime win counts are not sufficient proof. Existing users without such evidence can earn the opening victory normally.

The player may dismiss the expansion invitation and continue the original tale. No automatic mode switch, forced tutorial carousel or compulsory equipment screen is added.

The six region arcs unlock sequentially. Within each arc, main mission 01 leads through 08; the previous region's 08 unlocks the next region's 01. Optional c1 unlocks after its region's 04 and c2 after 08. Neither optional completion nor a relic is required for the main path.

The remembered mission and loadout produce this loop:

**Continue → optional loadout adjustment → battle → one result/reward sheet → continue or replay.**

An unfinished expansion battle is not serialized as a live simulation. A normal reload returns to that mission's ready state with persisted progress and no victory award. Existing original battle reload behavior is unchanged. A settled victory restores its result sheet; dismissing or reloading it never grants the award again.

Expansion clears, recruited tribes, discovered skills, relics and best-result records persist across prestige. Original coins, upgrades, army role locks and era progress reset exactly where the original prestige contract says they reset. A confirmed full “Start over” resets expansion progression too; cancellation changes neither mode.

## 4. Mission model and campaign content

Each authored mission has a stable ID, region ID, prerequisites, mission kind, objective sequence, opponent roster, ordered wave records, environment/asset references, boss definition when relevant, reward definition, accessible briefing and a deterministic acceptance fixture.

Canonical IDs are `frontier.<region-slug>.<01–08|c1|c2>`. Display names can change without changing IDs or granting rewards again. Reordering an array never changes unlock ownership.

Wave records specify time, lane, role, tribe, count and per-member delay. Conditional reinforcements use explicit one-shot objective triggers with finite spawn budgets. No unbounded respawn loop or input-reading counter-AI is permitted. At most two enemy tribe kits plus one boss art set are loaded in a mission.

Use existing siege, escort, hold, rescue, landmark and boss concepts where compatible. Add only the objective primitives required by the catalogue: sequenced landmarks, timed vulnerability, finite decoys, limited healing pulses and telegraphed siege volleys. Background artwork itself is not collision geometry. Narrow-pass behavior is an explicit formation/line-of-fire rule, not a promise of new free-path navigation.

Ordinary battles target 60–180 seconds of simulation time and bosses 120–240 seconds. At 300 seconds for ordinary missions or 480 for a boss, show a declared stalemate defeat with Retry and Leave; no invisible infinite stall. Pause and application suspension do not advance those timers.

Every main-path mission must be winnable using the guaranteed roster at its unlock point, zero random card bonuses, no relic and the original three skills. New unlocks offer alternatives; they are not undisclosed mandatory counters.

Boss warnings last at least two seconds at normal speed and one wall-clock second at 2×. Their icon, wind-up and counter rule must be visible without sound or color recognition. Invulnerable phases have a reachable counter, a bounded duration or both. Boss mechanics and guaranteed counters appear in the catalogue.

## 5. Recruitment, rosters and loadouts

The catalogue defines eight tribe passives and 24 role variants. Each recruited kit grants all three of its expansion roles; it does not alter the original campaign's `unlocked` tuple. Switching tribes is free in the ready state. Original role purchases remain original-only.

Each battle snapshots a single tribe, three distinct unlocked skill IDs, one unlocked relic or none, current era and applicable numeric bonuses. Mixing troops from several player tribes, changing equipment after Start, or editing the loadout from a result sheet is out of scope and must be rejected without mutation.

The default expansion loadout is Hearthguard / Freeze / Meteor / Food Drop / no relic. The previous choice is remembered. A newly earned option is shown on the result sheet but is never equipped automatically.

Use existing era role stats as the numeric basis. Tribe modifiers and role traits then alter behavior. Apply the same advertised tribe rules to enemy units when that tribe appears as an opponent; boss exceptions must be explicit. Identity is stored per unit, not inferred globally from the player's selected tribe.

Existing collection bonuses, food/base upgrades and legacy effects remain applicable numeric progression in expansion battles. Original Chronicle captain, tale, preparation and veteran modifiers do not additionally stack into the expansion. Their selections are retained and resume on return to the Original tale. The loadout panel explains this mode boundary.

For expansion enemies, use the current player era as the base stat family plus a fixed authored mission difficulty factor. Do not scale against the player's cards, recent losses, selected skills or individual taps. Freeze era and difficulty at battle preparation. Experienced original players may overpower early expansion fights; optional challenges can instead use an explicitly disclosed fixed kit. No hidden normalization.

## 6. Skill and status contracts

The combat surface contains three skill slots. Each equipped skill can be used once per battle. `Q`, `W`, `E` activate the three slots in order in expansion mode; the original key mapping is preserved in original mode.

Direct skills resolve in one tap. Volley, Snare Field, Decoy Banner and Ash Line enter targeting mode: a second tap chooses one of three broad world bands, or a labeled zone button chooses the same band. A visible Cancel action and Escape cancel without consumption. The zone choice spans all lanes; no tiny-unit hit target is required.

Targeting pauses simulation through its own pause reason, then restores the prior pause state. Closing a menu, changing orientation, backgrounding or losing save ownership cancels targeting. Slot selection alone does not consume a charge or persist a cast.

A cast validates phase, ownership, equipped ID, availability and target before mutation. Missing targets for instant damage, Sunder or healing produce feedback without consuming the skill. Valid zone placements may anticipate an enemy and therefore may target an empty band; casting Volley or Ash Line into that band still spends the charge. Duplicate taps after acceptance are rejected. Delayed callbacks cannot cast into a new battle.

Status effects use simulation time. One deterministic damage pipeline applies role rules, faction traits, temporary effects and relics; presentation consumes resulting events rather than calculating damage. Identical aura sources do not multiply: use the strongest applicable reduction/slow, with a 60% combined temporary damage-reduction cap and 60% movement-slow cap. A root is a separate short-duration movement stop, not an uncapped slow; bosses follow the explicit root-to-slow conversion. Actual invulnerability is reserved for declared boss phases.

Damage-over-time is not an attack for on-hit procs. Decoys do not count as deployed troops, kills, survivors, healing targets or economic rewards. No effect can resurrect dead units or refund itself. Pulls clamp to legal world bounds, cannot cross gates and do not move bosses. Targets and ties are deterministic by distance, then unit ID.

Food remains capped at 99. Expired effects, pending target selections and once-per-battle flags clear on retry. Manual pause, menus and hidden-page suspension freeze combat durations; visual reduced motion does not change effect duration or strength.

## 7. Rewards and replay economy

First-clear rewards, skill grants, recruitment and relic grants are permanent and keyed by stable mission ID. They are awarded once across all timelines, not once per prestige.

Initial tuning uses `F = 50 × 8^era`, the base food-upgrade price scale at the frozen battle era. An ordinary main clear adds `2F` first-clear coins and 5 gems; a boss adds `4F` and 25 gems; an optional challenge adds `2F` and 10 gems. Wallets use the existing validated caps. Values are frozen at Start and displayed in the briefing.

Repeatable expansion income is bounded separately: a total encounter budget of `0.4F`, with `0.2F` distributed across a finite set of real enemy reward tickets and `0.2F` for victory. Use integer coin allocation with deterministic remainders. Retreat retains only already-earned ticket coins. Failed missions do not award victory income. Boss adds and decoys cannot replenish that budget.

The expansion must not also run the original uncapped per-damage reward calculation. One settlement authority owns each accepted award. Original mission economy is unchanged. Replay cannot create duplicate recruitment, first-clear gems or relics; no reward is attached to opening a result sheet.

Lifetime original quest statistics may count real expansion deployments, enemy kills and accepted victories once; expansion clear records do not write original mastery seals, enemy chapter progress or Chronicle route masks. Optional challenge bonuses are explicit in their reward records rather than added invisibly.

## 8. Persistence and migration

Introduce outer profile schema version 6 while retaining the current storage keys and size ceiling. Keep migration support for versions 1–5 and the existing protective behavior for unsupported future versions.

New expansion state contains a content-schema version, bounded mission-result records, remembered selection/loadout and the expansion-entry flag. Unlock availability is derived from first-clear records and the catalogue, not duplicated in an independently mutable wallet or several unrelated arrays. First-clear coins and gems are settlement changes, not recomputed from catalogue lookup during load.

Separate mode selection from `age`, `enemyAge` and `furthestBattle`. Original `PendingVictory` records retain their validated legacy/mastery/Chronicle semantics. Add an explicit expansion receipt variant containing mission ID, attempt sequence, earned amounts, first-clear grant IDs and completion statistics. Legacy receipts must never be interpreted as expansion receipts.

Migration begins in memory under the existing save-session owner. It must not overwrite storage from a preview tab, temporary session, failed decode or unsupported schema. A normalized primary JSON write is the durable commit boundary; do not assume two localStorage keys form an atomic transaction. Preserve current primary-first backup semantics.

For a successful expansion settlement, wallet, first-clear record, unlock eligibility and receipt belong to one profile snapshot. Receipt restoration is presentation-only. Retrying clears the receipt without awarding it. A failed primary write leaves the prior durable save usable and reports unsaved progress; no promise of surviving a reload is made when storage rejects all writes.

Old original selections and valid pending victories survive migration unchanged in meaning. Missing expansion fields initialize to a locked/default state. Known malformed fields normalize within declared limits; a future expansion content-schema version is protected as unsupported rather than silently stripped. Adding catalogue IDs advances that content-schema version so an older build cannot silently discard newly earned content. Unknown IDs under a supported schema do not authorize rewards or equipment, and invalid loadouts fall back to the default valid loadout with feedback.

Import/export includes the full version-6 state. File-read races, owner loss, reset confirmation and primary/backup precedence remain governed by the existing session layer. Never add a second save owner.

## 9. Architecture and subsystem boundaries

This is three connected subprojects under one expansion specification, not a monolithic addition to `main.ts`.

| Subproject | Owns | Explicit boundary |
|---|---|---|
| A. Campaign/content and progress | Typed catalogues, prerequisite graph, mission preparation, objective sequence, reward records, save-v6 migration | Returns a validated immutable battle specification and a settlement result. No Phaser or DOM imports. |
| B. Tribes and combat effects | Roster resolution, deterministic effects, targeting rules, boss state and skill acceptance | Uses domain units, simulation time and events. Never writes storage or chooses screens. |
| C. Mobile presentation and assets | Campaign selector, compact loadout, three skill slots, aiming, scenery/tribe visuals, audio and pack readiness | Consumes domain projections. Never grants unlocks or calculates authoritative damage. |

Proposed focused modules live under `src/game/frontier/`, with declarative content beneath `src/game/frontier/content/`; corresponding DOM screens and renderer adapters remain under `src/ui/` and `src/view/`. These are proposed locations, not existing modules or scaffolding delivered by this PR.

Keep the existing fixed-step simulation and battlefield port. Extend their contracts deliberately with an explicit original/expansion battle discriminator and typed skill/target actions; do not overload old action strings with unrelated meanings. Distinguish core original skills from expansion skill IDs, and use explicit adapters for existing audio and HUD code.

New objectives use pure state transitions and serializable records. Inject deterministic content/seed only at the domain boundary. No gameplay decisions depend on animation callbacks, frame count, network arrival or DOM visibility. `main.ts` coordinates owners and screens but delegates new rules to the focused modules.

## 10. Mobile presentation and assets

Reuse the existing battle/story entry point. Region cards show the next mission, reward and one-line rule; completed missions expand only on request. The optional loadout sheet contains the tribe, three skills and one relic. No new persistent quest, recruitment or currency panel is allowed.

Keep three troop controls, three skill controls, existing pause/speed and compact objective feedback during combat. Ordinary interface actions need at least 44×44 CSS-pixel hit regions, readable names and keyboard focus. At 320px width, secondary controls may collapse; essential actions cannot overlap, clip or rely on hover.

Six region art packs need distinct landscape, foreground, landmark language and boss silhouette. Eight tribes need distinct silhouettes and three role portraits/sprite sets each. This is 24 tribe-role art sets, not 24 multiplied by six eras. Existing original art remains untouched. Region-relevant enemy art and the chosen player kit are loaded before Start.

Pack keys and hashes are stable and manifest-driven. Fetch only the shell, shared effects, active region and active rosters initially; do not preload every region. Optional “Keep this region offline” preparation checks every required asset. Never label a pack ready after only its JSON or service worker is available.

Missing/failed packs keep the current game playable and offer Retry or a previously ready mission. Cache updates retain a complete usable old pack until the new pack validates. Best-effort cache eviction cannot delete an in-use pack. No service-worker reset or unregister operation is allowed as a normal error-recovery shortcut.

Initial engineering budgets, to measure rather than claim achieved: no more than 1 MiB extra compressed bootstrap code/shared assets; no more than 4 MiB downloaded for a selected region and required rosters; no more than 64 MiB estimated additional decoded texture memory at a time. Individual atlases remain at or below 2048×2048. Retain existing unit/effect caps unless measurements justify a reviewed change; new zones are capped at eight and a player decoy at one.

Every status needs a non-color cue and reduced-motion equivalent. Telegraphs cannot disappear in reduced motion. Existing sound settings govern new audio. New effects must not intensify the known repeated-cycle WebKit blank-battlefield risk.

## 11. Integration, verification and delivery boundary

The content catalogue defines the playable scope; the acceptance specification defines what can be called shipped. Split eventual implementation into independently verifiable A/B/C changes and playable content batches, retaining one integration PR if desired. A data-only list of 60 mission names is not the expansion.

The first playable acceptance slice is Red Dunes 01–04 with the new mission selector, Hearthguard and Dune Runners, loadout plumbing, skill grants, save migration and region art. It is a milestone, not a reduction of the full 60-mission release target. Later slices fill the catalogue and regression matrix.

No automatic deep suite is introduced by this specification. Keep `Verify game` manual-only. Run fast appropriate tests during implementation; explicitly invoke deep browser/content acceptance at integration milestones. Record exact revisions, actual screenshots inspected, failed checks and untested hardware separately.

The previously observed WebKit blank battlefield and unverified WebKit offline navigation remain open risks unless reproduced, fixed and verified. This specification does not reclassify them as harmless or claim the engine is issue-free.

## 12. Repository grounding and review ledger

At the pinned baseline:
- `src/game/types.ts` defines three original skills, three roles and six-record mastery.
- `src/game/save.ts` defaults to version 5, accepts versions 1–5 and protects newer schemas; it preserves a 100,000-character bound.
- `src/game/simulation.ts` constructs encounters using `enemyAge`, normalizes Chronicle at new battle and owns rewards/actions.
- `src/game/chronicle.ts` owns seven route IDs, captain/tale selection, six-chapter masks and expedition progression.
- `src/game/chronicle-combat.ts` contains the existing shield/reveal captain mechanics and landmark/rally behavior.
- `src/ui/chapter-presentation.ts` owns the current six displayed chapters; `src/view/battlefield.ts` owns rendering, not save authority.

Review decisions resolved in this draft:
1. Regions and original eras are separate, avoiding six-index migration corruption.
2. Eight tribe kits are new expansion content; original armies are retained, not renamed and counted again.
3. Captain-derived skills are counted as adaptations, not seven-plus-two additional new inventions.
4. Essential unlocks are on the main path before their teaching missions; optional challenges never block recruitment.
5. Progress persists across prestige; one-time grants cannot be farmed by reset/replay.
6. Targeting, asset readiness and save ownership cannot consume input or progress after their owner disappears.
7. Existing gameplay and CI settings are unchanged by this documentation-only submission.

This is the written-design review stage. The implementation plan and product-code changes follow review of these documents; neither is claimed complete here.
