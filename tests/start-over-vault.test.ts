// Start over sticks in the iPhone app (owner brief, 2026-11-15). TasKit keeps a file copy of every localStorage key
// with the prefix `almo7areboon` (TasSaveVault.swift): before each copy it runs the page's flush
// (`window.__almoFlushSave()`, TasGameConfig.flushSaveScript), it never writes an empty set, and on the next launch it
// puts the copy back only when NO key with the prefix exists (TasBootScripts.swift `restore`). Start over must not be
// undone by that copy: here the real start-over path (startOverProfile → restoreBackupWithSave through the guarded
// save session) and the real flush hook run against a model of the vault, and every relaunch loads the fresh profile.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave, saveProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { createSaveSession, type SaveSession, type SaveSessionLocks } from '../src/game/save-session.ts';
import { restoreBackupWithSave } from '../src/game/backup.ts';
import { startOverProfile } from '../src/game/reset.ts';
import { installSaveFlush } from '../src/ui/app-bridge.ts';
import { LANGUAGE_KEY } from '../src/game/locale.ts';
import { AUDIO_MIX_KEY } from '../src/ui/audio-preferences.ts';
import type { Profile } from '../src/game/types.ts';

const PREFIX = 'almo7areboon'; // Almo7areboonConfig.swift storagePrefix

/** localStorage as WebKit has it: ordered keys, length and key(i), which the restore script walks. */
class PageStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  /** iOS clearing the web view's data when the phone runs short of space. */
  wipe() { this.values.clear(); }
}

/** TasSaveVault.save: mirrors the prefixed keys exactly, but never writes an empty set. */
function vaultCopy(vault: Map<string, string>, page: PageStorage): void {
  (globalThis as unknown as { __almoFlushSave?: () => void }).__almoFlushSave?.(); // flushSaveScript, before each copy
  const keep = [...page.values].filter(([key]) => key.startsWith(PREFIX));
  if (!keep.length) return;
  vault.clear();
  for (const [key, value] of keep) vault.set(key, value);
}

