import { dailyReward } from '../game/data.ts';
import type { Profile } from '../game/types.ts';
import { journeyGoals } from './journey-screen.ts';
import { counted } from './battle-hud.ts';
import { isArabic, tr } from './i18n.ts';

const NOUN = { wins: ['win', 'wins'], kills: ['enemy', 'enemies'], deployed: ['warrior', 'warriors'] } as const;
/** Arabic forms for one, two, 3-10 and 11+, picked at render time. */
const NOUN_AR = { wins: ['انتصار واحد', 'انتصاران', 'انتصارات', 'انتصاراً'], kills: ['عدوّ واحد', 'عدوّان', 'أعداء', 'عدوّاً'], deployed: ['محارب واحد', 'محاربان', 'محاربين', 'محارباً'] } as const;
/** Gems with Arabic agreement; the dual is oblique after a verb or preposition ("استلم جوهرتين"). */
const gems = (value: number, oblique = false) => counted(value, ['gem', 'gems'], ['جوهرة واحدة', oblique ? 'جوهرتين' : 'جوهرتان', 'جواهر', 'جوهرة'], number);
const number = (value: number) => Math.floor(value).toLocaleString('en-US');

/** One honest, read-only reason to open the journal; it never claims or spends anything. */
export function nextGoalLabel(profile: Readonly<Profile>, day: number): { text: string; label: string } {
  const daily = dailyReward(profile, day);
  if (isArabic()) return arabicGoal(profile, daily);
  if (daily.available) return { text: `Daily reward · ${daily.gems} gems`, label: `Your journey. Daily reward ready: ${daily.gems} gems.` };
  const goals = journeyGoals(profile);
  const ready = goals.find(goal => goal.claimable);
  if (ready?.quest) return { text: `Claim ${number(ready.quest.reward)} gems`, label: `Your journey. A milestone is ready: claim ${number(ready.quest.reward)} gems.` };
  const open = goals.filter(goal => goal.quest).sort((a, b) => b.progress - a.progress)[0];
  if (open?.quest) {
    const remaining = Math.max(1, open.quest.target - open.count);
    const noun = NOUN[open.stat][remaining === 1 ? 0 : 1];
    return { text: `${number(remaining)} ${noun} to ${number(open.quest.reward)} gems`, label: `Your journey. ${number(remaining)} more ${noun} earns ${number(open.quest.reward)} gems.` };
  }
  return { text: 'Your journey', label: 'Your journey' };
}

function arabicGoal(profile: Readonly<Profile>, daily: ReturnType<typeof dailyReward>): { text: string; label: string } {
  if (daily.available) return { text: `مكافأة اليوم · ${gems(daily.gems)}`, label: `رحلتك. مكافأة اليوم جاهزة: ${gems(daily.gems)}.` };
  const goals = journeyGoals(profile);
  const ready = goals.find(goal => goal.claimable);
  if (ready?.quest) return { text: `استلم ${gems(ready.quest.reward, true)}`, label: `رحلتك. مَعلَمٌ جاهز: استلم ${gems(ready.quest.reward, true)}.` };
  const open = goals.filter(goal => goal.quest).sort((a, b) => b.progress - a.progress)[0];
  if (open?.quest) {
    const remaining = Math.max(1, open.quest.target - open.count);
    const left = counted(remaining, [...NOUN[open.stat]], [...NOUN_AR[open.stat]], number);
    return { text: `${left} حتى ${gems(open.quest.reward, true)}`, label: `رحلتك. بقي ${left} لتكسب ${gems(open.quest.reward, true)}.` };
  }
  return { text: tr('Your journey', 'رحلتك'), label: tr('Your journey', 'رحلتك') };
}
