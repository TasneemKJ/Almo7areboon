# TODO

Ordered tasks. Tick a task when it is done and never delete finished tasks. This file replaces `docs/TODO.md` (its content is the Standing goals below).

## Standing goals (from the former docs/TODO.md)
- Continue increasing direct battlefield agency without creating a second balance or reward path.
- Keep village life and command reactions tied to real simulation events and current authored storybook art.
- Exercise fresh and returning save paths whenever progression or upgrade behavior changes.
- Add/maintain Arabic and RTL acceptance where affected; English-first fixtures are not full RTL evidence.
- Keep physical-device/Safari and low-end performance validation separate from hosted browser automation.
- Evaluate progression and replay with lawful real-action traces; do not infer retention from test counts.
- Every visual iteration needs three current before views and matching exact-head after evidence before merge.

## Done
- [x] Ready-screen Journey button names the nearest reward (`src/ui/next-goal.ts`)
- [x] Hide the boxed focus ring on programmatic dialog-title focus unless keyboard-focused
- [x] Fast `verify` gate (build + `test:fast`); heavy workflows manual; `weekly-full.yml` safety net; failure-only trimmed CI evidence
- [x] Direct battlefield orders (#158)

- [x] Landscape side rail (battlefield left, deck right, no page scroll) and Gather spacing (round 3)
- [x] Lazy-load Phaser after the shell; Open Graph preview; result Journey button names the next reward
- [x] Touch check `npm run review:mobile-touch` (320-412 portrait, 844x390, 4x CPU, #158 tap orders to a result)

## Next
- [ ] Weekly suite records the performance budgets in `docs/performance-budgets.md`; add frame-rate capture
- [x] First-battle teaching ring on the first troop card (0.3.8) and again while food piles up (0.3.12)
- [x] Count-up battle earnings on the result (round 6); victory/defeat motifs already existed
- [x] Settings and other dialogs in short landscape: no empty header band (round 6)
- [x] Colour-blind-safe troop-type shapes (shipped in 0.3.6, see below)
- [x] Streak grace day (optional `graceDay` field)
- [x] Colour-independent troop shapes (Settings, optional `marks` field)
- [ ] Optional haptics
- [x] Streak grace day (shipped in 0.3.7, see above)
- [ ] Capture and review victory/defeat, Journey, Chronicle and evolve-confirm screens on touch devices at 320, 360 and 412 widths
- [ ] Migrate Phaser 4, TypeScript 7 and Vite 8 as separate batches (Dependabot #161 closed: 126 type errors, Vite 8 `manualChunks` must be a function)
- [x] Compact dialog header in short landscape (round 4)
- [ ] Record the production domain and make `og:image` absolute
- [ ] Add `review:mobile-touch` to the weekly suite once its runtime is under ten minutes per engine
- [x] Evolution reveal: one-shot card flare, static with reduced motion (round 5)
- [x] First-Freeze cue when three enemies gather (Advance/Hold already cued by the order banner) (round 5)
- [x] True hit-stop on heavy hits (0.3.11; 50 ms, rate-limited, none with reduced motion) — original note: True hit-stop on heavy hits (heavy base hits already shake the camera, absent with reduced motion; a render freeze needs its own design)
- [x] Unearned seals shown on the chapter picker (already present via `masteryMarksHtml`; verified round 4)
- [x] RUSH wave panel moved out of the lane into the sky band (round 4)

## Shipped 2026-10-05 and 2026-10-06 (0.3.4 to 0.3.14)
- [x] First-Meteor cue (0.3.4); defeat recap naming the top damage dealer (0.3.5); weekly goal and skill badge target ring (0.3.13)
- [x] Settings last-saved line, heavier heavy deaths, opaque landscape dialog header (0.3.9); welcome-back line (0.3.10); hit-stop (0.3.11)
- [x] Weekly goal edge: week opens at battle start and a first-seen win counts its own seals (0.3.14)
- [ ] Feel check of hit-stop and heavy deaths on a physical phone (headless software rendering cannot measure the freeze)
- [ ] GPU-backed or physical-device frame-rate capture (headless measured 8-14 fps at 4x throttle on software WebGL)

## Regression pass, 2026-10-06 (after 0.3.13)
- [x] `review:mobile-touch` at 390x844, 844x390, 320x568 (victory by touch, 4x throttle), `review:overlap`, `review:clip`, `review:monkey`, `review:contrast`, `review:save-sessions` (16 cases), `review:browser`, `review:layering` (91 cases) pass; `npm test` twice
- [ ] `review:upgrade-text` fails at `320x568-root16-ready` ("clipped upgrades require an internal reflow scroll"); it fails identically on the v0.2.0 build, so it predates 0.3.x and needs its own look
- [ ] `review:mastery` did not finish inside 590 s with software WebGL (exit by timeout, no assertion failure); run it on a quieter machine or in the weekly suite
- [ ] The review scripts hard-code ports 4175, 4176 and 4177, which other repos on a shared machine also use (the save-session and browser reviews fail against a foreign server on 4175); make the port an environment variable
- [ ] `review:contrast` reports setting-row labels at 4.05:1 (Motion and Troop shapes status chips) and the daily-reward button at 4.41:1 as candidates; confirm or fix

## Village command response, 2026-10-05
- [x] Implement quieter gate readiness from authoritative Hold/Advance validity, with static reduced-motion parity
- [x] Route accepted simulation order events to distinct bounded Hold/Advance accents; test rejected input, draining, mute and voice limits
- [ ] Capture and inspect current before/after readiness and active-command screenshots at required phone/landscape/desktop sizes before verified visual release
- [ ] Listen to the new command contours alongside battle/atmosphere on browser and physical mobile output
- [ ] Complete the original cinematic atmosphere roadmap in real, behavior-tested slices; forty visually verified refinements are still unfinished

## First Fires depth, 2026-10-05
- [x] Inspect exact-current phone, landscape and desktop baseline views and register two hill-air pockets and two masonry reflections to the original 900×1000 painting
- [x] Implement a bounded immutable depth mesh in the real storybook branch, with crop/HUD/source-ink exclusions and static reduced motion
- [x] Add near-hearth/far-valley synthesis within the existing First Fires buffer; retain byte-identical audio for the five other chapters
- [x] Verify source registration and actual Phaser triangle-command decoding; run combined source tests and the unchanged engine-inclusive 500 KiB JS budget
- [ ] Capture and inspect exact-payload after views plus Canvas/WebGL, touch, crop/chapter changes and same-scenario 4× CPU evidence before visual release
- [ ] Complete browser OfflineAudioContext checks, listening review and physical mobile acceptance for First Fires spatial audio
