import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyGoals, journeyScreenHtml } from '../src/ui/journey-screen.ts';
import { orderStatus } from '../src/ui/battle-orders.ts';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, loadProfile } from '../src/game/save.ts';
import { QUESTS } from '../src/game/data.ts';

test('Journey derives three honest milestone ladders without mutating the profile',()=>{
 const p=defaultProfile(),before=JSON.stringify(p);const goals=journeyGoals(p);
 assert.equal(goals.length,3);assert.deepEqual(goals.map(g=>g.stat),['wins','kills','deployed']);
 assert(goals.every(g=>g.progress===0&&!g.complete&&!g.claimable));assert.equal(JSON.stringify(p),before);
 const g=new Game(p),html=journeyScreenHtml(g.profile,g.state);assert.match(html,/Your journey/);assert.match(html,/data-command="chronicle"/);assert.match(html,/data-journey-tab="cards"/);
});
test('earned milestones use existing once-only reward dispatch and survive save roundtrip',()=>{
 const p=defaultProfile();p.wins=3;const g=new Game(p);const goal=journeyGoals(g.profile)[0];assert(goal.claimable);assert.equal(goal.quest!.reward,100);
 const html=journeyScreenHtml(g.profile,g.state);assert.match(html,/data-claim="conqueror"/);const gems=g.profile.gems;assert(g.dispatch({type:'claim',id:'conqueror'}));assert.equal(g.profile.gems,gems+100);assert.equal(g.dispatch({type:'claim',id:'conqueror'}),false);
 const reloaded=loadProfile({getItem:()=>JSON.stringify(g.profile)});assert.equal(journeyGoals(reloaded)[0].quest!.id,'champion');
});
test('veteran completed ladders have finite100percent progress and no phantom reward',()=>{
 const p=defaultProfile();p.wins=p.kills=p.deployed=1e9;p.claimed=QUESTS.map(q=>q.id);const goals=journeyGoals(p);assert(goals.every(g=>g.complete&&g.progress===1&&!g.claimable&&g.quest===null));
 const g=new Game(p);assert.doesNotMatch(journeyScreenHtml(g.profile,g.state),/data-claim=/);
});
test('Journey preserves the result receipt and manual paused state',()=>{
 const g=new Game();g.state.phase='won';g.profile.pendingVictory={settlement:'legacy',timeline:1,battle:0,earned:42,seconds:12,playerHp:100};g.state.paused=true;
 const before=JSON.stringify(g);journeyScreenHtml(g.profile,g.state);assert.equal(JSON.stringify(g),before);
});
test('banner distinguishes readiness, charge, paused and active countdown',()=>{
 const g=new Game();assert.equal(orderStatus(g.state).canCast,false);g.dispatch({type:'start'});g.state.orders!.charge=60;assert.equal(orderStatus(g.state).canCast,true);
 g.dispatch({type:'order',order:'hold'});assert.match(orderStatus(g.state).label,/Hold.*10s/);assert.equal(orderStatus(g.state).canCast,false);
 g.dispatch({type:'pause'});assert.match(orderStatus(g.state).label,/Paused/);
});
