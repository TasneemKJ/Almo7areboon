import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('the cage stays at the rescue point while four real progress knots fill',async()=>{
  const presentation=await import('../src/view/chronicle-rescue.ts').catch(()=>null);
  assert.ok(presentation,'the rescue presentation model is missing');
  const frame=presentation.chronicleRescueFrame({rescued:false,rescueProgress:2.25,travellerX:620,time:8,paused:false,reduced:false});
  assert.deepEqual(frame.cage,{x:279,open:false,alpha:1});
  assert.equal(frame.scout,null);
  assert.deepEqual(frame.knots.map((k:{fill:number})=>k.fill),[1,1,.25,0]);
  assert.equal(frame.footprints.length,0);
});

test('a freed scout walks home while the open cage remains behind',async()=>{
  const {chronicleRescueFrame}=await import('../src/view/chronicle-rescue.ts');
  const frame=chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:400,time:1.2,paused:false,reduced:false});
  assert.deepEqual(frame.cage,{x:279,open:true,alpha:.45});
  assert.deepEqual(frame.scout,{x:180,frame:2});
  assert.equal(frame.knots.length,0);
  assert.equal(frame.footprints.length,3);
  assert.ok(frame.footprints.every(mark=>mark.x>180&&mark.x<279),'the scout leaves a bounded trail toward the cage, not ahead of homeward travel');
  assert.deepEqual(frame.footprints.map(mark=>mark.x),[192,202,212]);
  for(let time=0;time<4;time+=.05)assert.ok((chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:400,time,paused:false,reduced:false}).scout?.frame??-1)<=3,'homecoming uses walking frames, never attack anticipation');
});

test('malformed rescue presentation is finite, immutable, and static when motion is reduced or paused',async()=>{
  const {chronicleRescueFrame}=await import('../src/view/chronicle-rescue.ts');
  const malformed={rescued:true,rescueProgress:Infinity,travellerX:NaN,time:NaN,paused:false,reduced:false};
  const before=structuredClone(malformed),safe=chronicleRescueFrame(malformed);
  assert.deepEqual(malformed,before);
  assert.deepEqual(safe.scout,{x:279,frame:0});
  assert.ok(safe.footprints.every(mark=>Number.isFinite(mark.x)&&Number.isFinite(mark.y)&&Number.isFinite(mark.alpha)));
  const extreme=chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:300,time:Number.MAX_VALUE,paused:false,reduced:false});
  assert.ok(Number.isInteger(extreme.scout?.frame)&&extreme.scout!.frame>=0&&extreme.scout!.frame<=3,'finite clocks that overflow during animation math still fail static');
  const reduced=chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:300,time:1,paused:false,reduced:true});
  const reducedLater=chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:300,time:999,paused:false,reduced:true});
  assert.deepEqual(reduced,reducedLater);
  assert.equal(reduced.scout?.frame,0);
  assert.equal(chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:300,time:99,paused:true,reduced:false}).scout?.frame,0);
  assert.equal(chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:300,previousScoutX:135,time:1,paused:false,reduced:false}).scout?.frame,0,'a scout blocked at the same presented position does not walk in place');
  assert.equal(chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:300,previousScoutX:140,time:1,paused:false,reduced:false}).scout?.frame,1,'a scout whose authoritative position moved uses a walking frame');
});

test('the rescue draw plan uses age-matched storybook art and keeps ground marks below both actors',async()=>{
  const presentation=await import('../src/view/chronicle-rescue.ts');
  assert.equal(typeof presentation.chronicleRescueRenderPlan,'function','the renderer-facing rescue plan is missing');
  const frame=presentation.chronicleRescueFrame({rescued:true,rescueProgress:4,travellerX:300,time:2,paused:false,reduced:false});
  const plan=presentation.chronicleRescueRenderPlan(4,200,frame);
  assert.equal(plan.cageTexture,'chronicle-cage-open-ink-v1');
  assert.equal(plan.scoutTexture,'army-4-1-player');
  assert.equal(plan.cageDepth,208);
  assert.equal(plan.scoutDepth,208.1);
  assert.ok(plan.groundDepth<plan.cageDepth&&plan.groundDepth<plan.scoutDepth);
  const fallback=presentation.chronicleRescueRenderPlan(4,200,frame,()=>false);
  assert.equal(fallback.scoutMode,'fallback','a missing painted strip uses the same bounded fallback language as combatants');
});

test('native rescue review resumes through the dedicated pause owner rather than matching explanatory troop labels',async()=>{
  const source=await readFile(new URL('../scripts/review-chronicle.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/getByRole\('button',\{name:\/Resume battle\/i\}\)/);
  assert.ok((source.match(/locator\('\[data-command="pause"\]'\)/g)??[]).length>=2);
});
