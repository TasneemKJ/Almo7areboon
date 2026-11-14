import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAppBridge, freeChapterFor, journeyHeld, pastFreeArc } from '../src/ui/app-bridge.ts';
import { createStoreFlow } from '../src/app/store-flow.ts';
import { exportBackup, importBackup, restoreBackupWithSave } from '../src/game/backup.ts';
import { defaultProfile, saveProfile, SAVE_KEY } from '../src/game/save.ts';
import { Game } from '../src/game/simulation.ts';
import type { Action, Profile } from '../src/game/types.ts';

// Audit for 1.1: an imported save past the free chapters let a player without Full Journey fight paid chapters,
// because only "next battle", "choose battle" and "evolve" asked the store; starting the battle already selected did not.

/** A backup file as a player would paste or pick it, with whatever extra fields the file claims. */
function backupOf(progress: Partial<Profile>, extra: Record<string, unknown> = {}): string {
  const file = JSON.parse(exportBackup({ ...defaultProfile(), wins: 9, ...progress })) as { profile: Record<string, unknown> };
  Object.assign(file.profile, extra);
  return JSON.stringify(file);
}

/** The app as the import sees it: a real bridge on a fake TasKit window, the real store flow, a real Game and storage. */
function app(owned: Record<string, boolean> = {}, inApp = true) {
  const win = inApp ? { webkit: { messageHandlers: { almo7areboon: { postMessage: () => {} } } }, __almoAppBoot: { owned, prices: { fullGame: '$4.99' } } } : {};
  const bridge = createAppBridge(win);
  const stored = new Map<string, string>();
  const storage = { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); } };
  const sessionState = { game: new Game(defaultProfile()) };
  const navState = { modal: null as string | null, evolutionFromResult: false };
  const last = { html: '' };
  const disposers: (() => void)[] = [];
  const ports = {
    // lifecycle.ts `action`: the gate is asked before a battle starts (asserted against the source below).
    action: (a: Action): boolean => a.type === 'start' && flow.gateStart() ? false : sessionState.game.dispatch(a),
    closeModal: () => { navState.modal = null; }, navState, persist: () => {}, playable: () => true, sessionState,
    showModal: (id: string, html: string) => { navState.modal = id; last.html = html; },
    showResult: () => { navState.modal = 'result'; }, showSettings: () => { navState.modal = 'settings'; }, toast: () => {},
  };
  const flow = createStoreFlow({ dom: { lifetime: { add: (f: () => void) => disposers.push(f) } }, ports } as never, bridge);
  /** The production import: parse, then replace the game only once the save is written (listeners.ts confirm-import). */
  function importSave(text: string): void {
    const decoded = importBackup(text);
    assert.ok(decoded.ok, 'the backup is a valid save');
    const restored = restoreBackupWithSave(sessionState.game, decoded.profile, profile => saveProfile(profile, storage));
    assert.ok(restored.ok);
    sessionState.game = restored.game;
  }
  const onDisk = () => JSON.parse(stored.get(SAVE_KEY)!) as Profile;
  return { bridge, flow, ports, navState, last, sessionState, importSave, onDisk, dispose: () => disposers.forEach(f => f()) };
}

test('a player without Full Journey who imports a save past the free chapters cannot start a paid chapter', () => {
  for (const progress of [{ age: 1, enemyAge: 4, furthestBattle: 4 }, { age: 3, enemyAge: 1, furthestBattle: 3 }, { timeline: 2, age: 0, enemyAge: 0 }, { age: 5, enemyAge: 5, furthestBattle: 5, coins: 9e6 }]) {
    const s = app();
    s.importSave(backupOf(progress));
    assert.equal(s.ports.action({ type: 'start' }), false, `no battle starts from ${JSON.stringify(progress)}`);
    assert.equal(s.sessionState.game.state.phase, 'ready');
    assert.equal(s.navState.modal, 'full-journey', 'the store card opens instead');
    assert.match(s.last.html, /This save is past the free chapters/);
    assert.match(s.last.html, /data-command="buy-full-journey"/);
    assert.match(s.last.html, /data-command="restore-purchases"/);
    assert.match(s.last.html, /data-command="close"/, 'the card can be declined');
    s.dispose();
  }
});

