import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {arenaLayout,landscapePlacement} from '../src/view/visual-theme.ts';
import {advanceVillageMood,createVillageMood,type VillageMoodState} from '../src/view/village-mood.ts';
async function life(){const m=await import('../src/view/village-life.ts').catch(()=>null);assert.ok(m,'anchored village life is missing');return m;}
const quiet={mood:'quiet',alarmMix:0,alarmSerial:0,time:0,alarmEnteredAt:null} as const;
const viewport={placement:{x:0,y:0,scale:1},cssWorldScale:1,visibleSource:[0,0,900,1000] as const,hudSourceBounds:[]};
const safeMoodInput={phase:'running',hpFraction:1,nearestEnemyX:Infinity,playerBaseHit:false,paused:false} as const;
test('malformed HUD normalization caps input before allocating mapped geometry',()=>{
 const source=readFileSync(new URL('../src/view/village-life.ts',import.meta.url),'utf8');
 assert.match(source,/hudSourceBounds:input\.viewport\.hudSourceBounds\.slice\(0,32\)\.map\(sourceBounds\)/);
});
function advanceTo(state:VillageMoodState,time:number){while(time-state.time>1e-8)state=advanceVillageMood(state,safeMoodInput,Math.min(.05,time-state.time));return state;}
function hit(state:VillageMoodState){return advanceVillageMood(state,{...safeMoodInput,playerBaseHit:true},0);}
test('a passage suppressed during alarm stays absent through recovery and repeated alarm entries',async()=>{
 const m=await life();let state=hit(advanceTo(createVillageMood(),3));
 const bird=()=>m.villageFrame({age:0,time:state.time,reduced:false,mood:state,viewport}).bird;
 state=advanceTo(state,8.95);assert.equal(state.mood,'alarmed');assert.equal(bird(),null);
 state=advanceTo(state,9);assert.equal(state.mood,'recovering');assert.equal(bird(),null,'the t=8 suppressed flight must not appear at recovery');
 state=hit(state);assert.equal(state.alarmSerial,2);assert.equal(bird(),null,'a later alarm must retain the earlier suppression');
 state=advanceTo(state,15);assert.equal(state.mood,'recovering');assert.equal(bird(),null,'suppression survives two completed alarm intervals');
 state=hit(state);state=advanceTo(state,15.2);assert.equal(bird(),null,'a third entry must not discard admission history before the flight ends');
});
test('an admitted passage keeps flying through recovery and re-alarm until its scheduled end',async()=>{
 const m=await life();let state=hit(advanceTo(createVillageMood(),9));
 for(const time of [9,14.95,15,15.2]){
  state=advanceTo(state,time);if(time===15)assert.equal(state.mood,'recovering');
  const actual=m.villageFrame({age:0,time:state.time,reduced:false,mood:state,viewport}).bird;
  const expected=m.villageFrame({age:0,time:state.time,reduced:false,mood:quiet,viewport}).bird;
  assert.ok(actual,'the t=8 quiet-admitted passage must keep flying');assert.deepEqual(actual,expected);
  if(time===15)state=hit(state);
 }
 state=advanceTo(state,15.55);assert.equal(m.villageFrame({age:0,time:state.time,reduced:false,mood:state,viewport}).bird,null);
});
test('reduced-motion danger stays still through evolving audio ramps and restores a full occupant only in late recovery',async()=>{
 const m=await life();let state=hit(createVillageMood());
 const frame=()=>m.villageFrame({age:0,time:state.time,reduced:true,mood:state,viewport});
 state=advanceTo(state,.15);const danger=frame(),firstMix=state.alarmMix;
 state=advanceTo(state,.30);assert.notEqual(state.alarmMix,firstMix,'the shared audio mix keeps its continuous ramp');
 assert.deepEqual(frame(),danger,'visual opacity must have settled within150ms');
 state=advanceTo(state,.60);assert.deepEqual(frame(),danger);
 state=advanceTo(state,6.15);assert.equal(state.mood,'recovering');const early=frame(),earlyMix=state.alarmMix;
 state=advanceTo(state,8.4);assert.notEqual(state.alarmMix,earlyMix);assert.deepEqual(frame(),early,'lights and panes stay still through the early recovery ramp');
 assert.ok(frame().residents.every(resident=>resident.panes.every(pane=>pane.alpha<=.2)),'no early occupant');
 state=advanceTo(state,8.65);const late=frame();assert.ok(late.residents.some(resident=>resident.panes.some(pane=>pane.alpha>.2)),'late recovery restores one coherent occupant');
 state=advanceTo(state,9.8);assert.deepEqual(frame(),late,'occupancy does not fade throughout the last1.5seconds');
 state=advanceTo(state,10.1);assert.equal(state.mood,'quiet');assert.deepEqual(frame(),late);
 state=hit(state);assert.deepEqual(frame(),danger,'a renewed danger switches to the same still composition');
});
const inside=(p:any,b:readonly number[])=>p.x>=b[0]-1e-7&&p.y>=b[1]-1e-7&&p.x<=b[2]+1e-7&&p.y<=b[3]+1e-7;
function convex(p:any,polygon:readonly any[]){return polygon.every((a,i)=>{const b=polygon[(i+1)%polygon.length];return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x)>=-1e-6;});}
// Independent measurements, rather than trusting the renderer's own pane construction.
const apertures=[
 [[227,349,247,377],[[234,349,238,377],[227,359,247,363]]],[[729,465,748,489],[[737,465,740,489],[729,475,748,478]]],
 [[109,283,122,300],[[114,283,117,300],[109,290,122,293]]],[[177,298,187,313],[[180,298,183,313],[177,303,187,306]]],
 [[86,286,107,325],[[94,286,98,325],[86,303,107,308]]],[[193,319,207,348],[[198,319,202,348],[193,331,207,335]]],
 [[221,282,236,310],[]],[[695,354,713,391],[[702,354,706,391],[695,369,713,375]]],
 [[434,287,451,307],[[440,287,444,307],[434,297,451,300]]],[[807,333,824,359],[[815,333,819,359],[807,345,824,349]]],
 [[186,271,198,292],[]],[[782,324,800,349],[[789,324,793,349],[782,335,800,339]]],
] as const;
function crossesInterior(a:any,b:any,rect:readonly number[]){
 let lo=0,hi=1;
 for(const [start,end,min,max] of [[a.x,b.x,rect[0]+1e-6,rect[2]-1e-6],[a.y,b.y,rect[1]+1e-6,rect[3]-1e-6]]){
  const delta=end-start;
  if(Math.abs(delta)<1e-10){if(start<min||start>max)return false;continue;}
  const one=(min-start)/delta,two=(max-start)/delta;lo=Math.max(lo,Math.min(one,two));hi=Math.min(hi,Math.max(one,two));
 }
 return hi>lo;
}
test('resident edges obey the independently measured arches and framing exclusions',async()=>{
 const m=await life();
 for(let age=0;age<6;age++)for(let time=.8;time<35;time+=.4){
  const frame=m.villageFrame({age,time,reduced:false,mood:quiet,viewport});
  for(const resident of frame.residents){
   const index=m.VILLAGE_PLATES[age].windows.findIndex(w=>w.id===resident.apertureId),[bounds,framing]=apertures[age*2+index];
   const [l,t,r,b]=bounds,w=r-l,h=b-t;
   const arch=age===4&&index===0?[{x:l,y:t},{x:r,y:t},{x:r,y:b},{x:l,y:b}]:[{x:l,y:t+.35*h},{x:l+.35*w,y:t+.10*h},{x:l+.65*w,y:t+.10*h},{x:r,y:t+.35*h},{x:r,y:b},{x:l,y:b}];
   for(const mark of resident.panes)for(let vertex=0;vertex<mark.points.length;vertex++){
    const point=mark.points[vertex],next=mark.points[(vertex+1)%mark.points.length];
    assert.ok(convex(point,arch),'complete outline stays inside the inscribed arch');
    for(const mullion of framing)assert.equal(crossesInterior(point,next,mullion),false,'no edge crosses a mullion interior');
   }
  }
 }
});
// Catches stale registration after plate replacement, including a same-size changed plate.
test('all measured anchors identify the inspected 900 by 1000 plates',async()=>{const m=await life();assert.equal(m.VILLAGE_PLATES.length,6);for(const plate of m.VILLAGE_PLATES){const bytes=readFileSync(new URL('../'+plate.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),plate.sha256);assert.equal(bytes.toString('ascii',0,4),'RIFF');const extended=bytes.toString('ascii',12,16)==='VP8X';assert.equal(extended?1+bytes.readUIntLE(24,3):bytes.readUInt16LE(26)&0x3fff,900);assert.equal(extended?1+bytes.readUIntLE(27,3):bytes.readUInt16LE(28)&0x3fff,1000);assert.equal(plate.windows.length,2);}});
// Catches a complete silhouette or an edge bridging a painted mullion.
test('every complete resident polygon stays in a single allowed pane',async()=>{const m=await life();let silhouettes=0;for(let age=0;age<6;age++)for(let time=0;time<180;time+=.37){const f=m.villageFrame({age,time,reduced:false,mood:quiet,viewport});assert.ok(f.residents.length<=2);assert.ok(f.lamps.length<=4);assert.ok(f.water.length<=3);for(const resident of f.residents){const aperture=m.VILLAGE_PLATES[age].windows.find((w:any)=>w.id===resident.apertureId);assert.ok(aperture);for(const painted of resident.panes){assert.ok(aperture.panes.some((pane:readonly any[])=>painted.points.every((p:any)=>convex(p,pane))),`${age}:${time} entire polygon contained in one pane`);for(const p of painted.points)assert.ok(inside(p,aperture.bounds));if(painted.alpha>.2)silhouettes++;}}}assert.ok(silhouettes>100,'habitation must be visible, not just empty output');});
test('harbor reflections remain short and bounded, and measured lights retain their centers',async()=>{const m=await life();for(let age=0;age<6;age++)for(const time of [0,5,23,50]){const f=m.villageFrame({age,time,reduced:false,mood:quiet,viewport});f.lamps.forEach((lamp:any,i:number)=>{assert.deepEqual([lamp.center.x,lamp.center.y,lamp.rx,lamp.ry],m.VILLAGE_PLATES[age].lamps[i].slice(0,4));assert.ok(lamp.alpha>=.082&&lamp.alpha<=.178);});for(const stroke of f.water){assert.equal(age,2);assert.ok(inside(stroke.from,[480,473,591,526])&&inside(stroke.to,[480,473,591,526]));assert.equal(stroke.from.y,stroke.to.y);assert.ok(stroke.to.x-stroke.from.x>=12&&stroke.to.x-stroke.from.x<=22);}}});
test('complete birds avoid HUD and roofs, need readable continuous travel, and finish through alarm',async()=>{const m=await life();let birds=0;for(let age=0;age<6;age++)for(let time=0;time<180;time+=.25){const f=m.villageFrame({age,time,reduced:false,mood:quiet,viewport});if(f.bird){birds++;for(const poly of f.bird)for(const p of poly.points)assert.ok(inside(p,m.VILLAGE_PLATES[age].sky));}}assert.ok(birds>100);const flying=m.villageFrame({age:0,time:10,reduced:false,mood:quiet,viewport});assert.ok(flying.bird);assert.deepEqual(m.villageFrame({age:0,time:10,reduced:false,mood:{...quiet,mood:'alarmed',alarmMix:1,alarmEnteredAt:9},viewport}).bird,flying.bird);assert.equal(m.villageFrame({age:0,time:10,reduced:false,mood:{...quiet,mood:'alarmed',alarmEnteredAt:7},viewport}).bird,null);for(const clipped of [{...viewport,cssWorldScale:.1},{...viewport,visibleSource:[0,200,900,1000] as const},{...viewport,hudSourceBounds:[[230,90,670,195] as const]},{...viewport,visibleSource:[300,100,400,180] as const}])assert.equal(m.villageFrame({age:0,time:10,reduced:false,mood:quiet,viewport:clipped}).bird,null);});
test('reduced motion is still inhabited and identical across clocks, with no bird',async()=>{const m=await life();for(let age=0;age<6;age++){const a=m.villageFrame({age,time:0,reduced:true,mood:quiet,viewport});assert.deepEqual(a,m.villageFrame({age,time:99,reduced:true,mood:quiet,viewport}));assert.ok(a.residents.some((r:any)=>r.panes.some((p:any)=>p.alpha>.2)));assert.equal(a.bird,null);const alarm=m.villageFrame({age,time:0,reduced:true,mood:{...quiet,mood:'alarmed',alarmMix:1},viewport});assert.ok(alarm.residents.every((r:any)=>r.panes.every((p:any)=>p.alpha<=.2)));}});
test('source registration follows uniform painted placement at narrow and short layouts',async()=>{const m=await life();for(const [width,height] of [[320,300],[390,430],[450,430],[320,180]]){const layout=arenaLayout(width,height),placement=landscapePlacement(450,layout.height,layout.groundY);const f=m.villageFrame({age:5,time:0,reduced:true,mood:quiet,viewport:{...viewport,placement,cssWorldScale:width/450}});assert.equal(f.lamps[3].center.x,placement.x+871*placement.scale);assert.equal(f.lamps[3].center.y,placement.y+365*placement.scale);assert.equal(f.lamps[3].color,0x8edfc9);assert.equal(f.lamps[0].color,0xffd08a);assert.ok(f.residents.every((r:any)=>r.panes.every((p:any)=>p.points.every((point:any)=>Number.isFinite(point.x)&&Number.isFinite(point.y)))));}});

