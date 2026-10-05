# First Fires Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make First Fires visibly deeper with measured distant air, grounded practical light and acoustic distance.

**Architecture:** A source-registered view model caches a bounded triangle mesh on chapter/layout changes. The existing storybook branch paints it through ambience before resident marks and actors; the existing soundscape synthesis adds First Fires-only environmental depth.

**Tech Stack:** TypeScript, Phaser 3 Graphics, existing deterministic PCM synthesis, node:test, Playwright review fixture.

**Spec:** docs/audits/2026-10-05-first-fires-depth.md

## Global Constraints
- First Fires only; no legacy grading, asset replacements or command/budget changes.
- Zero new textures, objects, timers, save fields or live audio voices.
- At most two depth pockets, two reflected surfaces and 120 cached triangle fills.
- Preserve source ink, cypresses, roofs, gold path, troops, gates and HUD.
- Reduced motion is fully static across time; existing phase/hidden/modal ownership remains.
- No remote writes from this implementation task.

## Review Focus
- Malformed placement/crop/HUD coordinates fail closed with finite output.
- Tiny/landscape crops cannot move masks away from source registration.
- Chapter changes cannot retain First Fires marks on another painting.
- Paused/reduced/hidden contexts cannot introduce an independent clock.
- New Graphics command types remain visible in real-render fixture assertions.

### Task 1: Measured view model and real storybook integration
**Files:** Create src/view/storybook-depth.ts, tests/storybook-depth.test.ts, tests/storybook-depth-integration.test.ts. Modify src/view/battlefield.ts, tests/fixtures/layering.ts and scripts/capture-layering-review.mjs.
**Interfaces:** cacheStorybookDepth(age, viewport) returns immutable projected triangles; paintStorybookDepth(graphics, mesh, time, reduced, lampAlphas) reuses those triangles with finite bounded alpha.
- [x] Write and run failing model and actual-branch tests for visible First Fires output, no other chapters, finite/crop/HUD/ink exclusions, static reduced motion and bounded allocations.
- [x] Inspect exact-current screenshots; trace geometry from actual source pixels.
- [x] Implement the minimal cached model and storybook integration; retain the early return and legacy code unchanged.
- [x] Extend actual Graphics decoder and crop/layering assertions; test cached geometry and old chapter behavior.
- [x] Run focused tests and inspect full results.

### Task 2: First Fires acoustic distance
**Files:** Modify src/view/chapter-score.ts and src/view/soundscape.ts; create tests/first-fires-soundscape.test.ts.
**Interfaces:** synthesizeSoundscape keeps its existing PCM contract, duration, sample rate and memory limit.
- [x] Freeze other chapters' PCM hashes and write a failing First Fires acoustic-depth regression.
- [x] Add restrained local hearth and distant valley character inside the same synthesis/voice owner.
- [x] Run focused audio tests, malformed inputs, determinism, loop endpoints and no clipping.

### Task 3: Combined acceptance handoff

Source implementation and verification are complete. Native-render after screenshots, listening and physical-device acceptance remain pending with the coordinator; checked items below describe only the source handoff.
**Files:** Update DESIGN.md, UX-CONTRACT.md, TODO.md, CHANGELOG.md and this audit's evidence status.
- [x] Run full npm test and npm run build without changing budget files.
- [x] Freeze an atomic payload with exact before/after hashes; parent coordinates native-render screenshots, mobile flow, Canvas/WebGL, OfflineAudioContext and same 4× CPU comparison.
- [x] Record outcomes separately: implemented, tested, visually accepted, listened, physical-device verified.