test('an owner imports the same save and plays it untouched', () => {
  const s = app({ fullGame: true });
  s.importSave(backupOf({ age: 3, enemyAge: 4, furthestBattle: 4, coins: 1234 }));
  assert.equal(s.ports.action({ type: 'start' }), true);
  assert.equal(s.sessionState.game.state.phase, 'running');
  assert.equal(s.navState.modal, null);
  const { age, enemyAge, furthestBattle, coins } = s.onDisk();
  assert.deepEqual({ age, enemyAge, furthestBattle, coins }, { age: 3, enemyAge: 4, furthestBattle: 4, coins: 1234 });
  s.dispose();
});

test('the held save is never rewritten: when StoreKit answers later (or after Restore) the same progress opens', () => {
  const s = app();
  s.importSave(backupOf({ age: 3, enemyAge: 4, furthestBattle: 4, coins: 1234 }));
  const written = JSON.stringify(s.onDisk());
  assert.equal(s.ports.action({ type: 'start' }), false);
  assert.equal(s.flow.handleStoreCommand('close'), true);
  assert.equal(s.navState.modal, null, 'declining closes the card; it does not reopen by itself');
  assert.equal(JSON.stringify(s.onDisk()), written, 'the gate changed nothing on disk');
  const { age, enemyAge, furthestBattle, coins } = s.sessionState.game.profile;
  assert.deepEqual({ age, enemyAge, furthestBattle, coins }, { age: 3, enemyAge: 4, furthestBattle: 4, coins: 1234 }, 'nor in memory');
  s.bridge.update({ owned: { fullGame: true } }); // the entitlement resolves after the import
  assert.equal(s.ports.action({ type: 'start' }), true, 'the paid chapter starts as it was saved');
  assert.equal(s.sessionState.game.profile.enemyAge, 4);
  s.bridge.update({ owned: {} }); // and a refund or another Apple Account holds it again, still without touching it
  assert.equal(journeyHeld(s.sessionState.game.profile, s.bridge), true);
  s.dispose();
});

test('ownership comes from the store alone: nothing a save file claims opens a paid chapter', () => {
  const s = app();
  s.importSave(backupOf({ age: 2, enemyAge: 3, furthestBattle: 3 }, { owned: { fullGame: true }, fullGame: true, ownsFullJourney: true, fullJourney: true, purchases: ['Tas.Almo7areboon.fullGame'] }));
  assert.equal(s.ports.action({ type: 'start' }), false);
  assert.equal(s.bridge.owns('fullGame'), false);
  for (const key of ['owned', 'fullGame', 'ownsFullJourney', 'fullJourney', 'purchases']) assert.equal(key in s.onDisk(), false, `${key} never reaches the save`);
  s.dispose();
});

test('declining leaves a way on: a held save whose own army is free steps back to the last free chapter and plays', () => {
  const s = app();
  s.importSave(backupOf({ age: 1, enemyAge: 4, furthestBattle: 4 }));
  assert.equal(s.ports.action({ type: 'start' }), false);
  assert.match(s.last.html, /data-command="free-chapters"/);
  assert.equal(s.flow.handleStoreCommand('free-chapters'), true);
  assert.equal(s.navState.modal, null);
  assert.equal(s.sessionState.game.profile.enemyAge, 2, 'chapter 3, the last free one (1.3)');
  assert.equal(s.sessionState.game.profile.furthestBattle, 4, 'the furthest battle reached stays on record');
  assert.equal(s.ports.action({ type: 'start' }), true, 'and the free chapter plays');
  s.dispose();
  const paidArmy = app();
  paidArmy.importSave(backupOf({ age: 3, enemyAge: 4, furthestBattle: 4 }));
  paidArmy.ports.action({ type: 'start' });
  assert.doesNotMatch(paidArmy.last.html, /data-command="free-chapters"/, 'a paid-chapter army has no free battle to offer');
  paidArmy.dispose();
});

test('free progress and the web are never held', () => {
  for (const progress of [{ age: 1, enemyAge: 1, furthestBattle: 1 }, { age: 2, enemyAge: 2, furthestBattle: 3 }]) {
    const free = app();
    free.importSave(backupOf(progress));
    assert.equal(free.ports.action({ type: 'start' }), true, `chapter ${progress.enemyAge + 1} with the chapter ${progress.age + 1} army is free`);
    free.dispose();
  }
  const web = app({}, false);
  web.importSave(backupOf({ timeline: 3, age: 5, enemyAge: 5, furthestBattle: 5 }));
  assert.equal(web.ports.action({ type: 'start' }), true, 'the web build sells nothing and gates nothing');
  web.dispose();
  assert.equal(pastFreeArc({ timeline: 1, age: 1, enemyAge: 1 }), false);
  assert.equal(pastFreeArc({ timeline: 1, age: 2, enemyAge: 2 }), false, 'chapter 3 is free since 1.3');
  assert.equal(pastFreeArc({ timeline: 1, age: 2, enemyAge: 3 }), true);
  assert.equal(freeChapterFor({ timeline: 1, age: 0, enemyAge: 3, furthestBattle: 3 }), 2);
  assert.equal(freeChapterFor({ timeline: 2, age: 0, enemyAge: 3, furthestBattle: 3 }), null);
});

