import test from 'node:test';
import { flatStatements, mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { ERAS } from '../src/game/data.ts';
import { unitPresentationName } from '../src/ui/chapter-presentation.ts';
import { TROOP_SPECIALTIES, troopUnlockMessage } from '../src/ui/army-screen.ts';
import type { DeploymentStatus, UnitKind } from '../src/game/types.ts';
import { runInApp } from './helpers/run-app.ts';
import ts from 'typescript';

test('all six armies teach their actual troop name, specialty and food cost without mutation',()=>{
 for(let age=0;age<6;age++)for(const kind of [0,1,2] as const){
  const p=defaultProfile();p.age=age;p.unlocked=[true,true,true];const g=new Game(p),before=JSON.stringify([p,g.state]);
  const message=troopUnlockMessage(p,g.state.phase,kind,g.deploymentStatus(kind));
  assert.ok(message.startsWith(`${unitPresentationName(age,kind)} unlocked!`));assert.ok(message.includes(TROOP_SPECIALTIES[kind].effect));assert.ok(message.includes(`Start Battle, then deploy: ${ERAS[age].units[kind].cost} food.`));assert.ok(message.length<=160);
  assert.equal(JSON.stringify([p,g.state]),before);
 }
});
test('actual running, food-short and paused deployment statuses produce truthful next steps',()=>{
 const p=defaultProfile();p.coins=1000;const g=new Game(p);assert.equal(g.dispatch({type:'unlock',kind:1}),true);assert.equal(g.dispatch({type:'start'}),true);
 const message=(kind:UnitKind)=>troopUnlockMessage(p,g.state.phase,kind,g.deploymentStatus(kind));
 assert.match(message(1),/Tap it again to deploy: 5 food/);
 assert.equal(g.dispatch({type:'spawn',kind:0}),true);assert.match(message(1),/Needs 5 food; wait 3s/);
 assert.equal(g.dispatch({type:'pause'}),true);assert.match(message(1),/Resume Battle, then deploy: 5 food/);
 assert.equal(g.dispatch({type:'retreat'}),true);assert.match(message(1),/Prepare another battle, then deploy: 5 food/);
});
test('crowding and army capacity never promise immediate deployment',()=>{
 const p=defaultProfile();p.unlocked[1]=true;
 for(const reason of ['blocked','capacity'] as const){const status:DeploymentStatus={allowed:false,reason,missingFood:0,waitSeconds:0};const message=troopUnlockMessage(p,'running',1,status);assert.match(message,reason==='blocked'?/area full; wait for space/:/Army full; wait for a place/);assert.match(message,/Costs 5 food/);assert.doesNotMatch(message,/Tap it again/);}
});
test('actual toast keeps its normal timeout and allows the longer teaching timeout',()=>{
 const source=mainSource(),ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 const fn=flatStatements(ast).find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='toast');assert.ok(fn);
 let visible=false;const delays:number[]=[],cleared:number[]=[],callbacks:Function[]=[];
 const node={textContent:'',classList:{add:()=>visible=true,remove:()=>visible=false}};
 const c:any={toastTimer:42,$:()=>node,textIfChanged:(target:any,value:string)=>target.textContent=value,window:{clearTimeout:(id:number)=>cleared.push(id),setTimeout:(fn:Function,delay:number)=>{callbacks.push(fn);delays.push(delay);return delays.length;}}};
 runInApp(ts.transpileModule(fn.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,c);
 c.toast('ordinary');assert.equal(node.textContent,'ordinary');assert.equal(visible,true);assert.deepEqual(delays,[4200]);
 c.toast('teaching',7000);assert.equal(node.textContent,'teaching');assert.deepEqual(delays,[4200,7000]);assert.deepEqual(cleared,[42,1]);callbacks[1]();assert.equal(visible,false);
});
