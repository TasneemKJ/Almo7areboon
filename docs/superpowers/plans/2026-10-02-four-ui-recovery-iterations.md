# Four Mobile QA Iterations Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans and systematic debugging. Reproduce defects before changing production code. Each iteration is a coverage-led audit, not one preselected defect. Record tested, failed, fixed, blocked, and untested cases separately.

**Goal:** Complete four extensive mobile-first QA iterations on Almo7areboon PR #139, with evidence of coverage rather than a bug-count target.

**Architecture:** Preserve the current Phaser game and DOM UI. Make minimal verified fixes; do not resume the stopped architecture redesign, change gameplay balance to satisfy tests, replace artwork, or change saved-data formats.

**Tech Stack:** TypeScript, Vite, Phaser, existing Playwright and Node tests, GitHub Actions.

**Spec:** User requested four further Game Studio iterations, then clarified on October 2, 2026 at 21:00:36 UTC: "Why each pass has only 3 to 4 bugs ? You are not doing extensive QA testing ?" The earlier four-single-defect plan was too narrow. This revision supersedes its completion criteria. The already reproduced defects remain valid work items; they do not by themselves complete the expanded audit.

## Global constraints
- Continue PR #139; do not merge or promote a production deployment.
- Prioritize mobile web, retain desktop sanity coverage, preserve existing saves and art direction.
- Never invent defects, split one defect into several for counting, or equate a test count with a count of newly explored scenarios.
- Do not count repeated viewport/browser executions as distinct behavioral scenarios. Report both dimensions.
- Execute tests in isolated contexts with disclosed prepared profiles and controlled faults, never a real player's storage.
- Local container/Python execution failed in this session. GitHub Actions checkouts on chore/four-iterations-review provide execution. This limits execution convenience, not the required honesty of results.
- No performance or physical-device acceptance claims from a CI browser pass.

## Evidence and completion rules
Every case records its scenario ID, input/profile, browser, viewport, steps, expected and observed result, code revision, severity of any failure, and evidence location. Each iteration ends with a coverage table and an unresolved-issues register. A green inherited source suite is a regression baseline, not new exploratory coverage.

For a confirmed defect: capture the failing state; add a behavioral regression; make the smallest fix; rerun that regression and its neighboring flows; rerun the full source suite and production build; inspect relevant before/after screenshots. Generated screenshots are not marked visually reviewed until they have actually been viewed. Record unsupported visual inspection as a gap, not a pass.

Finding a few defects does not end a pass. Complete its defined cases or report the remainder explicitly as untested/blocked. There is no minimum or maximum bug quota. Passing cases matter but cannot establish universal bug freedom.

## Environment matrix
- Main mobile browser coverage: Chromium and WebKit.
- Portrait widths: 320, 360, 375, 390, 414, 430 CSS pixels, plus breakpoint-edge widths where a failure is identified.
- Short/tall heights and landscape: include 320x480, 320x568, 390x844, 430x932, 568x320 and 844x390, not just a single portrait size.
- Exercise rotation and viewport resizing within the same session, not only fresh contexts.
- Use Chromium safe-area injection where available, and label it as emulation; no claim of a hardware notch in WebKit.
- Desktop control: at least 1024x768, plus a Firefox smoke check when relevant.
- Primary transitions repeat with reduced motion; targeted checks include enlarged text/zoom and keyboard navigation.
- Apply the matrix according to risk. Do not imply every Cartesian combination was executed when only representative samples were used.

## Iteration 1 — Mobile interface, navigation, and visual audit
**Surfaces:** ready/battle HUD, troop and skill controls, Evolution, Cards, Skills, Settings, Quests, chapter selection, Storybook, available preparation/discovery/expedition controls, victory/regroup, and recovery dialogs.

- [ ] Inventory every reachable screen and visible interactive control using fresh and legitimately prepared profiles.
- [ ] Exercise opening, closing, scrolling, back/navigation, and return-to-battle for each screen. Check pause preservation and background isolation.
- [ ] Measure target size, actual hit testing, overlap, clipping, horizontal overflow, and safe-area boundaries. Disabled controls must remain understandable without accidentally accepting input.
- [ ] Inspect actual screenshots for battlefield obstruction, hidden text, unreadable state feedback, and whether primary actions remain visible after transitions.
- [ ] Test rapid/repeated taps and taps near neighboring controls; check no click-through when dialogs close.
- [ ] Expand confirmed failures at breakpoint boundaries and during rotation, not just reloads.
- [ ] Fix and verify all confirmed in-scope defects; document any unresolved ones rather than ending after an arbitrary count.

Known work: Settings/Quests Close can scroll offscreen; retain the existing production-browser reproduction. Gems already meets the 44px target and needs no change. The help disclosure audit is supplemental, not a substitute for the screen inventory.

## Iteration 2 — Gameplay and progression state transitions
**Surfaces:** combat, role deployment, skills, route objectives, results, retry, chapter progression, evolution, and timeline/expedition transitions.

