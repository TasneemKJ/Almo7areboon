import test from 'node:test';
import assert from 'node:assert/strict';

const path='../scripts/chronicle-arrival-review.ts';
async function subject(){
 const module=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(module,'arrival browser-review contract must exist');return module;
}

test('native review fixtures cover three intent shapes across phone and desktop widths',async()=>{
 const m=await subject(),fixtures=m.arrivalReviewFixtures();
 assert.deepEqual(fixtures.map((fixture:any)=>[fixture.width,fixture.height,fixture.route,fixture.intent]),[
  [320,568,'escort','rush'],[390,844,'scout','volley'],[1024,768,'bell','bulwark'],
 ]);
 assert.ok(Object.isFrozen(fixtures)&&fixtures.every(Object.isFrozen));
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
