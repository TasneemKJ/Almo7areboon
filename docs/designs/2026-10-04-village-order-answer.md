# Village Answers the Banner

## Observable gap

On the current reviewed build, **Advance** and **Hold the Line** immediately change the command deck and troop plane, while the authored settlement behind them remains visually indifferent. The player-issued order therefore reads as a UI status instead of a command heard by the place being defended.

## IDEAL

- **Intent:** Make a tactical order feel heard across the village without adding a menu, resource, timer, or rule.
- **Delight:** Painted lamps answer the banner with a small, legible bit of communal character.
- **Emotion:** Advance feels like warmth carrying outward; Hold feels like neighbors bracing inward.
- **Accessibility:** Shape, direction, and pigment all distinguish the two orders. Reduced motion uses a still answer. HUD-covered anchors are omitted rather than moved.
- **Logic:** The response derives from the existing battle-order frame and simulation time, yields to higher-priority alarm/watchfire/verdict states, and reuses bounded ambience and light pools.

## Five Ws

- **Who:** A player who has earned momentum and deliberately issues Advance or Hold.
- **What:** Each clear authored village lamp briefly brightens and carries two ink strokes: outward-rising for Advance, inward-bracing for Hold.
- **When:** During the first 2.4 simulation seconds of an accepted order. Pause freezes it; afterward the settlement settles while the ten-second order continues.
- **Where:** At the measured lamp anchors in each chapter painting, behind actors and clear of current HUD exclusions.
- **Why:** The village should feel like a participant in its own defense, while preserving the existing economy, combat timing, saves, controls, and player agency.

## Acceptance boundaries

- No gameplay, balance, economy, reward, save-schema, input, or audio changes.
- One authoritative order presentation frame drives both troop marks and village response.
- At most four reused lamp halos and eight ambience strokes; no new display-object pool.
- Alarm, incoming-wave watchfire, and terminal verdict suppress the order response.
- Malformed input fails closed; geometry remains finite, bounded, immutable, and HUD-safe.
- Native Chromium evidence must cover Advance, Hold, 320 px and 390 px phones, pause, rotation, and reduced/full motion through GitHub Actions.
