# 40 Mobile QA Iterations

Goal: forty time-boxed, evidence-led Game Studio QA iterations from main 33c57564. Each iteration is one distinct risk hypothesis. A pass can be PASS, BUG, BLOCKED, or INCONCLUSIVE; no bug quota. Do not reuse one failure as multiple bugs.

1 ready short-height layout
2 ready tall-phone layout
3 portrait safe-area controls
4 landscape rotation
5 rapid Battle taps
6 troop target spacing
7 locked troop affordability
8 food cap/deploy rejection
9 skill once-per-battle
10 pause/resume
11 speed toggle
12 Settings mid-battle
13 Quests mid-battle
14 Storybook mid-battle
15 tab switching while paused
16 retreat/result
17 retry/result focus
18 victory continuation
19 defeat regroup
20 chapter selection
21 evolution requirements
22 prestige reset disclosure
23 legacy selection
24 cards pack affordability
25 summon repeated input
26 daily reward duplicate protection
27 quest duplicate claim
28 import valid
29 import malformed/read failure/race
30 export round-trip
31 reset cancel/confirm
32 save owner multi-tab
33 temporary session
34 pagehide/pageshow
35 visibility/audio pause
36 fresh offline install
37 offline reload/play
38 cache/server failure recovery
39 20-cycle UI/game stress
40 cross-browser final mobile sweep

For each: record scenario, exact revision, browser/viewport, steps, expected, observed, evidence, disposition, and any regression added. Fix only reproducible root causes. Time-box intermittent environment anomalies and record them instead of consuming later iterations.
