# Round 10: what a first-time player does not understand after 60 seconds

Method: a scripted first-timer on a fresh save at 390x844 (touch), who taps Battle, deploys once when the ring points at the first card, then does nothing more. Hints, labels and screenshots were recorded at 0, 2, 10, 31 and 60 seconds (scratchpad, not the repo).

## What the run showed
- At 31 s the player had one warrior and 26 unspent food (eight warriors' worth) while four enemies gathered; at 60 s the battle was lost with food still banked.
- The deploy hint then told them to tap Freeze (the first-Freeze cue). It was true, but not the cause of the loss: the army was never built. The teaching ring had gone out after the first deployment.
- Earlier hints say "Save some food for the next wave" and "Save food and send melee warriors together"; a literal player saves food forever.

## Twenty ideas (IDEAL + 5Ws; who: a first-timer; when: seconds 10 to 60; where: hint line and the first card)
1. Food banked while the army is tiny: say so, and ring the card again (shipped).
2. Reword "Save some food" hints; deferred, tests lock the text and the new cue already outranks it.
3. Explain the cryptic wave label ("RUSH 2/5 · 2M · 5s"); the `?` opens an inspector already.
4. Name Momentum on first sight; the meter label exists, deferred.
5. Show Advance and Hold as greyed until momentum fills; they already read as inactive.
6. A one-time Gather explanation; needs a one-time flag.
7. Make the first wave arrive 2 s later; balance change, no evidence.
8. Auto-deploy the first warrior; removes the lesson.
9. Pulse the food counter when it is capped; the capped hint exists.
10. Show how many warriors are alive; the field shows them.
11. A "you lost because X" line; shipped as the defeat recap in 0.3.5.
12. Tell the player the army fights automatically; the ready hint says so.
13. Hint to unlock Thrower when coins allow; the lock cost shows.
14. Teach Freeze later than deploying; the order is now deploy first, then Freeze.
15. Skill count badges (4 4) look like a countdown; badge shows living enemies, caption explains in the aria label only. Deferred, needs copy.
16. Show food income per second near the counter; present (0.80/sec).
17. A defeat hint that names unspent food; defeat advice exists ("Spend the unused food on reinforcements before your gate falls").
18. First result: "your army won/lost because…"; covered by 11.
19. Skip a tutorial popup; the game prefers in-world cues.
20. Slow time when food piles; changes balance, rejected.

## Chosen
1. Rule: first three wins, mid-battle, at least one deployment made, food at three times the cheapest warrior's cost, and fewer than three fighters alive. Then the hint reads "Food is piling up (N). Keep tapping the melee card to send more warriors." and the first card carries the teaching ring again. It outranks the skill cues.

## After the change
The same scripted first-timer, following the hint, survives: at ~45 s the battle shows one enemy remaining and coins banked (93), where the unaided run was lost.
