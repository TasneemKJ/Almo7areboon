import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import { countUpValue, COUNT_UP_MS } from '../src/ui/count-up.ts';
import { readFileSync } from 'node:fs';

test('count-up rises monotonically from 0 to the exact final value', () => {
  let last = -1;
  for (let t = 0; t <= COUNT_UP_MS; t += 40) { const v = countUpValue(1234, t); assert.ok(v >= last && v <= 1234); last = v; }
  assert.equal(countUpValue(1234, 0), 0);
  assert.equal(countUpValue(1234, COUNT_UP_MS), 1234);
  assert.equal(countUpValue(1234, COUNT_UP_MS * 5), 1234);
});
test('count-up is safe for zero, negative and non-finite values', () => {
  assert.equal(countUpValue(0, 300), 0);
  assert.equal(countUpValue(-5, 300), 0);
  assert.equal(countUpValue(Number.NaN, 300), 0);
});
test('the result keeps the true total in an aria-label and skips the animation under reduced motion', () => {
  const results = readFileSync(new URL('../src/ui/results-screen.ts', import.meta.url), 'utf8');
  assert.match(results, /<strong aria-label="\$\{amount\(state\.earned\)\} coins">/);
  const main = mainSource();
  assert.match(main, /startCountUp\(\$\('modal-layer'\),compactNumber,document\.documentElement\.dataset\.motion==='reduced'\)/);
});
