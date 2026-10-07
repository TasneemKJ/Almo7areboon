import { BACKUP_KEY, SAVE_KEY, decodeSave, defaultProfile, loadProfileWithStatus, saveProfile } from './save.ts';
import type { LoadStatus } from './save.ts';
import type { Profile } from './types.ts';

export type SaveSessionStatus = 'starting' | 'active' | 'blocked' | 'conflict' | 'unsupported' | 'unavailable' | 'temporary' | 'suspended' | 'disposed';
export type SaveSessionLoad = {status: SaveSessionStatus; profile: Profile | null; loadStatus: LoadStatus | null};
export type SaveSessionWrite = {ok: boolean; reason: null | 'inactive' | 'conflict' | 'unavailable' | 'unsupported' | 'write-failed'};
export interface SaveSession {
  readonly status: SaveSessionStatus;
  acquire(): Promise<SaveSessionLoad>;
  check(): boolean;
  save(profile: Profile): SaveSessionWrite;
  playTemporarily(): boolean;
  release(): void;
  dispose(): void;
}
/** Compatible with navigator.locks; the callback's promise owns the lock lifetime. */
export interface SaveSessionLocks {
  request(name: string, options: {mode: 'exclusive'; ifAvailable: true}, callback: (lock: {readonly name: string} | null) => Promise<void>): Promise<unknown>;
}

type Snapshot = {primary: string | null; backup: string | null};
type Acquisition = {generation: number; promise: Promise<SaveSessionLoad>; resolve: (load: SaveSessionLoad) => void};
type SessionStorage = Pick<Storage, 'getItem' | 'setItem'>;

const readSnapshot = (storage: SessionStorage): Snapshot => ({primary: storage.getItem(SAVE_KEY), backup: storage.getItem(BACKUP_KEY)});

function fromSnapshot(snapshot: Snapshot) {
  const load = loadProfileWithStatus({getItem: key => key === SAVE_KEY ? snapshot.primary : snapshot.backup});
  // The existing loader prefers a valid primary. Ownership must also protect a newer backup.
  if ([snapshot.primary, snapshot.backup].some(raw => raw !== null && decodeSave(raw).problem === 'unsupported')) {
    return {...load, status: 'unsupported' as const};
  }
  return load;
}

/** A read-only look at what is stored, for sessions that cannot own the save. */
function unavailablePreview(storage: SessionStorage): SaveSessionLoad {
  try {
    const preview = fromSnapshot(readSnapshot(storage));
    return {status: 'unavailable', profile: preview.profile, loadStatus: preview.status};
  } catch {
    return {status: 'unavailable', profile: defaultProfile(), loadStatus: 'unavailable'};
  }
}

/**
 * Storage view for saveProfile: reads the checked snapshot and tracks only successful writes.
 * A primary failure leaves both bytes unchanged; a backup failure keeps its previous baseline
 * after an already durable primary commit.
 */
function trackedDestination(storage: SessionStorage, baseline: Snapshot) {
  return {
    getItem: (key: string) => key === SAVE_KEY ? baseline.primary : baseline.backup,
    setItem(key: string, value: string) {
      storage.setItem(key, value);
      if (key === SAVE_KEY) baseline.primary = value;
      else if (key === BACKUP_KEY) baseline.backup = value;
    },
  };
}

/** One tab's claim on the save: it owns the writer lock while active and notices foreign writes before saving. */
class WriterSession implements SaveSession {
  private current: SaveSessionStatus = 'starting';
  private loaded: SaveSessionLoad = {status: 'starting', profile: null, loadStatus: null};
  private baseline: Snapshot | null = null;
  private generation = 0;
  private pending: Acquisition | null = null;
  private unlock: (() => void) | null = null;

  private readonly storage: SessionStorage;
  private readonly locks: SaveSessionLocks | null;
  private readonly onStatus: ((status: SaveSessionStatus) => void) | undefined;

  constructor(storage: SessionStorage, locks: SaveSessionLocks | null, onStatus?: (status: SaveSessionStatus) => void) {
    this.storage = storage; this.locks = locks; this.onStatus = onStatus;
  }

  get status() { return this.current; }

  private result(): SaveSessionLoad { return {...this.loaded, status: this.current}; }

  private transition(next: SaveSessionStatus) {
    if (this.current === next) return;
    this.current = next;
    this.onStatus?.(next);
  }

