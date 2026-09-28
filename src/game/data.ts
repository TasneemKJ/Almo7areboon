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
  { name: 'Stone Age', year: '70,000–20,000 BC', color: '#72be79', ground: '#b8d993', units: troops(0), evolveCost: 500 },
  { name: 'Farm Age', year: '12,000–4,000 BC', color: '#e0c263', ground: '#cadb87', units: troops(1), evolveCost: 850 },
  { name: 'Spartan Age', year: '1,000–300 BC', color: '#d18f60', ground: '#d5cb94', units: troops(2), evolveCost: 1300 },
  { name: 'Renaissance', year: '1500–1800', color: '#91a4c5', ground: '#a5c99c', units: troops(3), evolveCost: 1800 },
  { name: 'Modern Age', year: '1990–2025', color: '#ad9c86', ground: '#b6bea0', units: troops(4), evolveCost: 2400 },
  { name: 'Space Age', year: '2100–2500', color: '#72a59e', ground: '#a3c9a6', units: troops(5), evolveCost: 3200 },
];

export function foodRate(profile: Profile): number { return 0.8 + profile.foodLevel * 0.14; }
export function foodUpgradeCost(profile: Profile): number { return Math.min(1e9, Math.round(50 * 1.42 ** profile.foodLevel)); }
export function baseUpgradeCost(profile: Profile): number { return Math.min(1e9, Math.round(40 * 1.45 ** profile.baseLevel)); }
export function unlockCost(kind: UnitKind): number { return [0, 150, 400][kind]; }

export const CARD_DEFS: { name: string; description: string; icon: string; color: string; stat: 'damage' | 'health' }[] = [
  { name: 'Saber Tooth', description: '+10% unit damage per card', icon: 'battle', color: '#82b975', stat: 'damage' },
  { name: 'Mammoth', description: '+10% unit health per card', icon: 'heart', color: '#82b975', stat: 'health' },
  { name: 'Warrior Spirit', description: '+10% unit damage per card', icon: 'battle', color: '#76a8de', stat: 'damage' },
  { name: 'Iron Shield', description: '+10% unit health per card', icon: 'shield', color: '#76a8de', stat: 'health' },
  { name: 'Dragon Flame', description: '+10% unit damage per card', icon: 'meteor', color: '#b588d6', stat: 'damage' },
  { name: 'Ancient Heart', description: '+10% unit health per card', icon: 'heart', color: '#b588d6', stat: 'health' },
];

/** Multipliers applied to the player's troops, with 1 meaning no bonus. */
export function cardBonus(profile: Profile): { damage: number; health: number } {
  return profile.cards.reduce((bonus, count, index) => {
    const card = CARD_DEFS[index];
    if (card) bonus[card.stat] += count * 0.1;
    return bonus;
  }, { damage: 1, health: 1 });
}

export const QUESTS: { id: string; title: string; target: number; reward: number; stat: 'kills' | 'wins' | 'deployed' }[] = [
  { id: 'first-blood', title: 'Defeat 10 enemies', target: 10, reward: 50, stat: 'kills' },
  { id: 'commander', title: 'Deploy 25 warriors', target: 25, reward: 50, stat: 'deployed' },
  { id: 'conqueror', title: 'Win 3 battles', target: 3, reward: 100, stat: 'wins' },
];
