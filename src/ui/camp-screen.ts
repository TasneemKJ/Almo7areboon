import type {Game} from '../game/simulation.ts';
import type {Profile,UnitKind} from '../game/types.ts';
import {ERAS,dailyReward,foodRate,unlockCost} from '../game/data.ts';
import {CAPTAINS,preparationAvailable,routeDefinition} from '../game/chronicle.ts';
import {legacyEffects} from '../game/prestige.ts';
import {campGateImage,campLampIllustration,journalIllustration,storehouseIllustration} from '../view/camp-illustrations.ts';
import {campCounsel} from '../game/counsel.ts';
import {unitPortrait} from '../view/unit-illustrations.ts';
import {chapterLandscape,chapterPresentation,unitPresentationName} from './chapter-presentation.ts';
import {troopSpecialty} from './army-screen.ts';
import {n,tr} from './i18n.ts';
import type {CampFocus,CampStation} from './camp-owner.ts';
import {nextGoalLabel} from './next-goal.ts';
const number=(n:number)=>Math.floor(n).toLocaleString('en-US');
const escape=(text:string)=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const heading=(title:string,notice:string)=>`<h2 id="dialog-title">${title}</h2><p id="camp-focus-save-status" class="camp-saving-note" role="status" aria-live="polite" ${notice?'':'hidden'}>${escape(notice)}</p>`;
const back=()=>`<button class="big-button secondary" data-command="camp-back">${tr('Back','رجوع')}</button>`;
const wallet=(p:Readonly<Profile>)=>`<p class="camp-wallet">${tr('Your coins','نقودك')}: <strong dir="ltr">${number(p.coins)}</strong></p>`;
const coins=(value:number)=>tr(`${number(value)} coins`,`${n(number(value))} من النقود`);
const missing=(cost:number,p:Readonly<Profile>)=>Math.max(0,cost-p.coins);
const shortfall=(cost:number,p:Readonly<Profile>)=>missing(cost,p)>0?`<p class="camp-shortfall">${tr(`Needs ${number(missing(cost,p))} more ${missing(cost,p)===1?'coin':'coins'}.`,`ينقصك ${n(number(missing(cost,p)))} من النقود.`)}</p>`:'';
function companyArt(p:Readonly<Profile>):string {
 return ([0,1,2] as const).map(kind=>`<img class="camp-person ${p.unlocked[kind]?'joined':'visiting'}" src="${unitPortrait(p.age,kind)}" alt=""/>`).join('');
}
/** Pure reading only. No transient Camp presentation is part of a saved profile. */
/** The next journal goal as read-only heading text: Camp keeps Battle/Home as its only root controls. */
export function campGoalText(p:Readonly<Profile>,day:number):string {
 const goal=nextGoalLabel(p,day);
 // The fallback goal has the same text and label (both «Your journey»), in either language.
 return goal.text===goal.label?'':tr(`Next goal: ${goal.text} · see the Journal`,`الهدف التالي: ${goal.text} · انظر الدفتر`);
}
export function campRootHtml(p:Readonly<Profile>,day?:number):string {
 const chapter=chapterPresentation(p.age),destination=chapterPresentation(p.enemyAge),route=p.chronicle?.enabled?routeDefinition(p.chronicle.route).name:'';
 // One obvious next action: while a place is worth a visit, a village lamp hangs over it, the others step back and the
 // journal's goal line waits (progressive reveal; see DESIGN.md "Counsel").
 // Scoped to the free chapters (furthestBattle < 2): later, coins pile up and a lantern that never goes out is noise.
 // A ready daily reward is never hidden: for a free player it is the day 3 and day 7 beat.
 const counsel=p.furthestBattle<2?campCounsel(p):null,lit=counsel?.station??null;
 const goal=day===undefined||(lit&&!dailyReward(p,day).available)?'':campGoalText(p,day);
 const place=(id:CampStation,name:string,art:string,detail:string)=>`<button class="camp-place camp-place-${id}${id===lit?' camp-place-counsel':''}" data-camp-station="${id}" aria-label="${name}. ${id===lit?`${tr('Lit for you now','أُضيء لك الآن')}. `:''}${detail}">${id===lit?campLampIllustration():''}<span class="camp-place-art" aria-hidden="true">${art}</span><span class="camp-place-name">${name}</span></button>`;
 return `<div class="camp-scene"><div class="camp-ground"><img class="camp-landscape" src="${chapterLandscape(p.age)}" alt=""/><header class="camp-heading"><p class="eyebrow">${tr('THE COMPANY AT REST','السريّة في استراحة')}</p><h1>${chapter.title}</h1><p>${tr('Destination','الوجهة')}: ${destination.title}${route?` · ${route}`:''}</p>${goal?`<p class="camp-goal">${escape(goal)}</p>`:''}</header><div class="camp-places"${lit?` data-counsel="${lit}"`:''} aria-label="${tr('Places in Camp','أماكن المخيّم')}">${place('storehouse',tr('Storehouse','المخزن'),storehouseIllustration(p.foodLevel),tr('Improve food or pack bread','حسّن المؤونة أو احزم الخبز'))}${place('gate',tr('Home gate','بوّابة الديار'),`<img src="${campGateImage(p.age)}" alt=""/>${p.baseLevel?'<i class="camp-gate-brace"></i>':''}`,tr('Strengthen the gate or prepare repairs','قوِّ البوّابة أو جهّز الترميم'))}${place('company',tr('Your company','سريّتك'),companyArt(p),tr('Meet your troops and prepare your company','تعرّف إلى جنودك وجهّز سريّتك'))}${place('journal',tr('Journal','الدفتر'),journalIllustration(),tr('Choose a battle or read company records','اختر معركة أو اقرأ سجلّات السريّة'))}</div></div></div><footer class="camp-footer"><p>${tr('Battle starts when you choose Battle.','لا تبدأ المعركة إلا حين تختار «المعركة».')}</p><div><button class="big-button green" data-command="camp-battle">${tr('Battle','المعركة')}</button><button class="big-button secondary" data-command="camp-home">${tr('Home','الرئيسية')}</button></div></footer>`;
}
function preparationHtml(p:Readonly<Profile>,focus:'storehouse'|'gate'):string {
 const c=p.chronicle,preparation=focus==='storehouse'?'bread':'repair';
 if(!c||!preparationAvailable(c,preparation))return '';
 const selected=c.preparation===preparation,other=c.preparation!=='none'&&!selected;
 const bread=focus==='storehouse',verb=selected?(bread?tr('Remove bread','أخرِج الخبز'):tr('Remove repairs','ألغِ الترميم')):bread?tr('Pack bread','احزم الخبز'):tr('Prepare repairs','جهّز الترميم');
 const replaces=c.preparation==='bread'?tr('This replaces your bread.','وهذا يحلّ محلّ خبزك.'):tr('This replaces your repairs.','وهذا يحلّ محلّ ترميمك.');
 return `<p class="camp-preparation">${bread?tr('Bread adds 3 starting food.',`الخبز يزيد مؤونة البداية ${n(3)}.`):tr('Repairs add 15% starting gate health.',`الترميم يزيد صمود البوّابة في البداية ${n('15%')}.`)} ${other?replaces:tr('One preparation travels with the company.','تحمل السريّة معها استعداداً واحداً.')} ${tr('No coin cost.','بلا نقود.')}</p><button class="big-button blue" data-command="camp-local-preparation" data-camp-preparation="${selected?'none':preparation}">${verb}</button>`;
}
function upgradeHtml(game:Game,focus:'storehouse'|'gate',notice:string):string {
 const p=game.profile,s=game.state,food=focus==='storehouse',stat=food?'food':'base',status=game.upgradeStatus(stat),title=food?tr('Storehouse','المخزن'):tr('Home gate','بوّابة الديار');
 const current=food?foodRate(p).toFixed(2):number(s.playerMaxHp),next=status.nextValue===null?null:food?status.nextValue.toFixed(2):number(status.nextValue),level=food?p.foodLevel:p.baseLevel;
 const art=food?storehouseIllustration(level):`<img src="${campGateImage(p.age)}" alt=""/>${level?'<i class="camp-gate-brace"></i>':''}`;
 return `<div class="camp-focus">${heading(title,notice)}<div class="camp-focus-art" data-work-level="${level}" aria-hidden="true">${art}</div><p class="camp-values">${food?tr('Food rate','معدّل المؤونة'):tr('Gate maximum','أقصى صمود البوّابة')}: <strong dir="ltr">${current}${next===null?'':` → ${next}`}</strong> ${food?tr('food/sec','مؤونة/ث'):tr('health','صمود')}</p><p>${food?tr('Food begins to gather during battle. Improving here does not add food now.','تُجمع المؤونة أثناء المعركة. والتحسين هنا لا يضيف مؤونة الآن.'):tr(`Your gate has ${number(s.playerHp)} of ${number(s.playerMaxHp)} health. Strengthening adds the increase in maximum health; it does not refill missing health.`,`صمود بوّابتك ${n(number(s.playerHp))} من ${n(number(s.playerMaxHp))}. التقوية ترفع أقصى الصمود، ولا تُرمّم ما نقص منه.`)}</p>${wallet(p)}${status.cost===null?'':shortfall(status.cost,p)}<div class="camp-focus-actions">${p.furthestBattle<2&&campCounsel(p)?.station===focus?`<p class="camp-counsel-note">${tr('The lamp stays lit while another level here is worth it.','يبقى القنديل مضاءً ما دام في المزيد هنا نفع.')}</p>`:''}<button class="big-button green" data-command="camp-local-${stat}" data-camp-action="${stat}" ${status.allowed?'':'disabled'}>${status.cost===null?tr('Fully improved','اكتمل التحسين'):`${food?tr('Improve food','حسّن المؤونة'):tr('Strengthen gate','قوِّ البوّابة')} · ${coins(status.cost)}`}</button>${preparationHtml(p,focus)}${back()}</div></div>`;
}
function skillsHtml(p:Readonly<Profile>):string {
 const captain=p.chronicle?.enabled&&p.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===p.chronicle!.captain):undefined;
 const freeze=legacyEffects(p.legacy).freezeSeconds,third={skill:captain?.skill??tr('Food Drop','إمداد المؤونة'),description:captain?.description??tr('Gain up to 10 food, limited by 99-food storage.',`اجمع حتى ${n(10)} من المؤونة، ولا يتّسع المخزن لأكثر من ${n(99)}.`)};
 return `<section class="camp-skill-reading" aria-label="${tr('Battle skills','مهارات المعركة')}"><h3>${tr('Skills in battle','المهارات في المعركة')}</h3><p><strong>${tr('Freeze:','التجميد:')}</strong> ${tr(`Freeze all enemies for ${freeze} seconds.`,`يجمّد الأعداء كلّهم ${n(freeze)} ثوانٍ.`)}</p><p><strong>${tr('Meteor:','النيزك:')}</strong> ${tr('Hit every enemy. Select an enemy in battle to choose Freeze or Meteor.','يصيب كلّ عدوّ. اختر عدوّاً في المعركة لتختار التجميد أو النيزك.')}</p><p><strong>${third.skill}:</strong> ${third.description} ${tr('Inspect the supplies after deploying a troop to use it.','افحص المؤن بعد أن ترسل جندياً لتستعملها.')}</p><p>${tr('Each skill refreshes for a new battle. Camp never casts a skill.','تتجدّد كلّ مهارة في كلّ معركة جديدة، والمخيّم لا يستعمل أيّ مهارة.')}</p></section>`;
}
export function campFocusHtml(game:Game,focus:CampFocus,notice=''):string {
 if(focus==='storehouse'||focus==='gate')return upgradeHtml(game,focus,notice);
 const p=game.profile;
 if(typeof focus==='object'){
  const kind=focus.recruit,name=unitPresentationName(p.age,kind),cost=unlockCost(kind,p),joined=p.unlocked[kind],specialty=troopSpecialty(kind),foodCost=ERAS[p.age].units[kind].cost;
  return `<div class="camp-focus">${heading(name,notice)}<img class="camp-recruit-portrait" src="${unitPortrait(p.age,kind)}" alt=""/><p><strong>${ERAS[p.age].units[kind].role} · ${specialty.name}</strong>. ${specialty.effect}</p><p>${joined?tr('Part of your company.','من سريّتك.'):tr('A visitor waiting to join your company.','زائر ينتظر أن ينضمّ إلى سريّتك.')} ${tr(`Deployment in battle costs ${foodCost} food.`,`إرساله في المعركة يكلّف ${n(foodCost)} من المؤونة.`)} ${tr('Inspecting a troop here never deploys it.','تفقّد الجنديّ هنا لا يرسله.')}</p>${joined?'':wallet(p)+shortfall(cost,p)}<div class="camp-focus-actions">${joined?'':`<button class="big-button green" data-command="camp-local-unlock" data-camp-action="unlock" ${p.coins<cost?'disabled':''}>${tr(`Unlock ${name}`,`افتح ${name}`)} · ${coins(cost)}</button>`}${back()}</div></div>`;
 }
 if(focus==='company')return `<div class="camp-focus">${heading(tr('Your company','سريّتك'),notice)}<p>${tr('Meet a troop to read their role or invite them to join.','تعرّف إلى جنديّ لتقرأ دوره أو تدعوه للانضمام.')}</p><div class="camp-company-figures">${([0,1,2] as UnitKind[]).map(kind=>`<button class="camp-recruit" data-camp-recruit="${kind}" aria-label="${tr(`Inspect ${unitPresentationName(p.age,kind)}, ${p.unlocked[kind]?'in your company':'waiting to join'}`,`تفقّد ${unitPresentationName(p.age,kind)}، ${p.unlocked[kind]?'من سريّتك':'ينتظر الانضمام'}`)}"><img src="${unitPortrait(p.age,kind)}" alt=""/><span>${unitPresentationName(p.age,kind)}</span><small>${p.unlocked[kind]?tr('Joined','انضمّ'):tr('Waiting to join','ينتظر الانضمام')}</small></button>`).join('')}</div>${skillsHtml(p)}<div class="camp-focus-actions"><button class="big-button green" data-command="camp-evolution">${tr('Evolution','الارتقاء')}</button><button class="big-button secondary" data-command="camp-storybook">${tr('Storybook decisions','قرارات كتاب الحكايات')}</button>${back()}</div></div>`;
 return `<div class="camp-focus">${heading(tr('Company journal','دفتر السريّة'),notice)}<div class="camp-focus-art" aria-hidden="true">${journalIllustration()}</div><p>${tr('Choose your next destination, or read the company’s milestones, collection and stories. Opening the journal spends and claims nothing.','اختر وجهتك التالية، أو اقرأ معالم السريّة ومجموعتها وحكاياتها. فتح الدفتر لا يصرف شيئاً ولا يستلم شيئاً.')}</p><div class="camp-focus-actions"><button class="big-button green" data-command="camp-chapters">${tr('Choose battle','اختر معركة')}</button><button class="big-button secondary" data-command="camp-journal">${tr('Company journal','دفتر السريّة')}</button>${back()}</div></div>`;
}
