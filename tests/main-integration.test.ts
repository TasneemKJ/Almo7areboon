import {chronicleScreenHtml,chronicleActionFromData} from '../src/ui/chronicle-screen.ts';
import {chronicleGuidance} from '../src/game/chronicle-combat.ts';
import {CAPTAINS,routeDefinition,createChronicle} from '../src/game/chronicle.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { createSaveSession } from '../src/game/save-session.ts';
import { saveSessionDialogHtml, temporarySessionNotice } from '../src/ui/save-session-screen.ts';
import { advanceStatus } from '../src/game/mastery.ts';
import { battleSelectionHtml, evolutionDialogHtml } from '../src/ui/progression-screen.ts';
import { ERAS, QUESTS, foodRate, unlockCost, dailyReward, localDay } from '../src/game/data.ts';
import { battleGuidance, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel } from '../src/ui/battle-hud.ts';
import { chapterPresentation, unitPresentationName } from '../src/ui/chapter-presentation.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';
import { earlierChapter } from '../src/ui/regroup-learning.ts';
import { isLegacyChoice, legacyEffects, prestigePreview } from '../src/game/prestige.ts';
import { legacyCurrentHtml, prestigeDetailsHtml, prestigeDialogHtml } from '../src/ui/prestige-presentation.ts';
import { evolutionScreenHtml } from '../src/ui/evolution-screen.ts';
import { skillCue } from '../src/ui/skill-cues.ts';
import { troopUnlockMessage } from '../src/ui/army-screen.ts';
import { waveInspectionHtml } from '../src/ui/wave-inspection.ts';

