import { advanceStatus, normalizeMastery } from './mastery.ts';
import type { BattleState, LegacyChoice, LegacyEffects, LegacyProgress, LegacyRank, PrestigePreview, Profile } from './types.ts';
export type { LegacyChoice, LegacyEffects, LegacyProgress, LegacyRank, PrestigePreview } from './types.ts';

export function isLegacyChoice(value: unknown): value is LegacyChoice {
  return value === 'hearth' || value === 'watch' || value === 'stillness';
}
export function normalizeLegacy(value: unknown, timeline: number, sourceVersion: number): LegacyProgress {
  const fallback = timeline > 1 ? 1 : 0;
  if (sourceVersion !== 4 && sourceVersion !== 5) return {rank:fallback,selected:'hearth'};
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
  const rank = typeof record.rank === 'number' && Number.isInteger(record.rank) && record.rank >= 0 && record.rank <= 3 ? record.rank as LegacyRank : fallback;
  return {rank,selected:isLegacyChoice(record.selected)?record.selected:'hearth'};
}
export function legacyEffects(legacy: LegacyProgress): LegacyEffects {
  return {startingFood:legacy.selected==='hearth'?6+2*legacy.rank:6,gateFactor:legacy.selected==='watch'?1+0.10*legacy.rank:1,freezeSeconds:legacy.selected==='stillness'?7+legacy.rank:7};
}
export function currentSealCount(profile: Profile): number {
  return normalizeMastery(profile.mastery,profile.timeline).chapters.reduce((total,{earnedMask})=>total+(earnedMask&1?1:0)+(earnedMask&2?1:0)+(earnedMask&4?1:0),0);
}
export function legacyCandidateRank(earnedSeals: number): 1 | 2 | 3 {
  return earnedSeals>=18?3:earnedSeals>=12?2:1;
}
export function prestigePreview(profile: Profile, state: BattleState, choice: LegacyChoice): PrestigePreview | null {
  const advancement = advanceStatus(profile,state);
  if (!isLegacyChoice(choice) || !advancement.allowed || advancement.target !== 'timeline') return null;
  const earnedSeals=currentSealCount(profile),rankAfter=Math.max(profile.legacy.rank,legacyCandidateRank(earnedSeals)) as LegacyRank;
  const timelineGemCredit=Math.min(100,Math.max(0,1e7-profile.gems));
  return {expectedTimeline:profile.timeline,nextTimeline:profile.timeline+1,currentEnemyFactor:1+0.22*(profile.timeline-1),nextEnemyFactor:1+0.22*profile.timeline,earnedSeals,rankBefore:profile.legacy.rank,rankAfter,choice,effects:legacyEffects({rank:rankAfter,selected:choice}),timelineGemCredit,gemsBefore:profile.gems,gemsAfter:profile.gems+timelineGemCredit,nextRank:rankAfter===3?null:rankAfter===2?{rank:3,remainingSeals:18-earnedSeals}:{rank:2,remainingSeals:12-earnedSeals}};
}