- [ ] Cover representative valid states in all six eras, including locked/unlocked troop roles, affordability edges, food capacity, and repeated deployment attempts.
- [ ] Exercise each available route objective through real controls or explicitly disclosed deterministic simulations; distinguish simulated outcomes from browser playthroughs.
- [ ] Check Freeze, Meteor, captain/food skill use, once-per-battle restrictions, rally/release, pause/resume and speed changes.
- [ ] Test natural victory, natural defeat, retreat, retry, earlier-chapter selection, and continuation. Check impossible/stale actions are rejected without mutation.
- [ ] Test evolution and timeline/expedition transitions around their requirements; verify currencies, unlocks, receipts, and stated reset behavior.
- [ ] Reload after settlement, retry, and continuation; verify no duplicate awards or stranded result states.
- [ ] Repeat risky transitions with rapid input, menus opened mid-battle, and temporary sessions.

Known work: replaying a restored victory leaves focus on BODY; keep its failing regression and receipt/coin/gem checks. It is one issue, not three issues because it reproduced at three widths.

## Iteration 3 — Persistence, browser lifecycle, and offline resilience
**Surfaces:** save ownership, primary/backup storage, import/export/reset, page lifecycle, service-worker installation and offline return.

- [ ] Cover valid, malformed, truncated, oversized and unsupported-version saves; missing or damaged primary/backup combinations; guarded reset/import cancellation.
- [ ] Exercise file-read rejection, retry of the same file, a delayed success/failure after dismissal, and overlapping file selections. Verify the latest intended operation owns its result.
- [ ] Inject read/write/quota failures; verify no unreported data loss, stale error into another screen, or replacement without confirmation.
- [ ] Exercise multiple tabs, ownership loss, temporary play, owner handoff, reload, visibility changes, pagehide/pageshow and resumption. Label synthetic lifecycle dispatch separately from actual browser events.
- [ ] Exercise fresh install, offline-after-load, cached offline reload, update failure, transient server failure, blocked/missing assets and CacheStorage failure. Verify actual start/deployment where offline is expected to work.
- [ ] Check error recovery gives a usable action and preserves the last valid saved progress.

Known work: File.text rejection does not clear the input and can emit a stale toast after dismissal. Both symptoms have a production-browser reproduction; fix the shared failure-path ownership behavior rather than inflating the bug count.

## Iteration 4 — Stress, accessibility, and cross-feature regression
**Surfaces:** long/repeated sessions, event/resource cleanup, rendering and audio, focus/navigation, combined previously fixed flows.

- [ ] Run reproducible repeated battle/result/retry and menu open/close cycles with a disclosed duration and seed where applicable.
- [ ] Inspect console errors, failed assets, unexpected storage mutation, duplicate events, and growth in observable DOM/canvas/listener resources. Explain which metrics are available and their limits.
- [ ] Exercise resize/rotation during play, result display, dialogs and temporary-session notice; test background/resume without catch-up damage or unintended audio.
- [ ] Exercise keyboard focus entry, trapping, restoration and Escape; verify hidden/inert controls cannot be selected or activated.
- [ ] Check reduced motion, text enlargement, semantic names/status feedback, and representative contrast/readability issues; do not call this full accessibility certification.
- [ ] Combine fixes with existing mobile, save-session, offline and Chronicle regressions; record exact-head CI results and review representative final screenshots.
- [ ] Report physical-device, frame-time, memory or prolonged-soak gaps explicitly. Do not use average CI speed as mobile performance acceptance.

## Existing files and implementation boundaries
- scripts/review-ui-recovery.mjs: the initial focused browser regressions. Keep them, but extend or supplement them with a coverage-oriented harness rather than pretending they implement this entire plan.
- scripts/verify-mobile.mjs and existing review/save/offline/Chronicle scripts: reuse coverage where it is real; inventory their limitations and identify new scenarios separately.
- src/ui/continuation.css: existing mobile/layout correction layer.
- src/main.ts: modal and import lifecycle fixes only where a reproduction supports them.
- Additional source files: change only when the expanded audit produces a verified defect in that subsystem.
- Diagnostic workflows and qa/four-iterations evidence remain isolated from production assets.

## Progress ledger — factual status at scope correction
- Baseline source: bdc4bf0086122d0ae129cebfb9b5286ef3b80750.
- The first focused baseline executed four behaviors at three Chromium viewports: 12 case executions, 3 passed, 9 failed, 36 screenshots, no uncaught page errors. This is narrow coverage, not an extensive project audit.
- The nine failures represent three issue areas repeated at three widths: scrolled dismissal, post-result focus restoration, and import failure lifecycle.
- Gems touch target passed and is left unchanged. The How to play disclosure baseline was executed separately; its report still needs review before any related production change.
- The initial help-audit setup failed because a shell heredoc terminator was missing. It was corrected using a standalone setup script. That setup failure is not a game defect.
- None of the four expanded iterations is complete. Broader coverage, fixes, fresh verification and visual inspection remain pending.
