# The village keeps watch

Date: 2026-09-29 UTC / 2026-09-30 Asia/Amman

Status: implementation specification; no atmosphere implementation is claimed by this document.

## Goal and authorized scope

The user explicitly requested that the game become atmospheric and alive, alongside deeper gameplay and progression. Create the impression that the painted settlement is inhabited and notices the battle: residents watch from windows, lantern light breathes, the harbor water moves, and domestic activity retreats under pressure. Preserve the creepy, quirky, chubby Levantine storybook direction. This is a presentation-only vertical slice; tactical rules and economy work are separate.

No new binary art assets, menus, save fields, rewards, or combat rules are needed. Use the existing painted plates and bounded procedural shapes. This specification does not re-enable the old broad cloud, mist, or grading passes over painted scenery.

## Existing integration and its gaps

- `src/view/battlefield.ts` disables `dusk-atmosphere`, `lighting-hierarchy`, and `drawStageLight` pools for painted chapters. Those old lamp/water anchors belong to the former SVG composition.
- `src/view/era-atmosphere.ts` still emits broad world-space motes, gulls, leaves, and embers over the painted plate. Their positions are not registered to its houses or vegetation. Replace this painted-chapter path with the authored system below; preserve the legacy fallback path.
- `environment-vignettes.ts`, `foreground-vignettes.ts`, and `sky-omens.ts` contribute static shapes to `levantine-scenery.ts`, not moving inhabitants to the runtime paintings.
- `soundscape.ts` already generates original, chapter-specific 24-second stereo music and environmental noise. `soundscape-player.ts` already has bounded voices, caching, asynchronous generation, and race handling. Extend this system instead of introducing another music player.
- `main.ts` and `ui/audio-preferences.ts` already own Sound, Atmosphere, gesture unlock, pause, visibility, modal, and screen gating. Preserve that ownership.

## Composition and readability

The scene has three related beats:

| Mood | Village | Sound |
| --- | --- | --- |
| Quiet | One rounded head-and-shoulder silhouette peeks or passes inside an existing window; another room changes occupancy later. Selected lanterns change gently. Harbor reflections move slowly. | Existing score with a very occasional quiet wooden or ceramic accent. |
| Alarmed | Occupants withdraw; domestic windows become slightly darker and lantern halos soften. No panic swarm or new full-screen warning. | The existing bed becomes quieter and darker; one restrained watch knock marks entry, followed by a sparse low pulse only during sustained danger. |
| Recovering | Domestic warmth returns over several seconds; an occupant cautiously reappears after the lights. | The normal mix returns slowly. |

Resident shapes must read as a round head joined to broad shoulders, not as independent eyes or random dots. Ink is a dark, warm navy (`#17252a` initially), with no sharp white outlines. Use a head approximately 0.38 of the aperture width and shoulders approximately 0.82 of its width; the complete silhouette occupies about 0.75 of its height. Part of the figure is naturally hidden by mullions and the sill.

At most one resident moves at a time, with no more than two occupied windows visible. A visit lasts 5–8 seconds; intervals are deterministic and chapter-offset, approximately 9–17 seconds. Lateral travel is at most 0.28 aperture widths. Residents do not walk across the painted street or through closed doors. Do not turn existing wood panels into transparent openings.

Some Olive Terraces windows are only 13–17 source pixels wide. At a 320 CSS-pixel viewport they cannot support a detailed person. Below a projected 6×8 CSS-pixel aperture, use a single coherent occupancy shadow and light change rather than miniature facial animation. Never enlarge the silhouette outside its window to meet a readability target. Capture-based review must distinguish this deliberate distant habitation from an invisible or noisy effect.

## Measured source registration

All six inspected runtime plates are **900×1000 pixels**. The tables below were measured from those full-resolution plates, with enlarged crops used to inspect window framing. Pixel coordinates are authoritative; normalized coordinates are included for data authoring. A normalized point `(u,v)` is `(x/900,y/1000)`. Bounds use `(left,top,right,bottom)`, with right and bottom exclusive.

