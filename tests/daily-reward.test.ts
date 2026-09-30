import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { dailyReward, localDay } from '../src/game/data.ts';
import { exportBackup } from '../src/game/backup.ts';
import { decodeSave } from '../src/game/save.ts';

test('an oversized daily claim is rejected before and after a backup reload', () => {
  const game = new Game();
  const before = structuredClone(game.profile);
  assert.equal(game.dispatch({ type: 'daily', day: 1_000_001 }), false);
  assert.deepEqual(game.profile, before);
  assert.deepEqual(game.drainEvents(), []);

  const exported = JSON.parse(exportBackup(game.profile));
  const decoded = decodeSave(JSON.stringify(exported.profile));
  assert.ok(decoded.profile);
  const reloaded = new Game(decoded.profile);
  assert.equal(reloaded.dispatch({ type: 'daily', day: 1_000_001 }), false);
  assert.deepEqual(reloaded.profile, before);
  assert.deepEqual(reloaded.drainEvents(), []);
});

test('invalid daily days leave the wallet, progress and events unchanged', () => {
  for (const day of [0, -1, 20_000.5, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER]) {
    const game = new Game();
    const before = structuredClone(game.profile);
    assert.equal(dailyReward(game.profile, day).available, false, String(day));
    assert.equal(game.dispatch({ type: 'daily', day }), false, String(day));
    assert.deepEqual(game.profile, before);
    assert.deepEqual(game.drainEvents(), []);
  }
});

test('valid local and boundary days retain their claim across a backup reload', () => {
  for (const day of [1, localDay(new Date('2026-09-30T12:00:00Z')), 1_000_000]) {
    const game = new Game();
    assert.equal(dailyReward(game.profile, day).available, true);
    assert.equal(game.dispatch({ type: 'daily', day }), true);
    assert.equal(game.profile.gems, 130);
    assert.equal(game.profile.dailyStreak, 1);

    const exported = JSON.parse(exportBackup(game.profile));
    const decoded = decodeSave(JSON.stringify(exported.profile));
    assert.ok(decoded.profile);
    const reloaded = new Game(decoded.profile);
    assert.equal(reloaded.profile.dailyDay, day);
    assert.equal(reloaded.dispatch({ type: 'daily', day }), false);
    assert.equal(reloaded.profile.gems, 130);
    assert.equal(reloaded.profile.dailyStreak, 1);
    assert.deepEqual(reloaded.drainEvents(), []);
  }
});
