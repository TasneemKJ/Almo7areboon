import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';

import { createSaveSession, type SaveSessionLocks } from '../src/game/save-session.ts';
import type { Profile } from '../src/game/types.ts';

const create = createSaveSession;

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  bytes() { return [this.getItem(SAVE_KEY), this.getItem(BACKUP_KEY)]; }
}

// Models Web Locks' exclusive ifAvailable arbitration and callback lifetime.
class ExclusiveLocks implements SaveSessionLocks {
  held = false;
  request(name: string, options: {mode: 'exclusive'; ifAvailable: true}, callback: (lock: {name: string} | null) => Promise<void>): Promise<unknown> {
    assert.equal(name, 'almo7areboon.save.v1.writer');
    assert.deepEqual(options, {mode: 'exclusive', ifAvailable: true});
    const lock = this.held ? null : {name};
    if (lock) this.held = true;
    return Promise.resolve().then(() => callback(lock)).finally(() => { if (lock) this.held = false; });
  }
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

test('one writer protects a summon from stale-tab save and takeover loads its current progress', async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks();
  const a = create({storage, locks}), b = create({storage, locks});
  try {
    const loadedA = await a.acquire();
    assert.equal(loadedA.status, 'active'); assert.equal(loadedA.loadStatus, 'new'); assert.ok(loadedA.profile);
    const stale = new Game(defaultProfile());
    assert.equal((await b.acquire()).status, 'blocked');
    const game = new Game(loadedA.profile);
    assert.equal(game.dispatch({type: 'summon', count: 1}), true);
    assert.deepEqual(a.save(game.profile), {ok: true, reason: null});
    const saved = storage.bytes();
    assert.deepEqual(b.save(stale.profile), {ok: false, reason: 'inactive'});
    assert.deepEqual(storage.bytes(), saved);
    assert.equal(b.check(), false);
    a.release(); await flush();
    const loadedB = await b.acquire();
    assert.equal(loadedB.status, 'active'); assert.equal(loadedB.loadStatus, 'loaded'); assert.ok(loadedB.profile);
    assert.equal(loadedB.profile.gems, 0);
    assert.equal(loadedB.profile.cards.reduce((n: number, count: number) => n + count, 0), 1);
    assert.deepEqual(loadedB.profile, game.profile);
  } finally { a.dispose(); b.dispose(); await flush(); }
});

test('simultaneous acquisition permits exactly one active session', async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks();
  const a = create({storage, locks}), b = create({storage, locks});
  try {
    const results = await Promise.all([a.acquire(), b.acquire()]);
    assert.deepEqual(results.map(result => result.status).sort(), ['active', 'blocked']);
    assert.deepEqual(results.map(result => result.profile === null).sort(), [false, true]);
  } finally { a.dispose(); b.dispose(); await flush(); }
});

class DelayedLocks extends ExclusiveLocks {
  paused = true;
  deliveries: Array<() => void> = [];
  override request(name: string, options: {mode: 'exclusive'; ifAvailable: true}, callback: (lock: {name: string} | null) => Promise<void>) {
    return super.request(name, options, async lock => {
      if (this.paused) await new Promise<void>(resolve => { this.deliveries.push(resolve); });
      await callback(lock);
    });
  }
  deliver() { this.paused = false; this.deliveries.shift()?.(); }
}
class FaultStorage extends MemoryStorage {
  failRead: string | null = null;
  failWrite: string | null = null;
  override getItem(key: string) { if (key === this.failRead) throw Error('read denied'); return super.getItem(key); }
  override setItem(key: string, value: string) { if (key === this.failWrite) throw Error('quota'); super.setItem(key, value); }
}
function seed(storage: MemoryStorage, coins = 10) {
  const profile = defaultProfile(); profile.coins = coins;
  storage.setItem(SAVE_KEY, JSON.stringify(profile)); storage.setItem(BACKUP_KEY, JSON.stringify(profile));
  return profile;
}

for (const end of ['release', 'dispose'] as const) test(`late grant after ${end} cannot reactivate or retain ownership`, async () => {
  const storage = new MemoryStorage(), locks = new DelayedLocks();
  const statuses: string[] = [], session = create({storage, locks, onStatus: (status: string) => statuses.push(status)});
  const acquiring = session.acquire(); await flush(); session[end]();
  const expected = end === 'release' ? 'suspended' : 'disposed';
  assert.equal(session.status, expected);
  locks.deliver(); await flush();
  assert.equal((await acquiring).status, expected);
  assert.equal(session.status, expected);
  assert.equal(statuses.includes('active'), false);
  const peer = create({storage, locks});
  try { assert.equal((await peer.acquire()).status, 'active'); }
  finally { session.dispose(); peer.dispose(); await flush(); }
});

