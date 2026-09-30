# Music and Sound Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give combat readable semantic cues and all six chapters quieter authored musical phrases, with persistent Effects and Atmosphere levels.

**Architecture:** A pure bounded mapper preserves simulation event metadata; the existing audio owner admits and renders the selected cues against the village's shared transient budget. Chapter score data feeds the existing single-worker synthesizer, while two persistent audio buses apply the player's mix independently of village mood ramps. Production rendering exports also generate offline evidence; real browser checks and human listening are separate acceptance gates.

**Tech Stack:** Existing TypeScript, Web Audio/OfflineAudioContext, Node test runner, Vite and Playwright; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-30-music-and-sound.md`; read alongside `.superpowers/audio-direction-audit.md` and the village specification.

## Global Constraints

- Integrated implementation baseline: `ee52b574b6bf81964eb041cde120a68202ae610c` combines village `af853e5a` and protected saves `2ea8e2e`, including offline startup and calmer walking. Both predecessor PRs retain their own required browser/release gates. Isolated audio implementation may proceed after this combined baseline's independent review; the audio release must include their accepted integrated state. Re-read integrated `main.ts`; preserve `playable()`, `guardAction()`, guarded `action()`, session-owned `persist()`, pagehide/pageshow and renderer-port ownership. Do not restore baseline copies of those functions.
- Root owns shared `main.ts` integration and final commits/PR handling. This document author performs no implementation or commit. Execution commits below belong to the implementation workflow and do not independently authorize a release.
- “Keep `synthesizeSoundscape`'s production 24-second, 16 kHz stereo contract and its cancellable worker.” Production payload: `24 * 16000 * 2 * 4 === 3_072_000` bytes; this is not total audio memory.
- “Retain eight total **transient** voices shared by effects and village accents, of which at most two are ambient accents.” Bed sources remain one current plus one retiring source. Ordinary effects occupy at most six slots; critical cues can reclaim ambient accents, never other effects or critical cues.
- “Limit to three admitted cue descriptors per batch before audio cooldown/voice checks, with stable original order for ties.” Selection is linear in input size with fixed-size retained candidates; no backlog, timers, additional scheduling service or unbounded history.
- No second AudioContext, additional concurrent worker, all-chapter PCM cache, dependencies, samples, recorded vocals, new reverb network, simulation mutation, Profile fields or migration.
- No context or worker before an enabled gesture. Sound remains master; Atmosphere gates bed and accents. Settings remain paused and silent; changing a level never enables a switch or previews audio.
- Preserve the village's sole `alarmMix`/`alarmSerial` owner, `.6`-second gain/filter ramps, knock/pulse admission and all existing lifecycle regressions. Reduced motion is independent of sound.
- Numeric/render tests cannot establish musical identity, timbral appeal, masking, repetition fatigue or device loudness. Record unavailable browser or listening gates explicitly; do not mark them passed from descriptors, PCM hashes or screenshots.

## Review Focus

- Malformed runtime events and contradictory result batches: explicit silence/neutral fallback and one stable result, never a deployment fallback (Task 1 mapper tests).
- A high-priority cue arriving while ordinary voices or retiring accents consume capacity: respect both limits, reclaim only an accent, retain real-time cooldown boundaries (Task 1 admission tests).
- A node constructor/start/stop failure followed by late callbacks or context replacement: each reserved slot releases once and cannot decrement the new context's count (Task 1 lifecycle tests).
- Drag/keyboard input during save-session ownership loss or blocked storage: no preference mutation, profile write, focus replacement or unsolicited audio unlock (Task 2 guarded browser tests).
- A level/chapter/mute change while generation/resume is pending: use latest intent, reject stale work, preserve one worker and bounded bed sources (Task 2 race tests).

## File responsibilities and contracts

| File | Responsibility |
| --- | --- |
| `src/view/combat-cues.ts` (new) | Validate event semantics, coalesce and select at most three descriptors; no Web Audio or mutable history. |
| `src/view/audio.ts` | Existing gesture/context owner; effect cooldowns and active handles; shared transient admission; exported production cue rendering; later two persistent level buses. |
| `src/view/chapter-score.ts` (new) | Six bounded original phrase/timbre definitions, no PCM or player state. |
| `src/view/soundscape.ts` | Consume score data in the existing deterministic DSP and preserve its PCM contract. |
| `src/view/soundscape-player.ts` | Existing bed/accent lifecycle; route both families to the supplied atmosphere bus without altering mood targets. |
| `src/ui/audio-preferences.ts` | Existing switches/gate plus normalized versioned mix storage. |
| `src/main.ts`, `src/style.css` | Guarded UI integration, labeled ranges, stable value display and existing lifecycle ownership. |
| `scripts/export-soundscape-review.mjs` | Production-generator WAV/metrics and baseline comparison. |
| `scripts/review-audio.mjs` (new), `tests/fixtures/audio-review.html`, `tests/fixtures/audio-review.ts` (new) | Real browser offline production-cue rendering and live production-page checks; no copied DSP or alternate game implementation. |
| `tests/combat-cues.test.ts`, `tests/combat-audio.test.ts`, `tests/chapter-score.test.ts`, `tests/audio-preferences.test.ts` (new) | Semantic, scheduling/ownership, composition and storage RED/GREEN tests. |
| Existing audio/village/worker tests; `docs/reviews/2026-09-30-music-and-sound.md` (new during execution) | Preserve regressions and record commands, artifact paths, measured evidence and explicit listening status. |

### Task 1: Semantic combat cues, bounded playback and actual rendered previews

**Files:** Create mapper, two combat tests and browser review script/fixture listed above. Modify `src/view/audio.ts`, root-owned `src/main.ts`, `tests/audio.test.ts`, `tests/village-audio.test.ts` and affected audio integration tests. Begin the review report. Do not alter music, preferences or village mood in this task.

**Consumes:** `GameEvent`, `UnitKind`, `Skill` from `src/game/types.ts`; full batches delivered to `events(batch:GameEvent[])`; `SoundscapePlayer.dropAccent():boolean`; current `unlockAudio`, `suspendAudio`, `disposeAudio`, `updateSoundscape` lifecycle. `side` on a hit is the attacker. Checked unit definitions use kind 0 melee, 1 ranged, 2 heavy, but use material names in audio code rather than chapter-specific weapon claims.

**Produces:** Export these contracts; Task 2 retains their names and routes their output through its effects bus.

```ts
// src/view/combat-cues.ts
export type CombatCueId = 'deploy' | 'hit-neutral' | 'hit-blunt' | 'hit-flick'
  | 'hit-hollow' | 'base-player' | 'base-enemy' | 'coin'
  | 'freeze' | 'meteor' | 'food' | 'upgrade' | 'evolve' | 'win' | 'lose';
