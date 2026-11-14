import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// @ts-expect-error a plain ES module beside the iOS project, without types
import { ACHIEVEMENTS, LEADERBOARD, PROGRESS_SCRIPT, SAVE_KEY as GC_SAVE_KEY } from '../ios/game-center/progress.js';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, SAVE_KEY, saveProfile } from '../src/game/save.ts';
import type { Profile } from '../src/game/types.ts';

/* Game Center on the iPhone (TasKit). The native side evaluates PROGRESS_SCRIPT inside the snapshot that also copies
   the save to the vault, so a script that breaks the snapshot loses the save backup too. These tests run it inside the
   same one-line wrapper TasKit builds (TasBootScripts.snapshot) against a fake localStorage. */
type Achievement = { key: string; id: string; points: number; hidden: boolean; en: Record<string, string>; ar: Record<string, string> };
const LIST = ACHIEVEMENTS as Achievement[];
const SWIFT = readFileSync(new URL('../ios/Almo7areboon/Almo7areboonConfig.swift', import.meta.url), 'utf8');
const SWIFT_TESTS = readFileSync(new URL('../ios/Almo7areboonTests/Almo7areboonConfigTests.swift', import.meta.url), 'utf8');
const NONE = Object.fromEntries(LIST.map(a => [a.key, false]));

function snapshot(storage: unknown) {
  const wrapper = `(function(){var out={storage:{},progress:null};try{out.progress=(${PROGRESS_SCRIPT});}catch(e){}return JSON.stringify(out);})()`;
  return JSON.parse(new Function('localStorage', `return ${wrapper};`)(storage)) as { progress: { achievements: Record<string, boolean>; scores: Record<string, number> } };
}
const storeWith = (raw: string | null) => ({ getItem: (k: string) => (k === SAVE_KEY ? raw : null) });
const progressOf = (save: unknown) => snapshot(storeWith(typeof save === 'string' ? save : JSON.stringify(save))).progress;
/** A save as the game writes it (saveProfile, through decodeSave). */
function written(patch: Partial<Profile> = {}): unknown {
  const store: Record<string, string> = {};
  assert.ok(saveProfile(Object.assign(defaultProfile(), patch), { setItem: (k, v) => { store[k] = v; }, getItem: k => store[k] ?? null }));
  return JSON.parse(store[SAVE_KEY]);
}
const earned = (save: unknown) => Object.entries(progressOf(save).achievements).filter(([, v]) => v).map(([k]) => k);

