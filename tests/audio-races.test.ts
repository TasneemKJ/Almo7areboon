import test from 'node:test';
import assert from 'node:assert/strict';
import * as audio from '../src/view/audio.ts';
import {SoundscapePlayer} from '../src/view/soundscape-player.ts';
import {recordedContext,installContext} from './helpers/audio-context.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const pcm=(age=0)=>({sampleRate:16000,duration:24,left:new Float32Array([0,.05+age*.01,0]),right:new Float32Array([0,.04,0])});
function pendingHarness(){
 audio.disposeAudio();audio.updateAudioMix({effects:100,atmosphere:100});const old=recordedContext(),fresh=recordedContext();let contexts=0,attempts=0,maxWorkers=0,failure='';
 const restore=installContext(old,()=>contexts++===0?old.ctx:fresh.ctx),workers:any[]=[];
 class PendingWorker {
  onmessage:any;onerror:any;onmessageerror:any;age=-1;terminated=0;requests:any[]=[];
  constructor(){attempts++;if(failure==='constructor')throw Error('worker constructor denied');workers.push(this);maxWorkers=Math.max(maxWorkers,workers.filter(w=>w.terminated===0).length);}
  postMessage(request:any){if(failure==='postMessage')throw Error('worker transfer denied');this.age=request.age;this.requests.push(request);}
  terminate(){this.terminated++;}
 }
 Object.defineProperty(globalThis,'Worker',{configurable:true,value:PendingWorker});
 return {old,fresh,workers,contexts:()=>contexts,attempts:()=>attempts,maxWorkers:()=>maxWorkers,fail:(operation:string)=>{failure=operation;},complete(worker:any){assert.ok(worker.onmessage,'current request remains reachable');worker.onmessage({data:pcm(worker.age)});},
  close(){audio.disposeAudio();audio.updateAudioMix({effects:100,atmosphere:100});restore();}};
}
test('latestMixWinsPendingGeneration',async()=>{
 const h=pendingHarness();try{
  audio.updateSoundscape(0,true);assert.equal(h.attempts(),0);audio.unlockAudio();assert.equal(h.workers.length,1);const stale0=h.workers[0].onmessage;
  audio.updateSoundscape(1,true);const stale1=h.workers[1].onmessage;assert.equal(h.workers[0].terminated,1);
  audio.updateAudioMix({effects:50,atmosphere:25});audio.updateSoundscape(1,false);audio.suspendAudio();assert.equal(h.workers[1].terminated,1);
  stale0({data:pcm(0)});stale1({data:pcm(1)});await tick();assert.equal(h.old.sources.length,0);
  audio.updateSoundscape(3,true);audio.updateAudioMix({effects:75,atmosphere:50});assert.equal(h.attempts(),2,'mute/hidden intent cannot start a worker');
  audio.unlockAudio();await tick();assert.equal(h.workers.length,3);assert.equal(h.workers[2].age,3);h.complete(h.workers[2]);await tick();
  assert.equal(h.old.sources.length,1);assert.ok(Math.abs(h.old.sources[0].buffer.getChannelData(0)[1]-.08)<1e-7,'only latest chapter buffer starts');
  assert.equal(h.old.sources[0].starts.length,1);assert.equal(h.old.gains[2].connections[0],h.old.gains[1]);
  assert.equal(h.old.gains[0].gain.events.at(-1)[1],.75);assert.equal(h.old.gains[1].gain.events.at(-1)[1],.5);
  audio.updateSoundscape(3,true,{alarmMix:1,alarmSerial:1});audio.updateAudioMix({effects:0,atmosphere:0});assert.equal(h.attempts(),3,'mood/level updates never regenerate PCM');assert.equal(h.maxWorkers(),1);
 }finally{h.close();}
});
test('a completed worker during modal silence caches the same chapter using latest independent mix on return',async()=>{
 const h=pendingHarness();try{
  audio.updateSoundscape(2,true);audio.unlockAudio();audio.updateSoundscape(2,false);audio.updateAudioMix({effects:50,atmosphere:0});h.complete(h.workers[0]);await tick();
  assert.equal(h.old.sources.length,0);audio.updateSoundscape(2,true);assert.equal(h.old.sources.length,1);assert.equal(h.attempts(),1);
  assert.equal(h.old.gains[1].gain.events.at(-1)[1],0);assert.equal(h.old.gains[2].connections[0],h.old.gains[1]);
  audio.playCombatEvents([{type:'skill',skill:'food'}],true);assert.equal(h.old.live(),1);assert.equal(h.old.gains.at(-1).connections[0],h.old.gains[0]);assert.equal(h.maxWorkers(),1);
 }finally{h.close();}
});
test('worker constructor/postMessage and source construction failures wait for a new gesture rather than retry every frame',async()=>{
 for(const operation of ['constructor','postMessage','bed-source','bed-start']){
  const h=pendingHarness();try{
   if(operation==='constructor'||operation==='postMessage')h.fail(operation);else h.old.fail(operation);
   audio.updateSoundscape(1,true);audio.unlockAudio();if(operation.startsWith('bed-'))h.complete(h.workers[0]);await tick();
   const attempts=h.attempts(),nodes=[h.old.sources.length,h.old.gains.length,h.old.filters.length];for(let i=0;i<120;i++)audio.updateSoundscape(1,true);assert.equal(h.attempts(),attempts,operation);assert.deepEqual([h.old.sources.length,h.old.gains.length,h.old.filters.length],nodes,'failed construction cannot allocate again each frame');assert.ok(h.old.sources.every(source=>source.starts.length===0));
   assert.ok(h.workers.every(worker=>worker.terminated===1));assert.ok(h.old.sources.every(source=>source.onended===null));
   h.fail('');h.old.fail('');audio.unlockAudio();await tick();const pending=h.workers.find(worker=>!worker.terminated);if(pending){h.complete(pending);await tick();}
   assert.equal(h.old.sources.filter(source=>source.starts.length===1&&source.disconnects===0).length,1,operation);assert.equal(h.maxWorkers()<=1,true);
  }finally{h.close();}
 }
});
test('rejected and late interrupted resumes preserve newest chapter/mix and require a fresh enabled gesture after suspension',async()=>{
 const h=pendingHarness();try{
  h.old.ctx.state='interrupted';h.old.ctx.resume=()=>Promise.reject(Error('resume denied'));audio.updateSoundscape(0,true);audio.unlockAudio();await tick();assert.equal(h.attempts(),0);
  let finish:()=>void=()=>{};h.old.ctx.resume=()=>new Promise<void>(resolve=>{finish=()=>{h.old.ctx.state='running';resolve();};});
  audio.unlockAudio();audio.updateSoundscape(4,true);audio.updateAudioMix({effects:25,atmosphere:75});audio.suspendAudio();finish();await tick();assert.equal(h.old.ctx.state,'suspended');assert.equal(h.attempts(),0);
  audio.updateSoundscape(5,true);assert.equal(h.attempts(),0);h.old.ctx.resume=()=>{h.old.ctx.state='running';return Promise.resolve();};audio.unlockAudio();await tick();
  assert.equal(h.workers[0].age,5);h.complete(h.workers[0]);await tick();assert.equal(h.old.sources.length,1);assert.equal(h.old.gains[0].gain.events.at(-1)[1],.25);assert.equal(h.old.gains[1].gain.events.at(-1)[1],.75);assert.equal(h.contexts(),1);
 }finally{h.close();}
});
test('pending synthesis and late resume from an old context cannot attach to replacement buses',async()=>{
 const h=pendingHarness();try{
  h.old.ctx.state='suspended';let finish:()=>void=()=>{};h.old.ctx.resume=()=>new Promise<void>(resolve=>{finish=()=>{h.old.ctx.state='running';resolve();};});
  audio.updateSoundscape(0,true);audio.unlockAudio();assert.equal(h.attempts(),0);h.old.ctx.state='closed';audio.updateSoundscape(4,true);audio.updateAudioMix({effects:25,atmosphere:50});audio.unlockAudio();
  assert.equal(h.contexts(),2);assert.equal(h.workers[0].age,4);finish();await tick();assert.equal(h.old.sources.length,0);assert.ok(h.old.gains.every(gain=>gain.disconnects===1));
  assert.deepEqual(h.fresh.gains.map(gain=>gain.gain.events[0][1]),[.25,.5]);h.complete(h.workers[0]);await tick();
  audio.updateSoundscape(5,true);const stale=h.workers[1].onmessage;audio.updateSoundscape(1,true);assert.equal(h.workers[1].terminated,1);stale({data:pcm(5)});await tick();assert.equal(h.fresh.sources.length,1);
  h.complete(h.workers[2]);await tick();assert.equal(h.fresh.sources.length,2);assert.ok(Math.abs(h.fresh.sources[1].buffer.getChannelData(0)[1]-.06)<1e-7);
  assert.equal(h.old.sources.length,0);assert.ok(h.fresh.sources.filter(source=>source.disconnects===0).length<=2);assert.equal(h.maxWorkers(),1);
 }finally{h.close();}
});
test('replacementKeepsBudgets',async()=>{
 const h=pendingHarness();try{
  audio.updateSoundscape(0,true);audio.unlockAudio();h.complete(h.workers[0]);await tick();
  h.old.ctx.currentTime=3;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:0});h.old.ctx.currentTime=3.01;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:1});assert.equal(h.old.live(),2);
  for(let i=0;i<6;i++)audio.playCombatEvents([{type:'upgrade'}],true);assert.equal(h.old.live(),8);const oldCallbacks=h.old.oscillators.map(node=>node.onended);
  audio.updateAudioMix({effects:50,atmosphere:25});h.old.ctx.state='closed';audio.unlockAudio();assert.equal(h.old.live(),0);assert.ok(h.old.sources.every(node=>node.disconnects===1));assert.ok(h.old.gains.every(node=>node.disconnects===1));
  assert.equal(h.contexts(),2);assert.deepEqual(h.fresh.gains.map(g=>g.gain.events[0][1]),[.5,.25]);h.complete(h.workers[1]);await tick();
  h.fresh.ctx.currentTime=3;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:1});h.fresh.ctx.currentTime=3.01;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:2});assert.equal(h.fresh.live(),2);
  for(let i=0;i<6;i++)audio.playCombatEvents([{type:'upgrade'}],true);for(const callback of oldCallbacks)callback();assert.equal(h.fresh.live(),8);
  const ordinary=h.fresh.oscillators.slice(2);audio.playCombatEvents([{type:'skill',skill:'freeze'}],true);audio.playCombatEvents([{type:'skill',skill:'food'}],true);assert.equal(h.fresh.live(),8);assert.ok(ordinary.every(node=>node.disconnects===0));
  const count=h.fresh.oscillators.length;audio.playCombatEvents([{type:'skill',skill:'meteor'}],true);assert.equal(h.fresh.oscillators.length,count,'capacity drops without a replay queue');
  audio.disposeAudio();audio.disposeAudio();assert.equal(h.fresh.live(),0);assert.ok(h.fresh.sources.every(node=>node.disconnects===1));assert.ok(h.fresh.gains.every(node=>node.disconnects===1));assert.equal(h.maxWorkers(),1);
 }finally{h.close();}
});
test('replacing player output cancels pending work and releases incompatible beds/accents while identical output never restarts',async()=>{
 const c=recordedContext(),outputs=[c.ctx.createGain(),c.ctx.createGain()],pending:Array<(x:any)=>void>=[];let slots=0,peakSlots=0;
 const player=new SoundscapePlayer(()=>new Promise(resolve=>pending.push(resolve)),{acquire(){if(slots===2)return false;slots++;peakSlots=Math.max(peakSlots,slots);return true;},release(){slots--;}});
 try{
  player.update(c.ctx,0,true,undefined,outputs[0]);player.update(c.ctx,0,true,undefined,outputs[1]);pending[0](pcm(0));await tick();assert.equal(c.sources.length,0);pending[1](pcm(0));await tick();assert.equal(c.gains[2].connections[0],outputs[1]);
  for(let i=0;i<60;i++)player.update(c.ctx,0,true,undefined,outputs[1]);assert.equal(pending.length,2);assert.equal(c.sources.length,1);
  c.ctx.currentTime=3;player.update(c.ctx,0,true,{alarmMix:1,alarmSerial:0},outputs[1]);c.ctx.currentTime=3.01;player.update(c.ctx,0,true,{alarmMix:1,alarmSerial:1},outputs[1]);assert.equal(slots,2);const callbacks=c.oscillators.map(node=>node.onended);
  player.update(c.ctx,0,true,undefined,outputs[0]);assert.equal(slots,0);assert.equal(c.sources[0].disconnects,1);for(const callback of callbacks)callback();assert.equal(slots,0);pending[2](pcm(0));await tick();
  for(let age=1;age<6;age++){player.update(c.ctx,age,true,undefined,outputs[0]);pending.at(-1)!(pcm(age));await tick();assert.ok(c.sources.filter(node=>node.disconnects===0).length<=2);}
  assert.equal(peakSlots,2);player.dispose();player.dispose();assert.equal(slots,0);assert.ok(c.sources.every(node=>node.disconnects===1));
 }finally{player.dispose();}
});
for(const transition of ['start-failure','dispose-bed','dispose-accent','accent-construction-failure'])test(`player ${transition} attempts later node cleanup even when its first disconnect throws`,()=>{
 const c=recordedContext();let slots=0;
 const player=new SoundscapePlayer(()=>pcm(),{acquire(){slots++;return true;},release(){slots--;}});
 try{
  if(transition==='start-failure'){
   c.fail('bed-start');const create=c.ctx.createBufferSource;c.ctx.createBufferSource=()=>{const node=create();node.disconnect=()=>{throw Error('source disconnect denied');};return node;};
   player.update(c.ctx,0,true);assert.equal(c.gains[0].disconnects,1,'partial bed gain must still release');assert.equal(c.filters[0].disconnects,1,'partial filter must still release');assert.equal(c.sources[0].onended,null);
  }else{
   player.update(c.ctx,0,true);
   if(transition==='dispose-bed'){
    c.sources[0].disconnect=()=>{throw Error('source disconnect denied');};player.dispose();assert.equal(c.gains[0].disconnects,1,'bed gain must still release');assert.equal(c.filters[0].disconnects,1,'filter must still release');
   }else if(transition==='accent-construction-failure'){
    c.fail('frequency');const create=c.ctx.createOscillator;c.ctx.createOscillator=()=>{const node=create();node.disconnect=()=>{throw Error('accent disconnect denied');};return node;};
    c.ctx.currentTime=3;player.update(c.ctx,0,true,{alarmMix:1,alarmSerial:1});assert.equal(slots,0);assert.equal(c.gains[1].disconnects,1,'partial accent gain must still release');
   }else{
    c.ctx.currentTime=3;player.update(c.ctx,0,true,{alarmMix:1,alarmSerial:1});assert.equal(slots,1);c.oscillators[0].disconnect=()=>{throw Error('accent disconnect denied');};const late=c.oscillators[0].onended;
    player.update(c.ctx,0,false);assert.equal(c.gains[1].disconnects,1,'accent gain must still release');assert.equal(slots,0);late();assert.equal(slots,0);
   }
  }
 }finally{player.dispose();}
});
