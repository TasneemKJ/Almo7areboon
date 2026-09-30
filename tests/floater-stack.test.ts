import test from 'node:test';
import assert from 'node:assert/strict';
import { stackedY } from '../src/view/floater-stack.ts';

const fresh = (x: number, startY: number) => ({ x, startY, life: 0.6, max: 0.62, banner: false });

test('an isolated number keeps its position', () => {
  assert.equal(stackedY([], 200, 100), 100);
  assert.equal(stackedY([fresh(300, 100)], 200, 100), 100, 'far away');
  assert.equal(stackedY([{ ...fresh(200, 100), life: 0.1 }], 200, 100), 100, 'an older number has almost faded');
  assert.equal(stackedY([{ ...fresh(200, 100), banner: true }], 200, 100), 100, 'a banner does not push a number');
});

test('fresh numbers at the same spot stack upward in 12px steps, never past three steps', () => {
  assert.equal(stackedY([fresh(200, 100)], 200, 100), 88);
  assert.equal(stackedY([fresh(200, 100), fresh(205, 88)], 200, 100), 76);
  assert.equal(stackedY([fresh(200, 100), fresh(200, 88), fresh(200, 76), fresh(200, 64)], 200, 100), 76, 'numbers already stacked far above the spot no longer count');
  assert.ok(stackedY(Array.from({ length: 10 }, () => fresh(200, 100)), 200, 100) >= 100 - 36, 'the climb is capped');
});

test('large skill banners stack in 26px steps, at most two', () => {
  const banner = (x: number, startY: number) => ({ ...fresh(x, startY), banner: true, life: 1, max: 1.05 });
  assert.equal(stackedY([], 200, 100, true), 100);
  assert.equal(stackedY([banner(200, 100)], 200, 100, true), 74);
  assert.equal(stackedY([banner(200, 100), banner(200, 74)], 200, 100, true), 48);
  assert.equal(stackedY([banner(200, 100), banner(200, 74), banner(200, 48)], 200, 100, true) >= 48, true, 'never climbs past two steps');
  assert.equal(stackedY([fresh(200, 100)], 200, 100, true), 100, 'a number does not push a banner');
  assert.equal(stackedY([{ ...banner(200, 100), life: 0.2 }], 200, 100, true), 100, 'a banner that has mostly faded does not count');
});
