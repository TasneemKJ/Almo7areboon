import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {ERAS} from '../src/game/data.ts';
import {defaultProfile,loadProfile,saveProfile,SAVE_KEY} from '../src/game/save.ts';

function forceWon(g:Game) {g.dispatch({type:'start'});g.state.enemyHp=0;g.step(1/60);}

test('evolving resets coins and retains battle progress, while keeping the new age and permanent collection',()=>{
  const p=defaultProfile();p.coins=ERAS[0].evolveCost+999;p.enemyAge=2;p.furthestBattle=3;p.cards[0]=4;
  const g=new Game(p);assert.equal(g.dispatch({type:'evolve'}),true);
  assert.equal(g.profile.age,1);assert.equal(g.profile.enemyAge,2);assert.equal(g.profile.furthestBattle,3);
  assert.equal(g.profile.coins,0);assert.equal(g.profile.cards[0],4);assert.equal(g.profile.gems,p.gems);
  assert.equal(g.state.phase,'ready');assert.deepEqual(g.profile.unlocked,[true,false,false]);
});

test('cleared battles can be replayed without relocking the furthest available battle',()=>{
  const g=new Game();forceWon(g);g.dispatch({type:'next'});forceWon(g);g.dispatch({type:'next'});
  assert.equal(g.profile.enemyAge,2);assert.equal(g.profile.furthestBattle,2);
  assert.equal(g.dispatch({type:'select-battle',battle:0}),true);
  assert.equal(g.profile.enemyAge,0);assert.equal(g.profile.furthestBattle,2);
  assert.equal(g.dispatch({type:'select-battle',battle:2}),true);
  assert.equal(g.dispatch({type:'select-battle',battle:3}),false);
  assert.equal(g.dispatch({type:'select-battle',battle:-1}),false);
  assert.equal(g.dispatch({type:'select-battle',battle:NaN}),false);
  g.dispatch({type:'start'});assert.equal(g.dispatch({type:'select-battle',battle:0}),false);
});

test('a new timeline clears its coin economy and retains permanent currency',()=>{
  const p=defaultProfile();p.age=5;p.enemyAge=5;p.furthestBattle=5;p.coins=1000;
  const g=new Game(p);forceWon(g);const gems=g.profile.gems;
  assert.equal(g.dispatch({type:'prestige',expectedTimeline:g.profile.timeline,legacy:'hearth'}),true);
  assert.equal(g.profile.timeline,2);assert.equal(g.profile.coins,0);assert.equal(g.profile.furthestBattle,0);
  assert.ok(g.profile.gems>=gems);
});

test('battle unlock progress survives save and old saves migrate without losing access',()=>{
  const p=defaultProfile();p.enemyAge=1;p.furthestBattle=4;
  let raw='';saveProfile(p,{setItem:(key,value)=>{assert.equal(key,SAVE_KEY);raw=value;}});
  assert.equal(loadProfile({getItem:()=>raw}).furthestBattle,4);
  const old=JSON.parse(raw);delete old.furthestBattle;old.enemyAge=3;
  assert.equal(loadProfile({getItem:()=>JSON.stringify(old)}).furthestBattle,3);
});
