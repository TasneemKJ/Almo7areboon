import {ERAS} from '../game/data.ts';
import type {BattleState,Profile} from '../game/types.ts';
import {unitPortrait} from '../view/unit-illustrations.ts';
import {landscapeSvg} from '../view/world-illustrations.ts';
import {dataSvg} from '../view/illustration-kit.ts';
import {visualEra} from '../view/visual-theme.ts';
import {compactNumber} from './battle-hud.ts';
import {icon} from '../view/icons.ts';

const landscapes=new Map<number,string>();
function landscape(age:number):string {
 let image=landscapes.get(age);
 if(!image){image=dataSvg(landscapeSvg(age));landscapes.set(age,image);}
 return image;
}
/** A visual journey through the existing campaign, not a second progression model. */
export function evolutionScreenHtml(profile:Profile,state:BattleState):string {
 const next=ERAS[profile.age+1],cost=ERAS[profile.age].evolveCost;
 const blocked=!next||profile.coins<cost||profile.age>profile.enemyAge||state.phase==='running';
 return `<div class="screen-heading"><span class="eyebrow">CONQUER HISTORY</span><h2 id="secondary-title" tabindex="-1">Evolution</h2><p>One army. Six worlds to conquer.</p></div>
 <div class="era-list">${ERAS.map((era,age)=>`<article class="era-row ${age===profile.age?'selected':''} ${age>profile.age?'future':''}">
 <img class="era-landscape" alt="" loading="lazy" src="${landscape(age)}"/>
 <span class="era-number">${age<profile.age?'✓':age+1}</span>
 <div class="era-picture"><img alt="${era.units[2].name}" src="${unitPortrait(age,2)}"/></div>
 <div class="era-copy"><small>${era.year}</small><h3>${era.name}</h3><p>${visualEra(age).scene}</p></div>
 ${age===profile.age?'<span class="current-badge">NOW</span>':age>profile.age?icon('lock'):icon('flag')}
 </article>`).join('')}</div>
 <div class="screen-bottom"><p>${next?`Evolve to the <strong>${next.name}</strong>. All coins, upgrades, troop unlocks, and unlocked battles reset. Cards and gems stay.`:'Win the final battle to begin a new timeline.'}</p>
 <button class="big-button green" data-command="evolve" ${blocked?'disabled':''}>${next?`EVOLVE ${icon('coin')}<span>${compactNumber(cost)}</span>`:'FINAL AGE'}</button>
 ${next?`<small>${state.phase==='running'?'Finish the current battle to evolve.':profile.age>profile.enemyAge?'Defeat the enemy to continue evolving.':'Your cards and gems stay with you.'}</small>`:''}</div>`;
}
