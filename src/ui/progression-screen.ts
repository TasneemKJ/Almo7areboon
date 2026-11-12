import { ERAS, eraEconomyScale } from '../game/data.ts';
import type { BattleState, Profile } from '../game/types.ts';
import { chapterPresentation, chapterLandscape } from './chapter-presentation.ts';
import { icon } from '../view/icons.ts';
import { advanceStatus } from '../game/mastery.ts';
import { masteryMarksHtml } from './mastery-presentation.ts';
import { timelineResetCopy } from './results-screen.ts';
import { chapterScoutingHtml, battleTeachingHtml } from './chapter-scouting.ts';
import { earlierChapter } from './regroup-learning.ts';
import { n, tr } from './i18n.ts';

export function battleSelectionHtml(profile: Profile, state: BattleState, recovery=false): string {
  const advance=advanceStatus(profile,state);
  const suggested=recovery&&state.phase==='ready'?earlierChapter(profile):null;
  const guidance=suggested===null?'':`<p id="replay-guidance">${tr(`Try ${chapterPresentation(suggested).title}: an earlier unlocked opponent no later than your army. Wins are not guaranteed; try a lower chapter if needed. Choosing buys nothing. Start Battle when you are ready.`,`جرّب «${chapterPresentation(suggested).title}»: خصمٌ مفتوح أسبق، لا يتجاوز عصر جيشك. النصر غير مضمون، فجرّب فصلاً أدنى إن لزم. الاختيار لا يشتري شيئاً. ابدأ المعركة حين تكون جاهزاً.`)}</p>`;
  const footer=state.phase==='ready'&&advance.allowed?`<footer class="chapter-continuation">${advance.target==='timeline'?`<p>${timelineResetCopy()}</p>`:''}<button class="big-button green" data-command="next">${advance.target==='timeline'?tr('Next Timeline','الخطّ الزمنيّ التالي'):tr(`Continue to ${chapterPresentation(advance.nextBattle!).title}`,`تابِع إلى ${chapterPresentation(advance.nextBattle!).title}`)} ${icon('arrow')}</button></footer>`:'';
  return `<span class="eyebrow">${tr(`TIMELINE ${profile.timeline}`,`الخطّ الزمنيّ ${n(profile.timeline)}`)}</span><h2 id="dialog-title">${tr('Choose a battle','اختر معركة')}</h2><p>${state.phase === 'ready' ? tr('Replay unlocked opponents for coins. Later opponents pay far more, so replay the highest one you can beat. Your army and upgrades stay with you.','أعِد مواجهة الخصوم المفتوحين لتكسب النقود. الخصوم اللاحقون يدفعون أكثر بكثير، فأعِد مواجهة أعلى خصمٍ تقدر على هزيمته. جيشك وتطويراتك تبقى معك.') : tr('Finish this battle before choosing another opponent.','أنهِ هذه المعركة قبل أن تختار خصماً آخر.')}</p>${guidance}${chapterScoutingHtml(profile.enemyAge)}${battleTeachingHtml()}<div class="battle-options">${ERAS.map((_, index) => {
    const locked = index > profile.furthestBattle, current = index === profile.enemyAge;
    return `<button class="battle-option" data-battle="${index}" data-command="choose-battle-${index}" aria-current="${current}" ${index===suggested?'aria-describedby="replay-guidance"':''} ${locked || state.phase !== 'ready' ? 'disabled' : ''}><img class="battle-preview" alt="" loading="lazy" src="${chapterLandscape(index)}"/><strong>${index + 1}</strong><span>${chapterPresentation(index).title}<small>${locked ? tr('LOCKED','مقفل') : `${current ? tr('CURRENT BATTLE','المعركة الحالية') : index===suggested?tr('SUGGESTED REPLAY','إعادة مقترحة'):tr('AVAILABLE TO REPLAY','متاحة للإعادة')} · ${tr(`COINS ×${eraEconomyScale(index).toLocaleString('en-US')}`,`النقود ${n(`×${eraEconomyScale(index).toLocaleString('en-US')}`)}`)}`}</small>${masteryMarksHtml(profile,index)}</span>${icon(locked ? 'lock' : current ? 'flag' : 'arrow')}</button>`;
  }).join('')}</div>${footer}`;
}

export function evolutionDialogHtml(profile: Profile, state: BattleState): string | null {
  if (state.phase === 'running' || profile.age >= ERAS.length - 1 || profile.age > profile.enemyAge) return null;
  const next = chapterPresentation(profile.age + 1), cost = ERAS[profile.age].evolveCost;
  return `<span class="eyebrow">${tr('ENTER THE NEXT CHAPTER','ادخل الفصل التالي')}</span><h2 id="dialog-title">${tr(`Evolve to ${next.title}?`,`أترتقي إلى «${next.title}»؟`)}</h2><p>${tr('Your new army is stronger, but this restarts your age economy.','جيشك الجديد أقوى، لكنّ اقتصاد عصرك يبدأ من جديد.')}</p><div class="evolution-warning"><strong>${tr('These will reset','هذه ستُصفَّر')}</strong><p>${tr('All coins, food and base upgrades, and troop unlocks.','كلّ النقود، وتطويرات المؤونة والحصن، وفتح الجنود.')}</p><strong>${tr('These stay with you','هذه تبقى معك')}</strong><p>${tr('Your selected opponent and unlocked battles stay. Your chapter seals, cards and gems, quests, lifetime records, and current timeline stay with you.','خصمك المختار ومعاركك المفتوحة تبقى. وأختام فصولك وبطاقاتك وجواهرك ومهامّك وسجلّاتك وخطّك الزمنيّ الحاليّ تبقى معك.')}</p></div><p>${tr(`Evolution requires <strong>${cost.toLocaleString('en-US')} coins</strong>. Your remaining coins are also cleared.`,`الارتقاء يحتاج <strong>${n(cost.toLocaleString('en-US'))} من النقود</strong>. وما يبقى من نقودك يُصفَّر أيضاً.`)}</p><button class="big-button green" data-command="confirm-evolve" ${profile.coins < cost ? 'disabled' : ''}>${tr(`EVOLVE TO ${next.title.toUpperCase()}`,`ارتقِ إلى ${next.title}`)}</button><button class="big-button secondary" data-command="close">${tr('KEEP MY CURRENT AGE','أبقِني في عصري')}</button>`;
}
