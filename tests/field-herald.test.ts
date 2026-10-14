import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { createHerald, heraldMoments, HERALD_SECONDS } from '../src/ui/field-herald.ts';
import { fieldControlsHtml } from '../src/ui/field-controls.ts';

const run = (game: Game, seconds: number) => { for (let t = 0; t < seconds; t += 0.1) game.step(0.1); };

test('the herald announces the chapter title once as a battle starts, then clears', () => {
  const game = new Game(), herald = createHerald();
  assert.equal(herald.next(game.profile, game.state), null, 'nothing before the battle runs');
  game.dispatch({ type: 'start' });
  const line = herald.next(game.profile, game.state);
  assert.equal(line?.key, 'title');
  assert.equal(line?.title, 'First Fires');
  assert.match(line!.detail, /Chapter 1 · 5 waves/);
  run(game, HERALD_SECONDS + 0.2);
  assert.equal(herald.next(game.profile, game.state), null);
  assert.equal(herald.next(game.profile, game.state), null, 'a key is never repeated in the same battle');
});

test('a new battle resets what the herald has announced', () => {
  const game = new Game(), herald = createHerald();
  game.dispatch({ type: 'start' }); herald.next(game.profile, game.state);
  game.dispatch({ type: 'retreat' }); game.dispatch({ type: 'retry' }); game.dispatch({ type: 'start' });
  assert.equal(herald.next(game.profile, game.state)?.key, 'title');
});

test('queued moments show one at a time with a gap', () => {
  const game = new Game();
  const herald = createHerald(() => [{ key: 'a', title: 'A', detail: '' }, { key: 'b', title: 'B', detail: '' }]);
  game.dispatch({ type: 'start' });
  assert.equal(herald.next(game.profile, game.state)?.key, 'a');
  run(game, HERALD_SECONDS + 0.05);
  assert.equal(herald.next(game.profile, game.state), null, 'one empty frame restarts the stamp');
  assert.equal(herald.next(game.profile, game.state)?.key, 'b');
  assert.deepEqual(heraldMoments(game.profile, { ...game.state, phase: 'won' }), []);
});

test('the herald is a non-interactive live text in the field and has a reduced-motion still', () => {
  assert.match(fieldControlsHtml(), /id="field-herald"[^>]*aria-live="polite"[^>]*hidden/);
  const css = readFileSync('src/ui/storybook-pass.css', 'utf8');
  assert.match(css, /\.field-herald\{[^}]*pointer-events:none/);
  assert.match(css, /:root\[data-motion="full"\] \.field-herald\{animation/);
  assert.match(readFileSync('src/main.ts', 'utf8'), /import '\.\/ui\/storybook-pass\.css';/);
});

test('the last wave is heralded once, when the final wave sets out', () => {
  const game = new Game(), herald = createHerald();
  game.profile.wins = 5; // seasoned: no volley introduction in this sequence
  game.dispatch({ type: 'start' });
  const seen: string[] = [];
  for (let t = 0; t < 70 && game.state.phase === 'running'; t += 0.1) {
    game.state.playerHp = game.state.playerMaxHp; // keep the gate standing; only the schedule matters here
    game.step(0.1);
    const line = herald.next(game.profile, game.state);
    if (line && seen.at(-1) !== line.key) seen.push(line.key);
    if (line?.key === 'last-wave') assert.ok(game.state.wave >= game.state.totalWaves);
  }
  assert.deepEqual(seen, ['title', 'last-wave', 'harvest-moon']);
});
