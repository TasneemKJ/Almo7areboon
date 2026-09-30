# Folktale Tactics Implementation Plan

> Execute inline with superpowers:executing-plans and test-driven-development.

**Goal:** Implement the twenty approved ideas in one expansion branch.
**Architecture:** Bounded pure progression plus deterministic fixed-step combat hooks; existing Game remains the state owner. Existing guarded actions and scene renderer host the journey and contextual Rally order.
**Tech Stack:** Existing TypeScript, Phaser 3, Vite, Node tests and Playwright. No new dependencies.
**Spec:** docs/superpowers/specs/2026-10-01-folktale-tactics.md

## Global constraints
Portrait first; preserve existing artwork and saves. No main-branch writes, merge, scheduler or independent storage writer. Invalid and paused actions are no-ops. Outcomes settle once.

## Review focus
Old/future/corrupt saves; simultaneous victory/loss; repeated victory receipts; expedition reload; pause and session ownership; small-screen layering, focus and objective clarity.

## Tasks
- [x] Implement bounded route, unlock, choice, settlement, veteran, discovery, expedition and alternate-timeline state; 12 local tests pass.
- [ ] Implement combat hooks and tests for rally, cover, shatter, objectives, captains and boss behavior.
- [ ] Integrate Game and schema migration; verify receipts and old save compatibility.
- [ ] Integrate scenic journey, preparation, teaching, results, Phaser marks and mobile styling.
- [ ] Run full tests, typecheck, build and production browser review; inspect screenshots and fix regressions.
- [ ] Record coverage, limitations and review findings; raise the PR without merging.

## Execution ruling
Direct cloning is blocked in the local container. GitHub provides live reads and branch commits. New pure modules are tested locally; repository CI supplies full-tree verification. An exact-anchor integration script may run in a temporary branch-scoped workflow to apply reviewed edits. Remove that write-enabled workflow before final handoff. No scheduled task is created.
