import test from 'node:test';
import assert from 'node:assert/strict';
import {battleResolution} from '../src/view/render-resolution.ts';

test('battle canvas uses denser phone pixels with a bounded backing store',()=>{
 assert.equal(battleResolution(1),1);
 assert.equal(battleResolution(1.5),1.5);
 assert.equal(battleResolution(2),2);
 assert.equal(battleResolution(3),2);
 for(const invalid of [0,-1,NaN,Infinity])assert.equal(battleResolution(invalid),1);
});
