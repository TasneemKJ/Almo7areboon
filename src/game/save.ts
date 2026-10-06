import { createChronicle, normalizeChronicle, normalizeChronicleReceipt } from './chronicle.ts';
import { normalizeLegacy } from './prestige.ts';
import { createMastery, normalizeMastery, masteryReward } from './mastery.ts';
import { battleStats } from './statistics.ts';
import { CARD_DEFS, MAX_DAILY_DAY, QUESTS } from './data.ts';
import type { Profile } from './types.ts';

export const SAVE_KEY = 'almo7areboon.save.v1';
export const BACKUP_KEY = `${SAVE_KEY}.backup`;
export const MAX_SAVE_CHARS = 100_000;
export type LoadStatus = 'loaded' | 'new' | 'recovered' | 'corrupt' | 'unsupported' | 'unavailable';

export function defaultProfile(): Profile {
  return { version: 5, chronicle: createChronicle(), legacy: {rank:0,selected:'hearth'}, mastery: createMastery(1), timeline: 1, age: 0, enemyAge: 0, furthestBattle: 0, coins: 0, gems: 100, foodLevel: 0, baseLevel: 0, unlocked: [true, false, false], cards: CARD_DEFS.map(() => 0), summonCount: 0, summonSeed: 0x6d2b79f5, pendingVictory: null, kills: 0, wins: 0, deployed: 0, claimed: [], dailyDay: 0, dailyStreak: 0, sound: true, speed: 1, motion: 'system' };
}

function integer(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : fallback;
}

