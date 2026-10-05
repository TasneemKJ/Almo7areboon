# Simple Entry and Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Separate an atmospheric two-control Home from battle and make ordinary results concise without losing saved progress or optional detail.
**Architecture:** Presentation/input state stays in main and focused UI modules; Game.dispatch, save sessions, pendingVictory and existing modal ownership remain authoritative. No balance, save-schema, simulation-clock or audio-owner change.
**Tech Stack:** Existing TypeScript/Vite, native DOM, Phaser world, node:test.
**Spec:** Owner's5October2026 Home→Play→short-result direction and the research-informed simple-opening design. Research references are documented in docs/audits/2026-10-05-simple-opening-references.md. This is an intermediate draft slice; active-play simplification remains separate.

## Global Constraints
- At most3 visible UI controls on entry and ordinary results, including icons; Home needs onlyPlay/Continue andSettings.
- Genuine physical world targets remain usable and are audited separately from UI chrome. No disguised button rows in canvas.
- Preserve500KiB total shipped gzipJS includingPhaser, current art, schema5 and save keys.
- Critical save/session notices remain explicit. No real reward or choice is granted/skipped by rendering.
- Current native small-phone failures and dense active-play layout are not declared resolved by this slice.

## Review Focus
- Settings fromHome must return toHome without starting combat or ambience.
- A saved pending victory must wait behindContinue and retain its receipt without repaying rewards.
- Session conflicts/recovery and temporary play must not bypass the entry or hide safety notices.
- Keyboard/pointer duplication must not start twice or activate gameplay behindHome.
- Expedition provisions, terminal timelines, defeat/retry and evolution must retain actual choices/costs through deliberate optional views.

### Task1: Atmospheric Home
**Files:** create src/ui/entry-screen.ts and src/ui/simple-entry.css; modify src/main.ts; create tests/simple-entry.test.ts; extend tests/main-integration.test.ts.
**Interfaces:** entryScreenHtml(profile:Profile):string; entryCopy(profile:Profile,hasSavedProgress:boolean):{action:string;chapter:string;subtitle:string}; main's entryEntered=false gates visibility, input, pause and audio until real enter-world activation.
- [ ] Add RED tests for2buttons, no roster/currency/reset, Play versusContinue, immutable profile, and pending-result copy.
- [ ] Add RED main-boundary tests forHome blocking result auto-open/gameplay, deliberate entry startingreadybattle exactlyonce, HomeSettingsreturn and pendingreceiptContinue.
- [ ] Implement two-control authored-art Home and input/lifecycle gates. Keep data safety modal ownership independent.
- [ ] Run focused node tests and build, then fullsource tests. Document any intentionally replaced old entry assumptions.

### Task2: Compact canonical result
**Files:** src/ui/results-screen.ts, src/main.ts, src/ui/simple-entry.css, tests/simple-results.test.ts, tests/main-integration.test.ts.
**Interfaces:** compactResultsHtml(profile:Profile,state:BattleState):string is read-only; existing resultsHtml remains the detailed receipt and advanced-action presentation. Main shows compact result bydefault and deliberately opensDetails without recomputing rewards.
- [ ] Add RED tests for ordinary victory/defeat/terminal/expedition cases,≤3summaryactions, exactearnedvalue and no mutation.
- [ ] Preserve optional stats/lore/evolution/expedition access with explicit Back; no automatic provision, spend or rewardclaim.
- [ ] Test real mainclick paths, focus/receipt preservation, save conflicts and returningHome.
- [ ] Run fulltests/build and independent review. Native exact-source320/390/844Home, result, settings, entry and save interactions remain required before acceptance.

### Task3: Integrate and verify
- [ ] Inspect diff againstd9dd1dcd1c5c4a4bb6cdd44641e73f8dd07f4003, preserve reviewed caption/arena changes.
- [ ] Record changed-file hashes/payload and source test evidence.
- [ ] Obtain independent review and GitHub native screenshots/interactions. Do not substitute old source images or source tests for visual acceptance.
