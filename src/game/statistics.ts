import type { BattleStats } from './types.ts';

export function battleStats(value?: unknown): BattleStats {
  const result: BattleStats = { deployed: 0, kills: 0, foodSpent: 0, peakArmy: 0, damageDealt: 0, damageTaken: 0, skillsCast: 0 };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const key of Object.keys(result) as (keyof BattleStats)[]) {
    const number = (value as Record<string, unknown>)[key];
    if (typeof number === 'number' && Number.isFinite(number)) result[key] = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, number));
  }
  return result;
}
