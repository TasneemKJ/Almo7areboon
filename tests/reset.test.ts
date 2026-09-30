import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, loadProfile, saveProfile } from '../src/game/save.ts';
import { restoreBackup } from '../src/game/backup.ts';
import { startOverProfile } from '../src/game/reset.ts';

function advancedProfile() {
  const p = defaultProfile();
  Object.assign(p, { timeline: 4, age: 3, enemyAge: 3, furthestBattle: 3, coins: 9000, gems: 777, foodLevel: 9, baseLevel: 7, unlocked: [true, true, true], summonCount: 60, kills: 90, wins: 12, deployed: 300, claimed: ['first-blood', 'veteran'], sound: false, speed: 2, motion: 'reduced', dailyDay: 20000, dailyStreak: 5 });
  p.cards = p.cards.map((_, i) => (i % 3 === 0 ? 4 : 0));
  return p;
}

test('start over clears progress but keeps preferences and today\'s daily-reward claim', () => {
  const fresh = startOverProfile(advancedProfile());
  const expected = defaultProfile();
  assert.deepEqual({ ...fresh, sound: 0, speed: 0, motion: 0, dailyDay: 0, dailyStreak: 0 }, { ...expected, sound: 0, speed: 0, motion: 0, dailyDay: 0, dailyStreak: 0 });
  assert.deepEqual([fresh.sound, fresh.speed, fresh.motion, fresh.dailyDay, fresh.dailyStreak], [false, 2, 'reduced', 20000, 5]);
  assert.equal(new Game(fresh).dispatch({ type: 'daily', day: 20000 }), false, 'a reset cannot re-claim the same day');
});

test('start over writes the new profile before replacing the game, and refuses when storage fails', () => {
  const current = new Game(advancedProfile());
  const memory = new Map<string, string>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
  const restored = restoreBackup(current, startOverProfile(current.profile), storage);
  assert.equal(restored.ok, true);
  assert.equal(restored.game.profile.gems, 100);
  assert.equal(loadProfile(storage).timeline, 1);

  const failing = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  const refused = restoreBackup(current, startOverProfile(current.profile), failing);
  assert.equal(refused.ok, false);
  assert.equal(refused.game, current, 'the current game is untouched when the save cannot be written');
  assert.equal(current.profile.gems, 777);
  assert.equal(saveProfile(startOverProfile(current.profile), failing), false);
});
