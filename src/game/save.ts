import { CARD_DEFS, QUESTS } from './data.ts';
import type { Profile } from './types.ts';

export const SAVE_KEY = 'almo7areboon.save.v1';

export function defaultProfile(): Profile {
  return { version: 1, timeline: 1, age: 0, enemyAge: 0, coins: 0, gems: 100, foodLevel: 0, baseLevel: 0, unlocked: [true, false, false], cards: CARD_DEFS.map(() => 0), kills: 0, wins: 0, deployed: 0, claimed: [], sound: true };
}

function integer(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : fallback;
}

function validate(value: unknown): Profile {
  const clean = defaultProfile();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  const data = value as Record<string, unknown>;
  if (data.version !== 1) return clean;
  clean.timeline = integer(data.timeline, 1, 1, 1000);
  clean.age = integer(data.age, 0, 0, 5);
  clean.enemyAge = integer(data.enemyAge, 0, 0, 5);
  clean.coins = integer(data.coins, 0, 0, 1e9);
  clean.gems = integer(data.gems, 100, 0, 1e7);
  clean.foodLevel = integer(data.foodLevel, 0, 0, 100);
  clean.baseLevel = integer(data.baseLevel, 0, 0, 100);
  clean.kills = integer(data.kills, 0, 0, 1e9);
  clean.wins = integer(data.wins, 0, 0, 1e9);
  clean.deployed = integer(data.deployed, 0, 0, 1e9);
  if (Array.isArray(data.unlocked)) clean.unlocked = [true, data.unlocked[1] === true, data.unlocked[2] === true];
  if (Array.isArray(data.cards)) clean.cards = CARD_DEFS.map((_, i) => integer((data.cards as unknown[])[i], 0, 0, 1000));
  if (Array.isArray(data.claimed)) clean.claimed = QUESTS.filter(quest => (data.claimed as unknown[]).includes(quest.id)).map(quest => quest.id);
  if (typeof data.sound === 'boolean') clean.sound = data.sound;
  return clean;
}

export function loadProfile(storage?: Pick<Storage, 'getItem'>): Profile {
  try {
    const source = storage ?? globalThis.localStorage;
    const raw = source?.getItem(SAVE_KEY);
    return raw ? validate(JSON.parse(raw)) : defaultProfile();
  } catch { return defaultProfile(); }
}

export function saveProfile(profile: Profile, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const destination = storage ?? globalThis.localStorage;
    if (!destination) return false;
    destination.setItem(SAVE_KEY, JSON.stringify(validate(profile)));
    return true;
  } catch { return false; }
}
