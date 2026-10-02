import { BATTLE_TIME_EPSILON } from '../game/battle-time.ts';

/** Derive minutes and seconds from the same rounded-down total, including exact tick boundaries. */
export function battleClock(time: number): string {
  const seconds = Math.floor(Math.max(0, Number.isFinite(time) ? time : 0) + BATTLE_TIME_EPSILON);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
