# Reference games study: The Battle Cats, Clash Royale, Kingdom Rush

Written 2026-10-14. **Source: the author's own knowledge of these games, not fresh web research** (no web search was used in this session). Player sentiment below is a general summary of widely reported reviews, not measured data. We study mechanisms and principles only. No competitor assets, names, text, code or balance tables are used. Earlier notes: [COMPETITIVE.md](../COMPETITIVE.md), [similar-games-notes.md](../similar-games-notes.md).

Current game inspected at `e799a15` (0.3.14): `npm ci`, `npm run test:fast` (1,417 pass), `npm test` (1,464 pass), `npm run build` (498,076 / 512,000 gzip JS bytes), and a 390x844 touch tour of Home, a running Olive Terraces battle and the Victory result, all viewed.

## 1. The Battle Cats (PONOS)

**Atmosphere.** Deadpan absurdity. The world is drawn flat and simple, so every joke lands on the units themselves: a cat with legs, a cat that is a tank, a cat that is a cow. The enemy roster is just as odd (a dog, a snake, a sumo seal). Nothing is grim. Defeat is funny, not punishing.

**Visuals.** Silhouette first. Every unit reads at thumbnail size from its outline alone, and the animations are few, chunky and exaggerated (a big wind-up, a big knockback hop). Bosses are simply enormous versions of normal shapes, so threat is read from size.

**Gameplay mechanisms.**
- *One tap, one unit.* The wallet fills on its own and the only verb is "tap a portrait". Depth comes from the roster, not from the controls.
- *Knockback.* A heavy blow throws the target back along the lane. It breaks enemy pushes, creates breathing room, and is the most legible "that hit was big" signal in the genre.
- *The cat cannon.* A charging emergency skill on the player's base. It recharges, so the question is *when*, not *whether*: fire it now to clear a push, or hold it for the boss.
- *Boss on base damage.* Hitting the enemy base hard enough wakes a boss. The final stretch of a stage has its own climax instead of a slow chip.

**Loop.** Stage map in chapters, each stage short. Treasures (collected by clearing stages) give permanent small stat bonuses, so replay has a reason. Unit levels are the long arc.

**What makes it captivating.** Absurd charm plus a single, readable verb. The player always knows what to press and always has a funny thing to look at.

## 2. Clash Royale (Supercell)

**Atmosphere.** Cartoon medieval with loud personality: the King's emotes, crowd cheers, the clang of a tower falling. Every interaction is acknowledged with sound and motion.

**Visuals.** Chunky, high-contrast, bright. The board is small and the camera fixed, so every effect is close to the thumb. Tower health is huge, numeric and central.

**Gameplay mechanisms.**
- *Elixir pacing.* A visible, segmented bar fills at a steady rate. Cards are greyed until affordable, then pop. Tapping an unaffordable card shakes the bar: refusal is feedback, not silence.
- *Double elixir.* The final minute doubles the income. The match changes gear in the closing stretch and every game ends with a crescendo.
- *Overtime.* A tied match continues under pressure so stalls end.
- *Tower drama.* Tower damage is the scoreboard. A tower dropping is a big event: debris, a crown, a sound sting.
- *Impact frames.* A brief freeze and flash on big hits; deploys land with a thump and a ring.
- *Emotes.* Characters react to the match: smug, angry, crying. Personality without words.

**Loop.** Chests unlock after battles and are opened with a ceremony; cards level up with a satisfying stamp. (Criticised: long chest timers and paid acceleration. We avoid both.)

**What makes it captivating.** Game feel. Every input gets an immediate, physical answer, and the match has a shape: opening, middle, double-elixir finale.

## 3. Kingdom Rush (Ironhide)

**Atmosphere.** A hand-painted storybook with gentle wit: tower barks, cheeky enemy descriptions, easter eggs on the map.

**Visuals.** Painterly backgrounds, framed like illustrations. Clean unit silhouettes on top. A parchment world map with a winding road and flags on each level.

