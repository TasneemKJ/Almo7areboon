# Village answers the command: bounded atmosphere batch

Date: 2026-10-05. Source snapshot: `2e7654f16f721156a44d3b940fa9819bf5689175`. Integration must reconcile the newer main before publication.

## IDEAL and 5Ws

- Identify: the village already answers an accepted order for 2.4 simulation seconds, but the gate gives no world-space readiness cue and the audio selector drops the simulation's order events.
- Define: help a phone player notice an available command and hear the village accept it, without new controls or a second rules path.
- Explore: the twenty candidates below cover visual, atmosphere, feel, interaction, teaching, loop, gameplay, pacing, audio, writing, accessibility, input, replay, session, data, loading, release, stability and return-play lenses.
- Act: implement candidates 1–3 only; keep all other candidates as uncompleted proposals.
- Look back: verify real accepted/rejected dispatches, unchanged charge/duration, static reduced motion, bounded rendering/audio, and the unchanged fast gate. Browser screenshots and listening evidence remain required before a verified visual release.

Each row answers who, what, where, when and why. These are candidates, not claims of implementation or measured retention.

| # | Who | What | Where | When | Why / disposition |
|---|---|---|---|---|---|
| 1 | Player watching the gate | A small brass readiness pennant | Existing gate identity | Both commands are actually valid | World teaches readiness; selected |
| 2 | Player issuing Hold | A dry, quiet gate-tap contour | Existing effects bus | Accepted simulation event only | Ground a defensive choice; selected |
| 3 | Player issuing Advance | A muted rising brass contour with a soft tail | Existing effects bus | Accepted simulation event only | Distinguish intent without louder UI; selected |
| 4 | Player reading units | Chapter-colored distant haze | Authored landscape branch | Running battle | More depth, preserve silhouettes; pending |
| 5 | Player reading the horizon | One slow cloud break | Existing sky layer | Quiet intervals | Living dusk without dense motion; pending |
| 6 | Player approaching a base | Restrained ground contact darkening | Base footprint | Every scene | Improve grounded material weight; pending |
| 7 | Player following melee | Short contact dust | Existing effect pool | Real impacts | Read feet and attack timing; pending |
| 8 | First-session player | One in-world readiness teaching moment | Existing command/gate area | First valid command | Teach through play rather than a dialog; pending |
| 9 | Player choosing a command | More distinct static flag stitch shapes | Existing pennant | Active Hold or Advance | Reinforce identity beyond color; pending |
| 10 | Player under pressure | Quieter distant practical lights | Landscape | Dense combat | Protect the focal battle lane; pending |
| 11 | Player returning to a chapter | Chapter-specific cloth/weather rhythm | Existing scenery | Ready/running | Preserve chapter character; pending |
| 12 | Player ending a battle | One coherent wood/brass settlement tail | Existing result audio | Authoritative result | Give the session a musical ending; pending |
| 13 | Reduced-motion player | Static foreground depth composition | Frame edges | Reduced motion enabled | Keep depth and meaning without drift; pending |
| 14 | Touch player | Verify pennant never reads as an extra button | Gate/tap zones | Narrow portrait and landscape | Preserve direct Hold/Advance input clarity; pending audit |
| 15 | Keyboard player | Check the same command identity alongside focus | Existing native controls | Keyboard play | Equivalent meaning without new focus stops; pending audit |
| 16 | Returning player | Preserve command silence across reload | Existing lifecycle | Reload/retry/session conflict | No replay or mistaken acknowledgment; existing event draining covered, browser pending |
| 17 | Player with sound disabled | Keep all semantic order meaning visible | Existing pennant and labels | Effects muted | Audio remains optional; selected-slice regression |
| 18 | Player on a weak phone | Measure command rendering cost | Existing Graphics object | 4x CPU/mobile pass | Keep decorative work bounded; pending performance evidence |
| 19 | Offline player | Verify commands with cached authored art | Existing service-worker route | Offline return | First paint and readiness remain coherent; pending browser evidence |
| 20 | Release owner | Replace roadmap-count claims with behavior evidence | Audit and release record | Each bounded batch | Keep remaining cinematic work honest; selected documentation discipline |

## Change contract

The existing order frame returns a readiness-only pennant only when both `canIssueOrder(state, 'hold')` and `canIssueOrder(state, 'advance')` are true. It therefore shares the authoritative 60-momentum threshold, phase/pause and non-overlap checks. Readiness has no troop aura and no village-answer event. Its smaller, lower-opacity brass cloth uses at most 0.8 source-space pixels of simulation-time movement; reduced motion fixes that movement at zero. The active order retains the existing marks and 2.4-second village answer.

The existing drained `GameEvent` pipeline selects `order-hold` or `order-advance` only for valid order IDs. Rejected dispatches emit no event. Each contour occupies one existing ordinary effects voice, stays below 320 ms and a 0.03 local peak gain, respects mute and lifecycle cleanup, and does not displace critical capacity. Wood/cloth/brass are synthesis direction, not a claim that listening tests or real Foley recordings were delivered.

No gameplay constants, duration, rewards, save format, profile data, controls, navigation, authored art or CI workflow changes are part of this batch. The current shipped locale remains English.

