import test from 'node:test';
import assert from 'node:assert/strict';
import { villageMoment, villageVoice } from '../src/ui/chapter-scouting.ts';
import { battleStats } from '../src/game/statistics.ts';
import { defaultProfile, decodeSave } from '../src/game/save.ts';
import { Game } from '../src/game/simulation.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';

test('village moments use three-target thresholds and deterministic tactical priority',()=>{
 const s=battleStats();assert.equal(villageMoment(s),'ordinary');
 s.maxFreezeTargets=2;s.meteorKills=2;s.deployedByKind=[1,0,1];assert.equal(villageMoment(s),'ordinary');
 s.deployedByKind=[1,1,1];assert.equal(villageMoment(s),'company');
 s.meteorKills=3;assert.equal(villageMoment(s),'meteor');s.maxFreezeTargets=3;assert.equal(villageMoment(s),'freeze');
 assert.equal(villageMoment(undefined),'ordinary');
});
test('every village has short distinct tactical dialogue without invented grants or progress',()=>{
 for(const moment of ['freeze','meteor','company'] as const){
  const s=battleStats();if(moment==='freeze')s.maxFreezeTargets=3;if(moment==='meteor')s.meteorKills=3;if(moment==='company')s.deployedByKind=[1,1,1];
  const before=JSON.stringify(s),lines=Array.from({length:6},(_,chapter)=>villageVoice(chapter,'lost',s));
  assert.equal(new Set(lines).size,6);assert.ok(lines.every(line=>line.length>20&&line.length<150));
  assert.ok(lines.every(line=>!/(credited|earned|claim|coins|gems)/i.test(line)));
  for(let chapter=0;chapter<6;chapter++)assert.notEqual(lines[chapter],villageVoice(chapter,'lost'));
  assert.equal(JSON.stringify(s),before);
 }
 assert.equal(villageVoice(0,'running',battleStats()),'');
});
test('real gathered-enemy Freeze then Retreat receives the opponent reaction without presentation writes',()=>{
 const p=defaultProfile();p.age=5;p.enemyAge=1;p.furthestBattle=5;
 const g=new Game(p);g.dispatch({type:'start'});
 for(let i=0;i<12000&&g.state.units.filter(u=>u.side==='enemy'&&u.hp>0).length<3&&g.state.phase==='running';i++)g.step(1/60);
 assert.equal(g.dispatch({type:'skill',skill:'freeze'}),true);assert.ok(g.state.stats.maxFreezeTargets>=3);
 assert.equal(g.dispatch({type:'retreat'}),true);
 const before=JSON.stringify([g.profile,g.state]),html=resultsHtml(g.profile,g.state);
 assert.match(html,/data-village-moment="freeze"/);assert.match(html,/press-house/);
 assert.equal(JSON.stringify([g.profile,g.state]),before);
});
test('legacy receipt without trusted attempt statistics keeps the ordinary outcome voice',()=>{
 const raw={...defaultProfile(),version:2,pendingVictory:{timeline:1,battle:0,earned:123,seconds:40,playerHp:100}};
 const g=new Game(decodeSave(JSON.stringify(raw)).profile!);
 g.state.stats.maxFreezeTargets=3;
 const html=resultsHtml(g.profile,g.state);assert.match(html,/data-village-moment="ordinary"/);
 assert.ok(html.includes(villageVoice(0,'won')));
});
