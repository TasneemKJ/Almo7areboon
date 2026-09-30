# Save Session Conflict Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent stale browser tabs from overwriting game progress or its recovery copy.

**Architecture:** One lifetime exclusive Web Lock owns durable writes. A guarded save session checks exact primary/backup baselines and preserves existing save/import transactions. Secondary or conflicted tabs stay paused behind an accessible recovery dialog; unsupported locking offers explicit temporary play with export.

**Tech Stack:** Existing TypeScript, browser Web Locks/localStorage, Node test runner, Vite, Playwright. No added dependency or schema migration.

**Spec:** `docs/superpowers/specs/2026-09-30-save-session-conflicts.md`

## Global Constraints

- Work only in `/workspace/scratch/6a97bc4b1ac1/almo7areboon-production`, branch `fix/save-session-conflicts`; original tactical checkout and atmosphere worktree have other active writers.
- Keep save schema version 2 and existing primary/backup keys. Exclusive lock name: `almo7areboon.save.v1.writer`; request `mode:'exclusive', ifAvailable:true`; never steal or queue a takeover.
- Acquire ownership before loading the authoritative playable profile. Every reacquisition reloads stored progress while owning the lock; never activate stale in-memory state.
- Check exact primary and backup strings before guarded writes/actions/resume. No automatic merge, overwrite override, or localStorage lock emulation.
- Unsupported/missing locking fails closed for durable writes. Explicit temporary play writes neither progression key and keeps export available.
- No source-only assertions for new runtime behavior. Capture RED and GREEN evidence. Root owns commits/PR/merge; implementers stage no unrelated files and report without committing when instructed.

## Review Focus

- A tab closes while lock acquisition is pending: late callback must release immediately and never reactivate disposed UI (Task 1 race test; Task 2 close integration).
- A successful primary write is followed by a failed backup write: baseline must reflect only successful writes and the next save must remain valid (Task 1 storage-fault test).
- A foreign writer changes only backup to a future schema: current session must stop without touching either key (Task 1 baseline test; Task 2 recovery UI integration).
- A pending authoritative victory is loaded after takeover: its result appears once and its reward never re-credits (Task 2 browser pending-victory fixture).
- A frozen/BFCache-restored page has old Game state: pageshow reacquires/reloads before keys, simulation, or autosave can mutate durable progress (Task 2 lifecycle integration and controlled event test if BFCache is unavailable in headless Chromium).

---

### Task 1: Guarded authoritative save session

**Files:**
- Create `src/game/save-session.ts` and `tests/save-session.test.ts`.
- Modify `src/game/backup.ts`; extend `tests/interface.test.ts` only for the new import writer seam.
- Preserve `src/game/save.ts` behavior unless a small exported snapshot helper is strictly necessary; no profile/schema edits.

**Interfaces:**
- Consumes existing `loadProfileWithStatus`, `decodeSave`, `saveProfile`, `SAVE_KEY`, `BACKUP_KEY`, `Profile`, and `Game`.
- Produces `createSaveSession({storage,locks,onStatus})` and the exact status/load/write/session contract in the spec. Export the narrow lock-request adapter type used by browser integration and fake-lock tests.
- Produces `restoreBackupWithSave(current:Game,candidate:Profile,commit:(profile:Profile)=>boolean)`; existing `restoreBackup(current,candidate,storage?)` delegates through it without API breakage.

- [ ] **Step 1 — Write behavioral RED tests**: two session acquisitions sharing one lock/storage permit one active writer; B returns blocked; A saves a summon; B save leaves primary+backup byte-for-byte unchanged; after A releases, B reacquires and returns A's current card/gem profile. Assert simultaneous acquisition also grants only one active owner.
- [ ] **Step 2 — Run RED**: `node --experimental-strip-types --test tests/save-session.test.ts`; capture failure caused by absent session implementation, not unrelated imports.
- [ ] **Step 3 — Implement ownership and guarded storage**: implement the spec seam, generation-safe lifetime release, baseline checks, snapshot load, and successful-write tracking. `check` detects foreign primary/backup changes and read failures; `save` retains existing primary-first behavior. Add the import commit callback wrapper.
- [ ] **Step 4 — Write/run remaining boundary tests**: late lock grant after release/dispose; repeated acquire/release; missing/rejected lock gives unavailable; temporary accepts gameplay checks but makes zero writes; unsupported primary/backup protected; corrupt primary recovers backup while owning; primary quota failure preserves both bytes; backup failure after successful primary does not poison baseline; foreign removal/change blocks; successful import updates baseline; rejected/conflicted import returns the original Game. Every test asserts observable storage/status/profile results, not private calls.
- [ ] **Step 5 — Verify GREEN**: `node --experimental-strip-types --test tests/save-session.test.ts tests/recovery.test.ts tests/robustness.test.ts tests/interface.test.ts`; expected all pass. Run `npx tsc --noEmit`; expected exit 0. Record commands/results and any changed contracts for independent review before Task 2.
- [ ] **Step 6 — Checkpoint after review**: root commits only Task 1 files with `fix: guard durable saves with exclusive session ownership`; do not include unreviewed Task 2 changes.

