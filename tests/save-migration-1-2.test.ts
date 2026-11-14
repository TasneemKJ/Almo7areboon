import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAppBridge, evolutionNeedsFullJourney, journeyHeld } from '../src/ui/app-bridge.ts';
import { createStoreFlow } from '../src/app/store-flow.ts';
import { decodeSave, loadProfileWithStatus, saveProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { Game } from '../src/game/simulation.ts';
import type { Action, Profile } from '../src/game/types.ts';

// 1.3 opens chapter 3 for free (Full Journey: chapters 4-6). Saves written by 1.2 must load with nothing lost.
// The fixtures are raw `almo7areboon.save.v1` strings written by saveProfile at 3e297d1, the 1.2 content line (no build
// commit of 1.2 is tagged in this repo), from games played by the 1.2 rules through Game.dispatch:
//   save-1.2-full-journey-chapter-5.json  a Full Journey owner in chapter 5 with the Lantern Quarter army;
//   save-1.2-free-mid-chapter-2.json      a free player who won chapter 1 and lost chapter 2 once;
//   save-1.2-free-won-chapter-2.json      a free player who won chapter 2 (chapter 3 on record) and went to Camp, where
//                                         1.2 stopped them.
const raw = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8').trim();
const OWNER = raw('save-1.2-full-journey-chapter-5.json'), FREE_MID = raw('save-1.2-free-mid-chapter-2.json'), FREE_WON = raw('save-1.2-free-won-chapter-2.json');

/** The app on a 1.2 device: the raw save already on disk, a real bridge on a fake TasKit window, the real store flow. */
function upgradedApp(save: string, owned: Record<string, boolean> = {}) {
  const stored = new Map<string, string>([[SAVE_KEY, save], [BACKUP_KEY, save]]);
  const storage = { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); } };
  const loaded = loadProfileWithStatus(storage);
  const bridge = createAppBridge({ webkit: { messageHandlers: { almo7areboon: { postMessage: () => {} } } }, __almoAppBoot: { owned, prices: { fullGame: '$4.99' } } });
  const sessionState = { game: new Game(loaded.profile) };
  const navState = { modal: null as string | null, evolutionFromResult: false };
  const disposers: (() => void)[] = [];
  const ports = {
    action: (a: Action): boolean => a.type === 'start' && flow.gateStart() ? false : sessionState.game.dispatch(a),
    closeModal: () => { navState.modal = null; }, navState, persist: () => { saveProfile(sessionState.game.profile, storage); }, playable: () => true, sessionState,
    showModal: (id: string) => { navState.modal = id; }, showResult: () => { navState.modal = 'result'; }, showSettings: () => {}, toast: () => {}, renderScreen: () => {},
  };
  const flow = createStoreFlow({ dom: { lifetime: { add: (f: () => void) => disposers.push(f) } }, ports } as never, bridge);
  return { status: loaded.status, bridge, flow, ports, navState, sessionState, stored, dispose: () => disposers.forEach(f => f()) };
}
/** Every field of a profile as 1.2 wrote it, compared after a 1.3 load and save. */
const asWritten = (save: string) => JSON.parse(save) as Profile;

test('the 1.2 fixtures are real saves of the expected shape, written by the 1.2 rules', () => {
  for (const save of [OWNER, FREE_MID, FREE_WON]) assert.deepEqual(decodeSave(save).profile, JSON.parse(save), '1.3 decodes every field exactly as 1.2 wrote it');
  const owner = asWritten(OWNER), mid = asWritten(FREE_MID), won = asWritten(FREE_WON);
  assert.deepEqual([owner.timeline, owner.age, owner.enemyAge, owner.furthestBattle], [1, 3, 4, 4]);
  assert.deepEqual([mid.age, mid.enemyAge, mid.furthestBattle], [0, 1, 1]);
  assert.deepEqual([won.age, won.enemyAge, won.furthestBattle], [0, 1, 2]);
  assert.ok(owner.smithy && owner.smithy.blades.length > 0 && owner.chronicle?.enabled && owner.mastery && owner.gems > 0, 'the owner save carries blades, storybook, seals and gems');
});