/** TasBootScripts.restore, as the app injects it at document start. The engine's own script when tas-engine is beside this repo. */
const engineBoot = new URL('../../tas-engine/ios/Sources/TasKit/TasBootScripts.swift', import.meta.url);
const engineRestore = existsSync(engineBoot) ? readFileSync(engineBoot, 'utf8').match(/func restore\([\s\S]*?return """\n([\s\S]*?)\n\s*"""/)?.[1] ?? null : null;
function vaultRestore(vault: Map<string, string>, page: PageStorage): void {
  if (!vault.size) return;
  const saved = Object.fromEntries(vault);
  if (engineRestore) {
    const script = engineRestore.replace('\\(Self.json(saved))', JSON.stringify(saved)).replace('\\(prefix)', JSON.stringify(PREFIX));
    runInNewContext(script, { localStorage: page });
    return;
  }
  for (let i = 0; i < page.length; i++) if (page.key(i)?.startsWith(PREFIX)) return;
  for (const [key, value] of Object.entries(saved)) if (key.startsWith(PREFIX)) page.setItem(key, value);
}

const locks: SaveSessionLocks = { request: (name, _options, callback) => Promise.resolve(callback({ name })) };

/** One launch of the page: the guarded save session owns the save, and the app's flush hook writes through it. */
async function launch(page: PageStorage): Promise<{ session: SaveSession; game: Game; persist: () => boolean; startOver: () => boolean }> {
  const session = createSaveSession({ storage: page, locks });
  const load = await session.acquire();
  assert.equal(load.status, 'active');
  const launched = { session, game: new Game(load.profile!), persist: () => false, startOver: () => false };
  // The lifecycle's persist (src/app/lifecycle.ts): the live profile with lastSeen, through the session.
  launched.persist = () => session.save({ ...launched.game.profile, lastSeen: 1_800_000_000_000 }).ok;
  // The Start over confirmation (src/app/listeners.ts 'confirm-reset').
  launched.startOver = () => {
    const restored = restoreBackupWithSave(launched.game, startOverProfile(launched.game.profile), profile => session.save(profile).ok);
    if (restored.ok) launched.game = restored.game;
    return restored.ok;
  };
  installSaveFlush(() => launched.persist()); // src/app/store-flow.ts
  return launched;
}

function oldProgress(): Profile {
  const p = defaultProfile();
  Object.assign(p, { timeline: 3, age: 3, enemyAge: 3, furthestBattle: 3, coins: 9000, gems: 777, kills: 90, wins: 12, foodLevel: 7, sound: false, speed: 2 });
  return p;
}
const isOld = (raw: string | null | undefined) => { const p = raw ? decodeSave(raw).profile : null; return !!p && (p.kills === 90 || p.gems === 777 || p.timeline === 3); };
const assertFresh = (p: Profile, why: string) => {
  assert.deepEqual([p.timeline, p.age, p.furthestBattle, p.kills, p.wins, p.gems, p.coins], [1, 0, 0, 0, 0, defaultProfile().gems, defaultProfile().coins], why);
  assert.deepEqual([p.sound, p.speed], [false, 2], 'preferences stay through Start over');
};

/** A phone that has played: the old progress saved, the language and the mix chosen, and the vault holding all of it. */
async function playedPhone() {
  const page = new PageStorage(), vault = new Map<string, string>();
  assert.ok(saveProfile(oldProgress(), page));
  page.setItem(LANGUAGE_KEY, 'ar');
  page.setItem(AUDIO_MIX_KEY, JSON.stringify({ version: 1, effects: 80, atmosphere: 60 }));
  page.setItem('unrelated.site.key', 'x'); // another origin's key never enters the vault
  const first = await launch(page);
  vaultCopy(vault, page);
  assert.ok(isOld(vault.get(SAVE_KEY)), 'the vault holds the old progress before Start over');
  assert.ok(!vault.has('unrelated.site.key'));
  return { page, vault, first };
}

test('start over → flush → vault copy → relaunch: the fresh profile, and the vault no longer holds the old one', async () => {
  const { page, vault, first } = await playedPhone();
  assert.equal(first.startOver(), true);
  vaultCopy(vault, page); // flush runs first, then the copy
  first.session.release();
  for (const [key, value] of vault) assert.ok(!isOld(value), `${key} in the vault still decodes to the old progress`);
  assert.ok(isOld(page.getItem(BACKUP_KEY)) === false, 'the flush after Start over moved the backup to the fresh save too');
  vaultRestore(vault, page);
  const next = await launch(page);
  assertFresh(next.game.profile, 'a normal relaunch after Start over');
});

test('start over, then the app is killed before the next copy: the old vault is not put back while the page has its keys', async () => {
  const { page, vault, first } = await playedPhone();
  assert.equal(first.startOver(), true);
  first.session.release(); // no flush, no copy: the vault still has the old progress
  assert.ok(isOld(vault.get(SAVE_KEY)));
  vaultRestore(vault, page);
  const next = await launch(page);
  assertFresh(next.game.profile, 'the restore rule does not fire: the save key itself is always left in place');
  vaultCopy(vault, page); // the first copy after that launch heals the stale vault
  for (const [key, value] of vault) assert.ok(!isOld(value), `${key} in the vault still decodes to the old progress`);
});

test('start over → flush → copy → iOS clears the web data → restore → reload: the fresh profile comes back, not the old one', async () => {
  const { page, vault, first } = await playedPhone();
  assert.equal(first.startOver(), true);
  vaultCopy(vault, page);
  first.session.release();
  page.wipe();
  vaultRestore(vault, page);
  assert.ok(page.getItem(SAVE_KEY), 'the vault put the save back');
  const next = await launch(page);
  assertFresh(next.game.profile, 'the vault restored the fresh save');
  assert.equal(page.getItem(LANGUAGE_KEY), 'ar', 'the language came back with it');
});

test('the vault never mirrors an empty page, so a wipe before the first copy after Start over cannot erase it', async () => {
  const { page, vault, first } = await playedPhone();
  assert.equal(first.startOver(), true);
  vaultCopy(vault, page);
  first.session.release();
  page.wipe();
  installSaveFlush(() => {}); // a page that has not loaded yet writes nothing
  vaultCopy(vault, page);
  assert.ok(vault.size > 0 && vault.has(SAVE_KEY));
  vaultRestore(vault, page);
  assertFresh((await launch(page)).game.profile, 'the copy taken after Start over survives an empty read');
});

test('the model is not vacuous: a reset that removed every prefixed key would be undone by the vault', async () => {
  const { page, vault, first } = await playedPhone();
  first.session.release();
  for (const key of [...page.values.keys()]) if (key.startsWith(PREFIX)) page.values.delete(key); // what Almo must never do
  vaultRestore(vault, page);
  assert.ok(isOld(page.getItem(SAVE_KEY)), 'the old progress came back: this is the failure the rule above guards against');
});

test('Almo never removes a storage key, so Start over always leaves the save key (and the vault rule never fires)', () => {
  const src = new URL('../src/', import.meta.url).pathname;
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : /\.(ts|js)$/.test(entry.name) ? [join(dir, entry.name)] : []);
  for (const file of files(src)) {
    const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.doesNotMatch(code, /\bremoveItem\s*\(|(localStorage|storage\(\))\s*\.\s*clear\s*\(/, `${file} removes storage keys; Start over must overwrite the save, never delete it`);
  }
  // Start over writes through the same guarded writer as every save; a refused write keeps the current game.
  const listeners = readFileSync(new URL('../src/app/listeners.ts', import.meta.url), 'utf8');
  assert.match(listeners, /restoreBackupWithSave\(ports\.sessionState\.game,startOverProfile\(ports\.sessionState\.game\.profile\),profile=>\{syncWeekly\(profile,weekId\(localDay\(\)\)\);return ports\.sessionState\.session\.save\(profile\)\.ok;\}\)/);
});

test('the engine restore script is the one modelled here', { skip: !engineRestore && 'tas-engine is not checked out beside this repo' }, () => {
  assert.match(engineRestore!, /if\(k&&k\.indexOf\(p\)===0\)return;/, 'any prefixed key stops the restore');
});
