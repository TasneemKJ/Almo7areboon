# Improvement brainstorm, 2026-10-05 (round 3)

Method: IDEAL with the 5Ws (who: a phone player mid-battle; what they see and do; when in the session; where on screen; why it matters for coming back). Priority set by the art-director review: landscape play first.

## Twenty ideas, by lens
1. **Mobile/UI:** landscape side rail: battlefield left, deck right, no page scroll (shipped).
2. **Mobile/UI:** Gather gets its own space under the troop cards (shipped).
3. **Mobile/stability:** tall phones overflowed by 53px while running (upgrades hidden under navigation, the battlefield scrolled away on tap); fixed the world minimum (shipped).
4. **Performance:** lazy-load Phaser after the shell (shipped; app chunk 356 → 233 kB).
5. **Release:** Open Graph/Twitter preview from shipped Harbor art (shipped; key art requested in ASSET_REQUESTS.md).
6. **Writing:** result screen repeated the seal requirement; it now states the attempt only (shipped).
7. **Retention:** the result's Journey button names the next real reward (shipped; docs/COMPETITIVE.md lesson 1).
8. **Input:** a repeatable touch check (`npm run review:mobile-touch`) that plays to a result with #158 tap orders (shipped).
9. **Typography:** balanced two-line hints, no orphaned word (shipped).
10. **Release:** current action majors everywhere, including `preview.yml` (shipped).
11. Landscape: compact Settings header (the empty band above Close costs about 60px).
12. Landscape: a painted rail frame (asset requested).
13. Game feel: a short haptic on deploy, opt-in.
14. Audio: duck the soundscape under result dialogs.
15. Onboarding: first-battle pulse on the first troop card.
16. Accessibility: colour-independent troop role marks.
17. Replayability: a chapter "challenge seal" shown on the chapter picker.
18. Session design: resume a paused battle with a single tap on the world.
19. Performance: frame-rate capture in the weekly suite.
20. Data safety: show the last successful save time in Settings.

## Chosen and why
1-10 fix the blocking landscape defect and the portrait collisions the review named, lower the first-paint cost without changing gameplay, and add one honest return reason at the end of every battle. Saves are untouched.

## Look back
The touch check passed at all five sizes, and the landscape rail shows the battlefield and the troop cards together. Interactive time at 4x CPU throttle is in `docs/performance-budgets.md`.
