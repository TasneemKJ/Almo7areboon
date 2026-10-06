import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {weekId} from '../src/game/weekly.ts';
import {localDay} from '../src/game/data.ts';
import {Game} from '../src/game/simulation.ts';
import {arenaLayout} from '../src/view/visual-theme.ts';
import {defaultProfile} from '../src/game/save.ts';
import {restoreBackupWithSave} from '../src/game/backup.ts';
import {startOverProfile} from '../src/game/reset.ts';
import {createBattlefieldPort} from '../src/game/battlefield-port.ts';
import type {GameEvent,Profile} from '../src/game/types.ts';
import {pauseReason} from '../src/ui/pause.ts';
import {reducedMotion,projectileForHit,traitCueForHit} from '../src/view/combat-feedback.ts';
import {createVillageMuster,rememberVillageMuster,villageMusterFrame} from '../src/view/village-muster.ts';
import {battlefieldMemoryAfterReset,battlefieldMemoryIntentForHit} from '../src/view/battlefield-memory.ts';
import {orderPresentationFrame} from '../src/view/order-presentation.ts';
import {waveArrivalForPort} from '../src/view/wave-arrival.ts';
import {villageOrderHudChanged} from '../src/view/village-life.ts';
import {lanePresentation,projectileLift} from '../src/view/lane-perspective.ts';

