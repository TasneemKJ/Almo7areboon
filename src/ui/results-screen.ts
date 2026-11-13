import { battleClock } from './battle-clock.ts';
import { chronicleResultHtml } from './chronicle-screen.ts';
import { ERAS } from '../game/data.ts';
import { advanceStatus, canRetry, chapterMastery } from '../game/mastery.ts';
import type { BattleState, Profile } from '../game/types.ts';
import { battleStats } from '../game/statistics.ts';
import { chapterPresentation, chapterLandscape, unitPresentationName } from './chapter-presentation.ts';
import { icon } from '../view/icons.ts';
import { compactNumber } from './battle-hud.ts';
import { masteryMarksHtml, masteryAttemptText, masteryAdvice } from './mastery-presentation.ts';
import { villageVoice, villageMoment } from './chapter-scouting.ts';
import { earlierChapter, regroupLearningHtml } from './regroup-learning.ts';
import { campCounsel } from '../game/counsel.ts';
import { counselCopy, counselStation } from './counsel-copy.ts';
import { nextGoalLabel } from './next-goal.ts';
import { localDay } from '../game/data.ts';
import { n, tr } from './i18n.ts';

export const timelineResetText='Preview the next timeline before you begin. In this harder timeline, your age, coins, upgrades and troop unlocks reset; seals and their rewards start afresh. Cards, gems, quests and lifetime records stay. Review the reset, actual gem credit and one lasting legacy before confirming.';
/** `timelineResetText` in the current language; read it while rendering. */
export function timelineResetCopy():string {
 return tr(timelineResetText,'اطّلع على الخطّ الزمنيّ التالي قبل أن تبدأ. في هذا الخطّ الأصعب يعود عصرك ونقودك وتطويراتك وجنودك المفتوحون إلى البداية، وتبدأ الأختام ومكافآتها من جديد. أمّا البطاقات والجواهر والمهمّات وسجلّات العمر فتبقى معك. راجع ما سيُعاد، والجواهر التي ستنالها فعلاً، وإرثاً واحداً يدوم، ثم أكّد.');
}
const amount=(value:number)=>Math.floor(value).toLocaleString('en-US');
const coinsLabel=(value:number)=>tr(`${amount(value)} coins`,`${amount(value)} من النقود`);
const encounterDone=(stage:number)=>tr(`Encounter ${stage+1} of 3 complete.`,`انتهت المواجهة ${n(stage+1)} من ${n(3)}.`);

/** The result's Journey button names the next real reward, so the end of a battle points at a reason to play on. */
function journeyButton(profile:Profile):string {
 const goal=nextGoalLabel(profile,localDay());
 // The fallback goal has the same text and label (both «Your journey»), in either language.
 const text=goal.text===goal.label?tr('goals and rewards','الأهداف والمكافآت'):goal.text;
 return `<button class="big-button secondary" data-command="journey" aria-label="${goal.label}">${tr('Your journey','رحلتك')} · ${text}</button>`;
}

/** Names the troop role that dealt the most damage; empty when nothing was recorded or the battle was won. */
export function defeatRecapHtml(age:number,state:BattleState):string {
 const ledger=battleStats(state.stats).damageByKind;
 if(state.phase!=='lost'||!ledger)return '';
 const total=ledger[0]+ledger[1]+ledger[2];
 if(total<1)return '';
 const top=([0,1,2] as const).reduce((best,kind)=>ledger[kind]>ledger[best]?kind:best,0 as 0|1|2);
 const share=`${Math.round(ledger[top]/total*100)}%`,name=unitPresentationName(age,top);
 return `<p class="defeat-recap">${tr(`Most damage came from your ${name}: ${share} of what your army dealt.`,`جاء معظم الضرر من ${name}: ${n(share)} ممّا أوقعه جيشك.`)}</p>`;
}

