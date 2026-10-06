import { currentSealCount } from './prestige.ts';
import type { Profile } from './types.ts';

/** A small weekly goal: earn new mastery seals within the calendar week (Monday to Sunday, local days). */
export const WEEKLY_TARGET = 3;
export const WEEKLY_GEMS = 60;
export const MAX_WEEK = 200_000;

/** Local day number (see `localDay`) to a week index; day 4 (1970-01-05) was a Monday. */
export function weekId(day: number): number {
  return Number.isInteger(day) && day >= 0 ? Math.floor((day + 3) / 7) : -1;
}

export interface WeeklyStatus { progress: number; target: number; claimed: boolean; ready: boolean; gems: number; }

/** Read-only view. A week that has not been synced yet shows no progress rather than guessing a base. */
export function weeklyStatus(profile: Pick<Profile, 'weekly' | 'mastery' | 'timeline'> , week: number): WeeklyStatus {
  const w = profile.weekly;
  const progress = w && w.week === week ? Math.max(0, Math.min(WEEKLY_TARGET, currentSealCount(profile as Profile) - w.baseSeals)) : 0;
  const claimed = !!(w && w.week === week && w.claimed);
  return { progress, target: WEEKLY_TARGET, claimed, ready: !claimed && progress >= WEEKLY_TARGET, gems: WEEKLY_GEMS };
}

/** Starts the week on first sight and rebases after a timeline reset (the seal total fell). Returns true if it changed. */
export function syncWeekly(profile: Profile, week: number): boolean {
  if (!(week >= 0 && week <= MAX_WEEK)) return false;
  const seals = currentSealCount(profile), w = profile.weekly;
  if (!w || w.week !== week) { profile.weekly = { week, baseSeals: seals }; return true; }
  if (seals < w.baseSeals) { w.baseSeals = seals; return true; }
  return false;
}
