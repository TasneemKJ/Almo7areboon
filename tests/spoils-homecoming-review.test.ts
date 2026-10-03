import test from 'node:test';
import assert from 'node:assert/strict';

async function subject(){
 const module=await import('../scripts/spoils-homecoming-review.ts').catch(error=>{
  if((error as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;
  throw error;
 });
 assert.ok(module,'the native spoils evidence validator is missing');return module;
}

const valid={count:1,cap:6,marks:[{amount:37,age:.35,x:242,y:190,alpha:1}],reduced:false,paused:false};

test('native evidence accepts one finite bounded homeward reward',async()=>{
 const m=await subject();assert.doesNotThrow(()=>m.validateSpoilsHomecomingSnapshot(valid,false,false));
});

test('native evidence rejects malformed, excess, off-stage and reduced-motion travel',async()=>{
 const m=await subject();
 for(const state of [
  {...valid,count:2},
  {...valid,cap:7},
  {...valid,marks:[{...valid.marks[0],age:.9}]},
  {...valid,marks:[{...valid.marks[0],x:451}]},
  {...valid,marks:[{...valid.marks[0],alpha:1.1}]},
  {...valid,reduced:true},
 ])assert.throws(()=>m.validateSpoilsHomecomingSnapshot(state,false,false),assert.AssertionError);
});

test('public pause evidence changes only the paused flag',async()=>{
 const m=await subject(),paused={...valid,paused:true};
 assert.doesNotThrow(()=>m.assertSpoilsHomecomingPaused(valid,paused));
 assert.throws(()=>m.assertSpoilsHomecomingPaused(valid,{...paused,marks:[{...paused.marks[0],age:.36}]}),assert.AssertionError);
});
