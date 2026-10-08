import test from 'node:test';import assert from 'node:assert/strict';import {frostFrame} from '../src/view/frost-release.ts';
test('fractures appear only near real expiry and never outlive frozen status',()=>{
 assert.equal(frostFrame(10,9,false)!.thaw,false);assert.equal(frostFrame(10,9.6,false)!.thaw,true);
 assert.equal(frostFrame(10,10,false),null);assert.equal(frostFrame(10,11,false),null);assert.equal(frostFrame(NaN,1,false),null);
 assert.ok(frostFrame(10,9.8,false)!.spread>frostFrame(10,9.6,false)!.spread);
 assert.equal(frostFrame(10,9.6,true)!.spread,frostFrame(10,9.8,true)!.spread);
});
