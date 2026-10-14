import type { Encounter, ScheduledSpawn } from './encounters.ts';
import type { BattleState } from './types.ts';

/** Calling the next wave early: worth it only when it is at least this far off. Each second saved pays this many base coins. */
export const CALL_MIN_SECONDS = 3, CALL_COINS_PER_SECOND = 2;

/** Seconds the next wave would be pulled forward, or 0 when no call is possible (no next wave, an earlier wave still arriving, too close, paused). */
export function callableSeconds(encounter: Encounter, schedule: readonly ScheduledSpawn[], nextSpawn: number, state: Readonly<BattleState>): number {
  const wave = encounter.waves[state.wave];
  if (state.phase !== 'running' || state.paused || !wave || schedule.slice(nextSpawn).some(spawn => spawn.waveIndex < state.wave)) return 0;
  const seconds = wave.time - state.time;
  return seconds >= CALL_MIN_SECONDS ? seconds : 0;
}

/** The same encounter with the next wave and every later wave pulled forward by the same seconds, so their spacing is kept. */
export function callEarly(encounter: Encounter, schedule: readonly ScheduledSpawn[], nextSpawn: number, state: Readonly<BattleState>): { encounter: Encounter; schedule: ScheduledSpawn[]; seconds: number } | null {
  const seconds = callableSeconds(encounter, schedule, nextSpawn, state);
  if (!seconds) return null;
  const from = state.wave;
  return {
    seconds,
    encounter: { ...encounter, waves: encounter.waves.map((wave, index) => index >= from ? { ...wave, time: wave.time - seconds } : wave) },
    schedule: schedule.map(spawn => spawn.waveIndex >= from ? { ...spawn, time: spawn.time - seconds } : spawn),
  };
}
