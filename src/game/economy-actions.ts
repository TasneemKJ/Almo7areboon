import { ERAS, QUESTS, baseUpgradeCost, dailyReward, foodUpgradeCost, unlockCost } from './data.ts';
import { cardPackCost, stageCardPack } from './cards.ts';
import { MAX_WEEK, syncWeekly, weeklyStatus } from './weekly.ts';
import type { Action, GameEvent, Phase, Profile } from './types.ts';

type ActionOf<T extends Action['type']> = Action & { type: T };

/** What the economy actions need from the game: the profile, the wallet and a few lifecycle hooks. */
export interface EconomyPort {
  readonly profile: Profile;
  readonly phase: Phase;
  canPrepare(): boolean;
  spend(cost: number): boolean;
  upgradeAllowed(stat: 'food' | 'base'): boolean;
  refreshBaseHealth(): void;
  /** Replaces the battle with a fresh one for the current profile. */
  restartBattle(): void;
  restorePendingVictory(): void;
  emit(event: GameEvent): void;
}

export function unlockTroop(game: EconomyPort, action: ActionOf<'unlock'>): boolean {
  const { profile } = game;
  if (![1, 2].includes(action.kind) || profile.unlocked[action.kind] || !game.spend(unlockCost(action.kind, profile))) return false;
  profile.unlocked[action.kind] = true;
  game.emit({ type: 'upgrade' });
  return true;
}

export function upgradeBase(game: EconomyPort, action: ActionOf<'upgrade'>): boolean {
  const { profile } = game;
  if (!game.upgradeAllowed(action.stat)) return false;
  if (action.stat === 'food') {
    if (profile.foodLevel >= 100 || !game.spend(foodUpgradeCost(profile))) return false;
    profile.foodLevel++;
  } else if (action.stat === 'base') {
    if (profile.baseLevel >= 100 || !game.spend(baseUpgradeCost(profile))) return false;
    profile.baseLevel++;
    game.refreshBaseHealth();
  } else return false;
  game.emit({ type: 'upgrade' });
  return true;
}

export function evolve(game: EconomyPort): boolean {
  const { profile } = game;
  if (game.phase === 'running' || profile.age >= 5 || profile.age > profile.enemyAge || !game.spend(ERAS[profile.age].evolveCost)) return false;
  profile.age++;
  // The company walks on together (free-path-sim.ts, 2026-11-14). The troops who joined come along, in the new place's
  // dress, and the coins left after the price travel in the purse; only the storehouse and the gate are built again.
  // The new camp's prices are eight times higher, so the purse buys about an eighth of what it did: enough bread that
  // the first battle in a new place is not lost before it starts. Before this, a moved camp arrived with one troop and
  // nothing in the purse, and a free player lost every chapter from 3 to 6 until the pacing director stepped in.
  profile.foodLevel = 0;
  profile.baseLevel = 0;
  game.restartBattle();
  game.restorePendingVictory();
  game.emit({ type: 'evolve' });
  return true;
}

export function summonCards(game: EconomyPort, action: ActionOf<'summon'>): boolean {
  const { profile } = game;
  const count = action.count ?? 1;
  if (!game.canPrepare() || ![1, 10, 50].includes(count)) return false;
  const cost = cardPackCost(count as 1 | 10 | 50);
  if (profile.gems < cost) return false;
  const pack = stageCardPack(profile, count);
  if (!pack) return false;
  profile.gems -= cost;
  profile.cards = pack.cards;
  game.refreshBaseHealth();
  profile.summonSeed = pack.seed;
  profile.summonCount = pack.draws;
  game.emit({ type: 'upgrade', amount: pack.indices[0], cardIndices: pack.indices });
  return true;
}

export function claimDaily(game: EconomyPort, action: ActionOf<'daily'>): boolean {
  const { profile } = game;
  const reward = dailyReward(profile, action.day);
  if (!reward.available) return false;
  profile.dailyDay = action.day;
  profile.dailyStreak = Math.min(1e6, reward.streak);
  if (reward.graced) profile.graceDay = action.day;
  profile.gems = Math.min(1e7, profile.gems + reward.gems);
  game.emit({ type: 'upgrade' });
  return true;
}

export function syncWeek(game: EconomyPort, action: ActionOf<'weekly-sync'>): boolean {
  return syncWeekly(game.profile, action.week, action.earned);
}

export function claimWeekly(game: EconomyPort, action: ActionOf<'weekly'>): boolean {
  const { profile } = game;
  // Claim admission is read-only: only an explicitly synchronized week can pay.
  if (!Number.isInteger(action.week) || action.week < 0 || action.week > MAX_WEEK || profile.weekly?.week !== action.week) return false;
  const status = weeklyStatus(profile, action.week);
  if (!status.ready) return false;
  profile.weekly = { ...profile.weekly!, claimed: true };
  profile.gems = Math.min(1e7, profile.gems + status.gems);
  game.emit({ type: 'upgrade' });
  return true;
}

export function claimQuest(game: EconomyPort, action: ActionOf<'claim'>): boolean {
  const { profile } = game;
  const quest = QUESTS.find(q => q.id === action.id);
  if (!quest || profile.claimed.includes(quest.id) || profile[quest.stat] < quest.target) return false;
  profile.claimed.push(quest.id);
  profile.gems = Math.min(1e7, profile.gems + quest.reward);
  game.emit({ type: 'upgrade' });
  return true;
}