function validate(value: unknown): Profile {
  const clean = defaultProfile();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  const data = value as Record<string, unknown>;
  if (data.version !== 1 && data.version !== 2 && data.version !== 3 && data.version !== 4 && data.version !== 5) return clean;
  clean.timeline = integer(data.timeline, 1, 1, 1000);
  clean.legacy = normalizeLegacy(data.legacy,clean.timeline,data.version as number);
  clean.mastery = (data.version === 3 || data.version === 4 || data.version === 5) ? normalizeMastery(data.mastery, clean.timeline) : createMastery(clean.timeline);
  clean.age = integer(data.age, 0, 0, 5);
  clean.enemyAge = integer(data.enemyAge, 0, 0, 5);
  clean.furthestBattle = Math.max(clean.enemyAge, integer(data.furthestBattle, clean.enemyAge, 0, 5));
  clean.chronicle = normalizeChronicle(data.chronicle,clean.timeline,clean.enemyAge);
  if(clean.chronicle.expedition && (clean.chronicle.expedition.chapter!==clean.enemyAge || clean.chronicle.expedition.chapter>clean.furthestBattle)){clean.chronicle.expedition=null;clean.chronicle.chapter=clean.enemyAge;clean.chronicle.route='road';}
  clean.coins = integer(data.coins, 0, 0, 1e9);
  clean.gems = integer(data.gems, 100, 0, 1e7);
  clean.foodLevel = integer(data.foodLevel, 0, 0, 100);
  clean.baseLevel = integer(data.baseLevel, 0, 0, 100);
  clean.kills = integer(data.kills, 0, 0, 1e9);
  clean.wins = integer(data.wins, 0, 0, 1e9);
  clean.deployed = integer(data.deployed, 0, 0, 1e9);
  if (Array.isArray(data.unlocked)) clean.unlocked = [true, data.unlocked[1] === true, data.unlocked[2] === true];
  if (Array.isArray(data.cards)) {
    if (data.version === 1 && data.cards.length <= 6) {
      // Prototype identities: damage / health / damage / health / damage / health.
      const legacyIndices = [18, 0, 8, 3, 17, 1];
      data.cards.forEach((copies, index) => {
        clean.cards[legacyIndices[index]] = integer(copies, 0, 0, 1000);
      });
    } else {
      clean.cards = CARD_DEFS.map((_, i) => integer((data.cards as unknown[])[i], 0, 0, 1000));
    }
  }
  clean.summonCount = integer(data.summonCount, clean.cards.reduce((sum, copies) => sum + copies, 0), 0, 1e9);
  clean.summonSeed = integer(data.summonSeed, 0x6d2b79f5, 1, 0xffffffff);
  if (data.pendingVictory && typeof data.pendingVictory === 'object' && !Array.isArray(data.pendingVictory)) {
    const victory = data.pendingVictory as Record<string, unknown>;
    const finiteFields = ['earned', 'seconds', 'playerHp'].every(key => typeof victory[key] === 'number' && Number.isFinite(victory[key]) && (victory[key] as number) >= 0);
    if (victory.timeline === clean.timeline && victory.battle === clean.enemyAge && finiteFields) {
      clean.pendingVictory = {
        settlement: 'legacy',
        stats: battleStats(victory.stats),
        timeline: clean.timeline, battle: clean.enemyAge,
        earned: integer(victory.earned, 0, 0, 1e9),
        seconds: Math.min(86400, victory.seconds as number),
        playerHp: victory.playerHp as number,
      };
      const validMask = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 7;
      const { eligibleMask, newMask, masteryCoins, masteryGems } = victory;
      if ((data.version === 3 || data.version === 4 || data.version === 5) && victory.settlement === 'mastery-v1' && validMask(eligibleMask) && validMask(newMask)
          && (eligibleMask & 1) !== 0 && (newMask & ~eligibleMask) === 0
          && (clean.mastery.chapters[clean.enemyAge].earnedMask & eligibleMask) === eligibleMask
          && typeof masteryCoins === 'number' && Number.isInteger(masteryCoins) && masteryCoins >= 0
          && typeof masteryGems === 'number' && Number.isInteger(masteryGems) && masteryGems >= 0) {
        const reward = masteryReward(clean.enemyAge,newMask);
        if (masteryCoins <= reward.coins && masteryGems <= reward.gems && masteryCoins <= clean.pendingVictory.earned) {
          clean.pendingVictory = { ...clean.pendingVictory, settlement: 'mastery-v1', eligibleMask, newMask, masteryCoins, masteryGems };
        }
      }
    }
  }
  if(clean.pendingVictory && clean.chronicle && data.version===5){
    const victory=data.pendingVictory as Record<string,unknown>;
    const story=normalizeChronicleReceipt(victory.story,clean.chronicle.route);
    if(story)clean.pendingVictory.story=story;
  }
  if (Array.isArray(data.claimed)) clean.claimed = QUESTS.filter(quest => (data.claimed as unknown[]).includes(quest.id)).map(quest => quest.id);
  clean.dailyDay = integer(data.dailyDay, 0, 0, MAX_DAILY_DAY);
  clean.dailyStreak = clean.dailyDay ? integer(data.dailyStreak, 0, 0, 1e6) : 0;
  // Optional weekly seal goal: a plausible week index, a base inside the possible seal count, claimed only when true.
  const weekly = data.weekly as Record<string, unknown> | undefined;
  if (weekly && typeof weekly === 'object' && !Array.isArray(weekly) && Number.isInteger(weekly.week) && (weekly.week as number) >= 0 && (weekly.week as number) <= 200_000 && Number.isInteger(weekly.baseSeals) && (weekly.baseSeals as number) >= 0 && (weekly.baseSeals as number) <= 18) {
    clean.weekly = { week: weekly.week as number, baseSeals: weekly.baseSeals as number, ...(weekly.claimed === true ? { claimed: true as const } : {}) };
  }
  // Optional: epoch ms of the last save; only a plausible past-or-near-present time survives.
  if (typeof data.lastSeen === 'number' && Number.isInteger(data.lastSeen) && data.lastSeen > 0 && data.lastSeen <= 4_102_444_800_000) clean.lastSeen = data.lastSeen;
  // Optional: the day a grace day was last used. Kept only when it is a real past-or-present claim day.
  if (clean.dailyDay && typeof data.graceDay === 'number' && Number.isInteger(data.graceDay) && data.graceDay > 0 && data.graceDay <= clean.dailyDay) clean.graceDay = data.graceDay;
  if (typeof data.sound === 'boolean') clean.sound = data.sound;
  clean.speed = data.speed === 2 ? 2 : 1;
  clean.motion = data.motion === 'reduced' ? 'reduced' : 'system';
  // Optional preference: stored only when on, so existing saves keep their exact shape.
  if (data.marks === true) clean.marks = true;
  return clean;
}

