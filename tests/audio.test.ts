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
  assert.doesNotThrow(()=>audio.playCombatEvents([{type:'hit'}],true));assert.doesNotThrow(()=>audio.suspendAudio());assert.doesNotThrow(()=>audio.disposeAudio());
  await new Promise(resolve=>setImmediate(resolve));
 }finally{audio.disposeAudio();if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else delete (globalThis as Record<string,unknown>).AudioContext;}
});
