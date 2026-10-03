# Beyond the Courtyard — content catalogue

**Status:** Written design for review, not shipped content. Parent contract: [Expansion specification](2026-10-03-beyond-the-courtyard-design.md).
**Counting:** 48 main-path missions, including six boss finales, plus 12 optional missions. Eight new tribe kits contain 24 named role variants. Twelve skills include seven new mechanics; 12 relics are optional.

## 1. Mission identifiers and unlock rules

Short codes below are human-readable aliases only. RD01 maps to `frontier.red-dunes.01`, RMc1 to `frontier.reed-marshes.c1`, and so on. The table's slug defines the canonical middle segment.

Within a region, mission 01 requires region entry; each subsequent main mission requires its predecessor. c1 requires 04 and c2 requires 08. The next region requires the previous region's 08. None of the optional missions, featured relics or adapted/new skills is an entry requirement.

All missions also award the bounded coins/gems defined by the parent specification. The final column lists additional first-clear grants. An em dash means no additional grant, not unspecified work. Titles and rules are encounter briefs; authored wave data, art and tested solutions must still be implemented before a mission is counted playable.

### Red Dunes — `red-dunes`

| Code | Mission | Objective | Opposition and tactical distinction | Additional first-clear grant |
|---|---|---|---|---|
| RD01 | The Open Road | Siege | Three staggered melee raids leave a safe opening for a defender and ranged support. | Opening lesson |
| RD02 | A Roof of Shields | Hold 60 seconds | Alternating front and rear-lane raids test preserving the gate rather than rushing it. | Skill: Stand Together |
| RD03 | The Water Mark | Capture, then siege | A single supply post delays the first ranged wave until captured; capture triggers it once. | Skill: Volley |
| RD04 | The Lost Guides | Rescue and return | A defended cage opens after four uninterrupted seconds; returning guides draw one finite pursuit wave. | Tribe: Dune Runners; relic: Hearth Token |
| RD05 | Flour Across the Flats | Escort | The cart crosses two checkpoints; each triggers one ambush, so releasing the whole company early exposes the escort. | — |
| RD06 | Footprints at Dusk | Siege | Fast reinforcements arrive behind a slow screen in alternating lanes; a visible pause in arrivals invites a timed push. | Skill: Snare Field |
| RD07 | The Split Caravan | Escort, then siege | Bring the cart to a midpoint shelter before the gate becomes attackable; a final flank wave tests reserve food. | — |
| RD08 | Rafiq's Last Charge | Commander and siege | Rafiq telegraphs a charge, becomes briefly exposed after it, and summons only two scheduled reinforcement groups. | Relic: Sand Compass; Reed Marshes entry |
| RDc1 | The Unbroken Flask | Escort challenge | A separately authored sparse escort starts with a half-health cart and grants no repair checkpoints; finish with at least half that starting health. | Optional; no essential unlock |
| RDc2 | Before the Third Horn | Timed siege challenge | Three escalating raid groups arrive at 20/45/75 seconds; defeat the gate before 100 seconds with the disclosed fixed starter kit. | Optional; no essential unlock |

### Reed Marshes — `reed-marshes`

