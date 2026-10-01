# Tactical Sound Language

**Goal:** Make the Chronicle's existing guard, breach, landmark, and rescue consequences audibly distinct without adding controls, changing simulation, or making sound the only source of information.

## IDEAL

- **Identify:** Current main emits truthful `covered`, `breach`, `landmark`, and `rescued` events, but the sound selector drops cover and breach entirely and reuses the rally contour for landmark capture and rescue. Current exact-tree screenshots show the corresponding visual marks already carry the silent/reduced-motion path; the missing layer is optional auditory consequence.
- **Discover:** Re-read the event producer, audio admission limits, effects/atmosphere ownership, native audio observer, offline renderer, and PR126–130 regressions on 2026-10-01. Bad North's official press kit says its accessible tactical depth comes from observing individually simulated soldiers under simple controls; Kingdom Two Crowns' official page pairs minimalist strategy with building, defending, and visible subjects. The bounded inference is to let existing Almo7areboon events sound different, not to copy another game's audio, mechanics, or assets.
- **Explore:** Considered more float text, a tutorial panel, spoken callouts, stereo panning, and short synthesized material cues. More copy repeats recent teaching work; spoken callouts create localization and screen-reader competition; panning adds a new graph boundary without first proving the semantic gap. Choose four short contours through the existing effects bus, always paired with current visual feedback.
- **Act:** Add `story-cover`, `story-breach`, `story-landmark`, and `story-rescue`. A covered hit admits the hold cue before the generic impact; a breach admits its split cue before the generic impact; landmark and rescue no longer reuse rally. Preserve result/skill/bell priority, the global eight-voice ceiling, the six-ordinary ceiling, native-time cooldowns, mute/Effects settings, pause/hidden cleanup, and optional-audio failure containment.
- **Look back:** Prove selection and cooldown semantics test-first; render every story cue through native `OfflineAudioContext`; include the four events in the 20-second crowded reference; run all source tests/build and both GitHub Actions workflows; inspect completed logs and original 320/390/1024 screenshots; obtain independent code and bug review; verify exact merged tree and production deployment.

## Five Ws

- **Who:** Players reading crowded Chronicle battles, including sound-off and reduced-motion players who retain the existing visual marks.
- **What:** Four distinct, bounded synthesized effects for defender cover, heavy breach, landmark capture, and rescued-scout release.
- **Where:** The existing Effects bus and combat-event selector; no new menu, HUD element, asset download, or storage field.
- **When:** Only after the corresponding authoritative game event is drained while sound is enabled and the existing audio owner is active.
- **Why:** Reinforce consequential tactics and story beats through immediate call-and-response while keeping the game's simple interaction model.

## Guardrails

- No combat, damage, targeting, timing, reward, economy, progression, save, input, pause, animation, or visual change.
- Existing visible formation, landmark, and rescue feedback remains authoritative; sound never becomes the sole cue.
- Cover and breach share the existing `unit-hit` cooldown so a semantic cue replaces, rather than stacks on, the generic hit in the same instant.
- Landmark and rescue remain ordinary, non-critical cues. Bell warning, outcomes, and skills retain their current priority and capacity behavior.
- Each new contour is finite, ends at zero, stays under 450 ms, allocates one oscillator plus one gain, and uses the existing cleanup path.
- Browser execution remains GitHub Actions only. Offline waveform metrics do not establish subjective listening quality or phone-speaker/headphone acceptance.

## Tests-first slices

1. Add failing selector tests for unique cover, breach, landmark, and rescue IDs; same-batch generic-hit suppression; result priority; malformed-event safety; and bounded three-cue output.
2. Add failing renderer/fixture expectations for four one-voice finite contours and complete story-cue enumeration; implement the minimal cue definitions.
3. Add the four authoritative story events to the deterministic crowded reference and the native production-export browser case without changing graph limits.
4. Run focused tests, all source tests, production build, focused and full GitHub Actions, original screenshot inspection, independent review, exact-tree merge verification, and Vercel production verification.

## Evidence boundaries

Tests establish event selection and graph contracts. Native `OfflineAudioContext` establishes finite, non-silent, unclipped waveforms, and GitHub Actions Chromium establishes browser execution at the captured environment. None establishes subjective sound quality, audibility on a specific device, physical-device/Safari acceptance, low-end performance, organic comprehension, balance, or retention.
