# Music and sound: readable combat, a remembered village

Date: 2026-09-30
Status: bounded candidate architecture for the next iteration; no implementation or listening acceptance claimed.

## Intent and scope

The user asked to also work on audio, music and sounds while improving the game. The intended result is a creepy, quirky, rounded storybook settlement with legible battle feedback and a quiet musical identity across its six chapters. This proposal assumes music should support ordinary repeated play rather than dominate it. It makes no claim to authentic historical instruments, regional musical theory, or measured engagement improvement.

This follows, and must integrate after, the active **The village keeps watch** slice. That slice owns shared village mood, its gain/filter ramps, alarm knock and sustained pulse, the shared eight transient-voice budget, combat priority over ambient accents, and lifecycle gating. Do not duplicate its state machine, add another danger detector, or rewrite those mechanisms. This document defines exactly two future implementation tasks. It does not authorize changes to combat rules, progression, Profile schema, art, or unrelated menus.

## Evidence and approaches considered

Current music is already original procedural music: six chapter parameter sets, a six-note plucked pattern, two breath-like answers, a low drone, and noise textures in a worker-generated 24-second stereo buffer. Its exact note times are common to every chapter. Current effects are short sine/triangle sweeps keyed by event type; event metadata is discarded and an unknown type defaults to the spawn cue. A `death` event therefore receives the spawn sound. Read-only evidence is recorded in `.superpowers/audio-direction-audit.md`.

| Approach | Benefit | Cost / decision |
| --- | --- | --- |
| Refine authored phrases in the current bed, add semantic event cues and two level controls | Improves identity, choice and feedback using established ownership and budgets | Recommended. The 24-second form still repeats; listening must determine whether its pauses and sparseness are sufficient. |
| Split music and environment into independent looping stems | Independent music/ambience controls and greater mix flexibility | Defer. Changes PCM contract, transfer/cache memory, loop synchronization and voice ownership for a small game. |
| Add continuous adaptive percussion and longer generative compositions | More variation and stronger combat drive | Defer. Competes with the new alarm pulse and attack feedback, expands scheduling and cancellation scope, and increases fatigue risk. |

## Future task 1: semantic combat feedback

Introduce a small pure presentation mapper, tentatively `src/view/combat-cues.ts`, from the existing `GameEvent[]` to bounded cue descriptors. Keep actual node allocation in `audio.ts`, using its existing gesture-created context and the village slice's budget. Pass the complete batch from `main.ts`; never infer combat outcomes from rendered sprites or invent new simulation events. The mapper handles semantic selection and within-batch coalescing; the audio owner handles real-time cooldowns and voice admission. No independent timers or event queue.

### Sonic roles

| Existing event / metadata | Intended sound | Admission and distinction |
| --- | --- | --- |
| Player `spawn` | One short rounded wooden/plucked confirmation | Enemy spawn is silent; no pitch glide copied from a death cue. Limit to one per batch and at least 120 ms apart. |
| Unit-target `hit`, `source.kind` | Three related short material impacts: blunt body, dry flick, and heavier hollow thump | Kind changes envelope/timbre, not only pitch. Do not name a weapon family until checked against actual unit definitions. At most one ordinary hit per 90 ms globally. |
| `hit` with `target === 'base'` | A broader low structural impact, still short | `side` describes the attacker: enemy-side means the player's base was struck. One base cue per 180 ms; wins selection over ordinary hits in the same batch. It confirms damage, while the existing village knock marks alarm entry. |
| `death` | Initially silent | Visual defeat already carries the information. Explicit silence removes the incorrect deployment fallback and avoids kill-cue chatter. |
| `coin` | Small two-part glint within one voice envelope | At most one per 250 ms; suppressed in a batch containing a result cue. Do not turn each coin into a sustained chime. |
| `skill` | Freeze: light falling glass-like tone; meteor: short descending weight; food: rounded upward answer | One cue per actual accepted skill event; differentiated without loud noise bursts. Use existing `skill` metadata. |
| `upgrade`, `evolve` | Short confirmation; evolution extends the same motif | Preserve existing event ownership, no new gameplay trigger. |
| `win`, `lose` | Related resolved / unresolved phrase | Exactly one result cue per result batch; suppress other cues in that batch. Maximum 650 ms; do not restart background music on the result screen. |
| Unknown/malformed event | Silence | No catch-all deployment sound; missing hit metadata uses the ordinary neutral hit. |

