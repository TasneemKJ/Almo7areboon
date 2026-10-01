import test from 'node:test';
import assert from 'node:assert/strict';
import * as audio from '../src/view/audio.ts';
import type {GameEvent} from '../src/game/types.ts';
import type {CombatCueId} from '../src/view/combat-cues.ts';
import {recordedContext,installContext} from './helpers/audio-context.ts';
const hit:GameEvent={type:'hit'},skill:GameEvent={type:'skill',skill:'freeze'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){audio.disposeAudio();const c=recordedContext(),restore=installContext(c);audio.unlockAudio();return {...c,close(){audio.disposeAudio();restore();}};}
const cueIds:CombatCueId[]=['story-rally','story-bell','story-shatter','story-protect','story-cover','story-breach','story-landmark','story-rescue','deploy','hit-neutral','hit-blunt','hit-flick','hit-hollow','base-player','base-enemy','coin','freeze','meteor','food','upgrade','evolve','win','lose','death','summon'];
test('audioClockCooldownBoundaries',()=>{
 for(const [event,other,interval] of [
  [{type:'spawn',side:'player'},{type:'spawn',side:'player'},.120],
  [hit,{type:'hit',source:{kind:2}},.090],
  [{type:'hit',target:'base',side:'enemy'},{type:'hit',target:'base',side:'player'},.180],
  [{type:'coin'},{type:'coin'},.250],
 ] as [GameEvent,GameEvent,number][]){
  const h=harness();try{
   audio.playCombatEvents([event],true);assert.equal(h.oscillators.length,1);
   h.ctx.currentTime=1+interval-.000001;audio.playCombatEvents([other],true);assert.equal(h.oscillators.length,1);
   h.ctx.currentTime=1+interval;audio.playCombatEvents([other],true);assert.equal(h.oscillators.length,2);
  }finally{h.close();}
 }
});
test('speedCannotCompressCooldowns',()=>{
 const starts:number[][]=[];
 for(const speed of [1,2]){const h=harness();try{
  for(let frame=0;frame<30;frame++){h.ctx.currentTime=1+frame*.02;audio.playCombatEvents([{...hit,amount:frame*speed}],true);}
  starts.push(h.oscillators.flatMap(n=>n.starts));audio.stopCombatAudio();const count=h.oscillators.length;
  h.ctx.currentTime=50;for(let frame=0;frame<100;frame++)audio.playCombatEvents([hit],false);
  assert.equal(h.oscillators.length,count);audio.playCombatEvents([hit],true);assert.equal(h.oscillators.length,count+1);
 }finally{h.close();}}
 assert.deepEqual(starts[0],starts[1]);
});
test('ordinaryAndCriticalCapacity',async()=>{
 const h=harness();try{
  audio.updateSoundscape(0,true,{alarmMix:0,alarmSerial:0});await tick();
  h.ctx.currentTime=3;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:0});
  h.ctx.currentTime=3.01;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:1});assert.equal(h.live(),2);
  for(let i=0;i<6;i++)audio.playCombatEvents([{type:'upgrade'}],true);assert.equal(h.live(),8);
  let count=h.oscillators.length;audio.playCombatEvents([{type:'evolve'}],true);assert.equal(h.oscillators.length,count,'six ordinary slots occupied');
  const effectNodes=h.oscillators.slice(2);audio.playCombatEvents([skill],true);assert.equal(h.live(),8);
  audio.playCombatEvents([{type:'hit',target:'base',side:'enemy'}],true);assert.equal(h.live(),8);
  assert.ok(effectNodes.every(n=>n.disconnects===0),'never preempt an effect');
  count=h.oscillators.length;audio.playCombatEvents([{type:'win'}],true);assert.equal(h.oscillators.length,count,'eight effect/critical voices drop new critical');
  audio.stopCombatAudio();assert.equal(h.live(),0);
  audio.playCombatEvents([{type:'coin'},hit,{type:'win'}],true);assert.equal(h.live(),1);assert.ok(Math.abs(h.oscillators.at(-1).stops[0]-h.ctx.currentTime-.6)<1e-9);
 }finally{h.close();}
});
test('ordinary cue cannot reclaim an accent even below its six-slot ceiling',async()=>{
 const h=harness();try{
  audio.updateSoundscape(0,true,{alarmMix:0,alarmSerial:0});await tick();
  h.ctx.currentTime=3;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:0});
  h.ctx.currentTime=3.01;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:1});
  for(let i=0;i<5;i++)audio.playCombatEvents([{type:'upgrade'}],true);
  audio.playCombatEvents([skill],true);assert.equal(h.live(),8);
  const accents=h.oscillators.slice(0,2),count=h.oscillators.length;
  audio.playCombatEvents([{type:'coin'}],true);
  assert.equal(h.oscillators.length,count,'ordinary capacity drop never reclaims an ambient slot');
  assert.ok(accents.every(n=>n.disconnects===0));
  audio.playCombatEvents([{type:'skill',skill:'food'}],true);assert.equal(h.live(),8);
  assert.equal(accents.filter(n=>n.disconnects===1).length,1,'critical cue may reclaim one accent');
  h.oscillators[2].onended();audio.playCombatEvents([{type:'coin'}],true);
  assert.equal(h.live(),8,'capacity drop did not consume coin cooldown');
 }finally{h.close();}
});
test('failed start and capacity drops consume no cooldown',()=>{
 const h=harness();try{
  h.fail('start');audio.playCombatEvents([hit],true);assert.equal(h.live(),0);h.fail('');audio.playCombatEvents([hit],true);assert.equal(h.live(),1);
  audio.stopCombatAudio();for(let i=0;i<6;i++)audio.playCombatEvents([{type:'upgrade'}],true);
  audio.playCombatEvents([{type:'coin'}],true);h.oscillators.at(-1).onended();
  const count=h.oscillators.length;audio.playCombatEvents([{type:'coin'}],true);assert.equal(h.oscillators.length,count+1);
 }finally{h.close();}
});
test('renderer releases partial nodes exactly once on every failure and late callback',()=>{
 for(const operation of ['oscillator','gain','connect','frequency','envelope','start','stop']){
  const c=recordedContext();c.fail(operation);let released=0;
  assert.equal(audio.renderCombatCue(c.ctx,c.ctx.destination,'win',1,()=>released++),undefined,operation);
  assert.equal(released,1,operation);assert.equal(c.live(),0);assert.ok(c.oscillators.every(n=>n.onended===null));assert.ok(c.gains.every(n=>n.disconnects===1));
 }
 const c=recordedContext();let released=0;const voice=audio.renderCombatCue(c.ctx,c.ctx.destination,'coin',1,()=>released++);
 const late=c.oscillators[0].onended;voice!.dispose();voice!.dispose();late();assert.equal(released,1);assert.equal(c.live(),0);
 const natural=audio.renderCombatCue(c.ctx,c.ctx.destination,'coin',2,()=>released++);c.oscillators[1].onended();natural!.dispose();assert.equal(released,2);
});
test('cleanupOwnsOneContext',()=>{
 audio.disposeAudio();const old=recordedContext(),fresh=recordedContext();let count=0;const restore=installContext(old,()=>count++?fresh.ctx:old.ctx);
 try{
  audio.unlockAudio();for(let i=0;i<6;i++)audio.playCombatEvents([{type:'upgrade'}],true);const late=old.oscillators.map(n=>n.onended);
  audio.suspendAudio();audio.suspendAudio();assert.equal(old.live(),0);audio.unlockAudio();audio.playCombatEvents([hit],true);audio.disposeAudio();
  audio.unlockAudio();for(let i=0;i<6;i++)audio.playCombatEvents([{type:'upgrade'}],true);for(const callback of late)callback();
  audio.playCombatEvents([{type:'upgrade'}],true);assert.equal(fresh.live(),6,'old callbacks cannot release replacement slots');
  audio.playCombatEvents([skill],true);audio.playCombatEvents([skill],true);audio.playCombatEvents([skill],true);assert.equal(fresh.live(),8);
  audio.disposeAudio();audio.disposeAudio();assert.equal(fresh.live(),0);
 }finally{audio.disposeAudio();restore();}
});
test('closed context replacement stops old handles and resets cooldowns',()=>{
 audio.disposeAudio();const old=recordedContext(),fresh=recordedContext();let count=0;const restore=installContext(old,()=>count++?fresh.ctx:old.ctx);
 try{audio.unlockAudio();audio.playCombatEvents([hit],true);const late=old.oscillators[0].onended;old.ctx.state='closed';audio.unlockAudio();assert.equal(old.live(),0);
  audio.playCombatEvents([hit],true);assert.equal(fresh.live(),1);late();for(let i=0;i<5;i++)audio.playCombatEvents([{type:'upgrade'}],true);
  audio.playCombatEvents([{type:'upgrade'}],true);assert.equal(fresh.live(),6);
 }finally{audio.disposeAudio();restore();}
});
test('onsetAndResultDuration',()=>{
 const shapes=new Map<string,string>();
 for(const id of cueIds){const c=recordedContext();let released=0;const voice=audio.renderCombatCue(c.ctx,c.ctx.destination,id,1,()=>released++);assert.ok(voice,id);
  assert.equal(c.oscillators.length,1);assert.equal(c.gains.length,1);const envelope=c.gains[0].gain.events,osc=c.oscillators[0];
  assert.deepEqual(envelope[0],['set',0,1]);assert.ok(envelope[1][2]-1>=.002-1e-9&&envelope[1][2]-1<=.005+1e-9);assert.equal(envelope.at(-1)[1],0);
  assert.equal(osc.starts[0],1);assert.ok(osc.stops[0]<=1.650);assert.equal(envelope.at(-1)[2],osc.stops[0]);
  if(['story-cover','story-breach','story-landmark','story-rescue'].includes(id))assert.ok(osc.stops[0]<=1.45,`${id} stays within its 450ms plan bound`);
  shapes.set(id,JSON.stringify([osc.type,envelope.map((e:any[])=>[e[0],e[1],e[2]-1])]));voice!.dispose();assert.equal(released,1);
 }
 assert.equal(new Set(['hit-blunt','hit-flick','hit-hollow'].map(id=>shapes.get(id))).size,3);
 assert.equal(new Set(['freeze','meteor','food'].map(id=>shapes.get(id))).size,3);
 assert.equal(new Set(['story-rally','story-cover','story-breach','story-landmark','story-rescue'].map(id=>shapes.get(id))).size,5);
});

