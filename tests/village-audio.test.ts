import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundscapePlayer} from '../src/view/soundscape-player.ts';
import * as audio from '../src/view/audio.ts';
import {ambienceAllowed} from '../src/ui/audio-preferences.ts';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {advanceVillagePresentation} from '../src/view/village-mood.ts';

// Web Audio is unavailable in Node. Record the real player's graph/scheduling
// boundary, including release; do not replace the player or its ownership logic.
function context(){
 const nodes:any[]=[],gains:any[]=[],filters:any[]=[],buffers:any[]=[];
 const parameter=()=>{const events:any[]=[];return {value:0,events,setValueAtTime(v:number,t:number){this.value=v;events.push(['set',v,t]);},linearRampToValueAtTime(v:number,t:number){events.push(['ramp',v,t]);},exponentialRampToValueAtTime(v:number,t:number){events.push(['exp',v,t]);},cancelScheduledValues(t:number){events.push(['cancel',t]);}};};
 const node=()=>({connections:[] as any[],disconnects:0,connect(target:any){this.connections.push(target);},disconnect(){this.disconnects++;}});
 const ctx:any={state:'running',currentTime:0,destination:{},
  createBuffer(_n:number,length:number,rate:number){const channels=[new Float32Array(length),new Float32Array(length)],buffer={sampleRate:rate,getChannelData:(i:number)=>channels[i]};buffers.push(buffer);return buffer;},
  createGain(){const gain={...node(),gain:parameter()};gains.push(gain);return gain;},
  createBiquadFilter(){const filter={...node(),type:'',frequency:parameter(),Q:parameter()};filters.push(filter);return filter;},
  createBufferSource(){const source={...node(),buffer:null,loop:false,onended:null,starts:0,stops:[] as number[],start(){this.starts++;},stop(t?:number){this.stops.push(t??ctx.currentTime);}};nodes.push(source);return source;},
  createOscillator(){const oscillator={...node(),type:'',frequency:parameter(),onended:null,starts:[] as number[],stops:[] as number[],start(t:number){this.starts.push(t);},stop(t:number){this.stops.push(t);}};nodes.push(oscillator);return oscillator;},
 };return {ctx,nodes,gains,filters,buffers};
}
const samples=()=>({sampleRate:16000,duration:24,left:new Float32Array([0,.05,0]),right:new Float32Array([0,.04,0])});
const calm={alarmMix:0,alarmSerial:0},alarm={alarmMix:1,alarmSerial:1};
test('mood changes reuse the chapter buffer and smoothly darken then restore its live graph',()=>{
 const c=context();let generated=0;const player=new SoundscapePlayer(()=>{generated++;return samples();});
 player.update(c.ctx,0,true,calm);c.ctx.currentTime=1;player.update(c.ctx,0,true,alarm);
 assert.equal(generated,1);assert.equal(c.buffers.length,1);assert.equal(c.filters.length,1,'a single low pass belongs to the bed');
 assert.equal(c.filters[0].type,'lowpass');assert.ok(c.filters[0].frequency.events.some((e:any[])=>e[1]===5000));
 assert.ok(c.gains[0].gain.events.some((e:any[])=>e[0]==='ramp'&&e[1]===.35));
 assert.ok(c.gains[0].gain.events.some((e:any[])=>e[0]==='ramp'&&Math.abs(e[1]-.22)<1e-9&&e[2]>=1.6));
 assert.ok(c.filters[0].frequency.events.some((e:any[])=>e[0]==='ramp'&&e[1]===1700&&e[2]>=1.6));
 c.ctx.currentTime=3;player.update(c.ctx,0,true,calm);assert.equal(generated,1);
 assert.ok(c.filters[0].frequency.events.some((e:any[])=>e[0]==='ramp'&&e[1]===5000&&e[2]>=3.6));
 player.dispose();assert.ok(c.filters.every(f=>f.disconnects===1));
});
test('watch accents have eight-second entry cooldown and sparse bounded low pulses without catch-up',()=>{
 const c=context(),player=new SoundscapePlayer(samples);player.update(c.ctx,2,true,calm);
 c.ctx.currentTime=1;player.update(c.ctx,2,true,alarm);
 assert.equal(c.nodes.filter(n=>n.frequency).length,1,'entry marks exactly once');
 for(let i=0;i<30;i++)player.update(c.ctx,2,true,alarm);
 assert.equal(c.nodes.filter(n=>n.frequency).length,1);
 c.ctx.currentTime=2.79;player.update(c.ctx,2,true,alarm);assert.equal(c.nodes.filter(n=>n.frequency).length,1);
 c.ctx.currentTime=2.8;player.update(c.ctx,2,true,alarm);assert.equal(c.nodes.filter(n=>n.frequency).length,2);
 assert.ok(c.gains.slice(1).every(g=>g.gain.events.filter((e:any[])=>e[0]==='set').every((e:any[])=>e[1]<=.015)));
 const pulse=c.nodes.filter(n=>n.frequency)[1];assert.equal(pulse.frequency.events[0][1],55);assert.ok(Math.abs(pulse.stops[0]-pulse.starts[0]-.25)<1e-9);
 assert.ok(c.gains[2].gain.events.some((e:any[])=>e[0]==='set'&&e[1]<=.012));
 // Browser onended may be delayed; the live accent pool must stay <=2.
 c.ctx.currentTime=30;player.update(c.ctx,2,true,{alarmMix:1,alarmSerial:2});
 assert.ok(c.nodes.filter(n=>n.frequency&&n.disconnects===0).length<=2);
 player.update(c.ctx,2,false,{alarmMix:1,alarmSerial:3});assert.ok(c.nodes.filter(n=>n.frequency).every(n=>n.disconnects===1));
 const previous=c.nodes.length;c.ctx.currentTime=100;player.update(c.ctx,2,true,{alarmMix:1,alarmSerial:3});assert.equal(c.nodes.length,previous+1,'only bed resumes; no hidden accents replay');
 player.dispose();assert.ok(c.nodes.every(n=>n.disconnects===1));
});
test('rapid re-alarm respects the entry cooldown, then permits its exact eight-second boundary',()=>{
 const c=context(),player=new SoundscapePlayer(samples);player.update(c.ctx,0,true,calm);
 c.ctx.currentTime=1;player.update(c.ctx,0,true,alarm);
 c.ctx.currentTime=4;player.update(c.ctx,0,true,{alarmMix:0,alarmSerial:1});player.update(c.ctx,0,true,{alarmMix:0,alarmSerial:2});
 assert.equal(c.nodes.filter(n=>n.frequency).length,1);
 c.ctx.currentTime=9;player.update(c.ctx,0,true,{alarmMix:0,alarmSerial:3});assert.equal(c.nodes.filter(n=>n.frequency).length,2);
 player.dispose();
});
test('every production audibility gate releases accents immediately and consumes hidden serials',()=>{
 const base:Parameters<typeof ambienceAllowed>[0]={sound:true,atmosphere:true,paused:false,hidden:false,tab:'battle',modal:null,phase:'running'};
 for(const change of [{sound:false},{atmosphere:false},{paused:true},{hidden:true},{tab:'cards'},{modal:'settings'},{phase:'won' as const},{phase:'lost' as const}]){
  const c=context(),player=new SoundscapePlayer(samples);player.update(c.ctx,0,true,calm);c.ctx.currentTime=1;player.update(c.ctx,0,true,alarm);
  player.update(c.ctx,0,ambienceAllowed({...base,...change}),{alarmMix:1,alarmSerial:2});
  assert.ok(c.nodes.filter(n=>n.frequency).every(n=>n.disconnects===1),JSON.stringify(change));
  const accents=c.nodes.filter(n=>n.frequency).length;c.ctx.currentTime=100;player.update(c.ctx,0,true,{alarmMix:1,alarmSerial:2});
  assert.equal(c.nodes.filter(n=>n.frequency).length,accents,'no gate queues old knocks/pulses');player.cancelPending();player.dispose();
  assert.ok(c.nodes.every(n=>n.disconnects===1));
 }
});
test('a real presentation hit and win/loss in one batch cannot emit a post-result watch accent',()=>{
 for(const phase of ['won','lost'] as const){
  const g=new Game(defaultProfile());g.dispatch({type:'start'});
  let owner=advanceVillagePresentation(null,g.state,0,.05,[],false);
  const c=context(),player=new SoundscapePlayer(samples);player.update(c.ctx,0,true,owner.mood);
  g.state.phase=phase;owner=advanceVillagePresentation(owner,g.state,0,0,[{type:'hit',target:'base',side:'enemy'},{type:phase==='won'?'win':'lose'}],false);
  assert.equal(owner.mood.alarmSerial,1,'the shared owner still records the actual fresh hit');
  player.update(c.ctx,0,ambienceAllowed({sound:true,atmosphere:true,paused:false,hidden:false,tab:'battle',modal:null,phase:g.state.phase}),owner.mood);
  assert.equal(c.nodes.filter(n=>n.frequency).length,0,'result gate suppresses the same-batch entry before playback');
  const finalMood=structuredClone(owner.mood),created=c.nodes.length;
  // Cover the full result-dialog delay while the actual battle stays terminal.
  for(let frame=1;frame<=27;frame++){
   c.ctx.currentTime=frame*.05;g.step(.05);
   owner=advanceVillagePresentation(owner,g.state,0,.05,g.drainEvents(),false);
   const audible=ambienceAllowed({sound:true,atmosphere:true,paused:false,hidden:false,tab:'battle',modal:null,phase:g.state.phase});
   player.update(c.ctx,0,audible,owner.mood);
   assert.equal(g.state.phase,phase);assert.equal(audible,false);assert.deepEqual(owner.mood,finalMood);
   assert.equal(g.canUseSkill('freeze'),false);assert.equal(g.deploymentStatus(0).allowed,false);
  }
  assert.equal(c.nodes.length,created,'the delay starts neither another bed nor an accent');player.dispose();
  assert.ok(c.nodes.every(n=>n.disconnects===1));
 }
});
test('parameter retargeting holds the interpolated gain, and accent start failures release budget once',()=>{
 const c=context();let slots=0,released=0;
 const player=new SoundscapePlayer(samples,{acquire(){slots++;return true;},release(){slots--;released++;}});
 player.update(c.ctx,0,true,calm);c.ctx.currentTime=1;player.update(c.ctx,0,true,alarm);
 c.ctx.currentTime=1.3;player.update(c.ctx,0,true,{alarmMix:0,alarmSerial:1});
 assert.ok(c.gains[0].gain.events.some((e:any[])=>e[0]==='set'&&Math.abs(e[1]-.285)<1e-9),'retarget without gain jump');
 const create=c.ctx.createOscillator;c.ctx.createOscillator=()=>{const n=create();n.start=()=>{throw Error('denied');};return n;};
 c.ctx.currentTime=9;player.update(c.ctx,0,true,{alarmMix:0,alarmSerial:2});assert.equal(slots,0);assert.equal(released,2);
 player.dispose();assert.equal(released,2);assert.ok(c.nodes.filter(n=>n.frequency).every(n=>n.disconnects===1));
});
test('pending mood changes use latest mix; rejected and stale chapters never retain accents',async()=>{
 const c=context(),pending:Array<{resolve:(p:any)=>void;reject:(e:any)=>void}>=[];
 const player=new SoundscapePlayer(()=>new Promise((resolve,reject)=>pending.push({resolve,reject})));
 player.update(c.ctx,0,true,calm);player.update(c.ctx,0,true,alarm);assert.equal(pending.length,1);
 pending[0].resolve(samples());await Promise.resolve();assert.ok(c.gains[0].gain.events.some((e:any[])=>e[0]==='ramp'&&Math.abs(e[1]-.22)<1e-9));
 c.ctx.currentTime=3;player.update(c.ctx,1,true,{alarmMix:1,alarmSerial:2});
 assert.ok(c.nodes.filter(n=>n.frequency).every(n=>n.disconnects===1),'chapter replacement releases accents');
 pending[1].reject(Error('worker failed'));await new Promise(resolve=>setImmediate(resolve));
 const previous=c.nodes.length;player.update(c.ctx,1,true,{alarmMix:1,alarmSerial:3});assert.equal(c.nodes.length,previous);
 player.retry();player.update(c.ctx,1,true,alarm);player.update(c.ctx,2,false,alarm);pending[2].resolve(samples());await Promise.resolve();assert.equal(c.nodes.length,previous);
 player.dispose();assert.ok(c.nodes.every(n=>n.disconnects===1));
});
test('Sound and Atmosphere gating share the global eight voices while combat can reclaim an accent',async()=>{
 audio.disposeAudio();const c=context();let created=0;
 const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext'),previousWorker=Object.getOwnPropertyDescriptor(globalThis,'Worker');
 c.ctx.resume=()=>Promise.resolve();c.ctx.suspend=()=>{c.ctx.state='suspended';return Promise.resolve();};c.ctx.close=()=>{c.ctx.state='closed';return Promise.resolve();};
 class Worker{onmessage:any;onerror:any;onmessageerror:any;postMessage(){queueMicrotask(()=>this.onmessage?.({data:samples()}));}terminate(){}}
 Object.defineProperty(globalThis,'Worker',{configurable:true,value:Worker});Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:class {constructor(){created++;return c.ctx;}}});
 try{
  audio.updateSoundscape(0,true,alarm);assert.equal(created,0);audio.unlockAudio();await new Promise(resolve=>setImmediate(resolve));
  c.ctx.currentTime=1;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:2});
  for(const kind of ['spawn','hit','coin','upgrade','win','lose','skill'])audio.sound(kind,true);
  assert.equal(c.nodes.filter(n=>n.frequency&&n.disconnects===0).length,8);
  audio.sound('evolve',true);assert.equal(c.nodes.filter(n=>n.frequency&&n.disconnects===0).length,8,'combat replaces rather than exceeds accent ceiling');
  audio.updateSoundscape(0,false,alarm);const count=c.nodes.length;c.ctx.currentTime=2;audio.sound('spawn',true);assert.equal(c.nodes.length,count,'all eight combat voices still count');
  for(const n of c.nodes.filter(n=>n.frequency))n.onended?.();audio.sound('hit',true);assert.equal(c.nodes.length,count+1,'Atmosphere off preserves combat');
  audio.suspendAudio();const stopped=c.nodes.length;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:4});audio.sound('coin',true);assert.equal(c.nodes.length,stopped);
 }finally{audio.disposeAudio();for(const [name,descriptor] of [['AudioContext',previous],['Worker',previousWorker]] as const){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete (globalThis as any)[name];}}
});
