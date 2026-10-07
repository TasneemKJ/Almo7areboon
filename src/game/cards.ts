export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CardDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  stat: 'damage' | 'health';
  rarity: CardRarity;
  secondary?: 'base' | 'food' | 'coins';
}

const RARITIES: CardRarity[] = ['common', 'rare', 'epic', 'legendary'];
const COLORS: Record<CardRarity, string> = { common: '#82b975', rare: '#76a8de', epic: '#b588d6', legendary: '#e6b750' };

function card(name: string, rarity: CardRarity, stat: CardDef['stat'], icon: string, secondary?: CardDef['secondary']): CardDef {
  const description = `Multiplies unit ${stat}${secondary ? ` and ${secondary === 'base' ? 'base health' : secondary === 'food' ? 'food production' : 'coins earned'}` : ''}.`;
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name, description, icon, color: COLORS[rarity], stat, rarity, ...(secondary ? { secondary } : {}) };
}

// Reference collection and progression tables:
// https://we-are-warriors-game.fandom.com/wiki/Cards (consulted 2026-09-28).
// This collection covers the four supported summon rarities; Ultimate is separate.
export const CARD_DEFS: CardDef[] = [
  card('Turtle Shell', 'common', 'health', 'shield'),
  card('Camp Fire', 'common', 'health', 'meteor'),
  card('Dino Ribs', 'common', 'health', 'food'),
  card('Bandages', 'common', 'health', 'heart'),
  card('Canned Food', 'common', 'health', 'food'),
  card('Furnace', 'common', 'health', 'meteor'),
  card('Crop Seeds', 'common', 'health', 'evolution'),
  card('Ancient Emblem', 'common', 'health', 'shield'),
  card('Combat Dummy', 'common', 'damage', 'battle'),
  card('Target', 'common', 'damage', 'battle'),
  card('Grind Stone', 'common', 'damage', 'gear'),
  card('Battle Horn', 'common', 'damage', 'sound'),
  card('War Banner', 'common', 'damage', 'flag'),
  card('Vial of Poison', 'common', 'damage', 'skills'),
  card('Anvil', 'common', 'damage', 'gear'),
  card('Weights', 'common', 'damage', 'battle'),
  card('Red Rose', 'rare', 'damage', 'heart'),
  card('Gun Powder', 'rare', 'damage', 'meteor'),
  card('Sabre Cat Skull', 'rare', 'damage', 'battle'),
  card('Trojan Horse', 'rare', 'damage', 'battle'),
  card('Fountain of Life', 'rare', 'health', 'heart'),
  card('Kevlar Thread', 'rare', 'health', 'shield'),
  card('STEM-C5', 'rare', 'health', 'skills'),
  card('Pestle and Mortar', 'rare', 'health', 'food'),
  card('UAV-3.0', 'epic', 'damage', 'battle', 'base'),
  card('Cave Painting', 'epic', 'damage', 'flag', 'base'),
  card('Obelisk', 'epic', 'health', 'shield', 'base'),
  card('Military Radio', 'epic', 'health', 'sound', 'base'),
  card('T-Rex Head', 'legendary', 'damage', 'food', 'food'),
  card('Robot Head', 'legendary', 'health', 'gear', 'coins'),
];

function nonnegativeInteger(value: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value))) : 0;
}

/** Owned is the number of duplicates collected toward the next level. */
export function cardProgress(totalCopies: number): { level: number; owned: number; required: number } {
  const copies = nonnegativeInteger(totalCopies);
  if (copies < 1) return { level: 0, owned: 0, required: 1 };
  if (copies < 3) return { level: 1, owned: copies - 1, required: 2 };
  if (copies < 6) return { level: 2, owned: copies - 3, required: 3 };
  if (copies < 10) return { level: 3, owned: copies - 6, required: 4 };
  return { level: 4 + Math.floor((copies - 10) / 4), owned: (copies - 10) % 4, required: 4 };
}

const UNIT_BONUSES: Record<CardRarity, { initial: number; growth: number }> = {
  common: { initial: 1.03, growth: 1.05 },
  rare: { initial: 1.07, growth: 1.1 },
  epic: { initial: 1.18, growth: 1.15 },
  legendary: { initial: 1.5, growth: 1.2 },
};

export function cardBonuses(copies: number[]): { damage: number; health: number; base: number; food: number; coins: number } {
  const bonuses = { damage: 1, health: 1, base: 1, food: 1, coins: 1 };
  if (!Array.isArray(copies)) return bonuses;
  CARD_DEFS.forEach((definition, index) => {
    // This is a provisional arithmetic safety bound, not a reference-game level cap.
    const level = Math.min(100, cardProgress(copies[index]).level);
    if (level === 0) return;
    const { initial, growth } = UNIT_BONUSES[definition.rarity];
    bonuses[definition.stat] *= initial * growth ** (level - 1);
    if (definition.secondary === 'base') bonuses.base *= 3 * 1.35 ** (level - 1);
    // Legendary secondary curves are interpolated from the reference's rounded
    // table; exact proprietary formulas are not available from that table.
    if (definition.secondary === 'food') bonuses.food *= 1.5 + 0.015 * (level - 1);
    if (definition.secondary === 'coins') bonuses.coins *= 1.5 * 1.0225 ** (level - 1);
  });
  return bonuses;
}

