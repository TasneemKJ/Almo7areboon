import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fieldTapOrder, DIRECT_ORDER_MAX_TRAVEL } from '../src/ui/battlefield-orders.ts';

const field = { left: 0, top: 100, width: 390, height: 400 };
const tap = (x: number, y = 300, dx = 0, dy = 0) => fieldTapOrder({ startX: x, startY: y, endX: x + dx, endY: y + dy }, field);

test('a tap on the open field plants the banner: the rival half Advances, your own half Holds', () => {
  assert.equal(tap(380), 'advance'); assert.equal(tap(196), 'advance'); assert.equal(tap(195), 'advance', 'the middle belongs to the advance');
  assert.equal(tap(194), 'hold'); assert.equal(tap(10), 'hold');
  assert.equal(tap(300, 300, DIRECT_ORDER_MAX_TRAVEL, 0), 'advance', 'a shaky tap still counts');
});

test('drags, taps outside the field and broken numbers are not orders', () => {
  assert.equal(tap(300, 300, DIRECT_ORDER_MAX_TRAVEL + 2, 0), null);
  assert.equal(tap(300, 90), null); assert.equal(tap(300, 520), null); assert.equal(tap(-4), null);
  assert.equal(fieldTapOrder({ startX: NaN, startY: 1, endX: 1, endY: 1 }, field), null);
  assert.equal(fieldTapOrder({ startX: 1, startY: 1, endX: 1, endY: 1 }, { ...field, width: 0 }), null);
});

test('field mode routes a tap through the simulation and answers a short momentum with the banner, never filtering pointers by sign', () => {
  const listeners = readFileSync(new URL('../src/app/listeners.ts', import.meta.url), 'utf8');
  assert.match(listeners, /if\(fieldControls\.isOpen\(\)\)\{fieldControls\.clear\(\);return;\}/, 'an open tactical choice closes first');
  assert.match(listeners, /fieldTapOrder\(/); assert.match(listeners, /ports\.action\(\{type:'order',order\}\)/);
  assert.match(listeners, /banner\.dataset\.wait='true';banner\.classList\.add\('wanting'\)/);
  assert.doesNotMatch(listeners, /pointerId\s*[<>]=?\s*0|pointerId\s*>=\s*0/);
});