// Execute the app's actual functions with a clock and minimal DOM boundary; no browser/debug hooks.
const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const names = new Set(['playable', 'guardAction', 'action', 'persist', 'update', 'renderScreen', 'sessionPresentation', 'showResult', 'acquireSession', 'dismissModal', 'returnToChapters', 'clearPrestigeContext', 'openPrestige', 'refreshPrestige', 'returnFromPrestige']);
const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.name && names.has(node.name.text));
assert.equal(functions.length, names.size);
const click=ast.statements.find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(ast)==='lifetime.listen'&&node.expression.arguments[0]?.getText(ast)==='root'&&node.expression.arguments[1]?.getText(ast)==="'click'") as ts.ExpressionStatement;
assert.ok(click,'the real click handler must remain reachable');
const listener=(click.expression as ts.CallExpression).arguments[2];
const change=ast.statements.find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(ast)==='lifetime.listen'&&node.expression.arguments[0]?.getText(ast)==='root'&&node.expression.arguments[1]?.getText(ast)==="'change'") as ts.ExpressionStatement;
assert.ok(change,'the real native radio listener must remain reachable');
const changeListener=(change.expression as ts.CallExpression).arguments[2];
const code = ts.transpile(functions.map(node => node.getText(ast)).join('\n')+`\nthis.handleClick=${listener.getText(ast)};this.handleChange=${changeListener.getText(ast)};`, { target: ts.ScriptTarget.ES2022 });
function harness(motion = 'full') {
  let now = 100, foreign = false;
  const dialogs: string[] = [];
  const node = () => ({ dataset: {}, style: {}, hidden: false, innerHTML:'',textContent:'',classList: { toggle() {} }, setAttribute() {}, toggleAttribute() {}, querySelector() { return null; }, querySelectorAll():any[] { return []; } });
  class BoundaryButton {
    dataset:Record<string,string>;disabled=false;
    constructor(dataset:Record<string,string>){this.dataset=dataset;}
    closest(selector:string){return selector==='button'||(selector==='#modal-layer'&&!this.dataset.tab)?this:null;}
  }
  class BoundaryInput {
    type='radio';checked=true;id='';name:string;value:string;
    constructor(name:string,value:string){this.name=name;this.value=value;}
    closest(selector:string){return selector===(this.name==='prestige-legacy'?'#modal-layer':'#secondary-screen')?this:null;}
  }
  const root = node(), elements = new Map<string, ReturnType<typeof node>>();
  const context: any = {
    Element:BoundaryButton,HTMLInputElement:BoundaryInput, Game, game: new Game(defaultProfile()), sessionReady: true, retriedSession: false, pagePresent: true, lifetime: { disposed: false },
    acquiring: null, acquisitionVersion: 0, hasPlayed: true, manualPaused: false, savedWarning: false, pendingImport: null, modal: null, evolutionFromResult: false, modalPointerSequence: false,prestigeOrigin:null,prestigeDraft:null,prestigeExpectedTimeline:null,
    lastUpdate: 0, lastSave: 100, lastPhase: 'ready', resultDue: 0, resultShown: '', activeTab: 'battle', root,
    performance: { now: () => now }, document: { documentElement: { dataset: { motion } } },
    $: (id: string) => { if (!elements.has(id)) elements.set(id, node()); return elements.get(id); },
    chronicleScreenHtml,chronicleActionFromData,chronicleGuidance,CAPTAINS,routeDefinition,advanceStatus, battleSelectionHtml, evolutionDialogHtml, ERAS, QUESTS, foodRate, unlockCost, dailyReward, localDay, battleGuidance, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel, chapterPresentation, unitPresentationName, resultsHtml,isLegacyChoice,legacyEffects,prestigePreview,prestigeDetailsHtml,prestigeDialogHtml,legacyCurrentHtml,evolutionScreenHtml,saveSessionDialogHtml,temporarySessionNotice,skillCue,troopUnlockMessage,waveInspectionHtml,
    earlierChapter,storybookArt: () => false, money: String, coin: String, icon:()=>'',textIfChanged(target:any,value:string){target.textContent=value;},htmlIfChanged(target:any,value:string){target.innerHTML=value;},unlockAudio() {}, syncPause() {}, rebuildArmy() {}, syncMotion() {}, isolateModal(){}, toast() {},
    closeModal() { context.modal=null; }, showModal: (id: string,html:string,focusCommand?:string) => {context.modal=id;context.dialogHtml=html;context.focusCommand=focusCommand;dialogs.push(id);},
    session: {
      status: 'active', check: () => {if(foreign){context.session.status='conflict';context.sessionPresentation('conflict');return false;}return true;},
      save: () => { if (foreign) { context.session.status = 'conflict'; context.sessionReady = false; dialogs.push('session'); return { ok: false }; } return { ok: true }; },
      acquire: async () => ({ status: 'active', profile: defaultProfile(), loadStatus: 'loaded' }),
    },
  };
  context.switchTab = (tab:string) => {context.activeTab=tab;context.update(true);};
  runInNewContext(`${code}\nthis.api = { update, action, acquireSession, dismissModal, returnToChapters, showResult, renderScreen }; this.update = update;`, context);
  return { context, dialogs, click:(command:string,detail=0)=>context.handleClick({target:new BoundaryButton({command}),detail,preventDefault(){}}), clickData:(dataset:Record<string,string>,detail=0)=>context.handleClick({target:new BoundaryButton(dataset),detail,preventDefault(){}}), change:(name:string,value:string)=>context.handleChange({target:new BoundaryInput(name,value)}),clock: (value: number) => { now = value; }, foreign: () => { foreign = true; } };
}
test('loss recovery opens chapter choice without selecting, buying or starting and ignores duplicate invocation',()=>{
 const h=harness(),c=h.context;Object.assign(c.game.profile,{age:4,enemyAge:5,furthestBattle:5,coins:0,gems:0,chronicle:createChronicle(1,5)});
 c.game.dispatch({type:'start'});c.game.dispatch({type:'retreat'});c.modal='result';c.manualPaused=true;
 const before=JSON.stringify(c.game.profile);h.click('regroup-chapters');
 assert.equal(c.game.state.phase,'ready');assert.equal(c.modal,'battles');assert.equal(c.manualPaused,false);
 assert.equal(c.focusCommand,'choose-battle-4');assert.match(c.dialogHtml,/SUGGESTED REPLAY/);
 assert.equal(JSON.stringify(c.game.profile),before);h.click('regroup-chapters');assert.equal(JSON.stringify(c.game.profile),before);
 h.clickData({battle:'4'});assert.equal(c.game.profile.enemyAge,4);assert.equal(c.game.state.phase,'ready');assert.equal(c.game.profile.coins,0);
});
test('recovery route rejects wrong phase and yields to ownership loss before or during retry persistence',()=>{
 for(const phase of ['ready','running','won'] as const){const h=harness(),c=h.context;Object.assign(c.game.profile,{enemyAge:2,furthestBattle:2,chronicle:createChronicle(1,2)});c.game.state.phase=phase;c.modal='result';const before=JSON.stringify([c.game.profile,c.game.state]);h.click('regroup-chapters');assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);assert.equal(c.modal,'result');}
 for(const duringSave of [false,true]){const h=harness(),c=h.context;Object.assign(c.game.profile,{enemyAge:2,furthestBattle:2,chronicle:createChronicle(1,2)});c.game.dispatch({type:'start'});c.game.dispatch({type:'retreat'});c.modal='result';const before=JSON.stringify(c.game.profile);
  if(duringSave)c.session.save=()=>{c.session.status='conflict';c.sessionPresentation('conflict');return {ok:false};};else h.foreign();
  h.click('regroup-chapters');assert.equal(c.modal,'session');assert.equal(JSON.stringify(c.game.profile),before);
 }
});
test('wave inspection delegates the existing modal route without spending, saving or clearing manual pause',()=>{
 for(const manual of [false,true]){const h=harness(),c=h.context;h.click('start');c.manualPaused=manual;let writes=0;c.session.save=()=>{writes++;return {ok:true};};const before=JSON.stringify(c.game.profile);h.click('wave-help');assert.equal(c.modal,'wave-help');assert.match(c.dialogHtml,/Wave 1 of 5: 1 melee/);assert.equal(c.manualPaused,manual);c.api.dismissModal();assert.equal(c.modal,null);assert.equal(c.manualPaused,manual);assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);}
});
test('wave inspection is absent outside running play and yields to foreign-session recovery',()=>{
 const ready=harness();ready.click('wave-help');assert.equal(ready.context.modal,null);
 const lost=harness();lost.click('start');lost.context.game.dispatch({type:'retreat'});lost.click('wave-help');assert.equal(lost.context.modal,null);
 const foreign=harness();foreign.click('start');const before=JSON.stringify(foreign.context.game.profile);foreign.foreign();foreign.click('wave-help');assert.equal(foreign.context.modal,'session');assert.equal(JSON.stringify(foreign.context.game.profile),before);
});
test('accepted troop unlock teaches starting Battle without deploying or consuming food',()=>{
 const h=harness(),c=h.context,messages:any[]=[];c.toast=(...args:any[])=>messages.push(args);c.game.profile.coins=150;
 const food=c.game.state.food;h.clickData({unit:'1'});
 assert.equal(c.game.profile.coins,0);assert.equal(c.game.profile.unlocked[1],true);assert.equal(c.game.state.stats.deployed,0);assert.equal(c.game.state.food,food);
 assert.match(messages[0][0],/Thrower unlocked!.*extra damage to heavy enemies.*Start Battle.*5 food/);assert.equal(messages[0][1],7000);
 h.click('start');h.clickData({unit:'1'});assert.equal(c.game.state.stats.deployed,1);assert.equal(c.game.state.food,food-ERAS[0].units[1].cost);assert.equal(messages.length,1,'deployment does not repeat unlock teaching');
});
test('rejected or foreign unlock has no success teaching and save failure remains visible',()=>{
 for(const foreign of [false,true]){const h=harness(),c=h.context,messages:string[]=[];c.toast=(s:string)=>messages.push(s);if(foreign){c.game.profile.coins=150;h.foreign();}const before=JSON.stringify(c.game.profile);h.clickData({unit:'1'});assert.deepEqual(messages,[]);assert.equal(JSON.stringify(c.game.profile),before);}
 const h=harness(),c=h.context,messages:string[]=[];c.game.profile.coins=150;c.toast=(s:string)=>messages.push(s);c.session.save=()=>({ok:false,reason:'write-failed'});h.clickData({unit:'1'});
 assert.equal(c.game.profile.unlocked[1],true);assert.equal(messages.length,1);assert.match(messages[0],/Progress could not be saved/);
 const lost=harness(),lostMessages:string[]=[];lost.context.game.profile.coins=150;lost.context.toast=(s:string)=>lostMessages.push(s);lost.context.session.save=()=>{lost.context.session.status='conflict';lost.context.sessionPresentation('conflict');return {ok:false};};lost.clickData({unit:'1'});assert.deepEqual(lostMessages,[]);assert.equal(lost.context.modal,'session');
});
for (const [motion, delay] of [['full', 1300], ['reduced', 350]] as const) test(`${motion} result delay yields to save recovery before opening`, () => {
  const h = harness(motion), c = h.context;
  c.game.dispatch({ type: 'start' }); c.api.update(true);
  c.game.state.enemyHp = 0; c.game.step(1 / 60); c.api.update(true);
  h.clock(100 + delay - 1); c.api.update(true); assert.deepEqual(h.dialogs, []);
  h.foreign(); h.clock(100 + delay); c.api.update(true);
  assert.deepEqual(h.dialogs, ['session'], 'persist detects conflict and recovery keeps its dialog');
  h.clock(100 + delay + 100); c.api.update(true); assert.deepEqual(h.dialogs, ['session']);
});
test('newly finished battles delay the result, but reacquired saved victories open immediately', async () => {
  const h = harness(), c = h.context;
  c.game.dispatch({ type: 'start' }); c.api.update(true);
  c.game.state.enemyHp = 0; c.game.step(1 / 60); c.api.update(true);
  h.clock(1400); c.api.update(true); assert.deepEqual(h.dialogs, ['result']);
  const saved = defaultProfile(); saved.pendingVictory = { settlement: 'legacy', timeline: 1, battle: 0, earned: 10, seconds: 3, playerHp: 100 };
  c.lastPhase = 'running'; c.resultDue = 99999; c.sessionReady = false;
  c.session.acquire = async () => ({ status: 'active', profile: saved, loadStatus: 'loaded' });
  await c.api.acquireSession();
  assert.equal(c.lastPhase, 'won'); assert.equal(c.resultDue, 0); assert.deepEqual(h.dialogs, ['result', 'result']);
});
test('daily claims use the app action guard before mutating progress', () => {
  const h = harness(), c = h.context;
  const before = JSON.stringify(c.game.profile); h.foreign();
  assert.equal(c.api.action({ type: 'daily', day: 20000 }), false);
  assert.equal(JSON.stringify(c.game.profile), before);
  const active = harness().context;
  assert.equal(active.api.action({ type: 'daily', day: 20000 }), true);
  assert.equal(active.game.profile.gems, 130); assert.equal(active.game.profile.dailyDay, 20000);
});

