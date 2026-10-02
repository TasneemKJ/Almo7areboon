import test from 'node:test';
import assert from 'node:assert/strict';
import {actorRenderDepth} from '../src/view/lane-perspective.ts';

async function effects(){
 const path='../src/view/ground-effects.ts';
 const m=await import(path).catch(()=>null);
 assert.ok(m,'physical effects need a stable source-ground routing policy');
 return m;
}

test('source-attached combat cues stay above their same-lane actors while nearer planes remain nearer',async()=>{
 const m=await effects(),ground=280;
 const objects=[
  {name:'base',depth:292},{name:'base damage',depth:292.1},
  {name:'rear troop',depth:actorRenderDepth(ground,0,12,0)},
  {name:'middle troop',depth:actorRenderDepth(ground,1,12,0)},
  {name:'front troop',depth:actorRenderDepth(ground,2,12,0)},
  ...[0,1,2].map(lane=>({name:['rear effect','middle effect','front effect'][lane],depth:m.groundEffectDepth(ground,lane,12)})),
 ];
 assert.deepEqual(objects.sort((a,b)=>a.depth-b.depth).map(object=>object.name),[
  'rear troop','rear effect','middle troop','base','base damage','middle effect','front troop','front effect',
 ]);
 for(const lane of [0,1,2])for(let id=0;id<5;id++)assert.ok(
  m.groundEffectDepth(ground,lane,12)>actorRenderDepth(ground,lane,12,id),
  `lane ${lane} source cues must stay above actor stagger ${id}`,
 );
 // Resizing changes ground placement, never the relation between the three lanes.
 for(const lane of [0,1,2])assert.equal(m.groundEffectDepth(400,lane,12)-m.groundEffectDepth(280,lane,12),120);
});

test('ground dust retains its source layer while aerial and readability effects retain the overlay',async()=>{
 const m=await effects(),lanes=['rear','middle','front'],overlay='air';
 const dust={lane:0,y:280};
 assert.equal(m.groundEffectLayer(lanes,overlay,dust.lane),'rear');
 dust.y=350;
 assert.equal(m.groundEffectLayer(lanes,overlay,dust.lane),'rear','rising or falling particles must not switch occlusion planes');
 for(const lane of [0,1,2])assert.equal(m.groundEffectLayer(lanes,overlay,lane),lanes[lane]);
 assert.equal(m.groundEffectLayer(lanes,overlay,undefined),'air');
});

test('malformed source lanes fall back to the middle lane without losing effect graphics',async()=>{
 const m=await effects(),lanes=['rear','middle','front'];
 for(const lane of [NaN,Infinity,-1,3])assert.equal(m.groundEffectLayer(lanes,'air',lane),'middle');
 assert.equal(m.groundEffectLayer(lanes,'air',.8),'middle');
});
