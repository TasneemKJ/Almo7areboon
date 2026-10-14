import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { harvestMoon, finaleFoodFactor, HARVEST_MOON_FOOD } from '../src/game/finale.ts';
import { fieldFoodReadout } from '../src/ui/field-controls.ts';
import { heraldMoments } from '../src/ui/field-herald.ts';

function foodGain(game: Game, seconds: number): number {
  game.state.food = 0;
  const before = game.state.food;
  for (let i = 0; i < seconds * 60; i++) game.step(1 / 60);
  return game.state.food - before;
}

test('food gathers twice as fast once the final wave has set out (Harvest Moon)', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  assert.equal(harvestMoon(game.state), false);
  const early = foodGain(game, 1);
  game.state.wave = game.state.totalWaves;
  assert.equal(harvestMoon(game.state), true);
  const late = foodGain(game, 1);
  assert.ok(Math.abs(late - early * HARVEST_MOON_FOOD) < 1e-6, `${late} vs ${early}`);
});

test('the Harvest Moon only applies while a battle runs and shortens the honest wait', () => {
  const game = new Game();
  assert.equal(finaleFoodFactor(game.state), 1, 'not in a ready battle');
  game.dispatch({ type: 'start' });
  game.state.food = 0;
  const wait = game.deploymentStatus(0).waitSeconds;
  game.state.wave = game.state.totalWaves;
  assert.ok(Math.abs(game.deploymentStatus(0).waitSeconds - wait / 2) < 1e-9);
  assert.equal(finaleFoodFactor({ ...game.state, phase: 'won' }), 1);
});

test('the field heralds and labels the Harvest Moon', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.state.wave = game.state.totalWaves;
  assert.ok(heraldMoments(game.profile, game.state).some(line => line.key === 'harvest-moon' && /twice as fast/.test(line.detail)));
  assert.match(fieldFoodReadout(12, true).label, /Harvest Moon: food gathers twice as fast/);
  assert.doesNotMatch(fieldFoodReadout(12).label, /Harvest/);
  assert.match(readFileSync('src/ui/storybook-pass.css', 'utf8'), /\[data-finale="on"\] \.field-food::after\{content:"×2"/);
});

test('the Harvest Moon rises over the field sky, still with reduced motion', () => {
  const css = readFileSync('src/ui/storybook-pass.css', 'utf8');
  const sky = css.match(/\.world\[data-finale="on"\]:before\{background:([^}]*)\}/)?.[1] ?? '';
  assert.match(sky, /^radial-gradient\(circle at 80% 14%/, 'the moon is the top layer');
  assert.match(sky, /linear-gradient\(#102d459e,transparent 35%\)/, 'the ordinary sky shade stays');
  assert.match(css, /:root\[data-motion="full"\] \.world\[data-finale="on"\]:before\{animation:moon-rise/);
  assert.doesNotMatch(css, /^\.world\[data-finale="on"\]:before\{[^}]*animation/m, 'the rise is motion-only');
});