test('oven and workshop restoration illuminate their own measured apertures while courtyard restoration brings both rooms home',async()=>{
 const m=await life(),frame=(restoration:number)=>m.villageFrame({age:0,time:0,reduced:true,restoration,mood:quiet,viewport});
 assert.deepEqual(frame(0).restorationLights,[]);
 const oven=frame(1),courtyard=frame(2),workshop=frame(4),complete=frame(7),windows=m.VILLAGE_PLATES[0].windows;
 const center=(bounds:readonly number[])=>[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2];
 assert.deepEqual([oven.restorationLights.length,...Object.values(oven.restorationLights[0].center)], [1,...center(windows[0].bounds)]);
 assert.equal(courtyard.restorationLights.length,0);assert.deepEqual(courtyard.residents.map((resident:any)=>resident.apertureId).sort(),windows.map((window:any)=>window.id).sort());
 assert.deepEqual([workshop.restorationLights.length,...Object.values(workshop.restorationLights[0].center)], [1,...center(windows[1].bounds)]);
 assert.equal(complete.restorationLights.length,2);assert.equal(complete.residents.length,2);
 assert.notEqual(complete.restorationLights[0].center.x,complete.restorationLights[1].center.x,'oven and workshop remain spatially distinct without relying on hue');
});

test('restored neighbours obey alarm evacuation and return only in late recovery',async()=>{
 const m=await life(),frame=(mood:any)=>m.villageFrame({age:3,time:9,reduced:true,restoration:7,mood,viewport});
 const quietFrame=frame(quiet);assert.equal(quietFrame.residents.filter((resident:any)=>resident.panes.some((pane:any)=>pane.alpha>.2)).length,2);
 const alarm=frame({...quiet,mood:'alarmed',alarmMix:1,alarmEnteredAt:8});assert.ok(alarm.residents.every((resident:any)=>resident.panes.every((pane:any)=>pane.alpha<=.2)));assert.ok(alarm.restorationLights.every((light:any)=>light.alpha<quietFrame.restorationLights[0].alpha));
 const early=frame({...quiet,mood:'recovering',alarmMix:.8});assert.ok(early.residents.every((resident:any)=>resident.panes.every((pane:any)=>pane.alpha<=.2)));
 const late=frame({...quiet,mood:'recovering',alarmMix:.2});assert.equal(late.residents.filter((resident:any)=>resident.panes.some((pane:any)=>pane.alpha>.2)).length,2);
});

