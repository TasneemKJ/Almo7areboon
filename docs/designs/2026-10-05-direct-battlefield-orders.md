# Direct Battlefield Orders — Iteration 1

Base: `main@32d050951e4bf47f1288408c62ae9100c4cf5622`.

## Current-game before evidence

The design was inspected against three original native-Chromium frames from exact-head run `37215055430`, artifact `battle-banner-chromium#11307694742` (PR #156 head `093178c37b70c05f67c4b2d5476bf80af906f9fc`, now merged as main `32d050951e4bf47f1288408c62ae9100c4cf5622`):

1. `320-ready.png` — First Fires village, ready battlefield and current command row.
2. `320-muster.png` — first deployment, village muster/watchfire and 12/60 momentum.
3. `320-hold.png` — active Hold order and its current battlefield/village response.

These are current storybook assets and mechanics; no retired art is reintroduced.

## Twenty fresh ideas considered before implementation

1. Tap the player-gate side of the battlefield to issue Hold and the enemy-gate side to issue Advance when momentum is ready.
2. Swipe toward the enemy gate to Advance and back toward home to Hold.
3. Long-press the home gate to form a defensive brace without opening a menu.
4. Double-tap the road ahead of the formation to signal a push.
5. Let a battlefield tap choose which active lane receives the next deployment.
6. Drag a formation anchor to reposition a gathered rally before release.
7. Tap an endangered friendly unit to prioritize protection cues.
8. Tap an enemy unit to mark a focus target for the next ranged volley.
9. Tap the home shelter after earning coins to jump directly to the first affordable upgrade.
10. Tap authored village lamps to reveal the current settlement restoration effect.
11. Let the first deployment originate from a battlefield-side muster hotspot instead of only a card.
12. Allow a held troop card to repeat lawful deployments while food remains available.
13. Add a short roadward command stroke from the tapped battlefield edge using the existing order event.
14. Use gate vibration/ink recoil to make rejected commands legible without a toast.
15. Let the player cancel a pending direct command by moving the pointer into the center neutral band.
16. Keep a wide center neutral zone so ordinary battlefield inspection cannot accidentally spend momentum.
17. Make reduced-motion direct orders use the same static authored village response already used by order presentation.
18. Preserve keyboard/button commands as equivalent routes while making the battlefield the faster primary touch route.
19. Add browser acceptance for pointer cancellation, pause, modal ownership, resize and short landscape before declaring the gesture usable.
20. Record direct-order use only in existing order statistics, with no new save field, reward, streak or retention telemetry.

## Selected coherent design

**Player verb:** when 60 momentum is ready, tap near the player's gate to **Hold** or near the enemy gate to **Advance**. The middle 40% of the battlefield is deliberately neutral. The existing command buttons remain accessible/keyboard-compatible fallbacks.

**Consequence:** the gesture dispatches the existing authoritative `order` action. It spends the same 60 momentum, lasts the same 10 seconds, uses the same Advance/Hold combat effects, increments the existing order statistic, and triggers the already-authored battlefield/village order response. No balance, economy, save schema, asset, sound or reward changes are introduced.

**Recovery/cancellation:** movement beyond a bounded tap threshold, pointer cancellation, a pointer ending outside the battlefield, the neutral middle band, insufficient momentum, pause, modal ownership, inactive battle tab, hidden/non-playable ownership or a non-running phase performs no command and spends nothing. The gesture state is cleared on cancel/blur and never queues a future order.

**Progression/replay purpose:** this shortens the moment-to-moment route from earned momentum to tactical consequence without adding another screen. Existing progression and replay remain authoritative; direct commands do not inflate stats or rewards.

## Acceptance criteria

- Pure geometry tests cover 320/360/390 portrait widths, short landscape and desktop-sized bounds.
- Home edge resolves Hold, enemy edge resolves Advance, the middle band resolves nothing.
- Dragging farther than the tap threshold, ending outside the battlefield, malformed geometry and cancellation paths resolve nothing.
- Runtime wiring dispatches only through the existing `action({type:'order', ...})` guard and does not bypass pause/save/session ownership.
- Existing order buttons and keyboard/focus behavior remain available and at least 44px.
- GitHub Actions native Chromium exercises both direct Hold and direct Advance through actual pointer input on the production build and captures three matching after views.
- Full source tests, production build, affected browser/reliability/save gates pass on the exact final head.
- Final diff receives an explicit documented review. Self-review must be labeled as such.
- Merge uses an expected-head guard only after refreshed main/head/CI/reviews/ownership are clear.
- Claims remain bounded: browser fixtures are not physical-device, Safari, performance or measured-retention evidence.