export type CueCooldown = 'deployment' | 'unit-hit' | 'base-hit' | 'coin';
export interface CombatCue {
  readonly id: CombatCueId;
  readonly eventIndex: number;
  readonly priority: number;
  readonly critical: boolean;
  readonly cooldown: CueCooldown | null;
}
export function selectCombatCues(events: readonly GameEvent[]): readonly CombatCue[];

// src/view/audio.ts; production renderer, also used by OfflineAudioContext
export interface CueVoice { dispose(): void }
export function renderCombatCue(context: BaseAudioContext, output: AudioNode,
  id: CombatCueId, at: number, onRelease: () => void): CueVoice | undefined;
export function playCombatEvents(events: readonly GameEvent[], enabled: boolean): void;
export function stopCombatAudio(): void;
```

`renderCombatCue` allocates exactly one oscillator and one envelope gain. `onRelease` runs exactly once on natural end, explicit disposal or construction/scheduling failure; failures return `undefined`, detach callbacks and disconnect partial nodes. The caller reserves a slot before calling it. `dispose()` stops/disconnects immediately and is idempotent. An effect scheduled to stop still occupies its slot until its handle is released. No exported diagnostic mutable game state is required.

- [ ] **Write mapper RED tests in `tests/combat-cues.test.ts`.** Use actual `GameEvent` objects; cast malformed runtime fixtures only at the test boundary. Assert these names and outcomes with `assert.deepEqual(selected.map(c=>c.id), expected)`:

  | Test | Input and required assertion |
  | --- | --- |
  | `baseDamageUsesAttackerSide` | Unit hit, player-side base hit, enemy-side base hit → `['base-player']`; chosen `eventIndex===2`, `critical===true`. |
  | `kindAndSkillMetadataSurvive` | Separate unit hits with kinds 0/1/2 → blunt/flick/hollow; `[skill freeze, skill meteor, skill food]` → those three IDs in order, all critical. |
  | `resultSuppressesBatch` | `[coin, hit, lose, win, skill]` → `['lose']`; two contradictory results choose the first original event, not an invented combined cue. |
  | `stablePriorityAndCap` | `[coin, spawn player, upgrade, hit unit, skill meteor]` → `['meteor','hit-neutral','deploy']`; length ≤3 even with 100,000 events. Do not use a timing-sensitive benchmark as proof of complexity. |
  | `silenceAndNeutralFallback` | Enemy spawn, death, unknown type, null, missing type, invalid skill → `[]`; `{type:'hit'}` or missing/invalid `source.kind` on a unit hit → `['hit-neutral']`. |
  | `boundedCoalescing` | Repeated player spawns/hits/coins → at most one of each; valid repeated skill events remain separately eligible up to the three-cue cap. Freeze the input and assert it is unchanged. |

- [ ] **Run RED:** `node --experimental-strip-types --test tests/combat-cues.test.ts`. Require missing-export/module or behavioral assertion failures, not syntax/fixture errors.

- [ ] **Implement `selectCombatCues` in `src/view/combat-cues.ts`.** Retain bounded candidates per fixed category and at most the first three skill events; never sort/copy the whole batch. One result suppresses everything. Otherwise priorities are result 7, skill 6, player-base 5, enemy-base 4, unit hit 3, deployment 2, reward/upgrade/evolve 1. Select one hit-family candidate per batch (highest priority, then earliest index); coalesce deployment/coin/upgrade/evolve by ID. Merge the fixed candidates by priority descending, index ascending and return the first three. Only a known player spawn is audible. Missing hit metadata means neutral unit hit; a base hit with missing/invalid attacker side also falls back to neutral rather than inventing player damage. An explicitly invalid target value is malformed and silent. Critical IDs are result, skills and `base-player`; cooldown groups are deployment `.120`, unit-hit `.090`, base-hit `.180`, coin `.250` seconds; other cues have no extra cooldown.

- [ ] **Run mapper GREEN:** repeat its command; all cases pass. Check the implementation retains constant-size candidates as well as a fixed output size.

- [ ] **Write playback RED tests in `tests/combat-audio.test.ts`.** Extend the existing recorded AudioContext/Worker boundary style, retaining native ownership code. Assert scheduling calls and live connected oscillator counts, not merely descriptor names:

  - `audioClockCooldownBoundaries`: for deployment/hit/base/coin, start at `currentTime=1`; attempts at `1+interval-.000001` allocate zero; `1+interval` admits exactly one, allowing `1e-9` comparison tolerance. Player/enemy base cues share a clock, as do all unit materials. Successful starts alone consume cooldown; a failed start or capacity drop may retry immediately after capacity/failure clears.
  - `speedCannotCompressCooldowns`: deliver dense identical batches at 1× and 2× simulation timestamps but the same audio times; admitted starts match. Calls while paused/hidden consume no cooldown and queue nothing; `stopCombatAudio()`, a long gap and a fresh batch produce only the fresh batch.
  - `ordinaryAndCriticalCapacity`: with callbacks deliberately delayed, six ordinary effects plus two village accents never allow a seventh ordinary effect. A skill reclaims one accent; a player-base cue can reclaim the remaining one. With eight effect/critical voices, another result/skill is dropped; no effect is preempted. Result+coin+hit at available capacity allocates one result only. Count any still-retiring connected voices.
  - `cleanupOwnsOneContext`: force oscillator/gain construction, connect, parameter scheduling, start and stop to throw independently. Each partial node disconnects and each reservation releases once; captured late `onended` callbacks after suspend/dispose/context replacement neither double-release nor subtract the replacement owner's voices. Repeated suspend/dispose stays safe.
  - `onsetAndResultDuration`: every cue begins gain at `0`, has a 2–5 ms attack, ends at zero/near-zero, uses one oscillator, and results stop within `.650` seconds. Three hit materials and three skills differ in waveform/envelope structure as well as their pitch values. This is structural verification, not listening acceptance.

- [ ] **Run playback RED:** `node --experimental-strip-types --test tests/combat-audio.test.ts tests/audio.test.ts tests/village-audio.test.ts`. Confirm new behavior fails before replacing the legacy tone path.

- [ ] **Implement renderer and admission in `src/view/audio.ts`.** Use a small readonly cue-definition table of frequency/envelope points and native oscillator scheduling; export `renderCombatCue` so previews cannot substitute a DSP imitation. Start at gain zero, linearly attack, and finish at zero (never exponential-ramp to zero). Suggested initial values below are deliberately reviewable implementation values, not mastered loudness:

  | ID(s) | Waveform; duration; peak | Distinguishing contour |
  | --- | --- | --- |
  | deploy | triangle; `.080`; `.040` | Fixed 330 Hz, 3 ms attack, rounded decay; no sweep. |
  | hit-neutral / hit-blunt | sine / triangle; `.065` / `.090`; `.025` | 130→80 / 150→65 Hz; 3 ms attack then monotone decay. |
  | hit-flick | sawtooth; `.035`; `.012` | 360→180 Hz; 2 ms attack, fastest decay. |
  | hit-hollow | sine; `.130`; `.030` | 110→55 Hz; 5 ms attack, a low shoulder at 40 ms then decay. |
  | base-player / base-enemy | triangle; `.200`; `.040` | Same structural timbre, 95→42 Hz; 5 ms attack, broad 35 ms shoulder. |
  | coin | sine; `.120`; `.030` | 880→1175 Hz with two envelope lobes, second at 65 ms, one oscillator. |
  | freeze | sine; `.280`; `.040` | Falling 1100→550 Hz, narrow onset and small second lobe at 90 ms. |
  | meteor | triangle; `.320`; `.045` | 180→45 Hz, 5 ms attack and broad low decay, no noise burst. |
  | food | sine; `.300`; `.040` | 330→440→660 Hz; 5 ms attack and rounded mid-phrase shoulder. |
  | upgrade / evolve | triangle; `.180` / `.360`; `.040` | 330→440 Hz confirmation; evolution extends to 660 Hz. |
  | win / lose | sine; `.600`; `.045` | Three connected tones 330→440→660 / 330→311→294 Hz with softened envelope valleys. |

  Retain a per-context set of effect handles and four last-successful-start values. `playCombatEvents` checks enabled/permitted/running state, then iterates mapper output using `context.currentTime`. Reject an ordinary cue if six ordinary voices already exist; at the total cap, reclaim only an existing village accent when otherwise eligible. Reserve before allocation; release via a closure bound to that context generation. Commit cooldown only when rendering returns a handle. Keep all eight effect slots and both ambient slots accounted through existing shared ownership. `stopCombatAudio()` releases effects and clears cooldown state without creating/resuming anything. Invoke it on suspend, dispose and context replacement.

- [ ] **Integrate the complete batch in root-owned `main.ts`.** Replace the type Set/`sound(event.type,…)` loop with one `playCombatEvents(batch, game.profile.sound && playable() && !document.hidden)` call inside the existing event owner. Keep village batch delivery and result `persist()` ordering. Gate stale events while a modal/menu/manual pause owns the session; permit the fresh result batch before the result modal opens. In `syncPause`, stop effects when hidden, paused, in another screen or a non-result modal, or not playable; a result modal alone allows the already-started finite result cue to finish, while admitting no new batches or ambience. Test this with reduced motion's earlier result dialog as well as the ordinary dialog. Do not gate fresh win/lose solely because the simulation phase is terminal. Remove `sound(kind:string,…)` after migrating all callers/tests, including the old budget test to semantic events; retain its original ownership assertions.

- [ ] **Run playback GREEN:** repeat focused tests, then `node --experimental-strip-types --test tests/soundscape-integration.test.ts tests/soundscape-player.test.ts tests/soundscape-worker.test.ts tests/village-integration.test.ts`. Require existing bed/worker and village lifecycle assertions to remain passing.

- [ ] **Create the real offline export in `scripts/review-audio.mjs` and the audio-review fixture.** The script starts/stops a local Vite server and Playwright Chromium, imports production `selectCombatCues`, `renderCombatCue` and `synthesizeSoundscape` through the fixture, and uses browser `OfflineAudioContext(2, seconds*16000,16000)`. Write one 1-second WAV per cue and a fixed 20-second crowded reference: a production First Fires bed at `.35`; unit-hit batches every `.100` seconds from `.5` to `18.5`, kinds rotating 0/1/2; coin every `.500`; player spawn every `1.5`; enemy-side base hits at `3,8,13,18`; freeze/meteor/food at `4,9,14`; win+coin+hit at `19`. Combine events sharing a time and pass each batch through the production mapper. Schedule selected production voices at those times; do not reproduce oscillator math in the script. This reference deliberately uses cadence above the live cooldown limits; it is a waveform fixture, not proof of real-time admission or ambient-accent mixing.

  Measure pre-WAV float data (do not hide clipping with the WAV encoder): all samples finite, `0 < RMS`, `peak < 1`, isolated start/end residual `<1e-5`, duration/rate/channels exact. Report peak/RMS and fixture parameters in JSON alongside WAVs; include sample interval around each onset/end for inspection. Throw on failures or missing OfflineAudioContext/browser. `node scripts/review-audio.mjs --offline --output artifacts/audio-review/task-1` must exit 0 and emit 15 isolated WAVs plus the crowded WAV and metrics. These are actual production-rendered cues; hearing distinctions remains unverified until listening.

- [ ] **Review and commit Task 1 during execution.** Run `npm test` and `npm run build`; record commands and offline artifacts in `docs/reviews/2026-09-30-music-and-sound.md`. Independently review mapper/admission/render/cleanup and inspect the crowded waveform. Record listening observations if a reviewer is available, otherwise “Listening not performed; combat distinction and masking unverified.” Root stages only Task 1 files and commits `feat: add semantic bounded combat audio` after review.

### Task 2: Authored chapter phrases, persistent mix levels and guarded browser acceptance

**Files:** Create `src/view/chapter-score.ts`, `tests/chapter-score.test.ts`, `tests/audio-preferences.test.ts`. Modify generator, preferences, audio owner, player, root-owned UI/style, review scripts/report and existing soundscape/worker/audio tests. Preserve Task 1 contracts.

**Consumes:** Task 1 `playCombatEvents`, `renderCombatCue`, `stopCombatAudio`; existing `SoundscapePCM`, `soundscapeAge`, `synthesizeSoundscape(input:number, requestedRate=16000):SoundscapePCM`; `SoundscapeMood`; `createSoundscapeSynthesis`; `loadAtmosphere`, `saveAtmosphere`, `ambienceAllowed`; integrated save-session guard.

**Produces:**

```ts
// src/view/chapter-score.ts
export interface ScoreNote { readonly at:number; readonly semitones:number; readonly decay:number }
export interface ChapterScore {
  readonly root:number; readonly air:number; readonly water:number;
  readonly pluck:number; readonly breath:number; readonly seed:number;
  readonly plucks:readonly ScoreNote[]; readonly answers:readonly ScoreNote[];
}
export const CHAPTER_SCORES: readonly ChapterScore[]; // exactly six entries

