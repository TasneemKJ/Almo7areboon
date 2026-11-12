import test from 'node:test';
import assert from 'node:assert/strict';
import {setLang} from '../src/game/locale.ts';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {createChronicle} from '../src/game/chronicle.ts';
import {createChronicleBattle} from '../src/game/chronicle-combat.ts';
import type {Unit,Skill,BattleState} from '../src/game/types.ts';
import type {WaveStatus} from '../src/game/encounters.ts';
import {battleGuidance,defeatAdvice,waveAccessibleLabel,waveLabel} from '../src/ui/battle-hud.ts';
import {physicalFieldCue,physicalSkillCue} from '../src/ui/field-skill-guidance.ts';
import {fieldAnnouncement} from '../src/ui/field-announcement.ts';
import {fieldControlsHtml,fieldFoodReadout} from '../src/ui/field-controls.ts';
import {gateChoiceLabel} from '../src/ui/field-gate-label.ts';
import {skillCue} from '../src/ui/skill-cues.ts';
import {waveInspectionHtml} from '../src/ui/wave-inspection.ts';
import {regroupLearningHtml} from '../src/ui/regroup-learning.ts';
import {orderStatus,updateOrderBanner} from '../src/ui/battle-orders.ts';
import {nextGoalLabel} from '../src/ui/next-goal.ts';
import {companyFilmHtml} from '../src/ui/company-film.ts';
import {introHtml} from '../src/ui/intro-screen.ts';
import {syncBattleHud} from '../src/ui/hud-sync.ts';
import {fieldHarness,type FieldNode} from './helpers/field-dom.ts';

/** Latin words left in visible text; digits, ×, arrows and troop shapes are fine. */
const latin=(text:string)=>(text.replace(/Almo7areboon/g,'').match(/[A-Za-z]+/g)??[]);
/** Visible text of markup plus its aria-label, title and alt values. Language-picker options are skipped. */
function visible(html:string):string {
 const pickerless=html.replace(/<option[^>]*>[^<]*<\/option>/g,'').replace(/<label class="intro-language">[^<]*/,'<label>');
 const attributes=[...pickerless.matchAll(/\s(?:aria-label|title|alt)="([^"]*)"/g)].map(match=>match[1]);
 return [pickerless.replace(/<[^>]*>/g,' '),...attributes].join(' ');
}
function noLatin(text:string,where:string){assert.deepEqual(latin(text),[],`${where}: ${text}`);}

function arabic(run:()=>void){setLang('ar');try{run();}finally{setLang('en');}}
const enemies=(count:number)=>Array.from({length:count},(_,id)=>({id:100+id,side:'enemy',hp:10,kind:0,lane:1,x:600} as unknown as Unit));
function running(){const g=new Game();g.dispatch({type:'start'});return g;}

test('Arabic battle guidance, its physical cue and its announcement keep their decisions without English',()=>arabic(()=>{
 const lines:string[]=[];
 const g=new Game(),p=g.profile,s=g.state;
 lines.push(battleGuidance(p,s));p.wins=4;lines.push(battleGuidance(p,s));
 s.phase='won';lines.push(battleGuidance(p,s));s.phase='running';
 s.paused=true;lines.push(battleGuidance(p,s));s.paused=false;
 s.playerHp=s.playerMaxHp*.2;lines.push(battleGuidance(p,s));s.playerHp=s.playerMaxHp;
 p.wins=0;s.food=20;lines.push(battleGuidance(p,s));
 s.stats.deployed=1;s.food=90;s.units=[...enemies(1)];lines.push(battleGuidance(p,s));
 // Freeze teaching: the physical cue still recognises the canonical line in Arabic.
 s.food=10;s.time=30;s.stats.deployed=3;s.units=enemies(3);
 const freeze=battleGuidance(p,s);lines.push(freeze);
 assert.equal(physicalSkillCue(freeze),'اختر عدوّاً، ثم «التجميد» لتوقف المجموعة.');
 s.skillsUsed.push('freeze');s.stats.skillsCast=1;
 const meteor=battleGuidance(p,s);lines.push(meteor);assert.equal(physicalSkillCue(meteor),'اختر عدوّاً، ثم «النيزك» لتضرب المجموعة.');
 s.skillsUsed=[];s.stats.skillsCast=0;s.units=[];s.food=0;s.time=1;
 const drop=battleGuidance(p,s);lines.push(drop);
 const physicalDrop=physicalSkillCue(drop);lines.push(physicalDrop);assert.match(physicalDrop,/^المس المؤن لإمداد المؤونة/);
 const spoken=fieldAnnouncement(physicalDrop);lines.push(spoken);assert.doesNotMatch(spoken,/انتظر \d/);
 p.wins=4;lines.push(battleGuidance(p,s));p.wins=0;
 s.food=40;s.time=30;s.units=enemies(1);lines.push(battleGuidance(p,s));lines.push(physicalSkillCue(battleGuidance(p,s)));
 const preview={number:2,total:5,counts:[2,1,0] as [number,number,number],nextIn:6};
 p.unlocked=[true,true,true];s.stats.skillsCast=1;
 for(const intent of ['volley','rush','bulwark'] as const)lines.push(battleGuidance(p,s,{...preview,intent}));
 s.units=[];p.unlocked=[true,false,false];p.coins=1e6;lines.push(battleGuidance(p,s));lines.push(physicalSkillCue(battleGuidance(p,s)));
 p.coins=0;p.unlocked=[true,true,true];lines.push(battleGuidance(p,s));
 // Food piling: visible count, silent count.
 const pile=running();pile.state.stats.deployed=1;pile.state.food=80;pile.state.units=enemies(1);
 const piling=battleGuidance(pile.profile,pile.state);lines.push(piling);assert.match(piling,/^المؤونة تتكدّس \(80\)/);
 assert.doesNotMatch(fieldAnnouncement(physicalFieldCue(pile.profile,pile.state,null,pile.deploymentStatus(0))),/\d/);
 // Defeat advice.
 const d=defaultProfile();lines.push(defeatAdvice(d));d.coins=1e6;lines.push(defeatAdvice(d));d.unlocked=[true,true,false];lines.push(defeatAdvice(d));
 d.unlocked=[true,true,true];lines.push(defeatAdvice(d));d.coins=0;d.gems=1e4;lines.push(defeatAdvice(d));
 for(const line of lines)noLatin(line,'guidance');
}));

