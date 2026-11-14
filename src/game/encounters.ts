import type { UnitKind } from './types.ts';

export type WaveIntent = 'rush' | 'volley' | 'bulwark';
export interface WaveMember { readonly kind: UnitKind; readonly delay: number; }
export interface EncounterWave { readonly time: number; readonly intent: WaveIntent; readonly members: readonly WaveMember[]; }
export interface Encounter { readonly age: number; readonly waves: readonly EncounterWave[]; }
export interface ScheduledSpawn { readonly time: number; readonly waveIndex: number; readonly memberIndex: number; readonly kind: UnitKind; }
export interface WavePreview { readonly number: number; readonly total: number; readonly intent: WaveIntent; readonly counts: readonly [number, number, number]; readonly nextIn: number; }
export interface WaveStatus { readonly spawned: number; readonly total: number; readonly nextIn: number | null; readonly enemiesRemaining: number; readonly pendingEnemies: number; readonly cleared: boolean; readonly preview: WavePreview | null; }

const wave = (time: number, intent: WaveIntent, members: readonly (UnitKind | readonly [UnitKind, number])[]): EncounterWave => Object.freeze({ time, intent, members: Object.freeze(members.map(member => Object.freeze(typeof member === 'number' ? { kind: member, delay: 0 } : { kind: member[0], delay: member[1] }))) });
const encounters: readonly Encounter[] = Object.freeze([
  [wave(3,'rush',[0]),wave(14,'rush',[0,[0,0.4]]),wave(24,'volley',[0,[1,1.2]]),wave(38,'rush',[0,[0,0.6]]),wave(52,'bulwark',[2])],
  [wave(4,'rush',[0]),wave(15,'rush',[0,[0,0.6]]),wave(27,'volley',[0,[1,1.4]]),wave(41,'volley',[0,[1,1.2],[1,2.4]]),wave(56,'bulwark',[2,[0,1]])],
  [wave(3,'rush',[0]),wave(13,'rush',[0,[0,0.5],[0,1]]),wave(26,'bulwark',[2,[0,1.2]]),wave(40,'rush',[0,[0,0.4]]),wave(54,'volley',[1,[1,1.4]])],
  [wave(4,'rush',[0]),wave(16,'volley',[0,[1,1.4]]),wave(28,'volley',[0,[1,1.2],[1,2.4]]),wave(42,'bulwark',[2,[1,1.2]]),wave(57,'rush',[0,[0,0.5]])],
  [wave(3,'rush',[0]),wave(14,'rush',[0,[0,1.2]]),wave(28,'volley',[1,[1,1]]),wave(43,'volley',[0,[1,0.5],[1,1]]),wave(58,'bulwark',[2,[1,1.4]])],
  [wave(4,'rush',[0,[0,0.5],[0,1]]),wave(15,'rush',[0]),wave(29,'volley',[0,[1,1.2],[1,2.4]]),wave(44,'bulwark',[2,[1,1.2]]),wave(60,'bulwark',[2,[0,1]])],
].map((waves,age) => Object.freeze({ age, waves: Object.freeze(waves) })));

export function encounterForAge(age: number): Encounter { return encounters[Number.isInteger(age) && age >= 0 && age < encounters.length ? age : 0]; }
export function scheduledSpawns(encounter: Encounter): readonly ScheduledSpawn[] {
  return Object.freeze(encounter.waves.flatMap((wave,waveIndex) => wave.members.map((member,memberIndex) => Object.freeze({ time: wave.time + member.delay, waveIndex, memberIndex, kind: member.kind }))).sort((a,b) => a.time-b.time || a.waveIndex-b.waveIndex || a.memberIndex-b.memberIndex));
}
export function wavePreview(encounter: Encounter, time: number, wavesLaunched: number): WavePreview | null {
  const index=Number.isFinite(wavesLaunched) ? Math.max(0,Math.min(encounter.waves.length,Math.floor(wavesLaunched))) : 0;
  const wave=encounter.waves[index];
  if(!wave) return null;
  const counts: [number,number,number]=[0,0,0];
  for(const member of wave.members) counts[member.kind]++;
  return Object.freeze({ number:index+1,total:encounter.waves.length,intent:wave.intent,counts:Object.freeze(counts),nextIn:Math.max(0,wave.time-(Number.isFinite(time)?time:0)) });
}

