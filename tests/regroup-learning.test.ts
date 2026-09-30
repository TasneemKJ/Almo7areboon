import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { ERAS, foodUpgradeCost, unlockCost } from '../src/game/data.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';
import { regroupLearningHtml } from '../src/ui/regroup-learning.ts';
import { battleSelectionHtml } from '../src/ui/progression-screen.ts';

function loss(){const g=new Game();assert.equal(g.dispatch({type:'start'}),true);assert.equal(g.dispatch({type:'retreat'}),true);return g;}
test('defeat offers a voluntary earlier-chapter route only when an earlier opponent is unlocked',()=>{
 const g=loss();assert.doesNotMatch(resultsHtml(g.profile,g.state),/data-command="regroup-chapters"/);
 Object.assign(g.profile,{age:4,enemyAge:5,furthestBattle:5});const before=JSON.stringify([g.profile,g.state]);
 assert.match(resultsHtml(g.profile,g.state),/data-command="regroup-chapters"[^>]*>Choose an earlier chapter/);
 assert.equal(JSON.stringify([g.profile,g.state]),before);
 g.state.phase='won';assert.doesNotMatch(resultsHtml(g.profile,g.state),/data-command="regroup-chapters"/);
});
test('recovery picker suggests a reachable earlier opponent without selecting it or promising a win',()=>{
 for(const [age,enemyAge,furthestBattle,suggested] of [[4,5,5,4],[1,4,4,1],[5,2,2,1],[0,1,1,0]]){
  const p=defaultProfile();Object.assign(p,{age,enemyAge,furthestBattle});const g=new Game(p),before=JSON.stringify(g.profile);
  const html=battleSelectionHtml(g.profile,g.state,true);
  const row=html.match(new RegExp(`<button[^>]*data-battle="${suggested}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0]??'';
  assert.match(row,/SUGGESTED REPLAY/);assert.doesNotMatch(row,/disabled/);
  assert.match(html,/wins are not guaranteed/i);assert.equal(JSON.stringify(g.profile),before);
  assert.doesNotMatch(battleSelectionHtml(g.profile,g.state),/SUGGESTED REPLAY/);
  g.dispatch({type:'start'});assert.doesNotMatch(battleSelectionHtml(g.profile,g.state,true),/SUGGESTED REPLAY/);
 }
});
test('real loss adds optional preparation teaching without writing progress or buying anything',()=>{
 const g=loss(),before=JSON.stringify([g.profile,g.state]);
 const html=resultsHtml(g.profile,g.state);
 assert.match(html,/<details class="chapter-scouting regroup-teaching">/);
 assert.match(html,/<summary>Prepare the next attempt<\/summary>/);
 assert.match(html,/Prepare next attempt/);assert.match(html,/Summons are random/);
 assert.doesNotMatch(html,/Earlier unlocked chapters/);assert.equal(JSON.stringify([g.profile,g.state]),before);
 assert.equal(g.dispatch({type:'retry'}),true);assert.equal(g.state.phase,'ready');
 assert.equal(regroupLearningHtml(g.profile,g.state),'');
});
test('funded option uses exact current prices and respects evolution prerequisites',()=>{
 const g=loss();g.profile.gems=0;g.profile.coins=unlockCost(1,g.profile);
 assert.match(regroupLearningHtml(g.profile,g.state),/Unlock ranged.*150 coins/);
 g.profile.coins=unlockCost(1,g.profile)-1;
 assert.doesNotMatch(regroupLearningHtml(g.profile,g.state),/Unlock ranged/);
 assert.match(regroupLearningHtml(g.profile,g.state),new RegExp(`Food production.*${foodUpgradeCost(g.profile)} coins`));
 g.profile.coins=ERAS[0].evolveCost;
 assert.match(regroupLearningHtml(g.profile,g.state),/Evolution.*2,500 coins.*resets/);
 g.profile.age=1;g.profile.enemyAge=0;g.profile.coins=ERAS[1].evolveCost;
 assert.doesNotMatch(regroupLearningHtml(g.profile,g.state),/Evolution is affordable/);
});
test('capped upgrades and unavailable summon pools never produce funded purchase claims',()=>{
 const p=defaultProfile();p.age=5;p.enemyAge=5;p.furthestBattle=5;p.foodLevel=100;p.baseLevel=100;p.unlocked=[true,true,true];p.coins=1e9;p.gems=1e7;p.cards.fill(1000);
 const g=new Game(p);g.dispatch({type:'start'});g.dispatch({type:'retreat'});
 const html=regroupLearningHtml(g.profile,g.state);
 assert.doesNotMatch(html,/is affordable|can afford|can be upgraded|You have enough|Unlock/);
 assert.match(html,/Earlier unlocked chapters/);assert.match(html,/army and upgrades stay/);
 g.profile.timeline=1000;g.profile.mastery.timeline=1000;
 const terminal=regroupLearningHtml(g.profile,g.state);
 assert.match(terminal,/Choose Return to chapters below/);
 assert.doesNotMatch(terminal,/Choose Prepare next attempt below/);
});
test('random summons are taught only as reviewable purchases and help stays absent on wins',()=>{
 const g=loss();assert.match(regroupLearningHtml(g.profile,g.state),/100 gems.*review/);
 g.profile.gems=99;assert.doesNotMatch(regroupLearningHtml(g.profile,g.state),/You have enough/);
 g.state.phase='won';assert.equal(regroupLearningHtml(g.profile,g.state),'');
});
