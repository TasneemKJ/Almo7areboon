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

test('the ask is owed only by a won climax: a first clear or a dusk raid turned back, never a replay, defeat or purchase', async () => {
  const { wonClimax } = await import('../src/ui/app-bridge.ts');
  const first = { pendingVictory: { settlement: 'mastery-v1', newMask: 1 } }, again = { pendingVictory: { settlement: 'mastery-v1', newMask: 0 } };
  assert.equal(wonClimax(first, { phase: 'won' }), true, 'a chapter cleared for the first time');
  assert.equal(wonClimax({ pendingVictory: { settlement: 'mastery-v1', newMask: 6 } }, { phase: 'won' }), false, 'new seals on a chapter already cleared');
  assert.equal(wonClimax(again, { phase: 'won' }), false, 'a replay won again');
  assert.equal(wonClimax({ pendingVictory: { settlement: 'legacy' } }, { phase: 'won' }), false);
  assert.equal(wonClimax({ pendingVictory: null }, { phase: 'won', dusk: { lamps: [] } }), true, 'a dusk raid turned back');
  assert.equal(wonClimax(first, { phase: 'lost' }), false, 'never a defeat');
  const lifecycle = readFileSync(new URL('../src/app/lifecycle.ts', import.meta.url), 'utf8');
  assert.match(lifecycle, /onStoreChange\(\(\)=>\{sessionState\.ratingDue=false;\}\)/, 'a purchase drops an ask still owed');
  assert.match(lifecycle, /function adoptRestoredGame\(restored:Game\)\{\n\s*sessionState\.game=restored;sessionState\.ratingDue=false;/, 'a restored save owes nothing');
});