  private deactivate(next: SaveSessionStatus) {
    this.generation++;
    const attempt = this.pending, releaseLock = this.unlock;
    this.pending = null; this.unlock = null; this.baseline = null;
    releaseLock?.();
    this.transition(next);
    attempt?.resolve(this.result());
  }

  private isCurrent(attempt: Acquisition) { return attempt.generation === this.generation && this.current !== 'disposed'; }

  private finish(attempt: Acquisition, next: SaveSessionStatus) {
    if (!this.isCurrent(attempt)) return;
    this.pending = null;
    this.transition(next);
    attempt.resolve(this.result());
  }

  private inactiveReason(): SaveSessionWrite['reason'] {
    const status = this.current;
    return status === 'conflict' || status === 'unavailable' || status === 'unsupported' ? status : 'inactive';
  }

  acquire(): Promise<SaveSessionLoad> {
    if (this.pending) return this.pending.promise;
    if (this.current === 'active' || this.current === 'temporary' || this.current === 'unsupported' || this.current === 'disposed') return Promise.resolve(this.result());
    let resolve!: Acquisition['resolve'];
    const promise = new Promise<SaveSessionLoad>(complete => { resolve = complete; });
    const attempt: Acquisition = {generation: ++this.generation, promise, resolve};
    this.pending = attempt;
    this.loaded = {status: 'starting', profile: null, loadStatus: null};
    this.transition('starting');
    const failedRequest = () => {
      if (!this.isCurrent(attempt)) return;
      this.loaded = unavailablePreview(this.storage);
      this.deactivate('unavailable');
      attempt.resolve(this.result());
    };
    if (!this.isCurrent(attempt)) return promise;
    if (!this.locks) { failedRequest(); return promise; }
    try {
      void this.locks.request('almo7areboon.save.v1.writer', {mode: 'exclusive', ifAvailable: true}, lock => this.holdWriterLock(attempt, lock)).catch(failedRequest);
    } catch { failedRequest(); }
    return promise;
  }

  /** The lock callback: loads the stored save, then keeps the lock until this session is deactivated. */
  private async holdWriterLock(attempt: Acquisition, lock: {readonly name: string} | null): Promise<void> {
    // A callback delivered after pagehide/disposal must return without holding ownership.
    if (!this.isCurrent(attempt)) return;
    if (!lock) { this.finish(attempt, 'blocked'); return; }
    let snapshot: Snapshot;
    try { snapshot = readSnapshot(this.storage); }
    catch {
      this.loaded = {status: 'unavailable', profile: defaultProfile(), loadStatus: 'unavailable'};
      this.finish(attempt, 'unavailable'); return;
    }
    if (!this.isCurrent(attempt)) return;
    const load = fromSnapshot(snapshot);
    this.loaded = {status: load.status === 'unsupported' ? 'unsupported' : 'active', profile: load.profile, loadStatus: load.status};
    if (load.status === 'unsupported') { this.finish(attempt, 'unsupported'); return; }
    this.baseline = snapshot;
    const lifetime = new Promise<void>(release => { this.unlock = release; });
    this.finish(attempt, 'active');
    await lifetime;
  }

  check(): boolean {
    if (this.current === 'temporary') return true;
    if (this.current !== 'active' || !this.baseline) return false;
    let snapshot: Snapshot;
    try { snapshot = readSnapshot(this.storage); }
    catch { this.deactivate('unavailable'); return false; }
    if (snapshot.primary !== this.baseline.primary || snapshot.backup !== this.baseline.backup) {
      this.deactivate('conflict'); return false;
    }
    return true;
  }

  save(profile: Profile): SaveSessionWrite {
    if (this.current !== 'active' || !this.check()) return {ok: false, reason: this.inactiveReason()};
    return saveProfile(profile, trackedDestination(this.storage, this.baseline!)) ? {ok: true, reason: null} : {ok: false, reason: 'write-failed'};
  }

  playTemporarily(): boolean {
    if (this.current !== 'unavailable' && this.current !== 'unsupported') return false;
    this.deactivate('temporary'); return true;
  }

  release(): void {
    if (this.current !== 'disposed' && this.current !== 'temporary') this.deactivate('suspended');
  }

  dispose(): void { if (this.current !== 'disposed') this.deactivate('disposed'); }
}

export function createSaveSession({storage, locks, onStatus}: {
  storage: SessionStorage;
  locks: SaveSessionLocks | null;
  onStatus?: (status: SaveSessionStatus) => void;
}): SaveSession {
  return new WriterSession(storage, locks, onStatus);
}
