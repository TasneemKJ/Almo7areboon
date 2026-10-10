import test from 'node:test';import assert from 'node:assert/strict';
import {RecruitArrivals,recruitArrivalFrame} from '../src/view/recruit-arrival.ts';
import type {Unit} from '../src/game/types.ts';
const unit={id:9,kind:1,side:'player',x:60,lane:1} as Unit;
test('real spawn binds a current unit, never a redraw or rejected action',()=>{
 const a=new RecruitArrivals();assert.deepEqual(a.pose(9,4,false),{sx:1,sy:1,lift:0,forward:0});
 assert.equal(a.record({type:'hit',x:60,lane:1,side:'player'},[unit],4),false);
 assert.equal(a.record({type:'spawn',x:60,lane:1,side:'player'},[unit],4),true);
 assert.ok(a.pose(9,4.15,false).lift>0);assert.equal(a.record({type:'spawn',x:60,lane:1,side:'player'},[unit],4),false);
 a.clear();assert.equal(a.pose(9,4.15,false).lift,0);
});
test('arrival weight belongs to the role and settles exactly without reduced motion',()=>{
 const light=recruitArrivalFrame(1,.15,false),heavy=recruitArrivalFrame(2,.15,false);
 assert.ok(light.sx>heavy.sx);assert.ok(light.sy<heavy.sy);
 for(const t of [-1,.3,1,NaN])assert.equal(recruitArrivalFrame(1,t,false).lift,0);
 assert.deepEqual(recruitArrivalFrame(1,.15,true),{sx:1,sy:1,lift:0,forward:0});
});