test('duplicate pending acquisition is reused and release settles it before a lock callback', async () => {
  const storage = new MemoryStorage(), locks = new DelayedLocks(), session = create({storage, locks});
  const first = session.acquire(), duplicate = session.acquire();
  assert.equal(first, duplicate);
  session.release();
  assert.equal((await first).status, 'suspended');
  locks.deliver(); await flush(); session.dispose();
});

test('repeat release and acquire reloads stored progress, while dispose is terminal', async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks(), statuses: string[] = [];
  const session = create({storage, locks, onStatus: (status: string) => statuses.push(status)});
  seed(storage, 11);
  const initial = await session.acquire(); assert.ok(initial.profile); assert.equal(initial.profile.coins, 11);
  assert.equal((await session.acquire()).status, 'active');
  for (const coins of [22, 33]) {
    session.release(); session.release(); await flush(); seed(storage, coins);
    const loaded = await session.acquire(); assert.ok(loaded.profile); assert.equal(loaded.profile.coins, coins);
  }
  session.dispose(); session.dispose(); session.release();
  assert.equal((await session.acquire()).status, 'disposed');
  assert.deepEqual(session.save(defaultProfile()), {ok: false, reason: 'inactive'});
  assert.equal(session.check(), false); assert.equal(session.playTemporarily(), false);
  assert.deepEqual(statuses, ['active', 'suspended', 'starting', 'active', 'suspended', 'starting', 'active', 'disposed']);
  await flush();
});

for (const failure of ['missing', 'rejected', 'thrown'] as const) test(`${failure} locks fail closed with an explicit non-durable preview`, async () => {
  const storage = new MemoryStorage(); seed(storage, 17);
  const before = storage.bytes();
  const locks = failure === 'missing' ? null : {request() { if (failure === 'thrown') throw Error('denied'); return Promise.reject(Error('denied')); }};
  const session = create({storage, locks});
  const loaded = await session.acquire();
  assert.equal(loaded.status, 'unavailable'); assert.ok(loaded.profile); assert.equal(loaded.profile.coins, 17);
  assert.equal(session.check(), false);
  assert.deepEqual(session.save(defaultProfile()), {ok: false, reason: 'unavailable'});
  assert.equal(session.playTemporarily(), true); assert.equal(session.status, 'temporary');
  assert.equal(session.check(), true);
  assert.deepEqual(session.save(defaultProfile()), {ok: false, reason: 'inactive'});
  session.release(); assert.equal(session.status, 'temporary');
  assert.equal((await session.acquire()).status, 'temporary');
  assert.equal(session.playTemporarily(), false);
  assert.deepEqual(storage.bytes(), before); session.dispose();
});

test('temporary play is unavailable to a blocked or active tab', async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks(), a = create({storage, locks}), b = create({storage, locks});
  try {
    await a.acquire(); await b.acquire();
    assert.equal(a.playTemporarily(), false); assert.equal(b.playTemporarily(), false);
    assert.equal(a.status, 'active'); assert.equal(b.status, 'blocked');
  } finally { a.dispose(); b.dispose(); await flush(); }
});

for (const key of [SAVE_KEY, BACKUP_KEY]) test(`future schema in ${key} protects both stored copies`, async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks(); seed(storage);
  storage.setItem(key, JSON.stringify({...defaultProfile(), version: 99}));
  const before = storage.bytes(), session = create({storage, locks});
  const loaded = await session.acquire();
  assert.equal(loaded.status, 'unsupported'); assert.equal(loaded.loadStatus, 'unsupported');
  assert.deepEqual(session.save(defaultProfile()), {ok: false, reason: 'unsupported'});
  assert.equal(session.check(), false); assert.equal(session.playTemporarily(), true);
  assert.equal(session.check(), true); assert.deepEqual(session.save(defaultProfile()), {ok: false, reason: 'inactive'});
  assert.deepEqual(storage.bytes(), before); session.dispose(); await flush();
});

for (const key of [SAVE_KEY, BACKUP_KEY]) test(`unreadable ${key} never becomes an active empty save`, async () => {
  const storage = new FaultStorage(), locks = new ExclusiveLocks(); seed(storage);
  const before = storage.bytes(); storage.failRead = key;
  const session = create({storage, locks});
  const loaded = await session.acquire();
  assert.equal(loaded.status, 'unavailable'); assert.equal(loaded.loadStatus, 'unavailable');
  assert.deepEqual(session.save(defaultProfile()), {ok: false, reason: 'unavailable'});
  storage.failRead = null; assert.deepEqual(storage.bytes(), before);
  await flush(); assert.equal((await session.acquire()).status, 'active'); session.dispose(); await flush();
});

test('corrupt primary recovers its backup while owning without changing either stored string', async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks(); seed(storage, 51); storage.setItem(SAVE_KEY, 'broken');
  const before = storage.bytes(), session = create({storage, locks});
  try {
    const loaded = await session.acquire();
    assert.equal(loaded.status, 'active'); assert.equal(loaded.loadStatus, 'recovered'); assert.ok(loaded.profile); assert.equal(loaded.profile.coins, 51);
    assert.deepEqual(storage.bytes(), before); assert.equal(session.check(), true);
  } finally { session.dispose(); await flush(); }
});

