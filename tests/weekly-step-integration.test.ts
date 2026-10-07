import test from 'node:test';import assert from 'node:assert/strict';import { runInApp } from './helpers/run-app.ts';
import ts from 'typescript';
import { mainSource } from './helpers/main-source.ts';
import {Game} from '../src/game/simulation.ts';import {weekId,weeklyStatus} from '../src/game/weekly.ts';import {localDay} from '../src/game/data.ts';
const main=mainSource(),ast=ts.createSourceFile('main.ts',main,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
let step:ts.Node|undefined;ast.forEachChild(function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(ast)==='createBattlefieldPort')step=node.arguments[2];ts.forEachChild(node,visit);});assert.ok(step);
const events=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='events')!;
const code=ts.transpileModule(`this.step=${step.getText(ast)};${events.getText(ast)};this.events=events;`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
for(const origin of ['new-week','import-without-week','reset'])test(`actual pre-simulation owner counts the first new seals after ${origin}`,()=>{
 const game=new Game(),week=weekId(localDay());if(origin==='new-week')game.profile.weekly={week:week-1,baseSeals:0};if(origin==='reset')game.profile.weekly={week,baseSeals:8};
 game.dispatch({type:'start'});game.state.enemyHp=0;
 const context:any={game,weekId,localDay,document:{hidden:false},manualPaused:false,activeTab:'battle',modal:null,syncPause(){},playable:()=>true,guardAction:()=>true,playCombatEvents(){},persist(){}};
 runInApp(code,context);context.step(1/60);assert.equal(game.state.phase,'won');context.events(game.drainEvents());
 assert.equal(weeklyStatus(game.profile,week).progress,3,'the first win belongs to the current week, not its baseline');
});
for(const owner of ['paused','home','unowned'])test(`weekly pre-step baseline cannot advance a ${owner} battle`,()=>{
 const game=new Game(),week=weekId(localDay());game.dispatch({type:'start'});game.profile.weekly={week:week-1,baseSeals:0};
 const context:any={game,weekId,localDay,document:{hidden:false},manualPaused:false,activeTab:'battle',modal:null,syncPause(){if(owner!=='unowned')game.state.paused=true;},playable:()=>true,guardAction:()=>owner!=='unowned',playCombatEvents(){},persist(){}};
 const before=JSON.stringify(game.profile);runInApp(code,context);context.step(1/60);
 assert.equal(game.state.time,0);assert.equal(JSON.stringify(game.profile),before);
});
test('win events cannot synchronize weekly progress after save ownership is lost',()=>{
 const game=new Game(),week=weekId(localDay());game.profile.weekly={week:week-1,baseSeals:0};
 const context:any={game,weekId,localDay,document:{hidden:false},manualPaused:false,activeTab:'battle',modal:null,syncPause(){},playable:()=>false,guardAction:()=>false,playCombatEvents(){},persist(){}};
 const before=JSON.stringify(game.profile);runInApp(code,context);context.events([{type:'win'}]);assert.equal(JSON.stringify(game.profile),before);
});

test('retained future week does not repeat guarded storage checks during active rollback frames',()=>{
 const game=new Game(),current=2858;game.dispatch({type:'start'});game.state.time=1;game.profile.weekly={week:current+1,baseSeals:0,claimed:true};
 let checks=0,syncs=0;const dispatch=game.dispatch.bind(game);game.dispatch=(action)=>{if(action.type==='weekly-sync')syncs++;return dispatch(action);};
 const context:any={game,weekId,localDay:()=>20003,syncPause(){},playable:()=>true,guardAction(){checks++;return true;}};runInApp(code,context);
 for(let frame=0;frame<60;frame++)context.step(1/60);
 assert.equal(checks,0,'an earlier calendar does not require another storage ownership check each frame');assert.equal(syncs,0);
 assert.deepEqual(game.profile.weekly,{week:current+1,baseSeals:0,claimed:true});assert.ok(game.state.time>1,'normal combat still progresses');
});
for(const boundary of ['first-frame','reset','missing','forward'])test(`${boundary} pre-step boundary establishes its baseline exactly once before awarding seals`,()=>{
 const game=new Game(),current=2858;game.dispatch({type:'start'});
 if(boundary==='first-frame')game.profile.weekly={week:current,baseSeals:0};
 if(boundary==='reset')game.profile.weekly={week:current,baseSeals:8};
 if(boundary==='forward'){game.state.time=1;game.profile.weekly={week:current-1,baseSeals:0};}
 if(boundary==='missing')game.state.time=1;
 let checks=0;const context:any={game,weekId,localDay:()=>20003,syncPause(){},playable:()=>true,guardAction(){checks++;return true;},document:{hidden:false},manualPaused:false,activeTab:'battle',modal:null,playCombatEvents(){},persist(){}};runInApp(code,context);
 context.step(1/60);assert.equal(checks,1);assert.deepEqual(game.profile.weekly,{week:current,baseSeals:0});
 context.step(1/60);assert.equal(checks,1,'matching established week does not check again');
 game.state.enemyHp=0;context.step(1/60);assert.equal(checks,1);context.events(game.drainEvents());assert.equal(weeklyStatus(game.profile,current).progress,3);
});

test('actual win owner counts settled seals if Monday begins between pre-step and event drain',()=>{
 const game=new Game(),monday=20000-((20000+3)%7);let day=monday-1;
 game.dispatch({type:'start'});game.state.enemyHp=0;
 const context:any={game,weekId,localDay:()=>day,document:{hidden:false},manualPaused:false,activeTab:'battle',modal:null,syncPause(){},playable:()=>true,guardAction:()=>true,playCombatEvents(){},persist(){}};
 runInApp(code,context);context.step(1/60);assert.equal(game.state.phase,'won');day=monday;context.events(game.drainEvents());
 assert.equal(weeklyStatus(game.profile,weekId(day)).progress,3);assert.equal(game.profile.weekly!.baseSeals,0);
});
test('accepted start opens the current baseline, rejected start does not mutate weekly state',()=>{
 const declaration=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='action')!;
 const actionCode=ts.transpileModule(`${declaration.getText(ast)};this.invoke=action;`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const game=new Game(),current=weekId(localDay()),context:any={game,weekId,localDay,guardAction:()=>true,unlockAudio(){},persist(){},syncPause(){},rebuildArmy(){},update(){},activeTab:'battle'};
 runInApp(actionCode,context);assert.equal(context.invoke({type:'start'}),true);assert.equal(game.profile.weekly!.week,current);
 delete game.profile.weekly;const before=JSON.stringify(game.profile);assert.equal(context.invoke({type:'start'}),false);assert.equal(JSON.stringify(game.profile),before);
});
