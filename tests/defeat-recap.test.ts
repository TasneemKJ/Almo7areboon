import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { battleStats } from '../src/game/statistics.ts';
import { defeatRecapHtml } from '../src/ui/results-screen.ts';

test('player damage is credited to the attacking troop role', () => {
  const g = new Game(defaultProfile());
  g.dispatch({ type: 'start' });
  g.state.food = 99;
  g.dispatch({ type: 'spawn', kind: 0 });
  for (let i = 0; i < 1500 && g.state.phase === 'running'; i++) g.step(0.1);
  const ledger = g.state.stats.damageByKind;
  assert.ok(ledger, 'ledger exists after a fight');
  assert.ok(ledger![0] > 0);
  assert.equal(ledger![1], 0);
  assert.equal(ledger![2], 0);
});
test('defeat recap names the top role, only on defeat, and survives a hostile save', () => {
  const g = new Game(defaultProfile());
  g.state.stats.damageByKind = [30, 10, 60];
  g.state.phase = 'lost';
  const html = defeatRecapHtml(0, g.state);
  assert.match(html, /60%/);
  g.state.phase = 'won';
  assert.equal(defeatRecapHtml(0, g.state), '');
  g.state.phase = 'lost'; g.state.stats.damageByKind = [0, 0, 0];
  assert.equal(defeatRecapHtml(0, g.state), '');
  delete g.state.stats.damageByKind;
  assert.equal(defeatRecapHtml(0, g.state), '');
  const clean = battleStats({ damageByKind: [1, -5, 'x'] });
  assert.deepEqual(clean.damageByKind, [1, 0, 0]);
  assert.equal(battleStats({}).damageByKind, undefined);
});
