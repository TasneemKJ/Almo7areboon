import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { askForRatingAfter } from '../src/ui/app-bridge.ts';

const bridge = (inApp = true) => { const calls: string[] = []; return { calls, inApp, requestReview() { calls.push('review'); return true; } }; };

test('a rating is asked only after a victory, in the app', () => {
  const app = bridge();
  assert.equal(askForRatingAfter([{ type: 'hit' }, { type: 'win' }], app), true); assert.deepEqual(app.calls, ['review']);
  for (const batch of [[{ type: 'lose' }], [{ type: 'hit' }], [], [{ type: 'evolve' }], [{ type: 'summon' }]]) assert.equal(askForRatingAfter(batch, app), false);
  assert.deepEqual(app.calls, ['review'], 'never after a defeat, a purchase or anything else');
  const web = bridge(false); assert.equal(askForRatingAfter([{ type: 'win' }], web), false); assert.deepEqual(web.calls, []);
});

test('the vendored bridge is the engine copy with requestReview, and the lifecycle asks only from the battle batch', () => {
  const vendored = readFileSync(new URL('../src/vendor/tas-bridge.js', import.meta.url), 'utf8');
  assert.match(vendored, /requestReview\(\) \{ return this\.post\('requestReview'\); \}/);
  const lifecycle = readFileSync(new URL('../src/app/lifecycle.ts', import.meta.url), 'utf8');
  assert.equal((lifecycle.match(/askForRatingAfter\(/g) ?? []).length, 1);
  assert.doesNotMatch(readFileSync(new URL('../src/app/store-flow.ts', import.meta.url), 'utf8'), /requestReview|askForRating/);
});
