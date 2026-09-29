import test from 'node:test';
import assert from 'node:assert/strict';
async function module(){const path='../src/view/soundscape-worker-client.ts';const m=await import(path).catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return null;throw e;});assert.ok(m,'off-main-thread synthesis bridge must exist');return m;}
function workers(){const made:any[]=[];return {made,create:()=>{const w={onmessage:null,onerror:null,onmessageerror:null,terminations:0,requests:[],terminate(){this.terminations++;},postMessage(msg:any){(this.requests as any[]).push(msg);}};made.push(w);return w;}};}
const pcm={sampleRate:16000,duration:24,left:new Float32Array([0,.05,0]),right:new Float32Array([0,.04,0])};
test('worker completion returns PCM and releases the worker immediately',async()=>{
 const m=await module(),w=workers(),bridge=m.createSoundscapeSynthesis(w.create);
 const result=bridge.generate(3);assert.equal(w.made.length,1);assert.deepEqual(w.made[0].requests,[{age:3}]);
 w.made[0].onmessage({data:pcm});assert.deepEqual(await result,pcm);assert.equal(w.made[0].terminations,1);bridge.dispose();assert.equal(w.made[0].terminations,1);
});
test('new synthesis cancels the old worker; stale messages cannot satisfy the new request',async()=>{
 const m=await module(),w=workers(),bridge=m.createSoundscapeSynthesis(w.create);
 const first=bridge.generate(0).catch(()=>null),stale=w.made[0].onmessage;
 const second=bridge.generate(1);assert.equal(await first,null);assert.equal(w.made[0].terminations,1);
 stale({data:pcm});assert.equal(w.made[1].terminations,0);w.made[1].onmessage({data:pcm});assert.deepEqual(await second,pcm);bridge.dispose();
});
test('worker failure, malformed data and disposal reject safely without retaining a thread',async()=>{
 const m=await module();for(const failure of ['error','message','dispose']){
  const w=workers(),bridge=m.createSoundscapeSynthesis(w.create),result=bridge.generate(2);
  const rejected=assert.rejects(result);
  if(failure==='error')w.made[0].onerror({preventDefault(){}});else if(failure==='message')w.made[0].onmessage({data:{invalid:true}});else bridge.dispose();
  await rejected;assert.equal(w.made[0].terminations,1);bridge.dispose();assert.equal(w.made[0].terminations,1);
 }
});
