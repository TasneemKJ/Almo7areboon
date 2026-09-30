import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {battleGuidance} from '../src/ui/battle-hud.ts';
import {skillCue} from '../src/ui/skill-cues.ts';

function opening(){const game=new Game();assert.equal(game.dispatch({type:'start'}),true);assert.equal(game.dispatch({type:'spawn',kind:0}),true);assert.equal(game.dispatch({type:'spawn',kind:0}),true);return game;}
test('real beginner food shortage teaches an optional Drop then ordinary timing after use',()=>{
 const game=opening(),before=JSON.stringify(game);
 assert.match(battleGuidance(game.profile,game.state,game.waveStatus().preview),/Food Drop adds 10 now.*wait 4s/);
 assert.equal(JSON.stringify(game),before,'hint never spends a skill or changes progress');
 assert.equal(game.state.food,0);assert.equal(game.dispatch({type:'skill',skill:'food'}),true);assert.equal(game.state.food,10);
 assert.equal(skillCue(game.profile,game.state,'food',false).badge,'✓');
 for(let i=0;i<3;i++)assert.equal(game.dispatch({type:'spawn',kind:0}),true);
 assert.match(battleGuidance(game.profile,game.state,game.waveStatus().preview),/^More food in/);
 assert.doesNotMatch(battleGuidance(game.profile,game.state,game.waveStatus().preview),/Food Drop adds/);
 assert.equal(game.dispatch({type:'skill',skill:'food'}),false);
});
test('experienced, paused and endangered battles retain their existing hint priorities',()=>{
 const game=opening();game.profile.wins=3;
 assert.match(battleGuidance(game.profile,game.state,game.waveStatus().preview),/^More food in/);
 game.profile.wins=0;assert.equal(game.dispatch({type:'pause'}),true);
 assert.match(battleGuidance(game.profile,game.state,game.waveStatus().preview),/^Battle paused/);
 assert.equal(game.dispatch({type:'pause'}),true);game.state.playerHp=game.state.playerMaxHp*.3;
 assert.match(battleGuidance(game.profile,game.state,game.waveStatus().preview),/^Your base is in danger/);
});
test('capacity badges and real skill gains agree without rounding away partial storage',()=>{
 for(const [food,badge,gain,accepted] of [[89,'+10',10,true],[89.01,'CAP',9.99,true],[98.5,'CAP',.5,true],[99,'FULL',0,false]] as const){
  const game=new Game();assert.equal(game.dispatch({type:'start'}),true);game.state.food=food;
  const before=JSON.stringify(game),cue=skillCue(game.profile,game.state,'food',game.canUseSkill('food'));
  assert.equal(cue.badge,badge);assert.match(cue.label,/99 food/);assert.equal(cue.opportunity,false);
  assert.equal(JSON.stringify(game),before,'presentation is pure');
  assert.equal(game.dispatch({type:'skill',skill:'food'}),accepted);assert.ok(Math.abs(game.state.food-food-gain)<1e-9);
  assert.equal(game.state.stats.skillsCast,accepted?1:0);
  assert.equal(skillCue(game.profile,game.state,'food',false).badge,accepted?'✓':'FULL');
 }
});
