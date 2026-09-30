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
