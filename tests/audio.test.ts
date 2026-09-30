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

import {selectCombatCues} from '../src/view/combat-cues.ts';
import {recordedContext} from './helpers/audio-context.ts';
import type {GameEvent} from '../src/game/types.ts';
const ids=(events:GameEvent[])=>selectCombatCues(events).map(c=>c.id);
test('merged death and summon roles use dedicated production contours, never deployment fallback',()=>{
 const starts:number[]=[],shapes:string[]=[];
 for(const id of ['deploy','death','upgrade','summon'] as const){
  const c=recordedContext(),voice=audio.renderCombatCue(c.ctx,c.ctx.destination,id,1,()=>{});
  assert.ok(voice,id);starts.push(c.oscillators[0].frequency.events[0][1]);
  shapes.push(JSON.stringify([c.oscillators[0].type,c.gains[0].gain.events]));voice!.dispose();
 }
 assert.notEqual(starts[0],starts[1]);assert.notEqual(starts[2],starts[3]);assert.notEqual(shapes[0],shapes[1]);assert.notEqual(shapes[2],shapes[3]);
});
test('merged skill mapping preserves each actual skill and silences malformed skills',()=>{
 assert.deepEqual(ids([{type:'skill',skill:'freeze'},{type:'skill',skill:'meteor'},{type:'skill',skill:'food'}]),['freeze','meteor','food']);
 assert.deepEqual(ids([{type:'skill'},{type:'skill',skill:'nonsense'} as unknown as GameEvent]),[]);
});
test('merged card summon metadata remains distinct from plain upgrades',()=>{
 assert.deepEqual(ids([{type:'upgrade',cardIndices:[3,9]}]),['summon']);
 assert.deepEqual(ids([{type:'upgrade',cardIndices:[]},{type:'upgrade'}]),['upgrade']);
});
test('merged attacking material mapping preserves melee, ranged and heavy distinction',()=>{
 for(const [kind,id] of [[0,'hit-blunt'],[1,'hit-flick'],[2,'hit-hollow']] as const)
  assert.deepEqual(ids([{type:'hit',source:{id:1,x:0,lane:0,side:'player',age:0,kind}}]),[id]);
 assert.deepEqual(ids([{type:'hit'}]),['hit-neutral']);
});
