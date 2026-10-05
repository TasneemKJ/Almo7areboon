import { defaultProfile } from './save.ts';
import type { Profile } from './types.ts';

/**
 * A brand-new profile for "Start over". Sound, speed and motion choices are preferences, not progress, and the
 * daily-reward date and streak must survive so a reset cannot be used to claim today's reward twice.
 */
export function startOverProfile(current: Profile): Profile {
  const fresh = defaultProfile();
  fresh.sound = current.sound;
  fresh.speed = current.speed;
  fresh.motion = current.motion;
  fresh.dailyDay = current.dailyDay;
  fresh.dailyStreak = current.dailyStreak;
  if (current.graceDay !== undefined) fresh.graceDay = current.graceDay;
  return fresh;
}
