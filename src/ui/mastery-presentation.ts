import { battleClock as clock } from './battle-clock.ts';
import { ERAS, unlockCost } from '../game/data.ts';
import { chapterMastery, masteryObjectiveProgress } from '../game/mastery.ts';
import { battleStats } from '../game/statistics.ts';
import type { BattleState, Profile } from '../game/types.ts';

const number=(value:number)=>Math.floor(value).toLocaleString('en-US');

/** Ledger display only: opening a chapter never earns or claims a seal. */
export function masteryMarksHtml(profile:Profile,chapter:number):string {
 const view=chapterMastery(profile,chapter);
 const titles=['Clear','Gate Unbroken',view.thirdTitle];
 return `<span class="mastery-marks">${titles.map((title,index)=>{
  const earned=!!(view.record.earnedMask&(1<<index));
  return `<span class="mastery-mark ${['olive','gate','chapter-seal'][index]} ${earned?'earned':'unearned'}" role="img" aria-label="${title}: ${earned?'earned':'not earned'}"><span aria-hidden="true">${earned?'✓':'◇'}</span><span class="mastery-mark-title">${title}</span></span>`;
 }).join('')}</span><span class="mastery-requirement">${view.thirdRequirement}</span><span class="mastery-remaining">${number(view.remainingCoins)} coins · ${number(view.remainingGems)} gems remaining</span>`;
}

/** `repeatRequirement` is false where the seal ledger above already states the requirement (result screen). */
export function masteryAttemptText(profile:Profile,state:BattleState,repeatRequirement=true):string {
 const view=chapterMastery(profile,profile.enemyAge);
 if(state.phase==='won'&&profile.pendingVictory?.settlement==='legacy')return `Seals are available on future attempts. ${view.thirdRequirement}`;
 const objective=masteryObjectiveProgress(profile.enemyAge,{...state,stats:battleStats(state.stats)});
 let measure='';
 switch(profile.enemyAge){
  case 0:measure=`${clock(objective.value)} · target at most ${clock(objective.target)}`;break;
  case 1:measure=`${objective.value} of 3 roles deployed`;break;
  case 2:measure=`${objective.value} skills used · at most 1`;break;
  case 3:measure=`${objective.value} frozen together · target 3 enemies`;break;
  case 4:measure=`${objective.value} meteor defeats · target 3 enemies`;break;
  case 5:measure=`${objective.value} deployments · at most 18`;break;
 }
 return `${repeatRequirement?`${view.thirdRequirement} `:''}Attempt: ${measure}.`;
}

/** One supported next-attempt fact, in the specified evidence priority. */
export function masteryAdvice(profile:Profile,state:BattleState):string {
 const stats=battleStats(state.stats),units=ERAS[profile.age].units;
 if(stats.deployed===0)return 'Deploy warriors once food is ready; this attempt had no successful deployments.';
 if(profile.unlocked.some((available,kind)=>available&&state.food>=units[kind].cost))return 'Spend the unused food on reinforcements before your gate falls.';
 if(stats.gateDamageTaken>0&&stats.deployedByKind[1]>0&&stats.deployedByKind[0]===0&&stats.deployedByKind[2]===0)return 'Give ranged troops a melee or heavy front line; your gate took damage with only ranged deployments.';
 const enemies=state.units.filter(unit=>unit.side==='enemy'&&unit.hp>0);
 if(enemies.length>=3&&!state.skillsUsed.includes('freeze'))return 'Try Freeze when an enemy group gathers; it was unused this attempt.';
 if(enemies.length>=3&&!state.skillsUsed.includes('meteor'))return 'Try Meteor against a gathered enemy group; it was unused this attempt.';
 if(!profile.unlocked[1]&&profile.coins>=unlockCost(1,profile))return 'Unlock your ranged troop to support your front line, then retry.';
 if(!profile.unlocked[2]&&profile.coins>=unlockCost(2,profile))return 'Unlock your heavy troop to hold the front line, then retry.';
 const view=chapterMastery(profile,profile.enemyAge);
 if(!(view.record.earnedMask&4))return masteryAttemptText(profile,state);
 if(!(view.record.earnedMask&2))return `Protect the gate for Gate Unbroken. Gate damage this attempt: ${number(stats.gateDamageTaken)}.`;
 return 'Try a mixed formation and keep a front line ahead of ranged troops.';
}