// Execute the production methods, Game, live adapter, and main pause/step owner.
// Phaser drawing/audio and the DOM are the only stubbed boundaries.
const field=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('battlefield.ts',field,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const names=new Set(['event','resetEffects','resize','update']);
const fields=new Set(['hitStop','hitStopCool','hitStops']);
const members:ts.Node[]=[];
function visit(node:ts.Node){
 if(ts.isMethodDeclaration(node)&&names.has(node.name.getText(ast)))members.push(node);
 if(ts.isPropertyDeclaration(node)&&fields.has(node.name.getText(ast)))members.push(node);
 ts.forEachChild(node,visit);
}
visit(ast);assert.equal(members.length,7);
const fieldCode=ts.transpileModule(`class Subject {${members.map(node=>node.getText(ast)).join('\n')}}; globalThis.Subject=Subject;`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const mainAst=ts.createSourceFile('main.ts',main,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const mainFunctions=mainAst.statements.filter(node=>ts.isFunctionDeclaration(node)&&node.name&&['playable','syncPause'].includes(node.name.text));
let step:ts.Node|undefined,mountCall:ts.CallExpression|undefined;
mainAst.forEachChild(function scan(node){if(ts.isCallExpression(node)&&node.expression.getText(mainAst)==='createBattlefieldPort')step=node.arguments[2];if(ts.isCallExpression(node)&&node.expression.getText(mainAst)==='mountBattlefield')mountCall=node;ts.forEachChild(node,scan);});
assert.equal(mainFunctions.length,2);assert.ok(step);assert.ok(mountCall);
const visibility=((mountCall!.arguments[4] as ts.ObjectLiteralExpression).properties.find(node=>ts.isPropertyAssignment(node)&&node.name.getText(mainAst)==='isVisible') as ts.PropertyAssignment).initializer;
let mountCallback:ts.Node=mountCall!;while(!ts.isArrowFunction(mountCallback))mountCallback=mountCallback.parent;
const mountCode=ts.transpileModule(`globalThis.mountReady=${mountCallback.getText(mainAst)};`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const mainCode=ts.transpileModule(`${mainFunctions.map(node=>node.getText(mainAst)).join('\n')}\nglobalThis.stepPort=${step!.getText(mainAst)};globalThis.isVisible=${visibility.getText(mainAst)};`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const heavy:GameEvent={type:'hit',target:'unit',amount:10,x:400,lane:1,side:'player',source:{id:1,age:0,kind:2,side:'player',x:350,lane:1}};
function harness(motion:Profile['motion']='system',webdriver=true){
 const calls={step:0,frame:0,presentation:0,events:[] as GameEvent[],draw:0,effects:[] as number[]};
 const app:any={weekId,localDay,guardAction:()=>true,root:{dataset:{fieldMode:'field'}},game:new Game({...defaultProfile(),motion}),entryEntered:true,sessionReady:true,pagePresent:true,lifetime:{disposed:false},session:{status:'active'},manualPaused:false,activeTab:'battle',modal:null,document:{hidden:false},pauseReason,stopCombatAudio(){},syncVillagePresentation(){}};
 runInNewContext(mainCode,app);app.game.dispatch({type:'start'});
 const port=createBattlefieldPort(()=>app.game,action=>app.game.dispatch(action),dt=>{calls.step++;app.stepPort(dt);});
 const context:any={game:port,disposed:false,motionQuery:{matches:false},navigator:{webdriver},options:{isVisible:()=>app.isVisible(),onPresentation(){calls.presentation++;}},onFrame(){calls.frame++;},onEvents(events:GameEvent[]){calls.events.push(...events);},element:{closest(){return{dataset:{phase:app.game.state.phase}};}},reducedMotion,projectileForHit,traitCueForHit,createVillageMuster,rememberVillageMuster,villageMusterFrame,battlefieldMemoryAfterReset,battlefieldMemoryIntentForHit,orderPresentationFrame,waveArrivalForPort,villageOrderHudChanged,lanePresentation,projectileLift,arenaLayout,xAt:(x:number)=>x*.45};
 runInNewContext(fieldCode,context);const scene=new context.Subject();
 const noOp=()=>{};
 Object.assign(scene,{world:{setScale:noOp},scale:{width:450,height:430},placeLandscape:noOp,placeForeground:noOp,game:{canvas:{dataset:{}}},lastState:null,aftermath:null,clock:0,reduce:false,layout:{groundY:320,laneGap:24,height:430},villageMuster:createVillageMuster(),villageHudPhase:null,villageHudPaused:null,units:new Map(),battlefieldMemory:[],bolts:[],groundFx:[],fallen:{clear:noOp},floaters:[],sparks:[],rings:[],flares:[],attackCues:[],impactCues:[],glow:{clear:noOp},yAt:(lane:number)=>320+lane*24,syncEra:noOp,drawAtmosphere(){calls.draw++;},drawBaseDamage:noOp,drawArmy:noOp,drawOrders:noOp,healthBars:noOp,effects:(dt:number)=>calls.effects.push(dt),cacheVillageViewport:noOp,impact:noOp,baseImpact:noOp,rememberImpact:noOp,emit:noOp,flare:noOp,ring:noOp,cameras:{main:{shake:noOp,flash:noOp}}});
 const frame=(delta=1000/60)=>scene.update(0,delta);
 frame(0);
 const hit=(event:GameEvent=heavy)=>{(app.game as any).events.push(event);frame(0);};
 return{app,scene,context,calls,frame,hit};
}
function near(actual:number,expected:number){assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);}

test('actual heavy-hit event freezes both simulation and presentation, with a bounded cooldown',()=>{
 const h=harness();h.hit();assert.equal(h.scene.hitStops,1);assert.equal(h.scene.game.canvas.dataset.hitStops,'1');
 const before=JSON.stringify(h.app.game.state),frames=h.calls.frame,steps=h.calls.step;
 h.frame(25);h.frame(25);assert.equal(JSON.stringify(h.app.game.state),before);assert.equal(h.calls.step,steps);assert.equal(h.calls.frame,frames);
 h.frame(25);near(h.app.game.state.time,1/60);assert.equal(h.calls.step,steps+1);
 h.hit();assert.equal(h.scene.hitStops,1,'another heavy hit inside 500ms is not admitted');
 for(let i=0;i<10;i++)h.frame(50);
 h.hit();assert.equal(h.scene.hitStops,2);
});

test('ordinary hits, base hits, zero damage and reduced motion do not start hit-stop',()=>{
 const fixtures:GameEvent[]=[{...heavy,source:{...heavy.source!,kind:0}},{...heavy,target:'base'},{...heavy,amount:0}];
 for(const event of fixtures){const h=harness();h.hit(event);assert.equal(h.scene.hitStops,0);h.frame(50);near(h.app.game.state.time,.05);}
 for(const system of [false,true]){const h=harness(system?'system':'reduced');h.context.motionQuery.matches=system;h.hit();assert.equal(h.scene.hitStops,0);h.frame(50);near(h.app.game.state.time,.05);}
 const production=harness('system',false);production.hit();assert.equal(production.scene.hitStops,1);assert.equal(production.scene.game.canvas.dataset.hitStops,undefined);
});

test('reduced motion cancels an active stop on the next frame without losing simulation time',()=>{
 for(const system of [false,true]){const h=harness();h.hit();if(system)h.context.motionQuery.matches=true;else h.app.game.profile.motion='reduced';h.frame(50);assert.equal(h.scene.hitStop,0);near(h.app.game.state.time,.05);assert.equal(h.scene.reduce,true);}
});

test('real pause owners keep simulation stopped and recover without catch-up after a hit',()=>{
 const owners=[(a:any)=>a.manualPaused=true,(a:any)=>a.entryEntered=false,(a:any)=>a.document.hidden=true,(a:any)=>a.session.status='conflict',(a:any)=>a.modal='settings'];
 for(const own of owners){const h=harness();h.hit();own(h.app);h.app.syncPause();h.frame(50);h.frame(50);near(h.app.game.state.time,0);Object.assign(h.app,{manualPaused:false,entryEntered:true,sessionReady:true,modal:null});h.app.document.hidden=false;h.app.session.status='active';h.frame(1000);near(h.app.game.state.time,.05);}
});

test('scene and motion resets clear stale hit-stop and cooldown',()=>{
 for(const reason of ['scene','motion']){const h=harness();h.hit();h.scene.resetEffects(reason);assert.equal(h.scene.hitStop,0,`${reason} reset should discard the old freeze`);assert.equal(h.scene.hitStopCool,0,`${reason} reset should discard old cooldown`);}
});

test('replacement save or ready Camp state is reconciled on the first frame after a heavy hit',()=>{
 for(const replacement of ['recovery','reset','import','camp']){
  const h=harness();h.hit();
  if(replacement==='recovery')h.app.game=new Game(defaultProfile());
  else if(replacement==='reset'||replacement==='import'){const profile=replacement==='reset'?startOverProfile(h.app.game.profile):{...defaultProfile(),coins:123};const restored=restoreBackupWithSave(h.app.game,profile,()=>true);assert.equal(restored.ok,true);h.app.game=restored.game;h.app.entryEntered=false;h.app.syncPause();}
  else{assert.equal(h.app.game.dispatch({type:'retreat'}),true);assert.equal(h.app.game.dispatch({type:'retry'}),true);}
  const current=h.app.game.state,frames=h.calls.frame;h.frame(1000/60);
  assert.equal(h.scene.lastState,current,`${replacement}: old hit-stop must not delay state replacement`);
  assert.ok(h.calls.frame>frames);assert.equal(h.scene.hitStop,0);assert.equal(h.scene.hitStopCool,0);near(current.time,0);
 }
});

test('timing characterization: a single full-motion stop changes elapsed combat time, not simulation rules',t=>{
 const full=harness(),reduced=harness('reduced');full.hit();reduced.hit();
 const fullSteps=full.calls.step,reducedSteps=reduced.calls.step;
 for(let frame=0;frame<60;frame++){full.frame();reduced.frame();}
 const skipped=(reduced.calls.step-reducedSteps)-(full.calls.step-fullSteps);
 t.diagnostic(JSON.stringify({wallFrames:60,frameMilliseconds:1000/60,fullSimulationSeconds:full.app.game.state.time,reducedSimulationSeconds:reduced.app.game.state.time,skippedSimulationFrames:skipped}));
 assert.ok(skipped>=3&&skipped<=4);near(reduced.app.game.state.time,1);near(full.app.game.state.time,1-skipped/60);
});

test('inactive owners cancel a pending stop and keep first-frame lifecycle work responsive',()=>{
 const owners=[(a:any)=>a.manualPaused=true,(a:any)=>a.entryEntered=false,(a:any)=>a.document.hidden=true,(a:any)=>a.session.status='conflict',(a:any)=>a.modal='settings'];
 for(const own of owners){const h=harness();h.hit();own(h.app);h.app.syncPause();const frames=h.calls.frame;h.frame();assert.ok(h.calls.frame>frames,'pause/Home/hidden/recovery lifecycle must still run');assert.equal(h.scene.hitStop,0);assert.equal(h.scene.hitStopCool,0);near(h.app.game.state.time,0);}
});

test('events queued during a running stop are neither lost nor consumed twice',()=>{
 const h=harness();h.hit();assert.equal(h.calls.events.filter(e=>e.type==='hit').length,1);
 assert.equal(h.app.game.dispatch({type:'spawn',kind:0}),true);const deployed=h.app.game.state.stats.deployed;
 h.frame(25);h.frame(25);assert.equal(h.calls.events.filter(e=>e.type==='spawn'&&e.side==='player').length,0);
 h.frame(25);assert.equal(h.calls.events.filter(e=>e.type==='spawn'&&e.side==='player').length,1);
 h.frame(25);assert.equal(h.calls.events.filter(e=>e.type==='spawn'&&e.side==='player').length,1);assert.equal(h.app.game.state.stats.deployed,deployed);assert.equal(h.calls.events.filter(e=>e.type==='hit').length,1);
});

test('terminal events preempt a pending stop and are delivered exactly once',()=>{
 const h=harness();h.hit();assert.equal(h.app.game.dispatch({type:'retreat'}),true);h.frame();
 assert.equal(h.scene.hitStop,0);assert.equal(h.scene.hitStopCool,0);assert.equal(h.calls.events.filter(e=>e.type==='lose').length,1);
 h.frame();assert.equal(h.calls.events.filter(e=>e.type==='lose').length,1);assert.equal(h.app.game.state.phase,'lost');near(h.app.game.state.time,0);
});

test('leaving reduced motion starts with fresh hit-stop eligibility',()=>{
 const h=harness();h.hit();h.app.game.profile.motion='reduced';h.frame();assert.equal(h.scene.hitStop,0);assert.equal(h.scene.hitStopCool,0);
 h.app.game.profile.motion='system';h.hit();assert.equal(h.scene.hitStops,2);assert.equal(h.scene.hitStop,.05);assert.equal(h.scene.hitStopCool,.5);
});

test('actual mount visibility follows Home, Camp, field, secondary and hidden owners',()=>{
 const h=harness();assert.equal(h.app.isVisible(),true);
 h.app.entryEntered=false;assert.equal(h.app.isVisible(),false);h.app.entryEntered=true;
 h.app.root.dataset.fieldMode='camp';assert.equal(h.app.isVisible(),false,'Camp CSS hides the actual battlefield');h.app.root.dataset.fieldMode='field';
 h.app.activeTab='cards';assert.equal(h.app.isVisible(),false);h.app.activeTab='battle';
 h.app.document.hidden=true;assert.equal(h.app.isVisible(),false);h.app.document.hidden=false;assert.equal(h.app.isVisible(),true);
});

test('Camp takes the invisible update path and field re-entry redraws after real resize without advancing a paused battle',()=>{
 const h=harness();h.hit();h.app.game.dispatch({type:'retreat'});h.app.game.dispatch({type:'retry'});h.app.root.dataset.fieldMode='camp';
 const draws=h.calls.draw,frames=h.calls.frame;h.frame(50);assert.equal(h.calls.draw,draws);assert.ok(h.calls.frame>frames);near(h.app.game.state.time,0);assert.equal(h.scene.hitStop,0);
 h.scene.scale={width:844,height:390};h.scene.resize();assert.deepEqual(h.scene.layout,arenaLayout(844,390));assert.equal(h.scene.hitStopCool,0);near(h.app.game.state.time,0);
 h.app.root.dataset.fieldMode='field';h.app.game.dispatch({type:'start'});h.app.manualPaused=true;h.app.syncPause();h.frame(50);assert.equal(h.calls.draw,draws+1);near(h.app.game.state.time,0);
 h.app.manualPaused=false;h.frame(50);near(h.app.game.state.time,.05);assert.equal(h.calls.draw,draws+2);
});

test('renderer mounting and readiness do not depend on Home or Camp visibility',()=>{
 for(const owner of ['home','camp']){
  const node={dataset:{renderer:'loading'}},record:{options?:{isVisible:()=>boolean};mounts:number}={mounts:0};
  const context:any={rendererClosed:false,renderer:null,$:()=>node,port:{},update(){},events(){},syncVillagePresentation(){},entryEntered:owner!=='home',root:{dataset:{fieldMode:owner==='camp'?'camp':'field'}},activeTab:'battle',document:{hidden:false},villagePresentation:{mood:{}}};
  runInNewContext(mountCode,context);
  context.mountReady({mountBattlefield(_element:unknown,_port:unknown,_frame:unknown,_events:unknown,options:{isVisible:()=>boolean}){record.mounts++;record.options=options;return{destroy(){}};}});
  assert.equal(record.mounts,1);assert.equal(node.dataset.renderer,'ready');assert.equal(record.options?.isVisible(),false);
  context.entryEntered=true;context.root.dataset.fieldMode='field';assert.equal(record.options?.isVisible(),true);assert.equal(record.mounts,1,'returning to the field reuses the renderer');
 }
});
