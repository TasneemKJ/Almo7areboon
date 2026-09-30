# Long-run progression probe

`scripts/simulate-progression.ts` runs a bounded policy that claims quests, summons cards when enabled, buys upgrades, attempts evolution, and deploys troops and skills. Its choices are one heuristic, not proof of optimal play or of an unavoidable economy wall.

```sh
node --experimental-strip-types scripts/simulate-progression.ts [targetTimeline=12] [summon=1] [maxAttempts=1200]
```

Every counted attempt must successfully start a new battle. Only an actual `lost` outcome increments the losing streak and permits retry. A battle still running at the 400-second budget is reported as `battle-timeout`; the probe stops without inventing a loss or another attempt. The JSON distinguishes started/completed attempts, wins, losses, timeout context, target completion and attempt-limit exhaustion. A rejected start, next or retry is an assertion failure.

## Corrected evidence

The earlier timeline-10/11 and long losing-streak conclusions are withdrawn. The old loop counted any non-win after its 400-second budget as a loss, ignored a rejected retry/start, and continued purchasing and using skills in the same running battle. Those figures do not establish a progression wall.

Fresh runs on main `e6cfdf3f7ef0762ffeef0f404d3700ccb710786f` with this reporting correction, before chapter mastery or prestige:

| Command arguments | Stop reason | Started / completed | Real wins / losses | Longest real loss streak | Running battle at timeout |
| --- | --- | ---: | ---: | ---: | --- |
| `12 1 600` | battle-timeout | 10 / 9 | 6 / 3 | 1 | Timeline 1, chapter index 3, army index 1; 400 simulation seconds |
| `12 0 600` | battle-timeout | 43 / 42 | 28 / 14 | 4 | Timeline 2, chapter index 3, army index 1; 400 simulation seconds |

The summoning run owns four cards and has 60 gems left. The no-summon run owns none and has 1,230 gems. The target was not reached in either run. These are policy/time-budget limits; they do not show that human players cannot progress, that all battles require a particular number of retries, or that rewards must increase.

The current policy spends coins on upgrades before attempting evolution. Another policy may preserve evolution funds or replay an earlier opponent. Evaluate those choices with accepted public actions and real terminal outcomes before drawing balancing conclusions. Chapter mastery and prestige require their own versioned traces because their rewards and evolution rules differ.

No gameplay constants changed in this correction. Both commands completed with the explicit timeout report and passed the internal `started = wins + losses + timedOut` invariant.

## With chapter mastery, step-downs and retreat

The probe now models three things a player can do that the earlier policy could not: replay the previous chapter after three losses in a row (`stepDowns`, because evolution keeps the chapter frontier), retreat from a battle still running after 240 simulation seconds (`retreats`, the new Settings action; the earlier `battle-timeout` cases were fights that had stalled with neither base able to fall), and collect chapter mastery, whose per-timeline seals pay gems.

Runs on main `3c0d6d9` plus these two policy changes (heuristic play, not optimal play):

| Command arguments | Stop reason | Started attempts | Wins / losses | Step-downs / retreats | Longest loss streak | Cards | Gems left |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `12 1 1500` | target-reached (timeline 12) | 494 | 159 / 335 | 93 / 24 | 3 | 69 | 255 |
| `12 0 1500` | attempt-limit (timeline 9) | 1500 | 401 / 1099 | 348 / 113 | 9 | 0 | 8,715 |

Reading, with the same caution as above:

- With mastery, a policy that spends its gems on cards completes twelve timelines in under 500 attempts, while the same policy that never summons reaches timeline 9 in 1,500 attempts with almost 9,000 gems unspent. Gems still matter, but they are no longer scarce; the earlier "wall near timeline 6" was a property of the pre-mastery economy plus a policy that could not step down or retreat.
- Stalled fights do happen (a weak army against long-range defenders can neither win nor lose). Without a way out, only a reload ended them, which is why Settings now offers **Retreat from this battle** while one is running. Retreating is an ordinary loss: earned coins stay, no seals or rewards are added.
- These runs say nothing about how fun the pacing is, or about how a human would play.
