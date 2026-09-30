import test from 'node:test';
import assert from 'node:assert/strict';
import { CARD_DEFS, cardProgress, cardBonuses, summonLevel, drawCard, cardPackCost, nextCardRandom } from '../src/game/cards.ts';

function close(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} differs from ${expected}`);
}

test('the reference collection has distinct cards in the supported rarity pools', () => {
  assert.equal(CARD_DEFS.length, 30);
  assert.equal(new Set(CARD_DEFS.map(card => card.id)).size, 30);
  assert.deepEqual(['common', 'rare', 'epic', 'legendary'].map(rarity => CARD_DEFS.filter(card => card.rarity === rarity).length), [16, 8, 4, 2]);
  assert.equal(CARD_DEFS[0].name, 'Turtle Shell');
  assert.equal(CARD_DEFS[8].name, 'Combat Dummy');
  assert.equal(CARD_DEFS[16].name, 'Red Rose');
  assert.equal(CARD_DEFS[24].name, 'UAV-3.0');
  assert.equal(CARD_DEFS[28].secondary, 'food');
  assert.equal(CARD_DEFS[29].secondary, 'coins');
});

test('duplicates accumulate toward levels instead of granting a level for every copy', () => {
  const cases = [
    [0, 0, 0, 1], [1, 1, 0, 2], [2, 1, 1, 2], [3, 2, 0, 3],
    [5, 2, 2, 3], [6, 3, 0, 4], [9, 3, 3, 4], [10, 4, 0, 4],
    [13, 4, 3, 4], [14, 5, 0, 4], [394, 100, 0, 4], [398, 101, 0, 4],
  ];
  for (const [copies, level, owned, required] of cases) {
    assert.deepEqual(cardProgress(copies), { level, owned, required }, `Copies: ${copies}`);
  }
});

test('unowned cards add no bonus and incomplete duplicate levels do not strengthen a card', () => {
  assert.deepEqual(cardBonuses([]), { damage: 1, health: 1, base: 1, food: 1, coins: 1 });
  const cards = Array(30).fill(0);
  cards[8] = 1;
  close(cardBonuses(cards).damage, 1.03);
  cards[8] = 2;
  close(cardBonuses(cards).damage, 1.03);
  cards[8] = 3;
  close(cardBonuses(cards).damage, 1.0815);
});

test('unit bonuses multiply across cards while retaining independent health and damage', () => {
  const cards = Array(30).fill(0);
  cards[8] = 1;
  cards[9] = 1;
  cards[16] = 3;
  cards[0] = 6;
  const bonuses = cardBonuses(cards);
  close(bonuses.damage, 1.2486793);
  close(bonuses.health, 1.135575);
  assert.equal(bonuses.base, 1);
  assert.deepEqual(cards.slice(8, 10), [1, 1]);
});

test('epic cards strengthen their unit stat and multiply their base health bonuses', () => {
  const cards = Array(30).fill(0);
  cards[24] = 1;
  cards[26] = 3;
  const bonuses = cardBonuses(cards);
  close(bonuses.damage, 1.18);
  close(bonuses.health, 1.357);
  close(bonuses.base, 12.15);
  assert.equal(bonuses.food, 1);
  assert.equal(bonuses.coins, 1);
});

test('legendary secondary bonuses affect food and coins independently', () => {
  const cards = Array(30).fill(0);
  cards[28] = 3;
  cards[29] = 6;
  const bonuses = cardBonuses(cards);
  close(bonuses.damage, 1.8);
  close(bonuses.health, 2.16);
  close(bonuses.food, 1.515);
  close(bonuses.coins, 1.568259375);
});

test('summon progression changes odds only when each cumulative threshold is reached', () => {
  assert.deepEqual(summonLevel(0), { level: 1, progress: 0, required: 5, odds: [100, 0, 0, 0] });
  assert.deepEqual(summonLevel(4), { level: 1, progress: 4, required: 5, odds: [100, 0, 0, 0] });
  assert.deepEqual(summonLevel(5), { level: 2, progress: 0, required: 10, odds: [99, 1, 0, 0] });
  assert.deepEqual(summonLevel(49), { level: 4, progress: 19, required: 20, odds: [96, 4, 0, 0] });
  assert.deepEqual(summonLevel(50), { level: 5, progress: 0, required: 25, odds: [93.9, 6, 0.1, 0] });
  assert.deepEqual(summonLevel(949), { level: 19, progress: 94, required: 95, odds: [51.3, 30, 15, 3.7] });
  assert.deepEqual(summonLevel(950), { level: 20, progress: 0, required: 0, odds: [50, 30, 15, 5] });
});

test('level one cannot draw higher rarities, even with a roll at the upper edge', () => {
  for (const roll of [0, 0.49, 0.99, 1]) {
    const index = drawCard(0, roll, roll);
    assert.ok(index >= 0 && index < 16);
    assert.equal(CARD_DEFS[index].rarity, 'common');
  }
  assert.equal(drawCard(0, 0.5, 0), 0);
  assert.equal(drawCard(0, 0.5, 1), 15);
});

test('level twenty draw boundaries select rarity first, then uniformly select its card', () => {
  assert.equal(drawCard(950, 0, 0), 0);
  assert.equal(drawCard(950, 0.4999, 1), 15);
  assert.equal(drawCard(950, 0.5, 0), 16);
  assert.equal(drawCard(950, 0.7999, 1), 23);
  assert.equal(drawCard(950, 0.8, 0), 24);
  assert.equal(drawCard(950, 0.9499, 1), 27);
  assert.equal(drawCard(950, 0.95, 0), 28);
  assert.equal(drawCard(950, 1, 1), 29);
});

test('a newly available rarity has the exact lower-bound draw behavior', () => {
  assert.equal(CARD_DEFS[drawCard(5, 0.9899, 0)].rarity, 'common');
  assert.equal(CARD_DEFS[drawCard(5, 0.99, 0)].rarity, 'rare');
  assert.equal(CARD_DEFS[drawCard(50, 0.9995, 0)].rarity, 'epic');
  assert.equal(CARD_DEFS[drawCard(140, 0.9995, 0)].rarity, 'legendary');
});

test('rounded odds are normalized rather than awarding missing percentage points to legendary', () => {
  // The displayed level-nine table totals 99.9%; its last 0.1 is still a weight.
  assert.equal(CARD_DEFS[drawCard(180, 0.9989, 0)].rarity, 'epic');
  assert.equal(CARD_DEFS[drawCard(180, 0.9991, 0)].rarity, 'legendary');
});

test('draws are deterministic and returned odds cannot mutate the progression table', () => {
  assert.equal(drawCard(200, 0.8, 0.3), drawCard(200, 0.8, 0.3));
  const level = summonLevel(0);
  level.odds[0] = 0;
  assert.equal(summonLevel(0).odds[0], 100);
});

test('invalid, negative and extreme numeric inputs do not produce invalid progression or bonuses', () => {
  for (const value of [NaN, Infinity, -Infinity, -3]) {
    assert.deepEqual(cardProgress(value), { level: 0, owned: 0, required: 1 });
    assert.equal(summonLevel(value).level, 1);
    const card = drawCard(value, value, value);
    assert.ok(Number.isInteger(card) && card >= 0 && card < 30);
  }
  assert.deepEqual(cardProgress(2.9), { level: 1, owned: 1, required: 2 });
  assert.deepEqual(cardBonuses([NaN, Infinity, -1]), { damage: 1, health: 1, base: 1, food: 1, coins: 1 });
  const copies = Array(30).fill(Number.MAX_VALUE);
  const before = [...copies];
  for (const value of Object.values(cardBonuses(copies))) assert.ok(Number.isFinite(value) && value >= 1);
  assert.deepEqual(copies, before);
  assert.deepEqual(cardBonuses(Array(30).fill(394)), cardBonuses(copies));
  const extremeProgress = cardProgress(Number.MAX_VALUE);
  assert.ok(Number.isSafeInteger(extremeProgress.level));
  assert.ok(extremeProgress.owned >= 0 && extremeProgress.owned < extremeProgress.required);
  assert.equal(summonLevel(Number.MAX_VALUE).level, 20);
});

test('card packs apply their reference discounts and reject unsupported pack sizes', () => {
  assert.equal(cardPackCost(1), 100);
  assert.equal(cardPackCost(10), 950);
  assert.equal(cardPackCost(50), 4600);
  for (const count of [0, -1, 2, NaN, Infinity]) assert.throws(() => cardPackCost(count as 1), RangeError);
});

test('summon rarity frequencies match the stated odds over a long fixed-seed stream', () => {
  const rarities = ['common', 'rare', 'epic', 'legendary'];
  for (const draws of [50, 225, 950]) {
    const total = 200_000;
    let seed = 0x6d2b79f5;
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < total; i++) {
      const rarity = nextCardRandom(seed), choice = nextCardRandom(rarity.seed);
      seed = choice.seed;
      counts[rarities.indexOf(CARD_DEFS[drawCard(draws, rarity.value, choice.value)].rarity)]++;
    }
    const odds = summonLevel(draws).odds, sum = odds.reduce((a, b) => a + b, 0);
    odds.forEach((weight, index) => {
      const stated = weight / sum * 100, observed = counts[index] / total * 100;
      assert.ok(Math.abs(observed - stated) < 0.35, `draws ${draws} ${rarities[index]}: stated ${stated.toFixed(2)}%, observed ${observed.toFixed(2)}%`);
    });
  }
});

test('the bonuses printed on the Cards screen are the ones battles apply', async () => {
  const { Game } = await import('../src/game/simulation.ts');
  const { defaultProfile } = await import('../src/game/save.ts');
  const { ERAS, cardBonus } = await import('../src/game/data.ts');
  const { cardsScreenHtml, multiplier } = await import('../src/ui/cards-screen.ts');
  const profile = defaultProfile();
  profile.cards = profile.cards.map((_, index) => (index % 5 === 0 ? 7 : index % 3 === 0 ? 2 : 0));
  const bonus = cardBonus(profile);
  const html = cardsScreenHtml(profile);
  assert.ok(html.includes(`Damage <b>×${multiplier(bonus.damage)}</b>`));
  assert.ok(html.includes(`Health <b>×${multiplier(bonus.health)}</b>`));
  const game = new Game(profile);
  game.dispatch({ type: 'start' });
  game.state.food = 99;
  assert.equal(game.dispatch({ type: 'spawn', kind: 0 }), true);
  const unit = game.state.units.find(candidate => candidate.side === 'player')!;
  assert.equal(unit.maxHp, Math.round(ERAS[0].units[0].hp * bonus.health), 'a deployed unit gets exactly the displayed health multiplier');
});
