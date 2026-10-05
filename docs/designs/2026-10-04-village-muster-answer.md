# Village Answers the First Muster

## Observable gap

The current village answers incoming waves, danger, recovery, battle orders, spoils, and final verdicts. A successful troop deployment already has a battlefield ring and short sound, but the inhabited settlement behind it stays indifferent. The first company member can leave home without a single neighbour or lamp acknowledging the departure.

## IDEAL

- **Intent:** Make the first accepted deployment feel like the village has sent someone into the road, while keeping deployment itself immediate and unchanged.
- **Design:** On the first authoritative player `spawn` event of a battle, HUD-clear windows briefly gather witnesses and ink strokes point homeward-to-road, so the response remains distinguishable without colour. Existing practical lamps join when they are not already carrying the higher-priority incoming-wave watchfire.
- **Execution:** A small immutable presentation owner records only the first valid player spawn and derives a 2.4-second simulation-time frame. `villageFrame` consumes that frame below verdict, alarm, incoming-wave, and order priorities. The renderer reuses the existing ambience graphics and six-light pool.
- **Acceptance:** Enemy spawns, malformed events, rejected taps, later player spawns, ready state, and a new battle cannot manufacture or replay the response. Pause freezes it, reduced motion uses the same complete static identity for the same bounded lifetime, and all marks remain inside measured HUD-clear apertures and existing light anchors.
- **Limits:** No combat, food, economy, save, audio, input, pause, result timing, asset, texture, or DOM changes. This is a first-muster acknowledgement, not a new reward or tactical buff.

## Five Ws

- **Who:** The residents already registered in the two measured village apertures.
- **What:** A once-per-battle first-deployment acknowledgement using temporary witness silhouettes, outward ink strokes, and brighter existing lamps.
- **When:** Immediately after the first accepted player spawn; it advances only with simulation time and expires after 2.4 seconds.
- **Where:** Inside HUD-clear village windows and at the authored practical-light anchors, behind bases and troops.
- **Why:** A core player verb should visibly connect the company to the home it is defending, making the settlement feel alive without adding a menu or changing the game loop.

## Verification contract

1. The pure owner accepts only the first finite player-spawn event and remains immutable and bounded.
2. Pause is byte-stable because the authoritative battle clock is frozen; reduced motion changes pose, not lifetime.
3. Verdict, alarm, and order suppress the muster without queueing it. An incoming-wave watchfire keeps exclusive ownership of the lamps while the spatially separate windows answer immediately; the muster is never replayed after expiry.
4. Witness and stroke geometry is derived from `VILLAGE_PLATES`, excludes live HUD bounds, and never adds stage-light objects.
5. GitHub Actions native Chromium captures original 320px and 390px current-build first-muster frames plus a reduced-motion frame, validates diagnostic geometry, and reports page/runtime errors.