export function decodeSave(raw: string): { profile: Profile | null; problem: 'corrupt' | 'unsupported' | null } {
  if (typeof raw !== 'string' || raw.length > MAX_SAVE_CHARS) return { profile: null, problem: 'corrupt' };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { profile: null, problem: 'corrupt' };
    const version = (value as Record<string, unknown>).version;
    if (version !== 1 && version !== 2 && version !== 3 && version !== 4 && version !== 5) return { profile: null, problem: typeof version === 'number' ? 'unsupported' : 'corrupt' };
    const data = value as Record<string, unknown>;
    const story=data.chronicle;
    if(story && typeof story==='object' && !Array.isArray(story) && typeof (story as Record<string,unknown>).version==='number' && ((story as Record<string,unknown>).version as number)>1)return {profile:null,problem:'unsupported'};
    if (!Array.isArray(data.cards) || !['timeline', 'age', 'enemyAge', 'coins'].every(key => key in data)) return { profile: null, problem: 'corrupt' };
    return { profile: validate(value), problem: null };
  } catch { return { profile: null, problem: 'corrupt' }; }
}

export function loadProfileWithStatus(storage?: Pick<Storage, 'getItem'>): { profile: Profile; status: LoadStatus } {
  try {
    const source = storage ?? globalThis.localStorage;
    if (!source) return { profile: defaultProfile(), status: 'unavailable' };
    const raw = source.getItem(SAVE_KEY);
    const primary = raw ? decodeSave(raw) : null;
    if (primary?.profile) return { profile: primary.profile, status: 'loaded' };
    // A newer schema must never be overwritten by silently restoring an older one.
    if (primary?.problem === 'unsupported') return { profile: defaultProfile(), status: 'unsupported' };
    const backupRaw = source.getItem(BACKUP_KEY), backup = backupRaw ? decodeSave(backupRaw) : null;
    if (backup?.profile) return { profile: backup.profile, status: 'recovered' };
    if (backup?.problem === 'unsupported') return { profile: defaultProfile(), status: 'unsupported' };
    return { profile: defaultProfile(), status: raw || backupRaw ? 'corrupt' : 'new' };
  } catch { return { profile: defaultProfile(), status: 'unavailable' }; }
}

export function loadProfile(storage?: Pick<Storage, 'getItem'>): Profile {
  return loadProfileWithStatus(storage).profile;
}

export function saveProfile(profile: Profile, storage?: Pick<Storage, 'setItem'> & Partial<Pick<Storage, 'getItem'>>): boolean {
  try {
    const destination = storage ?? globalThis.localStorage;
    if (!destination) return false;
    const validated = decodeSave(JSON.stringify(profile)).profile;
    if (!validated) return false;
    const encoded = JSON.stringify(validated);
    // Refuse writes if an existing profile belongs to a newer game version.
    // Read failures also fail closed; an unknown save must not be replaced.
    let backup = encoded;
    if (destination.getItem) {
      const previous = destination.getItem(SAVE_KEY);
      const retained = destination.getItem(BACKUP_KEY);
      if ([previous, retained].some(raw => raw && decodeSave(raw).problem === 'unsupported')) return false;
      if (previous && decodeSave(previous).profile) backup = previous;
      else if (retained && decodeSave(retained).profile) backup = retained;
    }
    // Commit primary first: a rejected import must not leave the new profile
    // recoverable via backup after the interface reports that it was rejected.
    destination.setItem(SAVE_KEY, encoded);
    try { destination.setItem(BACKUP_KEY, backup); } catch { /* Primary save is already durable. */ }
    return true;
  } catch { return false; }
}
