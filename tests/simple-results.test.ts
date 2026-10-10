import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { compactResultsHtml, expeditionChoiceHtml, resultsHtml } from '../src/ui/results-screen.ts';
const controls=(html:string)=>(html.match(/<button\b/g)||[]).length;
for(const phase of ['won','lost'] as const)test(`ordinary ${phase} result has three choices and no compulsory statistics`,()=>{
 const g=new Game();g.state.phase=phase;g.state.earned=123;
 const before=JSON.stringify([g.profile,g.state]),html=compactResultsHtml(g.profile,g.state);
 assert.equal(controls(html),3);assert.match(html,/data-command="result-details"/);assert.match(html,/data-command="home"/);
 assert.doesNotMatch(html,/battle-statistics|village-voice|story-discoveries|data-command="journey"/);
 assert.match(html,/123/);if(phase==='won')assert.match(html,/Already added/);else assert.doesNotMatch(html,/Already added/);
 assert.equal(JSON.stringify([g.profile,g.state]),before);
 assert.match(resultsHtml(g.profile,g.state),/battle-statistics/,'optional receipt keeps original statistics');
});
test('expedition result does not silently select provisions or advance the run',()=>{
 const p=defaultProfile();p.chronicle!.expedition={stage:0,chapter:0,reserve:4,provision:'supplies'};
 const g=new Game(p);g.profile.chronicle!.expedition=p.chronicle!.expedition;g.state.phase='won';
 const before=JSON.stringify([g.profile,g.state]),html=compactResultsHtml(g.profile,g.state);
 assert.match(html,/data-command="result-expedition"/);assert.equal(controls(html),3);
 const choices=expeditionChoiceHtml();assert.equal(controls(choices),3);
 assert.match(choices,/data-provision="supplies"/);assert.match(choices,/data-provision="shelter"/);assert.match(choices,/data-command="result-back"/);
 assert.equal(JSON.stringify([g.profile,g.state]),before);
});
for(const phase of ['won','lost'] as const)test(`terminal ${phase} offers chapters rather than a nonexistent next timeline`,()=>{
 const p=defaultProfile();p.timeline=1000;p.enemyAge=5;p.furthestBattle=5;p.mastery.timeline=1000;
 const g=new Game(p);g.state.phase=phase;const html=compactResultsHtml(g.profile,g.state);
 assert.equal(controls(html),3);assert.match(html,/data-command="return-chapters"/);assert.doesNotMatch(html,/data-command="next"/);
});
test('defeat uses one safety line and zero earnings never claim an added payout',()=>{
 const g=new Game();g.state.phase='lost';g.state.earned=0;
 const html=compactResultsHtml(g.profile,g.state);
 assert.doesNotMatch(html,/Already added|YOUR PROGRESS IS SAFE/);assert.match(html,/Your earned coins stay with you/);
 g.state.phase='won';assert.doesNotMatch(compactResultsHtml(g.profile,g.state),/Already added/);
});

function wonExpedition(terminal=false){
 const p=defaultProfile();p.chronicle!.restoration=1;
 if(terminal){p.timeline=1000;p.age=5;p.enemyAge=5;p.furthestBattle=5;p.mastery.timeline=1000;p.chronicle!.timeline=1000;}
 const g=new Game(p);assert.equal(g.dispatch({type:'chronicle-expedition',battle:p.enemyAge}),true);
 assert.equal(g.dispatch({type:'start'}),true);g.state.chronicle!.cart.x=790;g.step(1/60);
 assert.equal(g.state.phase,'won');return g;
}
test('expedition Details describes its own encounter instead of the next ordinary chapter',()=>{
 const g=wonExpedition(),before=JSON.stringify([g.profile,g.state]),html=resultsHtml(g.profile,g.state);
 assert.match(html,/Encounter 1 of 3 complete/);assert.doesNotMatch(html,/Olive Terraces is next/);
 assert.match(html,/Choose provisions/);assert.equal(JSON.stringify([g.profile,g.state]),before);
});
test('a final-timeline expedition still offers its canonical continuation',()=>{
 const g=wonExpedition(true),before=JSON.stringify([g.profile,g.state]),html=compactResultsHtml(g.profile,g.state);
 assert.match(html,/data-command="result-expedition"/);assert.doesNotMatch(html,/data-command="return-chapters"/);
 assert.equal(controls(html),3);assert.equal(JSON.stringify([g.profile,g.state]),before);
 assert.equal(g.dispatch({type:'chronicle-provision',provision:'shelter'}),true);
 assert.equal(g.dispatch({type:'chronicle-continue'}),true);assert.equal(g.state.phase,'ready');
 assert.equal(g.profile.enemyAge,5);assert.equal(g.profile.chronicle!.expedition!.stage,1);
});
test('a settled mastery receipt reports its real gems without promising the legacy victory bonus',()=>{
 const g=new Game();g.dispatch({type:'start'});g.state.enemyHp=0;g.step(1/60);
 assert.equal(g.state.phase,'won');const receipt=g.profile.pendingVictory;assert.ok(receipt?.settlement==='mastery-v1');assert.equal(receipt.masteryGems,50);
 const before=JSON.stringify([g.profile,g.state]),html=resultsHtml(g.profile,g.state);
 assert.match(html,/Mastery credited: .*50 gems/);assert.doesNotMatch(html,/victory bonus: up to 10 gems/);
 assert.equal(JSON.stringify([g.profile,g.state]),before);
});
