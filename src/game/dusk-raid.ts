import type { Encounter, EncounterWave } from './encounters.ts';
import type { BattleState, Profile } from './types.ts';

/**
 * «غارة الغسق», the dusk raid (DESIGN.md #51): the Lamplighter lights the wall lamps and one extra battle a day comes
 * out of the dark. Before it starts the player hangs three lamps on the field; raiders show only inside lamplight
 * (presentation: duskSight below). It is a different, harder fight, never a stronger army, and it pays nothing:
 * no coins, gems, kills, deployments, wins, seals or chapter progress, and no step of the pacing director. The profile
 * keeps only the day's stamp and, for a raid turned back, one more dusk banner on the village wall. Who may light the lamps is decided by the caller (the app's subscription, `lit`), never
 * stored: a player without the Lamplighter gets one raid as a sample.
 */
export const DUSK_LAMPS = 3;
/** After a raid turned back: a held breath before the result (the banner settles, one line), then the rating ask may follow. */
export const DUSK_HELD_BREATH_MS = 1500;
/** How far a lamp's light reaches along the field, in simulation x (the gates stand at 90 and 910). */
export const LAMP_REACH = 120;
const FIELD_MIN = 90, FIELD_MAX = 910;
/** Actions a raid in progress admits; everything that spends, earns or moves the road waits until it is over. */
export const DUSK_ACTIONS: ReadonlySet<string> = new Set(['start', 'pause', 'retreat', 'retry', 'spawn', 'skill', 'order', 'rally', 'dusk-lamp', 'preference']);

/** `kept`: raids turned back, each a dusk banner kept on the village wall (a keepsake; it buys nothing). */
export interface DuskStamp { day: number; sampled?: true; kept?: number }
export interface DuskBattle { lamps: number[]; settled?: true }

/** Whether the wall lamps can be lit today: once a day with the Lamplighter, once ever without him. */
export function duskAvailable(p: Readonly<Pick<Profile, 'dusk' | 'wins'>>, day: number, lit: boolean): boolean {
  if (!Number.isInteger(day) || day < 1 || p.wins < 1) return false;
  if (p.dusk?.day === day) return false;
  return lit || !p.dusk?.sampled;
}

/** Begins a raid on the ready field: stamps the day (and the sample) and marks the battle. */
export function beginDusk(p: Profile, s: BattleState, day: number, lit: boolean): boolean {
  if (s.phase !== 'ready' || s.dusk || p.pendingVictory || p.chronicle?.expedition || !duskAvailable(p, day, lit)) return false;
  p.dusk = { day, ...(lit && !p.dusk?.sampled ? {} : { sampled: true as const }), ...(p.dusk?.kept ? { kept: p.dusk.kept } : {}) };
  s.dusk = { lamps: [] };
  return true;
}

/** Hangs one lamp before the raid starts (simulation x, clamped to the field). */
export function placeDuskLamp(s: BattleState, x: number): boolean {
  if (!s.dusk || s.phase !== 'ready' || s.dusk.lamps.length >= DUSK_LAMPS || !Number.isFinite(x)) return false;
  s.dusk.lamps.push(Math.round(Math.max(FIELD_MIN, Math.min(FIELD_MAX, x))));
  return true;
}

/** The raiders: the chapter's waves, each with one more melee raider slipping in behind, and the first comes sooner. */
export function duskEncounter<T extends { readonly age: number; readonly waves: readonly EncounterWave[] }>(encounter: T): Encounter {
  return { age: encounter.age, waves: encounter.waves.map((wave, index) => ({ ...wave, time: index === 0 ? Math.max(2, wave.time - 1) : wave.time, members: [...wave.members, { kind: 0 as const, delay: (wave.members.at(-1)?.delay ?? 0) + 0.9 }] })) };
}

/** How visible a raider at `x` is: whole inside a lamp's light, a shadow beyond it. Always whole outside a raid. */
export function duskSight(s: Readonly<Pick<BattleState, 'dusk'>>, x: number): number {
  if (!s.dusk) return 1;
  const near = Math.min(...s.dusk.lamps.map(lamp => Math.abs(lamp - x)), Infinity);
  return near <= LAMP_REACH ? 1 : near <= LAMP_REACH + 40 ? 1 - .9 * (near - LAMP_REACH) / 40 : .1;
}

/** The raid is over: the profile returns to what it was when the lamps were lit (preferences aside); nothing is paid. */
export function settleDusk(p: Profile, s: BattleState, snapshot: string): void {
  if (!s.dusk || s.dusk.settled || (s.phase !== 'won' && s.phase !== 'lost')) return;
  const before = JSON.parse(snapshot) as Profile, keep = { sound: p.sound, speed: p.speed, motion: p.motion, introPending: p.introPending };
  for (const key of Object.keys(p) as (keyof Profile)[]) delete p[key];
  Object.assign(p, before, keep);
  if (keep.introPending === undefined) delete p.introPending;
  if (s.phase === 'won' && p.dusk) p.dusk = { ...p.dusk, kept: Math.min(999, (p.dusk.kept ?? 0) + 1) };
  s.earned = 0; s.dusk.settled = true;
}
