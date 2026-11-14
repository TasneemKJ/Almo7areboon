import { ERAS, foodUpgradeCost, baseUpgradeCost, unlockCost } from '../game/data.ts';
import { availableSummonOdds, cardPackCost } from '../game/cards.ts';
import { advanceStatus } from '../game/mastery.ts';
import { campCounsel } from '../game/counsel.ts';
import type { Profile, BattleState } from '../game/types.ts';
import { n, tr } from './i18n.ts';
import { evolutionNeedsFullJourney } from './app-bridge.ts';

const number=(value:number)=>value.toLocaleString('en-US');
/** A number inside Arabic markup, isolated left-to-right. */
const num=(value:number)=>n(number(value));
/** A starting point for voluntary replay, never a prediction of victory. */
export function earlierChapter(profile:Readonly<Profile>):number|null {
 const chapter=Math.min(profile.age,profile.enemyAge-1,profile.furthestBattle);
 return Number.isInteger(chapter)&&chapter>=0?chapter:null;
}
/** Reviewable preparation choices; displaying help never dispatches a purchase. */
export function regroupLearningHtml(profile:Readonly<Profile>,state:Readonly<BattleState>):string {
 if(state.phase!=='lost')return '';
 // Same order as the lit Camp place (game/counsel.ts): food first, then the gate, then a waiting troop.
 const counsel=campCounsel(profile);
 let funded=tr('Try one change at a time. Your coins already earned are kept.','جرّب تغييراً واحداً في كلّ مرّة. النقود التي كسبتها تبقى معك.');
 // Not while the next chapter is behind Full Journey: coins alone do not open it, so the advice stays on what they do buy.
 if(profile.age<5&&profile.age<=profile.enemyAge&&profile.coins>=ERAS[profile.age].evolveCost&&!evolutionNeedsFullJourney(profile.age))
  funded=tr(`Moving camp is affordable: ${number(ERAS[profile.age].evolveCost)} coins. The storehouse and gate are built again; your troops and the coins left after the price come along. Review The Road before confirming.`,`تستطيع الآن نقل المخيّم: ${num(ERAS[profile.age].evolveCost)} من النقود. يُبنى المخزن والبوّابة من جديد، ويأتي معك جنودك وما يبقى من نقودك بعد الثمن. راجع «الطريق» قبل أن تؤكّد.`);
 else if(counsel?.station==='company'&&counsel.kind===1)
  funded=tr(`Unlock ranged troops for ${number(unlockCost(1,profile))} coins, then protect them with a melee front line.`,`افتح الرماة مقابل ${num(unlockCost(1,profile))} من النقود، ثم احمِهم بخطّ أماميّ للقتال القريب.`);
 else if(counsel?.station==='company')
  funded=tr(`Unlock heavy troops for ${number(unlockCost(2,profile))} coins. Their sweep can hit a second nearby enemy.`,`افتح الجند الثقال مقابل ${num(unlockCost(2,profile))} من النقود. ضربتهم الواسعة تصيب عدوّاً ثانياً قريباً.`);
 else if(counsel?.station==='storehouse')
  funded=tr(`Food production can be upgraded for ${number(foodUpgradeCost(profile))} coins. Faster food lets you deploy more often.`,`تستطيع تطوير إنتاج المؤونة مقابل ${num(foodUpgradeCost(profile))} من النقود. مؤونة أسرع تعني جنداً أكثر في الميدان.`);
 else if(counsel?.station==='gate')
  funded=tr(`Base health can be upgraded for ${number(baseUpgradeCost(profile))} coins. A stronger gate gives your army more time.`,`تستطيع تطوير صمود الحصن مقابل ${num(baseUpgradeCost(profile))} من النقود. البوّابة الأقوى تمنح جيشك وقتاً أطول.`);
 else if(profile.gems>=cardPackCost(1)&&availableSummonOdds(profile.summonCount,profile.cards).some(weight=>weight>0))
  funded=tr(`You have enough for a single summon costing ${number(cardPackCost(1))} gems; review its odds and your collection in Cards before spending.`,`معك ما يكفي لاستدعاء واحد كلفته ${num(cardPackCost(1))} من الجواهر؛ راجع فرصه ومجموعتك في «البطاقات» قبل أن تنفق.`);
 const replay=earlierChapter(profile)!==null
  ?`<p>${tr('Earlier unlocked chapters can fund preparation. Your own army and upgrades stay when you choose an opponent. Choose an earlier chapter below to review opponents, or use the chapter selector after returning to preparation.','الفصول السابقة المفتوحة تموّل استعدادك. جيشك وتطويراتك تبقى معك حين تختار خصماً. اختر فصلاً سابقاً في الأسفل لتراجع الخصوم، أو استعمل اختيار الفصل بعد عودتك إلى الاستعداد.')}</p>`:'';
 const returnLabel=advanceStatus(profile,state).reason==='complete'?tr('Return to chapters','عُد إلى الفصول'):tr('Prepare next attempt','استعدّ للمحاولة التالية');
 return `<details class="chapter-scouting regroup-teaching"><summary>${tr('Prepare the next attempt','استعدّ للمحاولة التالية')}</summary><p>${funded}</p>${replay}<p>${tr('Cards use gems and stay when you move camp and in new timelines. Summons are random; review costs, odds and your collection in Cards. Extra seals and quests can also earn gems.','البطاقات تُشترى بالجواهر وتبقى معك بعد نقل المخيّم وفي الخطوط الزمنية الجديدة. الاستدعاء يأتي بالحظّ؛ راجع الكلفة والفرص ومجموعتك في «البطاقات». الأختام الإضافية والمهمّات تمنحك جواهر أيضاً.')}</p><p>${tr(`Choose ${returnLabel} below to return to preparation. It buys nothing and waits for you to start the battle.`,`اختر «${returnLabel}» في الأسفل لتعود إلى الاستعداد. لن يشتري شيئاً، وينتظرك حتى تبدأ المعركة.`)}</p></details>`;
}
