import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {ERAS,eraEconomyScale} from '../src/game/data.ts';

test('the first battle is winnable by stockpiling then deploying through public actions',()=>{
  const game=new Game();
  assert.equal(game.dispatch({type:'start'}),true);
  for(let i=0;i<120*60&&game.state.phase==='running';i++){
    if(game.state.time>10&&game.state.food>=3)game.dispatch({type:'spawn',kind:0});
    game.step(1/60);
  }
  assert.equal(game.state.phase,'won');
  assert.ok(game.profile.coins>=150,'victory provides enough to unlock a ranged troop');
  assert.equal(game.dispatch({type:'unlock',kind:1}),true);
  assert.equal(game.dispatch({type:'next'}),true);
  assert.equal(game.profile.enemyAge,1);
  assert.equal(game.state.phase,'ready');
});

// Melee-only artillery battles take about 160s; the previous 150s limit ended before victory.
test('all six basic armies can win within three minutes without editing outcomes',()=>{
  for(let age=0;age<6;age++){
    const p=defaultProfile();p.age=age;p.enemyAge=age;
    const game=new Game(p);game.dispatch({type:'start'});
    for(let i=0;i<180*60&&game.state.phase==='running';i++){
      if(game.state.time>10&&game.state.food>=3)game.dispatch({type:'spawn',kind:0});
      game.step(1/60);
    }
    assert.equal(game.state.phase,'won',`age ${age+1} remains winnable`);
  }
});

test('P21: all six mixed armies win within 90s through purchases and deployment actions',()=>{
  for(let age=0;age<6;age++){
    const p=defaultProfile();p.age=age;p.enemyAge=age;p.coins=550*eraEconomyScale(age);
    const g=new Game(p);assert.equal(g.dispatch({type:'unlock',kind:1}),true);assert.equal(g.dispatch({type:'unlock',kind:2}),true);
    g.dispatch({type:'start'});let deployed=0;const mix=[2,1,0,1] as const;
    for(let i=0;i<90*60&&g.state.phase==='running';i++){
      const kind=mix[deployed%mix.length];
      if(g.state.time>10&&g.state.food>=ERAS[age].units[kind].cost&&g.dispatch({type:'spawn',kind}))deployed++;
      g.step(1/60);
    }
    assert.equal(g.state.phase,'won',`age ${age+1}: mixed army`);
    assert.ok(g.state.stats.damageDealt>0);assert.ok(g.state.stats.kills>0);
  }
});
