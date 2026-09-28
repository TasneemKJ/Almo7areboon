import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';

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

test('all six same-age armies can win through real combat without editing battle outcomes',()=>{
  for(let age=0;age<6;age++){
    const p=defaultProfile();p.age=age;p.enemyAge=age;
    const game=new Game(p);game.dispatch({type:'start'});
    for(let i=0;i<150*60&&game.state.phase==='running';i++){
      if(game.state.time>10&&game.state.food>=3)game.dispatch({type:'spawn',kind:0});
      game.step(1/60);
    }
    assert.equal(game.state.phase,'won',`age ${age+1} remains winnable`);
  }
});
