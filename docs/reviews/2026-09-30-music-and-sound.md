# Music and sound execution review

Date: 2026-09-30. Task 1 semantic checkpoint committed as `a83ecd6`, after independently reviewed combined baseline `ee52b574`. Offline harness and admission fix committed as `258c556`. Death/summon reconciliation was committed as `3f22005`, followed by production/recovery integration `0efce826`. The current uncommitted merge integrates approved mastery checkpoint `e2b0cfa93bd8c483ffdc4a3152ce3f0309f6f650` on that production/audio baseline. Task 2 is not implemented.

## Implemented checkpoint

`selectCombatCues` preserves event metadata, chooses one hit-family winner, retains bounded candidates and at most three descriptors, and silences unknown/malformed events. Death now has a dedicated lowest-priority descriptor, coalesced across both sides and limited by a shared 250 ms audio-time cooldown. Enemy attackers identify damage to the player's base. Results suppress their entire batch and contradictory results choose the first event.

The production `renderCombatCue` uses one oscillator and one envelope gain per cue, starts gain at zero, attacks over 2–5 ms and ends at zero. Result phrases last 600 ms. Materials and skills vary waveform/envelope structure in addition to frequency. The audio owner keeps real-audio-time cooldowns, six ordinary effect slots and eight total shared transient slots. Only critical cues may reclaim village accents at capacity; effects are never preempted. Stop, failure, natural end and replacement release handles once; late callbacks retain their original context's ownership.

Actual main-function tests exercise complete-batch admission, save-session ownership and lifecycle stops with the real audio owner. Fresh result audio starts before result persistence; the result dialog at both 350 ms and 1300 ms does not cancel its finite voice. Any modal blocks new batches. Menu confirmation policy is intentional: accepted upgrade/evolve/reward events remain recognized by the mapper but are silent while a menu owns presentation. The sole new direct-action exception is an accepted Cards summon: after persistence and ownership checks it plays one distinct 320 ms ordinary-budget shimmer. Its drained metadata is always suppressed, including in battle. A finite direct shimmer may finish in Cards or its own summon modal; settings, hidden state, manual pause, ownership loss and other menus stop it. It never grants general menu/event-drain playback.

Audio changes preserve chapter music, mix preferences, village mood, simulation events, persistence/session guards and the guarded renderer port. The merge separately retains incoming daily-reward/save normalization, floater stacking, documentation and robustness-script changes from main.

## Fresh verification

- Mapper RED: missing module; GREEN: 6 passed.
- Playback RED: new production APIs absent. GREEN focused mapper/audio/village/actual-main tests: 27 passed, zero failures/skips.
- Main integration RED: type-only batch lost the ranged material (`sine` instead of `sawtooth`) and played three cues for a result batch instead of one; GREEN: all four actual-main/village tests passed.
- `npm test`: exit 0, 416 passed, zero failures/skips.
- `npm run build`: exit 0, TypeScript plus Vite production build. Existing large-chunk warning remains.
- `git diff --check`: exit 0.

## Offline harness and required CI gate

`scripts/review-audio.mjs --offline --output artifacts/audio-review/task-1` owns a local Vite server and native Playwright Chromium. Its fixture imports actual production `selectCombatCues`, `renderCombatCue` and `synthesizeSoundscape`; no copied cue DSP or fake browser graph. It renders seventeen isolated one-second stereo cues and the fixed twenty-second crowded sequence at 16 kHz. Transparent native oscillator start/stop observation records actual production cue timing. First Fires PCM is mixed at .35; integer-millisecond batch keys combine rotating unit hits, coins, deployment, player-base damage, all skills and the result-suppressed terminal batch. This waveform fixture does not prove live admission or village-accent mixing.

Float samples are measured before WAV conversion. The command rejects nonfinite samples, silence, clipping, incorrect format/duration and isolated onset/end residue ≥1e-5. JSON records peak/RMS, batch and mix parameters, native voice allocation/release counts and ±1 ms sample windows around every onset/end. PCM16 encoding does not clamp bad samples. In-progress/failure metrics and server diagnostics remain available if a later native render fails.

CI retains all existing simulation/build/portrait/layering/save-session gates, adds required `offline_audio`, and publishes `offline-audio-review` containing WAVs, metrics and the command log. Timeout rises from 20 to 30 minutes to accommodate the established portrait/layering/save-session runtimes plus the new gate and upload.

Additional fresh verification on the combined candidate:

