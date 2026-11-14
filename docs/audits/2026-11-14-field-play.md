# 1.3 field play: the banner, the board and the camp (2026-11-14)

Owner direction: "Make sure games provide a real playing experience, not feel like an app with lots of menus and
buttons." Branch `ios/taskit-1.3` from `ios/taskit-1.1` (ffc4287).

## Brainstorm (IDEAL, 5Ws; 20 ideas across lenses)

Identify: at 390x844 the bottom third of a battle was a control panel (momentum bar, Advance/Hold, three cards, food
line, Gather). Define: who (a casual phone player, one thumb), what (lead the company), where (the painted field), when
(every 15-20 s an order is possible; deploys every ~4 s), why (the verb should be in the world, the panel reads as an app).

1. *Input:* drag the company banner forward/back for Advance/Hold. **Chosen.**
2. *Game feel:* the banner follows the finger and leans into the push; snaps back in the neutral zone. **Chosen.**
3. *UI/UX:* momentum as the banner's cloth lighting outward, not a bar. **Chosen.**
4. *Accessibility:* four brass rings on the staff count momentum quarters (non-colour cue). **Chosen.**
5. *Accessibility:* keep the native Advance/Hold buttons as hidden VoiceOver/keyboard proxies. **Chosen.**
6. *UI/UX:* troop cards slimmed to painted tokens on a wooden board edge. **Chosen.**
7. *Input:* Gather is a tap on your own camp, where the gathered company waits. **Chosen.**
8. *Visuals:* one flag only: stop drawing the old gate pennant in the field. **Chosen.**
9. *Onboarding:* the field cue says "Drag the banner forward to advance, back to hold" when momentum is first ready. **Chosen.**
10. *Onboarding:* a tap on the banner shows both plates once instead of doing nothing. **Chosen.**
11. *Atmosphere:* the carried banner throws a pool of gold/teal light on the ground. **Chosen.**
12. *Landscape:* the board becomes a narrow upright plank, one token per row. **Chosen.**
13. *Input:* deploy by tapping the road (sticky last troop). Deferred: changes the owner's 2026-11-13 "tap the troop below" rule.
14. *Input:* drag a token onto the field (Clash Royale). Rejected: no placement choice in a lane game, so pure friction.
15. *Audio:* a cloth-flap cue when the banner becomes ready. Deferred: readiness is deliberately silent (UX-CONTRACT).
16. *Game loop:* banner position as a continuous front line. Rejected: a balance change.
17. *Visuals:* repaint the supply basket in storybook gouache. Deferred to TODO (art pass).
18. *Writing:* plates name the effect in the world's words ("+20% strike", "needs 60 momentum"). **Chosen.**
19. *Stability:* the drag offset lives on an inner element so the per-frame placement never drops a carry. **Chosen.**
20. *Retention/session:* none needed; no timers or pressure added.

## Comparables (studied, not copied)

See DESIGN.md "1.3: lead the company in the field". Clash Royale (a short card edge, art + cost), Kingdom Rush (a flag
you place in the world is the order), Monument Valley (the touched thing moves, and the movement explains it).

## Measurement

Method: `bot.py` (scratchpad, Python Playwright, WebKit, 390x844 @3x, `hasTouch`, `isMobile`). A fresh profile taps
Play, watches the first-launch tale, then plays the first 180 s of field time with one fixed policy on both builds:
Supplies when the cue asks, an order whenever momentum is ready (Advance; Hold if the gate is under 70%), Gather after
25 s then Release 9 s later (every 35 s), otherwise deploy the best affordable troop; between battles it taps the
primary result/next control (logged separately as menu). Only the adapter differs: before taps the Advance button and
the Gather button; after drags the banner 70px and taps the camp. Each input is classified by the element under its
start point: *world* (canvas or a native target over a painted object: banner, camp, basket, enemy), *board* (a troop
card/token), *chrome* (any other DOM control: order buttons, Gather button, skill sheet). "Before" is ffc4287's
`dist/`, "after" is this branch's `dist/`.

| | before EN | after EN | before AR | after AR |
|---|---|---|---|---|
| battle inputs (3 min) | 92 | 92 | 93 | 87 |
| on the world | 5 (5.4%) | 19 (20.7%) | 5 (5.4%) | 18 (20.7%) |
| on the board (troop cards/tokens) | 68 | 68 | 69 | 65 |
| other DOM controls | 19 | 5 | 19 | 4 |
| world + board (the field and its frame) | 79.3% | 94.6% | 79.6% | 95.4% |
| orders given / accepted | 13 / 13 | 13 / 13 | 13 / 13 | 13 / 13 |
| field running after Play | 12.2 s | 12.2 s | 12.2 s | 12.3 s |
| first real action (deploy) after field running | 0.51 s | 0.48 s | 0.46 s | 0.49 s |
| visible battle controls (DOM) | 7: Pause, Advance, Hold, 3 cards, Gather | 4: Pause, 3 tokens | 7 | 4 |

Both builds played the same battles the same way (won battle 1 at ~33 s, lost battle 2 at ~122-131 s), so the
gesture gives the same orders as the buttons. Every order, Gather and Supplies input now lands on the field; the 4-5
remaining DOM taps are the Food Drop choice in the Supplies sheet.

**Against the targets.** World share is 20.7%, not the 70% asked: deploying (65-69 of ~90 inputs) stays a tap on the
troop tokens because the brief keeps the cards, and DESIGN.md forbids disguising a menu row as scenery to meet a
count. Counting the board edge as the field's frame, 95% of inputs land on the field or its frame (79% before).
Seconds to the first real action: 0.5 s from the moment the field is running (target met); 12.7 s from tapping Play,
because a first launch plays the 9-12 s opening tale first (unchanged; it can be skipped). Reaching 70% would need a
world deploy path (TODO, owner decision).

Limits: one seeded-policy bot on a desktop WebKit with emulated touch (mouse-driven drag, not a finger); no physical
iPhone, VoiceOver or Safari acceptance; screenshots prove only this environment.
