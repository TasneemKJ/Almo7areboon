import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { CHAMPION_FIRST, CHAMPION_HEALTH, CHAMPION_RETURN, championWait } from '../src/game/champion.ts';
import { championLabel } from '../src/ui/field-volley.ts';
import { fieldControlsHtml } from '../src/ui/field-controls.ts';

const steps = (game: Game, seconds: number) => { for (let i = 0; i < Math.round(seconds * 60); i++) { game.state.playerHp = game.state.playerMaxHp; game.step(1 / 60); } };

test('the champion joins for free once ready, sturdier and harder hitting than a recruit', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  assert.equal(game.dispatch({ type: 'champion' }), false, 'not before the first call');
  assert.equal(championLabel(game.state).text, `${CHAMPION_FIRST}s`);
  steps(game, CHAMPION_FIRST + 0.05);
  const food = game.state.food, deployed = game.state.stats.deployed;
  assert.equal(game.dispatch({ type: 'champion' }), true);
  const hero = game.state.units.find(u => u.hero)!;
  assert.equal(hero.side, 'player');
  assert.equal(hero.maxHp, Math.round(26 * CHAMPION_HEALTH), 'four times a melee recruit');
  assert.equal(game.state.food, food, 'costs no food');
  assert.equal(game.state.stats.deployed, deployed, 'is not a deployment for seals');
  assert.equal(championWait(game.state), null);
  assert.equal(championLabel(game.state).text, 'Out');
  assert.equal(game.dispatch({ type: 'champion' }), false, 'one champion at a time');
});

test('a fallen champion returns after the countdown', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  steps(game, CHAMPION_FIRST + 0.05);
  game.dispatch({ type: 'champion' });
  game.state.units.find(u => u.hero)!.hp = 0;
  steps(game, 0.1);
  assert.ok(Math.abs(championWait(game.state)! - CHAMPION_RETURN) < 0.2);
  assert.match(championLabel(game.state).label, /Joins in 25 seconds/);
  steps(game, CHAMPION_RETURN);
  assert.equal(game.dispatch({ type: 'champion' }), true);
});

test('the champion strikes twice as hard', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.state.units = [
    { id: 50, side: 'player', kind: 0, age: 0, x: 400, lane: 1, hp: 100, maxHp: 100, attackTimer: 0, attacking: false, hitFlash: 0, hero: true },
    { id: 51, side: 'enemy', kind: 2, age: 0, x: 420, lane: 1, hp: 500, maxHp: 500, attackTimer: 9, attacking: false, hitFlash: 0 },
  ];
  game.drainEvents(); game.step(1 / 60);
  const hit = game.drainEvents().find(e => e.type === 'hit' && e.target === 'unit' && e.side === 'player');
  assert.ok(Math.abs((hit?.amount ?? 0) - 12) < 1e-9, `${hit?.amount}`);
});

test('the champion is a native field button routed through dispatch', () => {
  assert.match(fieldControlsHtml(), /<button id="field-champion" class="world-hit volley-hit champion-hit" data-command="field-champion"[^>]*hidden>/);
  assert.match(readFileSync('src/app/listeners.ts', 'utf8'), /command==='field-champion'\)\{ports\.action\(\{type:'champion'\}\)/);
});
