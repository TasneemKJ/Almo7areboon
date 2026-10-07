import {questClaimCheck,questRecords,selectedQuestRecord,questRecordAction,questRecordLabel,questRecordsHtml,questRecordDetailHtml} from '../src/ui/quest-records.ts';
import { flatStatements, mainSource } from './helpers/main-source.ts';
import {cardsScreenHtml,summonedCardsHtml} from '../src/ui/cards-screen.ts';
import {isEditingTarget} from '../src/ui/accessibility.ts';
import {campRootHtml,campFocusHtml} from '../src/ui/camp-screen.ts';
import {canOwnCamp,isCampStation,campActionFromData} from '../src/ui/camp-owner.ts';
import {preferencesHtml,saveRecoveryHtml} from '../src/ui/preferences-screen.ts';
import {entryCopy,hasPriorPlay,entrySecondary} from '../src/ui/entry-screen.ts';
import {chapterLandscape} from '../src/ui/chapter-presentation.ts';
import {journeyScreenHtml} from '../src/ui/journey-screen.ts';
import {updateOrderBanner} from '../src/ui/battle-orders.ts';
import {chronicleScreenHtml,chronicleActionFromData} from '../src/ui/chronicle-screen.ts';
import {chronicleGuidance} from '../src/game/chronicle-combat.ts';
import {CAPTAINS,routeDefinition,createChronicle} from '../src/game/chronicle.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runInApp } from './helpers/run-app.ts';
import ts from 'typescript';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { createSaveSession } from '../src/game/save-session.ts';
import { saveSessionDialogHtml, temporarySessionNotice } from '../src/ui/save-session-screen.ts';
import { advanceStatus } from '../src/game/mastery.ts';
import { battleSelectionHtml, evolutionDialogHtml } from '../src/ui/progression-screen.ts';
import { ERAS, QUESTS, foodRate, unlockCost, dailyReward, localDay } from '../src/game/data.ts';
import { battleGuidance, foodIsPiling, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel } from '../src/ui/battle-hud.ts';
import { chapterPresentation, unitPresentationName } from '../src/ui/chapter-presentation.ts';
import { compactResultsHtml, expeditionChoiceHtml, resultsHtml } from '../src/ui/results-screen.ts';
import { startCountUp } from '../src/ui/count-up.ts';
import { restoreBackupWithSave } from '../src/game/backup.ts';
import { startOverProfile } from '../src/game/reset.ts';
import { claimableWeek, syncWeekly, weekId, weeklyStatus } from '../src/game/weekly.ts';
import { syncBattleHud } from '../src/ui/hud-sync.ts';
import { storyFollowUp } from '../src/ui/story-flow.ts';
import { welcomeBackLine } from '../src/ui/welcome-back.ts';
import { earlierChapter } from '../src/ui/regroup-learning.ts';
import { isLegacyChoice, legacyEffects, prestigePreview } from '../src/game/prestige.ts';
import { legacyCurrentHtml, prestigeDetailsHtml, prestigeDialogHtml } from '../src/ui/prestige-presentation.ts';
import { evolutionScreenHtml } from '../src/ui/evolution-screen.ts';
import { skillCue } from '../src/ui/skill-cues.ts';
import { troopUnlockMessage } from '../src/ui/army-screen.ts';
import { waveInspectionHtml } from '../src/ui/wave-inspection.ts';
import { nextGoalLabel } from '../src/ui/next-goal.ts';
import { createModalTapGuard } from '../src/ui/modal-tap-guard.ts';

