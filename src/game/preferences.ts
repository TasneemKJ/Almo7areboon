import type { Profile } from './types.ts';

/** Player preferences stored in the profile. Each value is validated here, so a shell never writes raw input into a save. */
export type PreferenceAction =
  | { type: 'preference'; preference: 'sound' | 'marks'; value: boolean }
  | { type: 'preference'; preference: 'speed'; value: 1 | 2 }
  | { type: 'preference'; preference: 'motion'; value: 'system' | 'reduced' };

/** Applies one validated preference; returns whether the profile changed. Marks are stored only when on (optional field). */
export function applyPreference(profile: Profile, action: { preference: string; value: unknown }): boolean {
  const { preference, value } = action;
  if (preference === 'sound' && typeof value === 'boolean') return set(profile, 'sound', value);
  if (preference === 'speed' && (value === 1 || value === 2)) return set(profile, 'speed', value);
  if (preference === 'motion' && (value === 'system' || value === 'reduced')) return set(profile, 'motion', value);
  if (preference === 'marks' && typeof value === 'boolean') {
    if (value === (profile.marks === true)) return false;
    if (value) profile.marks = true; else delete profile.marks;
    return true;
  }
  return false;
}

function set<K extends 'sound' | 'speed' | 'motion'>(profile: Profile, key: K, value: Profile[K]): boolean {
  if (profile[key] === value) return false;
  profile[key] = value;
  return true;
}
