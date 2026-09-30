import test from 'node:test';
import assert from 'node:assert/strict';
import * as audio from '../src/view/audio.ts';

test('P32: audio is lazy when muted and rejected browser audio operations stay optional',async()=>{
 assert.equal(typeof audio.disposeAudio,'function');audio.disposeAudio();
 let created=0;
 const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
 class BlockedAudio {
  state='suspended';constructor(){created++;}
  resume(){return Promise.reject(new Error('gesture required'));}
  suspend(){return Promise.reject(new Error('blocked'));}
  close(){return Promise.reject(new Error('closed'));}
 }
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:BlockedAudio});
 try{
  audio.unlockAudio(false);assert.equal(created,0);audio.unlockAudio(true);assert.equal(created,1);
  assert.doesNotThrow(()=>audio.sound('hit',true));assert.doesNotThrow(()=>audio.suspendAudio());assert.doesNotThrow(()=>audio.disposeAudio());
  await new Promise(resolve=>setImmediate(resolve));
 }finally{audio.disposeAudio();if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else delete (globalThis as Record<string,unknown>).AudioContext;}
});

test('every game event has its own cue, so a defeated unit does not sound like a spawn',()=>{
 audio.disposeAudio();
 const starts:Record<string,number>={};let current='';
 const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
 class RunningAudio {
  state='running';currentTime=0;destination={};
  resume(){return Promise.resolve();}suspend(){return Promise.resolve();}close(){return Promise.resolve();}
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  createOscillator(){return {type:'',frequency:{setValueAtTime(value:number){starts[current]??=value;},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){(this as {onended:(()=>void)|null}).onended?.();},stop(){},onended:null as (()=>void)|null};}
 }
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:RunningAudio});
 try{
  audio.unlockAudio(true);
  for(const kind of ['spawn','hit','death','coin','upgrade','win','lose','skill','evolve','skill-freeze','skill-meteor','skill-food']){current=kind;audio.sound(kind,true);}
  const fromSpawn=Object.entries(starts).filter(([,value])=>value===starts.spawn).map(([kind])=>kind);
  assert.deepEqual(fromSpawn,['spawn'],'no other event may reuse the spawn cue');
  assert.equal(Object.keys(starts).length,12);
  assert.equal(new Set(['skill-freeze','skill-meteor','skill-food'].map(kind=>starts[kind])).size,3,'each skill has a distinct cue');
 }finally{audio.disposeAudio();if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else delete (globalThis as Record<string,unknown>).AudioContext;}
});

test('a skill event is cued by the skill that was cast',()=>{
 assert.equal(audio.cueFor({type:'skill',skill:'freeze'}),'skill-freeze');
 assert.equal(audio.cueFor({type:'skill',skill:'meteor'}),'skill-meteor');
 assert.equal(audio.cueFor({type:'skill',skill:'food'}),'skill-food');
 assert.equal(audio.cueFor({type:'skill'}),'skill');
 assert.equal(audio.cueFor({type:'skill',skill:'nonsense'}),'skill');
 assert.equal(audio.cueFor({type:'hit'}),'hit');
});
