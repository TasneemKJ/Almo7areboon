# One authoritative save session

## Problem and outcome

Two tabs currently load independent profiles and can overwrite one another on autosave or pagehide. A reproduced summon in tab A (one card, zero gems) disappeared after tab B saved its stale default profile twice; the backup was also replaced. Prevent this ordinary production data loss without a backend, save-schema migration, economy change, or forced account/session takeover.

Only one cooperating tab may write the game's primary and backup keys. A secondary tab must pause, clearly explain the conflict, and load the authoritative stored profile only after acquiring ownership. Never merge currencies, inventories, pending victories, or quest rewards.

## Ownership and startup

- Use `navigator.locks.request('almo7areboon.save.v1.writer', {mode:'exclusive', ifAvailable:true}, callback)`. Hold the acquired lock by returning an unresolved promise until release. Never use `steal`, a waiting request queue, a lease timeout, BroadcastChannel election, or a localStorage pseudo-lock.
- Acquire the lock **before trusting any loaded profile for durable gameplay**. The existing pre-lock preview/default may render, but input and simulation advancement remain blocked. Once acquired, read both save keys and load the profile from that exact snapshot before enabling gameplay. A stale secondary must never bring its previous in-memory Game into the new writer session.
- One attempt at a time; duplicate Continue clicks reuse the pending attempt. Generation/disposal checks prevent a late acquisition callback from reopening an old page or retaining a lock. A denied `ifAvailable` request resolves to blocked immediately; it does not subscribe to future ownership.
- A merely hidden tab keeps ownership. Hiding saves through the guard, pauses combat, and suspends audio. `pagehide`/HMR performs a final guarded save, disables writes synchronously, then releases the lock. `pageshow` after release reacquires and reloads before resuming. An explicitly temporary session stays temporary across pagehide/pageshow and never automatically acquires ownership; only a full new page load begins the ordinary startup flow again. Focus/visible transitions while ownership remains held verify storage before gameplay resumes. Release/dispose must be idempotent.

Web Locks are a secure-context API. The production HTTPS origin and localhost are the supported durable routes. Reference: W3C Web Locks specification https://w3c.github.io/web-locks/ (exclusive lock lifetime and `ifAvailable` null callback). No package dependency is needed.

## Exact storage baseline

Track the exact primary and backup strings (including `null`) observed while acquiring ownership, then the values successfully written by this session. Before every durable action/write, and when the page regains visibility/focus, compare both current strings against that baseline.

- Any unexpected difference, including removal, enters `conflict` and disables all further writes before showing recovery UI. Release ownership. Do not update the baseline to the foreign data and retry the old profile.
- A read failure enters `unavailable`, disables writes, and releases ownership. Never treat an unreadable save as empty and overwrite it later.
- Unsupported primary **or backup** keeps existing future-schema write protection. An unsupported snapshot enters `unsupported` even if one supported copy exists. Neither save key is changed.
- Continue using existing `saveProfile` validation, primary-first commit order, and optional backup write. The session's storage adapter tracks only successful writes: a quota-rejected primary leaves baseline/profile storage unchanged; a successful primary plus failed backup is a successful save with the previous backup baseline retained.
- A primary quota/write failure keeps the active owner and in-memory progress, returns a failed save result, and preserves the existing export warning. It must not be mislabeled a cross-tab conflict. Further guarded retries may succeed after capacity returns.
- No per-frame storage reads. Check at action boundaries, before periodic/pending-victory/final saves, and at resume events. One owning tab plus the existing synchronous storage writes avoids overlapping cooperating writes.
- Existing save/import exports remain schema version 2. This fix changes the session protocol, not profile fields or keys. A future schema-version change inherits the same guard.

## Session seam

Add `src/game/save-session.ts` with the following public contract; internal helpers are implementer-owned:

```ts
type SaveSessionStatus = 'starting' | 'active' | 'blocked' | 'conflict' | 'unsupported' | 'unavailable' | 'temporary' | 'suspended' | 'disposed';
type SaveSessionLoad = {status: SaveSessionStatus; profile: Profile | null; loadStatus: LoadStatus | null};
type SaveSessionWrite = {ok: boolean; reason: null | 'inactive' | 'conflict' | 'unavailable' | 'unsupported' | 'write-failed'};
interface SaveSession {
  readonly status: SaveSessionStatus;
  acquire(): Promise<SaveSessionLoad>;
  check(): boolean;
  save(profile: Profile): SaveSessionWrite;
  playTemporarily(): boolean;
  release(): void;
  dispose(): void;
}
```

`createSaveSession({storage, locks, onStatus})` accepts an injectable `Pick<Storage,'getItem'|'setItem'>`, a nullable narrow lock-request adapter equivalent to the request above, and optional `(status: SaveSessionStatus) => void`. Task 1 defines/exports its exact adapter type for production and deterministic tests. No module-global browser reads or lock acquisition. `acquire` is valid initially or after blocked/conflict/unavailable/suspended; active repeated acquisition returns its current load result without another lock. Disposed never reacquires. `check()` returns true only for an active unchanged session or explicit temporary play. `save()` never writes in temporary mode and returns inactive. `playTemporarily()` succeeds only from unavailable or unsupported; it never gains ownership or begins saving later. `release()` moves non-disposed ownership to suspended and invalidates pending acquisition; `dispose()` is terminal. Status transitions notify only when status changes.