test('courtyard restoration keeps both rooms inhabited through normal-motion visitor gaps and late recovery',async()=>{
 const m=await life(),occupied=(age:number,time:number,mood:any=quiet)=>m.villageFrame({age,time,reduced:false,restoration:2,mood,viewport}).residents.filter((resident:any)=>resident.panes.some((pane:any)=>pane.alpha>.2)).map((resident:any)=>resident.apertureId).sort();
 for(let age=0;age<6;age++)for(const time of [0,1,5.9,7,9,11.9,12,25])assert.deepEqual(occupied(age,time),m.VILLAGE_PLATES[age].windows.map((window:any)=>window.id).sort(),`age ${age} time ${time}`);
 assert.deepEqual(occupied(0,9,{...quiet,mood:'recovering',alarmMix:.1}),m.VILLAGE_PLATES[0].windows.map((window:any)=>window.id).sort());
 assert.deepEqual(occupied(0,9,{...quiet,mood:'recovering',alarmMix:.8}),[]);
 assert.deepEqual(occupied(0,9,{...quiet,mood:'alarmed',alarmMix:1,alarmEnteredAt:0}),[]);
});

test('restoration frames are finite, immutable and hard bounded for every accepted or malformed mask',async()=>{
 const m=await life();
 for(let age=0;age<6;age++)for(const restoration of [0,1,2,3,4,5,6,7,NaN,Infinity,-1,8,999,1.5]){
  const input:any={age,time:13.75,reduced:false,restoration,mood:{...quiet},viewport:{...viewport,placement:{...viewport.placement},hudSourceBounds:[]}};const before=structuredClone(input),frame=m.villageFrame(input);
  assert.deepEqual(input,before);assert.ok(frame.restorationLights.length<=2);assert.ok(frame.residents.length<=2);
  for(const light of frame.restorationLights){assert.ok(Object.values(light.center).every(Number.isFinite));assert.ok(Number.isFinite(light.rx)&&Number.isFinite(light.ry)&&Number.isFinite(light.alpha));assert.ok(light.rx>0&&light.ry>0&&light.alpha>=0&&light.alpha<=1);}
  if(!Number.isInteger(restoration)||restoration<0||restoration>7)assert.equal(frame.restorationLights.length,0);
 }
});