test('the progress script is one expression TasKit can splice, and reads the real save key', () => {
  assert.doesNotMatch(PROGRESS_SCRIPT, /["\\]/); assert.doesNotMatch(PROGRESS_SCRIPT, /\/\/|\/\*/);
  assert.equal(PROGRESS_SCRIPT.trim().endsWith(';'), false);
  assert.equal(GC_SAVE_KEY, SAVE_KEY); assert.ok(PROGRESS_SCRIPT.includes(`'${SAVE_KEY}'`));
});

test('Almo7areboonConfig.swift embeds the script byte for byte, with the same keys and IDs', () => {
  const m = SWIFT.match(/static let progressScript = "(.*)"\n/);
  assert.ok(m); assert.equal(m![1], PROGRESS_SCRIPT);
  const pairs = [...SWIFT.matchAll(/\.init\(key: "([^"]+)", id: "([^"]+)"\)/g)].map(([, key, id]) => ({ key, id }));
  assert.deepEqual(pairs, [...LIST.map(({ key, id }) => ({ key, id })), { key: LEADERBOARD.key, id: LEADERBOARD.id }]);
  assert.ok(SWIFT.includes('gameCenter: AlmoGameCenter.config,')); assert.ok(SWIFT_TESTS.includes(LIST[0].id));
});

test('seven achievements in the game\'s voice, EN and AR, one hidden, IDs with underscores, within App Store limits', () => {
  assert.equal(LIST.length, 7); assert.equal(LIST.filter(a => a.hidden).length, 1);
  assert.equal(new Set(LIST.map(a => a.id)).size, 7);
  for (const a of LIST) {
    assert.match(a.id, /^almo\.milestone\.\d_[a-z_]+$/);
    for (const t of [a.en, a.ar]) { assert.ok(t.name.length <= 30, a.id); assert.ok(t.before.length <= 200 && t.after.length <= 200, a.id); }
    assert.match(a.ar.name + a.ar.before + a.ar.after, /^[\u0600-\u06FF\s،.«»]+$/, `${a.id} Arabic only`);
    assert.doesNotMatch(JSON.stringify([a.en, a.ar]), /!|birth|born|ولادة|ميلاد|مولود|لمس/);
  }
  assert.ok(LIST.reduce((sum, a) => sum + a.points, 0) <= 1000);
  assert.match(LEADERBOARD.id, /^almo\.[a-z_]+$/);
});

test('an empty, broken or hostile save earns nothing and never throws', () => {
  for (const raw of [null, '', '{not json', 'null', '[]', '42', '"text"']) assert.deepEqual(snapshot(storeWith(raw)).progress, { achievements: NONE, scores: {} });
  assert.deepEqual(snapshot({ getItem() { throw new Error('blocked'); } }).progress, { achievements: NONE, scores: {} });
  assert.deepEqual(snapshot(undefined).progress, { achievements: NONE, scores: {} });
  const hostile = { wins: '9', furthestBattle: Infinity, unlocked: { 1: true }, foodLevel: NaN, kills: -5, mastery: { chapters: [null, 2, { earnedMask: '2' }] }, dusk: [] };
  assert.deepEqual(progressOf(hostile), { achievements: NONE, scores: {} });
  assert.deepEqual(progressOf(written()), { achievements: NONE, scores: {} }, 'a new company has earned nothing');
});

test('each achievement comes from its own field, as the game writes it; near misses do not count', () => {
  const one = (save: unknown, key: string) => assert.deepEqual(earned(save), [key]);
  one(written({ wins: 1 }), 'firstVictory');
  one(written({ furthestBattle: 2, enemyAge: 2 }), 'oliveTerraces');
  one(written({ unlocked: [true, true, false] }), 'secondTroop');
  one(written({ foodLevel: 5 }), 'breadEnough');
  const sealed = defaultProfile(); sealed.mastery.chapters[0] = { earnedMask: 3, bestSeconds: 40, bestGateDamage: 0 };
  one(written({ mastery: sealed.mastery }), 'gateUnbroken');
  one(written({ kills: 100 }), 'hundredBack');
  one(written({ dusk: { day: 20_400 } }), 'lampsDoNotFight');
  assert.deepEqual(earned(written({ furthestBattle: 1, enemyAge: 1, foodLevel: 4, kills: 99 })), []);
  const cleared = defaultProfile(); cleared.mastery.chapters[0] = { earnedMask: 5, bestSeconds: 40, bestGateDamage: 3 };
  assert.deepEqual(earned(written({ mastery: cleared.mastery })), []);
  assert.deepEqual(progressOf(written({ kills: 1234 })).scores, { rivalsTurnedBack: 1234 });
});

test('a real first victory, played by the rules, earns First Fires; a dusk raid adds no kills to the leaderboard', () => {
  const game = new Game(); game.dispatch({ type: 'start' });
  for (let t = 0; t < 240 && game.state.phase === 'running'; t += .1) { game.dispatch({ type: 'spawn', kind: 0 }); game.step(.1); game.drainEvents(); }
  if (game.state.phase === 'running') { game.state.enemyHp = 0; game.step(1 / 60); }
  assert.equal(game.state.phase, 'won');
  assert.ok(earned(written(game.profile)).includes('firstVictory'));
  const kills = game.profile.kills; game.dispatch({ type: 'next' });
  assert.ok(game.dispatch({ type: 'dusk', day: 20_400, lit: false }));
  for (const x of [300, 500, 700]) game.dispatch({ type: 'dusk-lamp', x });
  game.dispatch({ type: 'start' });
  for (let t = 0; t < 120 && (game.state.phase as string) === 'running'; t += .1) { game.dispatch({ type: 'spawn', kind: 0 }); game.step(.1); game.drainEvents(); }
  assert.equal(game.profile.kills, kills, 'nothing paid, and no raid, moves the leaderboard');
});
