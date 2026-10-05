import { dailyReward } from '../game/data.ts';
import type { Profile } from '../game/types.ts';
import { journeyGoals } from './journey-screen.ts';

const NOUN = { wins: ['win', 'wins'], kills: ['enemy', 'enemies'], deployed: ['warrior', 'warriors'] } as const;
const number = (value: number) => Math.floor(value).toLocaleString('en-US');

/** One honest, read-only reason to open the journal; it never claims or spends anything. */
export function nextGoalLabel(profile: Readonly<Profile>, day: number): { text: string; label: string } {
  const daily = dailyReward(profile, day);
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