// Execute the app's actual functions with a clock and minimal DOM boundary; no browser/debug hooks.
const source = mainSource();
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const names = new Set(['switchTab','showModal','syncCamp','showCampFocus','returnToCamp','handleCampInput','playable', 'guardAction', 'action', 'persist', 'update', 'renderScreen', 'sessionPresentation', 'showResult', 'acquireSession', 'dismissModal', 'returnToChapters', 'clearPrestigeContext', 'openPrestige', 'refreshPrestige', 'returnFromPrestige', 'questSaveNotice', 'refreshQuestRecord', 'claimQuestRecord', 'showQuests', 'showSettings', 'showSaveRecovery', 'preferenceNotice', 'showFieldPause', 'showLeaveBattle', 'leaveBattle', 'enterCamp', 'entryReady', 'syncEntry', 'enterWorld', 'showResultDetails', 'showHome', 'continueWithProvision', 'adoptRestoredGame', 'syncWeek', 'showStoryFollowUp', 'claimQuestRecord', 'routeDataAction']);
const functions = flatStatements(ast).filter(node => ts.isFunctionDeclaration(node) && node.name && names.has(node.name.text));
assert.equal(functions.length, names.size);
const click=flatStatements(ast).find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(ast)==='lifetime.listen'&&node.expression.arguments[0]?.getText(ast)==='root'&&node.expression.arguments[1]?.getText(ast)==="'click'") as ts.ExpressionStatement;
assert.ok(click,'the real click handler must remain reachable');
const listener=(click.expression as ts.CallExpression).arguments[2];
const change=flatStatements(ast).find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(ast)==='lifetime.listen'&&node.expression.arguments[0]?.getText(ast)==='root'&&node.expression.arguments[1]?.getText(ast)==="'change'") as ts.ExpressionStatement;
assert.ok(change,'the real native radio listener must remain reachable');
const changeListener=(change.expression as ts.CallExpression).arguments[2];
const keydown=flatStatements(ast).find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(ast)==='lifetime.listen'&&node.expression.arguments[0]?.getText(ast)==='document'&&node.expression.arguments[1]?.getText(ast)==="'keydown'") as ts.ExpressionStatement;
assert.ok(keydown);const keyListener=(keydown.expression as ts.CallExpression).arguments[2];
const handlerTable = flatStatements(ast).find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === 'commandHandlers'))!;
assert.ok(handlerTable, 'the command handler table must remain reachable');
const code = ts.transpile(functions.map(node => node.getText(ast)).join('\n')+'\n'+handlerTable.getText(ast)+`\nthis.handleClick=${listener.getText(ast)};this.handleChange=${changeListener.getText(ast)};this.handleKey=${keyListener.getText(ast)};`, { target: ts.ScriptTarget.ES2022 });
function harness(motion = 'full') {
  let now = 100, foreign = false;
  const dialogs: string[] = [];
  const node = () => ({ dataset: {}, style: {}, focus() { context.document.activeElement=this; }, contains(target:any) { return !target.detached; }, hidden: false, innerHTML:'',textContent:'',classList: { toggle() {} }, setAttribute() {}, toggleAttribute() {}, querySelector() { return null; }, querySelectorAll():any[] { return []; } });
  class BoundaryButton {
    dataset:Record<string,string>;disabled=false;
    constructor(dataset:Record<string,string>){this.dataset=dataset;}
    closest(selector:string){return selector==='button'||(selector==='#modal-layer'&&!this.dataset.tab)||(selector==='#secondary-screen'&&context.activeTab!=='battle')?this:null;}
  }
  class BoundaryInput {
    type='radio';checked=true;id='';dataset:Record<string,string>={};name:string;value:string;
    constructor(name:string,value:string){this.name=name;this.value=value;}
    closest(selector:string){return selector===((this.dataset.preference||this.name==='quest-goal'||this.name==='prestige-legacy')?'#modal-layer':'#secondary-screen')?this:null;}
  }
  class BoundarySelect extends BoundaryInput { options:any[]=[];focus(){context.document.activeElement=this;} }
  const root = node(), elements = new Map<string, any>();
  const context: any = {
    HTMLElement:BoundaryButton,HTMLButtonElement:BoundaryButton,Element:BoundaryButton,HTMLInputElement:BoundaryInput,HTMLSelectElement:BoundarySelect, Game, game: new Game(defaultProfile()), sessionReady: true, retriedSession: false, pagePresent: true, lifetime: { disposed: false },
    questSelection:null,questCalendarDay:null,questClaimCheck,claimableWeek,syncBattleHud,storyFollowUp,questRecords,selectedQuestRecord,questRecordAction,questRecordLabel,questRecordsHtml,questRecordDetailHtml,lastSavedAt:0,campOwner:null,campRenderKey:'',focusFrame:0,modalVersion:0,focusBefore:null,settingsOrigin:null,acquiring: null, acquisitionVersion: 0, hasPlayed: true, entryWelcome:null,entryEntered: true, entrySaved: true, resultDetailsOpen:false, atmosphereEnabled:true,audioMix:{effects:100,atmosphere:100}, manualPaused: false, savedWarning: false, pendingImport: null, modal: null, evolutionFromResult: false, modalPointerSequence: false,prestigeOrigin:null,prestigeDraft:null,prestigeExpectedTimeline:null,
    lastUpdate: 0, lastSave: 100, lastPhase: 'ready', resultDue: 0, resultShown: '', activeTab: 'battle', root,
    window:{cancelAnimationFrame(){}},requestAnimationFrame(){return 0;},performance: { now: () => now }, document: { documentElement: { dataset: { motion } } },
    cardsScreenHtml,summonedCardsHtml,isEditingTarget,campRootHtml,campFocusHtml,canOwnCamp,isCampStation,campActionFromData,fieldControls:{update(){},clear(){},select(){}},blockModalTap:createModalTapGuard(),startCountUp,welcomeBackLine,restoreBackupWithSave,startOverProfile,syncWeekly,weekId,weeklyStatus,foodIsPiling,Date:class extends Date{static now(){return 1_800_000_000_000;}},journeyScreenHtml,updateOrderBanner,entryCopy,hasPriorPlay,entrySecondary,preferencesHtml,saveRecoveryHtml,chapterLandscape,
    $: (id: string) => { if (!elements.has(id)) {const element:any=id==='quest-goal'?new BoundarySelect('quest-goal',''):node();if(id==='battlefield')element.dataset={renderer:'ready'};elements.set(id,element);} return elements.get(id); },
    chronicleScreenHtml,chronicleActionFromData,chronicleGuidance,CAPTAINS,routeDefinition,advanceStatus, battleSelectionHtml, evolutionDialogHtml, ERAS, QUESTS, foodRate, unlockCost, dailyReward, localDay, battleGuidance, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel, chapterPresentation, unitPresentationName, compactResultsHtml, expeditionChoiceHtml, resultsHtml,isLegacyChoice,legacyEffects,prestigePreview,prestigeDetailsHtml,prestigeDialogHtml,legacyCurrentHtml,evolutionScreenHtml,saveSessionDialogHtml,temporarySessionNotice,skillCue,troopUnlockMessage,nextGoalLabel, waveInspectionHtml,
    earlierChapter,storybookArt: () => false, money: String, coin: String, icon:()=>'',textIfChanged(target:any,value:string){target.textContent=value;},htmlIfChanged(target:any,value:string){target.innerHTML=value;},unlockAudio() {}, suspendAudio() {}, saveAtmosphere() {}, syncMarks() {}, syncPause() {}, rebuildArmy() {}, syncMotion() {}, isolateModal(){}, toast() {},
    closeModal() { context.modal=null; }, showModal: (id: string,html:string,focusCommand?:string) => {context.modal=id;context.dialogHtml=html;context.focusCommand=focusCommand;dialogs.push(id);},
    session: {
      status: 'active', check: () => {if(foreign){context.session.status='conflict';context.sessionPresentation('conflict');return false;}return true;},
      save: () => { if (foreign) { context.session.status = 'conflict'; context.sessionReady = false; dialogs.push('session'); return { ok: false }; } return { ok: true }; },
      acquire: async () => ({ status: 'active', profile: defaultProfile(), loadStatus: 'loaded' }),
    },
  };

  context.game.dispatch({type:'weekly-sync',week:weekId(localDay())});
  runInApp(`${code}\nthis.api = { update, action, acquireSession, dismissModal, returnToChapters, showResult, renderScreen }; this.update = update;`, context);
  const actualShowModal=context.showModal;context.showModal=(id:string,html:string,focusCommand?:string)=>{context.dialogHtml=html;context.focusCommand=focusCommand;dialogs.push(id);actualShowModal(id,html,focusCommand);};
  function cQuestSelect(){const input=context.$('quest-goal');input.dataset.questSelect='';input.options=questRecords(context.game.profile,context.localDay()).map(r=>({value:r.key,textContent:questRecordLabel(r)}));return input;}
  return { context, dialogs, questSelect:(value:string)=>{const input=cQuestSelect();input.value=value;context.document.activeElement=input;context.handleChange({target:input});return input;}, click:(command:string,detail=0)=>context.handleClick({target:new BoundaryButton({command}),detail,preventDefault(){}}), clickData:(dataset:Record<string,string>,detail=0,extra={})=>context.handleClick({target:new BoundaryButton(dataset),detail,preventDefault(){},...extra}), change:(name:string,value:string)=>context.handleChange({target:new BoundaryInput(name,value)}),preference:(name:string,value:string|boolean)=>{const input=['speed','motion'].includes(name)?new BoundarySelect('',String(value)):new BoundaryInput('',String(value));input.dataset.preference=name;input.type=typeof value==='boolean'?'checkbox':'select-one';input.checked=value===true;context.document.activeElement=input;context.handleChange({target:input});return input;},clock: (value: number) => { now = value; }, foreign: () => { foreign = true; } };
}
test('rapid touch continuation cannot activate the navigation exposed under the result',()=>{
 const h=harness(),c=h.context;
 c.game.dispatch({type:'start'});c.game.dispatch({type:'retreat'});c.modal='result';
 const touch={pointerType:'touch',clientX:200,clientY:720};
 h.clickData({command:'retry'},1,touch);
 assert.equal(c.modal,null);assert.equal(c.game.state.phase,'ready');
 h.clock(200);h.clickData({tab:'cards'},1,touch);
 assert.equal(c.activeTab,'battle','the second same-position tap belongs to result dismissal');
 h.clock(700);h.clickData({tab:'cards'},1,touch);
 assert.equal(c.activeTab,'battle','the old hidden nav remains unavailable');
 h.clickData({campStation:'journal'});h.click('camp-journal');h.clickData({journeyTab:'cards'});assert.equal(c.activeTab,'cards','the visible Journal route works');
});
test('rapid touch deployment and a different-position follow-up remain responsive',()=>{
 const h=harness(),c=h.context,touch={pointerType:'touch',clientX:60,clientY:600};
 c.game.dispatch({type:'start'});
 h.clickData({unit:'0'},1,touch);h.clock(180);h.clickData({unit:'0'},1,touch);
 assert.equal(c.game.state.stats.deployed,2);
 c.modal='settings';h.clickData({command:'close'},1,{...touch,clientY:100});
 h.clock(220);h.clickData({tab:'cards'},1,{...touch,clientY:720});
 assert.equal(c.activeTab,'cards');
});
test('legacy touch-generated MouseEvents also protect a dismissed modal',()=>{
 const h=harness(),c=h.context;
 c.modal='settings';
 const touch={sourceCapabilities:{firesTouchEvents:true},clientX:200,clientY:720};
 h.clickData({command:'close'},1,touch);h.clock(180);
 h.clickData({tab:'cards'},1,touch);
 assert.equal(c.activeTab,'battle');
});
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
  c.game.profile.coins=ERAS[1].evolveCost;c.game.profile.enemyAge=1;c.game.profile.furthestBattle=1;h.clickData({campStation:'company'});h.click('camp-evolution');h.click('evolve');h.click('confirm-evolve');assert.equal(c.game.profile.age,2);assert.match(messages.at(-1)!,/^Entering Harbor Watch\./);
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
 // Old navigation remains hidden; a new deliberate Journal path still reaches Cards.
 h.clickData({tab:'cards'},1);assert.equal(c.activeTab,'battle');
 h.clickData({campStation:'journal'});h.click('camp-journal');h.clickData({journeyTab:'cards'});assert.equal(c.activeTab,'cards');
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

test('actual order controls respect charge and guarded session ownership',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});c.game.state.orders.charge=60;
 h.clickData({order:'advance'});assert.equal(c.game.state.orders.active,'advance');assert.equal(c.game.state.orders.charge,0);
 const paused=harness();paused.context.game.dispatch({type:'start'});paused.context.game.state.orders.charge=60;paused.context.game.dispatch({type:'pause'});paused.clickData({order:'hold'});assert.equal(paused.context.game.state.orders.active,null);
 const foreign=harness();foreign.context.game.dispatch({type:'start'});foreign.context.game.state.orders.charge=60;foreign.foreign();foreign.clickData({order:'hold'});assert.equal(foreign.context.game.state.orders.charge,60);
});
test('actual Journey open and card navigation preserve pending result rewards',()=>{
 const h=harness(),c=h.context;
 const tabFunction=flatStatements(ast).find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='switchTab')!;runInApp(ts.transpile(tabFunction.getText(ast)),c);c.renderScreen=()=>{};c.$('secondary-title').focus=()=>{};
 c.game.state.phase='won';c.game.profile.pendingVictory={settlement:'legacy',timeline:1,battle:0,earned:42,seconds:12,playerHp:100};const receipt=JSON.stringify(c.game.profile.pendingVictory);c.modal='result';c.resultShown='won';
 h.click('journey');assert.equal(c.modal,'journey');h.clickData({journeyTab:'cards'});assert.equal(c.modal,null);assert.equal(c.activeTab,'cards');assert.equal(JSON.stringify(c.game.profile.pendingVictory),receipt);h.clickData({tab:'battle'});assert.equal(c.modal,'result');assert.equal(JSON.stringify(c.game.profile.pendingVictory),receipt);
});
test('Journey return restores a settled result without reissuing its rewards',()=>{
 const h=settledHarness(),c=h.context,before=JSON.stringify(c.game.profile);
 h.click('journey');assert.equal(c.modal,'journey');h.click('journey-result');
 assert.equal(c.modal,'result');assert.equal(JSON.stringify(c.game.profile),before);
});
test('closing Quests opened from Journey restores the held result without reissuing rewards',()=>{
 const h=settledHarness(),c=h.context;
 c.game.dispatch({type:'weekly-sync',week:weekId(localDay())});
 const before=JSON.stringify(c.game.profile);
 h.click('journey');assert.equal(c.modal,'journey');h.click('quests');assert.equal(c.modal,'quests');
 c.api.dismissModal();assert.equal(c.modal,'result');assert.equal(JSON.stringify(c.game.profile),before);
});
test('closing Quests over a loss restores Regroup while ready-state Quests still closes normally',()=>{
 const loss=harness(),c=loss.context;c.game.dispatch({type:'start'});c.game.dispatch({type:'retreat'});c.resultShown='lost';c.modal='result';
 loss.click('journey');loss.click('quests');c.api.dismissModal();assert.equal(c.modal,'result');assert.match(c.dialogHtml,/Regroup/i);
 const readyState=harness();readyState.context.modal='quests';readyState.context.api.dismissModal();assert.equal(readyState.context.modal,null);
});

