# Shared game interaction contract

See DESIGN.md for visual intent. English/en-US numbers and device-local calendar days are the existing locale contract. Gameplay and rewards are deterministic client-side state; no real-money transactions or backend calls.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Controls | Native buttons/radios in main.ts and ui templates | guarded Game.dispatch | deployment, skill, order, reward | source integration and browser tap |
| Modal | main showModal/closeModal, accessibility.ts | modal/pause ownership | result, Journey, Settings, session | focus/close hit tests and native playtest |
| Toast | main toast/status live region | action result | info and recoverable errors | main tests and browser |
| Scrollbar | style.css/continuation.css/battle-banner.css | shell + dialog viewport | short-phone shell scroll with fixed navigation and reserved space, independent dialog | narrow/rotated browser hit tests |
| Navigation | main switchTab and modal dispatch | activeTab, pendingVictory | ready/result Journey → collection or Chronicle | receipt/manual-pause regressions |
| Rewards | Game.dispatch claim/daily and data.ts | saved claimed IDs/localDay | Journey or Quests presentation | duplicate/roundtrip claims |

Order cast validates session ownership, phase, pause, valid ID, charge and non-overlap before spending60. Invalid casts do nothing.10 simulation seconds freeze with any pause reason; no wall-clock callbacks. Retry/reload create uncharged inactive orders. Strength is never stored in a profile. Older pending receipts normalize optional order counts to0.

Journey reads current profile only and never awards by rendering. Claim dispatch uses existing quest IDs/payouts; successful claim redraws its originating Journey, failed/conflicted saves leave session recovery authoritative. Journey and its Quests destination retain a battle result; Close restores that result. Direct Cards navigation closes Journey but retains the receipt and manual pause. Returning to Battle restores the held result without reissuing rewards; preparation links appear only before settlement. Chronicle mission changes use their existing ready/result validity rules.

Menus pause simulation without clearing manual pause. Hidden tabs, orientation, save conflicts, future saves and temporary sessions preserve existing lifecycle policies. The game asks before import replacement/start-over/prestige; user preferences on that established flow remain.

All new controls have semantic names,44px minimum, visible keyboard focus and non-color state labels. Gauge/countdowns are not noisy live regions; successful state changes use existing feedback. Reduced motion keeps strength/duration and static order identity. Offline first-return acceptance records actual worker responses and driver limitations separately from physical iOS/Android acceptance.

The ready-screen Journey button label (`ui/next-goal.ts`) is derived from the current profile only: daily reward, then a claimable milestone, then the nearest unfinished milestone. It never claims, spends or saves, and its accessible name starts with "Your journey".

Phone landscape (`orientation:landscape`, height at most 540px, width at least 600px) uses the side rail in `ui/landscape-rail.css`: the battlefield fills the left, the command deck and upgrades fill a right rail, navigation runs along the bottom, and playing needs no page scroll. Portrait keeps the Gather control in its own row below the troop cards. `npm run review:mobile-touch` checks both by touch at 320-412 portrait and 844x390.
In short landscape a dialog keeps its sticky, opaque 44px header (so scrolled controls never sit under the close button) and the eyebrow and title are pulled up into that row beside the X, so there is no empty band. The result's battle earnings count up once in 0.8 s; reduced motion shows the final number.

The gate readiness pennant reads `canIssueOrder` for both Hold and Advance; it cannot appear as ready while paused, outside a running battle or during an active order. Readiness itself produces neither an audio cue nor a village answer. Accepted order audio comes only from the existing drained simulation events, with valid order IDs, ordinary voice limits and existing sound/mix/lifecycle gates. Rejected input remains silent. No additional control or balance path is introduced.

First Fires depth is view-only: source-registered masks are cached at the existing chapter/layout/HUD measurement boundary and reuse at most 120 immutable triangles per frame. Two CSS pixels of clearance protect even partially off-crop HUD bounds; malformed or over-fragmented input fails closed. The existing storybook return still excludes legacy grading. Reflections read existing lamp intensity, and no new clock, timer, control, scene object, texture, save field or audio voice is introduced. Phase, pause, hidden-tab, reduced-motion and chapter ownership remain with the existing presentation and audio lifecycles.

Quests lists a weekly goal under the daily reward: earn 3 new seals in the current Monday-to-Sunday week for 60 gems, claimable once per week. Freeze and Meteor badges that show a plain number carry a small target ring: the number counts living enemies and is not a countdown (a countdown reads like 7s).

Teaching cues are single lines in the deploy hint, never panels. In the first-ever battle the Light Guard card carries a gold ring until the first deployment; in the first three wins, after one deployment, a player who banks food for eight warriors while fewer than three fight and an enemy is alive sees "Food is piling up (N)…" with the same ring (it outranks the skill cues). The first-Freeze and first-Meteor cues follow in the first five wins. The ring pulses only when motion is full and is static otherwise.

Defeat names the troop role that dealt the most damage. Settings offers "Troop shapes" (circle melee, triangle ranged, square heavy; filled yours, outlined enemy; off by default) and ends with "Last saved HH:MM" (memory only; opening Settings saves once). A returning player (at least one win, six hours or more away) sees one welcome-back toast that grants nothing. The daily streak survives one missed day, at most once every seven days, and the Quests row says so before claiming.

Heavy troops fall louder (wider dust, second ring, short low shake) and a heavy blow on a unit freezes the scene for about 50 ms at most twice a second; neither shake nor freeze happens with reduced motion. A battle that starts in a new week opens that week's goal first.
