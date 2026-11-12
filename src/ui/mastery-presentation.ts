import { battleClock as clock } from './battle-clock.ts';
import { ERAS, unlockCost } from '../game/data.ts';
import { chapterMastery, masteryObjectiveProgress } from '../game/mastery.ts';
import { battleStats } from '../game/statistics.ts';
import { n, tr } from './i18n.ts';
import type { BattleState, Profile } from '../game/types.ts';

const number=(value:number)=>Math.floor(value).toLocaleString('en-US');

/** Ledger display only: opening a chapter never earns or claims a seal. */
export function masteryMarksHtml(profile:Profile,chapter:number):string {
 const view=chapterMastery(profile,chapter);
 const titles=[tr('Clear','اجتياز'),tr('Gate Unbroken','بوّابةٌ لم تُكسر'),view.thirdTitle];
 return `<span class="mastery-marks">${titles.map((title,index)=>{
  const earned=!!(view.record.earnedMask&(1<<index));
  return `<span class="mastery-mark ${['olive','gate','chapter-seal'][index]} ${earned?'earned':'unearned'}" role="img" aria-label="${title}: ${earned?tr('earned','نِلته'):tr('not earned','لم تنله بعد')}"><span aria-hidden="true">${earned?'✓':'◇'}</span><span class="mastery-mark-title">${title}</span></span>`;
 }).join('')}</span><span class="mastery-requirement">${view.thirdRequirement}</span><span class="mastery-remaining">${tr(`${number(view.remainingCoins)} coins · ${number(view.remainingGems)} gems remaining`,`باقٍ: ${n(number(view.remainingCoins))} من النقود · ${n(number(view.remainingGems))} من الجواهر`)}</span>`;
}

/** `repeatRequirement` is false where the seal ledger above already states the requirement (result screen). */
export function masteryAttemptText(profile:Profile,state:BattleState,repeatRequirement=true):string {
 const view=chapterMastery(profile,profile.enemyAge);
 if(state.phase==='won'&&profile.pendingVictory?.settlement==='legacy')return tr(`Seals are available on future attempts. ${view.thirdRequirement}`,`الأختام متاحة في المحاولات القادمة. ${view.thirdRequirement}`);
 const objective=masteryObjectiveProgress(profile.enemyAge,{...state,stats:battleStats(state.stats)});
 let measure='';
 switch(profile.enemyAge){
  case 0:measure=tr(`${clock(objective.value)} · target at most ${clock(objective.target)}`,`${clock(objective.value)} · الهدف ${clock(objective.target)} على الأكثر`);break;
  case 1:measure=tr(`${objective.value} of 3 roles deployed`,`أرسلت ${objective.value} من 3 أنواع`);break;
  case 2:measure=tr(`${objective.value} skills used · at most 1`,`مهاراتٌ مستعملة: ${objective.value} · واحدة على الأكثر`);break;
  case 3:measure=tr(`${objective.value} frozen together · target 3 enemies`,`جُمّد معاً: ${objective.value} · الهدف 3 أعداء`);break;
  case 4:measure=tr(`${objective.value} meteor defeats · target 3 enemies`,`هُزم بالنيزك: ${objective.value} · الهدف 3 أعداء`);break;
  case 5:measure=tr(`${objective.value} deployments · at most 18`,`إرسالات: ${objective.value} · 18 على الأكثر`);break;
 }
 return `${repeatRequirement?`${view.thirdRequirement} `:''}${tr(`Attempt: ${measure}.`,`المحاولة: ${measure}.`)}`;
}

/** One supported next-attempt fact, in the specified evidence priority. */
export function masteryAdvice(profile:Profile,state:BattleState):string {
 const stats=battleStats(state.stats),units=ERAS[profile.age].units;
 if(stats.deployed===0)return tr('Deploy warriors once food is ready; this attempt had no successful deployments.','أرسِل المحاربين حين تجهز المؤونة، فلم تُرسل أحداً في هذه المحاولة.');
 if(profile.unlocked.some((available,kind)=>available&&state.food>=units[kind].cost))return tr('Spend the unused food on reinforcements before your gate falls.','أنفِق المؤونة الباقية على المدد قبل أن تسقط بوّابتك.');
 if(stats.gateDamageTaken>0&&stats.deployedByKind[1]>0&&stats.deployedByKind[0]===0&&stats.deployedByKind[2]===0)return tr('Give ranged troops a melee or heavy front line; your gate took damage with only ranged deployments.','اجعل أمام الرماة صفّاً أوّل من القتال القريب أو الثقال، فقد أُصيبت بوّابتك وأنت ترسل الرماة وحدهم.');
 const enemies=state.units.filter(unit=>unit.side==='enemy'&&unit.hp>0);
 if(enemies.length>=3&&!state.skillsUsed.includes('freeze'))return tr('Try Freeze when an enemy group gathers; it was unused this attempt.','جرّب التجميد حين يتجمّع الأعداء، فلم تستعمله في هذه المحاولة.');
 if(enemies.length>=3&&!state.skillsUsed.includes('meteor'))return tr('Try Meteor against a gathered enemy group; it was unused this attempt.','جرّب النيزك على جمعٍ من الأعداء، فلم تستعمله في هذه المحاولة.');
 if(!profile.unlocked[1]&&profile.coins>=unlockCost(1,profile))return tr('Unlock your ranged troop to support your front line, then retry.','افتح جنديّ الرماية ليسند صفّك الأوّل، ثم حاول من جديد.');
 if(!profile.unlocked[2]&&profile.coins>=unlockCost(2,profile))return tr('Unlock your heavy troop to hold the front line, then retry.','افتح جنديّك الثقيل ليثبّت الصفّ الأوّل، ثم حاول من جديد.');
 const view=chapterMastery(profile,profile.enemyAge);
 if(!(view.record.earnedMask&4))return masteryAttemptText(profile,state);
 if(!(view.record.earnedMask&2))return tr(`Protect the gate for Gate Unbroken. Gate damage this attempt: ${number(stats.gateDamageTaken)}.`,`احمِ البوّابة لتنال ختم «بوّابةٌ لم تُكسر». ضرر البوّابة في هذه المحاولة: ${number(stats.gateDamageTaken)}.`);
 return tr('Try a mixed formation and keep a front line ahead of ranged troops.','جرّب تشكيلةً مختلطة، وأبقِ صفّاً أوّل أمام الرماة.');
}