test('reduced motion freezes restored warmth and habitation without hiding saved progress',async()=>{
 const m=await life();
 for(let age=0;age<6;age++){const first=m.villageFrame({age,time:0,reduced:true,restoration:7,mood:quiet,viewport}),later=m.villageFrame({age,time:999,reduced:true,restoration:7,mood:quiet,viewport});assert.deepEqual(later,first);assert.equal(first.restorationLights.length,2);assert.equal(first.residents.length,2);}
});

test('victory brings two measured witnesses home with six upward acknowledgement strokes',async()=>{
 const m=await life();
 for(let age=0;age<6;age++){
  const frame=m.villageFrame({age,time:9,reduced:false,restoration:0,mood:{...quiet,mood:'alarmed',alarmMix:1,alarmEnteredAt:8},viewport,verdict:{mode:'celebrate',progress:1}});
  assert.equal(frame.residents.length,2);assert.equal(frame.residents.filter((resident:any)=>resident.panes.some((pane:any)=>pane.alpha>.2)).length,2);
  assert.equal(frame.verdictStrokes.length,6);
  const windows=m.VILLAGE_PLATES[age].windows;
  for(const [index,stroke] of frame.verdictStrokes.entries()){
   const bounds=windows[Math.floor(index/3)].bounds;assert.ok(inside(stroke.from,[bounds[0]-8,bounds[1]-10,bounds[2]+8,bounds[3]+3]));assert.ok(inside(stroke.to,[bounds[0]-8,bounds[1]-10,bounds[2]+8,bounds[3]+3]));
   assert.ok(stroke.to.y<stroke.from.y,'victory marks rise instead of reading as shutters');assert.ok(stroke.alpha>0&&stroke.alpha<=1);
  }
 }
});