// Settled seed receipts are produced by public combat actions, never invented outcomes.
function realVictory(chapter=1,timeline=1,strongCards=true) {
 const p=defaultProfile();p.enemyAge=chapter;p.furthestBattle=5;p.timeline=timeline;p.mastery.timeline=timeline;
 p.age=strongCards?0:5;p.coins=ERAS[0].evolveCost;p.foodLevel=12;p.unlocked=[true,true,true];if(strongCards)p.cards=p.cards.map(()=>100);
 const g=new Game(p);assert.equal(g.dispatch({type:'start'}),true);let cycle=0;
 for(let tick=0;tick<36000&&g.state.phase==='running';tick+=6){
  if(g.state.time>=8)g.dispatch({type:'skill',skill:'food'});
  const enemies=g.state.units.filter(unit=>unit.side==='enemy'&&unit.hp>0);
  if(enemies.length>=3){g.dispatch({type:'skill',skill:'freeze'});g.dispatch({type:'skill',skill:'meteor'});}
  if(g.dispatch({type:'spawn',kind:([0,1,2] as const)[cycle%3]}))cycle++;
  for(let step=0;step<6;step++)g.step(1/60);
 }
 assert.equal(g.state.phase,'won');return g;
}
function settledHarness(chapter=1,timeline=1,legacy=false){
 const h=harness(),g=realVictory(chapter,timeline);
 if(legacy){const raw=JSON.parse(JSON.stringify(g.profile));raw.version=2;delete raw.mastery;delete raw.pendingVictory.settlement;h.context.game=new Game(decodeSave(JSON.stringify(raw)).profile!);}
 else h.context.game=new Game(g.profile);
 h.context.lastPhase='won';h.context.resultShown='won';h.context.modal='result';return h;
}
for(const legacy of [false,true])test(`actual result evolution click/cancel and confirmation preserve ${legacy?'legacy':'settled'} receipt and refresh availability`,()=>{
 const h=settledHarness(1,1,legacy),c=h.context,before=structuredClone(c.game.profile);
 h.click('evolve');assert.equal(c.modal,'evolve');assert.equal(c.evolutionFromResult,true);
 h.click('close');assert.equal(c.modal,'result');assert.deepEqual(c.game.profile,before);
 h.click('evolve');c.api.dismissModal();assert.equal(c.modal,'result');assert.deepEqual(c.game.profile,before);
 h.click('evolve');h.click('confirm-evolve');assert.equal(c.modal,'result');assert.equal(c.game.state.phase,'won');
 assert.equal(c.game.profile.age,1);assert.equal(c.game.profile.coins,0);
 for(const field of ['enemyAge','furthestBattle','mastery','pendingVictory','wins','gems'])assert.deepEqual(c.game.profile[field],before[field]);
 const html=resultsHtml(c.game.profile,c.game.state);assert.match(html,new RegExp(`Evolve · ${ERAS[1].evolveCost.toLocaleString('en-US')} coins`));assert.match(html,/data-command="evolve" disabled/);
 // Synthetic activation reaches the same rejected action path; affordability refreshes without losing Return.
 h.click('evolve');h.click('confirm-evolve');assert.equal(c.modal,'evolve');assert.match(evolutionDialogHtml(c.game.profile,c.game.state)!,/confirm-evolve" disabled/);
 c.api.dismissModal();assert.equal(c.modal,'result');
 h.click('next');assert.equal(c.modal,null);assert.equal(c.game.state.phase,'ready');assert.equal(c.game.profile.enemyAge,2);assert.equal(c.game.profile.wins,before.wins);
});
for(const route of ['close','Escape','confirm-evolve'])test(`actual ${route} result-origin route leaves recovery above the stale result`,()=>{
 const h=settledHarness(),c=h.context;h.click('evolve');const before=JSON.stringify(c.game.profile);h.foreign();
 if(route==='Escape')c.api.dismissModal();else h.click(route);
 assert.equal(c.modal,'session');assert.equal(JSON.stringify(c.game.profile),before);assert.deepEqual(h.dialogs,['evolve','session']);
 c.api.showResult();assert.equal(c.modal,'session');assert.deepEqual(h.dialogs,['evolve','session']);
});
test('conflict discovered by guarded persistence after evolution retains recovery and never reopens result',()=>{
 const h=settledHarness(),c=h.context;h.click('evolve');
 c.session.save=()=>{c.session.status='conflict';c.sessionReady=false;c.modal='session';h.dialogs.push('session');return {ok:false};};
 h.click('confirm-evolve');assert.equal(c.modal,'session');assert.deepEqual(h.dialogs,['evolve','session']);assert.equal(c.game.profile.age,1);
});
test('actual evolution with real SaveSession quota preserves warning and old bytes, then permits recovered-save feedback',async()=>{
 const h=harness(),c=h.context,p=defaultProfile();p.coins=ERAS[0].evolveCost;c.game=new Game(p);
 const values=new Map([[SAVE_KEY,JSON.stringify(p)],[BACKUP_KEY,JSON.stringify(p)]]);let failWrites=false;const messages:string[]=[];c.toast=(s:string)=>messages.push(s);
 const session=createSaveSession({storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(failWrites&&key===SAVE_KEY)throw Error('quota');values.set(key,value);}},locks:{request:async(name,_options,callback)=>callback({name})},onStatus:c.sessionPresentation});c.session=session;
 try{
  await session.acquire();c.sessionReady=true;const old=[values.get(SAVE_KEY),values.get(BACKUP_KEY)];h.click('evolve');failWrites=true;h.click('confirm-evolve');
  assert.equal(c.game.profile.age,1);assert.equal(c.game.profile.coins,0);assert.deepEqual([values.get(SAVE_KEY),values.get(BACKUP_KEY)],old);assert.equal(c.savedWarning,true);
  assert.deepEqual(messages,['Progress could not be saved. Export a backup from Settings before closing this tab.']);
  failWrites=false;assert.equal(c.persist(),true);assert.equal(c.savedWarning,false);assert.equal(JSON.parse(values.get(SAVE_KEY)!).age,1);assert.equal(values.get(BACKUP_KEY),old[0],'first successful retry retains the previous valid profile as backup');
  assert.equal(c.persist(),true);assert.equal(values.get(SAVE_KEY),values.get(BACKUP_KEY),'subsequent unchanged save advances the backup to the recovered profile');
  c.game.profile.coins=ERAS[1].evolveCost;c.game.profile.enemyAge=1;c.game.profile.furthestBattle=1;h.click('evolve');h.click('confirm-evolve');assert.equal(c.game.profile.age,2);assert.match(messages.at(-1)!,/^Entering Harbor Watch\./);
 }finally{session.dispose();}
});
for(const legacy of [false,true])for(const escape of [false,true])test(`actual terminal ${legacy?'legacy':'settled'} ${escape?'Escape':'Return'} dispatches ready then picker without payout`,()=>{
 const h=settledHarness(5,1000,legacy),c=h.context,before=structuredClone(c.game.profile);
 if(escape)c.api.dismissModal();else h.click('return-chapters');
 assert.equal(c.game.state.phase,'ready');assert.equal(c.modal,'battles');assert.equal(c.game.profile.pendingVictory,null);
 for(const field of ['timeline','mastery','wins','coins','gems','furthestBattle'])assert.deepEqual(c.game.profile[field],before[field]);
 c.api.dismissModal();assert.equal(c.modal,null);c.api.update(true);assert.equal(c.modal,null);
});