| Code | Mission | Objective | Opposition and tactical distinction | Additional first-clear grant |
|---|---|---|---|---|
| RM01 | Banners in the Reeds | Siege | Enemy banner decoys show a distinct hollow emblem and grant no coins; the real ranged line emerges behind them. | — |
| RM02 | The Causeway Watch | Hold 70 seconds | Hidden ranged specialists reveal when attacking; mixed melee screens prevent blindly targeting the furthest threat. | — |
| RM03 | A Lamp on the Bank | Capture and rescue | Capturing the central lamp reveals the cage approach; ordinary attackers can also reveal nearby enemies through contact. | Skill: Borrowed Dawn |
| RM04 | The Ferry Keepers | Escort | Escort a ferry cart over a fixed causeway while Tidebound pulls separate front troops from support. | Tribe: Tidebound; relic: Reed Knot |
| RM05 | Three False Camps | Sequential landmarks | Capture three marked posts in order; only the current post activates, and each opens one finite wave. | — |
| RM06 | The Banner Exchange | Rescue | The scout's return triggers two decoy-led volleys; preserve a real defender rather than spending all food on targets without rewards. | Skill: Decoy Banner |
| RM07 | The Narrow Crossing | Siege | Two hooked ranged formations protect a heavy front; the tide rule changes their reinforcement lane, not unit pathfinding. | — |
| RM08 | Nahla of the Hollow Banner | Commander and siege | Nahla creates two finite decoys at each phase transition; visible emblem differences identify the real commander. | Tribe: Reedcloaks; relic: Ferry Bell; Cedar Pass entry |
| RMc1 | No Lost Footsteps | Rescue challenge | A fixed rescue roster has no healing or decoy skill; free the scout and return without losing a ranged troop. | Optional; no essential unlock |
| RMc2 | The Silent Ferry | Escort challenge | A new fixed schedule combines concealment and pulls; the escort must finish before the third pursuit group reaches the midpoint. | Optional; no essential unlock |

### Cedar Pass — `cedar-pass`

| Code | Mission | Objective | Opposition and tactical distinction | Additional first-clear grant |
|---|---|---|---|---|
| CP01 | The Low Branches | Siege | A slow shield wall advances ahead of ranged healers; healing is limited to three advertised pulses per healer. | — |
| CP02 | Snow at the Gate | Hold 80 seconds | Enemy groups arrive with recovery gaps; preserve wounded troops without relying on an equipped healing skill. | — |
| CP03 | Water Under Stone | Capture and siege | A central spring grants each side one healing pulse on first capture; later recapture does not regenerate that reward. | Skill: Mending Rain |
| CP04 | The Seed Cart | Escort | Move the cart between two shelters whose protection applies only while friendly troops hold the landmark. | Relic: Cedar Cup |
| CP05 | The Broken Footbridge | Rescue | Free the scout behind a heavy guard; a single final ranged group punishes an unsupported homeward retreat. | — |
| CP06 | The Foresters' Signal | Siege | Three short attack windows follow healing volleys; keeping a formation alive is more useful than buying continuous reinforcements. | Skill: War Drums |
| CP07 | A Line Above the Valley | Capture, then hold 45 seconds | The forward shelter is contested by alternating heavy and ranged formations; the hold timer advances only under friendly control. | — |
| CP08 | Mariam, Keeper of Roots | Commander and siege | Mariam's three healing reservoirs can be interrupted by sustained ordinary hits; depleted reservoirs never regenerate. | Tribe: Cedar Wardens; relic: Root Buckler; Basalt Foundries entry |
| CPc1 | The Patient Company | Siege challenge | Use a fixed zero-card roster against a healing screen, with a six-deployment limit and a different wave order. | Optional; no essential unlock |
| CPc2 | Winter Seed | Escort challenge | Protect a fragile seed cart through three finite attack pulses without casting Mending Rain; shelters remain the guaranteed counter. | Optional; no essential unlock |

### Basalt Foundries — `basalt-foundries`

