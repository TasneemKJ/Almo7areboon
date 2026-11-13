import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sideRing, sideTint, SIDE_COLOURS } from '../src/view/side-identity.ts';

// Owner play-test 2026-11-13: in the first chapter both companies are the same painted troop and read as one crowd.
test('the rival company wears a warm rust cast and stands on an ember ring; yours stays true-coloured on a lamp-blue ring', () => {
  assert.equal(sideTint('player'), null, 'your painted troops keep their own colours');
  const rust = sideTint('enemy')!;
  const [r, g, b] = [(rust >> 16) & 255, (rust >> 8) & 255, rust & 255];
  assert.ok(r > 230 && g < 190 && b < 170, 'a clear warm cast, not the old near-white 0xffd9b5');
  const mine = sideRing('player', 1, false), theirs = sideRing('enemy', 1, false);
  assert.equal(mine.color, SIDE_COLOURS.player); assert.equal(theirs.color, SIDE_COLOURS.enemy);
  assert.ok(mine.alpha >= .6 && theirs.alpha >= .6, 'readable at a glance');
  assert.ok(sideRing('enemy', 1, true).color !== theirs.color, 'frozen shows the frost colour');
});

test('troops are painted with the side tint and ring, and the base bars use the same two colours', () => {
  const paint = readFileSync(new URL('../src/view/battlefield-troop-paint.ts', import.meta.url), 'utf8');
  assert.match(paint, /sideRing\(unit\.side/);
  assert.match(paint, /sideTint\(unit\.side\)/);
  assert.doesNotMatch(paint, /0xffd9b5/);
});
