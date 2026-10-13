// Structural regression only; browser/game acceptance is a separate gate.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const css = readFileSync(new URL('../src/ui/landscape-rail.css', import.meta.url), 'utf8');

test('scrolling deployment rail uses safe centering after a start fallback', () => {
  const rule = css.match(/:root \.deployment \{([^}]+)\}/)?.[1];
  assert.ok(rule);
  assert.match(rule, /overflow-y:auto/);
  assert.match(rule, /justify-content:flex-start; justify-content:safe center/);
});