| Code | Mission | Objective | Opposition and tactical distinction | Additional first-clear grant |
|---|---|---|---|---|
| BF01 | The Cooling Yard | Siege | Two armored fronts alternate; damage windows follow visible hammer wind-ups rather than a higher health-only encounter. | — |
| BF02 | The First Volley | Hold 75 seconds | A siege engine attacks a marked band after a three-second warning; reinforcement timing and shields mitigate the volley. | — |
| BF03 | The Rivet Line | Capture and siege | Taking a forward lever disables the gate's temporary guard for eight seconds; normal heavy attacks remain useful outside that window. | Skill: Sunder |
| BF04 | The Quenched Cart | Escort | Move coolant past two engine positions; reaching each checkpoint cancels one future volley, never an already resolved hit. | Relic: Basalt Wedge |
| BF05 | Hands from the Furnace | Rescue | A cage guard alternates armor and recovery; a ranged screen arrives once on release and must not be mistaken for another boss phase. | — |
| BF06 | The Ash Trench | Siege | Dense short-range formations and sparse ranged reinforcements create an explicit choice between burst and persistent area damage. | Skill: Ash Line |
| BF07 | Three Cooling Bells | Sequential landmarks and siege | Three finite lever stages change siege timing; the final gate becomes vulnerable only after all stages resolve. | — |
| BF08 | The Furnace Keeper | Commander and siege | A three-second volley warning is followed by a six-second cooling window; the engine has finite reinforcement tickets. | Tribe: Ashforged; relic: Forge Tongs; Glass Oasis entry |
| BFc1 | One Cold Opening | Siege challenge | A fixed kit must defeat a compact engine formation within two cooling windows; no random card power is needed. | Optional; no essential unlock |
| BFc2 | The Long Quench | Escort challenge | An extended cart route has no free shield skill and two independently scheduled volleys; checkpoint cancellation is the central counter. | Optional; no essential unlock |

### Glass Oasis — `glass-oasis`

| Code | Mission | Objective | Opposition and tactical distinction | Additional first-clear grant |
|---|---|---|---|---|
| GO01 | A Gate in Reflection | Capture and siege | A reachable central prism opens an eight-second gate-damage window; the first capture is uncontested to teach the rule. | — |
| GO02 | The Last Shade | Hold 90 seconds | Alternating concealed and armored waves demand preserving the gate; no prism capture is required. | — |
| GO03 | A Face in the Water | Rescue | One real cage and two visual false markers have explicit distinct glyphs; only the real cage accepts capture progress. | — |
| GO04 | Lanterns at Noon | Escort and capture | Escort lantern supplies to the prism, then hold it for four seconds; one finite concealed wave tests the reveal counter. | Tribe: Lantern Keepers; relic: Glass Lens |
| GO05 | The Wandering Reflection | Siege | The vulnerability post changes between two fixed sites on a visible timer; there is never more than one active target. | — |
| GO06 | An Unborrowed Light | Capture, then hold 40 seconds | The prism disables concealment while held, but normal contact still exposes attackers after control is lost. | — |
| GO07 | The Two Courtyards | Rescue, then siege | Return the scout to unlock the prism; defend against a final decoy-led wave before opening the gate. | — |
| GO08 | The Mirror Sentinel | Commander and siege | The sentinel's shield drops during prism ownership; four cumulative uncontested capture seconds grant a full damage window. | Relic: Oasis Thread; Starfall Basin entry |
| GOc1 | A Single Reflection | Siege challenge | A disclosed fixed kit uses only the original three skills and a relocated prism against a new ranged-first wave schedule. | Optional; no essential unlock |
| GOc2 | Light Without Fire | Escort challenge | Deliver a fragile lamp cart through concealment and shielded checkpoints without Meteor or Ash Line; reveal and normal attacks suffice. | Optional; no essential unlock |

### Starfall Basin — `starfall-basin`

