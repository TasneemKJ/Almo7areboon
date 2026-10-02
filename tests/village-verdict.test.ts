import test from 'node:test';
import assert from 'node:assert/strict';

async function subject(){
 const module=await import('../src/view/village-verdict.ts').catch(error=>{
  if((error as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;
  throw error;
 });
 assert.ok(module,'village verdict presentation model must exist');
 return module;
}

test('only authoritative terminal phases produce a village verdict',async()=>{
 const m=await subject();
 for(const phase of ['ready','running'] as const)assert.equal(m.villageVerdictFrame({phase,elapsed:.6,reduced:false}),null);
 assert.deepEqual(m.villageVerdictFrame({phase:'won',elapsed:.6,reduced:false}),{mode:'celebrate',progress:1});
 assert.deepEqual(m.villageVerdictFrame({phase:'lost',elapsed:.6,reduced:false}),{mode:'shelter',progress:1});
 for(const phase of ['victory','defeat','',null,3])assert.equal(m.villageVerdictFrame({phase,elapsed:.6,reduced:false} as any),null);
});

test('the verdict settles over six tenths of a presentation second',async()=>{
 const m=await subject(),frame=(elapsed:number)=>{const value=m.villageVerdictFrame({phase:'won',elapsed,reduced:false});assert.ok(value);return value;};
 assert.equal(frame(0).progress,0);assert.equal(frame(.15).progress,.25);assert.equal(frame(.3).progress,.5);
 assert.equal(frame(.599).progress,.599/.6);assert.equal(frame(.6).progress,1);assert.equal(frame(99).progress,1);
});

test('reduced motion uses the complete static verdict while malformed time fails finite',async()=>{
 const m=await subject();
 for(const phase of ['won','lost'] as const){
  const reduced=m.villageVerdictFrame({phase,elapsed:0,reduced:true});
  assert.ok(reduced);
  assert.equal(reduced.progress,1);
  for(const elapsed of [NaN,Infinity,-Infinity,-4]){
   const frame=m.villageVerdictFrame({phase,elapsed,reduced:false});assert.ok(frame);assert.equal(frame.progress,0);assert.ok(Number.isFinite(frame.progress));
  }
 }
});

test('verdict frames are deeply immutable and never mutate their input',async()=>{
 const m=await subject(),input={phase:'won',elapsed:.2,reduced:false} as const,before=structuredClone(input);
 const frame=m.villageVerdictFrame(input);assert.ok(frame);assert.deepEqual(input,before);assert.ok(Object.isFrozen(frame));
 assert.throws(()=>{(frame as any).progress=9;},TypeError);
});
