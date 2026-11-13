import { currentSealCount, legacyEffects } from '../game/prestige.ts';
import type { BattleState, LegacyChoice, LegacyEffects, LegacyRank, PrestigePreview, Profile } from '../game/types.ts';
import { n, tr } from './i18n.ts';

const legacyName=(choice:LegacyChoice)=>({hearth:tr('Hearth','الموقد'),watch:tr('Watch','الحراسة'),stillness:tr('Stillness','السكون')}[choice]);
const choices:LegacyChoice[]=['hearth','watch','stillness'];
const amount=(value:number)=>value.toLocaleString('en-US',{maximumFractionDigits:2});
const effectsText=(effects:LegacyEffects)=>tr(`Starting food: ${amount(effects.startingFood)} · Gate factor: ×${amount(effects.gateFactor)} · Freeze: ${effects.freezeSeconds} seconds`,`مؤونة البداية: ${n(amount(effects.startingFood))} · عامل البوّابة: ${n(`×${amount(effects.gateFactor)}`)} · التجميد: ${n(effects.freezeSeconds)} ثانية`);
function choiceDescription(choice:LegacyChoice,rank:LegacyRank):string {
  const effects=legacyEffects({rank,selected:choice});
  return choice==='hearth'?tr(`Starting food: ${amount(effects.startingFood)}. Form your opening army sooner.`,`مؤونة البداية: ${n(amount(effects.startingFood))}. اجمع جيشك الأوّل أسرع.`)
    :choice==='watch'?tr(`Gate factor: ×${amount(effects.gateFactor)}. Give your gate more time under pressure.`,`عامل البوّابة: ${n(`×${amount(effects.gateFactor)}`)}. امنح بوّابتك وقتاً أطول تحت الضغط.`)
    :tr(`Freeze: ${effects.freezeSeconds} seconds. Give your army more time to strike.`,`التجميد: ${n(effects.freezeSeconds)} ثانية. امنح جيشك وقتاً أطول ليضرب.`);
}
function radios(prefix:'prestige'|'ready',rank:LegacyRank,selected:LegacyChoice):string {
  return `<fieldset class="legacy-choices"><legend>${tr('Choose one legacy','اختر إرثاً واحداً')}</legend>${choices.map(choice=>`<div class="legacy-choice"><input type="radio" id="${prefix}-${choice}" name="${prefix}-legacy" value="${choice}" aria-describedby="${prefix}-${choice}-description" ${choice===selected?'checked':''}/><label for="${prefix}-${choice}">${legacyName(choice)}</label><p id="${prefix}-${choice}-description">${choiceDescription(choice,rank)}</p></div>`).join('')}</fieldset>`;
}
/** Replaces explanatory values only: native radio nodes and keyboard focus stay stable. */
export function prestigeDetailsHtml(profile:Profile,preview:PrestigePreview):string {
  return `<p>${tr(`Timeline ${preview.expectedTimeline} → ${preview.nextTimeline}`,`الخطّ الزمنيّ ${n(`${preview.expectedTimeline} → ${preview.nextTimeline}`)}`)}</p><p>${tr(`Enemy strength: ×${amount(preview.currentEnemyFactor)} → ×${amount(preview.nextEnemyFactor)}`,`قوّة العدوّ: ${n(`×${amount(preview.currentEnemyFactor)} → ×${amount(preview.nextEnemyFactor)}`)}`)}</p>
  <div class="legacy-rank"><span aria-hidden="true">${'◆'.repeat(preview.rankAfter)}${'◇'.repeat(3-preview.rankAfter)}</span><strong>${tr(`Rank ${preview.rankBefore} → Rank ${preview.rankAfter}`,`الرتبة ${n(preview.rankBefore)} ← الرتبة ${n(preview.rankAfter)}`)}</strong><p>${tr(`${preview.earnedSeals} / 18 seals${preview.nextRank?` · ${preview.nextRank.remainingSeals} more seals for rank ${preview.nextRank.rank}`:' · Rank 3 complete'}`,`الأختام ${n(`${preview.earnedSeals} / 18`)}${preview.nextRank?` · أختامٌ باقية للرتبة ${n(preview.nextRank.rank)}: ${n(preview.nextRank.remainingSeals)}`:` · اكتملت الرتبة ${n(3)}`}`)}</p></div>
  <p>${tr(`Current legacy: ${legacyName(profile.legacy.selected)} · rank ${profile.legacy.rank}`,`الإرث الحاليّ: ${legacyName(profile.legacy.selected)} · الرتبة ${n(profile.legacy.rank)}`)}<small>${effectsText(legacyEffects(profile.legacy))}</small></p>
  <p>${tr(`Next legacy: ${legacyName(preview.choice)}`,`الإرث التالي: ${legacyName(preview.choice)}`)}<small>${effectsText(preview.effects)}</small></p>
  <p class="prestige-credit">${tr(`Timeline credit: ${amount(preview.timelineGemCredit)} gems`,`رصيد الخطّ الزمنيّ: ${n(amount(preview.timelineGemCredit))} من الجواهر`)}<small>${tr(`Gems: ${amount(preview.gemsBefore)} → ${amount(preview.gemsAfter)}`,`الجواهر: ${n(`${amount(preview.gemsBefore)} → ${amount(preview.gemsAfter)}`)}`)}</small></p>`;
}
export function prestigeDialogHtml(profile:Profile,preview:PrestigePreview):string {
  if(profile.timeline>=1000)return `<h2 id="dialog-title">${tr('Timeline limit reached','بلغت آخر خطّ زمنيّ')}</h2><p>${tr('This journey has no further timeline reset.','لا خطّ زمنيّ جديد بعد هذه الرحلة.')}</p>`;
  return `<span class="eyebrow">${tr('ONE LASTING LEGACY','إرثٌ واحد يدوم')}</span><h2 id="dialog-title" tabindex="-1">${tr('Begin a new timeline?','أتبدأ خطّاً زمنياً جديداً؟')}</h2>
  <div id="prestige-preview-values" class="prestige-values" aria-live="polite">${prestigeDetailsHtml(profile,preview)}</div>
  ${radios('prestige',preview.rankAfter,preview.choice)}<p class="legacy-note">${tr('One legacy is active at a time. You can change your choice before battle in The Road.','إرثٌ واحد فعّال في كلّ مرّة. يمكنك تغيير اختيارك قبل المعركة في «الطريق».')}</p>
  <details class="prestige-reset" open><summary>${tr('What resets and what stays','ما يُصفَّر وما يبقى')}</summary><h3>${tr('These reset','هذه تُصفَّر')}</h3><ul><li>${tr(`Coins: ${amount(profile.coins)} → 0`,`النقود: ${n(`${amount(profile.coins)} → 0`)}`)}</li><li>${tr('Army: first camp','الجيش: المخيّم الأوّل')}</li><li>${tr('Selected chapter: 1',`الفصل المختار: ${n(1)}`)}</li><li>${tr('Unlocked chapters: chapter 1 only',`الفصول المفتوحة: الفصل ${n(1)} فقط`)}</li><li>${tr(`Food upgrade: level ${profile.foodLevel} → 0`,`تطوير المؤونة: المستوى ${n(`${profile.foodLevel} → 0`)}`)}</li><li>${tr(`Base upgrade: level ${profile.baseLevel} → 0`,`تطوير الحصن: المستوى ${n(`${profile.baseLevel} → 0`)}`)}</li><li>${tr('Ranged and heavy troops: locked','جنود الرماية والثقال: مقفلون')}</li><li>${tr('Six chapter records: seals and both bests cleared','سجلّات الفصول الستّة: تُمحى الأختام وأفضل النتائج')}</li></ul>
  <h3>${tr('These stay','هذه تبقى')}</h3><ul><li>${tr('Cards, copies and card bonuses','البطاقات ونسخها ومكاسبها')}</li><li>${tr('Gems and permanent legacy rank','الجواهر ورتبة الإرث الدائمة')}</li><li>${tr('Claimed quests and lifetime totals','المهامّ المستلمة ومجاميعك كلّها')}</li><li>${tr('Summon count and seed','عدد الاستدعاءات وبذرتها')}</li><li>${tr('Daily claim and streak','مكافأة اليوم والأيام المتتالية')}</li><li>${tr('Sound, speed and motion preferences','إعدادات الصوت والسرعة والحركة')}</li></ul></details>
  <button class="big-button green" data-command="confirm-prestige">${tr(`Begin timeline ${preview.nextTimeline}`,`ابدأ الخطّ الزمنيّ ${n(preview.nextTimeline)}`)}</button><button class="big-button secondary" data-command="close">${tr('Keep exploring this timeline','تابع استكشاف هذا الخطّ الزمنيّ')}</button>`;
}
export function legacyPreparationHtml(profile:Profile,state:BattleState):string {
  const earned=profile.legacy.rank>0,ready=state.phase==='ready'&&earned;
  const note=ready?tr('One legacy is active. You can change your choice before battle.','إرثٌ واحد فعّال. يمكنك تغيير اختيارك قبل المعركة.')
    :earned?tr('Your current legacy stays active. Return to a ready battle to change your choice.','إرثك الحاليّ يبقى فعّالاً. عُد إلى معركةٍ جاهزة لتغيّر اختيارك.')
    :profile.timeline>=1000?tr('No further timeline resets at the timeline limit.','لا خطوط زمنية جديدة بعد آخر خطّ.')
    :tr('Your first legacy is earned when you begin the next timeline.','تنال إرثك الأوّل حين تبدأ الخطّ الزمنيّ التالي.');
  return `<section class="legacy-preparation" aria-labelledby="legacy-title"><h3 id="legacy-title">${tr('Lasting legacy','الإرث الدائم')}</h3><div id="legacy-current">${legacyCurrentHtml(profile)}</div>${ready?radios('ready',profile.legacy.rank,profile.legacy.selected):''}<p class="legacy-note">${note}</p>${legacyLearningHtml(profile)}</section>`;
}
/** Optional preparation teaching reads existing progress; it grants no rank or reset. */
export function legacyLearningHtml(profile:Profile):string {
  const next=profile.timeline>=1000?tr('Timeline limit reached: no further reset or rank upgrade through a reset.','بلغت آخر خطّ زمنيّ: لا بداية جديدة ولا ترقية للرتبة بعدها.')
    :tr('Clear the final chapter, then review and confirm a new timeline. Rank 1 is earned on your first reset; extra seals are optional.',`انتصر في الفصل الأخير، ثم راجع خطّاً زمنياً جديداً وأكّده. تنال الرتبة ${n(1)} مع أوّل بداية جديدة، والأختام الإضافية اختيارية.`);
  return `<details class="chapter-scouting legacy-learning"><summary>${tr('How legacies grow','كيف ينمو الإرث')}</summary><p>${tr(`This timeline: ${currentSealCount(profile)} / 18 seals. Your earned legacy: Rank ${profile.legacy.rank}.`,`هذا الخطّ الزمنيّ: ${n(`${currentSealCount(profile)} / 18`)} من الأختام. إرثك المكتسب: الرتبة ${n(profile.legacy.rank)}.`)}</p><p>${next}</p><p>${tr('Rank 2 needs 12 seals; Rank 3 needs 18 seals in one timeline, counted when you confirm a reset.',`الرتبة ${n(2)} تحتاج ${n(12)} ختماً، والرتبة ${n(3)} تحتاج ${n(18)} ختماً في خطّ زمنيّ واحد، تُحسب حين تؤكّد البداية الجديدة.`)}</p><p>${tr('Your earned rank never goes down. Seals from different timelines are not added together.','رتبتك المكتسبة لا تنزل أبداً، وأختام الخطوط الزمنية المختلفة لا تُجمع.')}</p><p>${tr('One legacy is active at a time: Hearth adds starting food, Watch strengthens your gate, or Stillness extends Freeze. Earned legacies can be changed before a ready battle in this section.','إرثٌ واحد فعّال في كلّ مرّة: الموقد يزيد مؤونة البداية، والحراسة تقوّي بوّابتك، والسكون يطيل التجميد. يمكنك تغيير الإرث المكتسب قبل معركةٍ جاهزة في هذا القسم.')}</p><p>${tr("Cards, gems and your earned rank stay. Coins, camp upgrades, troop unlocks and this timeline's seals reset; your army returns to the first camp.",'البطاقات والجواهر ورتبتك المكتسبة تبقى. أمّا النقود وتطويرات المخيّم وفتح الجنود وأختام هذا الخطّ الزمنيّ فتُصفَّر، ويعود جيشك إلى المخيّم الأوّل.')}</p></details>`;
}
export function legacyCurrentHtml(profile:Profile):string {
  const text=profile.legacy.rank>0?tr(`Current legacy: ${legacyName(profile.legacy.selected)} · Rank ${profile.legacy.rank}`,`الإرث الحاليّ: ${legacyName(profile.legacy.selected)} · الرتبة ${n(profile.legacy.rank)}`)
    :profile.timeline>=1000?tr('No earned legacy yet. No further resets at the timeline limit.','لا إرث مكتسب بعد. لا بدايات جديدة بعد آخر خطّ زمنيّ.')
    :tr('No earned legacy yet. Complete a timeline to carry one forward.','لا إرث مكتسب بعد. أكمل خطّاً زمنياً لتحمل إرثاً معك.');
  return `<p>${text}<small>${effectsText(legacyEffects(profile.legacy))}</small></p>`;
}