// src/ui/audio-preferences.ts; numeric values are percentages
export interface AudioMix { readonly effects:number; readonly atmosphere:number }
export const AUDIO_MIX_KEY = 'almo7areboon.audio.mix.v1';
export const DEFAULT_AUDIO_MIX: AudioMix; // {effects:100, atmosphere:100}
export function normalizeAudioMix(value:unknown): AudioMix;
export function loadAudioMix(storage?:Pick<Storage,'getItem'>): AudioMix;
export function saveAudioMix(mix:AudioMix, storage?:Pick<Storage,'setItem'>): boolean;

// src/view/audio.ts
export function updateAudioMix(mix:AudioMix): void;
// src/view/soundscape-player.ts; optional final argument preserves fixture callers
// update(context:AudioContext|undefined, input:number, audible:boolean,
//        mood?:SoundscapeMood, output?:AudioNode):void
```

The stored JSON is exactly `{version:1,effects:number,atmosphere:number}`. Load missing/corrupt/unsupported-version data as defaults. Normalize each finite numeric field independently to `[0,100]` and nearest multiple of 5; strings, null, NaN and infinity use 100 rather than coercion. Catch both storage-property access and get/set errors. Keep existing `ATMOSPHERE_KEY` semantics and never write profile/backup keys for mix changes.

- [ ] **Extend baseline measurement and capture the old production generator before changing composition.** First extend `export-soundscape-review.mjs` to record source and preview-mix peak/RMS, production bytes, all mix values, and maximum absolute adjacent-sample change over the last/first 20 ms including the wrap, as required by the comparison step below. Keep synthesis unchanged during this instrumentation. Run `node --experimental-strip-types scripts/export-soundscape-review.mjs artifacts/audio-review/before` and retain metrics/WAVs in the review artifact set; confirm all comparison fields exist for six chapters. Record the integrated baseline commit and exporter-only diff; do not label older audit evidence as a fresh run. Only then change composition.

- [ ] **Write score/PCM RED tests in `tests/chapter-score.test.ts` and extend `tests/soundscape.test.ts`.** Assert six scores, unchanged roots `[146.83,130.81,146.83,130.81,110,146.83]`, deterministic distinct schedules, ≤6 plucks and ≤2 answers, finite positive decays, all starts in `[0,24)`, and at least one consecutive ≥4-second gap in the combined sorted attack times, including endpoints 0/24. Assert each chapter's three-note plucked opening preserves relative contour `[0,3,2]` (register offsets allowed). At production rate assert both lengths `384000`, duration `24`, rate `16000`, combined `byteLength===3_072_000`, finite samples, zero endpoints and peak `<=.27`. Retain existing invalid-age/rate and deterministic stereo tests.

- [ ] **Run score RED:** `node --experimental-strip-types --test tests/chapter-score.test.ts tests/soundscape.test.ts`; confirm missing score export/unchanged schedules fail.

- [ ] **Implement score data and consume it in the existing generator.** Preserve the current deterministic noise, stereo delay, endpoint ramps, clamp and bounded requested-rate behavior; use per-note decay/position instead of the shared `times`/`semitones` arrays. Initial composition data below makes the first implementation unambiguous; tune within the spec after listening, updating authored-data expectations with the recorded reason. Notation is `time:semitones`; pluck decay is the existing exponential rate, answer decay is its duration in seconds.

  | Chapter | Plucks | Answers | Decay and environmental change |
  | --- | --- | --- | --- |
  | First Fires | `1.2:0, 3.2:3, 5.2:2, 14.0:0` | `18.5:12` | pluck 2.4; answer 3; current environment |
  | Olive Terraces | `1.0:0, 1.8:3, 6.4:2, 13.0:7, 13.8:5` | `19.0:12` | pluck 2.4; answer 3; water `.003` |
  | Harbor Watch | `1.2:0, 4.0:3, 6.2:2, 15.0:-12` | `19.5:7` | pluck 1.9; answer 3; water `.019` |
  | Lantern Quarter | `1.0:0, 2.1:3, 5.0:2, 13.0:7, 14.4:5` | `19.0:12` | pluck 2.8; answer 2.4; water `.002` |
  | Hillside Watch | `1.2:-12, 4.2:-9, 7.2:-10` | `18.0:0` | pluck 2.4; answer 3; current environment |
  | Courtyards Beyond | `1.0:0, 3.0:3, 5.2:2, 13.0:7, 16.0:5` | `20.5:12` | pluck 1.7; answer 3; water `.004` |

  Keep other chapter gains/seeds unchanged initially. Derive answer frequency with the same relative-semitone convention; do not introduce a second synthesis pass/worker or regenerate for mood/volume. Keep each pluck's existing 2.9-second synthesis span unless audible review justifies a bounded change.

- [ ] **Run score GREEN and actual worker equivalence:** focused score/PCM tests, `npm run build`, then `node --experimental-strip-types scripts/verify-soundscape-worker.mjs`; require “Built worker matches source PCM for 6 chapters.” Preserve a single active worker and current-buffer cache, including transfer ownership.

- [ ] **Write preference/bus RED tests in `tests/audio-preferences.test.ts` and `tests/combat-audio.test.ts`.** Assert missing/bad JSON/wrong version defaults, per-field nonfinite/string fallback, `{-10,140}→{0,100}`, `{23,77}→{25,75}`, getter/getItem/setItem exceptions, persistence round trip, and unchanged save/backup bytes. Assert load/mix changes/unlock(false) create zero contexts/workers; switches retain saved percentages. With native parameter-recording doubles, assert effects `0` leaves atmosphere gain and generation unchanged, atmosphere `0` makes bed/accents inaudible but preserves effects, level `50` uses a bus multiplier `.5`, and every live retarget ramps over ≥`.050` seconds from the interpolated current value. Switching `100→0→100` while muted creates no nodes.

- [ ] **Run preference/bus RED:** `node --experimental-strip-types --test tests/audio-preferences.test.ts tests/combat-audio.test.ts tests/village-audio.test.ts`; require failures on absent level behavior.

- [ ] **Implement preferences and buses.** In `audio.ts`, retain desired normalized mix without allocation; create exactly one effects GainNode and one atmosphere GainNode per successfully gesture-created context. Initialize gains before connecting audible sources. Connect production cue envelopes to effects bus; add the optional output argument to `SoundscapePlayer.update`, route both active/retiring beds and accents to atmosphere bus, and default omitted output to `context.destination`. Replacing context/output must release incompatible sources; repeated identical output must not restart them. Keep `.35-.13*alarmMix`, `5000-3300*alarmMix` and accent envelope targets inside the player unchanged. Route volume ramps separately, tracking interpolation like the existing mood ramp. Dispose buses once with context ownership. At zero effects level drop new cue allocations; zero atmosphere level silences the entire atmosphere bus after its ramp, without changing the Atmosphere switch or bypassing existing lifecycle gates. The bounded bed/accent owner may remain active at zero while battle is otherwise audible; it still has at most two accents and never queues them. Level changes do not unlock, resume, call `retry()` or launch synthesis while settings are open.

- [ ] **Write and run guarded UI RED checks before adding controls.** Add the production-page cases 1–3 specified in the browser acceptance step below, then run `node scripts/review-audio.mjs --browser --output artifacts/audio-review/browser-red`. The first failure must identify missing labeled ranges; after creating their markup but before wiring input, verify a value/persistence assertion fails. Retain these exact cases for GREEN; source regexes do not substitute for native input/focus checks.

- [ ] **Integrate guarded controls in root-owned `main.ts` and `src/style.css`.** Load one `audioMix` snapshot and call `updateAudioMix` before the first gesture. Under switches render native ranges `id="effects-volume"`/`id="atmosphere-volume"`, explicit `<label for>Effects volume</label>`/`Atmosphere volume`, `min="0" max="100" step="5"`, and outputs with IDs `effects-volume-value`/`atmosphere-volume-value` that display `0%` through `100%`. Describe Atmosphere as “Music and environmental sound”. A delegated lifetime-owned `input` listener accepts only those ranges inside the current settings modal, checks `guardAction()` and modal ownership first, then normalizes, saves the separate preference key, calls `updateAudioMix` and updates only that output text/`aria-valuetext`. Do not call `showSettings`, `persist`, dispatch, or `unlockAudio` from input. Keep ranges usable with Sound/Atmosphere off. Preserve existing switch click guard and profile-sound persistence. No global keyboard shortcut consumes range arrow keys; preserve focus isolation and reduced-motion handling.

- [ ] **Extend race tests and run GREEN.** In existing integration/player/worker tests add `latestMixWinsPendingGeneration` and `replacementKeepsBudgets`: change chapter→level→mute during a pending worker, invoke stale completion after cancellation, then gesture/retry; only latest chapter/mix starts. Force source construction and worker constructor/postMessage errors; no unhandled rejection, frame-by-frame retry or retained slots. Cover pause, modal, menu, hidden, pagehide, result, interrupted context, rejected/late resume, replacement and repeated disposal; assert max eight transients/two accents, max two bed sources, one worker and no replay burst. Run focused audio/preference/score/village tests, then `npm test` and `npm run build`.

- [ ] **Require real-browser UI/lifecycle checks in `scripts/review-audio.mjs --browser`.** Reuse installed Playwright and the script-owned server; test the production app, not a duplicate settings page. Instrument native constructors/methods transparently to record context/worker/source lifetime, keeping real AudioContext/Worker execution; no global fake audio graph for this gate. Use isolated browser profiles and real native input:

  1. Fresh muted page seeded with a valid `sound:false` profile before first interaction (the normal default is sound on): before any enabled gesture, assert 0 contexts/0 workers; open Settings, move both ranges while muted, and assert those counts stay 0. Set effects 50 and atmosphere 25; focused ArrowLeft/ArrowRight produces exact 5-point changes, Home yields `0%`, End yields `100%`. Use pointer drag too; retain the same DOM input object and `document.activeElement`, no settings rerender, no overflow at 320px.
  2. Toggle both switches off/on, reload and reopen Settings: levels persist. Enable sound through its real button; while settings is open no bed/accent starts. Close Settings and start a battle by actual click: one running context, ≤1 worker and latest mix. Open Settings mid-battle: bed fades/stops, accents release; drag produces no preview. Check reduced motion does not change switch/level values.
  3. Two same-origin pages sharing the save session: trigger genuine ownership loss or protected future-save state using existing session fixtures. Dispatch `input` on a retained settings range after loss and assert no mix-key write, profile/backup write, game mutation, context or worker creation. Also block localStorage get/set in an isolated context, take the existing explicit temporary-play path, and verify controls still function in memory with no uncaught error.
  4. In a running page test pause/resume, another tab/menu, a real page visibility transition, navigation/pagehide and back/pageshow, result state, rapid chapter replacement and disposal. Use native page actions and integrated save/transition fixtures; do not claim a synthetic visibility event proves a hidden document. Assert no stale chapter starts, unexpected automatic unlock, retained nodes or page errors. Native resume after hiding requires an enabled gesture. If the runner cannot produce a real hidden state, mark that case unverified and retain its deterministic lifecycle unit test.
  5. In the browser-only fixture call actual production audio exports with controlled valid event batches after a real unlock gesture; verify result+base batch, 1×/2× cadence and settings mix changes against recorded native nodes. Use this fixture for precise audio cases that ordinary gameplay cannot deterministically reach; keep app-level checks above on the production page.

  Save screenshots of focused/zero/muted ranges plus JSON assertions, native peak live counts, console errors and browser version under `artifacts/audio-review/browser`. Fail the command on an assertion or launch error; unavailable execution is a reported blocker, not a skip represented as pass.

- [ ] **Export comparison and perform separate listening acceptance.** Extend `export-soundscape-review.mjs` to retain its positional output directory and accept `--baseline <metrics.json>`. For each chapter report source and preview-mix peak/RMS, production bytes, all mix values, and maximum absolute adjacent-sample change over the last/first 20 ms including the wrap. Compare previous peak/RMS/discontinuity; flag any >3 dB RMS rise for listening review rather than normalize every chapter to equal peak. Re-run the Task 1 offline cues/crowded sequence after bus integration. Add three-loop chapter WAVs from production PCM (72 seconds each) for reviewing repeated seams; concatenate the production samples, not a rewritten synthesizer.

  Listen on headphones and a phone speaker: all six chapters for three consecutive loops; then First Fires, Harbor and Courtyards through quiet→alarm→recovery with actual combat. Check base/unit distinction, all skills without pitch alone, reward/deployment distraction, repetition, seam/fade audibility, harshness, masking and volume jumps. The latter sequence must use the live production player/mood controller, not call a statically attenuated WAV a mood test. Record date, device/output mode, volume settings, observations and changes. If listening/device access is unavailable, write the exact outstanding cases and “Auditory acceptance not established”; automated browser output is not a substitute.

- [ ] **Final execution gate and commit.** Require `npm test`, `npm run build`, `node --experimental-strip-types scripts/verify-soundscape-worker.mjs`, `node scripts/review-audio.mjs --offline --output artifacts/audio-review/final`, `node scripts/review-audio.mjs --browser --output artifacts/audio-review/browser`, and `node --experimental-strip-types scripts/export-soundscape-review.mjs artifacts/audio-review/after --baseline artifacts/audio-review/before/metrics.json`. Run existing required browser/layering CI gates for touched UI/integration. Update the review report with exact commands/commit, numerical results, screenshots/audio artifact locations, review findings and listening status. Root stages only reviewed Task 2 files and commits `feat: author chapter phrases and player audio levels`; apply the existing authorized PR/check/review/merge workflow to the exact reviewed head. Do not silently waive unavailable browser or listening evidence.

## Planning self-review

Both specification tasks have one end-to-end deliverable and RED/GREEN cycles. Event semantics, selection, actual rendering, admission and cleanup belong to Task 1; score/PCM, versioned levels, guarded DOM controls, preserved mood/worker lifecycle and final browser/listening evidence belong to Task 2. The native offline fixture proves generated waveforms only; live admission, save ownership, browser gestures and listening have separate explicit checks. This document records intended tests, not tests already run or auditory findings.