| Code | Mission | Objective | Opposition and tactical distinction | Additional first-clear grant |
|---|---|---|---|---|
| SB01 | Stones That Remember | Siege | Marked ground slows movement but not attack timers; short and long-range formations alternate to teach leaving reserves. | — |
| SB02 | The Falling Watch | Hold 90 seconds | Telegraphed impact bands arrive between finite reinforcement waves; damage is never tied to frame rate or animation completion. | — |
| SB03 | The Last Wayfinder | Rescue | The scout returns through two slowing fields while a finite hunter group advances; defend the escort instead of pursuing its decoy. | — |
| SB04 | The Star Cart | Escort and capture | Deliver a marked cart, then capture the signal it carries; the final transition introduces friendly control marks. | Tribe: Starcallers; relic: Star Map |
| SB05 | Three Unquiet Stones | Sequential landmarks | Three posts combine reveal, healing suppression and gate vulnerability, one at a time, with distinct symbols and ordered counters. | — |
| SB06 | The Unlikely Company | Siege | One Tidebound ranged group and one Ashforged heavy group create formation disruption followed by a telegraphed attack window. | — |
| SB07 | The Road Home | Escort, rescue and siege | Three bounded phases reuse learned verbs; each grants a clear checkpoint cue but no health or currency reset exploit. | — |
| SB08 | The Last Cartographer | Three-phase commander and siege | At 70% and 35% health, the commander switches among charge, decoy and marked-volley rules; each transition has a safe telegraph. | Relic: Homeward Seal; campaign ending |
| SBc1 | The Measured Night | Hold challenge | A fixed no-relic kit defends for 120 seconds against an authored mixed schedule with no enemy respawns or scaling loop. | Optional; no essential unlock |
| SBc2 | One Last Telling | Commander challenge | A separately authored commander sequence swaps phase order and limits reinforcements; the fixed kit proves timing rather than collection power. | Optional; no essential unlock |

### Mission authoring constraints

No mission is accepted solely because its ID appears in this catalogue. Each implemented record supplies a finite wave schedule and objective parameters, a tested minimum roster, a target duration and a screenshot showing the key cue. Difficulty-only copies do not satisfy a row.

A failure condition is explicit: gate destroyed; required escort/scout destroyed; challenge rule broken; or the declared stalemate deadline. Simultaneous completion and gate destruction resolve as defeat. Main-path missions impose no arbitrary deployment or no-skill restriction.

Challenge fixed kits are disclosed before Start and do not overwrite the player's remembered equipment. A “no ranged losses” challenge requires deploying and preserving at least two ranged troops, preventing vacuous completion with none deployed.

## 2. Boss counter contracts

All boss adds come from the mission's finite wave/reward budget. Each warning shows its target, timer and counter icon. Cancelled wind-ups produce one cancellation event and no delayed damage callback.

| Boss | Phase rule | Guaranteed counter | Defeat condition |
|---|---|---|---|
| Rafiq | A two-second charge warning every 12 seconds, followed by four seconds of exposed recovery. | Block with a defender, interrupt with Freeze, or attack in recovery. | Commander and gate both defeated; at most two add groups. |
| Nahla | At 65% and 30% HP, spawn two one-hit decoys with hollow emblems; the real emblem remains solid. | Normal hits remove decoys; attacks and contact reveal concealed specialists. Borrowed Dawn is optional. | Real commander and gate defeated; no target roulette or color-only clue. |
| Mariam | Three visible reservoirs, each enabling one healing channel of up to four seconds; healing ends when that reservoir is spent or interrupted. | Three same-era melee-hit equivalents within a wind-up interrupt it; Freeze also works. | Reservoirs never refill; commander and gate defeated. |
| Furnace Keeper | Three-second volley warning and six-second cooling window; no volley begins while one is pending. | Survive with the guaranteed shield option or interrupt with three melee-hit equivalents during warning; attack while cooling. | Commander and gate defeated; adds capped in authored schedule. |
| Mirror Sentinel | A shield is inactive for eight seconds after four uncontested capture seconds at the reachable prism. Capture progress pauses, not resets, when contested. | Any living friendly troop can hold the prism; no faction-specific capture requirement. | Commander and gate defeated during the available windows. |
| Last Cartographer | At 70% and 35% HP, change from charge to decoys to marked volleys. Transition warnings take at least two seconds. | Reuse the three original skills and normal role counters taught in previous regions. | All phases and gate defeated; no reset of accumulated damage between phases. |

## 3. Tribe identities and 24 role variants

Tribe IDs use `tribe.<slug>`; variant IDs use `tribe.<slug>.<melee|ranged|heavy>`. Each row below defines exactly three variants. Core same-era role behavior remains unless the row explicitly modifies it. Listed role multipliers compose with that row's faction modifiers; unlisted values are 1.0. Round prices upward and HP/damage consistently at battle preparation, not every render frame.