Every runtime position uses the same transform as the painting:

```ts
const placement = landscapePlacement(450, layout.height, layout.groundY);
const worldX = placement.x + sourceX * placement.scale;
const worldY = placement.y + sourceY * placement.scale;
```

Then the existing `world` container applies `layout.scale`. Do not independently derive positions from `groundY` percentages or DOM canvas dimensions. Recompute geometry after resize; retain the current mood and visit phase.

### Plate identity

| Age / chapter | Runtime plate | SHA-256 |
| --- | --- | --- |
| 0 / First Fires | `public/art/storybook/village.webp` | `325061301c965463fa5b2221f82ed5a52001e1b2ecea1bf9e6fcfcc8a1f98d5b` |
| 1 / Olive Terraces | `public/art/storybook/olive/village.webp` | `f131d361d334fea2302a50941f9f1e16310b7471ed4f764bcae81ea2c964f54a` |
| 2 / Harbor Watch | `public/art/storybook/harbor/village.webp` | `2faa105a4f91d46809bb084678118592b9149d97b2d10bf385b037c156043b88` |
| 3 / Lantern Quarter | `public/art/storybook/lantern/village.webp` | `ffcb2b4dd41edaf8813acb26751bb6e5df3d934eb984231cf7544f9eb8d6bac8` |
| 4 / Hillside Watch | `public/art/storybook/hillside/village.webp` | `e1e523aa400e2a9b36a2c5f3160c56b64d5ad99a5199c8be10998aad92ba8679` |
| 5 / Courtyards Beyond | `public/art/storybook/courtyards/village.webp` | `487b0d66f9b0171e2c59c46f0cbf84955542411af0a71af06fe6d396fda8925c` |

Check these hashes in the anchor-fixture test. A changed plate requires re-inspection, not automatic acceptance of the old anchors. These measurements are conservative interior regions, not permission to color their entire bounding rectangles.

### Window apertures

| Age | Aperture | Source bounds | Normalized bounds | Existing framing to exclude, source rectangles |
| --- | --- | --- | --- | --- |
| 0 | Left hearth | `(227,349,247,377)` | `(.25222,.349,.27444,.377)` | `(234,349,238,377)` and `(227,359,247,363)` |
| 0 | Right hearth | `(729,465,748,489)` | `(.81000,.465,.83111,.489)` | `(737,465,740,489)` and `(729,475,748,478)` |
| 1 | Lower farmhouse | `(109,283,122,300)` | `(.12111,.283,.13556,.300)` | `(114,283,117,300)` and `(109,290,122,293)` |
| 1 | Press-house | `(177,298,187,313)` | `(.19667,.298,.20778,.313)` | `(180,298,183,313)` and `(177,303,187,306)` |
| 2 | Left quay room | `(86,286,107,325)` | `(.09556,.286,.11889,.325)` | `(94,286,98,325)` and `(86,303,107,308)` |
| 2 | Center quay room | `(193,319,207,348)` | `(.21444,.319,.23000,.348)` | `(198,319,202,348)` and `(193,331,207,335)` |
| 3 | Left balcony | `(221,282,236,310)` | `(.24556,.282,.26222,.310)` | Preserve the painted hanging shadow; do not erase or replace it with a bright panel. |
| 3 | Open shutters | `(695,354,713,391)` | `(.77222,.354,.79222,.391)` | `(702,354,706,391)` and `(695,369,713,375)` |
| 4 | Upper warm room | `(434,287,451,307)` | `(.48222,.287,.50111,.307)` | `(440,287,444,307)` and `(434,297,451,300)` |
| 4 | Right dark balcony | `(807,333,824,359)` | `(.89667,.333,.91556,.359)` | `(815,333,819,359)` and `(807,345,824,349)`; keep this room dark, using only a subtle occupancy shadow. |
| 5 | Left balcony | `(186,271,198,292)` | `(.20667,.271,.22000,.292)` | Preserve the existing hanging shadow and the adjacent carved lattice. |
| 5 | Right balcony | `(782,324,800,349)` | `(.86889,.324,.88889,.349)` | `(789,324,793,349)` and `(782,335,800,339)` |

