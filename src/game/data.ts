import { cardBonuses } from './cards.ts';
import type { Era, Profile, UnitDef, UnitKind } from './types.ts';

// Public reference material does not expose the original game's balance tables.
// Keep this recreation's tuning here so its pacing can be adjusted independently.
const names = [
  ['Caveman', 'Thrower', 'Dino'],
  ['Farmer', 'Slinger', 'Scythe'],
  ['Spartan', 'Archer', 'Rider'],
  ['Swordsman', 'Musketeer', 'Cannon'],
  ['Soldier', 'Rifleman', 'Tank'],
  ['Astro-Knight', 'Trooper', 'Spaceship'],
];

function troops(age: number): [UnitDef, UnitDef, UnitDef] {
  const power = 1.65 ** age;
  return [
    { name: names[age][0], role: 'Melee', cost: 3, hp: Math.round(26 * power), damage: Math.round(6 * power), speed: 31, range: 27, interval: 0.95 },
    { name: names[age][1], role: 'Ranged', cost: 5, hp: age === 0 ? 26 / 3 : Math.round(18 * power), damage: age === 0 ? 6 : Math.round(9 * power), speed: 29, range: 128, interval: 1.35 },
    { name: names[age][2], role: 'Heavy', cost: age === 0 ? 7 : 9, hp: age === 0 ? 130 : Math.round(105 * power), damage: age === 0 ? 12 : Math.round(17 * power), speed: 25, range: age >= 3 ? 105 : 32, interval: 1.25 },
  ];
}

export const ERAS: Era[] = [
  { name: 'Stone Age', year: '70,000–20,000 BC', color: '#72be79', ground: '#b8d993', units: troops(0), evolveCost: 2500 },
  { name: 'Farm Age', year: '12,000–4,000 BC', color: '#e0c263', ground: '#cadb87', units: troops(1), evolveCost: 20000 },
  { name: 'Spartan Age', year: '1,000–300 BC', color: '#d18f60', ground: '#d5cb94', units: troops(2), evolveCost: 170000 },
  { name: 'Renaissance', year: '1500–1800', color: '#91a4c5', ground: '#a5c99c', units: troops(3), evolveCost: 1300000 },
  { name: 'Modern Age', year: '1990–2025', color: '#ad9c86', ground: '#b6bea0', units: troops(4), evolveCost: 13000000 },
  { name: 'Space Age', year: '2100–2500', color: '#72a59e', ground: '#a3c9a6', units: troops(5), evolveCost: Infinity }, // Final age: nothing to evolve into, so it is never purchasable.
];

/** Provisional web-game pacing: prices and coin rewards grow together by era. */
export function eraEconomyScale(age: number): number {
  const validAge = Number.isFinite(age) ? Math.min(5, Math.max(0, Math.floor(age))) : 0;
  return 8 ** validAge;
}

export function foodRate(profile: Profile): number { return (0.8 + profile.foodLevel * 0.14) * cardBonus(profile).food; }
export function foodUpgradeCost(profile: Profile): number { return Math.min(1e9, Math.round(50 * eraEconomyScale(profile.age) * 1.42 ** profile.foodLevel)); }
export function baseUpgradeCost(profile: Profile): number { return Math.min(1e9, Math.round(40 * eraEconomyScale(profile.age) * 1.45 ** profile.baseLevel)); }
export function unlockCost(kind: UnitKind, profile?: Pick<Profile, 'age'>): number { return [0, 150, 400][kind] * eraEconomyScale(profile?.age ?? 0); }

export { CARD_DEFS } from './cards.ts';

/** Permanent multipliers from the active, versioned collection. */
export function cardBonus(profile: Profile): ReturnType<typeof cardBonuses> {
  return cardBonuses(profile.cards);
}

export const QUESTS: { id: string; title: string; target: number; reward: number; stat: 'kills' | 'wins' | 'deployed' }[] = [
  { id: 'first-blood', title: 'Defeat 10 enemies', target: 10, reward: 50, stat: 'kills' },
  { id: 'commander', title: 'Deploy 25 warriors', target: 25, reward: 50, stat: 'deployed' },
  { id: 'conqueror', title: 'Win 3 battles', target: 3, reward: 100, stat: 'wins' },
  // Longer milestone ladders give returning players something to work toward
  // after the first three; rewards stay modest next to a 100-gem single summon.
  { id: 'veteran', title: 'Defeat 100 enemies', target: 100, reward: 100, stat: 'kills' },
  { id: 'battalion', title: 'Deploy 150 warriors', target: 150, reward: 100, stat: 'deployed' },
  { id: 'champion', title: 'Win 10 battles', target: 10, reward: 150, stat: 'wins' },
  { id: 'legion', title: 'Defeat 500 enemies', target: 500, reward: 200, stat: 'kills' },
  { id: 'general', title: 'Deploy 750 warriors', target: 750, reward: 200, stat: 'deployed' },
  { id: 'warlord', title: 'Win 30 battles', target: 30, reward: 300, stat: 'wins' },
  { id: 'annihilator', title: 'Defeat 2,500 enemies', target: 2500, reward: 400, stat: 'kills' },
];

/** Whole local calendar days since 1970-01-01, so a reward resets at the player's midnight. */
export function localDay(now: Date = new Date()): number {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86_400_000);
}

// Accepted claims must retain the same day when saved and reloaded.
export const MAX_DAILY_DAY = 1_000_000;

/** Consecutive-day check-in: 30 gems, rising by 10 per day to 90 from day 7. */
export function dailyReward(profile: Pick<Profile, 'dailyDay' | 'dailyStreak'>, day: number): { available: boolean; streak: number; gems: number } {
  const available = Number.isInteger(day) && day <= MAX_DAILY_DAY && day > profile.dailyDay;
  const streak = available && profile.dailyDay > 0 && day === profile.dailyDay + 1 ? profile.dailyStreak + 1 : available ? 1 : profile.dailyStreak;
  return { available, streak, gems: 30 + 10 * Math.min(6, Math.max(0, streak - 1)) };
}