test('a 1.2 Full Journey owner loads with nothing lost and plays on in chapter 5', () => {
  const s = upgradedApp(OWNER, { fullGame: true });
  assert.equal(s.status, 'loaded', 'the primary save is read, not the backup and not a fresh profile');
  assert.deepEqual(s.sessionState.game.profile, decodeSave(OWNER).profile, 'every field as 1.2 wrote it');
  assert.equal(journeyHeld(s.sessionState.game.profile, s.bridge), false);
  assert.equal(s.flow.gateBattle(4), false); assert.equal(s.flow.gateEvolution(), false);
  assert.equal(s.ports.action({ type: 'start' }), true, 'the chapter 5 battle starts');
  assert.equal(s.navState.modal, null, 'no store card');
  assert.equal(s.sessionState.game.profile.enemyAge, 4);
  s.ports.persist();
  const after = JSON.parse(s.stored.get(SAVE_KEY)!) as Profile, before = asWritten(OWNER);
  for (const key of ['timeline', 'age', 'enemyAge', 'furthestBattle', 'coins', 'gems', 'cards', 'unlocked', 'foodLevel', 'baseLevel', 'wins', 'smithy', 'chronicle', 'mastery'] as const)
    assert.deepEqual(after[key as keyof Profile], before[key as keyof Profile], `${key} survives the 1.3 save`);
  s.dispose();
});

test('the owner save is still held, untouched, for an Apple Account that does not own Full Journey', () => {
  const s = upgradedApp(OWNER);
  assert.equal(s.ports.action({ type: 'start' }), false);
  assert.equal(s.navState.modal, 'full-journey');
  assert.deepEqual(s.sessionState.game.profile, decodeSave(OWNER).profile, 'nothing clamped or rewritten');
  s.bridge.update({ owned: { fullGame: true } }); // Restore
  assert.equal(s.ports.action({ type: 'start' }), true);
  s.dispose();
});

test('a free 1.2 save in chapter 2 loads with nothing lost, plays chapter 2, and chapter 3 is now open', () => {
  const s = upgradedApp(FREE_MID);
  assert.equal(s.status, 'loaded');
  assert.deepEqual(s.sessionState.game.profile, decodeSave(FREE_MID).profile, 'every field as 1.2 wrote it');
  assert.equal(journeyHeld(s.sessionState.game.profile, s.bridge), false);
  assert.equal(s.ports.action({ type: 'start' }), true, 'chapter 2 plays');
  assert.equal(s.navState.modal, null);
  assert.equal(s.flow.gateBattle(2), false, 'going on to chapter 3 no longer asks');
  assert.equal(evolutionNeedsFullJourney(0, s.bridge) || evolutionNeedsFullJourney(1, s.bridge), false, 'moving camp into chapters 2 and 3 costs coins only');
  assert.equal(s.flow.gateBattle(3), true, 'chapter 4 still opens the card');
  s.dispose();
});

test('a free 1.2 save that won chapter 2 (where 1.2 stopped it) goes on into chapter 3 by the game\'s own rules', () => {
  const s = upgradedApp(FREE_WON);
  assert.deepEqual(s.sessionState.game.profile, decodeSave(FREE_WON).profile, 'every field as 1.2 wrote it');
  assert.equal(s.flow.gateBattle(2), false);
  assert.equal(s.ports.action({ type: 'select-battle', battle: 2 }), true, 'chapter 3 is on record and can be chosen');
  assert.equal(s.ports.action({ type: 'start' }), true, 'and it starts');
  assert.equal(s.sessionState.game.profile.enemyAge, 2);
  assert.equal(s.navState.modal, null, 'no store card on the way');
  s.dispose();
  // The army may move into chapter 3's camp with coins alone; chapter 4's camp still waits for Full Journey.
  const moving = upgradedApp(FREE_WON);
  const p = moving.sessionState.game.profile; p.coins = 10_000_000; p.age = 1;
  assert.equal(moving.flow.gateEvolution(), false);
  assert.equal(moving.sessionState.game.dispatch({ type: 'evolve' }), true);
  assert.equal(moving.sessionState.game.profile.age, 2);
  assert.equal(moving.flow.gateEvolution(), true, 'Move camp into chapter 4 opens the card');
  moving.dispose();
});
