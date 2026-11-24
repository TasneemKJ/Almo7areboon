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

## Home scene and tablets (24 November 2026)
Home is one composed scene built only from the field's own plates: the next battle's place (enemyAge's village plate) as the backdrop, and on its courtyard, at the plate's own ground line (68% down, wherever cover puts the plate, kept above the actions), the player's gate for their army's chapter (profile.age shelter) with a contact shadow and a warm pool of its light. No troop sprites on Home (owner trope call, 2026-11-24: the round-nosed figures stay off the first screen; review:home fails if one is drawn). It is read-only and repaints with the save (navigation's syncEntry). The title sits in the sky; a feathered scrim lies only behind the words, never over the scene. Every Home text line is at least 4.5:1 on its worst real pixel at seven phone and iPad sizes in both languages (`npm run review:home`). On a tablet (at least 700x700) Home fills the screen with tablet type (title 60-92px, Play 24px), and the field's HUD, pause and tray grow with it (`src/ui/tablet.css`). The iOS app runs on iPad in portrait, full screen. The app icon is the First Fires stone hut with the company's banner on teal, picked by three blind row tests (store-rework/almo-home-2026-11-24).

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

## Physical field continuity — 8 October 2026

The cover landmark has a native target while Meteor can break it and no living enemy is available to select. Once an enemy arrives, its existing tactical menu supplies Meteor, keeping the two hit regions from competing. The one quiet field cue prioritizes canonical gate danger, first deployment, canonical physical teaching, authored Chronicle mission progress, then ordinary waiting/order advice. Supplies remains the world object; its selected action visibly names Food Drop or the captain's authored replacement ability. Compact Regroup keeps its three decisions and adds the existing state-supported preparation advice beside the earnings assurance.

Visual food/objective progress can update each second. A separate invisible status region announces stable instructions and meaningful changes, so changing digits do not repeatedly interrupt a screen-reader player. These are interface consistency corrections with no new panel, reward, combat rule, save field or claim of measured retention improvement.

## Offline dependency retention (8 October 2026)

A completed installation retains the current battlefield, Phaser and generated audio-worker bundles when obsolete bundles are cleaned up. An older open tab may still request older files; cleanup keeps the current installation manifest and the cached page's dependencies while removing obsolete entries. This repairs returning offline play without changing game mechanics, art, controls, save schema, cache version or deployment policy. Checked against DESIGN_RULES.md; native offline/reload acceptance remains separate from the executable worker regression.


## Tactical clarity and focused card purchase — current review, 2026-10-08

The existing physical field keeps one guidance line. Canonical gate danger precedes onboarding; scarce-food teaching names the available Supplies → Food Drop route; later formation and wave guidance remain visible. Active Chronicle objective text uses the existing authored domain query after immediate danger, food needs and opening skill/formation lessons. In the road route, incoming-wave advice takes priority over generic formation during the canonical eight-second tactical teaching window; other authored mission objectives remain intact. Direct tactical targeting also reaches an intact painted road shelter when Meteor is legal and no enemy is present. The same native target and guarded skill dispatch own it. Supplies presents Food Drop or the captain's actual replacement by name.

Cards uses one native quantity field for 1, 10 or 50 cards, the existing exact gem cost and one Summon action. Choosing quantity does not spend, save or replace the field; the accepted summon still opens its original receipt. Collection limits, odds, card bonuses and currency prices stay canonical. This addresses the approved quantity/purchase slice only; the remaining collection and advanced-screen design debt stays explicit.

Visible field countdowns remain inspectable without a live region announcing each second. One visually hidden status announces meaningful guidance changes, including urgent gate danger. Timing-only changes do not compete with action feedback. No additional visible controls, art, saved fields or audio voices are introduced. English remains the shipped locale; native viewport and physical-device acceptance are recorded separately.


### Reconciled physical field — 8 October 2026

The shelter has one dedicated native target while no enemy is alive, with focus safely returning to Pause when that target expires. The ordinary enemy target continues to own enemy tactics. One guidance resolver keeps immediate and incoming-wave priorities, authored objectives and captain-supply teaching; one separate stable status announces changed meaning. Meteor explains both living-enemy damage and intact-shelter destruction when both apply. Cards, costs, battle balance and save formats keep the already reviewed behavior.

The battlefield Pause control uses two local SVG bars so its visual affordance does not depend on system-font Roman numeral coverage. The native button keeps its 44px target and accessible name.

## World-first mobile pass (8 October 2026)
The field shows one more edge readout: the food count, top-left opposite Pause, as a non-interactive plate (the resource every recruit tap spends; lane games keep this always visible). Ready Camp names the next journal goal as read-only heading text under the destination ("Next goal: … · see the Journal"), so a returning player always has a visible next goal while Battle/Home stay its only root controls. Place names and the goal sit on the same dark plate, so they read over any painted ground (the contrast audit measured 3.6:1 without it). Camp's retained pages (Evolution, Cards) now use the whole screen instead of reserving bands for the hidden resource header and bottom navigation. Dialogs never pan sideways at 320px, and cancelling a next-timeline preview returns to the result Details it came from.

## Opening tale (10 October 2026)
A first launch opens with a nine-second tale between Play and the field: three beats over the chapter's own painted plate, one line each ("At dusk, the valley keeps its lamps lit." / "Across the fields, a rival company marches." / "Gather your company. Hold the gate."). The camera starts on Home's framing, pushes in, tilts toward the far lantern road where the rival column walks down, returns to the plaza where the company arrives and raises its weapons, and hands its remaining motion to the field as the painted layer dissolves. One critically damped spring drives the camera and the dusk veil; there is no overshoot and no filter flash. Reduced motion shows three stills joined by 0.3s cross-fades. A synthesized drone, a short Hijaz motif on D, one or two accents per beat and a soft open chord follow the same beat clock, through the existing Effects and Atmosphere buses; Skip fades them in 0.2s. No video file and no new raster: the plate and walking strips are already shipped. Research and the ranked motion audit are in docs/audits/2026-10-10-opening-tale.md.

## Company cinema — 12 October 2026
The optional one-minute “Those who walk together” film uses existing source-resolution company and settlement paintings, slow layered movement, original indigo standard, restrained dust and a newly composed modal score. English and Arabic exports have individually typeset captions. No persistent watermark competes with the picture. Settings adds one film action; Home remains the same quiet invitation. The established opening now lasts 12 seconds including its handover, with an explicit language selector and existing still mode for reduced motion. This localizes only the opening/film; the game remains English.

### Grounded company cinema (13 October 2026)
The optional film uses one source-coordinate camera for scenery, company and planted standard. Feet belong to the authored road; establishing/valley views carry no unsupported figures. Contact shadows preserve the original painting, and portrait/wide thumbnails share the same placement discipline. Evidence: `docs/audits/2026-10-13-grounded-cinema.md`.

### Waiting company legibility (13 October 2026)
Waiting recruits use a shared48–72 CSS-pixel height bounded by neighbour spacing and combat clearance. Authored sprite, contact shadow and native hit region scale together; small/short layouts preserve the quiet foreground and all existing actions. See `docs/audits/2026-10-13-waiting-company.md`.

## iPhone app: Chapters 4 to 6 and the Lamplighter — owner override (2026-11-13)

Owner override (2026-11-13): the iPhone app (ios/, TasKit) sells two things; the web build sells nothing and stays fully open.

- **Chapters 4 to 6** / «الفصول من الرابع إلى السادس» (`Tas.Almo7areboon.fullGame`, non-consumable, US$4.99; called
  Full Journey / «الرحلة كاملة» through 1.3, renamed in 1.4 so the purchase names the one piece it opens, never "the
  whole game") opens more game, never power: chapters 4 to 6
  and the harder timeline since 1.3 (through 1.2 it also opened chapter 3). Chapters 1 to 3 are the free arc. The gate is asked of StoreKit at the moment of use
  (`src/app/store-flow.ts` `gateEvolution`): choosing Evolve at the end of chapter 2 opens the Chapters 4 to 6 card instead
  of the evolution dialog. Ownership is never written to the save. The card also opens from Settings → Chapters 4 to 6.
  **The gate is generic:** `pastFreeArc` (`src/ui/app-bridge.ts`) asks this one product for every chapter at
  `FREE_AGES` or beyond and for every later timeline, so a future pack needs its own product and its own gate.
  **1.3 (2026-11-15): chapter 3 is free.** Chapters 1 to 3 are the free arc (`FREE_AGES = 3`); the purchase opens
  chapters 4 to 6 and the harder timeline, same product and price. Every "chapter 2" below now reads "chapter 3". The
  free player sees the wall coming: once the company reaches chapter 3, Camp's footer line (the calm line above Battle,
  `camp-screen.ts` `campRoadNote`) says «حراسة الميناء آخر الفصول المجّانية…» / "Harbor Watch is the last free chapter…",
  and after chapter 3 is won that the free chapters stay to replay and what the purchase opens next. Text in the scene,
  no dialog and nothing to tap; owners and the web keep the usual line. Saves written by 1.2 load unchanged.
  **1.1 (2026-11-13):** a save already past chapter 2 (imported, pasted or from the web) no longer keeps playing where
  it is; that let an import walk around the purchase. It is *held*: `gateStart` (asked in `lifecycle.ts` `action`, the
  one way into a battle) opens the card instead of starting while the chosen battle, the army's chapter or the timeline
  is past the free arc and StoreKit has not said Chapters 4 to 6 is owned. The save is never clamped or rewritten, in
  memory or on disk, so a late StoreKit answer, a Restore or a purchase opens exactly what was imported. The card says
  so, can be declined, and offers "Play the free chapters" (a battle choice back to chapter 2) when the save's own army
  is still a free one; the import dialog warns before a playable save is replaced by a held one. Storybook routes and
  expeditions choose a battle too, so they ask `gateBattle` like the battle list.
- **The Lamplighter** (مُشعِل القناديل), one auto-renewing group: `Tas.Almo7areboon.lamplighter.monthly` (US$1.99) and
  `.yearly` (US$14.99, level 1, ranks above monthly). Its one benefit is light, a presence and not power: while a plan is
  live, an old lamplighter lights a row of three hanging lanterns behind the player's gate at the start of every battle
  (`src/view/gate-lanterns.ts`, the scenery's own lantern motif and lamp halo). They have no hitbox and change no number:
  no food, coins, gems, speed or strength. Chosen because Almo7areboon has no offline earning to extend (Souq's Night
  Keeper, Al-ejar's long rounds); the brief allows a gentle presence in that case. Off the app he never appears.
- Both cards say what they open or bring before paying, show the App Store's own price isolated left to right, carry
  Restore purchases, Terms of Use (Apple's standard EULA) and Privacy; the Lamplighter card states both lengths, the
  auto-renew and cancel line, and offers Manage subscription (Apple's sheet) while subscribed. Both languages.
- Copy that said "nothing else to buy" now says "Bought once and yours to keep".
- **Journey path (council, 2026-11-13):** the entry shows six lamps under the chapter name (where you are of six). In
  the app, once the player has won a battle and while Chapters 4 to 6 is not owned, chapters 4-6 are a dashed stretch with
  "Chapters 1–3 free · 4–6 with one purchase" (1.4; 1.3 said "with Full Journey", earlier 1–2 and 3–6), which opens the card. Never before the first win, so the store is not
  the first thing a new player sees.
- **Touch and sound on every press (studio gate):** a short Taptic tap (navigator.vibrate, mapped to the Taptic Engine
  by TasKit; iOS's system haptics setting governs it) and a soft wooden tick when sound is on; recruits a firmer tap
  and their own deployment cue.
- **Arabic typography:** no letter-spacing on an Arabic page (it breaks the joined script in WebKit); selects are drawn
  by the game at 44px with the caret on the end side; clock times in the page language with Western digits.
- **Settings** names the version and the studio and, in the app, links Support and Privacy (Terms sit on each card).
- **Age rating:** honest 9+ (mild cartoon/fantasy violence), not 4+; see ios/store/listing.json.

## 1.1: counsel after defeat, a lit place in Camp, a postcard home (2026-11-13)

Studied, not copied: Kingdom Rush (a defeat sends you back to the upgrade tree, so a loss reads as "spend, then
return"), Kingdom Two Crowns (no tutorial text; the world shows where coins go), Bad North (a short, quiet meta between
fights), Rush Royale (lane pacing: losses come from income falling behind wave tempo, not from tap speed). What we took
is the timing of each lesson; how it looks and speaks comes from this game.

**Why chapter 2 was a wall (measured, `scripts/qa-gate/chapter2-sim.ts`, 40 seeded players per row).** A cold player
who only presses Retry: 0.75 taps/s wins chapter 2 0% within 6 tries; 1.5 and 3 taps/s win on try 1. Spending the
~560 coins from chapter 1: on food, wins on try 2 (0.75 taps/s); on troop unlocks or the gate alone, 0% in 6 tries.
So the wall is food income against wave tempo; the money to fix it is already in the player's purse, and the old advice
(unlock ranged first) pointed at the one purchase that does not help. No wave or balance number was changed.

**Counsel (`src/game/counsel.ts`).** One read-only answer to "where should I go in Camp now": four levels of bread, two
of gate, then a waiting troop, then food up to three ahead of the gate. Following it: chapter 2 is won on try 1 at
0.75/1.5/3 taps/s (40/40 each); following it only after the first defeat, on try 2 (40/40). The Details advice uses the
same order.

**Defeat card.** When counsel exists, the primary button is the place, not Retry: "To the storehouse" / «إلى المخزن»,
under one line in the village's voice, «لم تنقصك الشجاعة، نقصك الخبز: جاءت موجاتهم أسرع من مؤونتك» ("Courage was not
short; bread was"). It retries into ready Camp with that place open; it never buys. Unique to us: the reason is said in
the journey's own nouns (bread, the home gate, a troop waiting by the fire), Arabic first.

**Camp first visit.** The counselled place carries the village's Levantine lantern (the same motif and colours as the
scenery's lanterns: ink hanger, brass #c7a773, warm glass #ffdc92), its name plate turns brass; the other places step
back (still tappable) and the journal's daily line waits until nothing is worth doing. One obvious action; the rest is
revealed as it becomes relevant. It is the village's lamp, deliberately not the Lamplighter (he is paid presence and
must never carry teaching).

**Postcard home.** In the app, a won result offers "Send a postcard home" / «أرسل بطاقةً إلى الديار»: a 1080x1350
PNG of the chapter's own painted plate, the lantern, «المحاربون», «نصرٌ في …» and the chapter's line («آخر القناديل
فوق الحقول.»), English beneath, through TasKit `share(dataURL)`. A letter from the road, written Arabic first: no
It is a quiet line, not a fourth big choice; hidden on the web.

**Scope (after review).** No counsel while evolution is affordable (it would wipe what the lantern points at). The
lantern only in the free chapters; a ready daily reward is never hidden. The defeat card names a cause only where it
was measured (chapter 2, gate fallen); elsewhere it only points. Inside the lit storehouse a line keeps the lamp lit
while another level is worth it, so one visit buys enough bread (the sim needs 3+ levels; 1 level wins 0% by try 2).

**Browser bot (`cold-bot.mjs`, WebKit 390x844, 15 min).** At b5c0443 the bot no longer deployed at all (the tray cards
carry only `data-unit`); fixed in bed9458. With that fix the exploring bot taps every control in Camp, buys four food
levels on its own and wins chapter 2 on the first try in both the old build (b5c0443: wins at 50 s and 172 s) and the
new one (en 50 s / 187 s, ar 50 s / 201 s; 0 stuck states). So the bot cannot tell the builds apart; the discriminating
evidence is the rules sim above (counsel-following slow tapper 0/40 -> 40/40). Both builds then loop on the won chapter 2
card: Continue opens Full Journey, Close returns to the same Continue (TODO).

**Paywall.** Unchanged in this pass: Full Journey still first appears after a real win at the end of chapter 2. With the
wall gone, a cold player now reaches it as a reward moment (Kingdom Rush's model: the offer follows a win, never a
loss) instead of after a string of defeats.

## 1.1: names that belong to this tale (2026-11-13)

An outside audit read the battle screen as a copy of a well-known era-evolution lane battler; the loudest tells were a
unit called "Dino Rider" and the borrowed vocabulary of ages and evolving. Names and copy only changed: no mechanic,
number, command id, save field or art.

- **Lizard Rider / فارس الضبّ** (was Dino Rider / فارس الديناصور). The First Fires heavy is painted as a man on a green,
  spotted lizard. The Levant's own desert lizard is the dabb (الضبّ, the spiny-tailed lizard), drawn storybook-large as
  folk tales draw their beasts; no dinosaur belongs to a valley of first fires and olive terraces.
- **Move camp / انقل المخيّم** (was Evolve / ارتقِ). The company does not evolve through the ages of mankind; it breaks
  camp and walks on to the next place of the tale. It also explains the rule the old word could not: a new camp starts
  from nothing (coins, storehouse, gate and troop unlocks reset) while what the company carries (cards, gems, seals) comes
  along. (Since 2026-11-14 the troops who joined and the coins left after the price come along too, and only the
  storehouse and gate are built again: see "the free path and the smith" below.) The confirm button reads "MOVE CAMP TO <PLACE>", the decline "STAY IN THIS CAMP".
- **The Road / الطريق** (was the Evolution page). The page already showed the six places in order under "Through the
  Levant", and the store card already said "The road goes on".
- **Camp** replaces "age"/"era" wherever the player's own stage was meant ("camp upgrades", "first camp", "THE LAST
  CAMP", "YOUR COMPANY. YOUR ROAD." for "YOUR ARMY. YOUR ERA."). Chapters were already named for places (First Fires …
  Courtyards Beyond) and stay. The page title "Through the Ages" is "Through the Levant" (عبر بلاد الشام), the line
  The Road already carried.
- **Kept on purpose:** the other troop names (Pathkeeper, Fieldhand, Quay Guard, Gatekeeper …) are the game's own; the
  internal tables (`src/game/data.ts` era and unit keys, `visual-theme.ts`) never reach the screen and keep save and test
  compatibility. "Timeline" (the harder replay) is unchanged.
- **Open, reported to the owner:** the card names in `src/game/cards.ts` (Dino Ribs, T-Rex Head, Trojan Horse, UAV-3.0 …)
  follow the reference game's card list and each has its own illustration, so renaming them is an art decision, not a
  copy pass. (The store description no longer names cards the game does not have; fixed 2026-11-14.)

**The lock on Move camp (same release).** In the app, while the next chapter is behind Full Journey, the control shows a
lock and the App Store's price instead of a coin cost, is never disabled, and opens the existing card (declinable; it
returns to where it was opened and never reopens by itself). The line under it says both costs plainly: Full Journey
once, then the coins. Owners, the free first move and the web see the coin cost as before.

## Store compliance (2026-11-14)

No narration, ever shipped or planned: the ElevenLabs free plan grants no commercial licence, so the opening tale and both films stay captioned with the procedural score. The store presents the game as a folk-tale lane battle across eras (subtitles «حكاية معارك من زمن الحكايات» / "Battles from a storybook age"), answers guns or other weapons honestly as infrequent/mild, and names no card the game lacks. No rule, number or save changes.

## Backlog from random stimulus (2026-11-14)
- **The Hakawati's Night (ليلة الحكواتي):** each battle is told live in a café; the player is the storyteller. The audience reacts in fusha with gentle humour («لا! ليس الفارس!»); their cheers give a short morale boost. Limited storytelling turns per chapter (each unit sent is a decision). A dabke formation: units walking the lane linked shoulder to shoulder fight better; breaking the line costs. Gives identity beyond the Age of War lane formula. Comparables: Age of War (lanes), Darkest Dungeon (narrator), Slay the Spire (every choice counts).

## 1.3: lead the company in the field, not from a panel (2026-11-14)

Owner direction: a battle must feel like play, not an app with menus and buttons. At 390x844 the bottom third of a
battle was a control panel: a momentum bar, Advance (+20% strike) and Hold (−25% damage) buttons, three troop cards, a
food line and a Gather button. The core verb, leading the company, now happens in the painted field.

**Studied, not copied.**
- *Clash Royale* keeps a short hand of cards along the bottom edge: portrait plus cost, nothing else, so the eye stays on
  the arena. We keep our three troop cards for the same reason (deploying is genre-standard and fast) but slim them into
  painted tokens on the field's own wooden board edge: a medallion portrait, the name, the cost, a brass rim when
  affordable and a thin brass line filling with food. No role captions, no meter row, no second strip.
- *Kingdom Rush* lets you rally troops by touching a flag on the map: the order is a place in the world. Ours is the
  company banner (the game's own painted standard, `interface/standard.webp`, cut from the shipped icon atlas at full
  resolution), planted in the field in front of the waiting company. Drag it forward, toward the rival gate, to Advance;
  drag it back toward your gate to Hold. It stays where it was carried while the order runs, leaning into the push or
  planted upright, and throws a small pool of gold (Advance) or lamp-teal (Hold) light on the ground.
- *Monument Valley* teaches by direct manipulation: the thing you touch moves, and its movement says what it does. The
  banner follows the finger a bounded 72px, a plate beside it names what releasing will do ("Advance · +20% strike",
  "Hold · −25% damage", or "needs 60 momentum"), and the neutral zone (under 36px, or a mostly vertical drag) plants it
  back with nothing spent. A tap shows both plates once.

**How ours is its own.** Momentum is not a bar but the banner's cloth: as deploys and kills earn it, the painted cloth
lights outward from the staff (furled-dark to full colour), and four brass rings on the staff count the quarters (a cue
that does not depend on colour). At 60 the cloth is full, glows brass, stirs, and two brass chevrons at its foot say it
can be carried. During an order the lit cloth burns back toward the staff with the ten seconds. Gather is a tap on your
own camp, the gate shelter where the gathered company waits, with a small paper sign ("Gather" / «اجمع», then
"Release 3/6" / «أطلق 3/6»). The old order pennant at the gate is no longer drawn in the field; there is one flag.
Forward means world +x (the rival gate is always on the right), never reading direction, so Arabic and English carry
the banner the same way.

**What did not change.** The order is still admitted and applied only by `issueBattleOrder`: 60 momentum, 10 seconds,
Advance ×1.2 strike and ×1.15 pace, Hold ×0.75 damage taken, one order at a time, nothing while paused. No balance,
save field or reward changes. Food stays on the plate at the top-left of the field; Pause is the one corner control.

**Accessibility.** The banner is `aria-hidden`; the native Advance and Hold buttons remain in `#order-banner` as
visually hidden proxies with full labels (effect, cost, duration, momentum), reachable by VoiceOver and the keyboard,
and they appear above the board when focused. The camp target is a native button with a live label. The banner and the
camp are at least 44px; `touch-action:none` is on the banner only, so short screens still scroll.

**Measured** (scripted competent player, WebKit with touch, 390x844, first three minutes of chapter 1, same policy on
both builds; `docs/audits/2026-11-14-field-play.md`). See the audit for the numbers and their limits: deploying stays a
card tap by design, so most taps still land on the board (world share 5.4% -> 20.7%, field plus board 79% -> 95%, other
DOM taps 19 -> 4-5, visible battle controls 7 -> 4); every order, Gather and Supplies input now lands on the field.

Checked against DESIGN_RULES.md (mobile first, combat clarity, teach by playing, accessible by default, saves sacred).
The 2026-11-13 owner play-test rule "nothing invisible takes a tap" holds: the banner, its chevrons and the camp sign
are drawn; the old invisible gate and recruit hit areas stay off.

## Backlog from random stimulus (2026-11-14, round 2)
## Backlog from random stimulus (2026-11-14) — add to Almo7areboon DESIGN.md after the compliance agent finishes
- **The Hakawati's Night (ليلة الحكواتي):** each battle is told live in a café; the player is the storyteller. The audience reacts in fusha with gentle humour («لا! ليس الفارس!»); their cheers give a short morale boost. Limited storytelling turns per chapter (each unit sent is a decision). A dabke formation: units walking the lane linked shoulder to shoulder fight better; breaking the line costs. Gives identity beyond the Age of War lane formula. Comparables: Age of War (lanes), Darkest Dungeon (narrator), Slay the Spire (every choice counts).

## Random stimulus #9 (2026-11-14): «الخصم يتعلّم»
Comparables: Age of War (fixed AI), Kingdom Rush (scripted waves), Clash Royale (human opponents adapt). Ours: a folk rival chief who copies you, alone and offline.
- If the player sends the same card 3 times in a row, the enemy chief adopts it the next wave, shown in the world: his banner gets the same emblem, and a line appears once: «أعجبته فكرتك. سينفّذها أسوأ منك، لكن بعددٍ أكبر.» This stops one-card spam, rewards variety, and adds a mid-chapter difficulty step without bigger numbers.
- Second idea: veterans keep their names. A unit that survives 3 battles gets a folk name, and if it falls, its name is stitched onto your banner. This adds real loss, and subscribers get extra stitch colours. (Cosmetic, worth keeping.)
Next: add it after the 1.3 "play not menus" agent lands. Make it one rule in the enemy wave picker, tested with a 3-in-a-row spam replay.
- **Valley fog (ضباب الوادي), random stimulus #16:** some battles open in morning fog drawn as layered storybook washes. You see only as far as your own banner; the rival's cards arrive as shapes and sounds before they have faces. A cheap scout card (a boy with a lantern) walks ahead and thins the fog in a circle for a while. The fog lifts with the sun mid-battle, so the first minute is a guess and the rest is a fight. Punishes spamming one card blind, rewards reading sounds (horses, drums). Dry line from the hakawati: «في الضباب، كلّ شجرة جيش، وكلّ جيش شجرة».
- **The drummer (الطبّال), #16b:** your drummer stands behind the banner and sets the troops' pace. Enemy archers aim for him; if he is hit the beat falters and your line slows until you tap the drum yourself in the world, on the beat, to rally. Protect him or carry the beat by hand.
- Comparables: Clash Royale (lanes, cards), Kingdom Two Crowns (dread of what the dark brings), Darkest Dungeon (the light radius). Ours: fog and sound as a storybook mood, and a beat you keep with your own finger.

## Backlog from random stimulus (2026-11-14, round 3)
## #22 (random-stimulus) «المحاربون القدامى»
A unit that survives three battles earns a name and a small painted mark (a bandaged arm, a notched shield) and walks out a little stronger. Lost, it is gone: its card returns plain, and the hakawati gives it one line at the campfire («كان يكره المطر، ومات في يوم مشمس. لم يُرضه شيء قط»). Wounded veterans rest a night by the fire; the lamplighter (subscription) tends them so they are ready by dawn. Spending veterans recklessly hurts; protecting them is the skill.
Comparables: XCOM (named soldiers you grieve), Darkest Dungeon (scars), Clash Royale (card levels). Ours: stakes told by a storyteller, not a stat sheet.

## #22b «الجسر الخشبي»
Some valleys have a wooden bridge across the middle lane. A torch card burns it, cutting that lane for both armies for the rest of the battle: a tempo trade drawn as orange storybook flames.
- **The lost child (الطفل التائه), random stimulus #28:** once in a while, mid-battle, a village child wanders onto the field between the two armies, chasing a goat. Both lines slow and lower their weapons while the child is in the lane (a storybook hush; the drums stop). Drag the child back to your camp (a careful drag; the goat follows or doesn't) and the next village you reach greets you: one card is cheaper for that chapter, and the hakawati tells it at the fire. Ignore it and the rival may escort the child instead and win that village's favour. Never harmed, never a target: a pause that tests whether you keep your head. Line: «توقّفت الحرب دقيقة من أجل عنزة. كانت أفضل دقيقة في اليوم».
- **Seasons on the field (فصول الوادي), #28b:** winter snow slows riders; summer noon drains momentum unless your camp has water; autumn leaves hide traps.
- Comparables: Kingdom Two Crowns (villagers to protect), Clash Royale (lane tempo), Frostpunk (a moral pause inside pressure). Ours: mercy as a tactic, told by a storyteller.
- **The banner raid (خطف الراية), random stimulus #34:** the rival's banner stands behind his camp. Any one of your fast cards can be sent on a raid instead of into the line: drag the card along the far edge of the field (a dotted storybook path) rather than onto the lane. The raider is alone and fragile; if he reaches the banner and carries it back to your camp, the battle ends at once in your favour with a "banner taken" page in the hakawati's book. If he falls, that card is out for the rest of the battle. A comeback that rewards timing (raid while his line is busy), never a guaranteed win. Hakawati: «لم يكن أسرع الرجال، لكنّه كان الوحيد الذي لم ينتبه أحد إليه».
- **The echoing canyon (الوادي المردِّد), #34b:** in narrow canyons every drum and horn echoes twice; the rival's arrivals sound early and late, so reading sound (from the fog idea) becomes reading the true sound.
- Comparables: Clash Royale (lane tempo), Kingdom Rush (hero raids), Battlefield-style flag capture (objective over attrition). Ours: one brave runner told as a legend.
- **The eve feast (عشاء ليلة المعركة), random stimulus #40:** the night before a chapter's big battle, the camp gathers round three fires (one per troop kind). Drag loaves from the food basket to the fires: a fed fire's troops start the battle with a little momentum and sing (a short dabke at dawn); an unfed fire is quiet and its troops start tired. But every loaf eaten tonight is one fewer troop you can deploy tomorrow. The hakawati, chewing, makes one vague prophecy about tomorrow that is half true. Line: «الجيش يمشي على بطنه، والحكواتي يمشي خلف الجيش، على بطنه أيضًا».
- **The doubtful soldier (الجنديّ المتردّد), #40b:** when morale is low, one troop may stop mid-lane and turn back to camp; ringing the camp bell (tap) at the right moment brings him back with a shamefaced wave.
- Comparables: Darkest Dungeon (camping before a fight), Kingdom Two Crowns (feeding your people), Clash Royale (elixir trade-offs). Ours: tomorrow's army is decided tonight, by bread.

## #46 (random-stimulus) «طبول الخصم» — stimuli: an echo in the valley · a shepherd's reed pipe · "an enemy you cannot see"
- **The rival's drums (best).** A drummer stands on the far hill, behind the enemy gate, and before each wave he beats out its make-up. Slow, heavy beats mean riders. Quick, light beats mean throwers. A long silence means something worse. The player who listens, or watches the drumsticks and the sign on his banner (for players with the sound off), deploys the counter before the wave arrives, instead of tapping the first card blindly. It turns the battle from a race of spending food into reading and answering, which breaks the "spam the first card" problem directly. Later, a quiet chapter: the drummer is killed, and the battle is fought blind. Text: «سكتت الطبول. هذا أسوأ من قرعها.» / "The drums went quiet. That is worse than the beating." Comparables: Into the Breach (the enemy telegraphs its move), Clash Royale (counter-play), Crypt of the NecroDancer (reading rhythm). Take the craft, not the content.
- **The reed pipe of retreat.** A shepherd on the hill plays a short tune when the player's company is about to break. It is a warning in the world, not a red bar.

## #51 (random-stimulus) «غارة الغسق» — stimuli: a sundial · a broken lute string · "win without killing"
Comparables: Kingdom Two Crowns (night pressure, light as safety), Stick War Legacy (lane battles), Age of War. Ours stays ours: light is information, not power.
- **Idea:** the Lamplighter (subscription) lights the wall's lamps, which opens one extra battle each day at dusk. Only ground under lamplight shows enemies; the rest is shadow and footsteps. The player places three lamps before the fight, and where they go is the strategy. No stronger units and no pay-to-win: the subscription adds a different, harder fight every day, plus its own dusk banner on the village wall.
- Free players see the unlit lamps on the wall and one lit dusk battle as a free sample (once).
- Line on the first dusk: «القناديل لا تقاتل، لكنها تفضح من يتسلّل.»
- Second idea (backlog): «الراية». A battle can also be won by seizing the enemy banner (a fast unit runs the lane) and ending it without a rout; captured banners hang in the village as a collection (meta).
- Why: fixes the Lamplighter being cosmetic only (PENDING #10) with a renewable daily challenge, and makes dusk the game's most atmospheric moment.


## #60 (random-stimulus) «سيوف المعركة المكسورة»: stimuli: a broken sword · a mule caravan · "the army remembers every loss"
Fixes Almo's lowest dimension: pay-to-progress. Coins need a sink that a free player can afford, and chapter 6 needs a free path to it.
- **The smith reforges what the battle broke (best).**
  - After every battle, won or lost, one or two broken blades lie on the field where your troops fell. Tap them to carry them home.
  - At the village smith «الحدّاد», coins reforge a blade into a named weapon. The name comes from that battle: «سيف الجسر الخشبي», «رمح ليلة الغسق».
  - Hang it on one troop kind for a sidegrade, never a straight upgrade. For example, riders hit first but turn back sooner; throwers reach further but throw slower.
  - At most three hang at once; the rest hang on the smithy wall, which becomes the keepsake collection.
  - Losses now produce something, which softens the defeat streak without a label. Coins get a sink that earns identity rather than power.
  - The free path through chapter 6 is real, because blades come only from battles, not from the shop.
  - Hakawati: «السيف المكسور يعرف عن الحرب أكثر من السيف الجديد.»
- **The Thursday caravan «قافلة الخميس» (backlog):**
  - Once a week a mule caravan rests at the village gate with three offers for coins: a rare temper for one blade, a banner colour, a song for the eve feast (#40).
  - It is gone next week, so it is a weekly reason to come back. It never sells troops or food for money.
  - The Lamplighter sub sees the caravan a day early, which is cosmetic timing and not power.
- **Comparables:** Darkest Dungeon (heirlooms from expeditions), Slay the Spire (relics as sidegrades), Kingdom Rush (the upgrade smithy). Ours: every weapon is a memory of a named battle, told by the hakawati.

## Shipped 2026-11-14 (audit #1 fixes)
- **Battle 2 wall.** The Regroup card's one primary (`data-primary`) returns to the camp scene, where the lit place carries its act on a lamp-lit plate (bread first, five levels, then the gate, then the Thrower). Lit in the free chapters, and later only while a defeat streak is live. A defeat with coins to move camp makes Move camp the primary. Battle 2 eases for a lone company (waves a tenth later).
- **The pacing director.** After two fallen gates in a row the next battle quietly thins the rival's later waves, weakens them a tenth and starts with 5 more bread; each further defeat adds a step (up to three); a victory ends it. No label. Checked by `scripts/qa-gate/streak-sim.ts`.
- **The world answers taps.** A tap on the open field plants the banner: the rival's half Advances, your own half Holds; short momentum makes the banner lean and name what is missing.
- **First launch** opens on the live field with one line of the tale; the whole tale is in Settings › Watch intro.
- **#51 «غارة الغسق», first slice.** Wall lamps in Camp after the first victory. Lit (once a day with the Lamplighter, once ever as a sample), they open a dusk raid: three lamps hung by tapping the field, raiders seen only in their light, one more melee raider per wave. It pays nothing and moves no road; the profile keeps only the day stamp. Not yet: the dusk banner keepsake on the village wall.

## Shipped 2026-11-14: the free path and the smith (#60, first slice)
- **Measured first** (`scripts/qa-gate/free-path-sim.ts`, a player who never buys, by the rules, to the chapter 6 win;
  12 seeds). No run of more than 3 defeats and no step that needed coins the player had not earned, but from chapter 3
  on no first try was ever won, every chapter was won only after the pacing director thinned the rival, and 46-48M
  coins sat idle at the end. Cause: a moved camp arrived with one troop and an empty purse, and the lamp stayed dark
  after a win. In the app, Full Journey still opens chapters 3-6 (owner decision, unchanged); the sim plays the rules.
- **The company walks on together.** Move camp keeps the troops who joined and the coins left after the price; only
  the storehouse and the gate are built again (a new camp's prices are eight times higher, so the purse buys about an
  eighth). The village lamp also lights in a camp just moved, until five levels of bread. Following the lamp: 15.1 ->
  13.3 battles to the end for a first-card tapper, 14.7 -> 8.5 for one who sends its troops in turn; the second player
  wins chapters 3-6 without the director. A player who never opens Camp is still carried (worst run 3).
- **Broken blades.** After a battle, one blade (a victory) or two (a defeat) lie where the company's troops fell: the
  fall furthest forward, then the latest of another kind. A tap carries one home. The result waits up to 3.5 s while
  they lie and comes 0.45 s after the last is carried; uncarried blades stay on the ready field and are left behind
  when the next battle starts. A defeat's Regroup leads to Camp, so while blades lie there Camp's Battle opens the
  ready field (its own Battle button starts the fight) instead of starting at once. The hakawati's line rests over the field: «السيف المكسور يعرف عن الحرب أكثر من السيف
  الجديد.» A battle nobody fell in: «لم يسقط أحد، فلا شيء يُحمل إلى الديار. سيشعر الحدّاد بالملل الليلة.» A dusk raid
  drops nothing.
- **The smith «الحدّاد»** (plate «أصلِح»: a plain verb, so no word of ط-ر-ق stands beside the game's «الطريق») has his corner by the village houses in Camp, opposite the wall lamps, once a blade is home:
  the wall of kept weapons, a beam with three hooks (one per troop kind) and the forge (anvil, brazier, the broken
  blades by it), drawn in code in the camp's ink and brass (`src/view/smithy-art.ts`). Tap the forge to reforge the
  oldest blade (400 coins times the camp's scale) into a weapon named for its battle: «سيف النيران الأولى», «حربة
  مدرّجات الزيتون», «رمح حراسة الميناء». It hangs on an empty hook of its kind, else on the wall. Tap a hook to hang
  the next weapon of that kind from the wall, or take the hung one down. The forge stays cold while the village lamp
  is lit elsewhere («النار تنتظر. الخبز أوّلاً، ثم الحديد.»), so it never takes bread money. Wall label: «السيوف على
  هذا الجدار لم تعد تقاتل، لكنها لا تنسى.»
- **Sidegrades, never upgrades.** A hung weapon tempers its own troop kind: one number better, one worse. Swords:
  harder and slower, or quicker and lighter. Javelins: further and slower, or quicker from closer. Lances: arrive first
  and fall sooner, or hold longer and arrive later. A blade won in victory keeps its edge; one carried from a defeat
  learned patience. With reforging free, the sim's outcomes stay within noise of no smith (identity, not power); paid
  for, it costs about half a battle over the whole road. The sink is shallow: with the purse now travelling, coins idle
  at the chapter 6 win rose (48M -> 57M for a first-card tapper, 62M -> 75M for one who sends its troops in turn), and
  reforging everything takes back only 2-9M of it. The day-7 plateau (week-sim) is not measured again here.
- **Save:** `smithy {next, blades, field?}`, optional and normalized on load; it survives Move camp and a new
  timeline, and Start over begins without it. At most 60 blades: a full smithy gives the oldest blade still waiting by
  the anvil (else the oldest weapon on the wall, never a hung one) to the village, so a tap on the field always carries.
- Not yet: the Thursday caravan «قافلة الخميس»; a sign of the hung weapon on the troops in battle.

## #66 (random-stimulus) «القائد الذي يتعلّم» — stimuli: a shadow-puppet theatre (خيال الظل) · a broken compass · "what if the rival learned from you?"
- **Best idea: the rival captain who learns.** Each chapter's rival keeps a small notebook on you. It watches the troop you send most and the lane you favour, and two battles later it answers: pikes for the Pathkeeper spam, a flanker on the lane you always leave open.
  - Before each battle the camp shows one torn page from his notebook, in his own voice: «يرسلون حرّاس الدرب أوّلاً، دائماً. سنستقبلهم بالرماح.»
  - The player now plays against a habit, their own. Mixing troops and lanes is rewarded, and the "first-card tapper" the free-path sim found stops winning on the director's help.
  - Difficulty becomes readable: the page is the warning, so a loss is never a surprise.
  - The Lamplighter subscription lights the page a battle earlier (one more turn to change), never the rival's whole plan.
  - Comparables, learned from but not copied: Slay the Spire (visible enemy intent), Into the Breach (the warning before the move), Clash Royale (counters). Almo's rival is a person with a notebook in a folktale, not a deck or an AI read-out.
- **Second idea (backlog): the shadow-puppet night.** After a chapter's win, the camp holds a shadow-puppet show (خيال الظل): the battle you just won retold in silhouettes drawn in code, with your company's actual troops and the smith's named weapons, and the rival's notebook burnt in the last scene. It is a keepsake for the chronicle, and it gives the Full Journey's later chapters a reward you watch, not just a number.
- Sim note: in the free-path sim, the first-card bot should lose its first try in chapters 3–6 more often with the learning rival. The in-turn bot should be unchanged (±1 battle), and no player should need the pacing director's rally to win after a counter is shown.

## #73 (random-stimulus) «الدلو الأخير» — stimuli: a well rope · "win before the tea goes cold" · a flock of cranes
- **Best idea: the last bucket (drought chapter, Full Journey 4–6).** The camp well gives water for only three of the company's five troop kinds. Before each battle the player drops the bucket by hand and chooses who drinks: watered troops march at full pace, the thirsty march slower in the first wave.
  - The folktale voice asks it plainly: «في البئر ماءٌ لثلاثةٍ من خمسة. مَن يشرب قبل المعركة؟»
  - It pairs with #66: the rival's notebook page says pikes are waiting for the Pathkeepers, so you water the archers instead. One readable decision, made against a visible threat (pillar 1).
  - The camp remembers (pillar 2): a troop left thirsty twice in a row says so at the fire in one dry line, and drinks first by itself next time unless you take the rope.
  - No purchase or subscription adds a bucket or fills the well.
  - Comparables, learned from but not copied: The Banner Saga (caravan supply), FTL (triage of a scarce resource), Kingdom Two Crowns (resources you see in the world, not on a HUD). Almo's version is one rope and one well in a folktale.
- **Second idea (backlog): the teapot on the hill.** In a boss battle a teapot steams on a stone at the field's corner; when the steam stops, the rival's horn calls his reserve. It is a clock you read from the world, with no timer bar, and it rewards a decisive plan over waiting.
- Sim note: in the free-path sim, the bot that waters the troops the rival's page names should beat the bot that waters at random by at least one battle per chapter. If the two bots tie, the choice is cosmetic: cut it.

## #79 (random-stimulus, 2026-11-15) «سطرٌ واحد»: stimuli: a coffeehouse storyteller (الحكواتي) · a ripple spreading on a pond · "the first minute may hold one sentence"
This targets Almo's lowest dimension on the scorecard: text density in the first 30 seconds (the strip at 06:5x shows the guide line changing about every 6 s). Comparables: Kingdom Two Crowns (taught with no words), Journey (the world shows the way), the first battle of Clash Royale (one hand, one arrow). Ours stays ours: the storyteller speaks once, and the battle teaches the rest; his words come after, in the chronicle.
- **Idea (best): one sentence, then the world teaches.**
  - The first battle opens with the storyteller's single line and nothing else: «كان يا ما كان، في وادٍ بعيد، قريةٌ لا تملك إلا بابها.»
  - From then on the battle teaches without words:
    - the food sack breathes with a warm glow when a soldier can be paid for;
    - a ripple spreads on the field where a tap would send him;
    - a horn from the far hill and a dust cloud on the road say a stronger wave is coming;
    - the gate's stones darken and crack when it is hurt.
  - The lines the guide says today move to after the battle: the storyteller tells what the player did, in the chronicle. «أرسلتَ ثلاثةً قبل أن يبلغ الغبارُ البوابة. ثبتوا.» The teaching becomes the story's memory, not instructions.
  - Lines return only for a player who stands still: if nothing is sent for 8 s, one short line appears and then goes.
  - **Check:** the first-30 strip shows at most 2 text changes (from about 5), the time to the first soldier is no slower, and a new-player bot sim wins battle 1 at least as often as now.
- **Second idea (backlog): the ripple as a skill.** Later chapters keep the ripple, but it shows only where a troop would arrive in time. Reading it well becomes the skill, so the hint does not become a crutch.

### #79 shipped (2026-11-15)
The first battle (chapter 1, first timeline, never won) opens with «كان يا ما كان، في وادٍ بعيد، قريةٌ لا تملك إلا بابها.» and nothing else; the world teaches (the food sack glows, a ripple where a tap would send, dust and a horn before a stronger wave, the gate's cracks); one short line returns after 8 s with nothing sent; the storyteller's chronicle on the result carries the lessons in lines that name the troops and the village, never the player. First-30 text changes 13 -> 1 (EN; 14 -> 1 AR), first soldier 2.2 s both, battle 1 won by every simulated new player before and after (scripts/qa-gate/battle1-sim.ts).

## #86 (random-stimulus, 2026-11-15) «طقس الوادي»: stimuli: a weathervane on the gate tower · morning fog over the river · "the battlefield remembers"
Comparables, learned from but not copied:
- Into the Breach: every threat readable before you act.
- Bad North: wordless tactics on a small map.
- Kingdom Two Crowns: weather felt, never explained.

Ours stays ours: the valley has one weather per battle, read from the world alone, in the folktale's quiet. #79 taught with the world; this keeps teaching.
- **Idea (best): the valley's weather.** Each battle from chapter 2 on has one condition, shown only in the scene. Reading it is the battle's decision (pillar 1).
  - **Wind:** the banner on the gate tower and the smoke from the chimneys lean one way. Arrows and thrown stones carry further with the wind and fall short against it, so the Throwers are strong on a downwind day and weak upwind.
  - **Fog:** it rolls off the river at dawn. The rival's company is seen only by their lanterns until close, so the player counts lanterns to guess what is coming. Riders lose their charge in fog, while Pathkeepers hold their ground.
  - **Rain:** the road turns to mud. Lizard Riders slow, and food carried to the line takes longer.
  - **One line at most:** the storyteller says the weather once, in the folktale voice: «هبّت الريح من الجبل، فطالت السهام.» / «نزل الضباب من النهر، ولا يُرى العدوّ إلا بقناديله.»
  - **Fair:** the weather works the same on both sides, every player sees the same signs, and no purchase or subscription changes it. The chapter's win rate in the bot sim must stay within the current band.
  - **Mood:** each weather changes the light, the sound (wind in the cypresses, the hush of fog, rain on the shields) and the colour of the field.
- **Second idea (backlog): the field remembers.** A battle site keeps its marks: a fallen banner where the line broke, scorched grass, and the next season a row of small white flowers where the Pathkeepers stood. Coming back to a field for a later battle, the player sees their own history on it, wordless, the camp's memory (pillar 2) carried out to the field.
- **Tests:**
  - A bot that matches troops to the weather wins at least 15% more of chapter 2–3's weather battles than one that ignores it. Both bots still win at least half.
  - Each weather's signs are visible in the first 3 s at 375 pt, in EN and AR.
  - The weather lines pass the fusha check and name no player gender.

## #92 (random-stimulus, 2026-11-15) «لكلّ جنديّ اسم»: stimuli: a grandmother's lullaby · a name carved on a shield · "every soldier has a name"
Comparables, learned from but not copied:
- XCOM: soldiers you grow attached to.
- The Banner Saga: losses the story remembers.
- Darkest Dungeon: veterans with quirks.

Ours stays ours: a folktale company, where a name is earned at the fire and spoken once in the chronicle. No numbers.
- **Idea (best): every soldier earns a name.**
  - **Earning it.** A troop who comes home from three battles is given a name at the camp fire by the storyteller: «سُمّي حارسُ الدرب الذي ثبت ثلاث مرّات: سالم.» The card shows it in place of the unit type, with one small, true trait from those battles ("held the gate twice", "first to the bridge").
  - **A real choice in battle.** Named soldiers are worth a little more (a calm that steadies the line beside them), but a named soldier who falls is gone for good. The storyteller says so, in one line at the fire. The player weighs sending Salem to the front against keeping him for the boss.
  - **The camp remembers (pillar 2):** fallen names are cut into the gate stones at camp, a wall that grows with the journey. At the end of the tale the storyteller reads the wall.
  - **No number spam:** the bonus is shown as a word on the card («ثابت», "steady"), never as a percentage.
  - **Fair:** names come only from play. No purchase or subscription names a soldier or brings one back; the dusk raid (D9) earns no names, so the stream never changes odds.
- **Second idea (backlog): the lullaby.** Before the hardest battle of each chapter, a grandmother at the camp sings a short lullaby (code-made melody, no words) that the player can listen to or skip. Its tune returns, faint, in that battle's quietest moment.
- **Tests:**
  - A sim where the player protects named soldiers wins chapter bosses at least as often as one that spends them freely, and loses named soldiers less than half as often.
  - The steadiness bonus stays within a 5% win-rate change.
  - The names come from a fusha list and are never gendered toward the player.
- **Note (11:4x):** #92 restates #22 «المحاربون القدامى» (2026-11-14), which is not built (only the "veteran" achievement exists). When it is built, #92 supersedes #22 on one point: #22 had the Lamplighter subscription tend wounded veterans so they are ready by dawn. That is a power for pay and breaks D9 (owner, 2026-11-15). Wounded veterans rest the same for every player.

## #99 (random-stimulus, 2026-11-15) «الراية المرقّعة»: stimuli: a torn banner the village women stitch back · a river ford that rises mid-battle · "what you lead with can be taken"
**Kernel:** the company banner is the player's only order control (drag forward for Advance, back for Hold, 0a0f53a), so make it a stake. Carried forward, it stands closer to the rival. If a rival soldier reaches it, he tears off a strip: the lit momentum is lost, and the Advance stops for that battle. A banner that comes home whole after a win earns a patch the village women stitch on, one small emblem per chapter (a flame, an olive, a bridge), kept on the cloth for the rest of the journey.
- **The decision (pillar 1, a readable choice):** Advance strikes harder but puts the banner forward; Hold keeps it home and safe. The rival's fast units (#66, the rival who learns) start aiming for a banner carried forward too often, so the threat rises with your own habit.
- **The camp remembers (pillar 2):** the patches are drawn on the cloth itself in battle and in camp, so the banner's history is visible without a menu. A tear stays as a mended seam that reads «رُتقت بعد الوادي» in the chronicle.
- **The difference from #34 (seizing the rival's banner):** #34 is an attack on his flag. #99 makes your own order control the thing you risk, so every Advance carries a price.
- **Challenge, measured:** the bot sim (the D6 method) must show that Advance-always loses its banner in at least 30% of hard battles, and that the reader who advances when the lane is clear wins faster than both Advance-always and Hold-always.
- **Gentle dark humour:** «الراية لا تقاتل، لكنها تعرف تماماً من تركها وحدها».
- **Comparables (learn, not copy):**
  - Kingdom Two Crowns loses the run with the crown;
  - Clash Royale guards its king tower;
  - Total War's standards break morale.
  - None makes the order control itself the stake, nor stitches its history onto the cloth.
- **D9:** free for everyone. The Lamplighter gets no protection for the banner and no extra patch.
- **Art:** the patches are drawn in code on the existing cloth, at 4–6 px a motif and in the village's colours. A tear is a dark notch that ripples in the wind. No new panel.
- **Second idea (backlog):** a ford that rises halfway through the battle and cuts the middle lane for 10 s. It is close to #86's weather, so it is kept as a variant of #86.

## #106 (random-stimulus, 2026-11-15) «حملُ الرفيق»: stimuli: a door taken off its hinges to carry a man home · a shepherd's whistle across the hills · "no one is left in the field"
**Kernel:** a fallen soldier does not fade at once. He kneels for four seconds, his helmet on the ground, and a comrade may run out to lift him back to the gate. He does not die (there is no blood in the game; a fall is a fade). The one carried back returns to camp and keeps his name (#92, every soldier earns a name), but two soldiers leave the line for those seconds.
- **Play (D11: a drag, never a tap):** drag from a soldier who is standing to the one kneeling, and the comrade runs to him and they go back together. Do nothing and he fades as now. The deployment cards are unchanged.
- **The decision (pillar 1):** lift a veteran now and the line thins at the worst moment, or hold the line and lose him. The rival who learns (#66) aims at the gap the lift opens. The bot sim must show that lifting under pressure loses more battles, and that lifting in the calm before a wave keeps the veterans without losing.
- **The camp remembers (pillar 2):** the one carried back appears in camp with a bandage on his arm, and the chronicle tells his name and who carried him, «حمله يوسف من عند البوّابة الثانية». Whoever carries three of his comrades earns a mark of his own.
- **A folktale voice (pillar 3):** «في هذا الوادي لا يُترَك أحدٌ في الساحة، ولو تأخّر العشاء».
- **Comparables (learn, not copy):**
  - Kingdom Two Crowns loses whoever falls;
  - Bad North brings units back between islands;
  - Clash Royale has no memory for a unit.
  - None makes saving a comrade a decision in the middle of the fight with a known price, nor keeps a name for the one who was saved.
- **D9:** free for everyone. The Lamplighter gives no protection and no free lift.
- **Age rating (D10):** no blood and no visible wound beyond a cloth bandage, so it stays 9+ Infrequent/Mild.
- **Art:** the kneeling is one sprite frame (a dropped helmet, a hand on the ground); the carrying is the two figures walking with an arm over a shoulder. No new panel.
- **Second idea (backlog):** a shepherd's whistle that signals a wave before it appears. It is close to #46 (the rival's drums), so it is kept as a variant of it.

## More from Tas (1.3, 2026-11-15)

Preferences gains one quiet row under the footer actions, **More from Tas** («ألعاب أخرى من Tas»): a ruled line in muted ink,
not a button among the others. It opens a small sheet on the same paper panel, with one line of lead and one native button
per other live Tas game: its own icon, its name in the current language, its one-line hook and its age rating (the VoiceOver
label reads all three), then Back. A tap opens Apple's in-app store sheet in the app, or the App Store page on the web; Back,
the close key and Escape return focus to the row. No price, badge or call to buy, never a pop-up, and never during a battle:
the row is absent from Preferences opened from the field pause. The rule and the catalogue are tas-engine's (ffcf5bc),
copied byte for byte into `src/vendor/` and bundled, never fetched (`ui/more-games-screen.ts`); the icons ship in
`public/more-games/`. `Almo7areboonConfig.swift` allows exactly the catalogue's other six IDs.

## #114 (random-stimulus, 2026-11-15) «حجر الرحى»: stimuli: an olive millstone · a children's tug-of-war · "what if the gate could move?"
**Kernel:** on the olive-terrace maps, the village press has one millstone. Two of your fighters can leave the line to push it off the upper terrace: it rolls down the slope the map draws, scatters what it meets, and where it stops it stays, a round stone wall that reshapes the field for the rest of the battle.
- **Play:** drag from the press to choose the push (the stone follows the terrace contours, not your finger, so you read the slope); the two pushers are out of the fight for 6 s.
- **Challenge, a real trade-off:** the stone is spent for the chapter (the press grinds less, so the next battle starts with less provision); and a stone stopped in the wrong place walls in your own line. The bot sim must show the stone wins close battles when placed well and loses them when rolled early.
- **Comparables (learn, not copy):** Clash Royale's Log is an instant spell that clears a lane and vanishes; Kingdom Rush has hero spells; Plants vs. Zombies has fixed lanes. Ours costs people and a future, follows real terrain, and leaves a wall you built by accident or by plan.
- **Subscription rule (owner, 2026-11-15):** nothing to do with the Lamplighter; it never promises new content.
- **Art:** the stone drawn as a worn basalt disc with its square axle hole; its path leaves crushed grass and olive leaves; the press stands empty after.
- **Second idea (backlog):** tug-of-war as the momentum bar's shape: a rope drawn between the two companies that both sides pull, never a number.

next to build: #92 «لكلّ جنديّ اسم» because it answers the owner's latest call (attachment, grief, morality, consequences) with the game's own loop. A soldier who came home three times earns a name at the fire, a named one who falls is gone for good and is cut into the gate stones, and sending Salem to the front becomes a real choice between winning now and keeping him. It needs no new panel (a word on the card, a line at the fire, a wall at camp), and it supersedes #22. Checked: no named-soldier code exists yet. (random-stimulus tick 2026-11-16; 20 stimulus entries in the backlog, so no new idea was added.)