test('every battle start in the shell passes the gate, and the import dialog says so before replacing a save', () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(read('../src/app/lifecycle.ts'), /if\(!guardAction\(\)\)return false;\n[^\n]*\n\s*if\(a\.type==='start'&&ports\.gateStart\(\)\)return false;\n\s*unlockAudio\([^\n]*sessionState\.game\.dispatch\(a\)/);
  const shell = ['listeners', 'navigation', 'intro', 'quests', 'store-flow'].map(name => read(`../src/app/${name}.ts`)).join('\n') + read('../src/main.ts');
  assert.doesNotMatch(shell, /dispatch\(\{\s*type:\s*'start'/, 'no start goes around lifecycle action');
  assert.match(read('../src/game/simulation.ts').match(/private doStart[\s\S]*?\n {2}\}/)![0], /phase = 'running'/);
  assert.equal(read('../src/game/simulation.ts').match(/phase = 'running'/g)!.length, 1, 'start is the only way a battle begins');
  assert.match(read('../src/app/listeners.ts'), /journeyHeld\(ports\.navState\.pendingImport\)\?`<p class="save-note">\$\{tr\('This save is past the free chapters\./);
  assert.doesNotMatch(read('../src/game/save.ts') + read('../src/game/backup.ts'), /fullGame|owns|app-bridge/, 'the save layer knows nothing of ownership');
});

// Found in WebKit (qa-gate, simulated app): Play on a held save opens the card and then Camp mounts under it; as Camp's
// root it swallowed every button on the card (Buy, Restore, Not now were dead).
test('a card that is already open when Camp mounts keeps its own buttons', () => {
  const nav = readFileSync(new URL('../src/app/navigation.ts', import.meta.url), 'utf8');
  assert.match(nav, /navState\.campOwner\?\?=navState\.modal&&navState\.modal!=='camp-focus'&&navState\.modal!=='session'\?\{kind:'advanced',returnTarget:'journal'\}:\{kind:'root'\};/);
  assert.match(nav, /if\(navState\.campOwner\.kind==='advanced'\)return !navState\.modal&&!button\.closest\('#secondary-screen'\);/, 'an advanced owner lets dialog buttons through');
  assert.match(nav, /if\(navState\.campOwner\.kind==='advanced'&&!navState\.modal&&navState\.activeTab==='battle'\)navState\.campOwner=\{kind:'root'\};/, 'and Camp takes its root back when the dialog closes');
});

// A free player who has just won chapter 3 has chapter 4 on record; the storybook's routes and expeditions choose a
// battle as the battle list does, so they ask the store as well (otherwise the choice lands and the save reads as held).
test('a storybook route or expedition into a paid chapter asks the store before choosing it', () => {
  const listeners = readFileSync(new URL('../src/app/listeners.ts', import.meta.url), 'utf8');
  assert.match(listeners, /if\(storyAction\)\{\n[^\n]*\n\s*if\('battle' in storyAction&&ports\.gateBattle\(storyAction\.battle\)\)return;\n\s*if\(ports\.action\(storyAction\)/);
});

test('while an expedition holds the battle choice the held card does not offer a step back it cannot take', () => {
  const s = app();
  s.importSave(backupOf({ age: 2, enemyAge: 3, furthestBattle: 3 }));
  s.sessionState.game.profile.chronicle!.expedition = { stage: 0, chapter: 3, reserve: 0, provision: 'supplies' }; // an expedition is under way in chapter 4
  assert.equal(s.sessionState.game.dispatch({ type: 'select-battle', battle: 2 }), false, 'which owns the battle choice');
  assert.equal(s.ports.action({ type: 'start' }), false);
  assert.doesNotMatch(s.last.html, /data-command="free-chapters"/);
  assert.match(s.last.html, /data-command="close"/);
  s.flow.handleStoreCommand('free-chapters');
  assert.equal(s.sessionState.game.profile.enemyAge, 3, 'nothing is changed behind the card');
  s.dispose();
});