test('defeat clears witnesses and closes both measured apertures with four crossed strokes',async()=>{
 const m=await life();
 for(let age=0;age<6;age++){
  const ordinary=m.villageFrame({age,time:0,reduced:true,restoration:7,mood:quiet,viewport});
  const frame=m.villageFrame({age,time:0,reduced:true,restoration:7,mood:quiet,viewport,verdict:{mode:'shelter',progress:1}});
  assert.equal(frame.residents.length,0);assert.equal(frame.verdictStrokes.length,4);assert.equal(frame.lamps.length,ordinary.lamps.length);assert.equal(frame.restorationLights.length,ordinary.restorationLights.length);
  assert.ok(frame.lamps.every((lamp:any,index:number)=>lamp.alpha<ordinary.lamps[index].alpha));assert.ok(frame.restorationLights.every((lamp:any,index:number)=>lamp.alpha<ordinary.restorationLights[index].alpha));
  for(const [index,stroke] of frame.verdictStrokes.entries()){
   const bounds=m.VILLAGE_PLATES[age].windows[Math.floor(index/2)].bounds;assert.ok(inside(stroke.from,bounds)&&inside(stroke.to,bounds));assert.ok(stroke.alpha>0&&stroke.alpha<=1);
  }
 }
});

test('verdict composition stays finite bounded immutable and never duplicates ordinary occupancy',async()=>{
 const m=await life();
 for(let age=0;age<6;age++)for(const verdict of [{mode:'celebrate',progress:0},{mode:'celebrate',progress:.5},{mode:'celebrate',progress:1},{mode:'shelter',progress:0},{mode:'shelter',progress:.5},{mode:'shelter',progress:1}] as const){
  const input:any={age,time:13,reduced:false,restoration:7,mood:{...quiet},viewport:{...viewport,placement:{...viewport.placement},hudSourceBounds:[]},verdict:{...verdict}},before=structuredClone(input),frame=m.villageFrame(input);
  assert.deepEqual(input,before);assert.ok(frame.residents.length<=2);assert.ok(frame.verdictStrokes.length<=6);assert.ok(frame.lamps.length<=4);assert.ok(frame.restorationLights.length<=2);
  assert.equal(new Set(frame.residents.map((resident:any)=>resident.apertureId)).size,frame.residents.length);
  for(const stroke of frame.verdictStrokes)for(const value of [stroke.from.x,stroke.from.y,stroke.to.x,stroke.to.y,stroke.width,stroke.alpha,stroke.color])assert.ok(Number.isFinite(value));
 }
});

