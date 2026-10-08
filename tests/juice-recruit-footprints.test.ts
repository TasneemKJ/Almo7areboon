import test from 'node:test';import assert from 'node:assert/strict';
import {recruitFootprint} from '../src/view/recruit-footprints.ts';import type {Arrival} from '../src/view/recruit-arrival.ts';
const cue={kind:0,at:5,x:60,lane:1} as Arrival;
test('contact belongs to its event time and heavy weight leaves a wider print',()=>{
 assert.equal(recruitFootprint(cue,4.99,false),null);assert.equal(recruitFootprint(cue,5.6,false),null);
 assert.ok(recruitFootprint({...cue,kind:2},5.1,false)!.width>recruitFootprint(cue,5.1,false)!.width);
 assert.ok(recruitFootprint(cue,5.1,false)!.alpha>recruitFootprint(cue,5.5,false)!.alpha);
 assert.equal(recruitFootprint(cue,5.1,true)!.spread,recruitFootprint(cue,5.5,true)!.spread);
 assert.deepEqual(cue,{kind:0,at:5,x:60,lane:1});
});
