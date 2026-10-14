import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { CALL_MIN_SECONDS } from '../src/game/wave-call.ts';
import { callCoins } from '../src/ui/field-volley.ts';
import { fieldControlsHtml } from '../src/ui/field-controls.ts';

const run = (game: Game, seconds: number) => { for (let i = 0; i < Math.round(seconds * 60); i++) { game.state.playerHp = game.state.playerMaxHp; game.step(1 / 60); } };

test('calling the next wave early brings it now and pays coins for the seconds saved', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  run(game, 5); // First Fires: wave 1 at 3s is out; wave 2 is due at 14s
  game.state.units = [];
  const seconds = game.callableSeconds();
  assert.ok(Math.abs(seconds - 9) < 0.05, `${seconds}`);
  const expected = callCoins(game.profile, seconds), coins = game.profile.coins, earned = game.state.earned;
  const before = game.waveStatus().preview!;
  assert.equal(game.dispatch({ type: 'call-wave' }), true);
  assert.equal(game.profile.coins - coins, expected);
  assert.equal(game.state.earned - earned, expected, 'counted in the battle earnings');
  run(game, 0.1);
  assert.equal(game.state.wave, before.number, 'the called wave set out at once');
  const next = game.waveStatus().preview!;
  assert.ok(Math.abs(next.nextIn - (24 - 14) + 0.1) < 0.1, 'later waves keep their spacing');
});

test('no call while an earlier wave is still arriving, when the next is close, paused, or after the last wave', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  run(game, 14.2); // wave 2 has two members; the second arrives 0.4s later
  assert.equal(game.callableSeconds(), 0, 'a member of the current wave is still arriving');
  run(game, 0.4);
  game.state.paused = true;
  assert.equal(game.dispatch({ type: 'call-wave' }), false);
  game.state.paused = false;
  run(game, 24 - 14.6 - CALL_MIN_SECONDS + 0.5);
  assert.equal(game.callableSeconds(), 0, 'too close to bother');
  game.state.wave = game.state.totalWaves;
  assert.equal(game.dispatch({ type: 'call-wave' }), false);
});

test('a new battle restores the authored schedule', () => {
  const game = new Game();
  game.dispatch({ type: 'start' }); run(game, 5); game.state.units = [];
  game.dispatch({ type: 'call-wave' });
  game.dispatch({ type: 'retreat' }); game.dispatch({ type: 'retry' }); game.dispatch({ type: 'start' });
  assert.ok(Math.abs(game.waveStatus().preview!.nextIn - 3) < 1e-9);
});

test('the call is a labelled field button over the road omen', () => {
  assert.match(fieldControlsHtml(), /<button id="field-call" class="world-hit call-hit" data-command="field-call"[^>]*hidden>/);
  assert.match(readFileSync('src/app/listeners.ts', 'utf8'), /command==='field-call'\)\{ports\.action\(\{type:'call-wave'\}\)/);
});