- Numeric gate RED: helper absent; GREEN: 2 tests reject NaN/infinity/clipping/silence/format/boundary residue and verify float-energy metrics plus PCM16 output.
- Crowded sequence RED: fixture absent; GREEN: exact shared-time selections, complete source-kind metadata, 182 unit hits including the result fixture hit, four enemy-side base hits and twelve player spawns.
- Independent admission finding fixed RED→GREEN: five ordinary + one critical + two ambient accents previously let an ordinary cue reclaim an accent. New regression verifies the ordinary capacity drop preserves accents and cooldown, while a critical cue reclaims exactly one. Added explicit critical-only guard.
- `node --check scripts/review-audio.mjs` and `node --check scripts/audio-review-metrics.mjs`: exit 0.
- `node scripts/review-audio.mjs --help`: exit 0; executable argument path verified without browser initialization.
- Focused combat/harness tests: exit 0, 12 passed.
- `npm test`: exit 0, 421 passed, zero failures/skips.
- `npm run build`: exit 0; fixture TypeScript also checked. Existing chunk warning remains.

## Concurrent main reconciliation

Inspected the merge-base diff before merging main `6b1db227` with no commit. `src/main.ts`, `src/view/audio.ts` and `package.json` conflicted: retain guarded/semantic ownership, keep both save-session and monkey commands, and adapt the incoming legacy audio tests to production semantic behavior. All unrelated auto-merged main changes are retained. Root owns the eventual merge commit; no commit was made by the implementer.

PRs 73–76 added dedicated death/skill/summon/material roles. Skill and material distinctions were already retained by Task 1. The parent explicitly authorized replacing death silence with a quiet 140 ms falling cue, lowest priority, coalesced across both sides, one per 250 ms. It also authorized a dedicated accepted-action summon path with a distinct rising 320 ms multi-lobe envelope. Both use one oscillator and the same six ordinary/eight shared transient limits; neither can reclaim an accent. Specification and plan now record these narrow policy changes.

New RED→GREEN evidence:

- Death had no descriptor or production voice; now coalesces both sides, obeys its exact cooldown boundary and yields to higher-priority/result cues.
- Summon metadata originally mapped to upgrade; now receives a dedicated descriptor and production contour, while batch playback explicitly rejects it.
- The actual accepted main summon action originally started zero voices; now starts exactly one after persistence/ownership checks, survives its own modal and never replays the drained event. Rejected/muted/hidden/settings/unowned actions and persistence-time ownership loss remain silent.
- The offline fixture originally enumerated 15 cues; now enumerates 17. The runner derives its count from a tested validation helper, rejects duplicate/missing merged roles and expects one crowded render in addition to that count.

Final reconciled verification (working tree with merge parent `6b1db227`, no commit):

- `npm test`: exit 0, **436 passed**, zero failures/skips; includes retained incoming daily/save/floater tests and all guarded village/audio regressions.
- `npm run build`: exit 0, TypeScript and Vite production build.
- Both audio script syntax checks and CLI help: exit 0.
- `git diff --check HEAD`: exit 0; `git ls-files -u` empty, merge conflicts resolved.
- Native offline CI and listening remain outstanding. The fixture now exports seventeen isolated cues plus one crowded sequence; no local browser launch was attempted.

## Integrated mastery baseline

The audio branch now includes the approved full mastery checkpoint `e2b0cfa93bd8c483ffdc4a3152ce3f0309f6f650` on production/audio `0efce8269091c1c07862489d5566f57014fd1f9d`, using a command-scoped Codex identity and a no-commit merge. This intentionally stacks PR 78 on PR 67 with production recovery and audio, rather than releasing divergent main implementations. Root owns the merge commit and publication.

`src/main.ts` merged cleanly. Source inspection confirms semantic full-batch audio, guarded direct summon, its finite tail and village lifecycle remain alongside mastery receipt authority, result-origin evolution return/cancel routes, terminal retry-to-picker routes and synchronous recovery priority. Audio modules/mapper/fixture/runner and the production save-session browser harness have no diff against the preceding audio/production head.

The workflow conflict was resolved by retaining both mandatory gates and their artifacts: mastery’s 37 native scenarios and offline audio’s seventeen isolated cues plus the crowded reference. Existing portrait (42), layering (91) and save-session (11) gates/artifacts remain. The job retains its 30-minute budget. Every gate must succeed before the job passes; unavailable local Chromium is never interpreted as a passed browser check.

Fresh integrated evidence:

