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

export function createSaveSession({storage, locks, onStatus}: {
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  locks: SaveSessionLocks | null;
  onStatus?: (status: SaveSessionStatus) => void;
}): SaveSession {
  let status: SaveSessionStatus = 'starting';
  let loaded: SaveSessionLoad = {status, profile: null, loadStatus: null};
  let baseline: Snapshot | null = null;
  let generation = 0;
  let pending: Acquisition | null = null;
  let unlock: (() => void) | null = null;
  const result = (): SaveSessionLoad => ({...loaded, status});
  const transition = (next: SaveSessionStatus) => {
    if (status === next) return;
    status = next;
    onStatus?.(next);
  };
  const readSnapshot = (): Snapshot => ({primary: storage.getItem(SAVE_KEY), backup: storage.getItem(BACKUP_KEY)});
  const fromSnapshot = (snapshot: Snapshot) => {
    const load = loadProfileWithStatus({getItem: key => key === SAVE_KEY ? snapshot.primary : snapshot.backup});
    // The existing loader prefers a valid primary. Ownership must also protect a newer backup.
    if ([snapshot.primary, snapshot.backup].some(raw => raw !== null && decodeSave(raw).problem === 'unsupported')) {
      return {...load, status: 'unsupported' as const};
    }
    return load;
  };
  const unavailablePreview = () => {
    try {
      const preview = fromSnapshot(readSnapshot());
      loaded = {status: 'unavailable', profile: preview.profile, loadStatus: preview.status};
    } catch {
      loaded = {status: 'unavailable', profile: defaultProfile(), loadStatus: 'unavailable'};
    }
  };
  const deactivate = (next: SaveSessionStatus) => {
    generation++;
    const attempt = pending, releaseLock = unlock;
    pending = null; unlock = null; baseline = null;
    releaseLock?.();
    transition(next);
    attempt?.resolve(result());
  };
  const current = (attempt: Acquisition) => attempt.generation === generation && status !== 'disposed';
  const finish = (attempt: Acquisition, next: SaveSessionStatus) => {
    if (!current(attempt)) return;
    pending = null;
    transition(next);
    attempt.resolve(result());
  };
  const inactiveReason = (): SaveSessionWrite['reason'] =>
    status === 'conflict' || status === 'unavailable' || status === 'unsupported' ? status : 'inactive';
  const check = () => {
    if (status === 'temporary') return true;
    if (status !== 'active' || !baseline) return false;
    let snapshot: Snapshot;
    try { snapshot = readSnapshot(); }
    catch { deactivate('unavailable'); return false; }
    if (snapshot.primary !== baseline.primary || snapshot.backup !== baseline.backup) {
      deactivate('conflict'); return false;
    }
    return true;
  };

  return {
    get status() { return status; },
    acquire() {
      if (pending) return pending.promise;
      if (status === 'active' || status === 'temporary' || status === 'unsupported' || status === 'disposed') return Promise.resolve(result());
      let resolve!: Acquisition['resolve'];
      const promise = new Promise<SaveSessionLoad>(complete => { resolve = complete; });
      const attempt: Acquisition = {generation: ++generation, promise, resolve};
      pending = attempt;
      loaded = {status: 'starting', profile: null, loadStatus: null};
      transition('starting');
      const failedRequest = () => {
        if (!current(attempt)) return;
        unavailablePreview();
        deactivate('unavailable');
        attempt.resolve(result());
      };
      if (!current(attempt)) return promise;
      if (!locks) { failedRequest(); return promise; }
      try {
        void locks.request('almo7areboon.save.v1.writer', {mode: 'exclusive', ifAvailable: true}, async lock => {
          // A callback delivered after pagehide/disposal must return without holding ownership.
          if (!current(attempt)) return;
          if (!lock) { finish(attempt, 'blocked'); return; }
          let snapshot: Snapshot;
          try { snapshot = readSnapshot(); }
          catch {
            loaded = {status: 'unavailable', profile: defaultProfile(), loadStatus: 'unavailable'};
            finish(attempt, 'unavailable'); return;
          }
          if (!current(attempt)) return;
          const load = fromSnapshot(snapshot);
          loaded = {status: load.status === 'unsupported' ? 'unsupported' : 'active', profile: load.profile, loadStatus: load.status};
          if (load.status === 'unsupported') { finish(attempt, 'unsupported'); return; }
          baseline = snapshot;
          const lifetime = new Promise<void>(release => { unlock = release; });
          finish(attempt, 'active');
          await lifetime;
        }).catch(failedRequest);
      } catch { failedRequest(); }
      return promise;
    },
    check,
    save(profile) {
      if (status !== 'active' || !check()) return {ok: false, reason: inactiveReason()};
      // Reuse the checked snapshot for saveProfile's validation/backup selection. Track
      // only successful writes: primary failure leaves both bytes unchanged; backup
      // failure keeps its previous baseline after an already durable primary commit.
      const previous = baseline!;
      const destination = {
        getItem: (key: string) => key === SAVE_KEY ? previous.primary : previous.backup,
        setItem(key: string, value: string) {
          storage.setItem(key, value);
          if (key === SAVE_KEY) previous.primary = value;
          else if (key === BACKUP_KEY) previous.backup = value;
        },
      };
      return saveProfile(profile, destination) ? {ok: true, reason: null} : {ok: false, reason: 'write-failed'};
    },
    playTemporarily() {
      if (status !== 'unavailable' && status !== 'unsupported') return false;
      deactivate('temporary'); return true;
    },
    release() {
      if (status !== 'disposed' && status !== 'temporary') deactivate('suspended');
    },
    dispose() { if (status !== 'disposed') deactivate('disposed'); },
  };
}