for(const chapter of [0,5])test(`native double-click ${chapter===5?'prestige preview and confirmation':'chapter continuation'} cannot select Cards navigation`,()=>{
 const h=settledHarness(chapter,1,chapter===5),c=h.context,before=JSON.stringify(c.game.profile);
 h.click('next',1);
 if(chapter===5){
  assert.equal(c.game.state.phase,'won');assert.equal(c.modal,'prestige');assert.equal(JSON.stringify(c.game.profile),before);
  h.click('confirm-prestige',2);assert.equal(c.modal,'prestige');assert.equal(JSON.stringify(c.game.profile),before);
  h.click('confirm-prestige',1);assert.equal(c.game.state.phase,'ready');assert.equal(c.modal,null);assert.equal(c.game.profile.timeline,2);
 }else{assert.equal(c.game.state.phase,'ready');assert.equal(c.modal,null);}
 assert.equal(c.activeTab,'battle');
 const after=JSON.stringify(c.game.profile);
 // Continued modal-origin pointer input cannot select either exposed or isolated navigation.
 h.clickData({tab:'cards'},2);assert.equal(c.activeTab,'battle');assert.equal(JSON.stringify(c.game.profile),after);
 h.clickData({tab:'cards'},3);assert.equal(c.activeTab,'battle');
 // New single clicks work after the explicit continuation/confirmation reveals navigation.
 h.clickData({tab:'cards'},1);assert.equal(c.activeTab,'cards');
});

