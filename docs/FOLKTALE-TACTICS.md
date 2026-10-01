# Folktale tactics: scope and acceptance

This expansion integrates a playable first release of the twenty approved ideas. It preserves the TypeScript/Phaser game, existing painted six-chapter artwork, earned cards, chapter progression and save-ownership boundaries. It is not a claim of AAA art completion, measured retention, exhaustive balance or physical-mobile acceptance.

## Start playing

On the battlefield, **Battle** still starts the familiar road encounter. **Open the storybook** offers optional routes, company preparation and the settlement. During combat, **Gather** holds newly deployed warriors; **Release** sends them together. Only six warriors can gather. Three skill slots remain: a selected captain replaces Food Drop rather than adding another toolbar.

All routes use existing troop and skill controls. No new currency, purchase, account, backend, attendance requirement or scheduled job is introduced. The storybook is a between-battle page; company and expedition details start collapsed.

## Twenty-idea implementation map

| # | Idea | Shipped mechanic | Main verification |
|---|---|---|---|
| 1 | Gather and charge | Hold newly deployed troops, release manually or automatically when six reach formation. | Rally movement, cap, pause and invalid-action tests; real browser controls. |
| 2 | Squad relationships | Forward melee guards protect nearby ranged allies; heavy hits briefly breach melee protection. | Geometric role and damage tests. |
| 3 | Skill combinations | Freeze primes heavy-hit shatter; Meteor breaks cover; featured tale strengthens first rallied strikes. | Fixed-step hit, skill and bounded splash tests. |
| 4 | Interactive scenery | Capturable cover, supplies and lanterns have tactical effects without individual unit dragging. | Occupation, contest, repair and supply tests. |
| 5 | Mission objectives | Escort, 75-second watch, rescue-and-return, lantern control, boss and classic siege. | Objective/tie/failure tests and complete simulated routes. |
| 6 | Bell Keeper | A heavy boss actor with four-second ringing wind-up, interruptible by heavy hits, and bounded coat reinforcements. | Spawn, interruption and reinforcement-cap tests; warning screenshot fixture. |
| 7 | Commander personalities | Deterministic rush, volley and bulwark schedules; no hidden reactive counter-picking. | Schedule variation tests. |
| 8 | Story captains | Salma shields the company and gate; Younes reveals shadows and stills the bell. They replace Food Drop. | Availability, once-per-battle, copy/icon and browser-selection checks. |
| 9 | Familiar veterans | Rima and Nabil recur with saved survived-victory counts, names and insignia; veteran protection changes at three victories. | Saved progression, names and protection tests. |
| 10 | Behavioral tales | Empty Bowl, Borrowed Bell and Olive Thread are earned mutually exclusive tactical choices; old cards retain their bonuses. | Unlock, selection and effect tests. |
| 11 | Illustrated journey | Optional route forks in each unlocked chapter, with previews and replayable alternatives. | Route gates, DOM validation and portrait screenshots. |
| 12 | Restored settlement | Oven, courtyard and workshop light up after distinct victories; bread or repairs prepare the next battle. | Milestone and preparation tests. |
| 13 | Visible consequences | The first rescued cart grants chapter provisions; the first rescued scout grants extra boss warning. | Saved choice, first-choice exclusivity and combat consequences. |
| 14 | Interactive dread | Optional night route with shadow troops, lantern control and readable lighting. | Light objective, shadow modifier and alternate-timeline browser fixture. |
| 15 | Hidden folktale | Three safe post-victory discoveries form a connected tale and unlock the Olive Thread and a rescue epilogue. | Safe discovery gates, persistence and optional route tests. |
| 16 | Unified presentation | Existing painted landscapes retained; small ink/pigment props, warm shadows, paper flecks and foot-plane depth ordering. | Layer-order/palette tests and screenshot review. |
| 17 | Combat personality | Rally, shield, breach, shatter, rescue and bell feedback; bounded audio cues; reduced-motion behavior. | Cue mappings, audio limits, motion and rendering checks. |
| 18 | Playable onboarding | Rima's opening guidance and contextual deployment/formation/skill teaching; no mandatory dashboard tutorial. | Actual main-loop integration tests and fresh-profile phone probes. |
| 19 | Three-battle expeditions | Escort, watch and boss; up to twelve food carries over, with supply/shelter choices and inter-battle checkpoints. | Full simulated expedition, pending-receipt and browser-reload checks. |
| 20 | Alternate timelines | Unlit, overgrown and unlikely-ally variants change warnings, landmark rules, wave timing and provisions. | Variant and deterministic encounter tests. |

