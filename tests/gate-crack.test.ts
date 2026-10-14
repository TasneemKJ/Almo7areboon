import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { createGateCracks, gateBand } from '../src/view/gate-crack.ts';

test('gate health reads in thirds', () => {
  assert.deepEqual([100, 67, 66, 34, 33, 1, 0].map(hp => gateBand(hp, 100)), [3, 3, 2, 2, 1, 1, 0]);
  assert.equal(gateBand(5, 0), 0);
});

test('each gate calls out once per third it loses, never on the fall or after a reset', () => {
  const game = new Game(), cracks = createGateCracks();
  game.dispatch({ type: 'start' });
  const s = game.state;
  assert.deepEqual(cracks(s), []);
  s.enemyHp = s.enemyMaxHp * 0.6;
  assert.deepEqual(cracks(s), [{ side: 'enemy', words: 'THEIR GATE CRACKS' }]);
  assert.deepEqual(cracks(s), [], 'not repeated');
  s.enemyHp = s.enemyMaxHp * 0.7;
  assert.deepEqual(cracks(s), [], 'healing never re-arms a crack');
  s.enemyHp = s.enemyMaxHp * 0.2; s.playerHp = s.playerMaxHp * 0.5;
  assert.deepEqual(cracks(s).map(c => c.words), ['THEIR GATE BUCKLES', 'OUR GATE SHAKES']);
  s.enemyHp = 0;
  assert.deepEqual(cracks(s), [], 'a fallen gate is the result, not a crack');
  game.dispatch({ type: 'retreat' }); game.dispatch({ type: 'retry' }); game.dispatch({ type: 'start' });
  game.state.playerHp = game.state.playerMaxHp * 0.3;
  assert.deepEqual(cracks(game.state).map(c => c.words), ['HOLD THE GATE!'], 'a new battle starts whole; skipping a third names the lower one');
});

test('the battlefield turns gate cracks into callouts, with the camera kick only in full motion', () => {
  const scene = readFileSync('src/view/battlefield-scene.ts', 'utf8');
  assert.match(scene, /for\(const call of \(this\.cracks\?\?=createGateCracks\(\)\)\(game\.state\)\)\{[^\n]*floatText\([^\n]*if\(!this\.reduce\)this\.effects\.cameraKick/);
});
