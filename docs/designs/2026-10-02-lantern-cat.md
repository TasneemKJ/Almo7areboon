# Lantern Cat Design

## Observable gap

The unlocked **The missing page** route says “Follow the cat to the forgotten courtyard,” and the saved discovery calls it “The cat who waited.” The current battlefield renders the route’s cage, progress knots, freed scout and homeward footprints, but no cat. The story therefore names a guide that is absent from the playable scene.

The official Kingdom site continues to describe atmospheric micro-strategy through exploration, curious discoveries and inhabitants who make a realm feel worth defending. The relevant inference for Almo7areboon is narrow: let an already-authored recurring creature inhabit the existing objective instead of adding another rule or menu. No competitor asset, code or tuning is used.

Sources checked 2026-10-02:

- https://kingdomthegame.com/
- `docs/similar-games-notes.md`

## IDEAL

- **Intent:** Make the epilogue’s promised cat physically present and useful as a quiet visual guide.
- **Design:** A small ink-and-pigment cat uses the existing rescue state: it pads from the home gate toward the cage, waits beside the real rescue marker, then turns and accompanies the freed scout home. Paw marks and body direction make the route readable without text or colour alone.
- **Evidence:** Pure deterministic model tests; renderer integration/depth/lifecycle tests; existing full source suite and production build; native Chromium captures at 320, 390 and 1024 through GitHub Actions; original screenshot inspection.
- **Avoid:** No new action, hit box, target, reward, timer, save field, balance rule, sound cue or tutorial gate. Do not show the cat on ordinary scout rescues or before its saved discovery.
- **Limits:** This is presentation evidence in desktop Chromium emulation, not a physical-device/Safari, listening-quality, retention or organic-balance claim.

## Five Ws

- **Who:** Players who have found all three discoveries and selected **The missing page**; all other journeys remain unchanged.
- **What:** One pooled Phaser graphics actor and one pooled ground-mark layer driven only by the existing chronicle route, phase, rescue flag, traveller position, pause state, time and reduced-motion choice.
- **When:** Waiting at home while ready; leading during the route’s opening; watching beside the cage until the real rescue completes; accompanying the real scout home afterward. Pause freezes the presented frame. Reduced motion uses fixed poses and no animated gait/tail.
- **Where:** On the established rescue foot plane, behind the cage/scout endpoints and below front-lane actors, with bounded x/y values that never enter HUD or control surfaces.
- **Why:** It closes a visible story/gameplay contradiction and gives the settlement a memorable, quirky resident without increasing control or rules complexity.

## Contract

`chronicleCatFrame(input)` returns either `null` or an immutable-friendly finite frame with mode, x, facing, gait, tail angle and up to three paw marks. It returns `null` unless the cat discovery bit is set and the selected route is `whisper`.

`chronicleCatRenderPlan(groundY, frame)` places paw marks below the cat, the cat behind the rescue cage/scout endpoints, and both below the front actor boundary. The renderer exposes a webdriver-only `dataset.chronicleCat` snapshot for native evidence and removes it when the cat is absent or the view is destroyed.

## Acceptance

1. Undiscovered profiles and non-`whisper` routes render no cat.
2. The lead pose advances from the home gate toward (but never through) the cage using presentation time only.
3. The watching pose is beside the closed cage and does not imply rescue progress.
4. The home pose follows the authoritative rescued traveller and never passes through the scout or home gate.
5. Pause and reduced motion are static; malformed numeric inputs fail finite and bounded.
6. The cat and paw marks are presentation-only and cannot mutate profile, battle state, saves, objective timing, rewards or inputs.
7. Native screenshots at 320, 390 and 1024 show the cat’s lead, watch and home states without HUD collision or incorrect depth.
