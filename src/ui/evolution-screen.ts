import {ERAS} from '../game/data.ts';
import type {BattleState,Profile} from '../game/types.ts';
import {unitPortrait} from '../view/unit-illustrations.ts';
import {chapterPresentation,chapterLandscape,unitPresentationName} from './chapter-presentation.ts';
import {compactNumber} from './battle-hud.ts';
import {icon} from '../view/icons.ts';
import {legacyPreparationHtml} from './prestige-presentation.ts';

/** A visual journey through the existing campaign, not a second progression model. */
export function evolutionScreenHtml(profile:Profile,state:BattleState):string {
 const next=ERAS[profile.age+1],cost=ERAS[profile.age].evolveCost;
 const blocked=!next||profile.coins<cost||profile.age>profile.enemyAge||state.phase==='running';
 return `<div class="screen-heading"><span class="eyebrow">THROUGH THE LEVANT</span><h2 id="secondary-title" tabindex="-1">Evolution</h2><p>Six imagined chapters. One lasting homeland.</p></div>
 ${legacyPreparationHtml(profile,state)}<div class="era-list">${ERAS.map((_,age)=>`<article class="era-row ${age===profile.age?'selected':''} ${age>profile.age?'future':''}">
 <img class="era-landscape" alt="" loading="lazy" src="${chapterLandscape(age)}"/>
 <span class="era-number">${age<profile.age?'✓':age+1}</span>
 <div class="era-picture"><img alt="${unitPresentationName(age,2)}" src="${unitPortrait(age,2)}"/></div>
 <div class="era-copy"><small>${chapterPresentation(age).period}</small><h3>${chapterPresentation(age).title}</h3><p>${chapterPresentation(age).subtitle}</p></div>
 ${age===profile.age?'<span class="current-badge">NOW</span>':age>profile.age?icon('lock'):icon('flag')}
 </article>`).join('')}</div>
 <div class="screen-bottom"><p>${next?`Evolve to the <strong>${chapterPresentation(profile.age+1).title}</strong>. All coins, upgrades and troop unlocks reset. Your selected opponent and unlocked battles stay, along with seals, cards and gems.`:profile.timeline===1000?'Timeline limit reached. Revisit chapters to keep exploring.':'Win the final battle to preview a new timeline.'}</p>
 <button class="big-button green" data-command="evolve" ${blocked?'disabled':''}>${next?`EVOLVE ${icon('coin')}<span>${compactNumber(cost)}</span>`:'FINAL AGE'}</button>
 ${next?`<small>${state.phase==='running'?'Finish the current battle to evolve.':profile.age>profile.enemyAge?'Defeat the enemy to continue evolving.':'Your cards and gems stay with you.'}</small>`:''}</div>`;
}
