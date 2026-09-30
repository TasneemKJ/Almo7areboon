# Village Keeps Watch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each painted village visibly inhabited and responsive to battle pressure, with matching optional ambience.

**Architecture:** One presentation-owned mood snapshot feeds a pure source-anchored frame model and the existing soundscape player. The renderer reuses bounded pools and respects the exact painted apertures, crop, and HUD; gameplay and saves never read this state.

**Review Ruling (2026-09-30):** The snapshot additionally retains at most two completed alarm intervals (`alarmHistory`); together with the current entry this preserves bird passage admission across recovery/re-alarm. Six-second minimum quiet separation bounds the required history for every 6–9-second passage. The field is optional for static fixtures and required on production mood state. Reduced-motion opacity uses discrete visual states, preserving the shared continuous mix for audio and restoring a full still occupant only during the final 1.5 seconds of recovery. No gameplay/save changes or unbounded history.

**Tech Stack:** Existing TypeScript, Phaser 3.90, Web Audio, Node test runner, and Playwright CI; no new dependencies or binary assets.

**Spec:** `docs/superpowers/specs/2026-09-29-village-keeps-watch.md` (root copies the completed authoritative spec into this worktree before implementation; its six plate hashes and measured coordinates govern).

## Global Constraints

- Work only in `/workspace/scratch/6a97bc4b1ac1/almo7areboon-atmosphere`, branch `feat/village-keeps-watch`, initial art baseline `942943d`; tactical/economy work owns the original checkout.
- Preserve 42 MB decoded-art and 800 KB per-chapter transfer limits. Create one 64×64 `village-light` texture (16,384 bytes): manifest 41,973,528 + light 16,384 = 41,989,912 bytes. Do not initialize the legacy 128×128 `soft-light` texture in painted scenes.
- Maximum per chapter: four lamp halos, two resident silhouettes, three harbor reflection strokes, one bird; only one resident moves at once.
- No new save fields, combat mutations, full-screen tint, wandering street inhabitants, clouds over baked roofs, per-frame scene objects/textures/masks, or DOM measurements per frame.
- Sound and Atmosphere remain independently owned by existing settings; no AudioContext before an enabled gesture. Reduced motion stays inhabited and still.

## Review Focus

- Imported/retried state identity during a paused modal: reset mood without a surprise alarm or stale visit (Task 1 integration test).
- Cropped source sky entirely under HUD on a short phone: omit the bird rather than move it across roofs (Task 1 geometry test).
- Windows smaller than 6×8 CSS pixels: coherent occupancy/light change, no enlarged faces or noisy dots (Task 1 rendered gate).
- Base hit and victory/loss in the same batch: no post-result ambience accent or contradictory recovery (Tasks 1 and 2 tests).
- Muting/changing chapter while synthesis resolves: no old buffer restart, queued pulse, or surviving audio node (Task 2 race tests).

### Task 1: Shared mood, anchored village geometry, and real renderer integration

**Owner/files:** Visual implementer owns new `src/view/village-mood.ts`, `src/view/village-life.ts`; modifies `src/view/battlefield.ts` and `src/main.ts`; adds `tests/village-mood.test.ts`, `tests/village-life.test.ts`, `tests/village-integration.test.ts`. Audio implementer must not edit these concurrently; root coordinates the later audio call-site change.