Selection precedence is result > skill > player-base hit > other base hit > ordinary hit > deployment > reward/upgrade. Limit to three admitted cue descriptors per batch before audio cooldown/voice checks, with stable original order for ties. A single cue uses one oscillator voice with a short authored frequency/envelope contour; no unbudgeted multi-oscillator layers. Begin gain at zero with a 2–5 ms attack and end near zero, rather than a nonzero first sample. These are implementation starting points, not approved mastering values.

Retain eight total **transient** voices shared by effects and village accents, of which at most two are ambient accents. Existing bed sources remain separately bounded at one current plus one retiring source; do not describe the entire audio graph as eight sources. Combat can reclaim an ambient accent as the active slice permits. Ordinary effects may occupy at most six effect slots, leaving room for critical cues once ambient accents are reclaimed. Critical means result, skill or player-base impact. If all eight transient slots are already critical/effect voices, drop the incoming cue; selection priority does not justify exceeding the budget. Result batches suppress their other cues before allocation. Do not build a backlog or an additional effect-preemption scheduler.

### Acceptance

- A deterministic mixed batch selects the player's base hit ahead of an ordinary hit; attacker side is not mistaken for victim side. All three skill metadata values select distinct descriptors. Unknown/death events do not allocate nodes.
- Dense hit/coin batches at 1× and 2× speed respect real-audio-time cooldowns and three-descriptor selection; no catch-up burst occurs after pause/resume.
- Mock node accounting stays at or below eight transient voices including any still-retiring effects and accents. Cleanup runs once after end, failure, suspend and context replacement. The existing bed-source bound remains unchanged.
- Offline exports include isolated cues and a fixed 20-second crowded battle sequence. Numerical checks reject NaN, nonfinite envelopes and clipping in that fixture; physical volume and perceptual masking require listening.
- Listening acceptance: a reviewer can distinguish base damage from unit damage and the three skill cues without relying on pitch alone; the coin and deployment cues do not repeatedly distract from combat. Record observations and device/output mode, not a claim based solely on descriptor tests.

## Future task 2: chapter phrasing and player mix

Keep `synthesizeSoundscape`'s production 24-second, 16 kHz stereo contract and its cancellable worker. Move the existing phrase timing and note choices into bounded chapter data within the generator or a small adjacent score module. Keep each chapter to at most six plucked attacks and two breath-like answers per loop. Preserve a recognizable three-note contour, with rests doing as much work as the notes. Do not add an always-on beat, a second music player, random notes per frame, recorded vocals, external samples, or a new reverb network.

The following are composition briefs, not auditory findings:

| Chapter | Musical role within the same family | Environmental emphasis |
| --- | --- | --- |
| First Fires | Close, hesitant three-note question; delayed single answer | Soft air and sparse ember texture |
| Olive Terraces | More open spacing; paired notes followed by a longer rest | Gentle wind, less watery modulation than the current setting |
| Harbor Watch | Lowest note answers the phrase, slightly longer decay | The clearest slow water movement; avoid gull calls on every loop |
| Lantern Quarter | One subtly uneven two-note exchange, then quiet | Drier intimate room impression; no constant percussion |
| Hillside Watch | Lower register, fewer attacks, longest exposed rest | Air and restrained low tension |
| Courtyards Beyond | Familiar contour gains one gentle upper answer | Airy tone and subdued water, with no jump in overall level |

Keep the current tuning roots initially and author relative semitone choices as original fictional melody. Distinction should come from spacing, register, decay and answer placement, not a generic “regional” scale or stock exotic flourish. Leave at least one continuous 4-second span per chapter with no new pitched attack; tails and quiet environment may continue. The fixed loop will remain detectable in principle. If listening still finds repetition intrusive, lower pitched density before expanding buffers or inventing a scheduler.

