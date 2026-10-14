import type { BattleState } from './types.ts';

/** Harvest Moon: once the final wave has set out, food gathers this many times faster until the battle ends. */
export const HARVEST_MOON_FOOD = 2;
export function harvestMoon(state: Readonly<Pick<BattleState, 'phase' | 'wave' | 'totalWaves'>>): boolean {
  return state.phase === 'running' && state.totalWaves > 0 && state.wave >= state.totalWaves;
}
export function finaleFoodFactor(state: Readonly<Pick<BattleState, 'phase' | 'wave' | 'totalWaves'>>): number {
  return harvestMoon(state) ? HARVEST_MOON_FOOD : 1;
}
