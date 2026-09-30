import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';

function win(game: Game) {
  game.dispatch({ type: 'start' });
  game.dispatch({ type: 'spawn', kind: 0 });
  game.state.enemyHp = 0;
  game.step(1 / 60);
}

function newSeals(game: Game): number | undefined {
  const receipt = game.profile.pendingVictory;
  return receipt && receipt.settlement === 'mastery-v1' ? receipt.newMask : undefined;
}

test('seals pay once per timeline: reload and replay add nothing, a new timeline starts fresh', () => {
  const game = new Game(defaultProfile());
  const coins = game.profile.coins, gems = game.profile.gems;
  win(game);
  const firstCoins = game.profile.coins - coins, firstGems = game.profile.gems - gems;
  assert.ok(firstCoins > 120 && firstGems > 10, 'the first clear pays base rewards plus its seals');
  assert.equal(game.profile.mastery.chapters[0].earnedMask, 7);

  const reloaded = new Game(game.profile);
  assert.equal(reloaded.state.phase, 'won');
  assert.deepEqual([reloaded.profile.coins, reloaded.profile.gems], [game.profile.coins, game.profile.gems], 'reloading the result pays nothing');

  game.dispatch({ type: 'retry' });
  const replayCoins = game.profile.coins, replayGems = game.profile.gems;
  win(game);
  assert.deepEqual([game.profile.coins - replayCoins, game.profile.gems - replayGems], [120, 10], 'a replay pays only the base reward');
  assert.equal(newSeals(game), 0);

  for (let chapter = 1; chapter <= 5; chapter++) { game.dispatch({ type: 'next' }); win(game); }
  assert.equal(game.profile.enemyAge, 5);
  const before = game.profile.gems;
  assert.equal(game.dispatch({ type: 'next' }), true);
  assert.equal(game.profile.timeline, 2);
  assert.ok(game.profile.mastery.chapters.every(record => record.earnedMask === 0), 'a new timeline clears every seal');
  assert.equal(game.profile.gems - before, 100, 'the timeline bonus is paid once on advancing');

  const freshCoins = game.profile.coins;
  win(game);
  assert.ok(game.profile.coins - freshCoins > 120 && newSeals(game) === 7, 'seals can be earned again in the new timeline');
});
