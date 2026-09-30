import type { BattleStats } from './types.ts';

export function battleStats(value?: unknown): BattleStats {
  const result: BattleStats = { deployed: 0, kills: 0, foodSpent: 0, peakArmy: 0, damageDealt: 0, damageTaken: 0, skillsCast: 0, gateDamageTaken: 0, deployedByKind: [0,0,0], maxFreezeTargets: 0, meteorKills: 0 };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  const source = value as Record<string, unknown>;
  const count = (number: unknown) => typeof number === 'number' && Number.isFinite(number) ? Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(number))) : 0;
  for (const key of Object.keys(result) as (keyof BattleStats)[]) {
    if (key === 'deployedByKind') continue;
    const number = source[key];
    if (typeof number === 'number' && Number.isFinite(number)) result[key] = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, number));
  }
  for (const key of ['maxFreezeTargets','meteorKills'] as const) result[key] = count(source[key]);
  if (Array.isArray(source.deployedByKind)) result.deployedByKind = [count(source.deployedByKind[0]),count(source.deployedByKind[1]),count(source.deployedByKind[2])];
  return result;
}