For each arched aperture, the containment polygon is inscribed in the listed bounds: bottom corners `(l,b)` and `(r,b)`, shoulders `(l,t+0.35h)` and `(r,t+0.35h)`, and top points `(l+0.35w,t+0.10h)` and `(l+0.65w,t+0.10h)`. This deliberately leaves a safety inset around the arch. Hillside's rectangular upper warm room uses the rectangle directly. Subtract the listed framing rectangles from the allowed region. Do not draw a new border over the original frame.

Clip the resident silhouette and window darkening to the resulting pane polygons. The painter can use precomputed convex pane regions and clip a small tessellated silhouette to them; no per-frame Phaser mask, canvas, or texture is necessary. A glow intended to originate inside a window must use the same aperture, not a circle spilling onto masonry. Alpha coverage outside the allowed panes must be zero.

The rectangular measurements are starting geometry for a deterministic fixture. If a real composite reveals a one-pixel framing overlap, inset the affected polygon and record the change; do not loosen containment or move the effect into the street.

### Existing lamp centers

`rx,ry` below are source-pixel radii of the bounded local halo, not full-scene light sizes. They follow the fixture and can touch immediately adjacent stone as emitted light; they cannot drift away from it. Initial calm alpha is 0.10–0.16, with a non-synchronized variation of at most ±0.018 over 3–7 seconds. Alarm scales the added halo to 0.45 of its calm value. The baked lamp remains lit; do not claim to extinguish it.

| Age | Source centers `(x,y; rx,ry)` | Normalized centers |
| --- | --- | --- |
| 0 | `(202,487; 10,14)`, `(786,525; 8,11)` | `(.22444,.487)`, `(.87333,.525)` |
| 1 | `(217,309; 5,8)`, `(313,342; 5,8)` | `(.24111,.309)`, `(.34778,.342)` |
| 2 | `(46,409; 11,15)`, `(322,393; 9,13)`, `(759,427; 6,9)` | `(.05111,.409)`, `(.35778,.393)`, `(.84333,.427)` |
| 3 | `(104,454; 12,17)`, `(287,484; 10,14)`, `(599,489; 10,14)`, `(795,492; 13,18)` | `(.11556,.454)`, `(.31889,.484)`, `(.66556,.489)`, `(.88333,.492)` |
| 4 | `(252,461; 9,13)`, `(766,498; 7,10)`, `(574,452; 5,8)` | `(.28000,.461)`, `(.85111,.498)`, `(.63778,.452)` |
| 5 | `(44,372; 9,13)`, `(276,434; 9,13)`, `(634,448; 10,15)`, `(871,365; 9,14)` | `(.04889,.372)`, `(.30667,.434)`, `(.70444,.448)`, `(.96778,.365)` |

Use warm amber `0xffd08a` for ordinary lamps. Courtyards' last two listed lamps are jade (`0x8edfc9`), following the painting. Do not recolor the whole chapter or its warm lamps cyan.

Harbor-only water accent: source rectangle `(480,473,591,526)`, normalized `(.53333,.473,.65667,.526)`. This is the open water between the quay edges, below the boats. Keep up to three short horizontal reflection strokes inside it, each 12–22 source pixels wide, alpha 0.08–0.14, with at most 2 source pixels of vertical travel. No new water surface or broad ellipse over stone, posts, boats, or ropes. Reduced motion leaves these as a fixed reflection pattern.

### Clear sky corridors

