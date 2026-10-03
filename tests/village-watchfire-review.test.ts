import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const path='../scripts/village-watchfire-review.ts';
async function subject(){
 const module=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(module,'watchfire browser-review contract must exist');return module;
}
const region=(left:number)=>({left,top:180,right:left+8,bottom:198});
const state={intent:'volley',progress:.4,lights:2,strokes:6,regions:Array.from({length:8},(_,index)=>region(40+index*12)),reduced:true,paused:false};

test('native watchfire diagnostic requires matching intent, bounded marks and three strokes per lamp',async()=>{
 const m=await subject();assert.deepEqual(m.validateWatchfireSnapshot(state,'volley'),state);
 for(const bad of [
  {...state,intent:'rush'},{...state,progress:NaN},{...state,progress:1.1},{...state,lights:0},{...state,lights:5},
  {...state,strokes:5},{...state,regions:state.regions.slice(1)},{...state,regions:[...state.regions.slice(0,7),region(446)]},
 ])assert.throws(()=>m.validateWatchfireSnapshot(bad,'volley'));
});

test('paused watchfire comparison allows only the pause flag to change',async()=>{
 const m=await subject();assert.doesNotThrow(()=>m.assertWatchfirePaused(state,{...state,paused:true}));
 assert.throws(()=>m.assertWatchfirePaused(state,{...state,paused:true,lights:3}));
});

test('native chronicle journey captures and pause-compares the watchfire with its road omen',()=>{
 const source=readFileSync(new URL('../scripts/review-chronicle.mjs',import.meta.url),'utf8');
 assert.match(source,/import \{assertWatchfirePaused,validateWatchfireSnapshot\} from '\.\/village-watchfire-review\.ts';/);
 assert.match(source,/dataset\.waveArrival[^\n]+dataset\.villageWatchfire/);
 assert.match(source,/validateWatchfireSnapshot\(watchfire,intent\)/);
 assert.match(source,/assertWatchfirePaused\(watchfire,pausedWatchfire\)/);
 assert.match(source,/async function assertWatchfireClearOfHud\(page,state\)/);
 assert.match(source,/await assertWatchfireClearOfHud\(page,observed\.watchfire\)/);
 assert.match(source,/watchfire\.progress>=\.75/);
 assert.match(source,/p\.age=fixture\.age/);
 assert.match(source,/open\(fixture\.name,fixture\.width,fixture\.height,p,fixture\.reducedMotion\)/);
 assert.match(source,/pauseAtWaveArrival\(f\.page,fixture\.intent/);
 assert.match(source,/watchfire\.lights<=fixture\.authoredLights/);
 assert.match(source,/shot\(f,'incoming-road'\)/);
});
