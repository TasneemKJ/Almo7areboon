# Battlefield Memory Implementation Plan

**Goal:** Make resolved heavy and Meteor impacts leave short-lived, depth-safe road scars without changing gameplay.

**Architecture:** Add one pure immutable memory model. The existing battlefield event adapter creates truthful intents, existing projectile timing owns ranged landings, and the three existing `groundFx` layers paint the result. Extend the permanent Chronicle browser review with public-action heavy and Meteor journeys.

**Tech stack:** TypeScript, Phaser 3, Node test runner, Vite, Playwright in GitHub Actions.

## Constraints

- Preserve saves, rewards, economy, damage, target choice, skill rules, input/pause ownership and audio.
- At most six marks; nearby equivalent marks refresh; fourteen active seconds.
- Reuse the three existing ground graphics and actor depth sort; allocate no scene-lifetime graphics or textures.
- Reduced motion is static. Pause and hidden ownership do not age marks.
- Native Chromium runs only in GitHub Actions.

## Tasks

- [x] Write failing pure tests for truthful intent, caps, merge, expiry, malformed input, immutability, shapes and reduced motion.
- [x] Implement the minimal pure battlefield-memory model and return focused tests to green.
- [x] Write failing renderer integration contracts for impact timing, real Meteor targets, existing ground layers and lifecycle cleanup.
- [x] Wire the model through the existing renderer and return focused tests/build to green.
- [x] Write failing native-review contracts for 320/390/1024 heavy impacts and reduced-motion Meteor.
- [x] Extend the existing GitHub-only Chronicle review harness through public controls.
- [x] Run all 858 source tests and production build on the local branch tree.
- [ ] Reconcile active PR #137, push this branch and open the next PR.
- [ ] Run required GitHub Actions workflows and inspect every original current-build screenshot and completed job log.
- [ ] Obtain independent code review and bug audit; fix supported findings tests-first.
- [ ] Verify the exact reviewed head/tree, merge, and independently verify merged source and Vercel production.
