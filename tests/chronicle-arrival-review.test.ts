import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {preparedChronicleProfile} from '../scripts/simulate-chronicle.ts';

const path='../scripts/chronicle-arrival-review.ts';
async function subject(){
 const module=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(module,'arrival browser-review contract must exist');return module;
}

test('native review fixtures cover three intent shapes, all village plates and both motion modes across phone and desktop widths',async()=>{
 const m=await subject(),fixtures=m.arrivalReviewFixtures();
 assert.deepEqual(fixtures.map((fixture:any)=>[fixture.width,fixture.height,fixture.route,fixture.intent,fixture.age,fixture.authoredLights,fixture.reducedMotion]),[
  [320,568,'escort','rush',0,2,'reduce'],[390,844,'scout','volley',1,2,'no-preference'],
  [1024,768,'bell','bulwark',2,3,'reduce'],[320,568,'escort','rush',3,4,'no-preference'],
  [390,844,'scout','volley',4,3,'reduce'],[1024,768,'bell','bulwark',5,4,'no-preference'],
 ]);
 assert.deepEqual(fixtures.map((fixture:any)=>fixture.age),[0,1,2,3,4,5]);
 assert.ok(Object.isFrozen(fixtures)&&fixtures.every(Object.isFrozen));
});

test('each configured Chronicle fixture exposes its commander on the first authoritative wave',async()=>{
 const m=await subject();
 for(const fixture of m.arrivalReviewFixtures()){
  const profile=preparedChronicleProfile();profile.age=fixture.age;profile.enemyAge=fixture.age;profile.furthestBattle=fixture.age;profile.chronicle!.clears[fixture.age]=1;profile.chronicle!.chapter=fixture.age;profile.chronicle!.route=fixture.route;profile.chronicle!.expedition=null;
  const game=new Game(profile),preview=game.waveStatus().preview;
  assert.equal(preview?.number,1);assert.equal(preview?.intent,fixture.intent);assert.ok(preview&&preview.nextIn>=3&&preview.nextIn<=4);
 }
});

test('native diagnostic validation requires exact intent, role composition, geometry and depth',async()=>{
 const m=await subject(),state={intent:'volley',counts:[1,2,0],nextIn:2.4,progress:.4,banner:'split-pennant',roleShapes:['footprints','sling-stitches','sling-stitches'],knots:4,x:376,y:267,depth:257,baseDepth:272,actorFrontDepth:258.3,reduced:true,paused:false};
 assert.deepEqual(m.validateArrivalSnapshot(state,'volley'),state);
 for(const bad of [
  {...state,intent:'rush'}, {...state,nextIn:4.1}, {...state,progress:NaN}, {...state,knots:3},
  {...state,counts:[0,0,0]}, {...state,depth:259}, {...state,banner:'weighted-square'}, {...state,roleShapes:[]},
 ])assert.throws(()=>m.validateArrivalSnapshot(bad,'volley'));
});

test('paused native comparison allows only the pause flag to change',async()=>{
 const m=await subject(),before={intent:'rush',counts:[2,0,0],nextIn:1.5,progress:.625,banner:'swallowtail',roleShapes:['footprints','footprints'],knots:4,x:376,y:267,depth:257,baseDepth:272,actorFrontDepth:258.3,reduced:true,paused:false},after={...before,paused:true};
 assert.doesNotThrow(()=>m.assertArrivalPaused(before,after));
 assert.throws(()=>m.assertArrivalPaused(before,{...after,nextIn:1.4}));
});
