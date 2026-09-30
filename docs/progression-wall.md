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
