import test from 'node:test';
import assert from 'node:assert/strict';

async function subject(){
 const module=await import('../scripts/spoils-homecoming-review.ts').catch(error=>{
  if((error as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;
  throw error;
 });
 assert.ok(module,'the native spoils evidence validator is missing');return module;
}

const valid={count:1,cap:6,height:430,marks:[{order:7,amount:37,age:.2,x:242,y:190,alpha:1}],reduced:false,paused:false};

test('native evidence accepts one finite bounded homeward reward',async()=>{
 const m=await subject();assert.doesNotThrow(()=>m.validateSpoilsHomecomingSnapshot(valid,false,false));
});

test('native evidence rejects malformed, excess, off-stage and reduced-motion travel',async()=>{
 const m=await subject();
 for(const state of [
  {...valid,count:2},
  {...valid,cap:7},
  {...valid,height:0},
  {...valid,marks:[{...valid.marks[0],age:.9}]},
  {...valid,marks:[{...valid.marks[0],x:23}]},
  {...valid,marks:[{...valid.marks[0],x:427}]},
  {...valid,marks:[{...valid.marks[0],alpha:.34}]},
  {...valid,marks:[{...valid.marks[0],alpha:1.1}]},
  {...valid,marks:[{...valid.marks[0],y:431}]},
  {...valid,marks:[{...valid.marks[0],order:0}]},
  {...valid,reduced:true},
 ])assert.throws(()=>m.validateSpoilsHomecomingSnapshot(state,false,false),assert.AssertionError);
});

test('native evidence follows the same visible token closer to home across active frames',async()=>{
 const m=await subject(),progressed={...valid,marks:[{...valid.marks[0],age:.28,x:198,y:170,alpha:.9}]};
 assert.doesNotThrow(()=>m.assertSpoilsHomecomingProgress(valid,progressed));
 for(const after of [
  {...progressed,marks:[{...progressed.marks[0],order:8}]},
  {...progressed,marks:[{...progressed.marks[0],age:.2}]},
  {...progressed,marks:[{...progressed.marks[0],x:260}]},
  {...progressed,marks:[{...progressed.marks[0],alpha:.2}]},
 ])assert.throws(()=>m.assertSpoilsHomecomingProgress(valid,after),assert.AssertionError);
});

test('public pause evidence changes only the paused flag',async()=>{
 const m=await subject(),paused={...valid,paused:true};
 assert.doesNotThrow(()=>m.assertSpoilsHomecomingPaused(valid,paused));
 assert.throws(()=>m.assertSpoilsHomecomingPaused(valid,{...paused,marks:[{...paused.marks[0],age:.36}]}),assert.AssertionError);
});

test('reduced-motion evidence retains a visible truthful numeric reward cue',async()=>{
 const m=await subject(),cue={amount:37,text:'+37',alpha:1,reduced:true};
 assert.doesNotThrow(()=>m.validateSpoilsStaticReward(cue,true));
 for(const malformed of [
  {...cue,amount:0},
  {...cue,text:'37'},
  {...cue,alpha:.34},
  {...cue,reduced:false},
 ])assert.throws(()=>m.validateSpoilsStaticReward(malformed,true),assert.AssertionError);
});
