import { QUESTS, foodUpgradeCost, unlockCost } from '../game/data.ts';
import { chapterMastery } from '../game/mastery.ts';
import type { BattleState, Profile, UnitKind } from '../game/types.ts';
import { chapterPresentation, chapterLandscape } from './chapter-presentation.ts';
import { masteryMarksHtml } from './mastery-presentation.ts';
import { icon } from '../view/icons.ts';
import { n, tr } from './i18n.ts';
export function journeyGoals(profile: Readonly<Profile>) {
 return (['wins','kills','deployed'] as const).map(stat=>{
  const quest=QUESTS.filter(q=>q.stat===stat&&!profile.claimed.includes(q.id)).sort((a,b)=>a.target-b.target)[0]??null;
  const count=quest?Math.min(quest.target,profile[stat]):profile[stat];
  return {stat,quest,count,progress:quest?Math.min(1,count/quest.target):1,complete:quest===null,claimable:!!quest&&profile[stat]>=quest.target};
 });
}
export function journeyScreenHtml(profile: Profile, state: BattleState): string {
 const chapter=chapterPresentation(profile.enemyAge),mastery=chapterMastery(profile,profile.enemyAge),goals=journeyGoals(profile);
 const readyReward=goals.find(g=>g.claimable),incomplete=mastery.record.earnedMask!==7;
 const affordableTroop=([1,2] as UnitKind[]).find(kind=>!profile.unlocked[kind]&&profile.coins>=unlockCost(kind,profile));
 const mark=!(mastery.record.earnedMask&1)?tr('clear this chapter','انتصر في هذا الفصل'):!(mastery.record.earnedMask&2)?tr('finish with your gate unbroken','أنهِ المعركة وبوّابتك لم تُكسر'):mastery.thirdTitle;
 const next=readyReward?tr('An earned milestone is ready. Claim its gems below.','مَعلمٌ مكتسب جاهز. استلم جواهره في الأسفل.'):incomplete?tr(`Your next mark: ${mark}.`,`علامتك التالية: ${mark}.`):affordableTroop!==undefined?tr('Unlock another troop role to broaden your company.','افتح نوعاً آخر من الجنود لتوسّع سريّتك.'):profile.foodLevel<100&&profile.coins>=foodUpgradeCost(profile)?tr('You can improve food production before your next battle.','يمكنك تطوير إنتاج المؤونة قبل معركتك التالية.'):tr('Choose another story route or replay for the seals you still need.','اختر درباً آخر في الحكاية، أو أعِد اللعب لتنال الأختام الباقية.');
 const statLabel={wins:tr('Victories','الانتصارات'),kills:tr('Enemies defeated','الأعداء المهزومون'),deployed:tr('Warriors deployed','المحاربون المُرسَلون')};
 const earned=profile.mastery.chapters.reduce((sum,c)=>sum+[1,2,4].filter(bit=>c.earnedMask&bit).length,0);
 return `<span class="eyebrow">${tr('THE COMPANY JOURNAL','دفتر السريّة')}</span><h2 id="dialog-title" tabindex="-1" data-initial-focus>${tr('Your journey','رحلتك')}</h2>
 <div class="journey-landscape"><img src="${chapterLandscape(profile.enemyAge)}" alt=""/><div><small>${tr(`Timeline ${profile.timeline} · Chapter ${profile.enemyAge+1}`,`الخطّ الزمنيّ ${n(profile.timeline)} · الفصل ${n(profile.enemyAge+1)}`)}</small><strong>${chapter.title}</strong><span>${tr(`${earned}/18 chapter seals`,`أختام الفصول: ${n(`${earned}/18`)}`)}</span></div></div>
 <p class="journey-next">${next}</p><div class="journey-seals">${masteryMarksHtml(profile,profile.enemyAge)}</div>
 <h3 class="journey-heading">${tr('Company milestones','مَعالم السريّة')}</h3><div class="journey-goals">${goals.map(g=>`<article class="journey-goal"><div><span>${statLabel[g.stat]}</span><strong>${g.quest?g.quest.title:tr('Every milestone earned','نلت كلّ المَعالم')}</strong><div class="journey-meter" role="progressbar" aria-label="${tr(`${g.stat} milestone`,`مَعلم ${statLabel[g.stat]}`)}" aria-valuemin="0" aria-valuemax="${g.quest?.target??1}" aria-valuenow="${g.quest?g.count:1}"><i style="transform:scaleX(${g.progress})"></i></div><small>${g.quest?tr(`${g.count.toLocaleString('en-US')} / ${g.quest.target.toLocaleString('en-US')}`,n(`${g.count.toLocaleString('en-US')} / ${g.quest.target.toLocaleString('en-US')}`)):tr('Complete','مكتمل')}</small></div>${g.quest?`<button class="buy-button" data-claim="${g.quest.id}" aria-label="${tr(`Claim ${g.quest.reward} gems for ${g.quest.title}`,`استلم ${g.quest.reward} من الجواهر عن «${g.quest.title}»`)}" ${g.claimable?'':'disabled'}>${icon('gem')}${g.quest.reward}</button>`:`<span class="journey-complete" aria-label="${tr('Completed','مكتمل')}">${icon('trophy')}</span>`}</article>`).join('')}</div>
 <div class="journey-destinations">${state.phase==='ready'||state.phase==='running'?`<button class="big-button secondary" data-journey-tab="battle">${icon('food')} ${tr('Prepare troops and food','جهّز الجنود والمؤونة')}</button>`:''}<button class="big-button green" data-command="chronicle">${icon('battle')} ${tr('Choose a story mission','اختر مهمّةً من الحكاية')}</button><button class="big-button secondary" data-journey-tab="cards">${icon('cards')} ${tr('Strengthen your collection','قوِّ مجموعتك')}</button><button class="big-button secondary" data-command="quests">${icon('quest')} ${tr('All quests and daily reward','كلّ المهامّ ومكافأة اليوم')}</button></div>
 <p class="journey-note">${tr('Progress stays with your company. Milestone gems are earned once; replay for the seals you still need.','التقدّم يبقى مع سريّتك. جواهر المَعالم تُنال مرّةً واحدة، وأعِد اللعب للأختام الباقية.')}</p>
 ${state.phase==='won'||state.phase==='lost'?`<button class="big-button secondary" data-command="journey-result">${tr('Return to battle result','عُد إلى نتيجة المعركة')}</button>`:''}`;
}
