---
version: alpha
colors:
  ink: "#24414b"
  paper: "#f5efda"
  navy: "#16394b"
  gold: "#f0ce87"
  blue: "#326d90"
  primary: "#326d90"
  brass: "#b7955f"
typography:
  body:
    fontFamily: "Trebuchet MS, Arial Rounded MT Bold, Arial, sans-serif"
  display:
    fontFamily: "Georgia, serif"
rounded:
  control: "8px"
  landscape: "12px"
omitted:
  - section: spacing
    reason: "Existing responsive CSS owns per-surface spacing; no global scale migration."
  - section: components
    reason: "Native DOM controls are styled by canonical CSS; behavior is in UX-CONTRACT.md."
---
# Almo7areboon design

## Overview
An illustrated Levantine folktale company journey for portrait phone play. The distinctive element is a battle banner: brass-edged enamel commands that turn earned momentum into an intelligible tactical choice. The original settlements, company characters and lived-in paper journal remain the visual identity. Combat clarity leads; surrounding menus use the world's materials.

## Colors
Runtime CSS remains canonical (mapping model B). src/style.css :root owns --ink, --paper, --navy, --gold, --blue; src/ui/material-language.css owns --craft-brass. DESIGN mirrors exact accepted values; new surfaces consume these variables. Blue means the company's normal/action state, brass/gold highlights readiness and earned progress, paper belongs to paused information. Text/icon/disabled semantics supplement every color state.

## Typography
Trebuchet utility text keeps dense costs and command labels readable. Existing chapter serif and Georgia Journal display headings are restrained. English is the shipped locale; complete Arabic/RTL and physical-device font preferences remain future acceptance work. No remote fonts.

## Layout
Portrait column, maximum480px. The battlefield owns canvas; native DOM owns command deck, rewards, settings and journal. Order controls occupy the deployment deck rather than covering the world. A short viewport scrolls the full shell; dialog scroll ownership is independent and Close remains sticky. At320px all controls remain reachable. Shared touch target44px, safe-area offsets retained.

## Elevation & Depth
Settlements carry depth through shipped artwork and existing Phaser layers. Controls use a dark foot, thin brass seam and small inner highlight; the Journal landscape has a navy fade behind text. Avoid more decorative cards or floating overlays in combat.

## Shapes
8px banner controls,12px artwork windows, existing20px paper dialogs. Radius differences describe material and scale rather than a new component system.

## Components
| Role | Owner | Consumers |
|---|---|---|
| Shared theme | src/style.css, ui/material-language.css | banner, Journey, existing screens |
| Order state | game/battle-orders.ts → ui/battle-orders.ts | native order buttons, meter/countdown |
| Journal goals | ui/journey-screen.ts; game/data.ts rewards | ready/results Journey, existing claims |
| Modal/close/focus | main.ts, ui/accessibility.ts, continuation.css | all dialogs |
| Motion | document data-motion and existing renderer policy | static reduced-motion order marks |

## Do's and Don'ts
Make choices and feedback legible. Keep banners clear of battlefield center. Use real progress and real earnings. Preserve touch, keyboard, save ownership, manual pause and receipt safety. Avoid generic dashboard chrome, reward promises unsupported by simulation, coercive return timers and unmeasured retention claims.


## Direct battlefield agency

The painted battlefield is an input surface, not only a backdrop. Direct gestures resolve into existing authoritative simulation actions, preserve a neutral cancellation region, respect pause/modal/save ownership, and keep keyboard/button equivalents. Direct input cannot duplicate rewards, bypass resource costs, or create a second balance path.

## UI/UX principles (2026-10-05 review)
- The HUD shows only what matters this moment: battle state while running, the next reason to act while ready. Reasons to return (the Journey button's next reward) are read-only facts, never timers or pressure.
- Dialogs are pages of the setting: paper surface, brass rule, serif display title. Programmatic focus on a title must not draw a boxed outline for pointer users; keyboard users keep a visible ring.
- Controls sit in the thumb zone (command deck and navigation at the bottom); the battlefield stays uncovered. New copy is short, concrete and names real numbers.
- Screenshot QA at 390x844 portrait, 844x390 landscape and 1280x800, plus a touch-enabled pass at 320, 360, 390 and 412 widths, is part of every UI batch.

## Village command response (2026-10-05)
The existing gate pennant quietly acknowledges valid command readiness at the simulation's 60-momentum threshold. Readiness uses smaller, subdued brass cloth without troop auras; active Hold/Advance keeps its stronger identity and short village answer. Cloth movement stays below one source-space pixel and becomes static with reduced motion. Accepted commands use restrained, distinct gate-tap/brass-rise contours on the existing effects bus. This is presentation only; screenshot and listening acceptance remain pending for this batch.

## First Fires spatial depth (2026-10-05)
Two measured cool-air pockets sit within the distant blue hill faces. Two warm reflections land on masonry beneath the existing practicals, leaving their ink, doorways, roofs and gold path intact. Source-space masks follow the painting's uniform crop and exclude measured HUD bounds; no global wash or new assets are used. Cached low-opacity triangles live in the existing ambience layer below habitation, lamps and combat. Reduced motion keeps the same static depth; ordinary breathing uses the village's existing clock. The First Fires soundscape separates a sparse, slightly left near-hearth texture from soft diffuse valley air within its original stereo buffer and single voice. Other chapters keep their original PCM. Source and unit evidence are verified separately from pending native-render after-image, listening and physical-device acceptance.

## Arena-first command footprint (2026-10-05)
An active or paused battle uses the same three native troop buttons as an 88px illustrated roster strip. Names, 10px role/specialty captions, locked/unlocked prices, affordability and food progress remain visible. The food row uses less empty spacing; all orders, warnings, upgrades and Gather stay in their original owners. Labeled navigation is a 44px horizontal row, with secondary-screen boundaries matching it. Short-landscape rail width is clamped from 300 to 340px at 36vw so the arena gains width without adding a menu. Original navy, paper, brass and serif materials are unchanged; no state, save or simulation code changes. Actual same-scene viewport gains and legibility require native screenshots and touch checks. Checked against DESIGN_RULES.md; no design-rule violations found.

## Simple entry and short results (5 October 2026)
The owner prioritizes a clear Home → Play → short result journey over compacting the old dashboard. Home contains only Play/Continue and Settings against the current original chapter illustration. It does not expose deployment, upgrades, navigation or claim prompts. Combat and ambience remain inactive until deliberate entry; Play waits for a ready renderer. Continue preserves a held result and its saved receipt.
Ordinary victory/defeat has one next action plus optional Details and Home. Earnings are already settled; presentation never awards them again. Expedition provision choices stay explicit. The full receipt and existing progression actions remain in deliberate Details during this intermediate slice. Main-play world interaction simplification is still pending; a successful Home alone is not acceptance of the full simplicity goal.
The three-control limit refers to visible UI chrome/buttons. Genuine scene objects may stay directly interactive where legible, with a separate accessibility/discoverability inventory. Do not remove world agency or disguise a menu row as scenery to meet a count. Reference research is in docs/audits/2026-10-05-simple-opening-references.md; source descriptions and promotional images are not claimed as observed first-run sequences.

### Physical field input, current iteration
Use the world as the primary interaction surface: waiting defenders deploy at their real food cost; gate pennants issue actual momentum orders; the standard assembles/releases troops. Selecting an enemy exposes deliberate tactical actions. Preserve authored character art and direct native focus semantics. See docs/audits/2026-10-05-physical-field-plan.md for scope and unaccepted preparation-screen debt.
