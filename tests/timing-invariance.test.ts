import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';

function run(partition: (frame: number) => number, pauses = false): string {
  const profile = defaultProfile();
  profile.unlocked = [true, true, true];
  profile.foodLevel = 10;
  const game = new Game(profile);
  game.dispatch({ type: 'start' });
  for (let kind = 0; kind < 3; kind++) game.dispatch({ type: 'spawn', kind: kind as 0 | 1 | 2 });
  let simulated = 0, frame = 0;
  while (simulated < 40 - 1e-9) {
    const dt = Math.min(partition(frame), 40 - simulated);
    if (pauses && frame % 5 === 2) { game.dispatch({ type: 'pause' }); game.step(0.5); game.dispatch({ type: 'pause' }); }
    game.step(dt);
    simulated += dt;
    frame++;
  }
  const state = game.state;
  return JSON.stringify({ time: +state.time.toFixed(3), food: +state.food.toFixed(3), playerHp: +state.playerHp.toFixed(2), enemyHp: +state.enemyHp.toFixed(2), units: state.units.map(unit => [unit.id, +unit.x.toFixed(2), Math.round(unit.hp)]), wave: state.wave, coins: game.profile.coins });
}

test('forty simulated seconds end in the same state however the frames are cut, paused or sped up', () => {
  const reference = run(() => 1 / 60);
  assert.equal(run(() => 1 / 30), reference, '30 fps');
  assert.equal(run(() => 0.1), reference, '10 fps');
  assert.equal(run(frame => [0.007, 0.05, 0.016, 0.2, 0.033][frame % 5]), reference, 'irregular frames');
  assert.equal(run(() => 1 / 60, true), reference, 'stepping while paused changes nothing');
  assert.equal(run(() => 2 / 60), reference, '2x speed is twice the simulated time per frame, not different rules');
  assert.match(reference, /"time":40/);
});