for(const origin of ['result','battles'])for(const route of ['close','Escape'])test(`prestige ${route} explicitly restores ${origin} with unchanged settled progress`,()=>{
 const h=settledHarness(5),c=h.context;
 if(origin==='battles'){assert.equal(c.game.dispatch({type:'retry'}),true);c.modal='battles';}
 const before=JSON.stringify(c.game.profile);
 h.click('next');assert.equal(c.modal,'prestige');assert.equal(c.prestigeOrigin,origin);assert.equal(c.prestigeExpectedTimeline,1);
 if(route==='Escape')c.api.dismissModal();else h.click('close');
 assert.equal(c.modal,origin);assert.equal(JSON.stringify(c.game.profile),before);assert.equal(c.prestigeOrigin,null);assert.equal(c.focusCommand,'next');
 h.click('next');assert.equal(c.modal,'prestige');
});
for(const reload of [false,true])test(`real cleared-final loss ${reload?'reloaded picker':'result'} opens preview and cancellation preserves the loss ledger`,()=>{
 const h=harness(),c=h.context;c.game=new Game(realVictory(5,1,false).profile);assert.equal(c.game.dispatch({type:'retry'}),true);assert.equal(c.game.dispatch({type:'start'}),true);
 for(let tick=0;tick<54000&&c.game.state.phase==='running';tick++)c.game.step(1/60);
 assert.equal(c.game.state.phase,'lost');assert.equal(c.game.profile.pendingVictory,null);
 if(reload)c.game=new Game(c.game.profile);
 c.modal=reload?'battles':'result';c.resultShown=reload?'':'lost';c.lastPhase=c.game.state.phase;
 const before=JSON.stringify(c.game.profile);h.click('next');assert.equal(c.modal,'prestige');assert.equal(c.prestigeOrigin,reload?'battles':'result');
 c.api.dismissModal();assert.equal(c.modal,reload?'battles':'result');assert.equal(JSON.stringify(c.game.profile),before);
});
test('prestige confirmation is capped, resets once, and preserves permanent holdings and counters',()=>{
 const h=settledHarness(5),c=h.context;c.game.profile.gems=9999950;
 const before=structuredClone(c.game.profile);h.click('next');h.click('confirm-prestige');
 assert.equal(c.modal,null);assert.equal(c.game.state.phase,'ready');assert.equal(c.game.profile.timeline,2);assert.equal(c.game.profile.gems,10000000);assert.equal(c.game.profile.legacy.rank,1);
 assert.deepEqual([c.game.profile.age,c.game.profile.enemyAge,c.game.profile.furthestBattle,c.game.profile.coins,c.game.profile.foodLevel,c.game.profile.baseLevel],[0,0,0,0,0,0]);
 assert.deepEqual(c.game.profile.unlocked,[true,false,false]);assert.equal(c.game.profile.pendingVictory,null);assert.ok(c.game.profile.mastery.chapters.every((record:any)=>record.earnedMask===0&&record.bestSeconds===null&&record.bestGateDamage===null));
 for(const field of ['cards','wins','kills','deployed','claimed','summonCount','summonSeed','dailyDay','dailyStreak','sound','speed','motion'])assert.deepEqual(c.game.profile[field],before[field]);
 const after=JSON.stringify(c.game.profile);h.click('confirm-prestige');assert.equal(JSON.stringify(c.game.profile),after);assert.equal(c.prestigeOrigin,null);
});
for(const route of ['close','Escape','confirm-prestige'])test(`prestige ${route} yields to foreign-save recovery without stale payout`,()=>{
 const h=settledHarness(5),c=h.context;h.click('next');assert.equal(c.modal,'prestige');const before=JSON.stringify(c.game.profile);h.foreign();
 if(route==='Escape')c.api.dismissModal();else h.click(route);
 assert.equal(c.modal,'session');assert.equal(JSON.stringify(c.game.profile),before);assert.equal(c.prestigeOrigin,null);assert.equal(c.prestigeDraft,null);assert.equal(c.prestigeExpectedTimeline,null);c.api.dismissModal();assert.equal(c.modal,'session');
});
test('persist conflict after an accepted prestige keeps recovery above the in-memory reset',()=>{
 const h=settledHarness(5),c=h.context;h.click('next');
 c.session.save=()=>{c.session.status='conflict';c.sessionReady=false;c.modal='session';h.dialogs.push('session');return {ok:false,reason:'conflict'};};
 h.click('confirm-prestige');assert.equal(c.game.profile.timeline,2);assert.equal(c.modal,'session');assert.equal(c.activeTab,'battle');
});
test('stale expected timeline rejects confirmation and keeps truthful preview context',()=>{
 const h=settledHarness(5),c=h.context;h.click('next');c.prestigeExpectedTimeline=2;const before=JSON.stringify(c.game.profile);
 h.click('confirm-prestige');assert.equal(c.modal,'prestige');assert.equal(c.prestigeOrigin,'result');assert.equal(JSON.stringify(c.game.profile),before);assert.doesNotMatch(c.dialogHtml,/confirm-prestige/);
});
test('native preview radio changes only its draft and next effects, never the current battle or save',async()=>{
 const h=settledHarness(5),c=h.context;c.game.profile.legacy={rank:1,selected:'hearth'};const before=JSON.stringify(c.game.profile),state=JSON.stringify(c.game.state);
 h.click('next');await h.change('prestige-legacy','stillness');
 assert.equal(c.prestigeDraft,'stillness');assert.equal(JSON.stringify(c.game.profile),before);assert.equal(JSON.stringify(c.game.state),state);
 assert.match(c.$('prestige-preview-values').innerHTML,/Current legacy: Hearth/);assert.match(c.$('prestige-preview-values').innerHTML,/Next legacy: Stillness/);assert.match(c.$('prestige-preview-values').innerHTML,/Freeze: 8 seconds/);
 await h.change('prestige-legacy','invalid');assert.equal(c.prestigeDraft,'stillness');
 h.click('confirm-prestige');assert.equal(c.game.profile.legacy.selected,'stillness');assert.equal(c.game.state.phase,'ready');assert.equal(c.game.profile.legacy.rank,1);
});
test('ready Evolution radio dispatches real selection and preserves native nodes while refreshing current freeze and Skills',async()=>{
 const h=harness(),c=h.context,p=defaultProfile();p.legacy={rank:2,selected:'hearth'};c.game=new Game(p);c.activeTab='evolution';
 const radio={value:'stillness',checked:false},screen=c.$('secondary-screen');screen.querySelectorAll=()=>[radio];
 const badge={textContent:'',setAttribute(){}};
 const freeze={dataset:{skill:'freeze'},disabled:false,title:'',classList:{toggle(){}},querySelector(){return badge;},setAttribute(name:string,value:string){(this as any)[name]=value;}};
 c.root.querySelectorAll=(selector:string)=>selector==='[data-skill]'?[freeze]:[];
 const before=structuredClone(c.game.profile);screen.innerHTML='stable radio nodes';
 await h.change('ready-legacy','stillness');assert.equal(c.game.profile.legacy.selected,'stillness');assert.equal(c.game.state.food,6);assert.equal(c.game.profile.gems,before.gems);
 assert.equal(screen.innerHTML,'stable radio nodes');assert.equal(radio.checked,true);assert.match(c.$('legacy-current').innerHTML,/Freeze: 9 seconds/);assert.match(freeze.title,/^Freeze enemies for 9 seconds/);assert.equal((freeze as any)['aria-label'],freeze.title);assert.equal(badge.textContent,'0');
 c.activeTab='skills';c.api.renderScreen();assert.match(screen.innerHTML,/Freeze every enemy for 9 seconds/);
 c.game.dispatch({type:'start'});assert.equal(c.game.dispatch({type:'skill',skill:'freeze'}),true);c.api.update(true);assert.equal(freeze.title,'Freeze active: 9 battle seconds remain');assert.equal(badge.textContent,'9s');
 c.activeTab='evolution';const running=JSON.stringify(c.game.profile);await h.change('ready-legacy','watch');assert.equal(JSON.stringify(c.game.profile),running);
});
for(const blocked of ['ordinary','uncleared','running','terminal'])test(`actual final preview route is absent for ${blocked} state`,()=>{
 const h=harness(),c=h.context,p=defaultProfile();p.enemyAge=blocked==='ordinary'?0:5;p.furthestBattle=5;
 if(blocked==='terminal'){p.timeline=1000;p.mastery.timeline=1000;}
 if(blocked==='running')p.mastery.chapters[5].earnedMask=1;
 c.game=new Game(p);if(blocked==='running')c.game.dispatch({type:'start'});c.modal='battles';const before=JSON.stringify(c.game.profile);
 h.click('next');assert.equal(c.modal,'battles');assert.equal(c.prestigeOrigin,null);assert.equal(JSON.stringify(c.game.profile),before);
});
for(const failure of ['quota','temporary','conflict'] as const)test(`actual prestige handler with real SaveSession preserves ${failure} boundary`,async()=>{
 const h=settledHarness(5),c=h.context,old=structuredClone(c.game.profile),values=new Map([[SAVE_KEY,JSON.stringify(old)],[BACKUP_KEY,JSON.stringify(old)]]);
 let failWrites=false;const messages:string[]=[];c.toast=(message:string)=>messages.push(message);
 const session=createSaveSession({storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(failWrites)throw Error('quota');values.set(key,value);}},locks:failure==='temporary'?null:{request:async(name,_options,callback)=>callback({name})},onStatus:c.sessionPresentation});
 c.session=session;
 try{
  await session.acquire();if(failure==='temporary')session.playTemporarily();c.sessionReady=true;c.modal='result';h.click('next');assert.equal(c.modal,'prestige');
  if(failure==='quota')failWrites=true;
  if(failure==='conflict')values.set(SAVE_KEY,JSON.stringify({...old,gems:old.gems+1}));
  const bytes=[values.get(SAVE_KEY),values.get(BACKUP_KEY)];h.click('confirm-prestige');assert.deepEqual([values.get(SAVE_KEY),values.get(BACKUP_KEY)],bytes);
  if(failure==='conflict'){assert.equal(c.modal,'session');assert.equal(JSON.stringify(c.game.profile),JSON.stringify(old));assert.equal(c.prestigeOrigin,null);}
  else{assert.equal(c.game.profile.timeline,2);assert.equal(c.game.profile.gems,old.gems+100);assert.equal(c.modal,null);assert.equal(c.game.state.phase,'ready');assert.equal(c.prestigeOrigin,null);}
  if(failure==='quota'){assert.equal(c.savedWarning,true);assert.deepEqual(messages,['Progress could not be saved. Export a backup from Settings before closing this tab.']);}
  if(failure==='temporary')assert.deepEqual(messages,[]);
 }finally{session.dispose();}
});
test('normal native double-click deployment still accepts both affordable troop actions',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});
 h.clickData({unit:'0'},1);h.clickData({unit:'0'},2);
 assert.equal(c.game.state.stats.deployed,2);assert.equal(c.game.state.food,0);
});