The existing village `alarmMix` remains the only adaptive musical driver. Do not regenerate PCM for mood changes. Its quieter/darker alarm mix and gradual return must also work with the revised phrasing. New effects remain intelligible without adding a second combat ducking controller.

Add DOM range controls under the existing Sound and Atmosphere switches: **Effects volume** and **Atmosphere volume**, each 0–100% in steps of 5. Atmosphere remains explicitly “Music and environmental sound”; do not promise independent music mute while both are mixed into one PCM buffer. Preserve the current switches and defaults: Sound is master, Atmosphere gates its bed and accents, and both new levels default to 100% of today's respective mix gains. Zero effects volume permits atmosphere-only listening; zero atmosphere volume silences its bed and accents. A level change never turns either switch on.

Persist levels in one separate versioned audio-preference storage key with numeric clamping, safe defaults and storage-failure tolerance; no Profile migration. Apply effects level to combat/UI cue gains and atmosphere level to bed and village-accent gains. Use a small mix snapshot passed from the existing UI owner. Place persistent bus gains in the audio owner where practical; do not edit village mood thresholds or overwrite their target values. Level changes ramp over at least 50 ms. Range input events do not re-render the settings modal while the user drags or presses arrow keys; update the displayed percentage and current mix. Label each range, support keyboard control, and make zero visibly read as 0%.

The settings modal continues to pause/silence ambience. Do not bypass that lifecycle simply to preview a slider. Do not add a looping preview button. The player hears the selected mix after returning to battle, through the existing enabled gesture path.

### Acceptance

- All six chapters retain deterministic finite stereo PCM, duration/rate, bounded endpoints and the current 3,072,000-byte production PCM payload. No cache for all chapters and no additional concurrent worker. Worker/source equivalence still passes for every chapter.
- Score-data tests verify attack-count and rest constraints and distinct authored chapter phrase schedules. Different hashes prove distinct PCM, not perceptually distinct chapters.
- Offline report records per-chapter peak/RMS, maximum discontinuity near the seam, and mix parameters. Compare with the previous generator to catch accidental level jumps; choose final loudness through listening, not a forced equal peak.
- Preference tests cover missing, corrupt, out-of-range and blocked storage; toggling switches preserves levels; level zero silences the correct family; no context or worker is created before an enabled gesture.
- Lifecycle regressions cover rapid chapter/mute changes during synthesis, hidden/pagehide, menu, pause, result states, failed source/worker construction, context replacement and disposal. Old completions never start a stale chapter. Repeated changes never accumulate nodes or queued accents.
- Keyboard and pointer checks confirm stable slider focus and displayed values, including muted settings. UI uses no audio technical jargon.
- Listen to at least three consecutive loops per chapter, then quiet → alarm → recovery with combat in First Fires, Harbor and Courtyards. Check seams, fatigue, masking, timbral harshness and volume jumps on headphones and a phone speaker. Reduced motion remains independent of the sound preference.

## Resource and release limits

No new dependencies, downloaded media, simulation mutation, second AudioContext, continuous scheduling service or unbounded event history. Keep the existing single-worker cancellation and one-current-buffer cache. Source PCM and AudioBuffer copies, temporary transfer data and browser overhead are distinct allocations; 3,072,000 bytes is the production PCM payload, not a total memory guarantee. Selection work is linear in the already-delivered event batch with fixed output size.

Implement the two tasks sequentially after the village slice settles; their integration touches shared `main.ts`, `audio.ts`, `soundscape-player.ts`, preferences and audio tests. The pure cue mapper and phrase authoring can be understood independently. Preserve the village slice's new regression tests and run focused audio/worker tests plus the full suite/build at integration. Export actual production-source previews, then record listening evidence separately. No audio was listened to during this design audit; musical appeal, fatigue, perceived loudness, device behavior and retention remain unverified. If device listening is unavailable, report that gap explicitly rather than declaring auditory acceptance.
