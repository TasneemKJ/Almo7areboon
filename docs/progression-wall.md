# Long-run progression probe

`scripts/simulate-progression.ts` plays a competent scripted player through repeated timelines: it claims quests, summons card packs with every gem it can spend, buys unlocks and upgrades, evolves when allowed, builds a melee/heavy front with ranged troops behind, reads the wave preview for heavy threats, and times Freeze, Meteor and Food Drop.

```sh
node --experimental-strip-types scripts/simulate-progression.ts [targetTimeline=12] [summon=1] [maxAttempts=1200]
```

## Results (main at the time of writing, 600 attempts)

| Player | Reached | Longest losing streak | Cards owned | Gems unspent |
| --- | --- | --- | --- | --- |
| Summons cards and claims quests | timeline 10 | 20 | 48 | 100 |
| Never summons | timeline 6 | 211 | 0 | 3,100 |

An earlier run without quest claims, summoning cards as gems arrived, stalled at timeline 8 with 25 cards; claiming quests roughly doubled the gem income and moved the wall to timeline 11.

## Reading

- Within a timeline a competent player needs at most one retry per battle, so the encounter tuning is fair.
- Enemies scale 22% per timeline while cards are the only permanent growth, so gems are the long-run bottleneck. Winning pays 10 gems, a timeline pays 100, and quests pay 1,650 in total.
- A player who ignores cards hits a wall by timeline 6 with thousands of gems unspent, which is why the defeat text now points at summoning when gems are available.
- Where the wall should sit, and whether gem income should rise, are design decisions this probe does not make.