The complete bird silhouette, including wings, must remain in the listed source rectangle. These measured corridors avoid tree tops, chimneys, domes, the Hillside antenna, and the painted crescent. They may overlap painted clouds: a small bird can legitimately pass in front of a cloud. Do not put a procedural cloud in front of the skyline.

| Age | Source corridor | Normalized corridor |
| --- | --- | --- |
| 0 | `(240,106,660,180)` | `(.26667,.106,.73333,.180)` |
| 1 | `(235,102,655,190)` | `(.26111,.102,.72778,.190)` |
| 2 | `(250,90,660,190)` | `(.27778,.090,.73333,.190)` |
| 3 | `(290,80,660,184)` | `(.32222,.080,.73333,.184)` |
| 4 | `(300,72,675,142)` | `(.33333,.072,.75000,.142)` |
| 5 | `(330,52,662,133)` | `(.36667,.052,.73556,.133)` |

Use one quiet, irregular ink bird silhouette, 34–50 source pixels across, with two or three broad wing poses over a 6–9 second passage. Schedule no more than one passage in 24–38 seconds. No shooting-star loop, additional moon, twinkling field, or flock. During alarm no new passage begins; an already-visible bird finishes its passage without teleporting.

The top of the painting is cropped on short canvases and shares space with the resource and chapter HUD. Intersect the corridor with the visible source crop and exclude the actual occupied HUD text/button rectangles, padded by 4 CSS pixels. Cache these rectangles after layout/resize; do not query DOM geometry every frame. Require at least a 100-source-pixel continuous visible path and an 8 CSS-pixel silhouette; otherwise omit that passage. Do not move it down across roofs merely to make it visible. Sky motion is an occasional bonus, not the only evidence that the settlement is alive.

## Mood model and hysteresis

Add a pure presentation module, tentatively `src/view/village-mood.ts`. Inputs are a presentation delta in real seconds, phase, player-base HP fraction, nearest living enemy x coordinate in the existing 0–1000 simulation space, and player-base hit events. Its output is a discrete mood plus a continuous `alarmMix` in `[0,1]`.

1. `ready` starts quiet. A new battle-state identity or chapter resets transient timers and visit schedules; no extra alarm is emitted merely because a canvas resized.
2. During `running`, a hit targeting the player's base enters alarm immediately. Otherwise HP at or below 0.30 or an enemy at/below x=300 must persist for 0.60 seconds to enter alarm.
3. Alarm has a minimum hold of 3.0 seconds. Recovery may begin only after 6.0 continuous seconds with no player-base hit, every living enemy beyond x=420 (or no enemies), and player HP above 0.42. This intentionally leaves a critically damaged settlement wary for the rest of that battle.
4. Recovering lasts 4.0 seconds. A new base hit returns to alarm immediately; renewed positional/HP pressure lasting 0.60 seconds also returns to alarm. Quiet residents reappear only in the final 1.5 seconds of successful recovery.
5. Entering alarm ramps `alarmMix` to 1 over 0.8 seconds. Recovery ramps it to 0 over 4.0 seconds. Both ramps use bounded interpolation without overshoot. There is no flashing, screen shake, or strobing in this slice.
6. On `won` or `lost`, stop new visits and signals and hold the final composition. Existing result-screen sound ownership remains unchanged. A following ready battle resets to calm.
7. Paused/hidden/modal/screen transitions freeze the presentation clock and timers. Resume without catching up missed visits, emitting queued accents, or skipping through a burst of bird poses. Use the existing clamped real-time delta, not game speed or wall-clock timers.

Filter units by enemy side and positive HP. Clamp malformed numbers to safe defaults. The renderer and audio should consume the same mood state, not independently invent thresholds. Put its single owner in the presentation wiring and pass a snapshot to both consumers; do not put visual/audio state in `Profile` or make the simulation depend on it. The snapshot also carries elapsed presentation `time`, nullable `alarmEnteredAt`, and optional `alarmHistory` containing the last two completed `{enteredAt,endedAt}` intervals, using that same clock. Production mood state always supplies that bounded history; omission remains valid for static fixture snapshots with no past alarms. The renderer uses this time for visits and birds. A scheduled bird admitted before an alarm may finish. A passage whose start falls inside either the current alarm or a retained completed alarm remains omitted for its entire passage, including recovery and later alarm entries.

