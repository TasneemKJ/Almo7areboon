# Spoils Come Home

Earned coins currently appear as a number at the defeated enemy, while the persistent coin total changes in the distant header. The reward is correct, but the battlefield does not visually connect the fall of an enemy to resources returning to the settlement.

## IDEAL

- **Intent:** Make every credited combat reward feel collected by the home settlement, so the battle-to-upgrade loop reads without another panel or instruction.
- **Design:** Each authoritative positive coin event launches one small painted coin token from the event position toward the player shelter. The token follows a short upward arc for 0.9 active presentation seconds. A fixed pool renders at most six simultaneous tokens from the existing painted coin asset; newer rewards replace the oldest excess token. The existing `+amount` text remains the exact numeric explanation. Pause and hidden ownership freeze the flight. Resize, battle replacement, motion-mode changes and shutdown clear it. Reduced motion adds no travelling token and retains the existing static amount cue.
- **Evidence:** Tests first for event truth, malformed input, bounds, cap, expiry, pause, immutability, arc endpoints and reduced motion; renderer/asset integration; all source tests and production build; native Chromium through GitHub Actions at 320, 390 and 1024 pixels; original screenshot inspection.
- **Avoid:** No reward delay, coin arithmetic, prices, upgrade rules, save field, sound, input, target selection, combat timing, new menu, SVG approximation, unbounded Phaser allocation or claim that the animation proves economy balance or retention.
- **Limits:** Automated Chromium evidence does not establish physical-device/Safari acceptance, organic comprehension, measured retention, low-end performance or subjective delight.

## Five Ws

- **Who:** Every player receiving a positive combat coin credit; reduced-motion players keep the unchanged numeric reward cue without travel.
- **What:** One capped painted coin token per authoritative reward event, travelling home while the credited amount remains visible at its source.
- **When:** Immediately after the simulation has already credited the coins, for 0.9 active presentation seconds; never while paused, hidden or after the battle identity changes.
- **Where:** From the real reward event position across the battlefield to the existing player shelter, above the painted world and below DOM controls.
- **Why:** The current number explains value but not destination. A brief homeward path makes earning, keeping and later spending coins feel like one coherent loop without interface complexity.

## Contract

`spoilsHomecomingIntentForEvent` accepts only a positive finite `coin` event with a finite battlefield position and converts that simulation position to the renderer's logical width. `rememberSpoilsHomecoming` sanitizes direct inputs, retains the newest six immutable marks and never mutates the event or previous state. `stepSpoilsHomecoming` advances only active presentation time and expires a mark at 0.9 seconds.

`spoilsHomecomingFrame` returns a finite position, alpha, size and angle on a bounded parabolic path from the reward source toward the shelter. Normal motion begins exactly at the source and ends exactly at the home anchor. Reduced motion returns no travelling frame. The renderer preallocates six images from a purpose-sized 48px derivative of the existing painted `public/art/storybook/interface/coin.webp`, reuses them for every battle and exposes bounded webdriver-only diagnostics for the CI journey.
