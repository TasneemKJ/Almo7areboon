import test from 'node:test';
import assert from 'node:assert/strict';
import { gateLanternPlan, paintGateLanterns, type LanternGraphics } from '../src/view/gate-lanterns.ts';

const recorder = () => { const calls: string[] = []; const g = new Proxy({}, { get: (_, name) => (...args: unknown[]) => { calls.push(`${String(name)}(${args.join(',')})`); } }) as LanternGraphics; return { g, calls }; };

test('the lamplighter lights the lanterns one by one, behind the player gate, and reduced motion shows them lit and still', () => {
  const start = gateLanternPlan(300, 0, false);
  assert.equal(start.length, 3);
  assert.ok(start.every(l => l.lit === 0), 'unlit at the first frame');
  assert.ok(start.every(l => l.x < 150 && l.y < 300), 'on the player side, above the ground');
  const mid = gateLanternPlan(300, 1.3, false);
  assert.ok(mid[0].lit === 1 && mid[2].lit === 0, 'lit in order');
  assert.ok(gateLanternPlan(300, 5, false).every(l => l.lit === 1));
  const still = [gateLanternPlan(300, 0, true), gateLanternPlan(300, 9, true)];
  assert.deepEqual(still[0], still[1]);
  assert.ok(still[0].every(l => l.lit === 1 && l.glow === 1));
  assert.ok(gateLanternPlan(Number.NaN, Number.NaN, false).every(l => Number.isFinite(l.x + l.y + l.lit + l.glow)));
});

test('painting clears both layers and draws a halo and a body for every lantern', () => {
  const body = recorder(), glow = recorder();
  paintGateLanterns(body.g, glow.g, gateLanternPlan(300, 9, false));
  assert.equal(body.calls[0], 'clear()'); assert.equal(glow.calls[0], 'clear()');
  assert.equal(glow.calls.filter(c => c.startsWith('fillCircle')).length, 9);
  assert.equal(body.calls.filter(c => c.startsWith('fillTriangle')).length, 3);
});