- Focused actual-main, village/session, combat and mastery-interface/browser-harness Node tests: exit 0, **63 passed**, zero failures/skips. Includes settled/legacy evolution receipt preservation, guarded close/Escape/confirmation, persistence conflict recovery priority, terminal Return/Escape without payout, metadata/result/summon audio and budget regressions.
- `npm test`: exit 0, **490 passed**, zero failures/skips.
- `npm run build`: exit 0, TypeScript and Vite production build (existing large-chunk warning).
- `node --check` on audio runner/metrics, mastery browser runner and save-session browser runner: exit 0.
- `git diff --check HEAD`: exit 0; `git ls-files -u` empty. No merge commit made by implementer.

This establishes integrated source/Node/build evidence. Native browser gates, real offline waveform metrics and listening still require their separate execution. Task 2 chapter phrasing/mix controls remain deferred.

## Outstanding evidence

No local Chromium launch was attempted: the coordinator already established SIGTRAP before page creation. Consequently no actual waveform peak/RMS values or WAV artifacts are claimed from this workspace. The native command above must pass in actual CI, yielding seventeen isolated WAVs plus the crowded WAV and measured JSON. An unavailable local native runner is not a waived or passed gate.

Listening not performed; combat distinction and masking unverified. Auditory acceptance not established. Numeric/node tests do not establish perceived loudness, timbral appeal, repetition fatigue or device behavior. Headphone and phone-speaker listening remains outstanding.

## Task 2 source checkpoint: score, preferences and buses

Checkpoint starts at `7af715391a9e280593447ffe1cc8b1157874900d`; root owns its commit and review. The previous Task 1 native gate subsequently passed in CI run `36658477032`: seventeen isolated production cues plus crowded reference, no page errors. This supersedes the historical outstanding native-offline statement above for Task 1 only. Device listening remains unperformed.

Before changing composition, the extended exporter captured the old generator at that exact checkpoint. `node --experimental-strip-types scripts/export-soundscape-review.mjs artifacts/audio-review/before` exited 0. Six chapter metrics contain source and preview-mix peak/RMS, 20 ms seam-adjacent differences including wrap, complete static mix values and exact 3,072,000-byte payloads. Twelve WAVs contain the 24-second loops and 72-second production-sample concatenations. The exporter-only diff and log are retained in the task workspace.

`CHAPTER_SCORES` now contains the six approved original phrase schedules with unchanged roots, seeds and non-water gains. Each preserves the relative opening contour 0/3/2, bounded note counts and an exposed rest of at least four seconds. The existing deterministic generator consumes each note's position/register/decay while retaining its noise, stereo offsets, delays, endpoint taper and production PCM contract. No mood-driven regeneration or additional worker/cache was added.

Audio preferences use the separate exact JSON `{version:1,effects,atmosphere}` in `almo7areboon.audio.mix.v1`. Fields normalize independently to finite clamped five-point percentages, defaulting to 100. Storage property/read/write errors remain optional. Two persistent gain buses initialize to latest intent only after an enabled gesture; effects and village beds/accents route to their respective buses. Retargeting holds the interpolated current gain and ramps over 50 ms. Mood gain/filter targets and shared transient budgets remain unchanged. Zero effects rejects new cue allocations; atmosphere zero silences its bus while preserving normal lifecycle ownership. The optional player output preserves old callers and releases sources on context/output replacement. UI controls and native browser acceptance are not implemented in this checkpoint.

Fresh evidence:

- Measurement test: absent module RED → GREEN 1/1; independent float energy, mix and seam computation.
- Authored score tests: absent score export RED → GREEN 6/6 with PCM bounds and all prior deterministic/rate checks.
- Preference/bus tests: absent public level behavior RED → GREEN 23/23 with village budget/mood regressions.
- Full suite: `npm test` exit 0, **498 passed**, zero failures/skips. The earlier single failure was an interrupted-context double missing the newly required native gain constructor; adding that constructor retained its resume assertion. Focused audio/preferences/village/integration rerun after TypeScript narrowing correction: **29 passed**.
- `npm run build` exit 0; `node --experimental-strip-types scripts/verify-soundscape-worker.mjs` exit 0, “Built worker matches source PCM for 6 chapters.” Existing chunk warning remains.
- `node --experimental-strip-types scripts/export-soundscape-review.mjs artifacts/audio-review/after --baseline artifacts/audio-review/before/metrics.json` exit 0. All six source and preview-mix RMS changes are negative (−1.663 to −0.203 dB); no >3 dB rise flag. Source peaks range .05019–.07261 and maximum seam-adjacent differences .00001799–.00008550. These are numerical observations, not auditory judgments.

Remaining Task 2 work: stable guarded settings controls; pending-generation/output replacement/failure race coverage; native production-page UI and lifecycle runner; native offline bus-integrated rerun and required CI/browser gates after root integrates parent fixes. Local Chromium remains unavailable; no launch or workaround attempted. Auditory acceptance not established: three consecutive loops for all six chapters on headphones and phone speaker, and live quiet→alarm→recovery combat in First Fires, Harbor and Courtyards, remain unverified.

