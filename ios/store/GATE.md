# Studio gate: المحاربون · Almo7areboon 1.0 (2026-11-13)

**Verdict: HOLD.** The app builds, archives, sells correctly and reads well in both languages on every iPhone size, but
the game loop is not ready for strangers: chapter 2 is a wall for a casual tapper, the first hit on the rival gate
lands after about 32 s (band: about 20 s), a free player has nothing new from day 3, and several sheets (Cards,
Settings, the store cards) are not yet at the level of the painted world. Reasons and numbers below; the open items
are in `TODO.md` ("iPhone 1.0 gate").

Scripts: `scripts/qa-gate/` (cold-bot, capture, checks, week-sim, geometry). Bot evidence was produced on WebKit
(Playwright, touch, fresh profile), as the iPhone app (a fake TasKit handler so the store exists).

## 1. Cold play (bot that only acts on what is on screen, 390x844, 15 min per language)

| Measure | EN | AR | Band |
|---|---|---|---|
| Opening tale if not skipped (Skip is one tap) | 15.3 s | 15.3 s | |
| Play → first troop sent | 16.8 s, 2 taps (2-3 s when the tale is skipped) | 16.8 s | < 10 s: **met only when skipped** |
| → first coins | 35.3 s | 35.2 s | < 30 s: **missed by 5 s** |
| → first hit on the rival gate | 48.2 s (32.2 s in the rules simulation with a tap every 1.3 s) | 48.3 s | about 20 s: **missed** |
| → first victory (first delight) | 58.3 s, 25 taps | 59.5 s, 24 taps | 60-90 s: met |
| Stretches > 20 s with nothing to do | 1 (20.9 s) | 0 | met |
| States it could not leave / page errors | 0 / 0 | 0 / 0 | met |
| Battles in 15 min | 13: 1 win, 11 losses (all at chapter 2) | same | **chapter 2 wall** |

A quick-handed player (3 taps/s) wins at 53 s, beats chapter 2 on the second try and evolves at 174 s. The slow bot
(0.75 taps/s) let food pile to 64 and never passed chapter 2.

Why the first gate hit is late: the field is about 790 units from gate to gate and a melee troop walks 31 units/s, so
25 s is the floor before any fighting. Fixing it means changing march speed or field length, which moves every
balance number; not done in this pass. **Open.**

Fixed from this run and the owner's hand-play (each with a failing test first):
- The paid gate leaked: a free player could fight chapters 3-6 (only evolving asked). Going on to, or choosing,
  chapter 3+ now opens Full Journey (`fd3a3ca`).
- Both companies were the same sprite: the rival wears a rust cast on an ember ring, yours a lamp-blue ring, the
  same colours as the gate bars (`fd3a3ca`).
- Invisible gate and recruit hit areas removed; battle controls sit in one tray: Hold/Advance with the momentum
  meter, food, a card per troop with painted portrait, name, role, cost (`fd3a3ca`, `4258fd0`).
- Hints and labels fell back to a system face: Noto Sans Arabic (OFL) is bundled and sets all Arabic text (`b2d9d9d`).
- The paywall line showed on a brand-new title screen: it now waits for the first win (`88406e4`).
- The Full Journey card claimed two chapters held when opened early (`fd3a3ca`).

Reload mid-battle: the save comes back (coins and counts kept, no tale replay); the battle in progress is dropped
without a word (**open**, TODO). Backgrounding 0.5-12 s: time freezes, audio suspends, the battle resumes on return
and audio on the next tap; one earlier build ended the battle after 12 s hidden (not reproduced on the current build;
check on a device).

## 2. A simulated week (game rules, casual player, 2 sessions of about 6 min a day)

| Day | Free | With Full Journey |
|---|---|---|
| 1 | Daily reward 30 gems; first evolution; 4 troop unlocks; 4 milestones; weekly record; about 6 card packs; first sight of the paywall | Same, and keeps going |
| 3 | 50 gems; no new chapter, troop or evolution; about 1 pack; mostly defeats. **Close to empty** | New timeline after prestige; re-evolving; 3-4 packs |
| 7 | 90 gems (7-day streak); nothing else. **Empty**; coins pile up with nothing to buy | New timeline, evolutions, packs; weekly record again |

No beat was added for days 3 and 7: the honest fix is in the free arc's design (TODO), not a lit lamp. **Open.**