// Home is a presentation boundary, not an automatic start or reward claim.
test('Home holds a pending result until Continue without mutating its state',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;c.game.state.phase='won';c.resultShown='';
 const before=JSON.stringify([c.game.profile,c.game.state]);c.api.update(true);
 assert.equal(c.modal,null);assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('Play deliberately enters and starts a ready battle once',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;c.entrySaved=false;
 h.click('enter-world');assert.equal(c.entryEntered,true);assert.equal(c.game.state.phase,'running');
 const before=JSON.stringify([c.game.profile,c.game.state]);h.click('enter-world');
 assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('Home rejects an underlying troop click before entry',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;c.game.dispatch({type:'start'});
 h.clickData({unit:'0'});assert.equal(c.game.state.stats.deployed,0);
});
test('the real result route shows a compact choice, with details returning without settlement',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});c.game.dispatch({type:'retreat'});
 const before=JSON.stringify([c.game.profile,c.game.state]);c.api.showResult();
 assert.equal((c.dialogHtml.match(/<button\b/g)||[]).length,3);assert.doesNotMatch(c.dialogHtml,/battle-statistics/);
 h.click('result-details');assert.match(c.dialogHtml,/battle-statistics/);
 h.click('result-back');assert.doesNotMatch(c.dialogHtml,/battle-statistics/);
 assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('result Home retains the outcome and Continue returns to it without another payout',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});c.game.dispatch({type:'retreat'});c.api.showResult();
 const before=JSON.stringify([c.game.profile,c.game.state]);h.click('home');assert.equal(c.entryEntered,false);assert.equal(c.modal,null);
 h.click('enter-world');assert.equal(c.modal,'result');assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('Play cannot enter a world whose renderer is still loading',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;c.$('battlefield').dataset.renderer='loading';
 h.click('enter-world');assert.equal(c.entryEntered,false);assert.equal(c.game.state.phase,'ready');
});

test('Home Settings closes back to Home without starting the encounter',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;const before=JSON.stringify([c.game.profile,c.game.state]);
 h.click('settings');assert.equal(c.modal,'settings');assert.equal(c.entryEntered,false);
 h.click('close');assert.equal(c.modal,null);assert.equal(c.entryEntered,false);
 assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
function expeditionResultHarness(){
 const h=harness(),p=defaultProfile();p.chronicle!.restoration=1;p.cards.fill(100);p.foodLevel=12;p.unlocked=[true,true,true];
 const g=new Game(p);assert.equal(g.dispatch({type:'chronicle-expedition',battle:0}),true);assert.equal(g.dispatch({type:'start'}),true);
 for(let tick=0;tick<36000&&g.state.phase==='running';tick++){if(tick%15===0)g.dispatch({type:'spawn',kind:0});g.step(1/60);}
 assert.equal(g.state.phase,'won');h.context.game=g;h.context.resultShown='won';h.context.lastPhase='won';h.context.modal='result';return h;
}
for(const provision of ['supplies','shelter'])test(`explicit ${provision} expedition choice advances once through canonical actions`,()=>{
 const h=expeditionResultHarness(),c=h.context,before={coins:c.game.profile.coins,gems:c.game.profile.gems,wins:c.game.profile.wins};
 h.click('result-expedition');assert.equal(c.modal,'result-expedition');
 h.clickData({command:'continue-with-provision',provision});
 assert.equal(c.game.profile.chronicle.expedition.stage,1);assert.equal(c.game.profile.chronicle.expedition.provision,provision);
 assert.equal(c.game.state.phase,'ready');assert.equal(c.game.profile.pendingVictory,null);assert.equal(c.modal,null);
 for(const key of ['coins','gems','wins'] as const)assert.equal(c.game.profile[key],before[key]);
 const after=JSON.stringify(c.game.profile);h.clickData({command:'continue-with-provision',provision});assert.equal(JSON.stringify(c.game.profile),after);
});
test('expedition choice cancellation and foreign ownership preserve the held receipt',()=>{
 const h=expeditionResultHarness(),c=h.context,before=JSON.stringify(c.game.profile);
 h.click('result-expedition');h.click('result-back');assert.equal(c.modal,'result');assert.equal(JSON.stringify(c.game.profile),before);
 h.click('result-expedition');h.foreign();h.clickData({command:'continue-with-provision',provision:'shelter'});
 assert.equal(c.modal,'session');assert.equal(JSON.stringify(c.game.profile),before);
});
test('a failed renderer keeps a durable Home explanation and reuses the primary control for Reload',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;c.$('battlefield').dataset.renderer='failed';c.api.update(true);
 assert.equal(c.$('entry-play').textContent,'Reload');assert.equal(c.$('entry-play').dataset.command,'reload-world');
 assert.match(c.$('entry-subtitle').textContent,/could not load.*saved progress/i);
 let reloads=0;c.window={location:{reload(){reloads++;}}};const before=JSON.stringify(c.game.profile);
 h.click('reload-world');assert.equal(reloads,1);assert.equal(JSON.stringify(c.game.profile),before);assert.equal(c.entryEntered,false);
});

test('physical recruit activation pays the real food cost and rejects an unaffordable repeat',()=>{
 const h=harness(),c=h.context;assert.equal(c.game.dispatch({type:'start'}),true);c.game.state.food=3;
 const before=c.game.profile.coins;h.clickData({unit:'0',fieldRecruit:'0'});
 assert.equal(c.game.state.stats.deployed,1);assert.equal(c.game.state.food,0);assert.equal(c.game.profile.coins,before);
 h.clickData({unit:'0',fieldRecruit:'0'});assert.equal(c.game.state.stats.deployed,1);assert.equal(c.game.state.food,0);
});
test('selecting a physical enemy or supplies never casts or spends on the first tap',()=>{
 const h=harness(),c=h.context;assert.equal(c.game.dispatch({type:'start'}),true);
 const before=JSON.stringify([c.game.profile,c.game.state]);let selected='';c.fieldControls.select=(kind:string)=>{selected=kind;};
 h.clickData({fieldContext:'enemy'});assert.equal(selected,'enemy');assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
 h.clickData({fieldContext:'supplies'});assert.equal(selected,'supplies');assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('field Pause offers Resume Settings Home and holds the live encounter on Home',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});c.game.dispatch({type:'spawn',kind:0});
 const before=JSON.stringify([c.game.profile,c.game.state]);h.click('field-pause');
 assert.equal((c.dialogHtml.match(/<button\b/g)||[]).length,3);
 assert.match(c.dialogHtml,/data-command="home"/);assert.doesNotMatch(c.dialogHtml,/field-camp/);
 h.click('home');assert.equal(c.entryEntered,false);assert.equal(c.modal,null);
 assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('explicit field Resume releases a manual pause without restarting the battle',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});c.manualPaused=true;
 const before=JSON.stringify([c.game.profile,c.game.state]);h.click('field-pause');h.click('field-resume');
 assert.equal(c.manualPaused,false);assert.equal(c.modal,null);assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});

test('Preferences is seven native fields and three direct actions, with no nested catalogue',()=>{
 const h=harness(),c=h.context;h.click('settings');
 assert.equal((c.dialogHtml.match(/<button\b/g)||[]).length,3);
 assert.equal((c.dialogHtml.match(/<input\b|<select\b/g)||[]).length,7);
 for(const label of ['Sound','Atmosphere','Effects','Battle speed','Motion','Troop shapes','Save &amp; recovery','Start over','Done'])assert.match(c.dialogHtml,new RegExp(label));
 assert.doesNotMatch(c.dialogHtml,/<details|data-command="retreat"|data-command="export"|data-command="import"/);
});
test('Settings Done returns to the paused surface without clearing manual pause',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});c.manualPaused=true;
 h.click('field-pause');h.click('settings');h.click('close');
 assert.equal(c.modal,'field-pause');assert.equal(c.manualPaused,true);
});
test('ready Home Camp requires real prior play and never starts time or a wave',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;c.entrySaved=false;
 h.click('home-camp');assert.equal(c.entryEntered,false);
 c.game.dispatch({type:'start'});c.game.dispatch({type:'retreat'});c.game.dispatch({type:'retry'});
 const before=JSON.stringify([c.game.profile,c.game.state]);h.click('home-camp');
 assert.equal(c.entryEntered,true);assert.equal(c.root.dataset.fieldMode,'camp');assert.equal(c.game.state.phase,'ready');
 assert.equal(c.game.state.time,0);assert.equal(c.game.state.wave,0);assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('Home leave requires a consequence confirmation and canonical defeat before ready Camp',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});c.game.dispatch({type:'spawn',kind:0});
 h.click('field-pause');h.click('home');const before=JSON.stringify([c.game.profile,c.game.state]);
 h.click('leave-battle');assert.equal(c.modal,'leave-battle');assert.match(c.dialogHtml,/counts as a loss/i);assert.match(c.dialogHtml,/coins.*kept/i);
 assert.equal((c.dialogHtml.match(/<button\b/g)||[]).length,2);assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
 h.click('close');assert.equal(c.modal,null);assert.equal(c.entryEntered,false);assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
 h.click('leave-battle');const dispatched:string[]=[];const dispatch=c.game.dispatch.bind(c.game);c.game.dispatch=(a:any)=>{dispatched.push(a.type);return dispatch(a);};
 h.click('confirm-leave-battle');assert.deepEqual(dispatched,['retreat','retry']);assert.equal(c.root.dataset.fieldMode,'camp');assert.equal(c.entryEntered,true);assert.equal(c.game.state.phase,'ready');assert.equal(c.modal,null);
 const after=JSON.stringify([c.game.profile,c.game.state]);h.click('confirm-leave-battle');assert.equal(JSON.stringify([c.game.profile,c.game.state]),after);
});
test('held victory and expedition receipt reject Home Camp without consuming the receipt',()=>{
 for(const h of [settledHarness(),expeditionResultHarness()]){
  const c=h.context;h.click('home');const before=JSON.stringify([c.game.profile,c.game.state]);h.click('home-camp');
  assert.equal(c.entryEntered,false);assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
  c.api.update(true);assert.equal(c.$('entry-secondary').hidden,true);
  h.click('enter-world');assert.equal(c.modal,'result');assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
 }
});
test('Home leave yields to ownership recovery before or during the canonical transition',()=>{
 for(const during of [false,true]){const h=harness(),c=h.context;c.game.dispatch({type:'start'});h.click('field-pause');h.click('home');h.click('leave-battle');
  if(during)c.session.save=()=>{c.session.status='conflict';c.sessionPresentation('conflict');return {ok:false};};else h.foreign();
  h.click('confirm-leave-battle');assert.equal(c.modal,'session');assert.equal(c.entryEntered,false);assert.notEqual(c.game.state.phase,'ready');
 }
});

