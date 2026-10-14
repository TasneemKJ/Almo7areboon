import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { VOLLEY_SECONDS, VOLLEY_PUSH, canFireVolley, volleyCharge } from '../src/game/volley.ts';
import { volleyLabel } from '../src/ui/field-volley.ts';
import { fieldControlsHtml } from '../src/ui/field-controls.ts';
import { selectCombatCues } from '../src/view/combat-cues.ts';
import type { Unit } from '../src/game/types.ts';

const enemy = (id: number, x: number, hp = 400): Unit => ({ id, side: 'enemy', kind: 2, age: 0, x, lane: 1, hp, maxHp: hp, attackTimer: 9, attacking: false, hitFlash: 0 });
function charged(): Game {
  const game = new Game();
  game.dispatch({ type: 'start' });
  for (let i = 0; i < VOLLEY_SECONDS * 60 + 2; i++) { game.state.playerHp = game.state.playerMaxHp; game.step(1 / 60); }
  game.state.units = [];
  return game;
}

test('the volley charges over battle time and only while the battle runs', () => {
  const game = new Game();
  game.step(1);
  assert.equal(volleyCharge(game.state), 0, 'no charge before the battle runs');
  game.dispatch({ type: 'start' });
  for (let i = 0; i < 60 * 9; i++) game.step(1 / 60);
  assert.ok(Math.abs(volleyCharge(game.state) - 0.5) < 0.01);
  assert.equal(volleyCharge(charged().state), 1);
});

test('a charged volley strikes enemies near your gate, throws survivors back and recharges from empty', () => {
  const game = charged();
  game.state.units = [enemy(70, 300), enemy(71, 420), enemy(72, 700)];
  assert.equal(canFireVolley(game.state), true);
  game.drainEvents();
  assert.equal(game.dispatch({ type: 'volley' }), true);
  const [near, mid, far] = [70, 71, 72].map(id => game.state.units.find(u => u.id === id)!);
  assert.ok(near.hp < 400 && mid.hp < 400, 'both enemies in reach are hurt');
  assert.equal(far.hp, 400, 'an enemy beyond reach is untouched');
  assert.equal(near.x, 300 + VOLLEY_PUSH);
  assert.equal(far.x, 700);
  assert.equal(volleyCharge(game.state), 0);
  assert.equal(game.dispatch({ type: 'volley' }), false, 'cannot fire again until recharged');
  assert.deepEqual(game.drainEvents().filter(e => e.type === 'volley').map(e => e.amount), [2]);
});

test('a volley waits for an enemy in reach, a running battle and no pause', () => {
  const game = charged();
  game.state.units = [enemy(73, 700)];
  assert.equal(game.dispatch({ type: 'volley' }), false, 'nothing in reach');
  assert.match(volleyLabel(game.state).label, /Waits for an enemy near your gate/);
  game.state.units = [enemy(74, 200)];
  game.state.paused = true;
  assert.equal(game.dispatch({ type: 'volley' }), false, 'paused');
  game.state.paused = false;
  assert.equal(volleyLabel(game.state).ready, true);
  assert.equal(game.dispatch({ type: 'volley' }), true);
  assert.match(volleyLabel(game.state).label, /Charging, 0%/);
  assert.equal(volleyLabel(game.state).text, '0%');
});

test('a volley kill pays the ordinary bounty through the simulation', () => {
  const game = charged();
  game.state.units = [enemy(75, 200, 5)];
  const coins = game.profile.coins;
  assert.equal(game.dispatch({ type: 'volley' }), true);
  assert.equal(game.state.units.length, 0);
  assert.ok(game.profile.coins > coins);
});

test('the volley is a native field button with a sound and its own look', () => {
  assert.match(fieldControlsHtml(), /<button id="field-volley" class="world-hit volley-hit" data-command="field-volley"[^>]*hidden>/);
  assert.equal(selectCombatCues([{ type: 'volley', amount: 2 }])[0]?.id, 'meteor');
  assert.match(readFileSync('src/app/listeners.ts', 'utf8'), /command==='field-volley'\)\{ports\.action\(\{type:'volley'\}\)/);
  assert.match(readFileSync('src/ui/storybook-pass.css', 'utf8'), /\.volley-hit\{border-radius:50%/);
});

test('the volley fills a brass ring, breathes when ready and is introduced to new commanders once', async () => {
  const css = readFileSync('src/ui/storybook-pass.css', 'utf8');
  assert.match(css, /conic-gradient\(#f0ce87 calc\(var\(--charge,0\)\*360deg\)/);
  assert.match(css, /:root\[data-motion="full"\] \.volley-hit\.volley-ready\{animation:volley-breathe/);
  const { heraldMoments } = await import('../src/ui/field-herald.ts');
  const game = charged();
  game.state.units = [enemy(80, 300)];
  assert.ok(heraldMoments(game.profile, game.state).some(line => line.key === 'volley'));
  game.profile.wins = 9;
  assert.ok(!heraldMoments(game.profile, game.state).some(line => line.key === 'volley'), 'seasoned commanders are not told again');
});
