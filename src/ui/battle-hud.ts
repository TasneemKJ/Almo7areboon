import { ERAS, foodRate, foodUpgradeCost, unlockCost } from '../game/data.ts';
import { cardPackCost } from '../game/cards.ts';
import type { WavePreview, WaveStatus } from '../game/encounters.ts';
import type { BattleState, Profile } from '../game/types.ts';
import { chapterMastery } from '../game/mastery.ts';
import { masteryAdvice } from './mastery-presentation.ts';

/** What most improves the next attempt, judged from what the player can afford right now. */
export function defeatAdvice(profile: Profile): string {
  if (!profile.unlocked[1] && profile.coins >= unlockCost(1, profile)) return 'Unlock your ranged troop so it can strike from behind your front line, then retry.';
  if (!profile.unlocked[2] && profile.coins >= unlockCost(2, profile)) return 'Unlock your heavy troop to hold the front line, then retry.';
  if (profile.foodLevel < 100 && profile.coins >= foodUpgradeCost(profile)) return 'Upgrade food production to deploy faster, then retry.';
  if (profile.gems >= cardPackCost(1)) return `You have ${profile.gems.toLocaleString('en-US')} gems: summon a card in Cards for a permanent boost, then retry.`;
  return 'Deploy earlier and mix melee with ranged troops. Winning any battle pays gems for cards.';
}

/** A single contextual instruction, not an onboarding panel over the battlefield. */
export function battleGuidance(profile: Profile, state: BattleState, preview?: WavePreview | null): string {
  if (state.phase === 'ready') return 'Tap Battle, then spend food to deploy warriors.';
  if (state.phase === 'won') return 'Victory! Continue to the next battle when you are ready.';
  if (state.phase === 'lost') return `Your coins are safe. ${masteryAdvice(profile,state)}`;
  if (state.paused) return 'Battle paused. Resume to deploy your army.';
  if (state.playerHp / state.playerMaxHp <= 0.3) return 'Your base is in danger. Deploy reinforcements or use a skill.';
  if (state.stats.deployed === 0 && state.food >= ERAS[profile.age].units[0].cost) return 'Deploy a melee warrior. Save some food for the next wave.';
  const wait = Math.ceil((ERAS[profile.age].units[0].cost - state.food) / foodRate(profile));
  if (wait > 0) return `More food in ${wait}s. Your warriors fight automatically.`;
  if (profile.wins < 3 && state.stats.skillsCast === 0 && state.time >= 25 && (!preview || preview.nextIn > 8)) return 'Try a skill: Freeze, Meteor or Food Drop. Each works once per battle.';
  if (preview) {
    if (preview.intent === 'volley') return 'Ranged enemies are coming. Melee guards take less damage from them.';
    if (preview.intent === 'rush' && profile.unlocked[2]) return 'A rush is coming. A heavy warrior can hit two enemies.';
    if (preview.intent === 'bulwark' && profile.unlocked[1]) return 'A heavy enemy is coming. Ranged troops deal extra damage to it.';
    return 'A stronger wave is coming. Save food and send melee warriors together.';
  }
  if (!profile.unlocked[1] && profile.coins >= unlockCost(1, profile)) return 'Ranged troops are affordable. Unlock them behind your front line.';
  if (state.food >= 90) return 'Food storage is nearly full. Deploy a stronger army now.';
  const objective=chapterMastery(profile,profile.enemyAge);
  if(!(objective.record.earnedMask&4))return objective.thirdRequirement;
  return profile.unlocked[1] ? 'Protect ranged troops with a front line of melee warriors.' : 'Save food and deploy together to overwhelm the enemy.';
}

export function compactNumber(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safe >= 1e15) return safe.toExponential(1).replace('e+', 'e');
  for (const [limit, suffix] of [[1e12, 't'], [1e9, 'b'], [1e6, 'm'], [1e3, 'k']] as const) {
    if (safe >= limit) return `${(safe / limit).toFixed(1).replace(/\.0$/, '')}${suffix}`;
  }
  return Math.ceil(safe).toString();
}

export function baseHealthDisplay(hp: number, maximum: number): { ratio: number; label: string; danger: boolean } {
  const max = Number.isFinite(maximum) && maximum > 0 ? maximum : 1;
  const current = Math.max(0, Math.min(max, Number.isFinite(hp) ? hp : 0));
  const ratio = current / max;
  return { ratio, label: `${compactNumber(current)} / ${compactNumber(max)}`, danger: ratio <= 0.3 };
}


/** Compact visible chip; delayed final members always precede clearance. */
export function waveLabel(status: WaveStatus): string {
  const p=status.preview;
  if(p){
    const counts=p.counts.flatMap((count,index)=>count>0?[`${count}${['M','R','H'][index]}`]:[]).join(' ');
    return `${p.intent.toUpperCase()} ${p.number}/${p.total} · ${counts} · ${Math.ceil(p.nextIn)}s`;
  }
  if(status.pendingEnemies>0)return `FINAL WAVE · ${status.pendingEnemies} INCOMING`;
  return status.cleared?'WAVES CLEARED · ATTACK THE BASE':`${status.enemiesRemaining} ENEMIES REMAIN`;
}

/** Updated accessible name, deliberately not a countdown live region. */
export function waveAccessibleLabel(status: WaveStatus): string {
  const p=status.preview;
  if(!p)return status.pendingEnemies>0?`Final wave. ${status.pendingEnemies} ${status.pendingEnemies===1?'enemy':'enemies'} incoming.`:status.cleared?'Waves cleared. Attack the base.':`${status.enemiesRemaining} enemies remain.`;
  const counts=p.counts.flatMap((count,index)=>count>0?[`${count} ${['melee','ranged','heavy'][index]}`]:[]).join(', ');
  return `${p.intent[0].toUpperCase()+p.intent.slice(1)} wave ${p.number} of ${p.total}. ${counts}. Arrives in ${Math.ceil(p.nextIn)} seconds.`;
}
