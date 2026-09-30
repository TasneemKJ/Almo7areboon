import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { ERAS, QUESTS, dailyReward, localDay, cardBonus, foodRate, foodUpgradeCost, baseUpgradeCost } from '../src/game/data.ts';
import { defaultProfile, loadProfile, saveProfile, SAVE_KEY } from '../src/game/save.ts';
import type { Unit } from '../src/game/types.ts';

function advance(game: Game, seconds: number) {
  for (let i = 0; i < Math.round(seconds * 60); i++) game.step(1 / 60);
}

function unit(id: number, side: 'player' | 'enemy', x: number, hp = 26, kind: 0 | 1 | 2 = 0): Unit {
  return { id, side, kind, age: 0, x, lane: 0, hp, maxHp: hp, attackTimer: 0, attacking: false, hitFlash: 0 };
}

 test('ready battle waits for start; food is spent once and locked units cannot deploy', () => {
  const game = new Game();
  advance(game, 2);
  assert.equal(game.state.food, 6);
  assert.equal(game.state.time, 0);
  assert.equal(game.dispatch({ type: 'spawn', kind: 0 }), false);
  assert.equal(game.dispatch({ type: 'start' }), true);
  assert.equal(game.dispatch({ type: 'spawn', kind: 1 }), false);
  assert.equal(game.dispatch({ type: 'spawn', kind: 0 }), true);
  assert.equal(game.dispatch({ type: 'spawn', kind: 0 }), true);
  assert.equal(game.dispatch({ type: 'spawn', kind: 0 }), false);
  assert.equal(game.state.food, 0);
  assert.equal(game.profile.deployed, 2);
  advance(game, 2);
  assert.ok(Math.abs(game.state.food - 1.6) < 0.02);
});

 test('pause freezes all battle state and rejects combat actions', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.dispatch({ type: 'pause' });
  const before = JSON.stringify(game.state);
  advance(game, 10);
  assert.equal(JSON.stringify(game.state), before);
  assert.equal(game.dispatch({ type: 'spawn', kind: 0 }), false);
  assert.equal(game.dispatch({ type: 'skill', skill: 'food' }), false);
  game.dispatch({ type: 'pause' });
  advance(game, 1);
  assert.ok(game.state.time > 0.9);
});

 test('invalid delta time never corrupts a battle', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  for (const dt of [NaN, Infinity, -1, 0]) game.step(dt);
  assert.equal(game.state.time, 0);
  assert.equal(game.state.food, 6);
});

 test('friendly bodies cannot overtake or overlap in their lane', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.state.units = [unit(90, 'player', 300, 100, 2), unit(91, 'player', 265)];
  advance(game, 2);
  const [front, rear] = game.state.units;
  assert.ok(front.x - rear.x >= 21.9);
});

 test('ranged units attack at a distance and defeated targets cannot retaliate', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.state.units = [unit(90, 'player', 450, 20, 1), unit(91, 'enemy', 535, 1)];
  advance(game, 0.1);
  assert.equal(game.state.units.filter(u => u.side === 'enemy').length, 0);
  assert.equal(game.state.units[0].hp, 20);
  assert.equal(game.profile.kills, 1);
  assert.ok(game.profile.coins > 0);
  const coins = game.profile.coins;
  advance(game, 0.5);
  assert.equal(game.profile.coins, coins);
});

 test('dead units are removed before attacking and cannot deal damage', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.state.units = [unit(90, 'enemy', 150, 0), unit(91, 'player', 145, 20)];
  advance(game, 0.1);
  assert.equal(game.state.units.find(u => u.id === 91)?.hp, 20);
});

 test('finite enemy waves produce a loss without player deployment', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  advance(game, 240);
  assert.equal(game.state.phase, 'lost');
  assert.equal(game.state.playerHp, 0);
  assert.ok(game.state.wave <= game.state.totalWaves);
  assert.equal(game.dispatch({ type: 'next' }), false);
});

 test('victory pays exactly once and battle damage earnings survive retry', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.state.enemyHp = 1;
  game.state.units = [unit(90, 'player', 900)];
  advance(game, 0.1);
  assert.equal(game.state.phase, 'won');
  assert.equal(game.profile.wins, 1);
  assert.ok(game.profile.coins >= 120);
  const wallet = game.profile.coins;
  advance(game, 20);
  assert.equal(game.profile.coins, wallet);
  assert.equal(game.dispatch({ type: 'start' }), false);
  assert.equal(game.dispatch({ type: 'next' }), true);
  assert.equal(game.profile.enemyAge, 1);
  assert.equal(game.state.phase, 'ready');
  assert.equal(game.profile.coins, wallet);
  assert.equal(game.dispatch({ type: 'next' }), false);
});

 test('retry preserves earnings and resets battle-only resources and skills', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.dispatch({ type: 'skill', skill: 'food' });
  game.state.units = [unit(90, 'player', 450, 26), unit(91, 'enemy', 465, 1)];
  advance(game, 0.1);
  const coins = game.profile.coins;
  game.state.playerHp = 0;
  advance(game, 0.1);
  assert.equal(game.dispatch({ type: 'retry' }), true);
  assert.equal(game.state.phase, 'ready');
  assert.equal(game.state.food, 6);
  assert.equal(game.state.units.length, 0);
  assert.deepEqual(game.state.skillsUsed, []);
  assert.equal(game.profile.coins, coins);
});

 test('skills can be used once each; freeze pauses enemy motion but not food', () => {
  const game = new Game();
  game.dispatch({ type: 'start' });
  game.state.units = [unit(90, 'enemy', 600)];
  assert.equal(game.dispatch({ type: 'skill', skill: 'freeze' }), true);
  assert.equal(game.dispatch({ type: 'skill', skill: 'freeze' }), false);
  advance(game, 1);
  assert.equal(game.state.units[0].x, 600);
  assert.ok(game.state.food > 6);
  assert.equal(game.dispatch({ type: 'skill', skill: 'food' }), true);
  assert.equal(game.dispatch({ type: 'skill', skill: 'food' }), false);
  assert.ok(game.state.food >= 16);
  assert.equal(game.dispatch({ type: 'skill', skill: 'meteor' }), true);
  assert.equal(game.dispatch({ type: 'skill', skill: 'meteor' }), false);
});

 test('purchases enforce funds and consume their prices only once', () => {
  const game = new Game();
  assert.equal(game.dispatch({ type: 'unlock', kind: 1 }), false);
  game.profile.coins = 1000;
  assert.equal(game.dispatch({ type: 'unlock', kind: 1 }), true);
  assert.equal(game.profile.coins, 850);
  assert.equal(game.dispatch({ type: 'unlock', kind: 1 }), false);
  assert.equal(game.dispatch({ type: 'unlock', kind: 2 }), true);
  assert.equal(game.profile.coins, 450);
  const rate = foodRate(game.profile);
  const foodCost = foodUpgradeCost(game.profile);
  assert.equal(game.dispatch({ type: 'upgrade', stat: 'food' }), true);
  assert.equal(game.profile.coins, 450 - foodCost);
  assert.ok(foodRate(game.profile) > rate);
  const hp = game.state.playerMaxHp;
  const baseCost = baseUpgradeCost(game.profile);
  assert.equal(game.dispatch({ type: 'upgrade', stat: 'base' }), true);
  assert.equal(game.profile.coins, 450 - foodCost - baseCost);
  assert.ok(game.state.playerMaxHp > hp);
});

 test('paused battle menus allow purchases but evolution waits for battle end', () => {
  const game = new Game();
  game.profile.coins = 2000;
  game.dispatch({ type: 'start' });
  game.state.paused = true;
  assert.equal(game.dispatch({ type: 'upgrade', stat: 'food' }), true);
  assert.equal(game.dispatch({ type: 'unlock', kind: 1 }), true);
  assert.equal(game.dispatch({ type: 'summon' }), true);
  assert.equal(game.dispatch({ type: 'evolve' }), false);
  assert.equal(game.state.paused, true);
});

 test('visible battle upgrades and unlocks work without pausing; base upgrades retain prior damage', () => {
  const game = new Game();
  game.profile.coins = 1000;
  game.dispatch({ type: 'start' });
  game.state.playerHp = 120;
  assert.equal(game.dispatch({ type: 'upgrade', stat: 'food' }), true);
  assert.equal(game.dispatch({ type: 'unlock', kind: 1 }), true);
  assert.equal(game.dispatch({ type: 'upgrade', stat: 'base' }), true);
  assert.equal(game.state.playerMaxHp, 252);
  assert.equal(game.state.playerHp, 192);
  assert.equal(game.state.paused, false);
  assert.equal(game.state.phase, 'running');
});

 test('evolution requires its configured cost and resets the age economy', () => {
  const game = new Game();
  game.profile.coins = ERAS[0].evolveCost + 2000;
  game.profile.foodLevel = 4;
  game.profile.baseLevel = 2;
  game.profile.unlocked = [true, true, true];
  const cost = ERAS[0].evolveCost;
  assert.equal(game.dispatch({ type: 'evolve' }), true);
  assert.equal(game.profile.age, 1);
  assert.equal(game.profile.coins, 0);
  assert.equal(game.profile.foodLevel, 0);
  assert.equal(game.profile.baseLevel, 0);
  assert.deepEqual(game.profile.unlocked, [true, false, false]);
  assert.equal(game.dispatch({ type: 'evolve' }), false);
});

 test('sixth enemy age victory advances timeline and resets the campaign', () => {
  const profile = defaultProfile();
  profile.age = 5;
  profile.enemyAge = 5;
  profile.cards = [1, 0, 0, 0, 0, 0];
  const game = new Game(profile);
  game.dispatch({ type: 'start' });
  game.state.enemyHp = 1;
  game.state.units = [{ ...unit(90, 'player', 900), age: 5 }];
  advance(game, 0.1);
  assert.equal(game.dispatch({ type: 'next' }), true);
  assert.equal(game.profile.timeline, 2);
  assert.equal(game.profile.age, 0);
  assert.equal(game.profile.enemyAge, 0);
  assert.equal(game.profile.cards[0], 1);
  assert.ok(game.profile.gems > 100);
});

 test('summoning and quest rewards cannot be collected without currency or twice', () => {
  const game = new Game();
  const before = cardBonus(game.profile);
  assert.equal(game.dispatch({ type: 'summon' }), true);
  assert.equal(game.profile.gems, 0);
  assert.equal(game.profile.cards.reduce((sum, n) => sum + n, 0), 1);
  const bonus = cardBonus(game.profile);
  assert.ok(bonus.damage > before.damage || bonus.health > before.health);
  assert.equal(game.dispatch({ type: 'summon' }), false);
  assert.equal(game.dispatch({ type: 'claim', id: 'first-blood' }), false);
  game.profile.kills = 10;
  assert.equal(game.dispatch({ type: 'claim', id: 'first-blood' }), true);
  assert.equal(game.profile.gems, 50);
  assert.equal(game.dispatch({ type: 'claim', id: 'first-blood' }), false);
  assert.equal(game.dispatch({ type: 'claim', id: 'unknown' }), false);
});

 test('same actions and elapsed frames produce deterministic battle results', () => {
  const games = [new Game(), new Game()];
  for (const game of games) {
    game.dispatch({ type: 'start' });
    for (let second = 0; second < 70; second++) {
      if (second === 8) game.dispatch({ type: 'skill', skill: 'food' });
      while (game.dispatch({ type: 'spawn', kind: 0 })) { /* spend all available food */ }
      advance(game, 1);
    }
  }
  assert.deepEqual(games[0].state, games[1].state);
  assert.deepEqual(games[0].profile, games[1].profile);
});

 test('save round trip retains progress without sharing default arrays', () => {
  const profile = defaultProfile();
  profile.coins = 123;
  profile.unlocked[1] = true;
  assert.equal(defaultProfile().unlocked[1], false);
  const entries = new Map<string, string>();
  const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
  assert.equal(saveProfile(profile, storage), true);
  assert.ok(entries.has(SAVE_KEY));
  assert.deepEqual(loadProfile(storage), profile);
});

 test('corrupt, future-version, absent and unavailable saves recover safely', () => {
  for (const raw of [null, '{broken', 'null', '[]', '{"version":99,"coins":900}']) {
    assert.deepEqual(loadProfile({ getItem: () => raw }), defaultProfile());
  }
  assert.deepEqual(loadProfile({ getItem: () => { throw new Error('blocked'); } }), defaultProfile());
  assert.equal(saveProfile(defaultProfile(), { setItem: () => { throw new Error('quota'); } }), false);
});

 test('persisted values are validated, bounded and sanitized before gameplay', () => {
  const dirty = { version: 1, age: 999, enemyAge: -5, timeline: 1e100, coins: -100, gems: '999', foodLevel: 1e99, baseLevel: 2.8, unlocked: [false, 'yes', true], cards: [2, -3, 1e99, 'bad'], kills: 3.9, wins: -7, deployed: Infinity, claimed: ['first-blood', 'first-blood', 'evil'], sound: 'false' };
  const profile = loadProfile({ getItem: () => JSON.stringify(dirty) });
  assert.equal(profile.age, 5);
  assert.equal(profile.enemyAge, 0);
  assert.ok(profile.timeline <= 1000);
  assert.equal(profile.coins, 0);
  assert.equal(profile.gems, 100);
  assert.ok(profile.foodLevel <= 100);
  assert.equal(profile.baseLevel, 2);
  assert.deepEqual(profile.unlocked, [true, false, true]);
  assert.equal(profile.cards.length, 30);
  assert.equal(profile.cards[1], 0);
  assert.equal(profile.cards[3], 0);
  assert.equal(profile.cards[18], 2);
  assert.equal(profile.cards[8], 1000);
  assert.deepEqual(profile.claimed, ['first-blood']);
  assert.equal(profile.sound, true);
  const game = new Game(profile);
  game.dispatch({ type: 'start' });
  advance(game, 1);
  assert.ok(Number.isFinite(game.state.playerHp));
});