test('actual optional-probe evolution route retains Battle 5 and seals while resetting local army progress',()=>{
 const h=harness(),c=h.context,p=defaultProfile();
 Object.assign(p,{age:4,enemyAge:4,furthestBattle:4,coins:14000000,foodLevel:5,baseLevel:3,unlocked:[true,true,true]});
 p.mastery.chapters[4]={earnedMask:3,bestSeconds:81,bestGateDamage:0};c.game=new Game(p);
 const mastery=structuredClone(c.game.profile.mastery);
 c.textIfChanged=(target:any,value:string)=>{target.textContent=value;};
 h.clickData({tab:'evolution'},1);assert.equal(c.activeTab,'evolution');
 h.click('evolve',1);assert.equal(c.modal,'evolve');h.click('confirm-evolve',1);
 assert.equal(c.modal,null);assert.equal(c.activeTab,'battle');assert.equal(c.game.state.phase,'ready');
 assert.deepEqual([c.game.profile.age,c.game.profile.enemyAge,c.game.profile.furthestBattle],[5,4,4]);
 assert.deepEqual([c.game.profile.coins,c.game.profile.foodLevel,c.game.profile.baseLevel],[0,0,0]);
 assert.deepEqual(c.game.profile.unlocked,[true,false,false]);assert.deepEqual(c.game.profile.mastery,mastery);
 assert.equal(c.$('timeline').textContent,'TIMELINE 1 · BATTLE 5');
});
test('closing a storybook opened from a settled victory returns to its result without losing the receipt',()=>{const h=settledHarness(),c=h.context,before=JSON.stringify(c.game.profile);h.click('chronicle');assert.equal(c.modal,'chronicle');c.api.dismissModal();assert.equal(c.modal,'result');assert.equal(JSON.stringify(c.game.profile),before);});
test('storybook writes yield to save ownership recovery before a route is selected',()=>{const h=harness(),c=h.context;h.click('chronicle');const before=JSON.stringify(c.game.profile);h.foreign();h.clickData({storyRoute:'escort',storyBattle:'0'});assert.equal(c.modal,'session');assert.equal(JSON.stringify(c.game.profile),before);});
test('the skills page explains the selected captain instead of advertising Food Drop',()=>{const h=harness(),c=h.context;c.game.dispatch({type:'chronicle-captain',captain:'gatekeeper'});c.activeTab='skills';c.api.renderScreen();const html=c.$('secondary-screen').innerHTML;assert.match(html,/Stand together/);assert.doesNotMatch(html,/Gain up to 10 food instantly/);});
