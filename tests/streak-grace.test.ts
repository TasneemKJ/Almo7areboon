import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { dailyReward, graceAvailable } from '../src/game/data.ts';
import { decodeSave, defaultProfile } from '../src/game/save.ts';
import { startOverProfile } from '../src/game/reset.ts';

function streakOf(days: number[]) { const g = new Game(); for (const day of days) assert.equal(g.dispatch({ type: 'daily', day }), true); return g; }

test('one missed day keeps a streak of two or more and records the grace day', () => {
  const g = streakOf([100, 101]);
  assert.equal(graceAvailable(g.profile, 103), true);
  assert.equal(dailyReward(g.profile, 103).graced, true);
  assert.equal(g.dispatch({ type: 'daily', day: 103 }), true);
  assert.equal(g.profile.dailyStreak, 3);
  assert.equal(g.profile.graceDay, 103);
});
test('grace is not offered for streak one, a two-day gap, or within seven days of the last use', () => {
  assert.equal(dailyReward(streakOf([100]).profile, 102).streak, 1);
  const g = streakOf([100, 101]);
  assert.equal(dailyReward(g.profile, 104).streak, 1, 'two missed days restart');
  g.dispatch({ type: 'daily', day: 103 });
  g.dispatch({ type: 'daily', day: 104 });
  assert.equal(dailyReward(g.profile, 106).streak, 1, 'second grace inside a week restarts');
  assert.equal(dailyReward(g.profile, 106).graced, false);
  g.dispatch({ type: 'daily', day: 105 }); g.dispatch({ type: 'daily', day: 106 }); g.dispatch({ type: 'daily', day: 107 }); g.dispatch({ type: 'daily', day: 108 }); g.dispatch({ type: 'daily', day: 109 });
  assert.equal(dailyReward(g.profile, 111).graced, true, 'a week later it returns');
});
test('graceDay is optional, normalized and kept by Start over', () => {
  assert.equal('graceDay' in defaultProfile(), false);
  const g = streakOf([100, 101, 103]);
  assert.equal(decodeSave(JSON.stringify(g.profile)).profile?.graceDay, 103);
  for (const bad of [0, -3, 1.5, 'x', null, 999999, {}]) {
    const raw = { ...g.profile, graceDay: bad };
    assert.equal('graceDay' in (decodeSave(JSON.stringify(raw)).profile ?? {}), false, String(bad));
  }
  assert.equal(startOverProfile(g.profile).graceDay, 103);
  assert.equal('graceDay' in startOverProfile(defaultProfile()), false);
});