## Task 2 browser RED harness checkpoint

The accepted score/preferences/buses checkpoint is committed as `59f6e44`; the reviewed modal click and recovery fixes are integrated in current base `f955b37`. Before/after exported metric files record the pre-commit base `7af7153` because export occurred before that checkpoint commit. The retained before/after paths, exporter-only baseline patch and reviewed checkpoint diff identify their distinct generator states; `59f6e44` is the committed identity of the revised score. These WAVs remain **gain-only PCM previews**. The reported `filterCutoff:5000` is metadata for a live mix setting; the exporter does not execute the player's low-pass filter, start/stop fades or dynamic village ramps.

The native `--browser` mode now implements required Task 2 production-page cases 1–3 in five isolated scenarios. It uses the real application root, valid muted save fixtures, genuine Web Locks and same-origin peer storage changes, native keyboard/mouse range input, and the explicit temporary-play route when native localStorage methods throw. The connected-input fault injection verifies ownership synchronously before a storage notification; a separate peer-change scenario checks a retained range after genuine ownership loss. No duplicate Settings page or simulated browser audio graph is used.

Before the production script loads, transparent proxies delegate all AudioContext/Worker construction and native node methods to their original implementations. They record live native contexts/workers, current/retiring beds, shared transients and atmosphere-routed accents, parameter events, source starts/stops/disconnects and storage write outcomes. Cases require zero graph construction while muted, latest 50/25 bus initialization after an enabled gesture, stable DOM identity/focus and exact keyboard steps, native pointer drag, persistence through switch cycles/reload, silent Settings input, protected mix/save/backup bytes on ownership loss and in-memory controls under blocked storage. The first expected product gap is the explicit assertion: “Missing labeled native ranges: Effects volume and Atmosphere volume.” Markup and input handlers are still absent intentionally.

CI invokes this command immediately after browser installation, uploads JSON/logs/screenshots immediately, then continues every existing offline, portrait, layering, save-session and mastery gate. `audio_browser` is included in the final required-gate expression. A failed native assertion or browser launch keeps diagnostics and fails the command/job; it is never an optional skip.

Fresh local verification at this harness checkpoint:

- CLI test RED: `--browser --help` rejected as unsupported; GREEN: browser/offline help and conflicting-mode validation, 1/1. Help never initializes the browser.
- `node --check` on the runner, browser scenarios and native observer: exit 0.
- `npm test`: exit 0, **506 passed**, zero failures/skips.
- `npm run build`: exit 0, TypeScript/Vite production build; existing large-chunk warning remains.
- `git diff --check`: exit 0.

Native UI RED execution is **unavailable locally**, due the already-established Chromium SIGTRAP before page creation. No local launch, reinstall or workaround was attempted, and no fake browser result substitutes for it. Root must commit this harness checkpoint and inspect actual CI failure diagnostics before controls are implemented. Native lifecycle case 4 and controlled-export case 5 remain outstanding in addition to the eventual GREEN replay of these exact cases. Auditory acceptance not established; headphone/phone-speaker listening and live mood/combat listening remain outstanding.

### Scoped native harness correction before RED publication

At integrated base `48acf398872fa8d0cfc2f978ba7c8325f4963452`, the independent review of harness commit `0ebefdb` found that the enabled mid-battle Settings scenario exercised only Home-to-zero input; its pointer check was confined to the muted scenario. A positive-only preview defect could therefore escape that coverage.

Case 2 now drags both real native thumbs to changed positive five-point values while Sound and Atmosphere remain enabled. Retained handles verify the same DOM inputs and active focus before/after the observation window, alongside percentage output and aria-valuetext. After each positive drag, cumulative source starts, created workers and created contexts must remain unchanged, live beds/transients must remain zero, and both switches must remain enabled. A transparent wrapper delegates native `AudioContext.prototype.resume` to its original method/promise and requires zero calls during these inputs. The zero keyboard check and screenshot remain, with an additional positive-pointer screenshot. This case observes retirement of its running bed and zero remaining transients; it does not claim that an accent was active before opening Settings.

Fresh scoped checks: browser-scenario/runner syntax, the existing no-launch CLI test (1/1), and `git diff --check` all exit 0. No product UI, observer module, dependencies or CI configuration changed. Native execution remains pending actual CI; the established local SIGTRAP restriction was preserved. No commit or browser launch was made. Cases 4–5 and auditory acceptance remain outstanding.
