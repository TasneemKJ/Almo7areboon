import test from 'node:test';
import assert from 'node:assert/strict';
import { stackedY } from '../src/view/floater-stack.ts';

const fresh = (x: number, startY: number) => ({ x, startY, life: 0.6, max: 0.62, banner: false });

test('an isolated number keeps its position', () => {
  assert.equal(stackedY([], 200, 100), 100);
  assert.equal(stackedY([fresh(300, 100)], 200, 100), 100, 'far away');
  assert.equal(stackedY([{ ...fresh(200, 100), life: 0.1 }], 200, 100), 100, 'an older number has almost faded');
  assert.equal(stackedY([{ ...fresh(200, 100), banner: true }], 200, 100), 100, 'banners are ignored');
});

test('fresh numbers at the same spot stack upward in 12px steps, never past three steps', () => {
  assert.equal(stackedY([fresh(200, 100)], 200, 100), 88);
  assert.equal(stackedY([fresh(200, 100), fresh(205, 88)], 200, 100), 76);
  assert.equal(stackedY([fresh(200, 100), fresh(200, 88), fresh(200, 76), fresh(200, 64)], 200, 100), 76, 'numbers already stacked far above the spot no longer count');
  assert.ok(stackedY(Array.from({ length: 10 }, () => fresh(200, 100)), 200, 100) >= 100 - 36, 'the climb is capped');
});
