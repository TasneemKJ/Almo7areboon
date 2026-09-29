# 05 — Original dusk soundscape

## Bounded design and plan
Continue the approved Levantine atmosphere direction with an original, sparse plucked-string/airy-tone score and chapter-specific environmental textures. This is fictional synthesized music, not an authentic instrumental recording or a historical maqam claim. Do not copy melodies or use third-party samples.

Source baseline: 21d6475d9ef94abb31e6c163fad6fcb23ff3400e, tree 0c76825b992b4fed8c0b122e1ad408a3feacef8d. The overlapping local light/mist candidate was not published: the newer living-dusk commit is retained unchanged. Baseline suite: 166 passes.

1. Observe failing regressions for deterministic, bounded stereo PCM; six distinct chapter signatures; smooth loop edges; safe sample-rate/era input; lifecycle ownership, mute/pause, replacement, failure and disposal.
2. Implement a fixed 24-second, 16 kHz stereo generator and a one-current-buffer player. At most one current voice and one short fade-out voice. No application timer, external media request, product dependency or independent AudioContext. Retry failed audio construction only after an explicit gesture or context/scene change, not every frame.
3. Connect to the existing gesture-created audio context. Master Sound applies to effects and ambience; a Settings Atmosphere switch persists separately from the game save. Menus, manual pause, hidden tabs and inactive game screens silence ambience. Guard asynchronous resume against a subsequent mute/suspend. Default ambience is enabled but never starts before an enabled gesture.
4. Run the full suite/build, inspect numerical audio metrics and produce WAV previews from the same PCM source. Browser audio/device listening is not available and must not be claimed. Review separately, compare uploaded tree, and publish a bounded commit through GitHub.

Preserve src/game, action identifiers, profile schema, pause owners, existing visuals and CI/security. No scheduler, browser workaround, merge or deployment request. Count this as one connected refinement only after publication, not one per chapter or test.

## Acceptance boundaries
Numerical checks do not prove perceived volume, musical quality, iOS audio gestures or performance on a low-end phone. These remain rendered/listening release gates. Verify finite bounded samples, bounded allocation and click-free numerical endpoints, but do not claim a physical speaker loudness limit.

## Implementation and review evidence
- Added original six-chapter stereo synthesis: sparse plucked-string gestures, breath-like answers, low beating tones, and restrained fire/wind/water textures. No sampled performance or existing melody. The quiet in-game mix is also used by exported previews.
- The original synchronous experiment measured 136–238 ms per scene in the local Node runtime. Ruling: move synthesis into a cancellable Vite module worker rather than put this cost on a gameplay interaction. Only the same-origin worker module (2.20 KB in the current build) is loaded; there are no external media requests. This changes the initial no-request assumption, not the no-third-party-media or no-scheduler rule.
- At most one generation worker is retained. Superseded requests are terminated and cannot replace a newer chapter. A completed request releases its worker and transfers its PCM buffers. Node-thread execution of the built worker matches source PCM hashes for all six chapters; this is not browser-worker/device acceptance.
- Playback owns one current voice plus at most one 60 ms retiring fade and a single current scene AudioBuffer. Production PCM is 3,072,000 bytes for 24 seconds, stereo, 16 kHz. Temporary generation/fade buffers and browser overhead are additional; this is not a total device-memory guarantee.
- The existing enabled gesture creates/resumes the shared context. Before an enabled gesture, no context or generation worker is created by a mere state update. Menus, manual pause, hidden tabs, inactive screens and result states silence ambience. Master Sound and a separately stored Atmosphere preference are respected without touching the game-save schema.
- Review reproduced and fixed cleanup after a denied source start, interrupted-context resume, and a stale pending-request flag after a paused chapter change. Deferred minor: subjective loudness, musical appeal, and loop repetition need real listening review; numerical checks cannot establish them.
- 23 new regressions were observed failing before their fixes. Fresh full suite: 189 passed, zero failed. TypeScript/Vite build and diff checks passed. The existing Phaser vendor-size warning remains. Review was author self-review; no independent reviewer tool was available.
- Full source comparison leaves src/game subtree 0c530ac370ad614be6913180be245a4c6df13fb6 and all scene/character artwork untouched. The independently published fourth batch is preserved; the overlapping unpublished light model is not included or counted.

## Reproduce
```
npm test
npm run build
node --experimental-strip-types scripts/export-soundscape-review.mjs artifacts/soundscape
node --experimental-strip-types scripts/verify-soundscape-worker.mjs artifacts/soundscape
```
The WAVs and metrics are offline generated audio, not evidence that browser output was heard. Preview peak amplitudes at the game mix were approximately 0.020–0.026, with zero-valued tapered endpoints. Physical loudness depends on the device and user volume. Unsupported/blocked worker or audio construction leaves gameplay running silently; no synchronous synthesis fallback is used.

Technical reference: W3C Web Audio API, AudioBufferSourceNode looping and AudioParam scheduling, https://www.w3.org/TR/webaudio-1.1/ . Only established core APIs are used; a specification is not cross-browser test evidence.

This is the fifth connected implemented batch, subject to confirmed publication. Forty remains a target, not a completion claim. Browser restrictions, Arabic/RTL and physical-device/performance/listening gates remain open. No scheduler, merge or explicit deployment request.