The eight kits need eight recognizably different visual identities and 24 role-specific art sets. A name or tint alone is not a completed variant. Role silhouettes remain legible for friendly and opposing sides.

| Tribe ID / name | Recruitment | Signature rule | Trade-off | Three role variants |
|---|---|---|---|---|
| `tribe.hearthguard` / Hearthguard | Entry | Nearby melee protect allied ranged/heavy troops within 70 world units and one adjacent lane: 15% incoming-damage reduction, strongest source only. | Steady defense; slower pursuit. | Threshold Guard (melee): HP ×1.15, speed ×0.90; Hearthbow (ranged): damage ×1.05, HP ×0.90; Ember Ram (heavy): damage ×1.10, speed ×0.90. |
| `tribe.dune-runners` / Dune Runners | RD04 | All deployments gain 25% movement speed for four simulation seconds; no refresh from subsequent summons. | Rapid opening; all roles have HP ×0.85. | Sandstepper (melee): speed ×1.10; Dune Sling (ranged): attack interval ×0.90, damage ×0.90; Ridge Lancer (heavy): speed ×1.15, damage ×0.90. |
| `tribe.cedar-wardens` / Cedar Wardens | CP08 | After three seconds without dealing or taking damage, a living troop restores 1% maximum HP per second; no gate/cart healing. | Sustain; slower offensive pressure. | Rootguard (melee): HP ×1.20, damage ×0.85; Bough Archer (ranged): range ×1.10, interval ×1.10; Grove Bearer (heavy): HP ×1.15, speed ×0.85. |
| `tribe.tidebound` / Tidebound | RM04 | A ranged hit can pull its non-boss target 35 units toward the attacker, once per ranged troop per eight seconds; clamps and cannot cross the attacker. | Break screens; costly slow heavy support. | Quay Buckler (melee): damage ×1.10, interval ×1.10; Hookcaster (ranged): range ×0.90, damage ×0.90; Anchor Hauler (heavy): range ×1.15, speed ×0.85. |
| `tribe.ashforged` / Ashforged | BF08 | Heavy attacks have a visible one-second wind-up and deal ×1.40 damage; the attack interval includes the wind-up, which can be interrupted. | Siege openings; each heavy deployment costs two extra food. | Cinder Guard (melee): HP ×1.10, speed ×0.90; Sparkshot (ranged): damage ×1.15, interval ×1.15; Furnace Ram (heavy): HP ×1.10, speed ×0.80. |
| `tribe.reedcloaks` / Reedcloaks | RM08 | Ranged and heavy troops begin concealed for at most four seconds; attacking, taking damage, contact reveal or a reveal field ends concealment. | Ambush; revealed specialists remain fragile. | Reedblade (melee): damage ×1.10, HP ×0.90; Mistbow (ranged): damage ×1.15, HP ×0.80; Fen Strider (heavy): speed ×1.10, HP ×0.85. |
| `tribe.lantern-keepers` / Lantern Keepers | GO04 | Melee reveal enemies within 70 world units; hostile snare/slow durations on the kit are multiplied by 0.70. | Reliable counters; every role's damage ×0.90. | Lamp Guard (melee): HP ×1.10; Dawnshot (ranged): range ×1.10; Beacon Bearer (heavy): HP ×1.15, speed ×0.90. |
| `tribe.starcallers` / Starcallers | SB04 | A heavy primary hit creates a 45-unit-radius slow mark for two seconds, slowing enemies 20%; at most three tribe marks per side. | Control; heavy attack interval ×1.15. | Shard Guard (melee): damage ×0.95, HP ×1.05; Comet Sling (ranged): interval ×0.90, damage ×0.85; Orbit Warden (heavy): range ×1.10. |

