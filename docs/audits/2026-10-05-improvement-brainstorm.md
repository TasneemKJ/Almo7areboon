# Improvement brainstorm, 2026-10-05 (round 2)

Method: IDEAL (identify, define, explore, act, look back) with the 5Ws for each candidate. Lenses: UI/UX, onboarding, game loop, retention, visuals, performance, accessibility, CI cost.

## Twenty ideas
1. Ready-screen next-goal chip (shipped: the Journey button names the nearest reward). 2. First-battle pulse on the first troop. 3. Welcome-back summary (shipped in reduced form: the daily reward is the first chip reason; no new save field). 4. Streak grace day (needs a save field; deferred). 5. Rotating daily challenge. 6. Milestone confetti at 10/50/100 kills. 7. Hit-stop on base damage, reduced-motion aware. 8. Count-up result rewards. 9. Best-upgrade hint after defeat (already present: regroup-learning and masteryAdvice). 10. Adaptive coin nudge after repeated defeats. 11. Idle coins while closed. 12. Card summon reveal sting. 13. Victory/defeat audio motifs. 14. Colour-blind troop-type shapes. 15. Optional haptics. 16. Shareable result image. 17. Daily-reward notification opt-in. 18. Lazy-load Phaser (deferred: needs a boot restructure to verify). 19. Landscape side rail for troop cards (deferred: layout rewrite). 20. Quieter title focus ring on dialogs (shipped).

## Chosen and why
Chip (1/3): smallest change that gives a reason to return, reads existing state only, save format untouched. Focus ring (20): screenshot QA showed a hard black box around the VICTORY heading after a battle ends. CI artifact trimming: failure-only, one small artifact per workflow.

## Not done
Ideas 18 and 19 were not attempted; they need browser-verified refactors beyond one small batch.