**Gameplay mechanisms.**
- *Readable waves.* The next wave is previewed with enemy icons; the player can call it early for a bonus, trading safety for gold and time.
- *Heroes.* One strong named unit with its own presence; if it falls, it returns after a cooldown.
- *New-enemy cards.* The first time an enemy appears, a short card names it and its quirk. One mechanic is taught at a time.
- *Stars.* Up to three per level, for winning and for losing few lives. Stars buy upgrades in a tree, so replaying for stars is meaningful.

**Loop.** World map → level → stars → upgrade tree → harder levels. Heroic and Iron challenges for replay.

**What makes it captivating.** Fairness and clarity in a beautiful frame. The player is never surprised unfairly, always taught, and always rewarded for mastery with stars that matter.

## Gap analysis: Almo7areboon today

| Dimension | What already works | Gap against the references |
|---|---|---|
| Atmosphere | Authored Levantine dusk paintings, living village, soundscape, opening tale, village voice on results | Little humor or personality *during* battle; enemies are faceless; the battle has no emotional arc (no finale, no climax) |
| Visuals | Strong painted chapters, grade, ground marks, base damage states, hit-stop on heavy blows | No stage-intro moment; no boss silhouettes; the chapter picker is a list, not a map; no frame around the painting; results are a plain card |
| Gameplay | Food → recruits, three roles with traits, Hold/Advance, three once-per-battle skills, wave previews, mastery seals | No rechargeable emergency skill (BC cannon); no knockback; no hero; no boss/climax; no late-game income change (CR double elixir); no "call wave early" risk/reward |
| Loop | Seals (three per chapter), mastery coins/gems, cards, evolution, timelines, Journey milestones | Seals are rewarded once and then inert (KR stars feed upgrades, BC treasures give bonuses); victory reveal is flat; card level-ups lack ceremony |
| Feedback | Count-up coins, impact cues, coin floats, order banners | No deny feedback on unaffordable taps, no affordability pop, no gate-threshold drama, no multi-kill callout, no haptics |
| Onboarding | Teach ring on the first recruit, first-Freeze/Meteor cues, field guidance | No pointing hand on the very first tap, no "new foe" introduction, no live hint that a seal is slipping away |

Constraints honored by the plan: DESIGN_RULES.md (combat clarity, honest rewards, a loss is a lesson, no dominant strategy, folk-tale tone, accessibility), all gameplay through `Game.dispatch` and the simulation, no rewards while rendering, `almo7areboon.save.v1` unchanged with only optional normalized fields, 44px native controls, reduced motion keeps meaning, and the shared 500 KiB gzip JavaScript budget (about 14 KB of headroom at the start, so most visual work is CSS, which the budget does not count). No purchases, timers, streak pressure or daily gates are added.

## Ranked plan: 40 iterations

Rank is the implementation order (dependencies first within impact). Dimension: **G** gameplay mechanic, **F** feedback/juice, **V** visual/atmosphere, **L** loop/pacing, **O** onboarding. Reference: **BC** Battle Cats, **CR** Clash Royale, **KR** Kingdom Rush.

