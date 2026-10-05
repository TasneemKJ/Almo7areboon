import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCombatCues} from '../src/view/combat-cues.ts';
import type {GameEvent} from '../src/game/types.ts';
import {Game} from '../src/game/simulation.ts';
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
 assert.deepEqual(ids(malformed([{type:'spawn',side:'enemy'},{type:'unknown'},null,{}, {type:'skill',skill:'bad'}, {type:'hit',target:'bad'}])),[]);
 for(const event of [{type:'hit'},{type:'hit',target:'unit',source:{kind:9}},{type:'hit',target:'base'},{type:'hit',target:'base',side:'bad'}])assert.deepEqual(ids(malformed([event])),['hit-neutral']);
});
test('boundedCoalescing',()=>{
 const batch=Object.freeze(Array.from({length:100},()=>[{type:'spawn',side:'player'},{type:'hit'},{type:'coin'}] as const).flat().map(e=>Object.freeze(e)));
 const before=JSON.stringify(batch);assert.deepEqual(ids(batch),['hit-neutral','deploy','coin']);assert.equal(JSON.stringify(batch),before);
 assert.deepEqual(ids([{type:'skill',skill:'freeze'},{type:'skill',skill:'freeze'},{type:'skill',skill:'freeze'},{type:'skill',skill:'meteor'}]),['freeze','freeze','freeze']);
});

test('death is coalesced across both sides at lower priority and results suppress it',()=>{
 const deaths:GameEvent[]=[{type:'death',side:'enemy'},{type:'death',side:'player'},{type:'death',side:'enemy'}];
 assert.deepEqual(ids(deaths),['death']);const cue=selectCombatCues(deaths)[0];assert.equal(cue.eventIndex,0);assert.equal(cue.critical,false);assert.equal(cue.cooldown,'death');
 assert.deepEqual(ids([...deaths,{type:'coin'},{type:'spawn',side:'player'},{type:'hit'}]),['hit-neutral','deploy','coin']);
 assert.deepEqual(ids([...deaths,{type:'lose'}]),['lose']);
});

test('accepted simulation commands select their own accent once through the drained event batch',()=>{
 for(const order of ['hold','advance'] as const){
  const g=new Game();g.dispatch({type:'start'});g.drainEvents();
  assert.equal(g.dispatch({type:'order',order}),false);assert.deepEqual(ids(g.drainEvents()),[]);
  g.state.orders!.charge=60;g.dispatch({type:'pause'});
  assert.equal(g.dispatch({type:'order',order}),false);assert.deepEqual(ids(g.drainEvents()),[]);
  g.dispatch({type:'pause'});assert.equal(g.dispatch({type:'order',order}),true);
  const accepted=g.drainEvents(),before=JSON.stringify(accepted);
  assert.deepEqual(ids(accepted),[`order-${order}`]);assert.equal(JSON.stringify(accepted),before);
  assert.deepEqual(ids(g.drainEvents()),[],'drained events never replay');
  assert.equal(g.dispatch({type:'order',order}),false);assert.deepEqual(ids(g.drainEvents()),[],'overlapping rejected inputs stay silent');
 }
});

test('order accents are bounded, malformed commands are silent, and battle results still own the batch',()=>{
 assert.deepEqual(ids(malformed([{type:'order'},{type:'order',order:'retreat'}])),[]);
 const orders:GameEvent[]=Array.from({length:100},()=>({type:'order',order:'hold'}));
 assert.deepEqual(ids(orders),['order-hold']);assert.equal(selectCombatCues(orders)[0].critical,false);
 assert.deepEqual(ids([...orders,{type:'hit'},{type:'coin'}]),['order-hold','hit-neutral','coin']);
 assert.deepEqual(ids([...orders,{type:'lose'}]),['lose']);
});
