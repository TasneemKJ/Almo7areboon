import { CAPTAINS, type MissionObjective } from '../game/chronicle.ts';
import { ERAS, foodRate, foodUpgradeCost, unlockCost } from '../game/data.ts';
import { cardPackCost } from '../game/cards.ts';
import type { WavePreview, WaveStatus } from '../game/encounters.ts';
import type { BattleState, DeploymentStatus, Profile } from '../game/types.ts';
import { chapterMastery } from '../game/mastery.ts';
import { masteryAdvice } from './mastery-presentation.ts';
import { chapterScouting } from './chapter-scouting.ts';

/** What most improves the next attempt, judged from what the player can afford right now. */
export function defeatAdvice(profile: Profile): string {
  if (!profile.unlocked[1] && profile.coins >= unlockCost(1, profile)) return 'Unlock your ranged troop so it can strike from behind your front line, then retry.';
  if (!profile.unlocked[2] && profile.coins >= unlockCost(2, profile)) return 'Unlock your heavy troop to hold the front line, then retry.';
  if (profile.foodLevel < 100 && profile.coins >= foodUpgradeCost(profile)) return 'Upgrade food production to deploy faster, then retry.';
  if (profile.gems >= cardPackCost(1)) return `You have ${profile.gems.toLocaleString('en-US')} gems: summon a card in Cards for a permanent boost, then retry.`;
  return 'Deploy earlier and mix melee with ranged troops. Winning any battle pays gems for cards.';
}

/** A new player banks food instead of spending it. True in the first three wins, mid-battle, after the first
 *  deployment, with food for eight of the cheapest warriors unspent and fewer than three of them fighting
 *  while an enemy is alive. */
export function foodIsPiling(profile: Profile, state: BattleState): boolean {
  if (profile.wins >= 3 || state.phase !== 'running' || state.paused || state.stats.deployed === 0) return false;
  const cost = ERAS[profile.age].units[0].cost;
  const living = (side: string) => state.units.filter(unit => unit.side === side && unit.hp > 0).length;
  return state.food >= cost * 8 && living('enemy') > 0 && living('player') < 3;
}

/** A single contextual instruction, not an onboarding panel over the battlefield. */
export function battleGuidance(profile: Profile, state: BattleState, preview?: WavePreview | null, melee?: Readonly<DeploymentStatus>): string {
  if (state.phase === 'ready') return profile.wins===0?'Tap Battle, then spend food on warriors. They fight automatically.':`${chapterScouting(profile.enemyAge).opening} Tap Battle to begin.`;
  if (state.phase === 'won') return 'Victory! Continue to the next battle when you are ready.';
  if (state.phase === 'lost') return `Your coins are safe. ${masteryAdvice(profile,state)}`;
  if (state.paused) return 'Battle paused. Resume to deploy your army.';
  if (state.playerHp / state.playerMaxHp <= 0.3) return 'Your base is in danger. Deploy reinforcements or use a skill.';
  if (state.stats.deployed === 0 && state.food >= ERAS[profile.age].units[0].cost) return 'Deploy a melee warrior. Save some food for the next wave.';
  const captain=profile.chronicle?.enabled&&profile.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===profile.chronicle!.captain):undefined;
  // A first-timer who banks food loses the battle with it unspent, so this outranks the skill cues below.
  if (foodIsPiling(profile, state)) return `Food is piling up (${Math.floor(state.food)}). Keep tapping the melee card to send more warriors.`;
  // First-Freeze cue: teach the skill at the moment it pays off, while three or more enemies gather.
  if (profile.wins < 5 && state.stats.skillsCast === 0 && !state.skillsUsed.includes('freeze') && state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0).length >= 3) return 'Enemies are gathering. Tap Freeze to hold them while your army strikes.';
  // First-Meteor cue: once Freeze has been tried, point at the skill that damages every living enemy at once.
  if (profile.wins < 5 && state.skillsUsed.includes('freeze') && !state.skillsUsed.includes('meteor') && state.time >= 20 && state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0).length >= 3) return 'Enemies are bunched up. Tap Meteor to hit every one of them at once.';
  const wait = Math.ceil((ERAS[profile.age].units[0].cost - state.food) / foodRate(profile));
  if (wait > 0) return profile.wins<3&&!captain&&!state.skillsUsed.includes('food')
    ? `Food Drop adds 10 now, once per battle; or wait ${wait}s.`
    : `More food in ${wait}s. Your warriors fight automatically.`;
  if(profile.wins<3&&melee?.allowed){
    const army=state.units.filter(unit=>unit.side==='player'&&unit.hp>0);
    if(army.some(unit=>unit.kind===1)&&!army.some(unit=>unit.kind===0||unit.kind===2))return 'Ranged troops need cover. Add a melee guard.';
  }
  if (profile.wins < 3 && state.stats.skillsCast === 0 && state.time >= 25 && (!preview || preview.nextIn > 8)) {
    const enemies = state.units.some(unit => unit.side === 'enemy' && unit.hp > 0);
    const skills = [
      ...(enemies && !state.skillsUsed.includes('freeze') ? ['Freeze'] : []),
      ...(enemies && !state.skillsUsed.includes('meteor') ? ['Meteor'] : []),
      ...((captain || state.food < 99) && !state.skillsUsed.includes('food') ? [captain?.skill??'Food Drop'] : []),
    ];
    if (skills.length) return `Try a skill: ${skills.join(' or ')}. Each works once per battle.`;
  }
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
  const tiers = [[1e12, 't'], [1e9, 'b'], [1e6, 'm'], [1e3, 'k']] as const;
  for (let index = 0; index < tiers.length; index++) {
    const [limit, suffix] = tiers[index];
    if (safe < limit) continue;
    const rounded = Number((safe / limit).toFixed(1));
    // 999,950 rounds to 1000.0k: show it as 1m instead of 1000k.
    if (rounded >= 1000) return index === 0 ? '1e15' : `1${tiers[index - 1][1]}`;
    return `${String(rounded)}${suffix}`;
  }
  const whole = Math.ceil(safe);
  return whole >= 1000 ? '1k' : whole.toString();
}

