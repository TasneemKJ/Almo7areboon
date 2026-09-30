import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { battleGuidance } from '../src/ui/battle-hud.ts';

function quietGap() {
  const profile=defaultProfile();profile.wins=1;
  const game=new Game(profile);game.dispatch({type:'start'});
  for(let tick=0;tick<1760;tick++) {
    if(game.state.stats.deployed<3&&game.deploymentStatus(0).allowed)game.dispatch({type:'spawn',kind:0});
    game.step(1/60);
  }
  assert.equal(game.state.phase,'running');
  assert.equal(game.state.stats.deployed,3);
  assert.equal(game.state.units.filter(unit=>unit.side==='enemy'&&unit.hp>0).length,0);
  assert.ok(game.waveStatus().preview!.nextIn>8);
  return game;
}

test('a real quiet gap never teaches an empty Freeze or disabled Meteor',()=>{
  const game=quietGap(),before=JSON.stringify(game);
  const text=battleGuidance(game.profile,game.state,game.waveStatus().preview);
  assert.doesNotMatch(text,/Try a skill.*(?:Freeze|Meteor)/);
  assert.match(text,/Food Drop/);
  assert.equal(game.canUseSkill('food'),true);
  assert.equal(JSON.stringify(game),before,'guidance does not spend skills or progress');
});

test('the skill tutorial recommends combat skills only with real living enemy targets',()=>{
  const game=quietGap();
  while(game.state.time<38.8)game.step(1/60);
  assert.ok(game.state.units.some(unit=>unit.side==='enemy'&&unit.hp>0));
  assert.equal(game.canUseSkill('meteor'),true);
  assert.match(battleGuidance(game.profile,game.state,game.waveStatus().preview),/Try a skill.*Freeze.*Meteor/);
  game.dispatch({type:'pause'});
  assert.doesNotMatch(battleGuidance(game.profile,game.state,game.waveStatus().preview),/Try a skill/);
});

test('empty targets and full food never produce a skill-use tutorial',()=>{
  const game=quietGap();game.state.food=99;
  assert.equal(game.canUseSkill('food'),false);
  assert.doesNotMatch(battleGuidance(game.profile,game.state,game.waveStatus().preview),/Try a skill/);
});

test('prepared native teaching fixture has live and quiet windows across deployment timing',()=>{
  for(const delay of [.1,.5,1,2]) {
    const profile=defaultProfile();Object.assign(profile,{wins:1,foodLevel:3});
    const game=new Game(profile);assert.equal(game.dispatch({type:'start'}),true);
    let lastDeployment=-1,firstLive:number|null=null,firstQuiet:number|null=null,lastQuiet=0;
    for(let tick=0;tick<2100&&game.state.phase==='running';tick++) {
      if(game.state.stats.deployed<3&&game.state.time>=delay&&game.state.time-lastDeployment>.3&&game.deploymentStatus(0).allowed) {
        assert.equal(game.dispatch({type:'spawn',kind:0}),true);lastDeployment=game.state.time;
      }
      const hint=battleGuidance(profile,game.state,game.waveStatus().preview);
      if(/Try a skill:.*Freeze.*Meteor/.test(hint)&&firstLive===null)firstLive=game.state.time;
      if(/^Try a skill: Food Drop\./.test(hint)){firstQuiet??=game.state.time;lastQuiet=game.state.time;}
      game.step(1/60);
    }
    assert.equal(game.state.stats.deployed,3);
    assert.ok(firstLive!==null&&firstQuiet!==null&&firstLive<firstQuiet,`live targets precede gap, delay=${delay}`);
    assert.ok(lastQuiet-firstQuiet!>=2,`quiet window allows native capture, delay=${delay}`);
  }
});