test('malformed placement and huge time fall back to finite bounded verdict composition',async()=>{
 const m=await life(),placements=[
  {x:NaN,y:0,scale:1},{x:0,y:Infinity,scale:1},{x:0,y:0,scale:NaN},{x:0,y:0,scale:0},{x:0,y:0,scale:-1},
  {x:Number.MAX_VALUE,y:-Number.MAX_VALUE,scale:Number.MAX_VALUE},
 ];
 for(let age=0;age<6;age++)for(const placement of placements)for(const verdict of [{mode:'celebrate',progress:1},{mode:'shelter',progress:1}] as const){
  const input:any={age,time:Number.MAX_VALUE,reduced:false,restoration:7,mood:quiet,viewport:{...viewport,placement:{...placement}},verdict:{...verdict}},before=structuredClone(input),frame=m.villageFrame(input);
  assert.deepEqual(input,before);assert.ok(frame.residents.length<=2);assert.ok(frame.verdictStrokes.length<=6);assert.ok(frame.lamps.length<=4);assert.ok(frame.restorationLights.length<=2);
  const polygons=[...frame.residents.flatMap((resident:any)=>resident.panes),...(frame.bird??[])],strokes=[...frame.verdictStrokes,...frame.water],halos=[...frame.lamps,...frame.restorationLights];
  const values=[...polygons.flatMap((polygon:any)=>[polygon.alpha,...polygon.points.flatMap((point:any)=>[point.x,point.y])]),...strokes.flatMap((stroke:any)=>[stroke.from.x,stroke.from.y,stroke.to.x,stroke.to.y,stroke.width,stroke.alpha]),...halos.flatMap((lamp:any)=>[lamp.center.x,lamp.center.y,lamp.rx,lamp.ry,lamp.alpha])];
  assert.ok(values.every(value=>Number.isFinite(value)&&Math.abs(value)<=2_000),`unbounded placement output: ${JSON.stringify({placement,values})}`);
 }
});

test('malformed cached viewport geometry cannot leak non-finite bird coordinates',async()=>{
 const m=await life(),malformed=[
  {skyPath:[NaN,90,660,190]},
  {skyPath:[250,90,Infinity,190]},
  {skyPath:[660,190,250,90]},
  {skyPath:[-Number.MAX_VALUE,90,Number.MAX_VALUE,190]},
  {visibleSource:[NaN,0,900,1000],skyPath:undefined},
  {visibleSource:[0,0,Infinity,1000],skyPath:undefined},
  {hudSourceBounds:[[NaN,0,100,100]],skyPath:undefined},
  {cssWorldScale:Number.MAX_VALUE,skyPath:undefined},
 ] as const;
 for(let age=0;age<6;age++)for(const overrides of malformed){
  const input:any={age,time:10,reduced:false,restoration:7,mood:quiet,viewport:{...viewport,...overrides,placement:{...viewport.placement}}},before=structuredClone(input),frame=m.villageFrame(input);
  assert.deepEqual(input,before);
  const values=(frame.bird??[]).flatMap((polygon:any)=>polygon.points.flatMap((point:any)=>[point.x,point.y]));
  assert.ok(values.every(value=>Number.isFinite(value)&&Math.abs(value)<=2_000),`unbounded cached viewport output: ${JSON.stringify({age,overrides,values})}`);
 }
});
