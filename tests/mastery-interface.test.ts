import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave } from '../src/game/save.ts';
import { ERAS, unlockCost } from '../src/game/data.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';
import { battleSelectionHtml, evolutionDialogHtml } from '../src/ui/progression-screen.ts';
import { evolutionScreenHtml } from '../src/ui/evolution-screen.ts';
import { battleGuidance } from '../src/ui/battle-hud.ts';

const presentation=()=>import('../src/ui/mastery-presentation.ts');
function victory(chapter=0,capped=false) {
 const p=defaultProfile();p.age=5;p.enemyAge=chapter;p.furthestBattle=5;p.foodLevel=12;p.unlocked=[true,true,true];
 if(capped){p.coins=1e9-3;p.gems=1e7-12;}
 const g=new Game(p);assert.equal(g.dispatch({type:'start'}),true);
 let cycle=0;
 for(let tick=0;tick<36000&&g.state.phase==='running';tick+=6){
  if(g.state.time>=8)g.dispatch({type:'skill',skill:'food'});
  const enemies=g.state.units.filter(u=>u.side==='enemy'&&u.hp>0);
  if(chapter!==2&&enemies.length>=3){g.dispatch({type:'skill',skill:'freeze'});g.dispatch({type:'skill',skill:'meteor'});}
  if((chapter===3||chapter===4)?g.state.skillsUsed.includes('freeze'):chapter===5||g.state.time>=10){if(g.dispatch({type:'spawn',kind:([0,1,2] as const)[cycle%3]}))cycle++;}
  for(let i=0;i<6;i++)g.step(1/60);
 }
 assert.equal(g.state.phase,'won');return g;
}
test('mastery marks have three named shape states, exact remaining rewards and third instructions',async()=>{
 const {masteryMarksHtml}=await presentation();const p=defaultProfile();p.mastery.chapters[0].earnedMask=3;
 const html=masteryMarksHtml(p,0);assert.equal((html.match(/role="img"/g)??[]).length,3);
 assert.match(html,/Clear: earned/);assert.match(html,/Gate Unbroken: earned/);assert.match(html,/Before the Embers Fade: not earned/);
 assert.match(html,/✓/);assert.match(html,/◇/);assert.match(html,/100 coins · 15 gems remaining/);assert.match(html,/Win within 1:15/);
});
test('settled receipt shows actual credits inside total earnings and never advertises a second claim',()=>{
 const g=victory();const receipt=g.profile.pendingVictory!;assert.equal(receipt.settlement,'mastery-v1');if(receipt.settlement!=='mastery-v1')return;
 const html=resultsHtml(g.profile,g.state);
 assert.match(html,new RegExp(`Normal combat: ${Math.floor(g.state.earned-receipt.masteryCoins).toLocaleString('en-US')} coins`));
 assert.match(html,new RegExp(`Mastery credited: ${receipt.masteryCoins.toLocaleString('en-US')} coins · ${receipt.masteryGems} gems`));
 assert.match(html,/New seals: Clear, Gate Unbroken, Before the Embers Fade/);assert.match(html,/Already added/);assert.match(html,/>Replay /);
 assert.equal(resultsHtml(new Game(g.profile).profile,new Game(g.profile).state),html);
});
test('results label missing-seal rematches and preserve legacy Continue-first without invented counters',()=>{
 const g=victory();g.profile.mastery.chapters[0].earnedMask=1;assert.match(resultsHtml(g.profile,g.state),/>Try for remaining seals /);
 const raw={...defaultProfile(),version:2,pendingVictory:{timeline:1,battle:0,earned:123,seconds:40,playerHp:100}};
 const legacy=new Game(decodeSave(JSON.stringify(raw)).profile!);const html=resultsHtml(legacy.profile,legacy.state);
 assert.match(html,/data-command="next"/);assert.doesNotMatch(html,/data-command="retry"/);assert.match(html,/future attempts/);assert.doesNotMatch(html,/Mastery credited|Gate damage this attempt|Attempt:/);
});
test('cleared lost rematches remain Regroup with Retry and shared continuation; uncleared losses have none',()=>{
 const g=victory();g.dispatch({type:'retry'});g.dispatch({type:'start'});for(let i=0;i<36000&&g.state.phase==='running';i++)g.step(1/60);assert.equal(g.state.phase,'lost');
 const html=resultsHtml(g.profile,g.state);assert.match(html,/REGROUP/);assert.match(html,/data-command="retry"/);assert.match(html,/data-command="next"[^>]*>Continue to Olive Terraces/);
 const p=defaultProfile();const fresh=new Game(p);fresh.state.phase='lost';assert.doesNotMatch(resultsHtml(fresh.profile,fresh.state),/data-command="next"/);
});
test('ready picker has separate selected-Clear continuation footer and keeps every row a selection',()=>{
 const g=victory(1);g.dispatch({type:'retry'});const html=battleSelectionHtml(g.profile,g.state);
 assert.equal((html.match(/data-battle=/g)??[]).length,6);assert.match(html,/<footer class="chapter-continuation">/);assert.match(html,/data-command="next"[^>]*>Continue to Harbor Watch/);
 for(const row of html.matchAll(/<button[^>]*data-battle[^>]*>([\s\S]*?)<\/button>/g))assert.doesNotMatch(row[1],/<button/);
 g.dispatch({type:'start'});assert.doesNotMatch(battleSelectionHtml(g.profile,g.state),/data-command="next"/);
});
test('final continuation explains fresh seals and terminal cap offers return without Next Timeline',()=>{
 const g=victory(5);const html=resultsHtml(g.profile,g.state);assert.match(html,/Next Timeline/);assert.match(html,/seals and their rewards start afresh/);assert.match(html,/Preview the next timeline/);assert.doesNotMatch(html,/You earn 100 gems/);
 g.dispatch({type:'retry'});assert.match(battleSelectionHtml(g.profile,g.state),/seals and their rewards start afresh/);
 g.profile.timeline=1000;g.profile.mastery.timeline=1000;g.state.phase='won';const terminal=resultsHtml(g.profile,g.state);
 assert.match(terminal,/Return to chapters/);assert.doesNotMatch(terminal,/data-command="next"|Next Timeline/);
});
test('result evolution and existing evolution copy use current cost, prerequisite and retained access',()=>{
 const p=defaultProfile();p.coins=0;const g=new Game(p);g.state.phase='won';let html=resultsHtml(g.profile,g.state);
 assert.match(html,/data-command="evolve" disabled/);assert.match(html,new RegExp(`Evolve · ${ERAS[0].evolveCost.toLocaleString('en-US')} coins`));
 g.profile.coins=ERAS[0].evolveCost;assert.doesNotMatch(resultsHtml(g.profile,g.state),/data-command="evolve" disabled/);
 for(const copy of [evolutionDialogHtml(g.profile,g.state)!,evolutionScreenHtml(g.profile,g.state)]){assert.match(copy,/selected opponent/);assert.match(copy,/unlocked battles stay/);assert.doesNotMatch(copy,/return to battle 1|unlocked battles reset/);}
 g.profile.age=1;assert.doesNotMatch(resultsHtml(g.profile,g.state),/data-command="evolve"/);
});
test('retry advice chooses supported evidence in priority order and actual third objective values',async()=>{
 const {masteryAdvice,masteryAttemptText}=await presentation();const g=new Game();g.state.phase='lost';
 assert.match(masteryAdvice(g.profile,g.state),/Deploy/);g.state.stats.deployed=3;g.state.stats.deployedByKind=[0,3,0];g.state.food=10;
 assert.match(masteryAdvice(g.profile,g.state),/unused food/);g.state.food=0;g.state.stats.gateDamageTaken=5;assert.match(masteryAdvice(g.profile,g.state),/front line/);
 g.state.stats.deployedByKind=[1,2,0];g.state.units=[{id:1,side:'enemy',hp:1},{id:2,side:'enemy',hp:1},{id:3,side:'enemy',hp:1}] as typeof g.state.units;
 assert.match(masteryAdvice(g.profile,g.state),/Freeze/);g.state.skillsUsed=['freeze'];assert.match(masteryAdvice(g.profile,g.state),/Meteor/);
 g.state.units=[];g.profile.coins=unlockCost(1,g.profile);assert.match(masteryAdvice(g.profile,g.state),/Unlock.*ranged/);
 g.profile.coins=0;g.profile.mastery.chapters[0].earnedMask=3;g.state.time=81;assert.match(masteryAdvice(g.profile,g.state),/1:21/);assert.match(masteryAttemptText(g.profile,g.state),/1:21.*1:15/);
 g.profile.enemyAge=1;g.state.stats.deployedByKind=[1,0,2];assert.match(masteryAttemptText(g.profile,g.state),/2 of 3 roles/);
 g.profile.enemyAge=3;g.state.stats.maxFreezeTargets=2;assert.match(masteryAttemptText(g.profile,g.state),/2.*3 enemies/);
});
test('objective guidance retains urgent threat and paused priority in the existing hint slot',()=>{
 const g=new Game();g.dispatch({type:'start'});g.dispatch({type:'spawn',kind:0});g.state.food=20;g.profile.wins=5;
 assert.match(battleGuidance(g.profile,g.state),/Win within 1:15/);
 const preview={number:1,total:3,intent:'volley' as const,counts:[1,2,0] as const,nextIn:2};assert.match(battleGuidance(g.profile,g.state,preview),/Ranged enemies/);
 g.state.paused=true;assert.match(battleGuidance(g.profile,g.state,preview),/paused/);
});
test('explicit result return routes and terminal exit remain guarded while recovery owns priority',()=>{
 const main=mainSource();
 assert.match(main,/function dismissModal\(/);assert.match(main,/evolutionFromResult/);
 assert.match(main,/'return-chapters':\(\)=>\{returnToChapters\(\)/);
 assert.match(main,/function showResult\(focusCommand\?:string\)\{[\s\S]*?if\(!guardAction\(\)\|\|app\.modal==='session'\)return;/);
 assert.match(main,/'confirm-evolve':[\s\S]*?showResult\(\)/);
 assert.match(main,/e\.key==='Escape'[\s\S]*?dismissModal\(\)/);
});

test('real capped victory labels only credited mastery and keeps paid seals without a deferred claim',()=>{
 const g=victory(0,true);const receipt=g.profile.pendingVictory!;assert.equal(receipt.settlement,'mastery-v1');if(receipt.settlement!=='mastery-v1')return;
 assert.equal(receipt.masteryCoins,0);assert.equal(receipt.masteryGems,2);assert.equal(g.state.earned,3);
 const before=JSON.stringify(g.profile),html=resultsHtml(g.profile,g.state);
 assert.match(html,/Normal combat: 3 coins/);assert.match(html,/Mastery credited: 0 coins · 2 gems/);assert.match(html,/0 coins · 0 gems remaining/);
 assert.equal(JSON.stringify(g.profile),before);assert.doesNotMatch(html,/data-command="claim"/);
});
test('all third-objective presentation measures use sanitized actual counters and their comparison',async()=>{
 const {masteryAttemptText}=await presentation();const g=new Game();g.state.phase='lost';g.state.time=81;
 g.state.stats.deployedByKind=[1,0,2];g.state.stats.skillsCast=2;g.state.stats.maxFreezeTargets=2;g.state.stats.meteorKills=2;g.state.stats.deployed=19;
 for(const [chapter,expected]of [[0,/1:21.*at most 1:15/],[1,/2 of 3 roles/],[2,/2 skills used.*at most 1/],[3,/2 frozen together.*3 enemies/],[4,/2 meteor defeats.*3 enemies/],[5,/19 deployments.*at most 18/]]as const){g.profile.enemyAge=chapter;assert.match(masteryAttemptText(g.profile,g.state),expected);}
});
test('a real first loss at the final timeline cap never claims that the campaign is complete',()=>{
 const p=defaultProfile();p.age=5;p.enemyAge=5;p.furthestBattle=5;p.timeline=1000;p.mastery.timeline=1000;
 const g=new Game(p);assert.equal(g.dispatch({type:'start'}),true);
 for(let tick=0;tick<36000&&g.state.phase==='running';tick++)g.step(1/60);
 assert.equal(g.state.phase,'lost');assert.equal(g.profile.mastery.chapters[5].earnedMask,0);
 const html=resultsHtml(g.profile,g.state);assert.match(html,/REGROUP/);assert.match(html,/The final timeline/);assert.doesNotMatch(html,/All 1,000 timelines complete/);assert.match(html,/Return to chapters/);assert.doesNotMatch(html,/data-command="next"/);
});