export function resultsHtml(profile: Profile, state: BattleState): string {
 const won=state.phase==='won',run=profile.chronicle?.expedition,stats=battleStats(state.stats),advance=advanceStatus(profile,state),view=chapterMastery(profile,profile.enemyAge);
 const terminal=advance.reason==='complete',receipt=won?profile.pendingVictory:null;
 const settled=receipt?.settlement==='mastery-v1'?receipt:null;
 const voiceStats=won&&!settled?undefined:stats;
 const newTitles=settled?[tr('Clear','اجتياز'),tr('Gate Unbroken','بوّابةٌ لم تُكسر'),view.thirdTitle].filter((_,index)=>settled.newMask&(1<<index)):[];
 const terminalCopy=won||(view.record.earnedMask&1)?tr(`All 1,000 timelines complete. Return to chapters to revisit your journey.`,`اكتملت الخطوط الزمنية الـ${n('1,000')} كلّها. عُد إلى الفصول لتزور رحلتك من جديد.`):tr('The final timeline is at its limit. Return to chapters to prepare another attempt.','بلغ الخطّ الزمنيّ الأخير حدّه. عُد إلى الفصول لتستعدّ لمحاولة أخرى.');
 const nextTitle=advance.target==='battle'?chapterPresentation(advance.nextBattle!).title:'';
 const continuation=advance.allowed&&!profile.chronicle?.expedition?`<button class="big-button green" data-command="next">${advance.target==='timeline'?tr('Next Timeline','الخطّ الزمنيّ التالي'):tr(`Continue to ${nextTitle}`,`تابع إلى ${nextTitle}`)} ${icon('arrow')}</button>`:'';
 const retry=canRetry(profile,state)&&!terminal?`<button class="big-button ${won?'secondary':'blue'}" data-command="retry">${won?(view.record.earnedMask===7?tr('Replay','العب مجدّداً'):tr('Try for remaining seals','حاول نيل الأختام الباقية')):tr('Prepare next attempt','استعدّ للمحاولة التالية')} ${icon('arrow')}</button>`:'';
 const canEvolve=!profile.chronicle?.expedition&&won&&profile.age<ERAS.length-1&&profile.age<=profile.enemyAge;
 const evolve=canEvolve?`<button class="big-button secondary" data-command="evolve" ${profile.coins<ERAS[profile.age].evolveCost?'disabled':''}>${tr(`Evolve · ${amount(ERAS[profile.age].evolveCost)} coins`,`ارتقِ · ${n(amount(ERAS[profile.age].evolveCost))} من النقود`)}</button>`:'';
 return `<div class="result-landscape" aria-hidden="true"><img alt="" src="${chapterLandscape(won&&!run&&advance.target==='battle'?advance.nextBattle!:profile.enemyAge)}"/></div><div class="result-emblem ${won?'':'defeat'}">${icon(won?'trophy':'shield')}</div><span class="eyebrow">${won?tr('THE BATTLE IS YOURS','المعركة لك'):tr('YOUR COINS ARE SAFE','نقودك في أمان')}</span><h2 id="dialog-title" tabindex="-1" data-initial-focus>${won?tr('VICTORY!','نصر!'):tr('REGROUP','لُمَّ الشمل')}</h2><p>${won&&run?`${encounterDone(run.stage)} ${run.stage<2?tr('Choose provisions below before continuing.','اختر مؤونتك في الأسفل قبل أن تتابع.'):tr('Bring the company home when you are ready.','أعِد السريّة إلى الديار متى شئت.')}`:terminal?terminalCopy:won?(advance.target==='timeline'?`${tr('Timeline complete!','اكتمل الخطّ الزمنيّ!')} ${timelineResetCopy()}`:tr(`${nextTitle} is next. Your own army evolves separately.`,`التالي: ${nextTitle}. وجيشك يرتقي وحده على حِدة.`)):masteryAdvice(profile,state)}</p>
 <blockquote class="village-voice" data-village-moment="${villageMoment(voiceStats)}">${villageVoice(profile.enemyAge,state.phase,voiceStats)}</blockquote>
 ${defeatRecapHtml(profile.age,state)}${regroupLearningHtml(profile,state)}
 ${state.phase==='lost'&&earlierChapter(profile)!==null?`<button class="big-button secondary" data-command="regroup-chapters">${tr('Choose an earlier chapter','اختر فصلاً سابقاً')}</button>`:''}
 <div class="reward"><span>${tr('TOTAL BATTLE EARNINGS','مجموع غنائم المعركة')}</span><strong aria-label="${coinsLabel(state.earned)}">${icon('coin')}<span data-count-to="${state.earned}">${compactNumber(state.earned)}</span></strong><small>${tr('Already added to your coins','أُضيفت إلى نقودك')}${won&&!settled?tr(' · victory bonus: up to 10 gems',` · مكافأة النصر: حتى ${n(10)} جواهر`):''}</small>${settled?`<small>${tr(`Normal combat: ${amount(state.earned-settled.masteryCoins)} coins`,`القتال العاديّ: ${n(amount(state.earned-settled.masteryCoins))} من النقود`)}</small><small>${tr(`Mastery credited: ${amount(settled.masteryCoins)} coins · ${amount(settled.masteryGems)} gems`,`مكافأة الإتقان: ${n(amount(settled.masteryCoins))} من النقود · ${n(amount(settled.masteryGems))} من الجواهر`)}</small>`:''}</div>
 <div class="result-mastery">${masteryMarksHtml(profile,profile.enemyAge)}${settled?`<p>${tr('New seals','أختام جديدة')}: ${newTitles.length?newTitles.join(tr(', ','، ')):tr('none · previously earned seals stay earned','لا شيء · وما نلته من أختام قبلُ يبقى لك')}.</p>`:''}<p>${masteryAttemptText(profile,state,false)}</p>${settled?`<small>${tr(`Gate damage this attempt: ${amount(stats.gateDamageTaken)}`,`ضرر البوّابة في هذه المحاولة: ${n(amount(stats.gateDamageTaken))}`)}</small>`:''}</div>
 <dl class="battle-statistics"><div><dt>${tr('Battle time','وقت المعركة')}</dt><dd>${battleClock(state.time)}</dd></div><div><dt>${tr('Warriors deployed','محاربون أُرسلوا')}</dt><dd>${stats.deployed}</dd></div><div><dt>${tr('Enemies defeated','أعداء هُزموا')}</dt><dd>${stats.kills}</dd></div><div><dt>${tr('Food spent','المؤونة المصروفة')}</dt><dd>${compactNumber(stats.foodSpent)}</dd></div><div><dt>${tr('Damage dealt','الضرر الموقَع')}</dt><dd>${compactNumber(stats.damageDealt)}</dd></div><div><dt>${tr('Largest army','أكبر جيش')}</dt><dd>${stats.peakArmy}</dd></div><div><dt>${tr('Orders issued','الأوامر الصادرة')}</dt><dd>${stats.ordersCast??0}</dd></div></dl>
 ${!won&&advance.target==='timeline'?`<p>${timelineResetCopy()}</p>`:''}${chronicleResultHtml(profile,state)}${continuation}${retry}${evolve}${journeyButton(profile)}${terminal?`<button class="big-button blue" data-command="return-chapters">${tr('Return to chapters','عُد إلى الفصول')}</button>`:''}`;
}

