import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { baseUpgradeCost, foodUpgradeCost } from '../src/game/data.ts';
import { campCounsel, followCounsel } from '../src/game/counsel.ts';
import type { UnitKind } from '../src/game/types.ts';

const profileWith = (fields: Record<string, unknown>) => Object.assign(defaultProfile(), fields);

test('counsel names the storehouse first: food is what wins the early chapters', () => {
  assert.deepEqual(campCounsel(profileWith({ coins: 560, enemyAge: 1, furthestBattle: 1 })), { station: 'storehouse' });
  assert.equal(campCounsel(profileWith({ coins: 0 })), null, 'nothing affordable, nothing lit');
  assert.equal(campCounsel(profileWith({ coins: Math.min(foodUpgradeCost(defaultProfile()), baseUpgradeCost(defaultProfile())) - 1 })), null);
});

test('counsel moves on once food leads the gate, and never names what is already owned', () => {
  assert.deepEqual(campCounsel(profileWith({ coins: 10_000, foodLevel: 4, baseLevel: 0 })), { station: 'gate' }, 'the gate follows the first bread');
  const ahead = profileWith({ coins: 10_000, foodLevel: 4, baseLevel: 2 });
  assert.deepEqual(campCounsel(ahead), { station: 'company', kind: 1 });
  ahead.unlocked = [true, true, true];
  assert.deepEqual(campCounsel(ahead), { station: 'storehouse' });
  ahead.foodLevel = 6; ahead.baseLevel = 2;
  assert.deepEqual(campCounsel(ahead), { station: 'gate' });
});

test('following counsel only spends through the game rules and stops when nothing is affordable', () => {
  const game = new Game(profileWith({ coins: 560, enemyAge: 1, furthestBattle: 1 }));
  const bought = followCounsel(game);
  assert.ok(bought >= 3, `bought ${bought}`);
  assert.ok(game.profile.foodLevel >= 3, 'food first');
  assert.equal(campCounsel(game.profile), null);
  assert.ok(game.profile.coins >= 0);
});

// The chapter 2 wall from ios/store/GATE.md: a slow, cold tapper (0.75 taps/s, no skills beyond a dry-food order) who
// keeps pressing Retry never wins. One who follows the lit station in Camp must win within two tries.
function fight(game: Game, seed: number): boolean {
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  game.dispatch({ type: 'start' });
  const gap = 1 / 0.75; let next = rnd() * gap, n = 0;
  for (let t = 0; game.state.phase === 'running' && t < 300; t += 0.1) {
    if (t >= next) {
      const kinds = ([0, 1, 2] as UnitKind[]).filter(k => game.profile.unlocked[k]);
      for (let j = 0; j < kinds.length; j++) if (game.dispatch({ type: 'spawn', kind: kinds[(n + j) % kinds.length] })) { n += j + 1; break; }
      if (game.state.food < 3) game.dispatch({ type: 'skill', skill: 'food' });
      next += gap * (0.8 + rnd() * 0.4);
    }
    game.step(0.1); game.drainEvents();
  }
  return game.state.phase === 'won';
}
test('a slow cold tapper who follows the counsel wins chapter 2 within two tries', () => {
  for (const seed of [1, 7, 42]) {
    const game = new Game();
    assert.ok(fight(game, seed), 'chapter 1 is won on the first try');
    game.dispatch({ type: 'next' });
    assert.equal(game.profile.enemyAge, 1);
    let won = false;
    for (let attempt = 0; attempt < 2 && !won; attempt++) {
      followCounsel(game);
      won = fight(game, seed + attempt + 1);
      if (!won) game.dispatch({ type: 'retry' });
    }
    assert.ok(won, `seed ${seed}`);
  }
});
