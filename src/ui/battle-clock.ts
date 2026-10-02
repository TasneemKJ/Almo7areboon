import { BATTLE_TIME_EPSILON } from '../game/battle-time.ts';

/** Round elapsed time up after the shared tolerance so the displayed boundary never promises a missed at-most target. */
export function battleClock(time: number): string {
  const seconds = Math.ceil(Math.max(0, (Number.isFinite(time) ? time : 0) - BATTLE_TIME_EPSILON));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
