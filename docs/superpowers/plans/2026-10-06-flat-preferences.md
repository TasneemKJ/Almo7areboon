# Flat Preferences and Home Ownership Implementation Plan

> For agentic workers: execute locally in the assigned isolated copy using the approved design; test first. Parent owns review and publication.

**Goal:** Flat honest preference fields and safe Home/Camp/leave transitions without losing advanced actions.
**Architecture:** UI templates own semantics; main.ts owns navigation/focus and guarded side effects; Game.dispatch owns Start/retreat/retry. The optional prior-play marker is normalized in existing schema 5.
**Tech Stack:** Existing TypeScript, native DOM/CSS, Phaser and node:test. No dependencies.
**Spec:** docs/audits/2026-10-06-flat-preferences.md and parent approved preferences-slice design.

## Global constraints
No browser/server/native/GitHub/publication work. Save keys/schema remain compatible; preserve session ownership, future/read-only recovery, independent audio mixes, marks, grace day, role recap and physical field. 44px native targets; at most three action buttons on each changed surface, seven preference fields reported separately. Total shipped gzip JavaScript below 500 KiB including engines.

## Review focus
- Settings-only saves must not look like actual play; accepted Start must survive export/import/reload.
- Camp must not bypass pending victory or expedition provisions.
- Foreign-session detection during leave/import/reset must keep recovery authoritative.
- Done/Back/Escape must return to the actual owning surface without implicit combat resume.
- Independent audio/motion/marks fields must retain value and native focus while changing.

## Tasks
- [x] Write failing canonical prior-play normalization/start tests; run RED. Add optional marker and entry-copy/history policy; run GREEN.
- [x] Write failing Home/Camp/held-battle tests in real main-handler harness; run RED. Implement state-gated Home secondary action, Pause Home and explicit leave confirmation; run GREEN.
- [x] Write failing Settings seven-field/three-action and owner-return tests; run RED. Add focused templates/CSS and guarded native field changes, save and confirmation owners; run GREEN.
- [x] Adapt existing source-contract and import lifecycle fixtures to new semantic controls/owner, preserving every assertion. Run focused suite, full npm test, npm run build, inspect diff and record results.
- [x] Freeze full source candidate excluding dependencies/build output, produce narrow patch and hashes for parent review. Keep exact-source browser acceptance explicitly pending.
