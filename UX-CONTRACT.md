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
In short landscape a dialog's close button floats top-right and the title starts at the top of the dialog. The result's battle earnings count up once in 0.8 s; reduced motion shows the final number.

The gate readiness pennant reads `canIssueOrder` for both Hold and Advance; it cannot appear as ready while paused, outside a running battle or during an active order. Readiness itself produces neither an audio cue nor a village answer. Accepted order audio comes only from the existing drained simulation events, with valid order IDs, ordinary voice limits and existing sound/mix/lifecycle gates. Rejected input remains silent. No additional control or balance path is introduced.

First Fires depth is view-only: source-registered masks are cached at the existing chapter/layout/HUD measurement boundary and reuse at most 120 immutable triangles per frame. Two CSS pixels of clearance protect even partially off-crop HUD bounds; malformed or over-fragmented input fails closed. The existing storybook return still excludes legacy grading. Reflections read existing lamp intensity, and no new clock, timer, control, scene object, texture, save field or audio voice is introduced. Phase, pause, hidden-tab, reduced-motion and chapter ownership remain with the existing presentation and audio lifecycles.

During running/paused play, compact roster and navigation styling reads the existing world phase attribute only. Native troop, order, upgrade and navigation markup, event handlers, costs, locks, accessible names, focus rings and warning text are preserved. No action moves behind a new disclosure. Portrait and landscape must retain nonoverlapping 44px targets, visible role/name/cost bands, all three choices and the existing short-phone scroll fallback. Secondary screens share the compact navigation boundary. The original ready and result troop/navigation styling remains authoritative outside a live battle; the narrower landscape rail applies across phases.

Home now precedes ordinary play: Play/Continue and Settings are its only UI actions. Entering a ready encounter dispatches the existing start action; it does not deploy a troop, change costs or grant food. Home Settings returns to Home, and required session recovery keeps precedence. Entry readiness requires the mounted renderer and its loading surface to be finished. The original simulation/presentation/audio owners remain paused while Home is visible. Saved terminal state waits until Continue before showing its receipt.

The default result is a short read-only summary with one primary next action, Details and Home. Details retains the existing complete receipt and optional actions; Back restores the short summary. Home preserves the same terminal state. For an expedition with another encounter, the player explicitly chooses supplies or shelter and continuation; canonical provision/continue dispatches retain their admission and save checks. Canceling does not choose, grant or settle. Full gameplay simplification and exact-source native entry/result verification are still required before this draft meets the owner's complete request.
A renderer import/start failure remains visible on Home after transient notices expire. The existing primary control becomes Reload, with Settings retained; reload never clears or replaces saved progress. Rendering readiness and failure are distinct states.