const SUMMON_THRESHOLDS = [0, 5, 15, 30, 50, 75, 105, 140, 180, 225, 275, 330, 390, 455, 525, 600, 680, 765, 855, 950];
const SUMMON_ODDS: [number, number, number, number][] = [
  [100, 0, 0, 0], [99, 1, 0, 0], [98, 2, 0, 0], [96, 4, 0, 0],
  [93.9, 6, 0.1, 0], [91.8, 8, 0.2, 0], [89.7, 10, 0.3, 0],
  [84.4, 15, 0.5, 0.1], [79, 20, 0.8, 0.1], [73.4, 25, 1.4, 0.2],
  [67.3, 30, 2.4, 0.3], [65.5, 30, 4.1, 0.4], [62.5, 30, 7, 0.5],
  [57.4, 30, 11.9, 0.7], [54, 30, 15, 1], [53.6, 30, 15, 1.4],
  [53.1, 30, 15, 1.9], [52.3, 30, 15, 2.7], [51.3, 30, 15, 3.7], [50, 30, 15, 5],
];

/** Odds are percentages ordered common, rare, epic, legendary. Max level has 0/0 progress. */
export function summonLevel(draws: number): { level: number; progress: number; required: number; odds: [number, number, number, number] } {
  const total = nonnegativeInteger(draws);
  let index = 0;
  while (index + 1 < SUMMON_THRESHOLDS.length && total >= SUMMON_THRESHOLDS[index + 1]) index++;
  const required = index < SUMMON_THRESHOLDS.length - 1 ? SUMMON_THRESHOLDS[index + 1] - SUMMON_THRESHOLDS[index] : 0;
  return { level: index + 1, progress: required ? total - SUMMON_THRESHOLDS[index] : 0, required, odds: [...SUMMON_ODDS[index]] };
}

function normalizedRoll(value: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0;
}

/** Storage-cap protection removes unavailable cards, without unlocking new rarities. */
export function availableSummonOdds(draws: number, copies?: readonly number[]): [number, number, number, number] {
  const weights = summonLevel(draws).odds.map((weight, rarity) =>
    CARD_DEFS.some((card, index) => card.rarity === RARITIES[rarity] && (!copies || (copies[index] ?? 0) < 1000)) ? weight : 0);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map(weight => total ? weight / total * 100 : 0) as [number, number, number, number];
}

/** Draws means completed draws BEFORE this draw. Randomness is supplied by the caller. */
export function drawCard(draws: number, rarityRoll: number, cardRoll: number, copies?: readonly number[]): number {
  const odds = copies ? availableSummonOdds(draws, copies) : summonLevel(draws).odds;
  if (!odds.some(weight => weight > 0)) return -1;
  // One rounded reference row totals 99.9%; normalize its weights instead of
  // incorrectly assigning the missing 0.1% to the rarest card category.
  const roll = normalizedRoll(rarityRoll) * odds.reduce((sum, chance) => sum + chance, 0);
  let cumulative = 0;
  let rarityIndex = 0;
  for (; rarityIndex < odds.length - 1; rarityIndex++) {
    cumulative += odds[rarityIndex];
    if (roll < cumulative) break;
  }
  const pool = CARD_DEFS.map((definition, index) => ({ definition, index })).filter(({ definition, index }) => definition.rarity === RARITIES[rarityIndex] && (!copies || (copies[index] ?? 0) < 1000));
  return pool[Math.floor(normalizedRoll(cardRoll) * pool.length)].index;
}

export function cardPackCost(count: 1 | 10 | 50): number {
  switch (count) {
    case 1: return 100;
    case 10: return 950;
    case 50: return 4600;
    default: throw new RangeError('Card packs contain 1, 10, or 50 cards.');
  }
}

/** A saved xorshift32 stream makes each paid draw reproducible across reloads. */
export function nextCardRandom(seed: number): { seed: number; value: number } {
  let next = (nonnegativeInteger(seed) >>> 0) || 0x6d2b79f5;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  next >>>= 0;
  return { seed: next, value: next / 0x100000000 };
}

/**
 * Draws a whole pack without touching the wallet or the saved random stream. Returns the new
 * card counts, the drawn indices and the advanced stream, or null if any draw is impossible.
 */
export function stageCardPack(state: { cards: readonly number[]; summonSeed: number; summonCount: number }, count: number): { cards: number[]; indices: number[]; seed: number; draws: number } | null {
  const cards = [...state.cards];
  const indices: number[] = [];
  let seed = state.summonSeed;
  let draws = state.summonCount;
  for (let i = 0; i < count; i++) {
    const rarity = nextCardRandom(seed);
    const choice = nextCardRandom(rarity.seed);
    const index = drawCard(draws, rarity.value, choice.value, cards);
    if (index < 0 || cards[index] >= 1000) return null;
    cards[index]++;
    indices.push(index);
    seed = choice.seed;
    draws = Math.min(1e9, draws + 1);
  }
  return { cards, indices, seed, draws };
}
