import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { battleSelectionHtml } from '../src/ui/progression-screen.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';
import { battleGuidance } from '../src/ui/battle-hud.ts';

test('scouting names each actual opening and its first ranged/heavy threat', async()=>{
 const {chapterScouting}=await import('../src/ui/chapter-scouting.ts');
 const first=[3,4,3,4,3,4],warning=[24,27,26,16,28,29];
 for(let chapter=0;chapter<6;chapter++){
  const view=chapterScouting(chapter);
  assert.equal(view.openingSeconds,first[chapter]);
  assert.equal(view.openingCounts[0],chapter===5?3:1);
  assert.equal(view.threatSeconds,warning[chapter]);
  assert.equal(view.threatIntent,chapter===2?'bulwark':'volley');
  assert.match(view.counter,chapter===2?/ranged/i:/melee/i);
 }
 assert.deepEqual(chapterScouting(NaN),chapterScouting(0));
 assert.deepEqual(chapterScouting(-1),chapterScouting(0));
 assert.deepEqual(chapterScouting(6),chapterScouting(0));
});
test('village voices are chapter-specific and never pretend to grant progress',async()=>{
 const {villageVoice}=await import('../src/ui/chapter-scouting.ts');
 for(const phase of ['won','lost'] as const){
  const voices=Array.from({length:6},(_,chapter)=>villageVoice(chapter,phase));
  assert.equal(new Set(voices).size,6);
  assert.ok(voices.every(v=>v.length>20&&v.length<150));
  assert.ok(voices.every(v=>!/(earned|credited|claim|coins|gems)/i.test(v)));
 }
 assert.equal(villageVoice(0,'ready'),'');assert.equal(villageVoice(0,'running'),'');
});
test('picker and result use selected opponent while an evolved army is elsewhere, without mutations',()=>{
 const p=defaultProfile();p.age=5;p.enemyAge=1;p.furthestBattle=5;p.wins=1;
 const g=new Game(p),before=JSON.stringify(g.profile);
 const picker=battleSelectionHtml(g.profile,g.state);
 assert.match(picker,/Scouting Olive Terraces/);assert.match(picker,/First wave: 1 melee in 4s/);
 assert.match(picker,/<details class="chapter-scouting">/);
 assert.match(battleGuidance(g.profile,g.state),/1 melee in 4s/);
 g.state.phase='lost';
 assert.match(resultsHtml(g.profile,g.state),/class="village-voice"/);
 assert.match(resultsHtml(g.profile,g.state),/press-house/);
 assert.equal(JSON.stringify(g.profile),before);
 g.state.phase='running';assert.doesNotMatch(battleGuidance(g.profile,g.state),/First wave:/);
});
test('first battle teaches food and automatic combat, with optional control and role notes',()=>{
 const g=new Game(defaultProfile()),before=JSON.stringify(g.profile);
 assert.match(battleGuidance(g.profile,g.state),/Tap Battle.*spend food.*fight automatically/);
 const picker=battleSelectionHtml(g.profile,g.state);
 assert.match(picker,/How a battle works/);assert.match(picker,/Food grows during battle/);
 assert.match(picker,/Each skill works once per battle/);assert.match(picker,/melee.*ranged.*heavy/i);
 assert.equal(JSON.stringify(g.profile),before);
});
test('tutorial warns that Freeze starts immediately even before enemies arrive',()=>{
 const g=new Game(defaultProfile());g.dispatch({type:'start'});
 assert.equal(g.state.units.filter(unit=>unit.side==='enemy').length,0);
 assert.equal(g.dispatch({type:'skill',skill:'freeze'}),true);
 assert.equal(g.canUseSkill('freeze'),false);
 const picker=battleSelectionHtml(g.profile,g.state);
 assert.match(picker,/Freeze starts immediately, even before enemies arrive/);
 assert.doesNotMatch(picker,/A skill with no useful target stays available/);
});
