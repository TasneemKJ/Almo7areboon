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

## iPhone app: Full Journey and the Lamplighter — owner override (2026-11-13)

Owner override (2026-11-13): the iPhone app (ios/, TasKit) sells two things; the web build sells nothing and stays fully open.

- **Full Journey** (`Tas.Almo7areboon.fullGame`, non-consumable, US$4.99) opens more game, never power: chapters 3 to 6
  and the harder timeline. Chapters 1 and 2 are the free arc. The gate is asked of StoreKit at the moment of use
  (`src/app/store-flow.ts` `gateEvolution`): choosing Evolve at the end of chapter 2 opens the Full Journey card instead
  of the evolution dialog. Ownership is never written to the save. The card also opens from Settings → Full Journey.
  **1.1 (2026-11-13):** a save already past chapter 2 (imported, pasted or from the web) no longer keeps playing where
  it is; that let an import walk around the purchase. It is *held*: `gateStart` (asked in `lifecycle.ts` `action`, the
  one way into a battle) opens the card instead of starting while the chosen battle, the army's chapter or the timeline
  is past the free arc and StoreKit has not said Full Journey is owned. The save is never clamped or rewritten, in
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
  the app, once the player has won a battle and while Full Journey is not owned, chapters 3-6 are a dashed stretch with
  "Chapters 1–2 free · 3–6 with Full Journey", which opens the card. Never before the first win, so the store is not
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
  along. The confirm button reads "MOVE CAMP TO <PLACE>", the decline "STAY IN THIS CAMP".
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