test('covered and breached hits admit one semantic voice before the generic impact',()=>{
 const h=harness();try{
  audio.playCombatEvents([{type:'hit',target:'unit',storyCue:'covered',amount:8,source:{id:1,x:350,lane:1,side:'enemy',age:0,kind:0}}],true);
  assert.equal(h.oscillators.length,1);
  h.ctx.currentTime=1.09;audio.playCombatEvents([{type:'hit',target:'unit',storyCue:'breach',amount:8,source:{id:2,x:450,lane:1,side:'player',age:0,kind:2}}],true);
  assert.equal(h.oscillators.length,2);
 }finally{h.close();}
});

test('death uses one shared audio-time cooldown across both sides',()=>{
 const h=harness();try{
  audio.playCombatEvents([{type:'death',side:'player'},{type:'death',side:'enemy'}],true);assert.equal(h.oscillators.length,1);
  h.ctx.currentTime=1.249999;audio.playCombatEvents([{type:'death',side:'enemy'}],true);assert.equal(h.oscillators.length,1);
  h.ctx.currentTime=1.25;audio.playCombatEvents([{type:'death',side:'enemy'}],true);assert.equal(h.oscillators.length,2);
 }finally{h.close();}
});
test('summon bypasses batch playback only through its direct bounded entry and has finite preserved tail',()=>{
 const h=harness();try{
  audio.playCombatEvents([{type:'upgrade',cardIndices:[3]}],true);assert.equal(h.live(),0,'background batch does not play summon');
  audio.playSummonAudio(false);assert.equal(h.live(),0);audio.playSummonAudio(true);assert.equal(h.live(),1);
  audio.playCombatEvents([{type:'upgrade'}],true);assert.equal(h.live(),2);audio.stopCombatAudio(true);assert.equal(h.live(),1,'menu gate preserves only explicit summon tail');
  audio.stopCombatAudio();assert.equal(h.live(),0,'settings/hidden suspension clears summon too');
  for(let i=0;i<8;i++)audio.playSummonAudio(true);assert.equal(h.live(),6,'summon uses ordinary slots, never reserved critical capacity');
 }finally{h.close();}
});

