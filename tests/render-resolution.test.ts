import test from 'node:test';
import assert from 'node:assert/strict';
import {battleResolution,createDensityGovernor,DENSITY_WINDOW} from '../src/view/render-resolution.ts';

test('battle canvas uses denser phone pixels with a bounded backing store',()=>{
 assert.equal(battleResolution(1),1);
 assert.equal(battleResolution(1.5),1.5);
 assert.equal(battleResolution(2),2);
 assert.equal(battleResolution(3),3,'a 3x iPhone gets every pixel');assert.equal(battleResolution(4),3);
 for(const invalid of [0,-1,NaN,Infinity])assert.equal(battleResolution(invalid),1);
});

test('the density steps down half at a time only while frames stay over 20 ms, never below 1x, ignoring hitches',()=>{
 const g=createDensityGovernor(3);
 for(let i=0;i<DENSITY_WINDOW*3;i++)assert.equal(g.frame(16.7),null);
 assert.equal(g.density,3,'a smooth 60 fps keeps full density');
 for(let i=0;i<DENSITY_WINDOW*2;i++)g.frame(i%10===0?400:16.7);
 assert.equal(g.density,3,'hidden-tab stalls are not counted');
 let steps:number[]=[];for(let i=0;i<DENSITY_WINDOW*6;i++){const n=g.frame(28);if(n!==null)steps.push(n);}
 assert.deepEqual(steps,[2.5,2,1.5,1]);assert.equal(g.density,1);
 assert.equal(createDensityGovernor(NaN).density,1);
});
