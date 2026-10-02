import { BATTLE_TIME_EPSILON } from './battle-time.ts';
import { eraEconomyScale } from './data.ts';
import type { BattleState, ChapterMasteryRecord, MasteryProgress, Profile } from './types.ts';

export interface MasteryAward { record: ChapterMasteryRecord; eligibleMask: number; newMask: number; coins: number; gems: number; }
export interface ChapterMasteryView { record: ChapterMasteryRecord; thirdTitle: string; thirdRequirement: string; remainingCoins: number; remainingGems: number; }
export interface ObjectiveProgress { value: number; target: number; comparison: 'at-most' | 'at-least'; unit: 'seconds' | 'roles' | 'skills' | 'enemies' | 'deployments'; }
export interface AdvanceStatus { allowed: boolean; reason: 'available' | 'running' | 'uncleared' | 'complete' | 'invalid'; target: 'battle' | 'timeline' | 'none'; nextBattle: number | null; }
const definitions = [
  ['Before the Embers Fade', 'Win within 1:15.'],
  ['Every Hand', 'Win after deploying all three troop roles.'],
  ['A Steady Watch', 'Win using at most one skill.'],
  ['A Moment of Stillness', 'Freeze at least three living enemies together, then win.'],
  ['Break the Gathering', 'Defeat at least three enemies with one meteor, then win.'],
  ['A Small Company', 'Win with no more than eighteen deployments.'],
] as const;
const validChapter = (chapter: number) => Number.isInteger(chapter) && chapter >= 0 && chapter < 6;
const validTimeline = (timeline: number) => Number.isInteger(timeline) && timeline >= 1 && timeline <= 1000;
const validMask = (mask: unknown): mask is number => typeof mask === 'number' && Number.isInteger(mask) && mask >= 0 && mask <= 7;
const emptyRecord = (): ChapterMasteryRecord => ({ earnedMask: 0, bestSeconds: null, bestGateDamage: null });
const best = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(Number.MAX_SAFE_INTEGER,value) : null;
export function createMastery(timeline: number): MasteryProgress {
  return { timeline, chapters: Array.from({length:6},emptyRecord) as MasteryProgress['chapters'] };
}
export function normalizeMastery(value: unknown, timeline: number): MasteryProgress {
  const result = createMastery(timeline);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  const source = value as Record<string,unknown>;
  if (source.timeline !== timeline || !Array.isArray(source.chapters)) return result;
  const chapters = source.chapters as unknown[];
  result.chapters = result.chapters.map((fallback,index) => {
    const item = chapters[index];
    const record = item as Record<string,unknown>;
    if (!record || typeof record !== 'object' || Array.isArray(record)) return fallback;
    return { earnedMask: validMask(record.earnedMask) ? record.earnedMask : 0, bestSeconds: best(record.bestSeconds), bestGateDamage: best(record.bestGateDamage) };
  }) as MasteryProgress['chapters'];
  return result;
}
function recordFor(profile: Profile, chapter: number): ChapterMasteryRecord {
  return validChapter(chapter) ? normalizeMastery(profile.mastery,profile.timeline).chapters[chapter] : emptyRecord();
}
export function masteryObjectiveProgress(chapter: number, state: BattleState): ObjectiveProgress {
  switch (chapter) {
    case 0: return {value:state.time,target:75,comparison:'at-most',unit:'seconds'};
    case 1: return {value:state.stats.deployedByKind.filter(count=>count>=1).length,target:3,comparison:'at-least',unit:'roles'};
    case 2: return {value:state.stats.skillsCast,target:1,comparison:'at-most',unit:'skills'};
    case 3: return {value:state.stats.maxFreezeTargets,target:3,comparison:'at-least',unit:'enemies'};
    case 4: return {value:state.stats.meteorKills,target:3,comparison:'at-least',unit:'enemies'};
    case 5: return {value:state.stats.deployed,target:18,comparison:'at-most',unit:'deployments'};
    default: return {value:0,target:1,comparison:'at-least',unit:'enemies'};
  }
}
export function masteryEligibleMask(chapter: number, state: BattleState): number {
  if (!validChapter(chapter) || state.phase !== 'won') return 0;
  const objective = masteryObjectiveProgress(chapter,state);
  const tolerance = objective.unit === 'seconds' ? BATTLE_TIME_EPSILON : 0;
  const achieved = objective.comparison === 'at-most' ? objective.value <= objective.target + tolerance : objective.value >= objective.target - tolerance;
  return 1 | (state.stats.gateDamageTaken === 0 ? 2 : 0) | (achieved ? 4 : 0);
}
export function masteryReward(chapter: number, mask: number): { coins: number; gems: number } {
  if (!validChapter(chapter) || !validMask(mask)) return {coins:0,gems:0};
  return {coins: ((mask&1?150:0)+(mask&2?50:0)+(mask&4?100:0))*eraEconomyScale(chapter), gems:(mask&1?20:0)+(mask&2?15:0)+(mask&4?15:0)};
}
export function masteryAward(profile: Profile, state: BattleState): MasteryAward {
  const record = recordFor(profile,profile.enemyAge), eligibleMask = masteryEligibleMask(profile.enemyAge,state), newMask = eligibleMask & ~record.earnedMask;
  const reward = masteryReward(profile.enemyAge,newMask);
  if (eligibleMask) {
    record.earnedMask |= eligibleMask;
    record.bestSeconds = record.bestSeconds === null ? state.time : Math.min(record.bestSeconds,state.time);
    record.bestGateDamage = record.bestGateDamage === null ? state.stats.gateDamageTaken : Math.min(record.bestGateDamage,state.stats.gateDamageTaken);
  }
  return {record,eligibleMask,newMask,coins:Math.min(reward.coins,Math.max(0,1e9-profile.coins)),gems:Math.min(reward.gems,Math.max(0,1e7-profile.gems))};
}
export function chapterMastery(profile: Profile, chapter: number): ChapterMasteryView {
  const record = recordFor(profile,chapter), remaining = masteryReward(chapter,7 & ~record.earnedMask), definition = definitions[chapter];
  return {record,thirdTitle:definition?.[0] ?? '',thirdRequirement:definition?.[1] ?? '',remainingCoins:remaining.coins,remainingGems:remaining.gems};
}
export function advanceStatus(profile: Profile, state: Pick<BattleState,'phase'>): AdvanceStatus {
  const blocked = (reason: AdvanceStatus['reason']): AdvanceStatus => ({allowed:false,reason,target:'none',nextBattle:null});
  if (!validChapter(profile.enemyAge) || !validTimeline(profile.timeline)) return blocked('invalid');
  if (profile.enemyAge === 5 && profile.timeline === 1000) return blocked('complete');
  if (state.phase === 'running') return blocked('running');
  if (state.phase !== 'won' && !(recordFor(profile,profile.enemyAge).earnedMask & 1)) return blocked('uncleared');
  return {allowed:true,reason:'available',target:profile.enemyAge === 5 ? 'timeline' : 'battle',nextBattle:profile.enemyAge === 5 ? 0 : profile.enemyAge+1};
}
export function canRetry(profile: Profile, state: Pick<BattleState,'phase'>): boolean {
  if (!validChapter(profile.enemyAge) || !validTimeline(profile.timeline)) return false;
  return state.phase === 'lost' || state.phase === 'won' && (!!(recordFor(profile,profile.enemyAge).earnedMask&1) || profile.enemyAge === 5 && profile.timeline === 1000);
}