**Interfaces produced:**
```ts
type VillageMoodName = 'quiet' | 'alarmed' | 'recovering';
interface VillageAlarmInterval { enteredAt:number; endedAt:number }
interface VillageMoodSnapshot { mood:VillageMoodName; alarmMix:number; alarmSerial:number; time:number; alarmEnteredAt:number|null; alarmHistory?:readonly Readonly<VillageAlarmInterval>[] }
interface VillageMoodState extends VillageMoodSnapshot { alarmHistory:readonly Readonly<VillageAlarmInterval>[]; pressureSeconds:number; quietSeconds:number; alarmSeconds:number; recoverySeconds:number; lastPhase:Phase }
interface VillageMoodInput { phase:Phase; hpFraction:number; nearestEnemyX:number; playerBaseHit:boolean; paused:boolean }
createVillageMood():VillageMoodState;
advanceVillageMood(previous:Readonly<VillageMoodState>,input:VillageMoodInput,dt:number):VillageMoodState;
type Bounds = readonly [number,number,number,number];
interface Point { x:number; y:number }
interface PaintedPolygon { points:readonly Point[]; color:number; alpha:number }
interface VillageHalo { center:Point; rx:number; ry:number; color:number; alpha:number }
interface VillageStroke { from:Point; to:Point; width:number; color:number; alpha:number }
interface VillageViewport { placement:{x:number;y:number;scale:number}; cssWorldScale:number; visibleSource:Bounds; hudSourceBounds:readonly Bounds[] }
interface VillageFrameInput { age:number; time:number; reduced:boolean; mood:Readonly<VillageMoodSnapshot>; viewport:VillageViewport }
interface VillageFrame { residents:readonly {apertureId:string;panes:readonly PaintedPolygon[]}[]; lamps:readonly VillageHalo[]; water:readonly VillageStroke[]; bird:readonly PaintedPolygon[]|null }
villageFrame(input:VillageFrameInput):VillageFrame;
```
`Phase` comes from `game/types.ts`. Frame output points/radii are world-space; all authoring tables and containment operate in source space. Export `VILLAGE_PLATES` containing the exact paths/hashes and anchor arrays from the spec. `mountBattlefield` adds optional `villageMood?:()=>Readonly<VillageMoodSnapshot>`; existing fixture callers receive a quiet default.

- [ ] Write failing mood tests with named assertions: `debouncedPressure`: advancing in ≤.05-second steps for .59 seconds at enemyX=299 stays quiet, another .01 enters alarm; `baseHitImmediate` enters at `dt:0` once and increments `alarmSerial` once; `recoveryHysteresis` requires the 3-second minimum hold and six uninterrupted quiet seconds, finishing only after four recovery seconds. Test x=300/420 and HP=.30/.42 boundaries, phase-result batches, pause, invalid input, and reset.
- [ ] Run `node --experimental-strip-types --test tests/village-mood.test.ts`; confirm missing implementation/assertion failure, then implement the two pure functions with the spec's exact thresholds and bounded real-time delta.
- [ ] Write failing geometry tests: hash/dimensions for all six plates; every resident vertex/edge stays inside pane union and outside mullions; complete bird extents stay in corridor and outside HUD; water stays in `(480,473,591,526)`; no mark/object cap exceeded. Assert `villageFrame({...input,reduced:true,time:0})` deeply equals the same reduced input at `time:99` for identical mood.
- [ ] Run `node --experimental-strip-types --test tests/village-life.test.ts`; confirm failure, then implement anchors, pre-tessellated templates, pane clipping, bounded schedules, exact source projection, and reduced-motion composition. Use spec lamp values; require at least 100 source pixels of clear sky travel and an 8 CSS-pixel bird or return `bird:null`.
- [ ] In `main.ts`, own one `VillageMoodState`: advance after `game.step` using the unscaled presentation delta, reset on battle-state identity/chapter change, and process fresh player-base-hit batches at `dt:0` before rendering. Pause/visibility freeze it; `alarmSerial` changes only on actual alarm entry. Pass a getter through `mountBattlefield` options; do not add mood to GamePort/Profile.
- [ ] In `battlefield.ts`, replace only painted generic atmosphere with `villageFrame`; keep fallback SVG ambience. Cache source crop/HUD rectangles on resize, compute `cssWorldScale=element.clientWidth/450`, and draw through ambience Graphics plus the existing stageLight pool before armies. Initialize only one 64×64 `village-light` falloff; leave painted stars/clouds/mist and legacy 128×128 soft-light disabled while making the village stageLight pool visible. Never attach village marks to global impact FX. Reuse/reset objects on chapter/scene teardown without resetting mood on resize.
- [ ] Add integration assertions for paused retry/import reset, living-enemy filtering, hit+result batches, sprite/lamp order below troops and bases, unchanged game/profile values, stable pool counts over 180 simulated seconds, small-window fallback, and cropped/HUD-blocked bird omission. Assert one 64×64 light and no legacy 128×128 light, with total decoded bytes 41,989,912 < 42,000,000. Preserve existing source-contract tests only where they still represent intended legacy behavior.
- [ ] Run `node --experimental-strip-types --test tests/village-mood.test.ts tests/village-life.test.ts tests/village-integration.test.ts`, then `npm test` and `npm run build`; require all pass. Independently review geometry/data registration and mood ownership; root commits only the reviewed visual files with `feat: bring painted villages to life`.