export function baseHealthDisplay(hp: number, maximum: number): { ratio: number; label: string; danger: boolean } {
  const max = Number.isFinite(maximum) && maximum > 0 ? maximum : 1;
  const current = Math.max(0, Math.min(max, Number.isFinite(hp) ? hp : 0));
  const ratio = current / max;
  return { ratio, label: `${compactNumber(current)} / ${compactNumber(max)}`, danger: ratio <= 0.3 };
}


/** Compact visible chip; delayed final members always precede clearance. */
const objectiveOrder=(objective?:MissionObjective)=>({escort:'Escort the cart',hold:'Protect the courtyard',rescue:'Bring the scout home',light:'Hold the lantern, then break the gate',boss:'Defeat the keeper, then break the gate',siege:'Attack the base'}[objective??'siege']);

export function waveLabel(status: WaveStatus,objective?:MissionObjective): string {
  const p=status.preview;
  if(p){
    const counts=p.counts.flatMap((count,index)=>count>0?[`${count}${['M','R','H'][index]}`]:[]).join(' ');
    return `${p.intent.toUpperCase()} ${p.number}/${p.total} · ${counts} · ${Math.ceil(p.nextIn)}s`;
  }
  if(status.pendingEnemies>0)return `FINAL WAVE · ${status.pendingEnemies} INCOMING`;
  return status.cleared?`WAVES CLEARED · ${objectiveOrder(objective).toUpperCase()}`:`${status.enemiesRemaining} ENEMIES REMAIN`;
}

/** Updated accessible name, deliberately not a countdown live region. */
export function waveAccessibleLabel(status: WaveStatus,objective?:MissionObjective): string {
  const p=status.preview;
  if(!p)return status.pendingEnemies>0?`Final wave. ${status.pendingEnemies} ${status.pendingEnemies===1?'enemy':'enemies'} incoming.`:status.cleared?`Waves cleared. ${objectiveOrder(objective)}.`:`${status.enemiesRemaining} enemies remain.`;
  const counts=p.counts.flatMap((count,index)=>count>0?[`${count} ${['melee','ranged','heavy'][index]}`]:[]).join(', ');
  return `${p.intent[0].toUpperCase()+p.intent.slice(1)} wave ${p.number} of ${p.total}. ${counts}. Arrives in ${Math.ceil(p.nextIn)} seconds.`;
}
