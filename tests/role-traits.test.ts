import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoleHit, sweepTarget } from '../src/game/role-traits.ts';
import type { Unit } from '../src/game/types.ts';
const unit=(id:number,x:number,lane=0,side:'player'|'enemy'='enemy',hp=10):Unit=>({id,x,lane,side,hp,maxHp:hp,kind:0,age:0,attackTimer:0,attacking:false,hitFlash:0});
test('kind-based guard, pierce and secondary sweep apply exactly one multiplier',()=>{
  assert.deepEqual(resolveRoleHit(1,0,100),{damage:75,trait:'guard'});
  assert.deepEqual(resolveRoleHit(1,2,100),{damage:135,trait:'pierce'});
  assert.deepEqual(resolveRoleHit(2,1,100,true),{damage:40,trait:'sweep'});
  assert.deepEqual(resolveRoleHit(0,2,100),{damage:100});
  assert.deepEqual(resolveRoleHit(2,0,100),{damage:100});
  assert.deepEqual(resolveRoleHit(1,0,100,true),{damage:100});
  for(const damage of [NaN,Infinity,-1,0]) assert.deepEqual(resolveRoleHit(1,0,damage),{damage:0});
});
test('sweep includes radius boundary and selects nearest then lowest ID around dead primary',()=>{
  const source=unit(1,50,0,'player'), primary=unit(2,100,0,'enemy',0);
  const edge=unit(3,132),outside=unit(4,132.001);
  assert.equal(sweepTarget(source,primary,[outside,edge]),edge);
  assert.equal(sweepTarget(source,primary,[outside]),null);
  const high=unit(9,106,1),low=unit(5,94,1);
  assert.equal(sweepTarget(source,primary,[high,low]),low);
  assert.equal(sweepTarget(source,primary,[source,primary,unit(6,100,0,'enemy',0),unit(7,100,0,'player')]),null);
  assert.equal(sweepTarget(source,primary,[unit(8,100,4)]),null);
});