test('native preference fields keep their node and independent audio intent while persisting exact choices',()=>{
 const h=harness(),c=h.context;h.click('settings');const html=c.dialogHtml,mix=c.audioMix;let writes=0,suspended=0,unlocks=0;const atmosphere:boolean[]=[];
 c.session.save=()=>{writes++;return {ok:true};};c.suspendAudio=()=>suspended++;c.unlockAudio=()=>unlocks++;c.saveAtmosphere=(v:boolean)=>atmosphere.push(v);
 const sound=h.preference('sound',false);assert.equal(c.game.profile.sound,false);assert.equal(c.document.activeElement,sound);assert.equal(suspended,1);
 h.preference('atmosphere',false);assert.equal(c.atmosphereEnabled,false);assert.deepEqual(atmosphere,[false]);assert.equal(writes,1);
 h.preference('speed','2');h.preference('motion','reduced');h.preference('marks',true);
 assert.equal(c.game.profile.speed,2);assert.equal(c.game.profile.motion,'reduced');assert.equal(c.game.profile.marks,true);assert.equal(writes,4);
 h.preference('marks',false);assert.equal(c.game.profile.marks,undefined);
 h.preference('sound',true);assert.equal(unlocks,1);assert.equal(c.atmosphereEnabled,false);assert.equal(c.audioMix,mix);
 assert.equal(c.dialogHtml,html,'changing a field never replaces focused controls');assert.equal(c.modal,'settings');
});
test('native preference mutations reject invalid values, stale owner and foreign writer',()=>{
 const h=harness(),c=h.context;h.click('settings');let writes=0;c.session.save=()=>{writes++;return {ok:true};};const before=JSON.stringify(c.game.profile);
 h.preference('speed','3');h.preference('motion','spin');h.preference('unknown',true);assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);
 c.modal='save-recovery';h.preference('sound',false);assert.equal(JSON.stringify(c.game.profile),before);
 c.modal='settings';h.foreign();h.preference('sound',false);assert.equal(c.modal,'session');assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);
});
test('native preferences preserve future read-only sessions and allow temporary in-memory choices only',()=>{
 for(const status of ['unsupported','conflict','unavailable']){const h=harness(),c=h.context;c.session.status=status;c.modal='settings';const before=JSON.stringify(c.game.profile);h.preference('sound',false);assert.equal(JSON.stringify(c.game.profile),before);}
 const h=harness(),c=h.context;c.session.status='temporary';c.modal='settings';let writes=0;c.session.save=()=>{writes++;return {ok:true};};h.preference('sound',false);assert.equal(c.game.profile.sound,false);assert.equal(writes,0);
});
test('a failed preference save leaves a durable notice beside the still-focused controls',()=>{
 const h=harness(),c=h.context;h.click('settings');c.session.save=()=>({ok:false,reason:'write-failed'});
 const input=h.preference('speed','2');assert.equal(c.savedWarning,true);assert.match(c.$('preference-status').textContent,/Saving is unavailable/);assert.equal(c.document.activeElement,input);
});
test('Save Back and reset cancellation return to Preferences, then Done returns to the Pause Settings control',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});h.click('field-pause');h.click('settings');
 h.click('save-recovery');assert.equal(c.modal,'save-recovery');assert.equal((c.dialogHtml.match(/<button\b/g)||[]).length,3);
 assert.match(c.dialogHtml,/data-command="export"/);assert.match(c.dialogHtml,/data-command="import"/);h.click('close');assert.equal(c.modal,'settings');assert.equal(c.focusCommand,'save-recovery');
 h.click('reset');assert.equal(c.modal,'reset');assert.equal((c.dialogHtml.match(/<button\b/g)||[]).length,3);h.click('close');assert.equal(c.modal,'settings');assert.equal(c.focusCommand,'reset');
 h.click('close');assert.equal(c.modal,'field-pause');assert.equal(c.focusCommand,'settings');
});
test('Home exposes the correct secondary action for a held battle, ready history and pending receipts',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;c.entrySaved=false;c.api.update(true);assert.equal(c.$('entry-play').textContent,'Play');assert.equal(c.$('entry-secondary').hidden,true);
 c.game.dispatch({type:'start'});c.api.update(true);assert.equal(c.$('entry-play').textContent,'Continue');assert.equal(c.$('entry-secondary').textContent,'Leave battle…');assert.equal(c.$('entry-secondary').hidden,false);
 c.game.dispatch({type:'retreat'});c.api.update(true);assert.equal(c.$('entry-secondary').hidden,true);
 c.game.dispatch({type:'retry'});c.api.update(true);assert.equal(c.$('entry-secondary').textContent,'Camp');assert.equal(c.$('entry-secondary').hidden,false);
 c.$('battlefield').dataset.renderer='failed';c.api.update(true);assert.equal(c.$('entry-secondary').hidden,true);
});
test('Camp Home returns to a ready Continue and starting from Camp restores physical field ownership',()=>{
 const h=harness(),c=h.context;c.game.profile.deployed=1;c.entryEntered=false;h.click('home-camp');h.click('camp-home');
 assert.equal(c.entryEntered,false);assert.equal(c.game.state.phase,'ready');h.click('home-camp');h.click('camp-battle');assert.equal(c.game.state.phase,'running');assert.equal(c.root.dataset.fieldMode,'field');
});
test('Camp Home clears preparation chrome before exposing the three Home actions',()=>{
 const h=harness(),c=h.context;c.game.profile.deployed=1;c.entryEntered=false;h.click('home-camp');h.click('camp-home');
 assert.equal(c.entryEntered,false);assert.equal(c.root.dataset.fieldMode,'field','the Camp Home control must not overlay Home');
});
test('Escape from Save or reset yields to a newly foreign writer instead of replacing recovery',()=>{
 for(const owner of ['save-recovery','reset']){const h=harness(),c=h.context;h.click('settings');h.click(owner);h.foreign();c.api.dismissModal();assert.equal(c.modal,'session');}
});
test('Continue releases a held live battle without replacing troops or starting it again',()=>{
 const h=harness(),c=h.context;c.game.dispatch({type:'start'});c.game.dispatch({type:'spawn',kind:0});c.game.step(1);c.manualPaused=true;
 h.click('field-pause');h.click('home');const state=c.game.state,food=state.food;h.click('enter-world');
 assert.equal(c.game.state,state);assert.equal(c.game.state.food,food);assert.equal(c.manualPaused,false);assert.equal(c.entryEntered,true);assert.equal(c.modal,null);
});
test('Start over confirmation focuses Keep my progress instead of a destructive action',()=>{
 const h=harness(),c=h.context;h.click('settings');h.click('reset');assert.equal(c.focusCommand,'close');
});

