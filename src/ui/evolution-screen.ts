import {ERAS} from '../game/data.ts';
import type {BattleState,Profile} from '../game/types.ts';
import {unitPortrait} from '../view/unit-illustrations.ts';
import {chapterPresentation,chapterLandscape,unitPresentationName} from './chapter-presentation.ts';
import {compactNumber} from './battle-hud.ts';
import {icon} from '../view/icons.ts';
import {legacyPreparationHtml} from './prestige-presentation.ts';
import {n,tr} from './i18n.ts';

/** A visual journey through the existing campaign, not a second progression model. */
export function evolutionScreenHtml(profile:Profile,state:BattleState):string {
 const next=ERAS[profile.age+1],cost=ERAS[profile.age].evolveCost;
 const blocked=!next||profile.coins<cost||profile.age>profile.enemyAge||state.phase==='running';
 const missing=next?Math.max(0,cost-profile.coins):0;
 const decision=next?`<div class="screen-bottom evolution-decision"><p>${tr(`Evolve to the <strong>${chapterPresentation(profile.age+1).title}</strong>. All coins, upgrades and troop unlocks reset. Your selected opponent and unlocked battles stay, along with seals, cards and gems.`,`ارتقِ إلى <strong>${chapterPresentation(profile.age+1).title}</strong>. تُصفَّر كلّ النقود والتطويرات وفتح الجنود، ويبقى خصمك المختار ومعاركك المفتوحة، ومعها الأختام والبطاقات والجواهر.`)}</p>
 <p class="camp-wallet">${tr('Your coins:','نقودك:')} <strong>${tr(Math.floor(profile.coins).toLocaleString('en-US'),n(Math.floor(profile.coins).toLocaleString('en-US')))}</strong></p>${missing?`<p class="camp-shortfall">${tr(`Needs ${missing.toLocaleString('en-US')} more ${missing===1?'coin':'coins'}.`,`تحتاج ${n(missing.toLocaleString('en-US'))} أخرى من النقود.`)}</p>`:''}
 <button class="big-button green" data-command="evolve" ${blocked?'disabled':''}>${tr('EVOLVE','ارتقِ')} ${icon('coin')}<span>${tr(compactNumber(cost),n(compactNumber(cost)))}</span></button>
 <small>${state.phase==='running'?tr('Finish the current battle to evolve.','أنهِ المعركة الحالية لترتقي.'):profile.age>profile.enemyAge?tr('Defeat the enemy to continue evolving.','اهزم العدوّ لتواصل الارتقاء.'):tr('Your cards and gems stay with you.','بطاقاتك وجواهرك تبقى معك.')}</small></div>`:
 `<div class="screen-bottom evolution-decision"><p>${profile.timeline===1000?tr('Timeline limit reached. Revisit chapters to keep exploring.','بلغت آخر خطّ زمنيّ. عُد إلى الفصول لتواصل الاستكشاف.'):tr('Win the final battle to preview a new timeline.','انتصر في المعركة الأخيرة لترى خطّاً زمنياً جديداً.')}</p><button class="big-button green" data-command="evolve" disabled>${tr('FINAL AGE','العصر الأخير')}</button></div>`;
 return `<div class="screen-heading"><span class="eyebrow">${tr('THROUGH THE LEVANT','عبر بلاد الشام')}</span><h2 id="secondary-title" tabindex="-1">${tr('Evolution','الارتقاء')}</h2><p>${tr('Six imagined chapters. One lasting homeland.','ستّة فصولٍ متخيَّلة، ووطنٌ واحد باقٍ.')}</p></div>
 ${legacyPreparationHtml(profile,state)}${decision}<div class="era-list">${ERAS.map((_,age)=>`<article class="era-row ${age===profile.age?'selected':''} ${age>profile.age?'future':''}">
 <img class="era-landscape" alt="" loading="lazy" src="${chapterLandscape(age)}"/>
 <span class="era-number">${age<profile.age?'✓':age+1}</span>
 <div class="era-picture"><img alt="${unitPresentationName(age,2)}" src="${unitPortrait(age,2)}"/></div>
 <div class="era-copy"><small>${chapterPresentation(age).period}</small><h3>${chapterPresentation(age).title}</h3><p>${chapterPresentation(age).subtitle}</p></div>
 ${age===profile.age?`<span class="current-badge">${tr('NOW','الآن')}</span>`:age>profile.age?icon('lock'):icon('flag')}
 </article>`).join('')}</div>`;
}
