import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Owner play-test 2026-11-13: the recruit stood on the grass like scenery, Hold/Advance answered taps over the gates
// while nothing was drawn there. Battle controls now live in one tray at the bottom: orders, food, and each troop as a
// card with portrait, name, role and cost; nothing invisible takes a tap.
const css = readFileSync(new URL('../src/ui/field-tray.css', import.meta.url), 'utf8');
test('in battle the deployment tray is shown under the field, and the invisible gate and recruit hit areas are gone', () => {
  assert.match(css, /#app\[data-field-mode="field"\]\[data-entry="play"\] \.battle-view\{display:grid!important;grid-template-rows:minmax\(0,1fr\) auto/);
  assert.match(css, /\.battle-view>\.deployment\{display:block!important/);
  assert.match(css, /#app\[data-field-mode="field"\] \.recruit-hit,#app\[data-field-mode="field"\] \.gate-hit\{display:none!important\}/);
  assert.match(css, /\.unit-card\{[^}]*min-height:56px/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.enemy-hit::before\{/, 'the select-enemy target draws a visible ring');
  assert.match(readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8'), /import '\.\/ui\/field-tray\.css';/);
});

test('the first instruction points at the field itself, not at a defender on the grass or a menu', async () => {
  const src = readFileSync(new URL('../src/ui/field-guidance.ts', import.meta.url), 'utf8') + readFileSync(new URL('../src/ui/battle-hud.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /waiting defender|المدافع المنتظر/);
  assert.match(src, /Tap the field to send your first troop/);
});

test('the tray cards show the painted troop portraits, not the old vector icons', () => {
  const runtime = readFileSync(new URL('../src/app/runtime.ts', import.meta.url), 'utf8');
  assert.match(runtime, /import \{[^}]*unitPortrait[^}]*\} from '\.\.\/view\/unit-illustrations\.ts'/);
});