test('a snapshot is read under ownership once and never silently refreshed before becoming active', async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks(); seed(storage, 91);
  const primary = storage.getItem(SAVE_KEY)!;
  const snapshotStorage = {
    getItem(key: string) {
      const value = storage.getItem(key);
      if (key === SAVE_KEY) storage.setItem(SAVE_KEY, JSON.stringify({...defaultProfile(), coins: 92}));
      return value;
    },
    setItem: storage.setItem.bind(storage),
  };
  const session = create({storage: snapshotStorage, locks});
  try {
    const loaded = await session.acquire();
    assert.ok(loaded.profile); assert.equal(loaded.profile.coins, 91);
    assert.equal(session.check(), false); assert.equal(session.status, 'conflict');
    assert.notEqual(storage.getItem(SAVE_KEY), primary);
  } finally { session.dispose(); await flush(); }
});

for (const key of [SAVE_KEY, BACKUP_KEY]) for (const change of ['replace', 'remove', 'future'] as const) test(`foreign ${change} of ${key} blocks writes and releases ownership`, async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks(); seed(storage, 3);
  const session = create({storage, locks}); await session.acquire();
  if (change === 'remove') storage.values.delete(key);
  else storage.setItem(key, JSON.stringify({...defaultProfile(), coins: 4, version: change === 'future' ? 99 : 2}));
  const foreign = storage.bytes();
  assert.deepEqual(session.save(defaultProfile()), {ok: false, reason: 'conflict'});
  assert.equal(session.status, 'conflict'); assert.equal(session.check(), false);
  assert.deepEqual(storage.bytes(), foreign);
  await flush();
  const peer = create({storage, locks});
  assert.equal((await peer.acquire()).status, change === 'future' ? 'unsupported' : 'active');
  session.dispose(); peer.dispose(); await flush();
});

for (const key of [SAVE_KEY, BACKUP_KEY]) test(`read failure while active in ${key} is unavailable rather than a write failure`, async () => {
  const storage = new FaultStorage(), locks = new ExclusiveLocks(); seed(storage);
  const before = storage.bytes(), session = create({storage, locks}); await session.acquire();
  storage.failRead = key;
  assert.deepEqual(session.save(defaultProfile()), {ok: false, reason: 'unavailable'});
  assert.equal(session.status, 'unavailable'); assert.equal(session.check(), false);
  storage.failRead = null; assert.deepEqual(storage.bytes(), before); await flush();
  const peer = create({storage, locks}); assert.equal((await peer.acquire()).status, 'active');
  session.dispose(); peer.dispose(); await flush();
});

test('quota-rejected primary preserves both strings and the active owner can retry', async () => {
  const storage = new FaultStorage(), locks = new ExclusiveLocks(); seed(storage, 60);
  const before = storage.bytes(), session = create({storage, locks}); await session.acquire();
  const candidate = defaultProfile(); candidate.coins = 70; storage.failWrite = SAVE_KEY;
  assert.deepEqual(session.save(candidate), {ok: false, reason: 'write-failed'});
  assert.equal(session.status, 'active'); assert.deepEqual(storage.bytes(), before); assert.equal(session.check(), true);
  storage.failWrite = null;
  assert.deepEqual(session.save(candidate), {ok: true, reason: null}); assert.equal(session.check(), true);
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)!).coins, 70);
  assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)!).coins, 60);
  session.dispose(); await flush();
});

test('failed backup after committed primary retains its old baseline and permits a later save', async () => {
  const storage = new FaultStorage(), locks = new ExclusiveLocks(); seed(storage, 80);
  const oldBackup = storage.getItem(BACKUP_KEY), session = create({storage, locks}); await session.acquire();
  const candidate = defaultProfile(); candidate.coins = 90; storage.failWrite = BACKUP_KEY;
  assert.deepEqual(session.save(candidate), {ok: true, reason: null});
  assert.equal(storage.getItem(BACKUP_KEY), oldBackup); assert.equal(session.check(), true);
  storage.failWrite = null; candidate.coins = 100;
  assert.deepEqual(session.save(candidate), {ok: true, reason: null}); assert.equal(session.check(), true);
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)!).coins, 100);
  assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)!).coins, 90);
  session.dispose(); await flush();
});

test('invalid candidate never changes the baseline or either stored copy', async () => {
  const storage = new MemoryStorage(), locks = new ExclusiveLocks(); seed(storage);
  const before = storage.bytes(), session = create({storage, locks}); await session.acquire();
  assert.deepEqual(session.save({...defaultProfile(), version: 99} as unknown as Profile), {ok: false, reason: 'write-failed'});
  assert.equal(session.status, 'active'); assert.equal(session.check(), true); assert.deepEqual(storage.bytes(), before);
  session.dispose(); await flush();
});
