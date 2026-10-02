import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const subject=async()=>{
 const module=await import('../src/view/chronicle-cat.ts').catch(error=>{
  if((error as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;
  throw error;
 });
 assert.ok(module,'the missing-page cat presentation model must exist');
 return module;
};

const input=(overrides:Record<string,unknown>={})=>({
 discoveries:7,route:'whisper',phase:'running',rescued:false,travellerX:620,time:0,paused:false,reduced:false,...overrides,
});

test('only the discovered missing-page route admits the cat',async()=>{
 const {chronicleCatFrame}=await subject();
 assert.equal(chronicleCatFrame(input({discoveries:3})),null);
 assert.equal(chronicleCatFrame(input({route:'scout'})),null);
 assert.equal(chronicleCatFrame(input({route:'road'})),null);
 assert.equal(chronicleCatFrame(input({phase:'ready'}))?.mode,'waiting');
});

test('the cat leads from home, then watches beside the real rescue cage',async()=>{
 const {chronicleCatFrame}=await subject();
 const start=chronicleCatFrame(input({time:0})),middle=chronicleCatFrame(input({time:2.75})),arrived=chronicleCatFrame(input({time:5.5}));
 assert.deepEqual([start?.mode,start?.x,start?.facing],['leading',78,1]);
 assert.deepEqual([middle?.mode,middle?.x,middle?.facing],['leading',163.5,1]);
 assert.deepEqual([arrived?.mode,arrived?.x,arrived?.facing],['watching',249,1]);
 assert.ok((middle?.paws.length??0)>0&&(middle?.paws.length??0)<=3);
 assert.ok((middle?.paws??[]).every(mark=>mark.x>=78&&mark.x<=249));
});

test('after the rescue the cat accompanies the authoritative scout home without crossing it',async()=>{
 const {chronicleCatFrame}=await subject();
 const far=chronicleCatFrame(input({rescued:true,travellerX:560,time:8})),near=chronicleCatFrame(input({rescued:true,travellerX:260,time:10})),home=chronicleCatFrame(input({rescued:true,travellerX:150,time:12}));
 assert.deepEqual([far?.mode,far?.x,far?.facing],['home',230,-1]);
 assert.deepEqual([near?.mode,near?.x,near?.facing],['home',95,-1]);
 assert.deepEqual([home?.mode,home?.x,home?.facing],['home',56,-1]);
 for(const [frame,traveller] of [[far,560],[near,260],[home,150]] as const)assert.ok(frame!.x<=traveller*.45,'the cat stays homeward of the scout');
});

test('pause and reduced motion keep static poses while malformed inputs fail finite and bounded',async()=>{
 const {chronicleCatFrame}=await subject();
 const paused=chronicleCatFrame(input({paused:true,time:2.1}));
 assert.equal(paused?.gait,0);assert.equal(paused?.tailAngle,0);assert.equal(paused?.paws.length,0);
 const reduced=chronicleCatFrame(input({reduced:true,time:0})),reducedLater=chronicleCatFrame(input({reduced:true,time:999}));
 assert.deepEqual(reduced,reducedLater);assert.deepEqual([reduced?.mode,reduced?.x,reduced?.gait],['watching',249,0]);
 const malformed=chronicleCatFrame(input({time:NaN,travellerX:Infinity,phase:'broken'}));
 assert.ok(malformed);assert.ok(Number.isFinite(malformed.x)&&Number.isFinite(malformed.tailAngle));
 assert.ok(malformed.x>=56&&malformed.x<=249);assert.ok(malformed.paws.every(mark=>Number.isFinite(mark.x)&&Number.isFinite(mark.y)&&Number.isFinite(mark.alpha)));
});

test('render plan keeps paw marks below the cat and the cat behind rescue endpoints',async()=>{
 const {chronicleCatFrame,chronicleCatRenderPlan}=await subject();
 const frame=chronicleCatFrame(input({time:3}))!;
 const plan=chronicleCatRenderPlan(200,frame);
 assert.deepEqual({footY:plan.footY,groundDepth:plan.groundDepth,catDepth:plan.catDepth,endpointDepth:plan.endpointDepth},{footY:208,groundDepth:207.4,catDepth:207.9,endpointDepth:208});
 assert.ok(plan.groundDepth<plan.catDepth&&plan.catDepth<plan.endpointDepth);
});

test('ChronicleView pools, clears and reports the route-truthful cat without owning state',async()=>{
 const source=await readFile(new URL('../src/view/chronicle-view.ts',import.meta.url),'utf8');
 assert.match(source,/from '\.\/chronicle-cat\.ts'/);
 assert.match(source,/private cat:Phaser\.GameObjects\.Graphics/);
 assert.match(source,/private catGround:Phaser\.GameObjects\.Graphics/);
 assert.match(source,/layer\.add\(\[[^\]]*this\.catGround[^\]]*this\.cat/s);
 assert.match(source,/chronicleCatFrame\(\{discoveries:p\.chronicle\?\.discoveries\?\?0,route:p\.chronicle\?\.route\?\?'road',phase:s\.phase,rescued:c\.rescued,travellerX:c\.cart\.x,time:s\.time,paused:s\.paused,reduced\}\)/);
 assert.match(source,/this\.cat\.clear\(\)\.setVisible\(false\)/);
 assert.match(source,/this\.catGround\.clear\(\)/);
 assert.ok((source.match(/delete this\.scene\.game\.canvas\.dataset\.chronicleCat/g)??[]).length>=2,'update and destroy both clear stale webdriver metadata');
 assert.match(source,/dataset\.chronicleCat=JSON\.stringify\(\{mode:frame\.mode,x:frame\.x/);
 assert.doesNotMatch(source,/this\.scene\.add\.(?:graphics|image|sprite)\([^)]*\).*chronicleCatFrame/s,'cat updates must reuse constructor-owned objects');
});

test('native journey requires original lead, watch and home evidence at all supported widths',async()=>{
 const source=await readFile(new URL('../scripts/review-chronicle.mjs',import.meta.url),'utf8');
 assert.match(source,/async function pauseAtCatMode\(page,mode\)/);
 assert.match(source,/for\(const \[width,height\] of \[\[320,568\],\[390,844\],\[1024,768\]\]\)\{\n  const p=preparedChronicleProfile\(\);p\.speed=1;p\.chronicle\.discoveries=7;p\.chronicle\.route='whisper'/);
 for(const state of ['leading','watching','home'])assert.match(source,new RegExp(`shot\\(f,'cat-${state}'\\)`));
 assert.match(source,/dataset\.chronicleCat/);
 assert.match(source,/paused\.groundDepth<paused\.catDepth&&paused\.catDepth<paused\.endpointDepth/);
 assert.match(source,/cat\.mode==='home'&&cat\.x<rescue\.scout\.x/);
 assert.match(source,/paused cat presentation must remain save-inert/);
 assert.match(source,/390-cat-reduced/);
});
