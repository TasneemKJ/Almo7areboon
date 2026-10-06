# Improvement brainstorm, round 8 (2026-10-06)

IDEAL + 5Ws. Who: a phone player mid-battle and between sessions. When: at a kill, at the end of a battle, when returning later. Where: the battlefield and Settings. Why: weighty kills and a trustworthy save. Lenses this round: battlefield visual polish, juice on hits and deaths, session design, retention beyond the streak.

## Twenty ideas
1. **Session design:** Settings shows when the game last saved (shipped, in memory only, no save-format change).
2. **Juice:** a heavy troop falling is louder than a light one: wider dust, a second ring, a short low shake (shipped; the death event now carries the fallen role).
3. **Juice:** true hit-stop on heavy hits; needs its own render-freeze design, still deferred.
4. **Juice:** gold coin spray toward the counter on kill; coin floaters already rise, skip.
5. **Juice:** brief white flash on the struck unit; `hitFlash` already exists.
6. **Visual polish:** richer foreground shadows under heavies; art-direction work, needs a source-art pass.
7. **Visual polish:** unit-count crowding at 20+ troops; lane perspective already staggers them.
8. **Visual polish:** sky tint shift as the base falls; base-danger class exists.
9. **Visual polish:** pennant colour per chapter; present.
10. **Session design:** a "welcome back" line naming the time away; needs a stored timestamp (save field), deferred.
11. **Session design:** pause-on-return banner; pause handling already exists.
12. **Session design:** one-tap rematch on the result; Retry exists.
13. **Retention:** next-chapter teaser on the picker; scouting copy already does this.
14. **Retention:** weekly "seal" goal; needs authored goals and a save field.
15. **Retention:** daily rotating chapter blessing; balance work, deferred.
16. **Retention:** Chronicle milestones; present.
17. **Retention:** share-card of a win; no accounts or analytics by rule.
18. **Feel:** haptic tap on deploy (opt-in); needs a preference field.
19. **Feel:** skill-cast screen pulse; skill cues exist.
20. **Stability:** none flagged.

## Chosen
1 (the coordinator's request) and 2 (the biggest gap in kill feedback: every unit died the same way). Both are presentation-only with no save or balance effect.