Damage-over-time does not retrigger pull or mark effects. Pulls cannot move bosses, cross gates or move the target through the attacker. Concealment ends before the concealed unit's first attack resolves; it does not allow damage with an invisible untelegraphed attacker. Contact within 45 world units reveals a concealed unit even without a specific tribe or skill.

Original armies do not receive these faction passives accidentally. A tribe is a battle-loadout choice, not a permanent account-wide multiplier.

## 4. Twelve expansion skills

Skill IDs use `skill.<slug>` in content/save references; original core adapters retain their original action IDs internally. `D` is same-era melee base damage multiplied by the player's applicable global damage bonus, frozen at Start; it does not include heavy, tribe on-hit or temporary amplification. All durations are simulation seconds.

The original three skills are available on expansion entry. Stand Together and Borrowed Dawn adapt existing captain mechanics rather than count as new inventions. Their original captain counterparts remain available under original rules regardless of expansion unlocks.

| ID / skill | Origin | Grant | Effect | Target/edge rule |
|---|---|---|---|---|
| `skill.freeze` / Freeze | Existing core | Entry | Instant; current original freeze duration and legacy-duration benefit. Retain an explicit adapter, not a second overlapping freeze timer. | Living hostile units; no target means no consumption. |
| `skill.meteor` / Meteor | Existing core | Entry | Instant; existing original damage formula at the frozen era. Keeps its global attack identity. | Living hostile units; cannot bypass an invulnerable gate. |
| `skill.food` / Food Drop | Existing core | Entry | Instant; gain up to ten food without exceeding 99. | At 99 food, reject without consumption. |
| `skill.stand-together` / Stand Together | Adapted captain mechanic | RD02 | Reduce incoming damage to the company and player gate by 35% for six seconds; use strongest shield and combined cap. | The original captain choice remains unchanged in original mode. |
| `skill.borrowed-dawn` / Borrowed Dawn | Adapted captain mechanic | RM03 | Reveal concealed enemies for six seconds; cancel a currently interruptible boss channel and prevent its restart during that window. | Does not invent new boss immunity exceptions or erase resolved damage. |
| `skill.volley` / Volley | New | RD03 | Choose a broad zone; after a one-second telegraph, deal 3D to up to six living enemies in it. | Nearest to zone center, then unit ID; lock zone, not a hidden moving target. |
| `skill.mending-rain` / Mending Rain | New | CP03 | Restore 25% maximum HP to currently living friendly troops, clamped to maximum HP. | No dead troops, cart, decoy or gate; all healthy means no consumption. |
| `skill.war-drums` / War Drums | New | CP06 | Increase friendly attack rate 25% for six seconds, including troops entering during the effect. | Rate multiplier 1.25, not an ambiguous 25% interval subtraction. |
| `skill.snare-field` / Snare Field | New | RD06 | Choose a zone; root enemies within it for two seconds. Bosses instead receive a 20% movement slow for two seconds. | Does not freeze attacks or refresh through re-entry. |
| `skill.sunder` / Sunder | New | BF03 | Mark the foremost visible hostile unit for five seconds; it receives 30% more damage. | Deterministic priority, then unit ID; no target means no consumption. |
| `skill.decoy-banner` / Decoy Banner | New | RM06 | Choose a zone; create one destructible lure for six seconds with HP equal to two same-era melee hits. Nearby enemies within 120 units may target it. | Bosses ignore it; range/collision rules remain valid; no reward or troop-count credit. |
| `skill.ash-line` / Ash Line | New | BF06 | Choose a zone; four one-second pulses each deal 0.75D to enemies currently in the band. | No on-hit proc chaining; each tick resolves once in simulation time. |

Zone bands are the three equal longitudinal thirds of the 0–1000 simulation field, across all lanes. Their accessible Near/Middle/Far buttons map to the same domain coordinates as taps. Only the simulation checks legal targets; an off-canvas tap cancels or leaves targeting open, never maps to an arbitrary enemy.