Review Ruling (2026-09-30): retain two completed alarm intervals plus the current `alarmEnteredAt` instead of only the latest entry. At least six seconds separate alarm completions, so this bounded data preserves admission for every 6–9-second bird passage even through repeated recovery/re-alarm transitions. There is no per-bird timer, unbounded event log, gameplay state, or saved field. Reduced-motion visual opacity maps to discrete alarm/recovery states, while the shared continuous `alarmMix` remains available for audio; recovering occupants return at full fixed opacity only in the final 1.5 seconds.

## Render order and resource limits

All new marks belong to the landscape, not to the combat overlay. Their order is:

`painted landscape → bounded sky marks / village atmosphere → army shadows and halos → depth-sorted bases, troops and lane effects → existing foreground slot → projectiles / impact accents / health UI`.

The current painted foreground slot is transparent; foreground rocks are baked into the landscape. This slice does not claim to fix arbitrary foreground occlusion and does not place new animated inhabitants behind those baked rocks. There is no general wandering street character or foreground critter in scope.

Reuse the current ambience Graphics for hard-edged silhouette/water marks and a fixed light pool for local halos. At most four lamp halos, two resident silhouettes, three water strokes, and one bird are active per chapter. Allocate no scene objects per frame. Create exactly one shared **64×64** procedural radial falloff, key `village-light`, once per Phaser texture manager: **16,384 decoded bytes**. The current painted manifest is **41,973,528 bytes**, so the explicit combined budget is **41,989,912 bytes**, leaving 10,088 below 42,000,000. The maximum authored halo is 36 source pixels tall; 64 pixels is sufficient. The legacy 128×128 `soft-light` texture is currently unallocated in all-painted scenes: do not initialize or call that texture path for these village lights, because its 65,536 bytes would exceed the cap. Do not allocate a per-chapter light atlas or full-screen render target.

Tessellate the small resident/bird templates once, then transform and clip bounded polygons. No per-frame pixel reads, canvas uploads, generated textures, DOM measurement, or unbounded event history. Keep the existing 42 MB decoded-art and 800 KB per-chapter transfer limits; new source assets are zero bytes. Static anchor/pane arrays and a handful of scalar timers are sufficient.

## Reduced motion and optional sound

Reduced motion keeps an inhabited but still scene: one coherent occupied-window silhouette, steady local light, and a fixed harbor reflection. No travelling bird, drifting reflection, resident pacing, pulse, or flicker. Danger may replace the occupied silhouette with an empty/darker room and use a short opacity crossfade of at most 150 ms; it must not repeatedly oscillate. The existing damage/health presentation still conveys danger independently of atmosphere or sound. Changing motion preference does not change Sound or Atmosphere preferences.

Extend `updateSoundscape` and `SoundscapePlayer` with a mood mix while preserving their current audibility and request-version semantics. Do not synthesize a new 24-second buffer for each mood. Per live voice, one gain and one optional low-pass filter can continuously change the existing bed: initially calm gain 0.35 and cutoff 5000 Hz; alarm gain 0.22 and cutoff 1700 Hz. Smooth parameter changes over at least 0.6 seconds. Verify these values by listening rather than treating them as final mastering.

The watch entry accent is a short, original low wooden knock, gain ceiling 0.015, once on a real quiet/recovering-to-alarm transition and no more often than once in 8 seconds. A sustained alarm may add a very soft rounded pulse (approximately 55→50 Hz, 0.25 seconds, gain at most 0.012), no more often than every 1.8 seconds. Keep these below combat hit feedback. They share the existing eight-voice ceiling, with at most two ambience accent voices; combat can take priority by dropping an ambience accent. No recorded speech, new melody loop, sacred sound, or claim of historical instrumentation is required.

