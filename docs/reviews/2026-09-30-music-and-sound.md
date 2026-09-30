# Music and sound execution review

Date: 2026-09-30. Task 1 checkpoint on `e3592a9` (uncommitted implementation), after independently reviewed combined baseline `ee52b574`. Task 2 is not implemented.

## Implemented checkpoint

`selectCombatCues` preserves event metadata, chooses one hit-family winner, retains bounded candidates and at most three descriptors, and silences death/unknown/malformed events. Enemy attackers identify damage to the player's base. Results suppress their entire batch and contradictory results choose the first event.

The production `renderCombatCue` uses one oscillator and one envelope gain per cue, starts gain at zero, attacks over 2–5 ms and ends at zero. Result phrases last 600 ms. Materials and skills vary waveform/envelope structure in addition to frequency. The audio owner keeps real-audio-time cooldowns, six ordinary effect slots and eight total shared transient slots. It may reclaim village accents at capacity and never preempts another effect. Stop, failure, natural end and replacement release handles once; late callbacks retain their original context's ownership.

Actual main-function tests exercise complete-batch admission, save-session ownership and lifecycle stops with the real audio owner. Fresh result audio starts before result persistence; the result dialog at both 350 ms and 1300 ms does not cancel its finite voice. Any modal blocks new batches. Menu confirmation policy is intentional: accepted upgrade/evolve/reward events remain recognized by the mapper but are silent while a menu owns presentation.

No changes to chapter music, mix preferences, village mood, simulation, persistence or guarded renderer port.

## Fresh verification

- Mapper RED: missing module; GREEN: 6 passed.
- Playback RED: new production APIs absent. GREEN focused mapper/audio/village/actual-main tests: 27 passed, zero failures/skips.
- Main integration RED: type-only batch lost the ranged material (`sine` instead of `sawtooth`) and played three cues for a result batch instead of one; GREEN: all four actual-main/village tests passed.
- `npm test`: exit 0, 416 passed, zero failures/skips.
- `npm run build`: exit 0, TypeScript plus Vite production build. Existing large-chunk warning remains.
- `git diff --check`: exit 0.

## Outstanding evidence

The real OfflineAudioContext fixture, WAV exports, numeric waveform gate and required CI wiring are the next part of Task 1. No local Chromium launch was attempted: the coordinator already established SIGTRAP before page creation. An actual CI offline pass is required, rather than a waived local gate.

Listening not performed; combat distinction and masking unverified. Auditory acceptance not established. Numeric/node tests do not establish perceived loudness, timbral appeal, repetition fatigue or device behavior. Headphone and phone-speaker listening remains outstanding.