### Task 2: Mood-aware sound lifecycle and rendered acceptance

**Owner/files:** Audio implementer owns `src/view/audio.ts`, `src/view/soundscape-player.ts`, `tests/village-audio.test.ts`, and affected existing audio tests; root alone wires the new `main.ts` argument after Task 1. Verification owner handles `tests/fixtures/layering.ts`, `tests/fixtures/README.md`, `scripts/capture-layering-review.mjs`, `scripts/capture-browser-review.mjs`, and the existing workflow only if an additional artifact is needed.

**Interfaces consumed/produced:** `SoundscapeMood = Readonly<Pick<VillageMoodSnapshot,'alarmMix'|'alarmSerial'>>`; extend `updateSoundscape(age:number,audible:boolean,mood?:SoundscapeMood):void` and `SoundscapePlayer.update(context:AudioContext|undefined,age:number,audible:boolean,mood?:SoundscapeMood):void`. Omitted mood means `{alarmMix:0,alarmSerial:0}`. Existing `cancelPending`, `dispose`, `suspendAudio`, `unlockAudio`, and `ambienceAllowed` remain the lifecycle owners.

- [ ] Write failing mocked-audio assertions: mood changes reuse one cached buffer/synthesis request; calm→alarm ramps gain `.35→.22` and cutoff `5000→1700` over ≥`.6` seconds; alarm serial triggers one ≤`.015` knock with ≥8-second cooldown; sustained alarm pulses ≤`.012`, ≥1.8 seconds apart, at most two atmosphere accent voices within the existing total eight-voice limit.
- [ ] Run `node --experimental-strip-types --test tests/village-audio.test.ts`; confirm failure, then extend each soundscape voice with one optional low-pass filter and smoothed mix. Use AudioContext time only while audible; no setInterval, queued catch-up accents, new full-loop buffers, or phase-specific workers. Combat may drop an ambience accent when the shared cap is occupied.
- [ ] Add/verify race tests for Sound off, Atmosphere off with combat still enabled, pause, modal, tab, document hidden, pagehide, dispose, rejected generation, chapter replacement, stale resolved worker, and win/loss in the same event batch. Assert zero resumed old-chapter sources and zero retained accent nodes after teardown; assert `updateSoundscape` before a gesture creates zero contexts.
- [ ] Root wires the shared mood into the existing `syncPause` soundscape call; retain the unchanged `ambienceAllowed` boolean. Extend existing test expectations without weakening mute/visibility assertions. Run `node --experimental-strip-types --test tests/village-audio.test.ts tests/audio.test.ts tests/soundscape-integration.test.ts tests/soundscape-player.test.ts`; require all pass.
- [ ] Extend real Phaser captures with deterministic quiet/alarmed/recovering clocks for all six painted chapters at 390px; capture 320px First Fires, Olive, Harbor, and Hillside plus reduced-motion and short-crop cases. Capture frames several seconds apart and a combat crossing; assert actual display order/pool bounds and inspect that windows remain behind their framing and troops, lamps stay attached, and no bird enters a roof or HUD.
- [ ] Listen to First Fires, Harbor, and Courtyards across quiet→alarm→recovery, then mute/hide/dispose. Check loudness, combat masking, loop continuity, and silence after teardown. If playback is unavailable, report the specific unverified audio gate rather than claiming listening occurred.
- [ ] Run `npm test`, `npm run build`, and the existing required browser/layering CI commands; inspect emitted artifacts and runtime-memory evidence. Obtain independent whole-change review; root commits reviewed remaining files with `feat: let village ambience respond to battle pressure`, raises the PR, waits for checks and rendered evidence, and merges the exact reviewed head under the existing user authorization.