function readyCamp(){const h=harness(),c=h.context;c.entryEntered=false;c.game.profile.played=true;h.click('home-camp');return h;}
test('physical Camp owns ready entry and read-only local visits without old preparation input',()=>{
 const h=readyCamp(),c=h.context,before=JSON.stringify([c.game.profile,c.game.state]);let writes=0;c.session.save=()=>{writes++;return {ok:true};};
 assert.equal(c.campOwner?.kind,'root');assert.equal(c.$('camp-view').hidden,false);assert.equal(c.$('battle-view').inert,true);
 for(const station of ['storehouse','gate','company','journal']){h.clickData({campStation:station});assert.equal(c.modal,'camp-focus');assert.equal(c.campOwner.focus,station);c.api.dismissModal();assert.equal(c.modal,null);assert.equal(c.campOwner.kind,'root');}
 for(const data of [{command:'start'},{command:'upgrade-food'},{unit:'0'},{unit:'1'},{skill:'food'},{order:'hold'},{tab:'cards'}] as Record<string,string>[])h.clickData(data);
 assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);assert.equal(writes,0);assert.equal(c.activeTab,'battle');
});
test('Camp deliberate Battle starts once and transfers ownership to the physical field',()=>{
 const h=readyCamp(),c=h.context;let starts=0;const dispatch=c.game.dispatch.bind(c.game);c.game.dispatch=(a:any)=>{if(a.type==='start')starts++;return dispatch(a);};
 h.click('camp-battle');h.click('camp-battle');assert.equal(starts,1);assert.equal(c.game.state.phase,'running');assert.equal(c.root.dataset.fieldMode,'field');assert.equal(c.campOwner,null);assert.equal(c.game.profile.played,true);
});
test('Camp local purchase commits once, refreshes canonical cost and rejects stale or wrong focus input',()=>{
 const h=readyCamp(),c=h.context;c.game.profile.coins=50;h.clickData({campStation:'storehouse'});h.clickData({campAction:'base'});assert.equal(c.game.profile.coins,50);
 h.clickData({campAction:'food'});assert.equal(c.game.profile.foodLevel,1);assert.equal(c.game.profile.coins,0);assert.equal(c.modal,'camp-focus');assert.match(c.dialogHtml,/71 coins/);assert.equal(c.focusCommand,'camp-back');
 h.clickData({campAction:'food'});assert.equal(c.game.profile.foodLevel,1);assert.equal(c.game.state.phase,'ready');assert.equal(c.game.state.time,0);
});
test('Camp company recruit inspection unlocks without deploying and Back retains its company origin',()=>{
 const h=readyCamp(),c=h.context;c.game.profile.coins=150;h.clickData({campStation:'company'});h.clickData({campRecruit:'1'});
 assert.equal(c.campOwner.focus.recruit,1);h.clickData({campAction:'unlock'});assert.equal(c.game.profile.unlocked[1],true);assert.equal(c.game.state.stats.deployed,0);
 h.click('camp-back');assert.equal(c.campOwner.focus,'company');h.click('camp-back');assert.equal(c.campOwner.kind,'root');
});
test('Camp advanced handoffs preserve chapter, journal, storybook and evolution access with explicit origins',()=>{
 for(const [station,command,modal,tab] of [['journal','camp-chapters','battles','battle'],['journal','camp-journal','journey','battle'],['company','camp-storybook','chronicle','battle'],['company','camp-evolution',null,'evolution']] as const){
  const h=readyCamp(),c=h.context,before=JSON.stringify(c.game.profile);h.clickData({campStation:station});h.click(command);assert.equal(c.campOwner.kind,'advanced');assert.equal(c.modal,modal);assert.equal(c.activeTab,tab);
  if(modal)c.api.dismissModal();else h.click('camp-return');assert.equal(c.campOwner.kind,'root');assert.equal(c.activeTab,'battle');assert.equal(JSON.stringify(c.game.profile),before);
 }
});
test('Camp yields to conflict before a purchase and during persistence without stale repaint',()=>{
 for(const duringSave of [false,true]){
  const h=readyCamp(),c=h.context;c.game.profile.coins=50;h.clickData({campStation:'storehouse'});
  if(duringSave)c.session.save=()=>{c.session.status='conflict';c.sessionPresentation('conflict');return {ok:false};};else h.foreign();
  h.clickData({campAction:'food'});assert.equal(c.modal,'session');assert.equal(c.campOwner,null);assert.equal(c.game.profile.foodLevel,duringSave?1:0);assert.equal(c.game.profile.coins,duringSave?0:50);
 }
});
test('Temporary Camp actions never write and held results cannot borrow Camp ownership',()=>{
 const h=readyCamp(),c=h.context;c.session.status='temporary';let writes=0;c.session.save=()=>{writes++;return {ok:true};};c.game.profile.coins=40;
 h.clickData({campStation:'gate'});h.clickData({campAction:'base'});h.click('camp-back');h.click('camp-home');assert.equal(writes,0);assert.equal(c.entryEntered,false);assert.equal(c.campOwner,null);
 for(const phase of ['running','won','lost'] as const){const blocked=harness(),b=blocked.context;b.entryEntered=false;b.game.profile.played=true;b.game.state.phase=phase;const before=JSON.stringify([b.game.profile,b.game.state]);blocked.click('home-camp');assert.notEqual(b.campOwner?.kind,'root');assert.equal(JSON.stringify([b.game.profile,b.game.state]),before);}
});