Snapshot loading must preserve `loaded/new/recovered/corrupt/unsupported/unavailable` semantics. The session checks both keys for unsupported data before activating. A temporary profile is a safely decoded preview/default, not a promise of durable progress.

## Interface and recovery

Use the existing modal/focus/isolation machinery and painted interface. Add `src/ui/save-session-screen.ts` to generate a compact accessible recovery dialog. No new dashboard or general settings redesign.

| State | Title and explanation | Available recovery |
| --- | --- | --- |
| starting | “Opening your saved game…” | No game input; do not create a modal focus loop if acquisition completes immediately |
| blocked | “Game open in another tab” / “Close the other game tab, then continue here. Your saved progress is protected.” | “CONTINUE HERE”, “EXPORT THIS SESSION” |
| conflict | “Your save changed in another tab” / “This tab is paused to protect your progress. Reload the saved game before continuing.” | “LOAD SAVED PROGRESS”, “EXPORT THIS SESSION” |
| unavailable | “Saving is unavailable” / “This browser cannot safely save this session. You can play temporarily and export a backup.” | “TRY SAVING AGAIN”, “PLAY WITHOUT SAVING”, “EXPORT THIS SESSION” |
| unsupported | “This save needs a newer game version” / “Your existing save is protected. Temporary play will not replace it.” | “PLAY WITHOUT SAVING”, “EXPORT THIS SESSION” |
| temporary | Persistent compact notice: “Temporary play — progress is not saved.” | Existing Settings/export remains available; import replacement disabled |

Recovery dialogs cannot be dismissed with Escape or a close button, and underlying navigation/keys/actions stay inert. Export uses the current in-memory profile so a conflicted tab can rescue its unsaved work. After successful reacquisition, construct `new Game(loaded.profile)`, reset result/modal/manual-pause presentation, refresh army/motion/screens, then enable actions. A pending authoritative victory must show its existing result without a second reward. A denied retry leaves the dialog usable and focused. Never auto-discard conflicted in-memory progress merely because a storage event arrives.

Temporary play is explicit and continues the in-memory game with zero writes to primary/backup; sound/motion/profile preferences also remain temporary. Other-tab blocking does not offer a temporary bypass. Existing separate ambience preference may continue independently, because it cannot replace progression. No automatic promotion from temporary to durable mode. Main skips durable autosave/final-save attempts while temporary, using the persistent notice rather than repeatedly generating failed-save toasts.

Every profile mutation route must honor the session: `action`, direct sound/speed/motion toggles, import replacement, simulation stepping, and persistence lifecycle. Non-game recovery/export actions remain usable. A non-active/non-temporary session prevents `game.step` as well as inputs; changing `state.paused` alone is insufficient for ready/start and direct preference commands. A conflict dialog takes priority over automatic result presentation.

For import, add `restoreBackupWithSave(current: Game, candidate: Profile, commit: (profile: Profile) => boolean)` in `backup.ts`; its Game-replacement transaction commits through the passed writer. Keep existing `restoreBackup(current,candidate,storage?)` as a compatibility wrapper. Main passes the guarded session save callback. Failed/conflicted/unsupported writes leave the current Game and both stored copies unchanged. Successful explicit import refreshes the guard baseline and allows later saves; it is the only intended profile replacement while active.

## Acceptance and limits

Task 1 uses meaningful deterministic storage/lock tests; Task 2 runs the actual built app with two pages in the **same** Playwright browser context, real Web Locks, actual buttons, reload/pagehide, and shared localStorage. Fixtures may seed valid saves before startup and inspect saved data; no production test-only globals or direct Game mutation.

Required browser path: seed enough gems, open A, summon one card through Cards; open B and observe blocked; hide/close B and verify A's primary and backup remain correct; reopen B blocked; close A; Continue Here in B loads A's collection/wallet; change a preference or play, reload, and confirm persistence. Also start both tabs together, asserting one writer; force a foreign storage write from a third same-origin page, verify the old writer blocks before any write and preserves its exportable state; exercise unavailable-lock explicit temporary play with unchanged saved bytes. Include ordinary quota/import/future-version cases at the deterministic seam and important integration paths in the browser script.

Add a dedicated `review:save-sessions` command and required CI step without weakening existing tests/build/portrait/layering gates. Capture a few recovery screenshots and machine-readable checks. Exact game-flow checks matter more than screenshot count. Browser startup/timeouts must fail deterministically, close contexts/server in `finally`, and include page errors in the verdict. Update README save behavior and tested limitations only after evidence exists.

Unavoidable limits: Web Locks coordinate only clients that use this protocol. Already-open older builds or developer-console scripts may ignore it; baseline checks detect their changes, but cannot atomically prevent an uncooperative write between separate localStorage operations. The UI must ask players to close older tabs and reload when such a conflict is observed. Browser storage eviction, user data clearing, and process termination before a save remain reasons to export backups. No local-only change can promise zero possible data loss. Do not imply that optimistic comparison alone is a cross-process transaction.

## Out of scope

Playwright security patch, broad browser-matrix expansion, dependencies, cloud saves, profiles/accounts, server authority, economy/mastery changes, battle balance, atmospheric visuals/audio, and rebuilding the renderer. The separate production audit tracks those matters.
