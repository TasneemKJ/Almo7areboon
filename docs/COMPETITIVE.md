# Competitive study: lane-battle and evolution games

Written 2026-10-05. **Source: the author's own knowledge of these games, not fresh web research.** No web search was available in this session. Treat player sentiment as a general summary of widely reported reviews, not as measured data. Earlier source-checked notes are in [similar-games-notes.md](similar-games-notes.md). We learn principles only and copy no assets, names, text or distinctive content.

## Ten references

| Game | Core loop | Onboarding | Progression pacing | Feel and juice | Return hooks | Mobile UI strength | Praised / criticised |
|---|---|---|---|---|---|---|---|
| The Battle Cats | Lane battle: wallet fills, tap units, push to the enemy base | Two-button start; the first stages are almost unlosable | Stage map plus unit levels; walls are solved by grinding earlier stages | Absurd unit art; big knockback on a kill | Events, gacha, daily stamina | One row of deploy buttons; wallet and cannon at the thumb | Humor and charm / grind walls, gacha pressure |
| Age of War | Lane battle; evolve through ages for new units and turrets | No tutorial: a small set of buttons | Experience from kills unlocks the next age, so evolving mid-battle is the big moment | Age change transforms the whole army instantly | Short sessions; replay on a harder difficulty | Simple, readable icons | The evolution moment / stalemates, flash-era balance |
| Stick War: Legacy | Lane battle plus economy (miners) and army control (attack, defend, garrison) | Guided first mission | Campaign plus upgrades; skins | Direct control of one unit; strong hit feedback | Endless mode, tournaments | Three big stance buttons | Control depth / ads, late difficulty spikes |
| Kingdom Rush | Tower defence with heroes and rally points | Each new mechanic comes in its own level with a short card | Stars per level buy upgrades; replaying for three stars | Hero voices, punchy impacts, encyclopedia | Star collection, Heroic and Iron challenges | Radial tower menus, tap to rally | Polish and fairness / premium heroes in later games |
| Clash Royale | Real-time duel with an elixir clock and three lanes | Training against bots; cards unlock per arena | Trophy road; chests; card levels | Card drop and tower-break feedback | Chests, seasons, clans | Four-card hand with the elixir bar under the thumb | Depth / pay-to-win and long chest timers |
| Plants vs. Zombies | Lane defence: sun economy, plant placement | One plant per level, learned by using it | Linear unlocks; mini-games | Comic sounds and animation; a wave flag meter | Zen garden, survival modes | Seed packets in a bar; tap to collect | Charm and teaching / later free-to-play versions monetised |
| Cartoon Wars | Lane battle with a hero gun and unit spawns | Minimal | Upgrade shop between stages | Ragdoll knockback | Stages, upgrades | Big spawn buttons | Simple fun / repetitive |
| Grow Empire: Rome | Lane defence plus an empire map of conquests | Guided first waves | Many upgrades; city conquest map | Visible army march | Offline income, conquest map | Upgrade trees in tabs | Satisfying growth / grindy, ad-heavy |
| Rush Royale | Merge tower defence, PvP and co-op | Short guided match | Card levels, talents | Merge feedback | Quests, clans, events | Single-screen board | Depth / monetisation |
| Kingdom: Two Crowns | Side-scrolling build and defend; coins drive everything | Wordless: learn by tapping coins | Islands, seasons, mounts | Painterly pixel art, ambient sound, day and night | Run-based expeditions | Two-button control | Atmosphere / opaque systems, slow pace |

## Lessons for Almo7areboon, ranked by impact

1. **Always show the next concrete goal at the end of a battle** (Clash Royale trophy road, Kingdom Rush stars). Shipped this round: the result screen's Journey button names the next real reward ("Claim 100 gems", "2 wins to 100 gems").
2. **Make evolution a felt moment, not a menu** (Age of War). The age change should transform the deck and battlefield with a short reveal. Respect reduced motion.
3. **Teach one mechanic per battle, by use** (Plants vs. Zombies, Kingdom Rush). The first deploy, first Freeze and first Advance each get one live cue at the moment of need, with no text walls.
4. **Readable lane at a glance** (Battle Cats). Silhouettes, health and the frontline must read on a 320px phone. The landscape rail now keeps the lane visible while you deploy.
5. **Hit feedback sells power** (Battle Cats knockback, Stick War). A short hit-stop and knockback on heavy hits and base strikes, kept small on mobile and absent with reduced motion.
6. **Replay with a reason** (Kingdom Rush three stars). The existing seals do this. Show unearned seals on the chapter picker, so replay is a choice made at a glance.
7. **Never wall the player without a visible way forward** (criticism of Battle Cats and Grow Empire). Defeat already names one funded step. Keep economy curves checked against first-hour traces.
8. **Thumb-zone command deck** (Clash Royale hand, PvZ seed bar). Deploy, orders and skills stay in the lower third; the top only shows status.
9. **Atmosphere as identity** (Kingdom: Two Crowns). The dusk storybook look and village life are the differentiator; protect them with performance budgets so low-end phones keep them.
10. **Comic voice in small doses** (PvZ, Battle Cats). The hearth-keeper and village lines already do this. Add an occasional quip at results, never during combat.
11. **No pressure timers or pay walls** (Clash Royale and Rush Royale criticism). Keep the daily reward generous and non-punishing; there are no purchases.

## Ideas fed into the round 3 brainstorm

Lesson 1 shipped. Lessons 2, 3, 5 and 6 are in `TODO.md` as candidates for later rounds.
