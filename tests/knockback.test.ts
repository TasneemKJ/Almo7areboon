import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { knockback, KNOCKBACK_DISTANCE } from '../src/game/knockback.ts';
import type { Unit } from '../src/game/types.ts';

const unit = (side: Unit['side'], x: number, hp = 30): Unit => ({ id: 1, side, kind: 0, age: 0, x, lane: 0, hp, maxHp: 30, attackTimer: 0, attacking: false, hitFlash: 0 });

test('a blow worth a third of the target health throws it back, away from the attacker', () => {
  const enemy = unit('enemy', 500);
  assert.equal(knockback(enemy, 'player', 10), true);
  assert.equal(enemy.x, 500 + KNOCKBACK_DISTANCE);
  const ally = unit('player', 400);
  assert.equal(knockback(ally, 'enemy', 12), true);
  assert.equal(ally.x, 400 - KNOCKBACK_DISTANCE);
});

test('small blows, fallen targets and the spawn lines never move a target', () => {
  const light = unit('enemy', 500);
  assert.equal(knockback(light, 'player', 9), false);
  assert.equal(light.x, 500);
  const fallen = unit('enemy', 500, 0);
  assert.equal(knockback(fallen, 'player', 30), false);
  const atLine = unit('enemy', 880);
  assert.equal(knockback(atLine, 'player', 20), false, 'never behind the enemy spawn line');
  const near = unit('enemy', 875);
  knockback(near, 'player', 20);
  assert.equal(near.x, 880);
  const home = unit('player', 110);
  knockback(home, 'enemy', 20);
  assert.equal(home.x, 110, 'a defender already behind its line stays');
});

test('a heavy troop knocks back an enemy in battle and reports it on the hit', () => {
  const game = new Game({ ...new Game().profile, unlocked: [true, true, true] });
  game.dispatch({ type: 'start' });
  game.state.units = [
    { id: 90, side: 'player', kind: 2, age: 0, x: 480, lane: 1, hp: 500, maxHp: 500, attackTimer: 0, attacking: false, hitFlash: 0 },
    { id: 91, side: 'enemy', kind: 0, age: 0, x: 500, lane: 1, hp: 30, maxHp: 30, attackTimer: 5, attacking: false, hitFlash: 0 },
  ];
  game.drainEvents();
  game.step(1 / 60);
  const hit = game.drainEvents().find(event => event.type === 'hit' && event.side === 'player' && event.target === 'unit');
  assert.ok(hit?.knock, 'the heavy blow is flagged for presentation');
  assert.ok(game.state.units.find(u => u.id === 91)!.x > 500 + KNOCKBACK_DISTANCE - 1, 'thrown back (it may take its first step forward again)');
});

test('only heavy troops knock back; light troops never do', () => {
  const enemy = unit('enemy', 500);
  assert.equal(knockback(enemy, 'player', 30, 0), false);
  assert.equal(knockback(enemy, 'player', 30, 1), false);
  assert.equal(enemy.x, 500);
});
