import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';

// Deterministic sweep: varied armies, chapters, timelines, upgrades and skill use must all reach a result within five minutes.
// A fight that stays undecided (long-range defenders against an army that cannot close) is a design risk, which is why the
// interface offers Retreat; this guards the ordinary random policies against the engine ever stalling for other reasons.
test('a hundred varied battles all end in a win or a loss within 300 simulated seconds', () => {
  let seed = 12345;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  const undecided: string[] = [];
  for (let index = 0; index < 100; index++) {
    const profile = defaultProfile();
    profile.age = Math.floor(random() * 5);
    profile.enemyAge = Math.min(5, profile.age + Math.floor(random() * 3));
    profile.timeline = 1 + Math.floor(random() * 3);
    profile.unlocked = [true, random() < 0.8, random() < 0.6];
    profile.foodLevel = Math.floor(random() * 12);
    profile.baseLevel = Math.floor(random() * 12);
    const game = new Game(profile);
    game.dispatch({ type: 'start' });
    const weights = [random(), random(), random()], rate = 0.2 + random() * 1.5;
    let time = 0, next = 0;
    while (game.state.phase === 'running' && time < 300) {
      if (time >= next) {
        next += rate;
        const roll = random() * (weights[0] + weights[1] + weights[2]);
        game.dispatch({ type: 'spawn', kind: roll < weights[0] ? 0 : roll < weights[0] + weights[1] ? 1 : 2 });
      }
      if (random() < 0.02) game.dispatch({ type: 'skill', skill: (['freeze', 'meteor', 'food'] as const)[Math.floor(random() * 3)] });
      game.step(0.1);
      game.drainEvents();
      time += 0.1;
    }
    if (game.state.phase === 'running') undecided.push(`age ${profile.age} chapter ${profile.enemyAge} timeline ${profile.timeline}`);
  }
  assert.deepEqual(undecided, []);
});
