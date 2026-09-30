import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCombatCues} from '../src/view/combat-cues.ts';
import type {GameEvent} from '../src/game/types.ts';
const ids=(events:readonly GameEvent[])=>selectCombatCues(events).map(c=>c.id);
const malformed=(events:unknown[])=>events as GameEvent[];
const unitHit=(kind:number):GameEvent=>({type:'hit',target:'unit',source:{id:1,x:0,lane:0,side:'player',age:0,kind:kind as 0}});
test('baseDamageUsesAttackerSide',()=>{
 const selected=selectCombatCues([{type:'hit',target:'unit'},{type:'hit',target:'base',side:'player'},{type:'hit',target:'base',side:'enemy'}]);
 assert.deepEqual(selected.map(c=>c.id),['base-player']);assert.equal(selected[0].eventIndex,2);assert.equal(selected[0].critical,true);
});
test('kindAndSkillMetadataSurvive',()=>{
 for(const [kind,want] of [[0,'hit-blunt'],[1,'hit-flick'],[2,'hit-hollow']] as const)assert.deepEqual(ids([unitHit(kind)]),[want]);
 const selected=selectCombatCues([{type:'skill',skill:'freeze'},{type:'skill',skill:'meteor'},{type:'skill',skill:'food'}]);
 assert.deepEqual(selected.map(c=>c.id),['freeze','meteor','food']);assert.ok(selected.every(c=>c.critical));
});
test('resultSuppressesBatch',()=>{
 assert.deepEqual(ids([{type:'coin'},{type:'hit'},{type:'lose'},{type:'win'},{type:'skill',skill:'food'}]),['lose']);
 assert.deepEqual(ids([{type:'win'},{type:'lose'}]),['win']);
});
test('stablePriorityAndCap',()=>{
 assert.deepEqual(ids([{type:'coin'},{type:'spawn',side:'player'},{type:'upgrade'},{type:'hit'},{type:'skill',skill:'meteor'}]),['meteor','hit-neutral','deploy']);
 assert.deepEqual(ids(Array.from({length:100000},()=>({type:'skill',skill:'food'}))),['food','food','food']);
 assert.deepEqual(ids([{type:'evolve'},{type:'upgrade'},{type:'coin'}]),['evolve','upgrade','coin']);
});
test('silenceAndNeutralFallback',()=>{
 assert.deepEqual(ids(malformed([{type:'spawn',side:'enemy'},{type:'death'},{type:'unknown'},null,{}, {type:'skill',skill:'bad'}, {type:'hit',target:'bad'}])),[]);
 for(const event of [{type:'hit'},{type:'hit',target:'unit',source:{kind:9}},{type:'hit',target:'base'},{type:'hit',target:'base',side:'bad'}])assert.deepEqual(ids(malformed([event])),['hit-neutral']);
});
test('boundedCoalescing',()=>{
 const batch=Object.freeze(Array.from({length:100},()=>[{type:'spawn',side:'player'},{type:'hit'},{type:'coin'}] as const).flat().map(e=>Object.freeze(e)));
 const before=JSON.stringify(batch);assert.deepEqual(ids(batch),['hit-neutral','deploy','coin']);assert.equal(JSON.stringify(batch),before);
 assert.deepEqual(ids([{type:'skill',skill:'freeze'},{type:'skill',skill:'freeze'},{type:'skill',skill:'freeze'},{type:'skill',skill:'meteor'}]),['freeze','freeze','freeze']);
});
