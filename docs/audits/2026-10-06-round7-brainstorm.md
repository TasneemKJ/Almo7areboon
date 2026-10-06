# Improvement brainstorm, round 7 (2026-10-06)

IDEAL + 5Ws. Who: a brand-new phone player in the first ten minutes. When: from the first Battle tap to the second chapter. Where: the deck, the deploy hint, the result. Why: a first win that feels earned, in the game's folk-tale voice. Lenses this round: onboarding, audio, dread, comedy (Levantine storyteller voice), first-ten-minutes balance.

## Twenty ideas
1. **Onboarding:** ring the first troop card until the first deployment of the first-ever battle (shipped; the existing text hint did not point at anything).
2. **Onboarding:** a one-line "swipe the deck" hint for the third card; skipped, three cards fit on every phone.
3. **Onboarding:** tell the player the Gather control's purpose on first use; deferred, needs a one-time flag in the save.
4. **Audio:** result motifs. Checked: victory rises (330, 440, 660 Hz), defeat falls (330, 311, 294 Hz); locked by a test (shipped).
5. **Audio:** a faint rooster or call-to-prayer-free village hum on first load; rejected, the atmosphere bed already carries the setting.
6. **Audio:** duck the soundscape under the result sting; deferred, needs a listening pass on a device.
7. **Dread:** low-gate vignette; the base-danger class already exists, no work.
8. **Dread:** the first enemy wave arrival cue; wave arrival paint already exists.
9. **Dread:** silence for one beat before a RUSH wave; deferred, audio design needed.
10. **Comedy:** a first-defeat line that jokes at the player's expense gently; first-win quip already exists ("someone brought a plan with the spoons").
11. **Comedy:** the hearth-keeper comments on the first Hold order; needs authored lines in six chapter voices.
12. **Comedy:** a quip when the army is only melee; the regroup hint already teaches roles, no extra line.
13. **Levantine:** chapter-opening proverb on the picker; copy work, deferred.
14. **Balance:** first ten minutes. Chapter 1 is tuned by `simulate-encounters`; no new data says it is off, so no change.
15. **Balance:** food starts at 6 and the first card costs 3; fine.
16. **Retention:** none this round (streak grace shipped in 0.3.7).
17. **Accessibility:** teaching ring is static under reduced motion and visible without colour (ring width, not hue only).
18. **Loop:** show the next unlock on the first result; the Journey button already names it.
19. **Session:** resume prompt after backgrounding; pause already handles it.
20. **Stability:** none flagged.

## Chosen
1 and 4. Both are small, presentation-only, with no save or balance change.