test('real readiness handoff admits deliberate chapter choice after loss recovery',()=>{
 const h=harness(),c=h.context;Object.assign(c.game.profile,{age:4,enemyAge:5,furthestBattle:5,chronicle:createChronicle(1,5)});c.game.dispatch({type:'start'});c.game.dispatch({type:'retreat'});c.modal='result';
 h.click('regroup-chapters');assert.equal(c.game.state.phase,'ready');assert.equal(c.campOwner?.kind,'advanced');assert.equal(c.modal,'battles');
 h.clickData({battle:'4'});assert.equal(c.game.profile.enemyAge,4);assert.equal(c.modal,null);assert.equal(c.game.state.phase,'ready');
});
test('Escape from actual advanced Evolution returns to ready Camp without mutation',()=>{
 const h=readyCamp(),c=h.context;h.clickData({campStation:'company'});h.click('camp-evolution');const before=JSON.stringify([c.game.profile,c.game.state]);
 c.handleKey({key:'Escape',preventDefault(){}});assert.equal(c.activeTab,'battle');assert.equal(c.campOwner.kind,'root');assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('nonbutton Space and combat shortcuts cannot start or act in Camp',()=>{
 const h=readyCamp(),c=h.context,before=JSON.stringify([c.game.profile,c.game.state]);
 for(const [key,code] of [[' ','Space'],['1','Digit1'],['q','KeyQ']])c.handleKey({key,code,target:null,preventDefault(){}});
 assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
test('Camp save failure keeps a persistent warning outside the focused transaction',()=>{
 const h=readyCamp(),c=h.context;c.game.profile.coins=50;c.session.save=()=>({ok:false,reason:'write-failed'});h.clickData({campStation:'storehouse'});h.clickData({campAction:'food'});
 assert.equal(c.$('session-notice').hidden,false);assert.match(c.$('session-notice').textContent,/Saving is unavailable/);assert.match(c.dialogHtml,/Saving is unavailable/);h.click('camp-back');assert.equal(c.$('session-notice').hidden,false);
});
test('final receipt chapter-return owner admits a chapter choice and Escape without another payout',()=>{
 const h=settledHarness(5,1000,false),c=h.context;h.click('return-chapters');assert.equal(c.campOwner.kind,'advanced');const wallet=[c.game.profile.coins,c.game.profile.gems,c.game.profile.wins];
 h.clickData({battle:'4'});assert.equal(c.game.profile.enemyAge,4);assert.equal(c.game.state.phase,'ready');assert.deepEqual([c.game.profile.coins,c.game.profile.gems,c.game.profile.wins],wallet);
 c.api.update(true);h.clickData({campStation:'journal'});h.click('camp-chapters');c.handleKey({key:'Escape',preventDefault(){}});assert.equal(c.modal,null);assert.equal(c.campOwner.kind,'root');
});
test('Camp expedition abandon reopens the real Storybook owner without trapping its controls',()=>{
 const h=readyCamp(),c=h.context;c.game.profile.chronicle=createChronicle(1,0);c.game.profile.chronicle.restoration=7;
 assert.equal(c.game.dispatch({type:'chronicle-expedition',battle:0}),true);h.clickData({campStation:'company'});h.click('camp-storybook');h.click('story-abandon');
 assert.equal(c.game.profile.chronicle.expedition,null);assert.equal(c.modal,'chronicle');assert.equal(c.campOwner.kind,'advanced');h.click('close');assert.equal(c.modal,null);assert.equal(c.campOwner.kind,'root');assert.equal(c.game.state.phase,'ready');
});
test('Escape from Cards reached through the real Journal returns to ready Camp',()=>{
 const h=readyCamp(),c=h.context;h.clickData({campStation:'journal'});h.click('camp-journal');h.clickData({journeyTab:'cards'});assert.equal(c.activeTab,'cards');const before=JSON.stringify(c.game.profile);
 c.handleKey({key:'Escape',preventDefault(){}});assert.equal(c.activeTab,'battle');assert.equal(c.campOwner.kind,'root');assert.equal(c.modal,null);assert.equal(JSON.stringify(c.game.profile),before);
});

test('a Camp focus keeps one stable polite warning node even before any save failure',()=>{
 const h=readyCamp(),c=h.context;h.clickData({campStation:'storehouse'});
 assert.match(c.dialogHtml,/id="camp-focus-save-status"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);
});
test('periodic failure and verified recovery update the open Camp focus without rebuilding or moving its controls',()=>{
 const h=readyCamp(),c=h.context;h.clickData({campStation:'storehouse'});const html=c.$('modal-layer').innerHTML,dialogs=h.dialogs.length,warning=c.$('camp-focus-save-status'),focused={id:'camp-local-food'};c.document.activeElement=focused;c.$('modal-layer').scrollTop=137;
 c.session.save=()=>({ok:false,reason:'write-failed'});h.clock(6000);c.api.update(true);h.clock(6200);c.api.update(true);
 assert.equal(warning.hidden,false);assert.match(warning.textContent,/Saving is unavailable/);assert.equal(c.$('modal-layer').innerHTML,html);assert.equal(h.dialogs.length,dialogs);assert.equal(c.document.activeElement,focused);assert.equal(c.$('modal-layer').scrollTop,137);
 c.session.save=()=>({ok:true});h.clock(12000);c.api.update(true);h.clock(12200);c.api.update(true);
 assert.equal(warning.hidden,true);assert.equal(warning.textContent,'');assert.equal(c.document.activeElement,focused);assert.equal(c.$('modal-layer').scrollTop,137);assert.equal(h.dialogs.length,dialogs);
});
test('background persistence failure reaches the existing focused warning on the next update',()=>{
 const h=readyCamp(),c=h.context;h.clickData({campStation:'gate'});c.session.save=()=>({ok:false,reason:'write-failed'});assert.equal(c.persist(),false);c.api.update(true);
 assert.equal(c.modal,'camp-focus');assert.equal(c.$('camp-focus-save-status').hidden,false);assert.match(c.$('camp-focus-save-status').textContent,/Saving is unavailable/);
});
test('save conflict preempts an open Camp warning without repainting the obsolete focus',()=>{
 const h=readyCamp(),c=h.context;h.clickData({campStation:'storehouse'});c.session.save=()=>{c.session.status='conflict';c.sessionPresentation('conflict');return{ok:false,reason:'conflict'};};c.persist();c.api.update(true);
 assert.equal(c.modal,'session');assert.equal(c.campOwner,null);assert.doesNotMatch(c.$('modal-layer').innerHTML,/camp-focus-save-status/);
});

test('returning Home keeps its welcome in the subtitle without a toast or starting play',async()=>{
 const h=harness(),c=h.context,p=defaultProfile(),messages:string[]=[];
 p.wins=5;p.lastSeen=c.Date.now()-3*86_400_000;
 c.entryEntered=false;c.entryWelcome=null;c.hasPlayed=false;c.toast=(s:string)=>messages.push(s);
 c.session.acquire=async()=>({status:'active',profile:p,loadStatus:'loaded'});
 await c.api.acquireSession();c.syncEntry();
 assert.equal(c.$('entry-subtitle').textContent,'Welcome back. The village kept the lamps lit for 3 days.');
 assert.deepEqual(messages,[]);assert.equal(c.entryEntered,false);assert.equal(c.game.state.phase,'ready');assert.equal(c.game.state.time,0);
 c.$('battlefield').dataset.renderer='failed';c.syncEntry();assert.match(c.$('entry-subtitle').textContent,/could not load/);
 c.$('battlefield').dataset.renderer='ready';c.syncEntry();assert.match(c.$('entry-subtitle').textContent,/Welcome back/);
 c.enterWorld();assert.equal(c.entryWelcome,null);
 c.modal='field-pause';c.showHome();assert.equal(c.$('entry-subtitle').textContent,entryCopy(c.game.profile,true).subtitle);
});
for(const status of ['recovered','corrupt'])test(`returning Home does not replace the ${status} recovery notice`,async()=>{
 const h=harness(),c=h.context,p=defaultProfile(),messages:string[]=[];
 p.wins=5;p.lastSeen=c.Date.now()-3*86_400_000;
 c.entryEntered=false;c.entryWelcome='stale welcome';c.hasPlayed=false;c.toast=(s:string)=>messages.push(s);
 c.session.acquire=async()=>({status:'active',profile:p,loadStatus:status});await c.api.acquireSession();c.syncEntry();
 assert.equal(c.entryWelcome,null);assert.equal(messages.length,1);assert.match(messages[0],status==='recovered'?/Recovered your progress/:/could not be recovered/);
 assert.equal(c.$('entry-subtitle').textContent,entryCopy(c.game.profile,true).subtitle);
});
test('entering Camp consumes Home welcome context without starting a battle',()=>{
 const h=harness(),c=h.context;c.game.profile.played=true;c.entryEntered=false;c.entryWelcome='Welcome back';c.enterCamp();
 assert.equal(c.entryWelcome,null);assert.equal(c.game.state.phase,'ready');assert.equal(c.game.state.time,0);
});

test('persist rounds lastSeen on saved copies without mutating live progress',()=>{
 const h=harness(),c=h.context,saved:any[]=[];let wall=1_800_000_059_998;
 c.Date=class extends Date{static now(){return wall;}};
 c.session.save=(profile:any)=>{saved.push(profile);return{ok:true};};
 const before=JSON.stringify(c.game.profile);
 assert.equal(c.persist(),true);wall++;assert.equal(c.persist(),true);
 assert.equal(saved[0].lastSeen,1_800_000_000_000);assert.equal(saved[1].lastSeen,saved[0].lastSeen);
 wall++;assert.equal(c.persist(),true);assert.equal(saved[2].lastSeen,1_800_000_060_000);
 assert.equal(JSON.stringify(c.game.profile),before);assert.notEqual(saved[0],c.game.profile);
 c.session.status='temporary';assert.equal(c.persist(),false);assert.equal(saved.length,3);
});

test('weekly claim repaint yields to the real session conflict discovered by its writer',()=>{
 const h=harness(),c=h.context,week=weekId(localDay());
 c.game.dispatch({type:'weekly-sync',week});c.game.profile.mastery.chapters[0].earnedMask=7;c.modal='quests';
 c.session.save=()=>{c.session.status='conflict';c.sessionPresentation('conflict');return {ok:false};};
 h.clickData({weekly:String(week)});
 assert.equal(c.modal,'session','Quests must not replace the required recovery dialog');
});
test('weekly Quests opening cannot sync or replace an unowned session',()=>{
 const h=harness(),c=h.context,before=JSON.stringify(c.game.profile);h.foreign();
 c.showQuests();assert.equal(c.modal,'session');assert.equal(JSON.stringify(c.game.profile),before);
});
for(const owner of ['import','reset'])test(`actual ${owner} transaction initializes the weekly baseline before the replacement is written`,()=>{
 const h=harness(),c=h.context,week=weekId(localDay()),candidate=defaultProfile();
 candidate.mastery.chapters[0].earnedMask=7;c.pendingImport=candidate;c.modal=owner;
 c.game.profile.weekly={week,baseSeals:8,claimed:true};
 const before=c.game;let saved:any;c.session.save=(p:any)=>{saved=JSON.parse(JSON.stringify(p));return {ok:true};};
 h.click(`confirm-${owner}`);assert.notEqual(c.game,before);
 assert.equal(saved.weekly.week,week);assert.equal(saved.weekly.baseSeals,owner==='reset'?0:3);
 assert.equal(saved.weekly.claimed,owner==='reset'?true:undefined);assert.deepEqual(c.game.profile.weekly,saved.weekly);
 assert.equal(c.entryEntered,false);assert.equal(c.game.state.phase,'ready');assert.equal(c.modal,null);
});
for(const owner of ['import','reset'])test(`a rejected ${owner} save leaves the original weekly claim and profile untouched`,()=>{
 const h=harness(),c=h.context,week=weekId(localDay());c.pendingImport=defaultProfile();c.modal=owner;c.game.profile.weekly={week,baseSeals:8,claimed:true};
 const game=c.game,before=JSON.stringify(c.game.profile);c.session.save=()=>({ok:false});h.click(`confirm-${owner}`);
 assert.equal(c.game,game);assert.equal(JSON.stringify(c.game.profile),before);assert.equal(c.modal,owner);
});

for(const earned of [0,3])test(`a pre-Monday weekly claim token with ${earned} seals rejects without profile, reward, save or modal mutation`,()=>{
 const h=harness(),c=h.context,monday=19996,previous=weekId(monday);let day=monday+6;c.localDay=()=>day;c.game=new Game();
 c.game.dispatch({type:'weekly-sync',week:previous});c.game.profile.mastery.chapters[0].earnedMask=earned===3?7:0;c.modal='quests';
 const before=JSON.stringify(c.game.profile);let writes=0;c.session.save=()=>{writes++;return {ok:true};};c.game.drainEvents();
 day=monday+7;h.clickData({weekly:String(previous)});
 assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);assert.equal(c.modal,'quests');assert.deepEqual(c.game.drainEvents(),[]);
 c.showQuests();assert.equal(c.game.profile.weekly.week,previous+1,'deliberate reopening still establishes the legitimate new week');assert.equal(c.game.profile.weekly.baseSeals,earned);
});
test('actual Quests rollback and stale claim preserve a newer claim through returning calendar and further earning',()=>{
 const h=harness(),c=h.context,monday=19996,current=weekId(monday+7);let day=monday+7;c.localDay=()=>day;c.game=new Game();
 c.game.dispatch({type:'weekly-sync',week:current});c.game.profile.mastery.chapters[0].earnedMask=7;c.modal='quests';h.clickData({weekly:String(current)});
 const before=JSON.stringify(c.game.profile);assert.equal(c.game.profile.gems,160);assert.equal(c.game.profile.weekly.claimed,true);
 day=monday+6;c.showQuests();assert.equal(JSON.stringify(c.game.profile),before,'earlier calendar must retain claim');
 h.clickData({weekly:String(current-1)});assert.equal(JSON.stringify(c.game.profile),before,'older token is rejected without mutation');
 day=monday+7;c.showQuests();c.game.profile.mastery.chapters[1].earnedMask=7;h.clickData({weekly:String(current)});
 assert.equal(c.game.profile.gems,160);assert.equal(c.game.profile.weekly.claimed,true);
});
for(const token of ['fractional','nan','future','old'])test(`actual weekly click rejects ${token} token with no mutation even when its retained record is ready`,()=>{
 const h=harness(),c=h.context,current=2858;c.localDay=()=>20003;c.game=new Game();
 const requested=token==='fractional'?current+.5:token==='nan'?Number.NaN:token==='future'?current+1:current-1;
 c.game.profile.weekly={week:Number.isInteger(requested)?requested:current,baseSeals:0};c.game.profile.mastery.chapters[0].earnedMask=7;c.modal='quests';c.game.drainEvents();
 const before=JSON.stringify(c.game.profile);let writes=0;c.session.save=()=>{writes++;return {ok:true};};h.clickData({weekly:String(requested)});
 assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);assert.deepEqual(c.game.drainEvents(),[]);
});
test('accepted weekly claim remains claimed after failed persistence and repeated clicks cannot award twice',()=>{
 const h=harness(),c=h.context,current=2858;c.localDay=()=>20003;c.game=new Game();c.game.dispatch({type:'weekly-sync',week:current});c.game.profile.mastery.chapters[0].earnedMask=7;c.modal='quests';
 let writes=0;c.session.save=()=>{writes++;return {ok:false,reason:'write-failed'};};h.clickData({weekly:String(current)});
 assert.equal(c.game.profile.gems,160);assert.equal(c.game.profile.weekly.claimed,true);assert.equal(writes,1);assert.equal(c.savedWarning,true);
 const before=JSON.stringify(c.game.profile);h.clickData({weekly:String(current)});assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,1);
});
for(const owner of ['import','reset'])test(`${owner} after calendar rollback retains a newer claimed week transactionally`,()=>{
 const h=harness(),c=h.context;c.localDay=()=>20002;c.game=new Game();c.game.profile.weekly={week:2858,baseSeals:0,claimed:true};
 c.pendingImport=defaultProfile();c.pendingImport.weekly={week:2858,baseSeals:0,claimed:true};c.modal=owner;let saved:any;c.session.save=(p:any)=>{saved=JSON.parse(JSON.stringify(p));return {ok:true};};
 h.click(`confirm-${owner}`);assert.deepEqual(saved.weekly,{week:2858,baseSeals:0,claimed:true});assert.deepEqual(c.game.profile.weekly,saved.weekly);
});
test('one accepted weekly claim preserves a held victory receipt and cannot settle it again',()=>{
 const h=settledHarness(),c=h.context,current=2858;c.localDay=()=>20003;c.game.profile.weekly={week:current,baseSeals:0};c.game.profile.mastery.chapters[0].earnedMask=7;c.modal='quests';
 const receipt=JSON.stringify(c.game.profile.pendingVictory),gems=c.game.profile.gems,coins=c.game.profile.coins;h.clickData({weekly:String(current)});
 assert.equal(c.game.profile.gems,gems+60);assert.equal(c.game.profile.coins,coins);assert.equal(JSON.stringify(c.game.profile.pendingVictory),receipt);assert.equal(c.game.state.phase,'won');
 h.clickData({weekly:String(current)});assert.equal(c.game.profile.gems,gems+60);assert.equal(JSON.stringify(c.game.profile.pendingVictory),receipt);
});

function questClaimToken(c:any){return {command:'quest-claim',questKey:c.questSelection,questDay:String(c.localDay()),questVersion:String(c.modalVersion)};}
test('quest records replace the dense leaf with one native selector and exactly Claim and Back, including shared chrome',()=>{
 const h=harness(),c=h.context;let writes=0;c.session.save=()=>{writes++;return {ok:true};};const before=JSON.stringify(c.game.profile);h.click('quests');
 assert.equal(c.modal,'quests');assert.equal(c.questSelection,'daily');assert.equal((c.dialogHtml.match(/<button\b/g)||[]).length,2);assert.match(c.dialogHtml,/<select/);assert.doesNotMatch(c.$('modal-layer').innerHTML,/close-button/);
 assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);
});
test('native quest selection preserves its node and focus through repeated read-only changes',()=>{
 const h=harness(),c=h.context;h.click('quests');let writes=0;c.session.save=()=>{writes++;return {ok:true};};const before=JSON.stringify(c.game.profile),version=c.modalVersion,count=h.dialogs.length;
 const input=h.questSelect('annihilator');for(let i=0;i<3;i++)h.questSelect('annihilator');
 assert.equal(c.questSelection,'annihilator');assert.equal(c.$('quest-goal'),input);assert.equal(c.document.activeElement,input);assert.equal(c.modalVersion,version);assert.equal(h.dialogs.length,count);
 assert.match(c.$('quest-record-detail').innerHTML,/2,500/);assert.match(c.$('quest-record-detail').innerHTML,/400 gems/);assert.match(c.$('quest-record-detail').innerHTML,/disabled/);
 assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);
});
for(const key of ['daily','weekly','first-blood'])test(`selected ${key} uses real Game admission, keeps identity and focuses the field after one claim`,()=>{
 const h=harness(),c=h.context;c.game.profile.kills=10;c.game.profile.mastery.chapters[0].earnedMask=7;h.click('quests');h.questSelect(key);const gems=c.game.profile.gems,token=questClaimToken(c);let writes=0;c.session.save=()=>{writes++;return {ok:true};};
 const reward=selectedQuestRecord(questRecords(c.game.profile,c.localDay()),key).reward;
 h.clickData(token);assert.equal(c.game.profile.gems,gems+reward);assert.equal(c.questSelection,key);assert.equal(c.document.activeElement,c.$('quest-goal'));assert.match(c.$('quest-record-detail').innerHTML,/Already claimed/);
 h.clickData(token);assert.equal(c.game.profile.gems,gems+reward);assert.equal(writes,1);
});
test('claim revalidates live progress, selected identity, modal version and day without giving a stale reward',()=>{
 for(const reason of ['progress','selection','version','day','detached']){const h=harness(),c=h.context;c.game.profile.kills=10;h.click('quests');h.questSelect(reason==='day'?'daily':'first-blood');const token=questClaimToken(c);
 if(reason==='progress')c.game.profile.kills=9;if(reason==='selection')h.questSelect('commander');if(reason==='version')token.questVersion=String(c.modalVersion-1);if(reason==='day'){const day=c.localDay();c.localDay=()=>day+1;}
 const before=JSON.stringify(c.game.profile);let writes=0;c.session.save=()=>{writes++;return {ok:true};};
 if(reason==='detached'){const oldContains=c.$('modal-layer').contains;c.$('modal-layer').contains=()=>false;h.clickData(token);c.$('modal-layer').contains=oldContains;}else h.clickData(token);
 assert.equal(JSON.stringify(c.game.profile),before,reason);assert.equal(writes,0,reason);}
});
test('new record claim rejects a stale weekly day token across Monday without synchronizing the profile',()=>{
 const h=harness(),c=h.context;let day=20002;c.localDay=()=>day;c.game=new Game();c.game.dispatch({type:'weekly-sync',week:weekId(day)});c.game.profile.mastery.chapters[0].earnedMask=7;h.click('quests');h.questSelect('weekly');const token=questClaimToken(c),before=JSON.stringify(c.game.profile);day++;
 h.clickData(token);assert.equal(JSON.stringify(c.game.profile),before);assert.match(c.$('quest-record-detail').innerHTML,/0 <span>\/ 3/);
});
test('quota failure keeps the chosen claimed record and persistent warning; temporary claim never writes',()=>{
 for(const temporary of [false,true]){const h=harness(),c=h.context;h.click('quests');if(temporary)c.session.status='temporary';let writes=0;c.session.save=()=>{writes++;return {ok:false,reason:'write-failed'};};const gems=c.game.profile.gems,token=questClaimToken(c);
 h.clickData(token);assert.equal(c.game.profile.gems,gems+30);assert.equal(c.questSelection,'daily');assert.equal(writes,temporary?0:1);assert.equal(c.$('quest-save-status').hidden,false);assert.match(c.$('quest-save-status').textContent,temporary?/not be saved|not saved|temporary/i:/Saving is unavailable/);
 h.clickData(token);assert.equal(c.game.profile.gems,gems+30);}
});
test('record claim and native selection yield to recovery before or during persistence',()=>{
 for(const stage of ['select','before','save']){const h=harness(),c=h.context;h.click('quests');const token=questClaimToken(c),before=JSON.stringify(c.game.profile);
 if(stage==='save')c.session.save=()=>{c.session.status='conflict';c.sessionPresentation('conflict');return {ok:false};};else h.foreign();
 if(stage==='select')h.questSelect('first-blood');else h.clickData(token);
 assert.equal(c.modal,'session');assert.match(c.dialogHtml,/Progress|progress|tab/);if(stage!=='save')assert.equal(JSON.stringify(c.game.profile),before);}
});
test('records retain a held result and manual pause through claim and Back without settling its receipt',()=>{
 const h=settledHarness(),c=h.context;c.manualPaused=true;const receipt=JSON.stringify(c.game.profile.pendingVictory),coins=c.game.profile.coins;
 h.click('journey');h.click('quests');h.clickData(questClaimToken(c));h.click('close');
 assert.equal(c.modal,'result');assert.equal(c.game.state.phase,'won');assert.equal(c.manualPaused,true);assert.equal(JSON.stringify(c.game.profile.pendingVictory),receipt);assert.equal(c.game.profile.coins,coins);
});
test('records Back returns to the genuine Camp station and stays in ready preparation',()=>{
 const h=harness(),c=h.context;c.root.dataset.fieldMode='camp';c.campOwner={kind:'root'};h.clickData({campStation:'journal'});h.click('camp-journal');let selector='';c.root.querySelector=(value:string)=>{selector=value;return {focus(){}};};h.click('quests');h.questSelect('commander');h.click('close');
 assert.equal(c.modal,null);assert.equal(c.campOwner.kind,'root');assert.equal(c.game.state.phase,'ready');assert.equal(selector,'[data-camp-station="journal"]');
});
test('later saving failure and recovery reach the stable record warning without replacing the native picker',()=>{
 const h=harness(),c=h.context;h.click('quests');const input=h.questSelect('annihilator'),version=c.modalVersion;
 c.session.save=()=>({ok:false,reason:'write-failed'});c.persist();c.update(true);
 assert.equal(c.$('quest-save-status').hidden,false);assert.match(c.$('quest-save-status').textContent,/Saving is unavailable/);assert.equal(c.modalVersion,version);assert.equal(c.document.activeElement,input);
 c.session.save=()=>({ok:true});c.persist();c.update(true);assert.equal(c.$('quest-save-status').hidden,true);assert.equal(c.document.activeElement,input);
});

