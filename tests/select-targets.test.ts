import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// WebKit draws a native select with appearance:menulist at its own ~20px height and ignores min-height; the geometry
// gate (scripts/qa-gate/geometry.mjs) measured 21px for Language, Battle speed, Motion and the opening's Story picker.
test('every select is drawn by the game (appearance:none) so its 44px min-height holds', () => {
  const css = readFileSync(new URL('../src/ui/selects.css', import.meta.url), 'utf8');
  assert.match(css, /select\{[^}]*-webkit-appearance:none[^}]*appearance:none[^}]*min-height:44px/);
  assert.match(css, /\[dir="rtl"\] select|:root\[dir="rtl"\] select|\[dir=rtl\] select/, 'the caret moves to the left in Arabic');
  assert.match(readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8'), /import '\.\/ui\/selects\.css';/);
});

// On a 375x667 screen the geometry gate found the first recruit's "3 food" label under the second recruit's hit circle,
// so a tap on the label would have recruited the other troop. Earlier recruits sit above later ones.
test('a recruit and its cost label sit above the next recruit, so the label taps its own troop', () => {
  const css = readFileSync(new URL('../src/ui/world-play.css', import.meta.url), 'utf8');
  for (const [kind, z] of [[0, 3], [1, 2], [2, 1]]) assert.match(css, new RegExp(`\\.recruit-hit\\[data-field-recruit="${kind}"\\]\\{z-index:${z}\\}`));
});
