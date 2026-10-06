import type {Game} from '../game/simulation.ts';
import type {Profile,UnitKind} from '../game/types.ts';
import {ERAS,foodRate,unlockCost} from '../game/data.ts';
import {CAPTAINS,preparationAvailable,routeDefinition} from '../game/chronicle.ts';
import {legacyEffects} from '../game/prestige.ts';
import {campGateImage,journalIllustration,storehouseIllustration} from '../view/camp-illustrations.ts';
import {unitPortrait} from '../view/unit-illustrations.ts';
import {chapterLandscape,chapterPresentation,unitPresentationName} from './chapter-presentation.ts';
import {TROOP_SPECIALTIES} from './army-screen.ts';
import type {CampFocus,CampStation} from './camp-owner.ts';
const number=(n:number)=>Math.floor(n).toLocaleString('en-US');
const escape=(text:string)=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const heading=(title:string,notice:string)=>`<h2 id="dialog-title">${title}</h2><p id="camp-focus-save-status" class="camp-saving-note" role="status" aria-live="polite" ${notice?'':'hidden'}>${escape(notice)}</p>`;
const back='<button class="big-button secondary" data-command="camp-back">Back</button>';
const wallet=(p:Readonly<Profile>)=>`<p class="camp-wallet">Your coins: <strong>${number(p.coins)}</strong></p>`;
const missing=(cost:number,p:Readonly<Profile>)=>Math.max(0,cost-p.coins);
const shortfall=(cost:number,p:Readonly<Profile>)=>missing(cost,p)>0?`<p class="camp-shortfall">Needs ${number(missing(cost,p))} more ${missing(cost,p)===1?'coin':'coins'}.</p>`:'';
function companyArt(p:Readonly<Profile>):string {
 return ([0,1,2] as const).map(kind=>`<img class="camp-person ${p.unlocked[kind]?'joined':'visiting'}" src="${unitPortrait(p.age,kind)}" alt=""/>`).join('');
}
/** Pure reading only. No transient Camp presentation is part of a saved profile. */
export function campRootHtml(p:Readonly<Profile>):string {
 const chapter=chapterPresentation(p.age),destination=chapterPresentation(p.enemyAge),route=p.chronicle?.enabled?routeDefinition(p.chronicle.route).name:'';
 const place=(id:CampStation,name:string,art:string,detail:string)=>`<button class="camp-place camp-place-${id}" data-camp-station="${id}" aria-label="${name}. ${detail}"><span class="camp-place-art" aria-hidden="true">${art}</span><span class="camp-place-name">${name}</span></button>`;
 return `<div class="camp-scene"><div class="camp-ground"><img class="camp-landscape" src="${chapterLandscape(p.age)}" alt=""/><header class="camp-heading"><p class="eyebrow">THE COMPANY AT REST</p><h1>${chapter.title}</h1><p>Destination: ${destination.title}${route?` · ${route}`:''}</p></header><div class="camp-places" aria-label="Places in Camp">${place('storehouse','Storehouse',storehouseIllustration(p.foodLevel),'Improve food or pack bread')}${place('gate','Home gate',`<img src="${campGateImage(p.age)}" alt=""/>${p.baseLevel?'<i class="camp-gate-brace"></i>':''}`,'Strengthen the gate or prepare repairs')}${place('company','Your company',companyArt(p),'Meet your troops and prepare your company')}${place('journal','Journal',journalIllustration(),'Choose a battle or read company records')}</div></div></div><footer class="camp-footer"><p>Battle starts when you choose Battle.</p><div><button class="big-button green" data-command="camp-battle">Battle</button><button class="big-button secondary" data-command="camp-home">Home</button></div></footer>`;
}
function preparationHtml(p:Readonly<Profile>,focus:'storehouse'|'gate'):string {
 const c=p.chronicle,preparation=focus==='storehouse'?'bread':'repair';
 if(!c||!preparationAvailable(c,preparation))return '';
 const selected=c.preparation===preparation,other=c.preparation!=='none'&&!selected;
 const title=focus==='storehouse'?'bread':'repairs',verb=selected?`Remove ${title}`:focus==='storehouse'?'Pack bread':'Prepare repairs';
 return `<p class="camp-preparation">${focus==='storehouse'?'Bread adds 3 starting food.':'Repairs add 15% starting gate health.'} ${other?`This replaces your ${c.preparation==='bread'?'bread':'repairs'}.`:'One preparation travels with the company.'} No coin cost.</p><button class="big-button blue" data-command="camp-local-preparation" data-camp-preparation="${selected?'none':preparation}">${verb}</button>`;
}
function upgradeHtml(game:Game,focus:'storehouse'|'gate',notice:string):string {
 const p=game.profile,s=game.state,food=focus==='storehouse',stat=food?'food':'base',status=game.upgradeStatus(stat),title=food?'Storehouse':'Home gate';
 const current=food?foodRate(p).toFixed(2):number(s.playerMaxHp),next=status.nextValue===null?null:food?status.nextValue.toFixed(2):number(status.nextValue),level=food?p.foodLevel:p.baseLevel;
 const art=food?storehouseIllustration(level):`<img src="${campGateImage(p.age)}" alt=""/>${level?'<i class="camp-gate-brace"></i>':''}`;
 return `<div class="camp-focus">${heading(title,notice)}<div class="camp-focus-art" data-work-level="${level}" aria-hidden="true">${art}</div><p class="camp-values">${food?'Food rate':'Gate maximum'}: <strong>${current}${next===null?'':` → ${next}`}</strong> ${food?'food/sec':'health'}</p><p>${food?'Food begins to gather during battle. Improving here does not add food now.':`Your gate has ${number(s.playerHp)} of ${number(s.playerMaxHp)} health. Strengthening adds the increase in maximum health; it does not refill missing health.`}</p>${wallet(p)}${status.cost===null?'':shortfall(status.cost,p)}<div class="camp-focus-actions"><button class="big-button green" data-command="camp-local-${stat}" data-camp-action="${stat}" ${status.allowed?'':'disabled'}>${status.cost===null?'Fully improved':`${food?'Improve food':'Strengthen gate'} · ${number(status.cost)} coins`}</button>${preparationHtml(p,focus)}${back}</div></div>`;
}
function skillsHtml(p:Readonly<Profile>):string {
 const captain=p.chronicle?.enabled&&p.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===p.chronicle!.captain):undefined;
 return `<section class="camp-skill-reading" aria-label="Battle skills"><h3>Skills in battle</h3><p><strong>Freeze:</strong> Freeze all enemies for ${legacyEffects(p.legacy).freezeSeconds} seconds.</p><p><strong>Meteor:</strong> Hit every enemy. Select an enemy in battle to choose Freeze or Meteor.</p><p><strong>${captain?.skill??'Food Drop'}:</strong> ${captain?.description??'Gain up to 10 food, limited by 99-food storage.'} Inspect the supplies after deploying a troop to use it.</p><p>Each skill refreshes for a new battle. Camp never casts a skill.</p></section>`;
}
export function campFocusHtml(game:Game,focus:CampFocus,notice=''):string {
 if(focus==='storehouse'||focus==='gate')return upgradeHtml(game,focus,notice);
 const p=game.profile;
 if(typeof focus==='object'){
  const kind=focus.recruit,name=unitPresentationName(p.age,kind),cost=unlockCost(kind,p),joined=p.unlocked[kind],specialty=TROOP_SPECIALTIES[kind];
  return `<div class="camp-focus">${heading(name,notice)}<img class="camp-recruit-portrait" src="${unitPortrait(p.age,kind)}" alt=""/><p><strong>${ERAS[p.age].units[kind].role} · ${specialty.name}</strong>. ${specialty.effect}</p><p>${joined?'Part of your company.':'A visitor waiting to join your company.'} Deployment in battle costs ${ERAS[p.age].units[kind].cost} food. Inspecting a troop here never deploys it.</p>${joined?'':wallet(p)+shortfall(cost,p)}<div class="camp-focus-actions">${joined?'':`<button class="big-button green" data-command="camp-local-unlock" data-camp-action="unlock" ${p.coins<cost?'disabled':''}>Unlock ${name} · ${number(cost)} coins</button>`}${back}</div></div>`;
 }
 if(focus==='company')return `<div class="camp-focus">${heading('Your company',notice)}<p>Meet a troop to read their role or invite them to join.</p><div class="camp-company-figures">${([0,1,2] as UnitKind[]).map(kind=>`<button class="camp-recruit" data-camp-recruit="${kind}" aria-label="Inspect ${unitPresentationName(p.age,kind)}, ${p.unlocked[kind]?'in your company':'waiting to join'}"><img src="${unitPortrait(p.age,kind)}" alt=""/><span>${unitPresentationName(p.age,kind)}</span><small>${p.unlocked[kind]?'Joined':'Waiting to join'}</small></button>`).join('')}</div>${skillsHtml(p)}<div class="camp-focus-actions"><button class="big-button green" data-command="camp-evolution">Evolution</button><button class="big-button secondary" data-command="camp-storybook">Storybook decisions</button>${back}</div></div>`;
 return `<div class="camp-focus">${heading('Company journal',notice)}<div class="camp-focus-art" aria-hidden="true">${journalIllustration()}</div><p>Choose your next destination, or read the company’s milestones, collection and stories. Opening the journal spends and claims nothing.</p><div class="camp-focus-actions"><button class="big-button green" data-command="camp-chapters">Choose battle</button><button class="big-button secondary" data-command="camp-journal">Company journal</button>${back}</div></div>`;
}