test('returning Home preserves a visible Camp to journal to Journey path without a Quests detour',()=>{
 const h=harness(),c=h.context;c.entryEntered=false;c.entrySaved=true;c.game.profile.played=true;c.update(true);
 assert.equal(c.$('entry-secondary').hidden,false);assert.equal(c.$('entry-secondary').dataset.command,'home-camp');h.click('home-camp');
 assert.match(c.$('camp-view').innerHTML,/data-camp-station="journal"/);h.clickData({campStation:'journal'});
 assert.match(c.dialogHtml,/data-command="camp-journal"[^>]*>Company journal/);h.click('camp-journal');assert.equal(c.modal,'journey');
 assert.match(c.dialogHtml,/Your journey/);h.click('quests');assert.equal(c.modal,'quests');h.click('close');assert.equal(c.campOwner.kind,'root');assert.equal(c.game.state.phase,'ready');
});
test('held-result Home Continue exposes Details and Journey, and Quests Back retains the real receipt',()=>{
 const h=settledHarness(),c=h.context,receipt=JSON.stringify(c.game.profile.pendingVictory);c.entryEntered=false;c.modal=null;c.manualPaused=true;
 h.click('enter-world');assert.equal(c.modal,'result');assert.match(c.dialogHtml,/data-command="result-details"/);h.click('result-details');
 assert.match(c.dialogHtml,/data-command="journey"/);h.click('journey');assert.equal(c.modal,'journey');h.click('quests');h.click('close');
 assert.equal(c.modal,'result');assert.equal(JSON.stringify(c.game.profile.pendingVictory),receipt);assert.equal(c.game.state.phase,'won');
});
for(const key of ['daily','weekly'])test(`open ${key} record refreshes after midnight without saving, changing selection or replacing the field`,()=>{
 const h=harness(),c=h.context;let day=20002;c.localDay=()=>day;c.game=new Game();c.game.profile.dailyDay=day;c.game.profile.dailyStreak=2;c.game.dispatch({type:'weekly-sync',week:weekId(day)});c.game.profile.mastery.chapters[0].earnedMask=7;
 h.click('quests');const input=h.questSelect(key),before=JSON.stringify(c.game.profile),version=c.modalVersion;let writes=0;c.session.save=()=>{writes++;return {ok:true};};day++;c.update(true);
 assert.equal(c.questSelection,key);assert.equal(c.$('quest-goal'),input);assert.equal(c.document.activeElement,input);assert.equal(c.modalVersion,version);
 const html=c.$('quest-record-detail').innerHTML;if(key==='daily'){assert.match(html,/Day 3 reward is ready/);assert.doesNotMatch(html,/disabled/);}else{assert.match(html,/0 <span>\/ 3/);assert.match(html,/3 more mastery seals/);assert.match(html,/disabled/);}
 assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);
 if(key==='daily'){h.clickData(questClaimToken(c));assert.equal(c.game.profile.dailyDay,day);assert.equal(c.game.profile.gems,150);}
});
test('Monday refresh moves focus from an expired ready Claim to the existing Goal field',()=>{
 const h=harness(),c=h.context;let day=20002;c.localDay=()=>day;c.game=new Game();c.game.dispatch({type:'weekly-sync',week:weekId(day)});c.game.profile.mastery.chapters[0].earnedMask=7;
 h.click('quests');const input=h.questSelect('weekly');c.document.activeElement=new c.HTMLButtonElement({command:'quest-claim'});day++;c.update(true);
 assert.equal(c.document.activeElement,input);assert.match(c.$('quest-record-detail').innerHTML,/disabled/);assert.equal(c.questSelection,'weekly');
});
test('day-change refresh yields to session recovery without refreshing the obsolete selector',()=>{
 const h=harness(),c=h.context;let day=20002;c.localDay=()=>day;h.click('quests');h.questSelect('daily');const before=JSON.stringify(c.game.profile),details=c.$('quest-record-detail').innerHTML;day++;h.foreign();c.update(true);
 assert.equal(c.modal,'session');assert.equal(c.$('quest-record-detail').innerHTML,details);assert.equal(JSON.stringify(c.game.profile),before);
});
for(const invalid of [Number.NaN,Infinity,20002.5])test(`invalid clock ${String(invalid)} refresh is bounded and cannot claim or synchronize`,()=>{
 const h=harness(),c=h.context;let day=20002;c.localDay=()=>day;h.click('quests');h.questSelect('daily');const before=JSON.stringify(c.game.profile);let writes=0,refreshes=0;c.session.save=()=>{writes++;return {ok:true};};
 const refresh=c.refreshQuestRecord;c.refreshQuestRecord=(...args:any[])=>{refreshes++;return refresh(...args);};day=invalid;c.update(true);c.update(true);c.update(true);
 assert.equal(refreshes,1,'an unchanged invalid clock cannot cause per-frame refresh');assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);
 h.clickData(questClaimToken(c));assert.equal(JSON.stringify(c.game.profile),before);assert.equal(writes,0);
});
test('calendar return to a retained future claimed week never clears it or shows a ready weekly reward',()=>{
 const h=harness(),c=h.context;let day=20002;c.localDay=()=>day;c.game=new Game();c.game.profile.weekly={week:2858,baseSeals:0,claimed:true};c.game.profile.mastery.chapters[0].earnedMask=7;
 h.click('quests');h.questSelect('weekly');const before=JSON.stringify(c.game.profile);day++;c.update(true);
 assert.equal(JSON.stringify(c.game.profile),before);assert.match(c.$('quest-record-detail').innerHTML,/Already claimed this week/);assert.match(c.$('quest-record-detail').innerHTML,/disabled/);
 h.clickData(questClaimToken(c));assert.equal(JSON.stringify(c.game.profile),before);
});
test('midnight refresh preserves a late saving warning and synchronous recovery wins over repaint',()=>{
 const h=harness(),c=h.context;let day=20002;c.localDay=()=>day;h.click('quests');const input=h.questSelect('daily');c.savedWarning=true;day++;c.update(true);
 assert.match(c.$('quest-save-status').textContent,/Saving is unavailable/);assert.equal(c.document.activeElement,input);
 const detail=c.$('quest-record-detail').innerHTML;day++;c.session.check=()=>{c.session.status='conflict';c.sessionPresentation('conflict');return false;};c.update(true);
 assert.equal(c.modal,'session');assert.equal(c.$('quest-record-detail').innerHTML,detail);assert.match(c.dialogHtml,/Progress|progress|tab/);
});
test('a deliberate quest Claim focus return allows native reveal after the record has scrolled',()=>{
 const h=harness(),c=h.context;h.click('quests');const input=h.questSelect('daily'),calls:any[]=[];
 input.focus=(options:any)=>{calls.push(options);c.document.activeElement=input;};h.clickData(questClaimToken(c));
 assert.equal(c.game.profile.gems,130);assert.equal(c.document.activeElement,input);assert.equal(calls.length,1);assert.notEqual(calls[0]?.preventScroll,true,'deliberate return must let the browser reveal Goal');
 calls.length=0;h.questSelect('weekly');assert.equal(calls.length,0,'read-only native selection must not move focus or scroll');
});
test('an expired focused Claim falls back to Goal with native reveal allowed',()=>{
 const h=harness(),c=h.context;let day=20002;c.localDay=()=>day;c.game=new Game();c.game.dispatch({type:'weekly-sync',week:weekId(day)});c.game.profile.mastery.chapters[0].earnedMask=7;h.click('quests');const input=h.questSelect('weekly'),calls:any[]=[];
 input.focus=(options:any)=>{calls.push(options);c.document.activeElement=input;};c.document.activeElement=new c.HTMLButtonElement({command:'quest-claim'});day++;c.update(true);
 assert.equal(c.document.activeElement,input);assert.equal(calls.length,1);assert.notEqual(calls[0]?.preventScroll,true);
});
test('late quest saving warnings keep the current picker focus without an explicit reveal',()=>{
 const h=harness(),c=h.context;h.click('quests');const input=h.questSelect('annihilator');let focusCalls=0;
 input.focus=()=>{focusCalls++;c.document.activeElement=input;};c.session.save=()=>({ok:false,reason:'write-failed'});c.persist();c.update(true);
 assert.equal(focusCalls,0);assert.equal(c.document.activeElement,input);assert.match(c.$('quest-save-status').textContent,/Saving is unavailable/);
});
