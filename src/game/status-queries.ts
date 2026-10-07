import { baseUpgradeCost, cardBonus, foodUpgradeCost } from './data.ts';
import { chronicleGateFactor } from './chronicle-combat.ts';
import { legacyEffects } from './prestige.ts';
import { wavePreview } from './encounters.ts';
import type { Encounter, ScheduledSpawn, WaveStatus } from './encounters.ts';
import type { BattleState, Profile } from './types.ts';

export type UpgradeStatus = { allowed: boolean; reason: 'available' | 'coins' | 'max' | 'invalid'; cost: number | null; nextValue: number | null };

/** Whether a food or base upgrade can be bought now, what it costs and what it would yield. */
export function upgradeStatusFor(profile: Profile, bonuses: ReturnType<typeof cardBonus>, stat: 'food' | 'base'): UpgradeStatus {
  if (stat !== 'food' && stat !== 'base') return { allowed: false, reason: 'invalid', cost: null, nextValue: null };
  const level = stat === 'food' ? profile.foodLevel : profile.baseLevel;
  if (level >= 100) return { allowed: false, reason: 'max', cost: null, nextValue: null };
  const cost = stat === 'food' ? foodUpgradeCost(profile) : baseUpgradeCost(profile);
  const nextValue = stat === 'food' ? (0.8 + (level + 1) * 0.14) * bonuses.food : Math.round(180 * 1.65 ** profile.age * (1 + (level + 1) * 0.4) * bonuses.base * legacyEffects(profile.legacy).gateFactor * chronicleGateFactor(profile));
  return { allowed: profile.coins >= cost, reason: profile.coins >= cost ? 'available' : 'coins', cost, nextValue };
}

/** Wave progress for the HUD: spawned, remaining and the next preview. */
export function waveStatusFor(encounter: Encounter, schedule: readonly ScheduledSpawn[], nextSpawn: number, state: BattleState): WaveStatus {
  const preview = wavePreview(encounter, state.time, state.wave);
  const enemiesRemaining = state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0).length;
  const pendingEnemies = state.phase === 'won' || state.phase === 'lost' ? 0 : schedule.slice(nextSpawn).filter(spawn => spawn.waveIndex < state.wave).length;
  return { spawned: state.wave, total: encounter.waves.length, nextIn: preview?.nextIn ?? null, enemiesRemaining, pendingEnemies, cleared: !preview && nextSpawn === schedule.length && enemiesRemaining === 0, preview };
}
