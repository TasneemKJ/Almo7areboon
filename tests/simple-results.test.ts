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
 assert.match(html,/123/);assert.match(html,/Already added/);
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
