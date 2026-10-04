import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const path='../scripts/village-watchfire-review.ts';
async function subject(){
 const module=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(module,'watchfire browser-review contract must exist');return module;
}
const region=(left:number)=>({left,top:180,right:left+8,bottom:198});
const state={number:1,intent:'volley',progress:.4,lights:2,strokes:6,regions:Array.from({length:8},(_,index)=>region(40+index*12)),reduced:true,paused:false};

test('native watchfire diagnostic requires matching intent, bounded marks and three strokes per lamp',async()=>{
 const m=await subject();assert.deepEqual(m.validateWatchfireSnapshot(state,'volley'),state);
 for(const bad of [
  {...state,number:0},{...state,number:6},{...state,number:NaN},{...state,intent:'rush'},{...state,progress:NaN},{...state,progress:1.1},{...state,lights:0},{...state,lights:5},
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
 assert.match(source,/watchfire\.reduced\|\|watchfire\.progress>=\.75/,'reduced motion may capture its intentionally complete static relay at any authoritative preview progress');
 const pauseAssertion=source.indexOf('assertWatchfirePaused(watchfire,pausedWatchfire)');
 const screenshotCallback=source.indexOf('await onObserved?.(paused)');
 assert.ok(pauseAssertion>=0&&screenshotCallback>pauseAssertion,'capture must happen only after the transient relay is frozen');
 assert.match(source,/async function renderedCanvasShot\(fixture,state\)/);
 assert.match(source,/node\.battlefieldReviewCanvasSnapshot/);
 assert.match(source,/renderedCanvasShot\(f,'incoming-road'\)/);
 assert.match(source,/p\.age=fixture\.age;p\.enemyAge=fixture\.age;p\.furthestBattle=fixture\.age/);
 assert.match(source,/p\.timeline=fixture\.timeline/,'desktop bulwark plates must use their authored longer opening');
 assert.match(source,/p\.mastery\.timeline=fixture\.timeline;p\.chronicle\.timeline=fixture\.timeline/,'serialized fixture timelines must remain internally consistent');
 assert.match(source,/p\.chronicle\.clears\[fixture\.age\]=1;p\.chronicle\.chapter=fixture\.age/);
 assert.match(source,/open\(fixture\.name,fixture\.width,fixture\.height,p,fixture\.reducedMotion\)/);
 assert.match(source,/pauseAtWaveArrival\(f\.page,fixture\.intent/);
 assert.match(source,/watchfire\.lights<=fixture\.authoredLights/);
 assert.match(source,/reduced\?fixture\.authoredLights/,'reduced-motion native evidence must require every authored lamp');
});

test('native chronicle journey observes the first authored warning before combat inputs and diagnoses timeouts',()=>{
 const source=readFileSync(new URL('../scripts/review-chronicle.mjs',import.meta.url),'utf8');
 const arrival=source.slice(source.indexOf('async function pauseAtWaveArrival'),source.indexOf('async function pauseAtCatMode'));
 assert.match(source,/p\.speed=1;p\.timeline=fixture\.timeline;p\.mastery\.timeline=fixture\.timeline;p\.chronicle\.timeline=fixture\.timeline;p\.age=fixture\.age/,'the review must preserve normal speed and the internally consistent authored fixture opening');
 assert.match(arrival,/Date\.now\(\)\+20000/,'the first authored wave must appear under a finite software-rendering ceiling');
 assert.ok((arrival.match(/arrival\.number!==1\|\|watchfire\.number!==1/g)??[]).length>=2,'observation and atomic pause recheck must both reject later matching waves');
 assert.doesNotMatch(arrival,/data-unit|data-skill|clickEnabled/,'warning evidence must precede troop and skill inputs so combat cannot manufacture a later matching wave');
 assert.match(arrival,/await page\.waitForTimeout\(25\)/,'the review must yield for the first production render instead of racing it');
 assert.match(arrival,/waveArrival:/);
 assert.match(arrival,/villageWatchfire:/);
 assert.match(arrival,/profile:/);
 assert.match(arrival,/Timed out pausing at \$\{intent\} wave arrival; diagnostic=/);
});