| # | Iteration | Dim | Ref | Player-visible change |
|---|---|---|---|---|
| 1 | Herald banner and chapter title card | V | KR | A storybook stamp names the chapter and wave count as a battle starts |
| 2 | Last-wave herald | F | KR | "The last wave comes" when the final wave sets out |
| 3 | Harvest Moon finale | G/L | CR | Food gathers twice as fast once the final wave has set out |
| 4 | Harvest Moon sky | V | CR/KR | A rising moon glow and warmer field during the finale |
| 5 | Knockback on heavy blows | G | BC | A blow worth a third of a target's health throws it back along the lane |
| 6 | Watchtower Volley | G | BC | A recharging gate volley that hurts and pushes back enemies near your gate |
| 7 | Volley charge ring and first-charge cue | F/O | BC/CR | The volley button fills as a ring, pulses when ready, and is introduced once |
| 8 | Gate-crack drama | F | CR | Gates crossing two-thirds and one-third health trigger a callout and a kick |
| 9 | Enemy chieftain at half gate | G | BC | The enemy's chieftain marches out once their gate falls below half |
| 10 | Chieftain silhouette | V | BC | The chieftain is larger and crowned, announced by the herald |
| 11 | Chieftain fall impact frame | F | CR | A flash, a hit-stop and a coin shower when the chieftain falls |
| 12 | Company champion hero | G | KR | A champion joins once per battle from the standard and returns after falling |
| 13 | Champion presentation and cue | V/O | KR | Champion aura and size; one live cue the first time it is available |
| 14 | Call the next wave early | G/L | KR | Tap the wave signal to bring the next wave now for bonus coins |
| 15 | Deny feedback | F | CR | Tapping an unaffordable recruit shakes the food readout |
| 16 | Recruit-ready pop | F | CR | A recruit pops once when it becomes affordable |
| 17 | Food bar | V/F | CR | A slim bar under the food count fills toward the next food |
| 18 | Troop barks | V | BC | Each role's first deployment in a battle shouts a short line |
| 19 | Enemy commander taunts | V | CR | The enemy commander reacts to gate damage with a short painted line |
| 20 | Rout callout | F | CR/BC | Three enemy falls within 1.5 seconds call out a rout |
| 21 | Seal-at-risk cue | L/O | KR | The field says when "Gate Unbroken" is lost for this attempt |
| 22 | Storybook map | V/L | KR/BC | The chapter picker becomes a winding road of numbered waypoints |
| 23 | Map seal hints | L | KR | Each map waypoint names the seal still missing |
| 24 | Victory seal stamping | F/L | KR | Seals stamp in one by one on the result; new ones glow |
| 25 | Victory MVP | L | CR | The victory result names the role that dealt the most damage |
| 26 | Spoils satchel | L/F | CR | An honest satchel opens on victory to show coins and gems already credited |
| 27 | Victory petals | F | CR | Paper petals fall behind the victory card (none with reduced motion) |
| 28 | Chapter keepsakes | L | BC | A chapter with all three seals grants +4% food production |
| 29 | Seal road perks | L | KR | Total seals unlock perks: longer Freeze, stronger Meteor, starting food |
| 30 | Seal road in the Journey | L/V | KR | The Journey shows keepsakes and the next seal road perk |
| 31 | Long night overtime | L | CR | After 150 seconds both gates take 50% more damage so stalls end |
| 32 | Optional haptics | F | CR | A Settings switch for short vibrations on deploy, gate cracks and results |
| 33 | Pointing hand | O | BC/CR | A painted hand points at the first recruit in the first battle |
| 34 | New foe cue | O | KR | The first sighting of each enemy role in an uncleared chapter names its quirk |
| 35 | Company codex lines | V | KR/BC | Each of the 18 troops gets a short witty line in Camp |
| 36 | Storybook frame | V | KR | A soft painted vignette frames the battlefield |
| 37 | Card level-up ribbons | L/F | CR | Summoned cards that gained a level wear a "Level up" ribbon |
| 38 | Entry seal tally | L | KR | Home shows the seals earned this timeline |
| 39 | Regroup wisdom | O | KR/BC | Defeat adds one short, witty, role-specific tip |
| 40 | Finale drum | V | CR | A soft drum sting greets the Harvest Moon |

Spread: gameplay 8, feedback/juice 12, visual/atmosphere 10, loop/pacing 11, onboarding 6 (several iterations touch two dimensions). Each is adapted to the Levantine folktale frame: harvest moon instead of double elixir, a watchtower volley instead of a cannon, a chieftain instead of a boss, seals and keepsakes instead of stars and treasures.

## Rule check

Checked against DESIGN_RULES.md. Rewards stay honest: every coin comes from the simulation (wave-call bonus, chieftain bounty) and is shown as it is paid. No perk is purchasable. Knockback, volley, champion and finale are available to every player every battle, so no dominant purchase exists; balance is checked against the existing campaign and timing suites. Reduced motion keeps every cue's meaning (static stamps, no shakes). No new save key; new profile fields (`haptics`) are optional and normalized in `decodeSave`.
