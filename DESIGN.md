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

### Physical-play save and role cues
Temporary sessions reserve an intrinsic-height row for the existing saving warning; the battlefield and its physical targets share the remaining height. Optional troop-shape markers appear above waiting recruits as well as deployed fighters. This preserves the incoming accessibility preference without restoring a card dashboard.

## Flat Preferences and safe Camp entry (6 October 2026)
Preferences is one paper panel with seven independent native fields: Sound, Atmosphere, Effects volume, Atmosphere volume, Battle speed, Motion and optional Troop shapes. Two compact checkbox/select columns and full-width sliders retain readable labels and 44px hit rows. Three action buttons are Save & recovery, Start over… and Done. Save & recovery is the separate Export / Import / Back surface. Reset keeps Export / Delete progress / Keep progress; import keeps Replace / Cancel. These focused surfaces do not inject an extra close icon. Read-only privacy copy describes game progress only. A persistent saving warning remains beside the fields; input changes retain native focus and do not rebuild the panel.

Pause offers Resume / Settings / Home. Settings Done returns to the Settings control in Pause. Fresh Home has Play / Settings; a ready returning profile has Continue / Camp / Settings; a held live battle has Continue / Leave battle… / Settings. Terminal and pending-receipt Home retains Continue / Settings, including expedition provisions. The explicit Leave battle confirmation names the ordinary loss, retained earned coins and ended current troops before canonical retreat/retry enters ready Camp. Camp starts neither timer nor wave; its Home control leaves preparation chrome behind. The existing Camp catalogue and result Details remain separate unsimplified debt.

Actual prior play is represented by optional schema-5 `played: true`, set only by an accepted Game.dispatch Start. Decoding accepts only exact true; older deployed/kills/wins and held receipts establish history without rewriting those saves. Preferences-only writes never create played history, and deliberate Start over clears it while retaining the existing preferences/daily policy. No combat balance, costs, rewards, grace-day, role recap or physical-field semantics change. This paragraph supersedes earlier two-control returning Home and Settings catalogue descriptions. Source verification is separate from native screenshots, touch, focus, rotation, accessibility and listening acceptance.

## Physical ready Camp, bounded source slice (6 October 2026)
Ready Camp replaces the old resource/deployment/upgrade/nav stack with an illustrated company-at-rest scene. The current army's original landscape, shelter and characters anchor four actual places: storehouse, home gate, company and journal. Small original work props share the existing stone, cloth, ink and brass language. Battle/Home are the only root UI controls; four physical objects are counted separately. Names remain visible and native footprints/focus accompany the illustrations. An intrinsic footer/notice row and scrollable scene fallback replace overlapping fixed navigation.

A local focus owns its input and at most three UI controls including Back. Food/gate views read exact canonical costs, wallet, shortfall and before/after values; bread/repairs use their existing exclusive preparation policy. Troops are inspected/unlocked here, never deployed. Company skill copy follows the actual captain and physical battlefield. No Camp render/open starts time, food, waves, purchases or rewards. Parent-approved temporary handoffs preserve the old advanced Evolution, Chronicle, chapter, Journey, Cards and Quests leaves with explicit return ownership. Those dense leaves and Result Details remain unresolved all-screen simplicity blockers; the temporary routes are not the finished navigation design. Source verification and native visual/touch/accessibility/audio acceptance remain distinct. See docs/audits/2026-10-06-physical-camp.md.

### Returning Home context (6 October 2026 integration)
The once-per-visit welcome line replaces the chapter subtitle on a normal returning Home load. It adds no toast, live status, control or automatic start. Recovery and renderer failure remain authoritative; deliberate Play/Camp, import, reset and session loss clear the transient context. The normalized lastSeen is written on a saved copy only.

## Incoming heavy-hit stop integration (6 October 2026)
An existing main-branch heavy unit hit pauses the battlefield update before simulation for about 50 ms, with a 500 ms eligibility cooldown. Reduced motion remains exempt. This deliberately retains main's frame-quantized pre-step timing, including its ordinary simulation pause, rather than changing combat rules. The stop and cooldown are transient: scene resets, canonical Game/state replacement, nonrunning/paused play, Home/hidden presentation and reduced motion discard them before an early return can delay lifecycle work. The renderer-lifetime webdriver counter remains cumulative. This boundary correction adds no control, profile state or reward path. Checked against the save, ownership and motion design rules; native timing/visual acceptance remains separate.

The renderer visibility callback reads the same field/Camp owner as the presentation CSS. Ready Camp reaches the existing invisible update path, while canonical state, event draining and UI/lifecycle callbacks remain active. Mounting/readiness and resize ownership stay independent of this draw gate. This is a source-level rendering-boundary correction; it does not establish the cause or resolution of the separately observed native animation delay.

## Grounded Camp composition (6 October 2026, candidate)
The four existing places share the lower courtyard plane. Native station buttons contain their own art and names; no unrelated background door becomes a hidden hit target. The journal uses a small transparent painted table, book, quill and lantern, with a retained original and optimized shipping asset. Contact shadows and quieter lower scene placement preserve the chapter landscape, shelter and company. Battle/Home, focus ownership and canonical transactions are unchanged. The Storehouse uses a distinct painted provisioning awning with sacks, crates and jars. An existing painted food accent appears after the first accepted improvement; it does not promise stored food. Original-frame review is still required.

## Focused quest records (6 October 2026)
Quests is one page of the company journal: a native Goal field, one selected record, and Claim/Back. The paper, navy ink and brass seam use the established runtime tokens and Georgia/Trebuchet pair. No new artwork or motion competes with the record. All twelve choices remain in one platform-owned selector: daily, weekly and ten milestones, with readiness/claimed/progress in their labels. The selected page shows exact progress, reward and an eligibility explanation. The selector stays mounted while its details change; claiming preserves selection and returns useful focus to that field.

This replaces only the dense Quests leaf. The Journey catalogue, chapter/Chronicle travel, Cards, Evolution and full result Details remain explicit simplification debt. Their continued reachability is not an all-screen acceptance claim. Checked against DESIGN_RULES.md; no rule override or economy change. Native screenshots, device-specific picker behavior and physical-device acceptance must be reported separately.
The open record follows local midnight/Monday without moving the native Goal field. A calendar mismatch uses the same eligibility text area and status-labeled choice; no new control, toast or clock-repair flow is added. A removed/disabled focused Claim returns focus to Goal. Returning saves retain the established Camp/Journal and result Details/Journey entry routes.

Quest record typography uses root-relative sizes: the normal 16px-root appearance is preserved, while the record, native field, eligibility copy and actions honor 200% root-text settings. The paper dialog keeps its existing body scroll owner; type is never shrunk to fit. The portrait/short-landscape title sizes preserve their original proportions. This is scoped to the new Quests leaf and does not claim that every retained legacy screen has the same text scaling.

## World-first mobile pass (8 October 2026)
The field shows one more edge readout: the food count, top-left opposite Pause, as a non-interactive plate (the resource every recruit tap spends; lane games keep this always visible). Ready Camp names the next journal goal as read-only heading text under the destination ("Next goal: … · see the Journal"), so a returning player always has a visible next goal while Battle/Home stay its only root controls. Place names and the goal sit on the same dark plate, so they read over any painted ground (the contrast audit measured 3.6:1 without it). Camp's retained pages (Evolution, Cards) now use the whole screen instead of reserving bands for the hidden resource header and bottom navigation. Dialogs never pan sideways at 320px, and cancelling a next-timeline preview returns to the result Details it came from.
