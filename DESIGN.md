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
