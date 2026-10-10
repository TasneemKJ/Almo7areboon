import test from 'node:test';import assert from 'node:assert/strict';import {createCameraImpulseLimiter} from '../src/view/camera-impulses.ts';
test('crowded impacts cannot restart camera motion but one stronger consequence can cut in',()=>{
 const c=createCameraImpulseLimiter();assert.deepEqual(c.request(1,55,.0012,1,false),{duration:55,intensity:.0012});
 for(const t of [1.01,1.05,1.15])assert.equal(c.request(t,55,.0012,1,false),null);
 assert.deepEqual(c.request(1.16,180,.0025,3,false),{duration:180,intensity:.0025});
 assert.equal(c.request(1.2,180,.0025,3,false),null);assert.ok(c.request(1.42,55,.0012,1,false));
 c.reset();assert.ok(c.request(1,55,.0012,1,false));
});
test('reduced, invalid and excessive requests respect meaning and hard bounds',()=>{
 const c=createCameraImpulseLimiter();assert.equal(c.request(0,180,.0025,3,true),null);assert.equal(c.request(NaN,180,.0025,3,false),null);
 assert.deepEqual(c.request(0,900,.5,9,false),{duration:180,intensity:.0025});
});