test('Arabic field controls, gate labels, food readout and the live controller speak Arabic',()=>arabic(()=>{
 noLatin(visible(fieldControlsHtml()),'field controls');
 for(const food of [0,40,99])noLatin(fieldFoodReadout(food).label,'food readout');
 for(const kind of ['hold','advance'] as const)for(const ready of [false,true])for(const active of [false,true])noLatin(gateChoiceLabel(kind,ready,active),'gate label');
 const check=(h:ReturnType<typeof fieldHarness>,where:string)=>{
  const nodes:FieldNode[]=[...h.root.children.values(),...h.gates,...h.recruits,...h.root.children.get('#field-context')!.buttons];
  for(const node of nodes){
   noLatin(node.textContent??'',`${where} text`);noLatin(node.title,`${where} title`);
   noLatin(node.getAttribute('aria-label')??'',`${where} aria-label`);
   for(const child of node.children.values())noLatin(child.textContent??'',`${where} child`);
  }
 };
 const h=fieldHarness();h.game.state.food=0;h.game.state.time=1;h.update();check(h,'food wait');
 h.game.state.food=50;h.game.state.stats.deployed=0;h.update();check(h,'first recruit');
 h.game.state.stats.deployed=3;h.game.state.units=enemies(3);h.game.state.time=30;h.update();
 h.controller.select('enemy',h.game);check(h,'enemy menu');
 h.controller.clear();h.controller.select('supplies',h.game);check(h,'supplies menu');
 h.game.state.orders={charge:60,until:0} as BattleState['orders'];h.update();check(h,'momentum');
 const story=fieldHarness();story.game.profile.wins=7;story.game.state.food=10;
 for(const route of ['watch','escort','scout','lantern','bell','road'] as const){
  story.game.profile.chronicle={...createChronicle(),enabled:true,route,tutorial:4};story.game.state.chronicle=createChronicleBattle(story.game.profile);
  story.game.state.time=30;story.update();
  const cue=story.root.children.get('#field-cue')!.textContent;
  assert.doesNotMatch(story.root.children.get('#field-announcement')!.textContent,/ · .*\d/,`${route} announcement stays still: ${cue}`);
 }
}));

