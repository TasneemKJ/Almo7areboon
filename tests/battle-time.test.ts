import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave } from '../src/game/save.ts';
import { chronicleGuidance, chronicleOutcome } from '../src/game/chronicle-combat.ts';
import { masteryEligibleMask } from '../src/game/mastery.ts';
import { masteryAttemptText } from '../src/ui/mastery-presentation.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';

function watchGame() {
  const profile = defaultProfile();
  profile.baseLevel = 100; // Survive the full watch using the normal simulation and enemy schedule.
  const game = new Game(profile);
  assert.equal(game.dispatch({ type: 'chronicle-route', route: 'watch', battle: 0 }), true);
  assert.equal(game.dispatch({ type: 'start' }), true);
  return game;
}

for (const dt of [1 / 60, 0.1, 0.25]) {
  test(`the watch wins at 75 seconds, not one tick later (frame input ${dt})`, () => {
    const game = watchGame(), steps = Math.round(75 / dt);
    for (let i = 0; i < steps - 1; i++) game.step(dt);
    assert.equal(game.state.phase, 'running', 'must not end before the deadline');
    game.step(dt);
    assert.equal(game.state.phase, 'won', 'the inclusive watch deadline is exactly 75 seconds');
    assert.ok(Math.abs(game.state.time - 75) < 1e-9);
    assert.ok(game.profile.mastery!.chapters[0].earnedMask & 4, 'the on-time watch earns its timed seal');
    const receipt = game.profile.pendingVictory;
    assert.ok(receipt && receipt.settlement === 'mastery-v1');
    assert.ok(receipt.newMask & 4);
    assert.match(chronicleGuidance(game.profile, game.state), /0 seconds left$/);
    assert.match(masteryAttemptText(game.profile, game.state), /Attempt: 1:15/);
    assert.match(resultsHtml(game.profile, game.state), /<dt>Battle time<\/dt><dd>1:15<\/dd>/);
    const before = JSON.stringify(game.profile);
    game.step(0.25);
    assert.equal(JSON.stringify(game.profile), before, 'post-result ticks cannot award again');
    const decoded = decodeSave(before);
    assert.equal(decoded.problem, null);
    assert.ok(decoded.profile, 'Expected a valid victory save');
    const resumed = new Game(decoded.profile);
    assert.equal(resumed.state.phase, 'won');
    assert.equal(resumed.profile.coins, game.profile.coins);
    assert.equal(resumed.profile.gems, game.profile.gems);
    assert.equal(resumed.profile.wins, game.profile.wins);
    assert.deepEqual(resumed.profile.pendingVictory, game.profile.pendingVictory);
  });
}

test('the timed seal tolerates roundoff, but not a genuinely late victory', () => {
  const state = new Game().state;
  state.phase = 'won';
  for (const time of [75 - 5e-12, 75, 75 + 5e-12]) {
    state.time = time;
    assert.ok(masteryEligibleMask(0, state) & 4, `inclusive boundary at ${time}`);
  }
  for (const time of [75.0001, 75 + 1 / 60, 76]) {
    state.time = time;
    assert.equal(masteryEligibleMask(0, state) & 4, 0, `late boundary at ${time}`);
  }
  state.stats.skillsCast = 1 + 5e-12;
  assert.equal(masteryEligibleMask(2, state) & 4, 0, 'count objectives are not time measurements');
});

test('result and mastery clocks agree at accumulated second and minute boundaries', () => {
  const game = new Game();
  game.state.phase = 'lost';
  for (const [time, display] of [[60 - 5e-12, '1:00'], [75 - 5e-12, '1:15'], [59.99, '0:59']] as const) {
    game.state.time = time;
    assert.ok(masteryAttemptText(game.profile, game.state).includes(`Attempt: ${display}`));
    assert.ok(resultsHtml(game.profile, game.state).includes(`<dt>Battle time</dt><dd>${display}</dd>`));
  }
});

test('a completed lantern displays all eighteen seconds rather than seventeen', () => {
  const profile = defaultProfile();
  profile.chronicle!.clears[0] = 1; // An already cleared road unlocks this optional mission.
  const game = new Game(profile);
  assert.equal(game.dispatch({ type: 'chronicle-route', route: 'lantern', battle: 0 }), true);
  const story = game.state.chronicle!;
  game.state.phase = 'won';
  game.state.enemyHp = 0;
  story.landmark.owner = 'player';
  story.landmark.capture = 3;
  story.lightSeconds = 18 - 5e-12;
  assert.equal(chronicleOutcome(game.profile, game.state), 'won');
  assert.match(chronicleGuidance(game.profile, game.state), /Lantern 18\/18 seconds/);
});