test('mix changes before enabled gesture allocate nothing and latest mix initializes exactly two buses',()=>{
 const api=audio as any;assert.equal(typeof api.updateAudioMix,'function','two-family mix owner required');audio.disposeAudio();
 const c=recordedContext();let created=0;const restore=installContext(c,()=>{created++;return c.ctx;});
 try{
  api.updateAudioMix({effects:0,atmosphere:25});api.updateAudioMix({effects:100,atmosphere:0});audio.unlockAudio(false);assert.equal(created,0);assert.equal(c.gains.length,0);assert.equal(c.sources.length,0);
  api.updateAudioMix({effects:50,atmosphere:25});audio.unlockAudio();assert.equal(created,1);assert.equal(c.gains.length,2);
  assert.deepEqual(c.gains.map(g=>g.gain.events[0]),[['set',.5,1],['set',.25,1]]);assert.ok(c.gains.every(g=>g.connections[0]===c.ctx.destination));
  audio.playCombatEvents([hit],true);assert.equal(c.gains[2].connections[0],c.gains[0]);
  audio.disposeAudio();audio.disposeAudio();assert.ok(c.gains.every(g=>g.disconnects===1));
 }finally{audio.disposeAudio();api.updateAudioMix({effects:100,atmosphere:100});restore();}
});
test('independent mix ramps preserve village targets, use interpolated values and zero effects drops allocations',async()=>{
 const api=audio as any;assert.equal(typeof api.updateAudioMix,'function');api.updateAudioMix({effects:100,atmosphere:100});const h=harness();
 try{
  audio.updateSoundscape(0,true,{alarmMix:0,alarmSerial:0});await tick();const bed=h.gains[2];assert.equal(bed.connections[0],h.gains[1]);assert.ok(bed.gain.events.some((e:any[])=>e[0]==='linear'&&e[1]===.35));
  const gains=h.gains.length,sources=h.sources.length;api.updateAudioMix({effects:0,atmosphere:100});audio.playCombatEvents([skill],true);assert.equal(h.gains.length,gains);assert.equal(h.sources.length,sources);
  assert.deepEqual(h.gains[0].gain.events.slice(-2),[['set',1,1],['linear',0,1.05]]);
  h.ctx.currentTime=1.025;api.updateAudioMix({effects:100,atmosphere:0});const events=h.gains[0].gain.events;
  assert.ok(Math.abs(events.at(-2)[1]-.5)<1e-9);assert.ok(events.at(-1)[2]-events.at(-2)[2]>=.050-1e-9);
  assert.equal(h.gains[1].gain.events.at(-1)[1],0);audio.playCombatEvents([skill],true);assert.equal(h.oscillators.length,1);assert.equal(h.gains.at(-1).connections[0],h.gains[0]);
  h.ctx.currentTime=3;audio.updateSoundscape(0,true,{alarmMix:1,alarmSerial:1});assert.equal(h.sources.length,sources);assert.ok(bed.gain.events.some((e:any[])=>e[0]==='linear'&&Math.abs(e[1]-.22)<1e-12));
  assert.equal(h.gains.at(-1).connections[0],h.gains[1],'village accent uses atmosphere bus');
  const count=h.gains.length;audio.suspendAudio();api.updateAudioMix({effects:0,atmosphere:0});api.updateAudioMix({effects:100,atmosphere:100});assert.equal(h.gains.length,count);assert.equal(h.live(),0);
 }finally{h.close();api.updateAudioMix({effects:100,atmosphere:100});}
});
