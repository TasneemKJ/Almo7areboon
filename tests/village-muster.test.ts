import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createVillageMuster,
 rememberVillageMuster,
 villageMusterFrame,
 VILLAGE_MUSTER_DURATION,
} from '../src/view/village-muster.ts';

test('only the first accepted player spawn begins one immutable muster answer',()=>{
 const empty=createVillageMuster();
 assert.equal(Object.isFrozen(empty),true);
 for(const event of [
  {type:'spawn',side:'enemy'},
  {type:'spawn'},
  {type:'hit',side:'player'},
 ] as const)assert.equal(rememberVillageMuster(empty,event as never,7),empty);
 assert.equal(rememberVillageMuster(empty,{type:'spawn',side:'player'},NaN),empty);
 const started=rememberVillageMuster(empty,{type:'spawn',side:'player'},12);
 assert.notEqual(started,empty);assert.equal(started.startedAt,12);assert.equal(Object.isFrozen(started),true);
 assert.equal(rememberVillageMuster(started,{type:'spawn',side:'player'},13),started,'later deployments cannot restart the answer');
});

test('muster lifetime follows finite simulation time and pause is byte-stable',()=>{
 const state=rememberVillageMuster(createVillageMuster(),{type:'spawn',side:'player'},12);
 const opening=villageMusterFrame(state,12,false);assert.deepEqual(opening,{progress:0});assert.equal(Object.isFrozen(opening),true);
 const middle=villageMusterFrame(state,12+VILLAGE_MUSTER_DURATION/2,false);assert.ok(middle&&Math.abs(middle.progress-.5)<1e-9);
 assert.deepEqual(villageMusterFrame(state,12+VILLAGE_MUSTER_DURATION/2,false),middle,'an unchanged paused clock is byte-stable');
 assert.equal(villageMusterFrame(state,12+VILLAGE_MUSTER_DURATION,false),null);
 assert.equal(villageMusterFrame(state,Infinity,false),null);
});

test('reduced motion keeps the complete static identity without extending the answer',()=>{
 const state=rememberVillageMuster(createVillageMuster(),{type:'spawn',side:'player'},4);
 assert.deepEqual(villageMusterFrame(state,4,true),{progress:1});
 assert.deepEqual(villageMusterFrame(state,4+VILLAGE_MUSTER_DURATION-.001,true),{progress:1});
 assert.equal(villageMusterFrame(state,4+VILLAGE_MUSTER_DURATION,true),null);
 assert.equal(villageMusterFrame(createVillageMuster(),4,true),null);
});
