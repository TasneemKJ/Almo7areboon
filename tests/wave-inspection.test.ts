import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { encounterForAge } from '../src/game/encounters.ts';
import { waveInspectionHtml } from '../src/ui/wave-inspection.ts';

test('six real opponent schedules expose the actual next composition and battle-clock arrival',()=>{
 for(let age=0;age<6;age++){
  const p=defaultProfile();p.enemyAge=age;p.baseLevel=100;const g=new Game(p);g.dispatch({type:'start'});
  const wave=encounterForAge(age).waves[0],status=g.waveStatus(),before=JSON.stringify([p,g.state,status]);
  const html=waveInspectionHtml(status);
  assert.match(html,/Wave 1 of/);assert.ok(html.includes(`${Math.ceil(wave.time)} battle seconds`));assert.match(html,/staggered group/);
  for(const kind of [0,1,2]){const count=wave.members.filter(m=>m.kind===kind).length;if(count)assert.ok(html.includes(`${count} ${['melee','ranged','heavy'][kind]}`));}
  assert.equal(JSON.stringify([p,g.state,status]),before);
 }
});
test('actual forthcoming volley and bulwark teach existing counters rather than guaranteed wins',()=>{
 for(const [age,intent,copy] of [[0,'bulwark','Ranged troops deal extra damage to heavy enemies'],[1,'volley','Melee guards take less damage from ranged enemies']] as const){
  const p=defaultProfile();p.enemyAge=age;p.baseLevel=100;const g=new Game(p);g.dispatch({type:'start'});
  for(let n=0;n<3000&&g.state.phase==='running'&&g.waveStatus().preview?.intent!==intent;n++)g.step(1/60);
  assert.equal(g.waveStatus().preview?.intent,intent);assert.ok(waveInspectionHtml(g.waveStatus()).includes(copy));
 }
});
test('final incoming members, living survivors and clearance remain distinct',()=>{
 const common={spawned:5,total:5,nextIn:null,preview:null};
 const pending=waveInspectionHtml({...common,enemiesRemaining:2,pendingEnemies:1,cleared:false});assert.match(pending,/1 enemy still incoming/);assert.match(pending,/2 living enemies/);assert.doesNotMatch(pending,/All waves have arrived/);
 const survivors=waveInspectionHtml({...common,enemiesRemaining:2,pendingEnemies:0,cleared:false});assert.match(survivors,/All waves have arrived/);assert.match(survivors,/2 living enemies/);assert.doesNotMatch(survivors,/No living enemies remain/);
 const cleared=waveInspectionHtml({...common,enemiesRemaining:0,pendingEnemies:0,cleared:true});assert.match(cleared,/No living enemies remain/);assert.match(cleared,/enemy base/);assert.doesNotMatch(cleared,/victory|coins|gems/i);
});
test('actual staggered members are explained even while another future wave is previewed',()=>{
 const p=defaultProfile();p.age=5;p.enemyAge=5;p.baseLevel=100;const g=new Game(p);g.dispatch({type:'start'});
 for(let n=0;n<1000&&g.state.time<.1+encounterForAge(5).waves[0].time;n++)g.step(1/60);
 const status=g.waveStatus();assert.equal(status.pendingEnemies,2);assert.equal(status.preview?.number,2);
 assert.match(waveInspectionHtml(status),/2 members are still incoming from an earlier wave/);
 for(let n=0;n<4000&&g.state.time<60.1;n++)g.step(1/60);
 assert.equal(g.state.phase,'running');assert.equal(g.waveStatus().preview,null);assert.equal(g.waveStatus().pendingEnemies,1);assert.match(waveInspectionHtml(g.waveStatus()),/1 enemy still incoming/);
});