/** Ordinary completion is a short decision. The full receipt stays optional. */
export function compactResultsHtml(profile:Profile,state:BattleState):string {
 const won=state.phase==='won',advance=advanceStatus(profile,state),run=profile.chronicle?.expedition,counsel=state.phase==='lost'&&!run?campCounsel(profile):null;
 let extra='',command='retry',label=tr('Retry','أعِد المحاولة'),next=`${tr('Your earned coins stay with you.','النقود التي ربحتها تبقى معك.')}${won?'':` ${masteryAdvice(profile,state)}`}`;
 if(run&&won){command=run.stage<2?'result-expedition':'story-continue';label=run.stage<2?tr('Choose help & continue','اختر العون وتابع'):tr('Bring the company home','أعِد السريّة إلى الديار');next=encounterDone(run.stage);}
 else if(advance.reason==='complete'){command='return-chapters';label=tr('Return to chapters','عُد إلى الفصول');next=tr('Your journey is complete. Your progress stays.','اكتملت رحلتك، وتقدّمك باقٍ.');}
 else if(!won&&counsel){const copy=counselCopy(counsel,profile.age);command='result-counsel';extra=` data-counsel="${counselStation(counsel)}"`;label=copy.button;next=copy.line;}
 else if(won&&advance.allowed){const title=chapterPresentation(advance.nextBattle??0).title;command='next';label=advance.target==='timeline'?tr('Preview next timeline','اطّلع على الخطّ الزمنيّ التالي'):tr('Continue','تابع');next=advance.target==='timeline'?tr('Review the next timeline before changing your progress.','راجع الخطّ الزمنيّ التالي قبل أن يتغيّر تقدّمك.'):tr(`${title} is next.`,`التالي: ${title}.`);}
 const gems=won&&profile.pendingVictory?.settlement==='mastery-v1'?profile.pendingVictory.masteryGems:0;
 return `<div class="compact-result" data-outcome="${won?'won':'lost'}"><div class="result-landscape" aria-hidden="true"><img alt="" src="${chapterLandscape(profile.enemyAge)}"/></div><span class="eyebrow">${won?tr('THE BATTLE IS YOURS','المعركة لك'):tr('THE ROAD CONTINUES','الطريق مستمرّ')}</span><h2 id="dialog-title" tabindex="-1" data-initial-focus>${won?tr('Victory','نصر'):tr('Regroup','لُمَّ الشمل')}</h2><p class="compact-result-reward" aria-label="${tr(`${amount(state.earned)} coins earned`,`ربحت ${amount(state.earned)} من النقود`)}${gems?tr(` · ${amount(gems)} mastery gems`,` · ${amount(gems)} من جواهر الإتقان`):``}">${tr('','ربحت ')}<span data-count-to="${state.earned}" aria-hidden="true" dir="ltr">${amount(state.earned)}</span>${tr(' coins earned',' من النقود')}${gems?tr(` · ${amount(gems)} mastery gems`,` · ${n(amount(gems))} من جواهر الإتقان`):''}</p>${won&&state.earned>0?`<p class="compact-result-settled">${tr('Already added to your total.','أُضيفت إلى رصيدك.')}</p>`:''}<p class="compact-result-next">${next}</p><div class="compact-result-actions"><button class="big-button green" data-command="${command}"${extra}>${label}</button><button class="big-button secondary" data-command="result-details">${tr('Details','التفاصيل')}</button><button class="big-button secondary" data-command="home">${tr('Home','الرئيسية')}</button></div></div>`;
}

/** Both existing provision choices are explicit; neither is selected by rendering. */
export function expeditionChoiceHtml():string {
 return `<div class="compact-result"><span class="eyebrow">${tr('THE NEXT ENCOUNTER','المواجهة التالية')}</span><h2 id="dialog-title" tabindex="-1" data-initial-focus>${tr('What will help?','ما الذي سيعينك؟')}</h2><p>${tr('Choose your provision and continue the expedition.','اختر مؤونتك وتابع الرحلة.')}</p><div class="compact-result-actions"><button class="big-button green" data-command="continue-with-provision" data-provision="supplies">${tr('Two extra food & continue',`مؤونة زائدة ${n('+2')} وتابع`)}</button><button class="big-button secondary" data-command="continue-with-provision" data-provision="shelter">${tr('Reinforce the gate & continue','دعّم البوّابة وتابع')}</button><button class="big-button secondary" data-command="result-back">${tr('Back','رجوع')}</button></div></div>`;
}