test('milestone quests have unique ids, rising targets per stat and claimable rewards', () => {
  const ids = QUESTS.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const stat of ['kills', 'wins', 'deployed'] as const) {
    const targets = QUESTS.filter(q => q.stat === stat).map(q => q.target);
    assert.ok(targets.length >= 3, `${stat} needs a ladder of milestones`);
    assert.deepEqual(targets, [...targets].sort((a, b) => a - b));
  }
  assert.ok(QUESTS.every(q => Number.isInteger(q.reward) && q.reward > 0));
  const game = new Game();
  game.profile.kills = 100;
  assert.equal(game.dispatch({ type: 'claim', id: 'veteran' }), true);
  assert.equal(game.profile.gems, 200);
  assert.equal(game.dispatch({ type: 'claim', id: 'legion' }), false);
  assert.deepEqual(new Game(game.profile).profile.claimed, ['veteran']);
});

test('daily reward pays once per local day, builds a streak and survives a reload', () => {
  const game = new Game();
  assert.equal(game.dispatch({ type: 'daily', day: 20000 }), true);
  assert.equal(game.profile.gems, 130);
  assert.equal(game.dispatch({ type: 'daily', day: 20000 }), false);
  assert.equal(game.dispatch({ type: 'daily', day: 19999 }), false);
  assert.equal(game.dispatch({ type: 'daily', day: 20001 }), true);
  assert.equal(game.profile.dailyStreak, 2);
  assert.equal(game.profile.gems, 130 + 40);
  const reloaded = new Game(game.profile);
  assert.deepEqual([reloaded.profile.dailyDay, reloaded.profile.dailyStreak], [20001, 2]);
  assert.equal(game.dispatch({ type: 'daily', day: 20005 }), true);
  assert.equal(game.profile.dailyStreak, 1, 'a missed day restarts the streak');
  for (let day = 20006; day < 20016; day++) game.dispatch({ type: 'daily', day });
  assert.equal(dailyReward(game.profile, 20016).gems, 90, 'reward caps at 90 gems');
  assert.equal(dailyReward(defaultProfile(), Number.NaN).available, false);
});

test('local day follows the player\'s timezone offset', () => {
  const noon = new Date('2026-09-30T12:00:00Z');
  assert.equal(localDay(noon) - Math.floor(noon.getTime() / 86_400_000) <= 1, true);
});