test('Arabic skill cues, wave labels and field notes, orders and the journey chip have no English',()=>arabic(()=>{
 const g=running(),p=g.profile,s=g.state;
 const cues=(skill:Skill)=>{const cue=skillCue(p,s,skill,true);noLatin(cue.label,`${skill} label`);noLatin(cue.badge,`${skill} badge`);return cue;};
 for(const count of [0,1,2,3,12]){s.units=enemies(count);for(const skill of ['freeze','meteor','food'] as const)cues(skill);}
 s.skillsUsed=['freeze','meteor','food'];s.freezeUntil=s.time+4;for(const skill of ['freeze','meteor','food'] as const)cues(skill);
 s.skillsUsed=[];s.food=95;cues('food');s.food=99;cues('food');
 s.paused=true;cues('freeze');s.paused=false;s.phase='won';cues('meteor');s.phase='running';
 p.chronicle={...createChronicle(),enabled:true,captain:'gatekeeper'};cues('food');p.chronicle.captain='lantern';cues('food');
 s.chronicle=createChronicleBattle(p);s.units=[];cues('meteor');
 const preview={number:2,total:5,counts:[3,1,2] as [number,number,number],nextIn:7.2,intent:'volley' as const};
 const statuses:WaveStatus[]=[
  {spawned:3,total:9,nextIn:7.2,preview,enemiesRemaining:2,pendingEnemies:1,cleared:false} as WaveStatus,
  {spawned:5,total:5,nextIn:null,preview:null,enemiesRemaining:2,pendingEnemies:1,cleared:false} as WaveStatus,
  {spawned:5,total:5,nextIn:null,preview:null,enemiesRemaining:2,pendingEnemies:0,cleared:false} as WaveStatus,
  {spawned:5,total:5,nextIn:null,preview:null,enemiesRemaining:0,pendingEnemies:0,cleared:true} as WaveStatus,
 ];
 for(const status of statuses)for(const objective of [undefined,'escort','hold','rescue','light','boss'] as const){
  noLatin(waveLabel(status,objective),'wave label');noLatin(waveAccessibleLabel(status,objective),'wave aria');noLatin(visible(waveInspectionHtml(status,objective)),'field notes');
 }
 for(const intent of ['rush','bulwark'] as const)noLatin(visible(waveInspectionHtml({...statuses[0],preview:{...preview,intent}})),'field notes intent');
 const order=running();noLatin(orderStatus(order.state).label,'order');
 order.state.orders={charge:30,until:0} as BattleState['orders'];noLatin(orderStatus(order.state).label,'order charge');
 order.state.orders={charge:60,until:0} as BattleState['orders'];noLatin(orderStatus(order.state).label,'order ready');
 order.state.paused=true;noLatin(orderStatus(order.state).label,'order paused');order.state.paused=false;
 order.state.phase='won';noLatin(orderStatus(order.state).label,'order done');noLatin(orderStatus(new Game().state).label,'order ready phase');
 const banner={dataset:{} as Record<string,string>,label:{textContent:''},fill:{style:{transform:''}},buttons:['hold','advance'].map(order=>({dataset:{order},disabled:false,attributes:new Map<string,string>(),setAttribute(key:string,value:string){this.attributes.set(key,value);}}))};
 updateOrderBanner({dataset:banner.dataset,querySelector:(selector:string)=>selector==='.order-status'?banner.label:banner.fill,querySelectorAll:()=>banner.buttons} as unknown as HTMLElement,order.state);
 noLatin(banner.label.textContent,'order banner');for(const button of banner.buttons)noLatin(button.attributes.get('aria-label')??'','order button');
 const goals=defaultProfile();
 for(const day of [goals.dailyDay,goals.dailyDay+1]){const goal=nextGoalLabel(goals,day);noLatin(goal.text,'goal');noLatin(goal.label,'goal label');}
 goals.dailyDay=20000;goals.dailyStreak=1;goals.wins=1;goals.kills=3;
 const goal=nextGoalLabel(goals,20000);noLatin(goal.text,'goal open');noLatin(goal.label,'goal open label');
}));

test('Arabic defeat preparation, film and opening tale render in Arabic',()=>arabic(()=>{
 const g=new Game();g.dispatch({type:'start'});g.dispatch({type:'retreat'});
 const p=g.profile;noLatin(visible(regroupLearningHtml(p,g.state)),'regroup');
 for(const change of [{coins:1e9,age:0},{coins:1e6,age:5,enemyAge:5},{coins:1e6,age:5,unlocked:[true,true,false]},{coins:1e6,age:5,unlocked:[true,true,true]},{coins:0,gems:1e4,unlocked:[true,true,true]},{age:4,enemyAge:5,furthestBattle:5}]){
  Object.assign(p,change);noLatin(visible(regroupLearningHtml(p,g.state)),`regroup ${JSON.stringify(change)}`);
 }
 const film=companyFilmHtml();noLatin(visible(film),'film');assert.match(film,/<option value="ar" lang="ar" selected>/);
 noLatin(visible(introHtml(0,'ar')),'intro');
}));

test('Arabic battle HUD writes Arabic into every field it owns',()=>arabic(()=>{
 class Node {textContent='';innerHTML='';title='';hidden=false;disabled=false;dataset:Record<string,string>={};style:Record<string,string>={};attributes=new Map<string,string>();
  classList={toggle:()=>{}};setAttribute(key:string,value:string){this.attributes.set(key,value);}getAttribute(key:string){return this.attributes.get(key)??null;}toggleAttribute(){}
  querySelector(){return new Node();}querySelectorAll(){return [];}}
 const nodes=new Map<string,Node>(),$=(id:string)=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)!;};
 // Fields whose words come from files outside this group: chapter names, troop labels (army-screen), Chronicle rules.
 const others=new Set(['age-title','scene-name','coins','gems','story-ready-rule']);
 const g=running();g.profile.coins=50;g.state.playerMaxHp=900;g.state.playerHp=900;g.state.enemyMaxHp=900;g.state.enemyHp=900;
 const root={dataset:{},querySelectorAll:()=>[]} as unknown as HTMLElement;
 const view={root,$:$ as never,game:g,money:String,coin:String,manualPaused:false};
 const check=(where:string)=>{for(const [id,node] of nodes){if(others.has(id))continue;noLatin(node.textContent,`${where} #${id}`);noLatin(node.innerHTML,`${where} #${id} html`);noLatin(node.getAttribute('aria-label')??'',`${where} #${id} aria`);}};
 syncBattleHud(view);check('running');
 view.manualPaused=true;syncBattleHud(view);check('paused');view.manualPaused=false;
 g.state.phase='won';syncBattleHud(view);check('won');
 const ready=new Game();syncBattleHud({...view,game:ready});check('ready');
}));
