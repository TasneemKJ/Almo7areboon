# Four UI Recovery Iterations Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement these four tasks sequentially. Reproduce each symptom before changing production code; record red/green evidence and a separate verified commit per iteration.

**Goal:** Complete four additional, bounded reliability passes on Almo7areboon PR #139.

**Architecture:** Keep the current Phaser game and DOM UI. Fix individual CSS or controller defects; do not migrate architecture, change combat rules, modify saved-data formats, or replace artwork.

**Tech Stack:** TypeScript, Vite, Phaser, existing Playwright, Node test runner, GitHub Actions.

**Spec:** User request in this conversation, October 2, 2026: "Do 4 more iterations @Game Studio", continuing the mobile-first reliability audit, with screenshot evidence and no architecture redesign. This document carries the relevant task brief; no separate design specification was supplied.

## Global Constraints
- Continue PR #139; do not merge or promote a deployment.
- Prioritize 320–430px portrait; check desktop without redesigning it.
- Preserve gameplay, artwork, dependencies, and player save formats.
- All runtime tests use isolated browser contexts and disclosed preparation/error fixtures, never a player's real storage.
- Local execution tools failed before setup. Use isolated GitHub Actions checkouts on chore/four-iterations-review. Transfer only reviewed, verified changes into fix/mobile-reliability-audit.

## Review Focus
- Touch targets at the 320px/short-screen boundary: inspect visible bounds and actual clicks.
- A long dialog scrolled to its end: Close must remain visible and hit-testable without covering the heading.
- A result restored from a pending-victory save: replay must restore usable keyboard focus without crediting twice.
- A rejected file read: retrying the same file must remain possible; a dismissed read cannot update a later screen.
- Existing pause, save ownership, reduced-motion, offline-return, and storybook behavior must remain intact.

## Files and interfaces
- scripts/review-ui-recovery.mjs: production-browser regressions; UI_ITERATIONS selects 1–4; UI_ENGINES selects chromium/webkit; UI_REVIEW_OUT isolates artifacts. REVIEW_URL optionally tests the same fixtures against a preview.
- src/ui/continuation.css: existing mobile/layout correction layer.
- src/main.ts: existing modal-close and file-import event handlers. No controller split or new gameplay API.
- .github/workflows/four-iterations.yml: isolated audit execution and evidence retention; not intended for the final PR.

### Iteration 1: Header touch target
- [ ] Reproduce the gems control below the game's 44px target using real layout at 320x568, 390x844, 1024x768; capture ready, quests, battle.
- [ ] If confirmed, minimally correct its CSS size without moving the header into the chapter heading.
- [ ] Run UI_ITERATIONS=1 plus the complete source suite and build; commit the isolated correction.

### Iteration 2: Scrolled dialog dismissal
- [ ] Reproduce whether Close scrolls offscreen in Settings/Quests. Capture top and scrolled states before any correction.
- [ ] If confirmed, reuse the established sticky-dismiss pattern for ordinary dialogs, preserving the storybook's existing treatment and heading clearance.
- [ ] Run UI_ITERATIONS=1,2 plus the complete source suite and build; commit separately.

### Iteration 3: Result-to-ready keyboard focus
- [ ] Restore a simulated legitimate victory profile and activate Replay through the real UI. Check visible usable focus, subsequent Tab, and receipt/gem/coin integrity after reload.
- [ ] If confirmed, reject unavailable/non-focusable return targets and fall back to the current game navigation control.
- [ ] Run UI_ITERATIONS=1,2,3 plus the complete source suite and build; commit separately.

### Iteration 4: Failed/dismissed import lifecycle
- [ ] Inject only a rejecting File.text promise. Check input reset, error visibility while relevant, and suppression after dismissing Settings and changing screens. Saved progress must remain identical.
- [ ] If confirmed, apply the existing asynchronous success-path ownership/modal guards to the failure path, and clear the failed input.
- [ ] Run all four iterations in Chromium and WebKit plus the complete source suite, build, existing mobile/save/offline checks; commit separately.

## Completion ledger
Pre-flight: Iterations 1–2 share only the existing CSS correction layer; iterations 3–4 affect separate functions in src/main.ts. Re-run preceding browser cases at each step. No conflicting interface changes.
Ruling: Browser screenshots may be retained on the isolated diagnostic branch for inspection because local container/Python access failed. They are not production assets.
Baseline source: bdc4bf0086122d0ae129cebfb9b5286ef3b80750.
All tasks initially pending reproduction. A passing baseline is not a reason to invent a defect; record it and select another confirmed issue within the same scope.