Pacing bands not covered above: first sight of the paid unlock is after a real win and never blocks the free loop
(entry path after the first win; the card at the end of chapter 2): met. Free content before the unlock is felt: about
3-5 minutes for a quick player, far below the 30-45 minute band: **missed**. Progression: evolution costs and enemy
health grow 1.65x per chapter (smooth); the wall is the chapter 2 wave timing against a slow tapper, not a cost.
End of content: the last chapter says so and offers the harder timeline.

## 3. No overlapping UI, at every iPhone size

`node scripts/qa-gate/geometry.mjs`: 14 screens x 2 languages x 4 sizes = 112 captures, checking occlusion
(elementFromPoint at 5 points), overlapping controls (> 2 px), clipped text, off-screen, 44x44 targets.

| Size | EN | AR |
|---|---|---|
| 375 x 667 (SE, and iPad compatibility window) | pass (0 findings) | pass |
| 375 x 812 (13 mini) | pass | pass |
| 393 x 852 (15 / 16) | pass | pass |
| 440 x 956 (16 Pro Max / Air) | pass | pass |

Screens: entry (new, returning), opening tale, first field, field, pause, Settings, Save & recovery, Start over, Full
Journey, the Lamplighter, Camp, Camp company, leave battle.

Before → after: first run 120 findings at 393x852 (most were the check itself: round targets, layered scopes).
Real ones, fixed: selects 21 px tall (WebKit ignores min-height on a menulist) → drawn by the game at 44 px
(`e588cce`); the first recruit's cost label under the second recruit's hit circle at 375x667 (`1ce94d0`); tray cards
clipping at 375x667 (`4258fd0`); Arabic letters split by letter-spacing, the Language label on three lines, "AM" on an
Arabic screen (`c42d468`).

Deliberate exceptions (in the script, with reasons): the opening tale cross-fades two lines for 0.4 s; a walking
rival's target can pass another target on the field.

Safe areas: every edge control uses `max(…, env(safe-area-inset-*))`; a desktop WebKit reports 0 for them, so they
are checked on the simulator captures (`ios/store/screenshots/`, 1320x2868, Dynamic Island and home indicator
clear). Portrait is locked (`UISupportedInterfaceOrientations_iPhone = Portrait`, `TARGETED_DEVICE_FAMILY = 1`).
**Not done:** a second, small real simulator (the machine was at its process limit with ten other simulators booted)
and a largest-text-size pass (the page uses fixed px sizes and does not follow Dynamic Type).

## 4. Art direction

82 captures at 1170x2532 (41 screens per language) were taken and looked at by the QA pass.
On style: title, opening tale, battlefield, Camp scene and stations, result header, Storybook, Evolution chapter cards,
troop portraits. Fixed: side identity, the battle tray, Arabic type, selects.
**Open (TODO):** Cards (flat vector icons, native select), Settings (a stock form), pause / Save & recovery / the two
store cards (flat cream sheets with no painted framing), Quests (form styling); the Lamplighter's lanterns are small
at phone size and one sits behind the gate's health plate; the ground plate is soft at 3x. No before/after pairs were
produced in `art-pass/`.

## 5. Sound and touch

Every press: a Taptic tap (`navigator.vibrate`, mapped by TasKit) and a soft wooden tick when sound is on
(`tests/press-feedback.test.ts`); recruits a firmer tap and their own cue. Ambience plays in battle and pauses in
menus. Audio resumes on the next gesture after an interruption (`unlockAudio` on every press; bot: suspended while
hidden, running after the next tap). Haptics on a real device: **not verified** (no simulator haptics).

## 6. Suites, archive

- Web: `npm test` 1518 pass, 0 fail; `npm run build` passes (JavaScript 514 KiB gzip, budget 540 KiB).
- iOS (simulator "Almo7areboon 6.9", 15D796F0-72CA-4F5B-ACEB-CCD43124A212): IOS_RESULT
- Archive: `/tmp/Almo7areboon.xcarchive` succeeds (Release, generic iOS, team FJ3FMYPK3P, automatic signing).

## Studio bar

