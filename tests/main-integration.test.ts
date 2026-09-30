import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave } from '../src/game/save.ts';
import { advanceStatus } from '../src/game/mastery.ts';
import { battleSelectionHtml, evolutionDialogHtml } from '../src/ui/progression-screen.ts';
import { ERAS, QUESTS, foodRate, unlockCost, dailyReward, localDay } from '../src/game/data.ts';
import { battleGuidance, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel } from '../src/ui/battle-hud.ts';
import { chapterPresentation } from '../src/ui/chapter-presentation.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';

// Execute the app's actual functions with a clock and minimal DOM boundary; no browser/debug hooks.
const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const names = new Set(['playable', 'guardAction', 'action', 'update', 'showResult', 'acquireSession', 'dismissModal', 'returnToChapters']);
const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.name && names.has(node.name.text));
assert.equal(functions.length, names.size);
const click=ast.statements.find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(ast)==='lifetime.listen'&&node.expression.arguments[0]?.getText(ast)==='root'&&node.expression.arguments[1]?.getText(ast)==="'click'") as ts.ExpressionStatement;
assert.ok(click,'the real click handler must remain reachable');
const listener=(click.expression as ts.CallExpression).arguments[2];
const code = ts.transpile(functions.map(node => node.getText(ast)).join('\n')+`\nthis.handleClick=${listener.getText(ast)};`, { target: ts.ScriptTarget.ES2022 });
function harness(motion = 'full') {
  let now = 100, foreign = false;
  const dialogs: string[] = [];
  const node = () => ({ dataset: {}, style: {}, hidden: false, classList: { toggle() {} }, setAttribute() {}, toggleAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; } });
  class BoundaryButton {
    dataset:Record<string,string>;disabled=false;
    constructor(dataset:Record<string,string>){this.dataset=dataset;}
    closest(selector:string){return selector==='button'||selector==='#modal-layer'?this:null;}
  }
  const root = node(), elements = new Map<string, ReturnType<typeof node>>();
  const context: any = {
    Element:BoundaryButton, Game, game: new Game(defaultProfile()), sessionReady: true, pagePresent: true, lifetime: { disposed: false },
    acquiring: null, acquisitionVersion: 0, hasPlayed: true, manualPaused: false, savedWarning: false, pendingImport: null, modal: null, evolutionFromResult: false, modalPointerSequence: false,
    lastUpdate: 0, lastSave: 100, lastPhase: 'ready', resultDue: 0, resultShown: '', activeTab: 'battle', root,
    performance: { now: () => now }, document: { documentElement: { dataset: { motion } } },
    $: (id: string) => { if (!elements.has(id)) elements.set(id, node()); return elements.get(id); },
    advanceStatus, battleSelectionHtml, evolutionDialogHtml, ERAS, QUESTS, foodRate, unlockCost, dailyReward, localDay, battleGuidance, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel, chapterPresentation, resultsHtml,
    storybookArt: () => false, money: String, coin: String, textIfChanged() {}, htmlIfChanged() {}, unlockAudio() {}, syncPause() {}, rebuildArmy() {}, syncMotion() {}, renderScreen() {}, toast() {},
    closeModal() { context.modal=null; }, showModal: (id: string) => {context.modal=id;dialogs.push(id);},
    session: {
      status: 'active', check: () => {if(foreign){context.session.status='conflict';context.sessionReady=false;context.modal='session';dialogs.push('session');return false;}return true;},
      save: () => { if (foreign) { context.session.status = 'conflict'; context.sessionReady = false; dialogs.push('session'); return { ok: false }; } return { ok: true }; },
      acquire: async () => ({ status: 'active', profile: defaultProfile(), loadStatus: 'loaded' }),
    },
  };
  context.persist = () => context.session.save(context.game.profile).ok;
  context.switchTab = (tab:string) => {context.activeTab=tab;context.update(true);};
  runInNewContext(`${code}\nthis.api = { update, action, acquireSession, dismissModal, returnToChapters, showResult }; this.update = update;`, context);
  return { context, dialogs, click:(command:string,detail=0)=>context.handleClick({target:new BoundaryButton({command}),detail,preventDefault(){}}), clickData:(dataset:Record<string,string>,detail=0)=>context.handleClick({target:new BoundaryButton(dataset),detail,preventDefault(){}}), clock: (value: number) => { now = value; }, foreign: () => { foreign = true; } };
}
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
function realVictory(chapter=1,timeline=1) {
 const p=defaultProfile();p.enemyAge=chapter;p.furthestBattle=5;p.timeline=timeline;p.mastery.timeline=timeline;
 p.age=0;p.coins=ERAS[0].evolveCost;p.foodLevel=12;p.unlocked=[true,true,true];p.cards=p.cards.map(()=>100);
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
for(const legacy of [false,true])for(const escape of [false,true])test(`actual terminal ${legacy?'legacy':'settled'} ${escape?'Escape':'Return'} dispatches ready then picker without payout`,()=>{
 const h=settledHarness(5,1000,legacy),c=h.context,before=structuredClone(c.game.profile);
 if(escape)c.api.dismissModal();else h.click('return-chapters');
 assert.equal(c.game.state.phase,'ready');assert.equal(c.modal,'battles');assert.equal(c.game.profile.pendingVictory,null);
 for(const field of ['timeline','mastery','wins','coins','gems','furthestBattle'])assert.deepEqual(c.game.profile[field],before[field]);
 c.api.dismissModal();assert.equal(c.modal,null);c.api.update(true);assert.equal(c.modal,null);
});

for(const chapter of [0,5])test(`native double-click continuation from chapter ${chapter} cannot select revealed Cards navigation`,()=>{
 const h=settledHarness(chapter,1,chapter===5),c=h.context;
 h.click('next',1);assert.equal(c.game.state.phase,'ready');assert.equal(c.modal,null);assert.equal(c.activeTab,'battle');
 const after=JSON.stringify(c.game.profile);
 // A second pointer click at the removed modal's coordinates retargets the exposed nav.
 h.clickData({tab:'cards'},2);assert.equal(c.activeTab,'battle');assert.equal(JSON.stringify(c.game.profile),after);
 h.clickData({tab:'cards'},3);assert.equal(c.activeTab,'battle');
 // A subsequent intentional single click is a new native sequence and still works.
 h.clickData({tab:'cards'},1);assert.equal(c.activeTab,'cards');
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