/** How much later each wave of the eased battle 2 arrives (a slight ease; see `easesLoneCompany`). */
export const LONE_COMPANY_DELAY = 1.1;
/**
 * Battle 2 (Olive Terraces, the first timeline) eases a little for a company that still has only its first troop: a new
 * player who had not found Camp met a wall there (audit 2026-11-14: thirteen defeats in a row). Each wave arrives a
 * tenth later, so bread has a little more time. In the rules simulation (scripts/qa-gate/bot-sim.ts and chapter2-sim.ts)
 * a lone spammer who never visits Camp still loses every try, while a player who uses Food Drop now wins about half the
 * first tries. Read when the battle starts, so a troop invited in Camp first meets the full chapter. A company with a
 * second troop, a later chapter or a harder timeline is unchanged.
 */
export function easesLoneCompany(p: { readonly age: number; readonly enemyAge: number; readonly timeline: number; readonly unlocked: readonly boolean[] }): boolean {
  return p.enemyAge === 1 && p.age === 0 && p.timeline === 1 && !p.unlocked[1] && !p.unlocked[2];
}
export function loneCompanyEncounter<T extends { readonly age: number; readonly waves: readonly EncounterWave[] }>(encounter: T): { age: number; waves: EncounterWave[] } {
  return { age: encounter.age, waves: encounter.waves.map(wave => ({ ...wave, time: Math.round(wave.time * LONE_COMPANY_DELAY * 10) / 10 })) };
}
/**
 * The pacing director («قارئ الإيقاع», STUDIO-BAR "non-boring and high retention"): after two defeats in a row the next
 * battle is winnable but still tense, quietly, with no label. The rival's waves after the first thin (their trailing
 * members stay home), their troops are a tenth weaker (and an older company meets them nearer its own age) and the camp starts with a little more bread; each further defeat
 * in the streak thins one more member and takes another tenth, up to three steps. It ends with the next victory. Checked by scripts/qa-gate/streak-sim.ts (a naive player's 30 battles).
 */
/** A retreat after this long is a stalemate (the gate held, the rival's did too): it counts like a fallen gate. */
export const STALEMATE_SECONDS = 150;
export const RALLY_AFTER_LOSSES = 2, RALLY_FOOD = 5, RALLY_WEAKEN = .1;
/** 0 when no rally applies, else 1..3 by the length of the defeat streak. */
export function rallyLevel(p: { readonly lossStreak?: number }): number {
  const streak = p.lossStreak ?? 0;
  return streak >= RALLY_AFTER_LOSSES ? Math.min(3, streak - RALLY_AFTER_LOSSES + 1) : 0;
}
/** The rival's strength during a rally: a little less with each further defeat in the streak (1 when no rally applies). */
/**
 * The rival's strength during a rally (1 when none applies): a tenth less for each step, and a company still in an
 * older age than the rival (a player who has not moved camp) meets it half an age nearer at the first step and at its
 * own age from the second. Applied to the rival's troops and to its gate.
 */
export function rallyPower(p: { readonly lossStreak?: number; readonly age?: number; readonly enemyAge?: number }): number {
  const level = rallyLevel(p), gap = Math.max(0, (p.enemyAge ?? 0) - (p.age ?? 0));
  return level ? (1 - RALLY_WEAKEN * level) * 1.65 ** (-gap * Math.min(1, level / 2)) : 1;
}
export function rallyEncounter<T extends { readonly age: number; readonly waves: readonly EncounterWave[] }>(encounter: T, level: number): { age: number; waves: EncounterWave[] } {
  return { age: encounter.age, waves: encounter.waves.map((wave, index) => index >= 1 && wave.members.length > 1 ? { ...wave, members: wave.members.slice(0, Math.max(1, wave.members.length - level)) } : wave) };
}
/** The waves this company meets: the lone-company ease and the rally where they apply, otherwise the chapter as it is. */
export function companyEncounter<T extends { readonly age: number; readonly waves: readonly EncounterWave[] }>(p: Parameters<typeof easesLoneCompany>[0] & { readonly lossStreak?: number }, encounter: T): T | { age: number; waves: EncounterWave[] } {
  const eased = easesLoneCompany(p) ? loneCompanyEncounter(encounter) : encounter, level = rallyLevel(p);
  return level ? rallyEncounter(eased, level) : eased;
}
