import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { CHIEF_BOUNTY, CHIEF_HEALTH, chiefDue } from '../src/game/chieftain.ts';

function running(): Game { const game = new Game(); game.dispatch({ type: 'start' }); return game; }

test('the chieftain marches out once, when the enemy gate first falls to half', () => {
  const game = running();
  game.step(1 / 60);
  assert.equal(game.state.units.some(u => u.chief), false);
  game.state.enemyHp = game.state.enemyMaxHp / 2;
  assert.equal(chiefDue(game.state), true);
  game.step(1 / 60);
  const chiefs = game.state.units.filter(u => u.chief);
  assert.equal(chiefs.length, 1);
  assert.equal(chiefs[0].side, 'enemy');
  assert.equal(chiefs[0].kind, 0);
  assert.equal(chiefs[0].hp, chiefs[0].maxHp);
  assert.equal(game.state.chief, true);
  game.state.enemyHp = game.state.enemyMaxHp / 4;
  for (let i = 0; i < 30; i++) game.step(1 / 60);
  assert.equal(game.state.units.filter(u => u.chief).length, 1, 'never a second chieftain');
});

test('the chieftain has extra health and pays a larger bounty through the simulation', () => {
  const game = running();
  game.state.units = [];
  game.state.enemyHp = game.state.enemyMaxHp * 0.4;
  game.step(1 / 60);
  const chief = game.state.units.find(u => u.chief)!;
  const ordinary = Math.round(chief.maxHp / CHIEF_HEALTH);
  assert.ok(chief.maxHp >= ordinary * CHIEF_HEALTH - 1);
  game.drainEvents();
  game.state.units = [chief, { id: 99, side: 'player', kind: 2, age: 0, x: chief.x - 20, lane: chief.lane, hp: 1e6, maxHp: 1e6, attackTimer: 0, attacking: false, hitFlash: 0 }];
  chief.hp = 1;
  const before = game.profile.coins;
  game.step(1 / 60);
  const coin = game.drainEvents().find(e => e.type === 'coin');
  assert.equal(coin?.amount, 12 * CHIEF_BOUNTY, 'five times the melee bounty, credited once');
  assert.equal(game.profile.coins - before, 12 * CHIEF_BOUNTY);
});

test('no chieftain outside a running battle or once the gate has fallen', () => {
  const game = new Game();
  game.state.enemyHp = 1;
  assert.equal(chiefDue(game.state), false);
  const live = running();
  live.state.enemyHp = 0;
  assert.equal(chiefDue(live.state), false);
});

test('the chieftain is larger, ringed in brass and heralded', async () => {
  const { readFileSync } = await import('node:fs');
  const paint = readFileSync('src/view/battlefield-troop-paint.ts', 'utf8');
  assert.match(paint, /\(unit\.storyBoss\|\|unit\.chief\?1\.35:unit\.hero\?1\.2:1\)/);
  assert.match(paint, /if\(unit\.chief\|\|unit\.hero\)\{h\.lineStyle\(2,unit\.hero\?0xa8e6ff:0xf0ce87/);
  const { heraldMoments } = await import('../src/ui/field-herald.ts');
  const game = running();
  game.state.enemyHp = game.state.enemyMaxHp / 2;
  game.step(1 / 60);
  assert.ok(heraldMoments(game.profile, game.state).some(line => line.key === 'chief' && line.title === 'The chieftain marches out'));
});

test('the chieftain falls as an impact frame', async () => {
  const game = running();
  game.state.enemyHp = game.state.enemyMaxHp / 2;
  game.step(1 / 60);
  const chief = game.state.units.find(u => u.chief)!;
  chief.hp = 1;
  game.state.units.push({ id: 98, side: 'player', kind: 2, age: 0, x: chief.x - 20, lane: chief.lane, hp: 1e6, maxHp: 1e6, attackTimer: 0, attacking: false, hitFlash: 0 });
  game.drainEvents();
  game.step(1 / 60);
  const deaths = game.drainEvents().filter(e => e.type === 'death');
  assert.deepEqual(deaths.map(e => e.chief), [true]);
  const { readFileSync } = await import('node:fs');
  const scene = readFileSync('src/view/battlefield-scene.ts', 'utf8');
  assert.match(scene, /if\(e\.type==='death'&&e\.chief\)\{[^\n]*'THE CHIEFTAIN FALLS'[^\n]*if\(!this\.reduce\)\{this\.effects\.hitStop\.trigger\(\);this\.cameras\.main\.flash/);
});