## Evidence and honest limits

- RED: seven expected focused failures established missing readiness and missing command cue/voice definitions before production edits.
- GREEN: focused order-presentation, combat-cues and combat-audio suites: 32/32 passing after implementation.
- Full-suite/build and review results are recorded below after final verification.
- Browser audit currently blocked by the execution environment's verified local-server/socket restrictions. No new screenshots were captured or accepted here. Readiness composition, phone touch geometry, 4x CPU behavior, sound perception and cross-browser output remain unverified. Source/frame/audio-node tests do not substitute for them.
- The inherited `forty-pass storybook refinement exposes eight five-pass groups` test remains RED and untouched. No forty-entry placeholder arrays or fake completed-pass counter were added.
- The broader original cinematic spec remains pending: authored-plate atmospheric perspective, dusk hierarchy, living sky, foreground composition, contact dust and chapter-wide before/after audit. This batch does not claim those were completed.
- Source observation for the next batch: `drawAtmosphere()` returns from the authored storybook branch before fallback `paintDuskAtmosphere` and `paintLightingHierarchy` calls. Future depth work must verify the actually displayed branch.

### Initial source verification (before main reconciliation)

- `npm ci --ignore-scripts --cache /tmp/almo-command-npm`: succeeded, 22 packages. The first attempt failed because the default home cache was unavailable; a writable temporary cache resolved that setup issue.
- `node --experimental-strip-types --test tests/order-presentation.test.ts tests/combat-cues.test.ts tests/combat-audio.test.ts`: 32 passed, zero failed.
- `npm test`: 1,021 passed of 1,022; the only failure is the inherited forty-pass roadmap expectation described above.
- `npm run test:fast`: 974 passed of 975; the same inherited failure remains. The fast gate was not weakened or excluded.
- `npm run build`: exit 0, TypeScript check and Vite production build succeeded. The existing Phaser chunk-size warning remains.
- Manifest comparison: only the four scoped production files, three scoped test files, DESIGN, UX-CONTRACT and TODO differ from the provided snapshot; this audit is the only new source file. No save, simulation, dependency manifest or workflow files changed.
- Browser, physical-device, RTL and perceptual audio acceptance: unverified, not claimed. Full suite and fast gate remain RED pending genuine resolution of the original cinematic roadmap test.


## Reconciliation with main `00a75cb8d6705926103e746f81fc8495945630cb`

The command batch was reconciled after main advanced to version 0.3.1. All 24 changed upstream blobs and the five overlap ancestors were fetched at exact revisions and checked against their Git blob SHA. All 578 non-owned upstream blobs match the new main exactly after reconciliation. The four command production files have no upstream overlap and retain their reviewed source.

- Kept upstream lazy Phaser loading, landscape side rail, Gather spacing, compact landscape dialog header, wave-panel positioning, new Journey result wording, Open Graph image, mobile touch harness, dependency metadata and CI rules.
- Merged both additive TODO/UX sections. Preserved main's 0.3.1 version and `review:mobile-touch` script; appended the shared size checker to its existing build command. Package-lock remains byte-identical to new main.
- Retained upstream browser timing and unmet 8–14 fps software-WebGL evidence in performance budgets. The single 500 KiB aggregate gzip ceiling includes engine, lazy chunks and workers; per-chunk historical measurements are not separate allowances.
- Combined the behavioral-gates worker's three real Graphics-boundary tests with main's new bounded-refinement metadata test. The source for main's unconsumed `duskRefinement40` data helper is unchanged. Neither a passing metadata test nor an eight-by-five number array proves forty visible refinements.
- The shared checker scope clarification (emitted JS files plus executable inline script blocks) is included. Event-handler attributes and `javascript:` URLs remain outside that documented static size metric.

### Fresh reconciled verification

- Dependency installation: exit 0 using the writable temporary npm cache.
- Focused command, dusk, landscape and CI-layout tests: 59/59 passed.
- `npm test`: 1,035/1,035 passed, exit 0.
- `npm run test:fast`: 988/988 passed, exit 0.
- `npm run build`: TypeScript, Vite and shared size check passed, exit 0.
- Total emitted JavaScript plus inline script blocks: 468,105 gzip bytes (457.1 KiB), below 512,000 bytes. The existing large-Phaser-chunk warning remains.

### Screenshot review and remaining boundary

Four recovered original PNGs were opened and inspected: baseline `b7ba32ccd607` and candidate `805969b28bd7`, each at 390x844 and 1280x800. They show the existing authored First Fires scene; the candidate's small gate pennant adds readiness without a panel or obscuring the center lane. Those captures are evidence for the older compared sources only. The separate older-source browser run reported native touch, direct command acceptance, pause and rotation passing. No new-main screenshot, 4x CPU or listening acceptance is inferred from those results.

The reconciled head still needs final-source browser/touch/rotation checks and screenshot review. Physical-device performance, perceptual audio and Arabic/RTL are not certified. The deeper painterly atmosphere work is a separate, unfinished visual batch; no extra atmospheric source changes were bundled into this reconciliation.
