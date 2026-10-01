# Folktale Tactics Implementation Plan

**Goal:** Integrate the twenty approved ideas and raise one PR, without merging.
**Architecture:** Bounded pure progression and deterministic combat hooks; Game remains the state owner. Existing guarded actions and the scene renderer host the optional illustrated journey and Rally command.
**Stack:** Existing TypeScript, Phaser 3, Vite, Node tests and Playwright; no new dependencies.
**Spec:** docs/superpowers/specs/2026-10-01-folktale-tactics.md

## Global constraints
Portrait first; preserve existing artwork and saves. No main-branch writes, merge, scheduler or independent storage writer. Invalid and paused actions are no-ops. Outcomes settle once.

## Review focus
Old/future/corrupt saves; simultaneous victory/loss; repeated victory receipts; expedition reload; pause and save ownership; small-screen layering, focus and objective clarity.

## Implementation
- [x] Bounded routes, unlocks, choices, settlement, veterans, discoveries, expeditions and alternate-timeline state.
- [x] Rally, cover, shatter, objectives, captains and boss behavior with regression tests.
- [x] Game integration and schema-5 migration; mission receipts and old-save compatibility.
- [x] Scenic journey, preparation, teaching, results, Phaser props and mobile styling.
- [x] Local suite: 739 passing tests; typecheck and production build pass.
- [x] Initial browser screenshots inspected; ambiguous result selector, boss timing, captain guidance and pale result-heading defects corrected.
- [x] Twenty-idea scope, verification and explicit limits recorded in docs/FOLKTALE-TACTICS.md.
- [ ] Final PR workflow acceptance; consult the PR checks for current status.

## Execution record
Direct cloning and local browser navigation were blocked. GitHub provided authorized branch reads/writes and an Actions artifact with dependencies for local verification. Browser checks ran in GitHub Actions. The temporary branch-scoped assembly workflow and transport files are removed from the proposed merge tree; the permanent browser-review workflow has read-only repository permissions. No scheduled task or merge was created.
