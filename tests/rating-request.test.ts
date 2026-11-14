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

test('the ask is owed only by a won climax, a chapter boss won: never a replay, a side fight, a defeat or a purchase', async () => {
  const { wonClimax } = await import('../src/ui/app-bridge.ts');
  const first = { pendingVictory: { settlement: 'mastery-v1', newMask: 1 } }, again = { pendingVictory: { settlement: 'mastery-v1', newMask: 0 } };
  assert.equal(wonClimax(first, { phase: 'won' }), true, 'a chapter cleared for the first time');
  assert.equal(wonClimax({ pendingVictory: { settlement: 'mastery-v1', newMask: 6 } }, { phase: 'won' }), false, 'new seals on a chapter already cleared');
  assert.equal(wonClimax(again, { phase: 'won' }), false, 'a replay won again');
  assert.equal(wonClimax({ pendingVictory: { settlement: 'legacy' } }, { phase: 'won' }), false);
  assert.equal(wonClimax({ pendingVictory: null }, { phase: 'won', dusk: { lamps: [] } }), false, 'a dusk raid is a side fight, not a chapter boss (1.3)');
  assert.equal(wonClimax(first, { phase: 'won', dusk: { lamps: [] } }), false);
  const expedition = (stage: number, expeditionsWon = 0) => ({ ...first, chronicle: { expedition: { stage }, expeditionsWon } });
  assert.equal(wonClimax(expedition(0), { phase: 'won' }), false, 'an expedition\'s first stage, even on a chapter not cleared before');
  assert.equal(wonClimax(expedition(1), { phase: 'won' }), false, 'nor its second');
  assert.equal(wonClimax(expedition(2), { phase: 'won' }), true, 'its finale, the Bell Keeper, is a chapter boss');
  assert.equal(wonClimax(expedition(2, 1), { phase: 'won' }), false, 'the first one beaten only');
  assert.equal(wonClimax({ ...first, chronicle: { expedition: null, expeditionsWon: 3 } }, { phase: 'won' }), true, 'the road\'s first clear, with the storybook on');
  assert.equal(wonClimax(first, { phase: 'lost' }), false, 'never a defeat');
  assert.equal(wonClimax(expedition(2), { phase: 'lost' }), false);
  const lifecycle = readFileSync(new URL('../src/app/lifecycle.ts', import.meta.url), 'utf8');
  assert.match(lifecycle, /onStoreChange\(\(\)=>\{sessionState\.ratingDue=false;\}\)/, 'a purchase drops an ask still owed');
  assert.match(lifecycle, /function adoptRestoredGame\(restored:Game\)\{\n\s*sessionState\.game=restored;sessionState\.ratingDue=false;/, 'a restored save owes nothing');
});

test('a launch owes no rating: a restored won result arrives without a battle batch, so nothing sets the ask', async () => {
  const { Game } = await import('../src/game/simulation.ts');
  const { defaultProfile, decodeSave } = await import('../src/game/save.ts');
  const p = defaultProfile(); Object.assign(p, { played: true });
  const game = new Game(p); game.dispatch({ type: 'start' });
  for (let t = 0; game.state.phase === 'running' && t < 200; t += 0.1) { game.dispatch({ type: 'spawn', kind: 0 }); game.step(0.1); }
  assert.equal(game.state.phase, 'won');
  assert.ok(game.drainEvents().some(e => e.type === 'win'), 'the battle itself sends the win');
  const relaunched = new Game(decodeSave(JSON.stringify(game.profile)).profile!);
  assert.equal(relaunched.state.phase, 'won', 'the app relaunches into the won result');
  assert.equal(relaunched.drainEvents().some(e => e.type === 'win'), false, 'with no win event, so lifecycle events() never sets ratingDue');
  const lifecycle = readFileSync(new URL('../src/app/lifecycle.ts', import.meta.url), 'utf8');
  assert.equal((lifecycle.match(/sessionState\.ratingDue=true/g) ?? []).length, 1, 'the ask is owed in one place only');
  assert.match(lifecycle, /else if\(batch\.some\(event=>event\.type==='win'\)&&wonClimax\(sessionState\.game\.profile,sessionState\.game\.state\)\)sessionState\.ratingDue=true;/);
});
