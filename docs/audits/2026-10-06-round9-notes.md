# Round 9 notes (2026-10-06)

## Heavy-death evidence
The 0.3.9 heavy-death emphasis was verified with real frames. A webdriver-only hook (`canvas.dataset.lastDeath`, `{kind, side, n}`) lets a script find the first heavy death; the script then clicks Pause on the same frame, which freezes the effects (`effects(paused?0:dt)`), and screenshots the lane. The same script ran against the build before the change (patched only to carry the role) and after. The "after" frame shows the wider flare and the extra ring around the falling heavy; the "before" frame shows the single small flare. Screenshots are kept in the session scratchpad, not the repo.

## Chosen from the round 8 brainstorm (idea 10, session design)
A returning player (at least one win, away six hours or more) sees one toast: "Welcome back. The village kept the lamps lit for 3 days." Nothing is granted. Data: an optional `lastSeen` (epoch ms) that rides on the saved copy of the profile at save time only (the live profile is untouched, so every "progress unchanged" invariant still holds); normalized on load (positive integer before 2100, else dropped); future or garbage times show nothing.