| Item | Status | Evidence |
|---|---|---|
| 1 Fail states: never stuck | PASS | cold bot: 0 dead ends in 2 x 15 min (double taps and taps during animations were not driven separately) |
| 1 A new player wins the first challenge | PASS | first victory at 58 s in both languages |
| 1 Never needs a purchase or a wait | PASS for the free arc; the free arc is short (see 2) | |
| 1 Teaching by doing; rule findable again | PASS | one line of goal on the field; Settings note; Camp skill reading |
| 2 Kill and relaunch | PARTIAL | save returns; the running battle is dropped silently (TODO) |
| 2 Background 10 s / 10 min / 24 h | PARTIAL | 0.5-12 s checked by bot; 10 min and a faked 24 h not run |
| 2 Old or damaged save | PASS by the existing unit suites (`tests/` save, backup and session tests, green); the browser monkey test (`scripts/monkey-test.mjs`) was not rerun in this pass |
| 2 Clock tampering | PASS by existing unit tests, not by a device run | weekly/daily claim tests reject past and future weeks (`tests/main-integration.test.ts`) |
| 2 Interruptions | PARTIAL | visibility pause covered; call / Control Centre not run on a device |
| 3 Buy, cancel, fail, pending, restore, refund, expiry | PASS | `StoreTests` (17): buy, failed, Ask to Buy, refund, expiry and resubscribe, upgrade, grace, billing retry |
| 3 Prices from StoreKit; card content | PASS | `<bdi>` price from the bridge; `tests/lamplighter-card.test.ts`, `tests/full-journey.test.ts` |
| 3 Store never before a real win | FIXED `88406e4` | Settings entries are the player's own visit |
| 3 Ownership from StoreKit, never the save | PASS | `tests/app-bridge.test.ts`, `tests/store-flow.test.ts` |
| 4 Arabic and English first-class | FIXED `3871a0b`, `c42d468`, `b2d9d9d` | per-group contract tests fail on any Latin letter on an Arabic screen |
| 4 Language follows the device, changeable | PASS | `tests/locale.test.ts`; Settings → Language |
| 5 Reduce Motion | PASS | existing reduced-motion suites; lanterns still under it |
| 5 Contrast 4.5:1 | NOT RUN | `npm run review:contrast` exists; not rerun after the Arabic face |
| 5 Body text ≥ 15 pt | **FAIL** | notes and labels are 11-13 px (Settings notes 12 px, tray roles 10-11 px) |
| 5 Accessible names | PASS | aria-labels in both languages (contract tests include aria text) |
| 5 Playable with sound off | PASS | every cue has a visible twin (field cue line, floaters) |
| 6 Silent switch; own music keeps playing | PASS by config | `ambientAudio: true` |
| 6 Sound and music toggles | PASS | Sound, Atmosphere, two volumes; persist |
| 7 Cold launch < 3 s, no white frame | NOT MEASURED | launch colour matches the title's night blue |
| 7 Frame times, memory over 10 min | NOT MEASURED | |
| 7 Zero console errors | PASS | 0 page errors in all bot and geometry runs, both languages |
| 7 Fully offline | PASS | served from the bundle (`Almo7areboonConfigTests`), font bundled, no network call in the game |
| 7 App size | PASS | the archived .app is 38 MB; the two company films (company-ar.mp4, company-en.mp4) are the only files over 3 MB |
| 8 Privacy manifest true; no network | PASS | `PrivacyInfo.xcprivacy`; the game makes no requests; only StoreKit |
| 8 No placeholder or debug UI | PASS | debug JS hook is `#if DEBUG` only |
| 8 Version, support, privacy in Settings | FIXED `e588cce` | |
| 8 Age rating true | FIXED `e588cce` | 9+ expected |
| 8 Export compliance | PASS | `ITSAppUsesNonExemptEncryption = NO` in the build settings |
| 8 Icon | PASS | the Pathkeeper at the dusk gate, from the game's plate |
| 9 Feel | PARTIAL | press feedback within a frame; result count-up; idle title is alive; store sheets are plain |
| B Settings: sound, music, language, restore, manage, support, privacy, version | PASS | haptics have no toggle (system setting governs) |
| B Start over | PASS | Settings → Start over, with confirmation and export first |
| B A reason to return tomorrow | PARTIAL | daily reward and weekly record exist; not shown before leaving |
| B A natural stopping point | PASS | the result card, then Camp |
| B A share moment | MISSING | TODO, after 1.0 |
| B Credits | FIXED `e588cce` | "A game by Tas Games" in Settings |

## Owner's five-point bar (1-5)

1. Playable and valid: **4**. No dead ends or soft locks in 30 bot minutes; a dropped battle on reload.
2. Atmospheric: **4**. The painted dusk village, lamp light and synthesized ambience carry it; the sheets do not.
3. Simple UI: **3**. One tray and one line of goal in battle; Camp's first visit and Quests are busy.
4. Self-teaching: **3**. The first minute teaches by doing; chapter 2 does not teach what it demands.
5. Potential to spread: **2**. A strong first image, Arabic-first, honest 9+; no share moment, a thin free arc.

The council doubted a subscription fits a game with no away earnings; the Lamplighter is the gentlest honest one
(light, no power) and the market sheet calls it the weakest value of the five games.