Volley snapshots the band on acceptance, then checks living occupants at impact. Ash Line checks occupants at each tick. Snare applies once to occupants at acceptance, not to subsequent re-entry. Sunder follows its selected living unit and expires if that unit dies. Decoy Banner can be placed only in the Near or Middle band; it cannot be placed behind the enemy gate.

New abilities do not add a fourth mana/cooldown economy. Accepted casts consume one of the three equipped once-per-battle skill uses. Cancelled, invalid, blocked or stale input consumes none.

## 5. Twelve relics

Relic IDs use `relic.<slug>`. Equip exactly one or none. Effects cannot stack by repeated equip, import or retry. They cannot emit their own triggering event recursively. Incompatible selections are allowed but display “No benefit with this loadout” rather than silently changing equipment.

| ID / relic | Grant | Exact initial rule |
|---|---|---|
| `relic.hearth-token` / Hearth Token | RD04 | The first real friendly troop lost grants three food, capped at 99; once per battle. |
| `relic.sand-compass` / Sand Compass | RD08 | The first three friendly deployments gain 10% movement speed; strongest speed buff wins. |
| `relic.reed-knot` / Reed Knot | RM04 | Friendly ranged units receive 10% less damage while within 70 units of a friendly melee. |
| `relic.ferry-bell` / Ferry Bell | RM08 | The first completed rescue or escort checkpoint restores 10% of the player gate's maximum HP; once per battle. |
| `relic.cedar-cup` / Cedar Cup | CP04 | The first equipped healing cast adds five percentage points of troop maximum-HP healing; no effect without that skill. |
| `relic.root-buckler` / Root Buckler | CP08 | The first heavy deployed receives a shield absorbing up to 15% of its maximum HP for five seconds. |
| `relic.basalt-wedge` / Basalt Wedge | BF04 | Player heavy attacks deal 10% extra damage to the enemy gate during its vulnerable state. |
| `relic.forge-tongs` / Forge Tongs | BF08 | The first interrupted hostile wind-up grants a three-second 10% friendly damage bonus; once per battle. |
| `relic.glass-lens` / Glass Lens | GO04 | Friendly attacks against currently revealed concealed enemies deal 10% extra damage. |
| `relic.oasis-thread` / Oasis Thread | GO08 | First capture of a landmark restores 5% maximum HP to living troops within 85 world units; once per battle. |
| `relic.star-map` / Star Map | SB04 | The first Volley, Snare Field or Ash Line widens its target band by 50 world units on each side, clamped to the field; once per battle. |
| `relic.homeward-seal` / Homeward Seal | SB08 | The first gate hit below half gate health grants a three-second 15% friendly damage reduction; once per battle. |

Star Map changes the first eligible zone's width, not its per-target damage, duration or tick count. The targeting preview must show the widened band before confirmation. Decoy Banner is not eligible and does not consume this relic's use.

Homeward Seal evaluates after the triggering gate hit and cannot prevent a gate that reached zero HP from losing. Ferry Bell and Oasis Thread do not revive destroyed targets. Hearth Token ignores decoy destruction.

## 6. Essential unlock schedule

Entry grants Hearthguard plus Freeze, Meteor and Food Drop, with no relic. RD02 grants Stand Together; RD03 Volley; RD04 Dune Runners; RD06 Snare Field. RM03 grants Borrowed Dawn; RM04 Tidebound; RM06 Decoy Banner; RM08 Reedcloaks. CP03 grants Mending Rain; CP06 War Drums; CP08 Cedar Wardens. BF03 grants Sunder; BF06 Ash Line; BF08 Ashforged. GO04 grants Lantern Keepers. SB04 grants Starcallers.

Each region's 04 and 08 grant its two relics. Optional challenges grant only the ordinary challenge reward and a visible completion/trophy record. The initial three-skill loadout remains a guaranteed solution path; no later grant is a hidden requirement to earn itself.

The implementation must verify this graph automatically, not infer gates from display order. First-clear and recruitment presentation is consolidated into one result sheet, with an optional “Try this loadout” button and a default Continue action.