Atmosphere accents require **both** Sound and Atmosphere to be enabled and the same ready/running, visible, unpaused, battle-screen, no-modal state as the bed. Never create an AudioContext before the existing enabled user gesture. Muting Atmosphere stops its accents and bed while preserving combat sound. Sound off silences everything. Hidden tabs, pause, modal opening, screen changes, pagehide, disposal, chapter replacement, and synthesis rejection must stop or cancel scheduled accents without later replay. Preserve asynchronous generation cancellation; a stale resolved worker request must not restart old chapter audio.

## Implementation files

- New `src/view/village-life.ts`: immutable plate registration, bounded marks, pane containment/projection, reduced-motion output.
- New `src/view/village-mood.ts`: deterministic presentation state machine and numeric limits.
- `src/view/battlefield.ts`: replace the painted generic-particle path, reuse pooled rendering, consume shared mood, handle resize and destruction.
- `src/main.ts`: single mood ownership and delivery to renderer/audio while preserving current pause and audio-preference rules.
- `src/view/audio.ts` and `src/view/soundscape-player.ts`: smoothed mix, bounded accents, lifecycle cleanup. Reuse `soundscape.ts` and the synthesis worker unless a demonstrated audio defect requires a change.
- Focused tests plus the existing `tests/fixtures/layering.ts` and browser capture scripts: real-render evidence of the measured composition.

## Acceptance and verification

1. Test mood entry, 0.60-second debounce, 3-second hold, six-second quiet requirement, recovery interruption, critical-HP latch, new-battle reset, malformed inputs, pause, and 2× gameplay speed. Verify no profile or simulation mutation.
2. Verify fixture plate dimensions and hashes. Test every resident polygon against allowed panes and framing exclusions; every bird vertex against its complete safe corridor; every water stroke against the harbor rectangle. Test the actual full silhouette extents, not half-radii.
3. Test source-to-world placement at the existing 320/390/450 layouts and short canvases. Verify resource/UI exclusion uses cached geometry and never creates a lower unsafe sky path.
4. Test fixed pool maxima, unchanged scene-object counts over several minutes, deterministic frame output, and still reduced-motion output. Assert the one-time `village-light` texture is exactly 64×64, the legacy `soft-light` texture remains unallocated in painted-only scenes, and manifest plus its 16,384 bytes is 41,989,912 bytes, below 42,000,000. No per-chapter duplicates are permitted.
5. Extend mocked audio tests for mood changes while synthesis is pending, cached-buffer reuse, rapid mute/unmute, stale generation, chapter change, pause/hidden transitions, teardown, and voice limits. No test may depend on an AudioContext being available before user permission.
6. Extend the deterministic real-Phaser fixture with quiet/alarmed/recovering states, fixed clocks, all six chapters, and a nearby attacking unit. Inspect all six at 390 pixels and the smallest/most occlusion-sensitive cases at 320 pixels; include reduced motion and a narrow crop. The source plate, resident, and local light must stay registered while combat crosses in front.
7. Capture pairs several seconds apart as well as state screenshots. A still capture proves placement, not living motion. Check the actual renderer and browser console, not just pure-function tests.
8. Listen to quiet → alarm → recovery in at least First Fires, Harbor, and Courtyards. Verify no clip, jump in loudness, doubled loop, combat masking, or sound after mute/hidden/dispose. If audio playback cannot be tested in the available environment, report that specific gap instead of claiming it was heard.
9. Independently review the implementation and full test/build results before its PR is merged. User authorization to raise and merge PRs already exists; this spec adds no redundant approval gate.

Success means that a short, ordinary battle visibly takes place in an inhabited village that reacts and settles again, without making troops, bases, controls, or their layers harder to read.