## State and save guarantees

Profile schema is 5; storage key remains `almo7areboon.save.v1`. Schemas 1–4 migrate without removing cards or progress. Future outer schemas and unknown future chronicle formats are protected from overwrite. Chronicle values are bounded; expedition chapter state cannot unlock a locked campaign chapter.

Game owns all simulation and progression. The existing UI action guard, primary/backup persistence, import/export, multi-tab ownership and temporary-play restrictions remain authoritative. Chronicle does not introduce a second storage writer. An unfinished battle restarts; earned coins remain. Expedition progress checkpoints between encounters rather than serializing the entire live battlefield.

Mission wins settle once. Their receipt includes objective state and the actual enemy-gate health: escort and rescue victories do not pretend the opposing gate was destroyed. Reloading or dismissing the storybook preserves the pending result. A completed expedition checkpoint consumes that receipt before advancing.

## Verification and review record

The expanded local suite passes 739 tests, and TypeScript checking plus the Vite production build pass. The initial GitHub assembly run independently passed all 731 tests at that earlier checkpoint; the subsequent review fixes add captain/mission guidance, icon and palette regressions.

`node --experimental-strip-types scripts/simulate-chronicle.ts` completes every route and all three expedition encounters with documented prepared profiles. Those fixtures prove reachability and deterministic completion, not organic campaign balance or first-time-player retention.

`node --experimental-strip-types scripts/review-chronicle.mjs`, against the production preview, checks fresh play at 320×568, 390×844 and 1024×768; route gates; rally/release; captain/tale selection; boss warning; night rendering; discovery persistence; result restoration; and expedition continuation/reload. It writes screenshots and `artifacts/chronicle/report.json`. The permanent read-only workflow publishes these as `folktale-tactics-review`. Consult the PR's latest checks for the final run status.

The first browser review produced 14 screenshots. Its failed check was an ambiguous selector that matched both the background and result storybook controls; it was scoped to the result dialog. Screenshot review also found the first boss capture occurred before the warning because software-rendered game time lagged wall time; the probe now waits for the actual warning. A pale story-result heading was corrected to dark ink. Captain guidance and icons no longer advertise Food Drop after it is replaced. Cleared waves now point to the active mission objective instead of always ordering an enemy-base attack. Mission receipt and ownership tests guard the discovered reload edge cases. These were inline reviews, not an independent human or subagent approval.

## Explicit limits

- Desktop Chromium with touch/viewport emulation is not physical iPhone, Android, Safari or VoiceOver acceptance. Local managed-browser restrictions were respected; browser review ran in GitHub Actions.
- Arabic/RTL localization, low-end-device frame time, touch ergonomics on physical devices and listening tests remain unverified. No retention lift or numerical quality score is claimed.
- New props and settlement details use a bounded procedural ink/pigment treatment around existing painted art. They are not a new hand-painted cinematic asset library. Captains and veterans share the army's art; a complete bespoke character-animation production is not claimed.
- Timeline variants are authored rule variations and flavor, not three wholly separate novel-length campaigns. Discoveries are safe post-battle interactions, not a hidden-object scavenger game.
- The existing Phaser vendor chunk still emits a size warning. No bundle-warning suppression or unrelated dependency upgrade is included.
- Temporary assembly workflows and transport files are removed before PR handoff. The permanent review workflow has read-only repository permissions. This PR does not merge or deploy the game.