### Task 2: Recovery interface, lifecycle ownership, and real two-tab release gate

**Files:**
- Modify `src/main.ts`, `src/ui/pause.ts` only if needed for explicit session pause ownership, `src/ui/continuation.css`, `README.md`, `package.json`, `.github/workflows/verify.yml`.
- Create `src/ui/save-session-screen.ts`, `tests/save-session-ui.test.ts`, and `scripts/verify-save-sessions.mjs`.
- Existing render/state APIs remain unchanged; no tactical, atmosphere, economy, or dependency changes.

**Interfaces:**
- Consumes Task 1 `createSaveSession`, its statuses/load/write results, and `restoreBackupWithSave`.
- Produces `saveSessionDialogHtml(status:SaveSessionStatus):string` for blocking states with the spec's exact copy and `data-command` values `session-continue`, `session-temporary`, `export`. Main supplies state-appropriate Continue labels; no inline event handlers.
- Produces a required `review:save-sessions` script that launches the built preview on a distinct loopback port **4175**, verifies behavior, emits `artifacts/save-session-review/diagnostics.json` and selected screenshots, and exits nonzero on any failed assertion/page error.

- [ ] **Step 1 — Write RED UI and browser scenarios**: unit-check recovery command availability and unavailable/unsupported temporary notices; write the actual same-context two-page sequence from the spec using real Cards/summon buttons. On the current application the second tab must fail the expected protected-state assertion. If local Chromium is absent, record the environment limitation; do not manufacture a RED browser result.
- [ ] **Step 2 — Integrate startup and mutation guards**: begin non-playable, acquire then instantiate the authoritative Game, and gate input/direct profile toggles/import and `GamePort.step`. Route every save through the session; show conflict UI before automatic result UI; retain export even when blocked. Preserve manual pause, focus restoration, motion and audio behavior.
- [ ] **Step 3 — Implement recovery/lifecycle**: recover only after explicit Continue reacquires and reloads; temporary mode is explicit, persistent-noticed, zero-save and import-disabled. Storage events check the current actual baseline; focus/visible checks precede resume. Hide retains lock; pagehide/HMR performs guarded save then synchronous deactivation/release; pageshow reacquires/reloads an owning session, while explicit temporary play stays temporary and skips durable saves. Dispose stale async callbacks. Test controls remain keyboard operable and dialogs stay isolated at 320px.
- [ ] **Step 4 — Complete browser acceptance**: assert A summon survives B blocked autosave/pagehide; B takes over only after A closes and reloads latest wallet/cards; simultaneous startup gives one writer; foreign primary and future-backup change block further writes; exports remain downloadable; pending-victory takeover preserves reward count; explicit no-lock temporary play leaves both saved strings unchanged. Exercise real import success/rejection through the guarded seam, ordinary keyboard isolation, and pageshow path. Use fixtures/localStorage only for setup or explicit foreign-writer fault injection, never a shipped test hook.
- [ ] **Step 5 — Add CI gate and focused documentation**: require the new check after tests/build and browser install; collect diagnostics/screenshots without weakening existing checks. README explains one active saving tab, Continue Here, temporary mode and remaining older-client/storage-loss limits. Do not claim WebKit/device acceptance or bug-free status.
- [ ] **Step 6 — Verify final integration**: run `npm test` and `npm run build` (serialize build output); run `npm run review:save-sessions` wherever the browser executable exists. Required CI must run this plus existing portrait/layering gates. Review 320px recovery screenshot and diagnostics, verify exact source revision and no page errors. Resolve the concrete failures, then stop optional testing.
- [ ] **Step 7 — Checkpoint and handoff**: root independently reviews and commits the scoped integration as `fix: protect browser save recovery across tabs and lifecycle`; PR includes reproduced original failure, new behavioral checks, and the old-client concurrency limit. Merge only after fresh required CI passes.
