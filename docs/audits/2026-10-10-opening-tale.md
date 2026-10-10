# Opening tale: a first-launch intro (10 October 2026)

The owner asked for "video animation intro to each game". This batch adds a short in-engine opening tale: no video
file (the JS gzip budget is 500 KiB and main was at 480.1 KiB), only the shipped storybook plate, the battlefield
walking strips and a few lines of copy, a spring camera and a synthesized score.

## Research (cited)

- Intros and cutscenes should be skippable, instantly; players who replay are the strongest case, and the opening
  minutes are where most players leave. Sources: Masahiro Sakurai on skippable cutscenes
  (https://automaton-media.com/en/?p=34004), "How to create immersive game intros"
  (https://www.gamedeveloper.com/design/how-to-create-immersive-game-intros), "Video game intro videos must die,
  especially on mobile" (https://www.thatgamesux.com/video-game-intro-videos-must-die-especially-on-mobile-platforms),
  TouchArcade developer thread on getting to play fast
  (https://toucharcade.com/community/threads/getting-straight-to-the-game-as-quickly-as-possible-how-important-is-it.147267/).
- Time to core play: industry guidance cited by retention write-ups is to reach the core loop within about a minute;
  splash and pre-play screens are a named drop-off source. Benchmarks vary by method (D1 roughly 21-27%), so no
  retention claim is made here. Sources: https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies,
  https://blog.playio.co/mobile-game-onboarding-retention, https://adriancrook.com/?p=8151.
- Accessibility: offer a bypass for non-core content and let narrative be replayed; avoid sudden movement.
  Sources: Game Accessibility Guidelines (https://gameaccessibilityguidelines.com/intermediate/),
  AbleGamers APX "bypass" (https://accessible.games/accessible-player-experiences/challenge-patterns/bypass/),
  WCAG 2.3.3 and `prefers-reduced-motion` (https://w3c.github.io/wcag/understanding/animation-from-interactions).
- Audio: Web Audio stays blocked until a user gesture; start it from a visible control
  (https://developer.chrome.com/blog/autoplay).

What we took: under ten seconds, first launch only, Skip in the thumb zone from the first frame, replay from
Settings, a still version for reduced motion, and sound only because the tale is opened by a tap.

## Brainstorm (IDEAL, 5Ws, twenty ideas)

**Identify:** a new player meets a title screen, then a battle, with no premise. **Define:** one short, skippable
tale that says who you are and why the gate matters, then becomes the field. **Explore:** below. **Act:** 1, 2, 3,
5, 6, 8, 9, 11, 13, 14, 16, 17, 18. **Look back:** browser frames at 390x844 and 844x390, reduced motion, reload.
**Who:** a first-time phone player. **What:** three beats, one line each. **Where:** between Play and the first
field. **When:** first launch, or on request. **Why:** premise and tone before the first tap on a troop.

| # | Lens | Idea | Decision |
|---|---|---|---|
| 1 | Visuals | Reuse the chapter's own painted plate, framed exactly as Home shows it | Selected: no new asset, and the first frame is not a cut |
| 2 | Game feel | One spring camera for push-in, pan and settle | Selected |
| 3 | Gameplay | Rival column walks down the far lantern road (mirrored, rim-lit strips, as on the field) | Selected |
| 4 | Visuals | Pre-rendered MP4/WebM intro | Rejected: budget, and it cannot match the live field |
| 5 | Onboarding | Company walks in and raises weapons: "Hold the gate." | Selected |
| 6 | UI/UX | Skip button, 44px, bottom right, safe-area aware, from frame one | Selected |
| 7 | Input | Tap anywhere to skip | Rejected: the second tap of a double-tapped Play would skip by accident |
| 8 | Data safety | Optional `introPending`, set only for a brand-new browser | Selected: old saves never replay it |
| 9 | Session design | Settings "Watch intro", through `Game.dispatch` | Selected |
| 10 | Retention | Play the tale on every launch | Rejected: research says replays are the case for skipping |
| 11 | Accessibility | Reduced motion: stills joined by short cross-fades | Selected |
| 12 | Writing | Title card with the game name | Rejected: Home already shows it; one line per beat |
| 13 | Audio | Synthesized drone, a Hijaz motif on D and one or two accents per beat | Selected |
| 14 | Audio | Soft open D chord as the tale hands into play; Skip fades in 0.2s | Selected |
| 15 | Audio | Narrator voice | Deferred by the owner; the beat table has an `ar` line and a `voice` slot |
| 16 | Atmosphere | Field inherits the camera's last motion | Selected |
| 17 | Stability | A lost save session ends the tale without recording or entering | Selected |
| 18 | Loading | Use only art already in the offline cache | Selected |
| 19 | Replayability | Chapter-specific tales on each new era | Deferred: same engine, needs copy and review per chapter |
| 20 | Release readiness | Physical-device and Safari audio check | Pending: not provable from hosted Chromium |

## Apple motion audit (apple-design skill), ranked worst first, and fixes

1. **Beat seam snap.** The dusk push was a CSS keyframe that ended after beat two began; removing it snapped the
   plate, and the next transition started from rest. Fixed: one critically damped spring per axis
   (`ui/intro-camera.ts`), retargeted per beat with responses longer than the beats, so it is always drifting at a seam.
2. **First-frame flash.** The tale opened darker and zoomed over the bright Home plate. Fixed: the camera opens on
   Home's framing at full brightness and eases in.
3. **Brightness by full-screen filter.** `filter: brightness()` transitions repainted the plate and hard-cut in
   reduced motion. Fixed: a navy veil whose opacity is part of the spring; reduced motion cross-fades it in 0.3s.
4. **Skip was not from the presentation value.** Fixed: Skip retargets the spring from the current value and
   velocity while the layer dissolves; the rival column keeps its animation across beats instead of snapping.
5. **Static hand-over.** Fixed: the field's scene element takes 35% of the camera's remaining offset and velocity
   and settles with the same spring (`worldTransform`).
6. **Slow looping flicker** near 0.2 Hz on the lamps. Fixed: one rise per beat.
7. **Reduced motion hard-cut stills.** Fixed: stills with 0.3s cross-fades; nothing pans, walks or slides.
8. **No press feedback on Skip.** Fixed: scale 0.96 within 100ms on press.
9. Overshoot check: no `outBack` or under-damped spring anywhere; the company's arrival eases to a halt.
10. Rival column crossed the caption area. Fixed: it walks the far road inside the camera layer.
