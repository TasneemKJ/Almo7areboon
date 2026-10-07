import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import {landscapeSvg} from '../src/view/world-illustrations.ts';
import {landscapePlacement} from '../src/view/visual-theme.ts';
async function dusk(){
 const path='../src/view/dusk-atmosphere.ts';
 const m=await import(path).catch(()=>null);
 assert.ok(m,'living dusk needs a tested presentation model');return m;
}

test('six chapters have registered lamps and bounded mist instead of a full-screen dark overlay',async()=>{
 const m=await dusk(),frames=[];
 for(let age=0;age<6;age++){
  const frame=m.duskAtmosphereFrame(age,14,false);frames.push(JSON.stringify(frame));
  assert.ok(frame.some((mark:any)=>mark.kind==='glow'));
  assert.equal(frame.filter((mark:any)=>mark.kind==='mist').length,2);
  assert.ok(frame.length<=14);
  for(const mark of frame){assert.ok(mark.y+mark.ry<605);assert.ok(mark.rx<=180);assert.ok(mark.alpha>0&&mark.alpha<=.18);}
 }
 assert.equal(new Set(frames).size,6);
});
test('reduced motion is a stable composition while the ordinary scene evolves slowly',async()=>{
 const m=await dusk();
 for(let age=0;age<6;age++){
  assert.deepEqual(m.duskAtmosphereFrame(age,0,true),m.duskAtmosphereFrame(age,999,true));
  assert.notDeepEqual(m.duskAtmosphereFrame(age,0,false),m.duskAtmosphereFrame(age,20,false));
  const a=m.duskAtmosphereFrame(age,4,false),b=m.duskAtmosphereFrame(age,4+1/60,false);
  a.forEach((v:any,i:number)=>{assert.ok(Math.abs(v.x-b[i].x)<1);assert.ok(Math.abs(v.alpha-b[i].alpha)<.005);});
 }
});
test('invalid scene/time inputs recover without non-finite or unbounded graphics',async()=>{
 const m=await dusk();
 for(const age of [-1,6,NaN,Infinity])assert.deepEqual(m.duskAtmosphereFrame(age,0,false),m.duskAtmosphereFrame(0,0,false));
 for(const time of [-1,NaN,Infinity,1e300]){
  const frame=m.duskAtmosphereFrame(2,time,false);
  for(const mark of frame)for(const value of Object.values(mark))if(typeof value==='number')assert.ok(Number.isFinite(value));
 }
});
test('dusk light coordinates are grounded in the real authored lamps or fire',async()=>{
 const m=await dusk();
 for(let age=0;age<6;age++){
  const svg=landscapeSvg(age,false);
  for(const light of m.duskLightAnchors(age)){
   if(age===0)assert.ok(svg.includes(`cx="${light.x}" cy="${light.y}"`));
   else assert.ok(svg.includes(`translate(${light.x} ${light.y}) scale(${light.scale})`),`unregistered chapter ${age} light`);
  }
 }
});
test('soft graphics share the landscape crop exactly across phone proportions',async()=>{
 const m=await dusk(),sample=m.duskAtmosphereFrame(3,0,false)[0];
 for(const [w,h] of [[450,300],[450,430],[450,620],[320,520]]){
  const placement=landscapePlacement(w,h),mark=m.projectDuskMark(sample,placement);
  assert.equal(mark.x,placement.x+sample.x*placement.scale);
  assert.equal(mark.y,placement.y+sample.y*placement.scale);
  assert.equal(mark.rx,sample.rx*placement.scale);assert.equal(mark.ry,sample.ry*placement.scale);
  assert.equal(mark.alpha,sample.alpha);
 }
});
test('drawing is bounded, does not mutate source data and never reaches the battle road',async()=>{
 const m=await dusk();
 for(let age=0;age<6;age++){
  const frame=m.duskAtmosphereFrame(age,30,false),before=JSON.stringify(frame),shapes:number[][]=[];
  const painter={fillStyle(){},lineStyle(){},fillEllipse(...args:number[]){shapes.push(args);},strokeEllipse(...args:number[]){shapes.push(args);}};
  m.paintDuskAtmosphere(painter,frame,{x:0,y:0,scale:1});
  assert.ok(shapes.length>0&&shapes.length<=42);
  for(const [x,y,w,h] of shapes){assert.ok(Number.isFinite(x)&&w>0&&h>0);assert.ok(y+h/2<605);}
  assert.equal(JSON.stringify(frame),before);
 }
});
test('runtime draws dusk within the existing atmosphere layer before bases and troops (source contract)',()=>{
 const source=battlefieldSource();
 assert.match(source,/paintDuskAtmosphere\(g,duskAtmosphereFrame\(host.game.profile.age,host.clock\(\),host.reduce\(\)\),landscapePlacement\(450,host.layout\(\).height,host.layout\(\).groundY\)\)/);
 assert.ok(source.indexOf('this.world.add(this.ambience)')<source.indexOf('this.world.add(this.armyLayer)'));
 assert.match(source,/if\(!game.state.paused&&!this.reduce\)this.clock\+=dt/);
});
test('harbor ripples remain below the painted boat hulls rather than washing over them',async()=>{
 const m=await dusk();
 for(const time of [0,10,20,100])for(const mark of m.duskAtmosphereFrame(2,time,false)){
  if(mark.kind==='ripple')assert.ok(mark.y-mark.ry>527,'ripples intersect the authored hull band');
 }
});
test('ultra dusk frame adds two bounded chapter-specific depth marks',async()=>{
 const m=await dusk(),signatures=[];
 for(let age=0;age<6;age++){
  const frame=m.duskAtmosphereFrame(age,12,false),depth=frame.filter((mark:any)=>mark.kind==='depth');
  assert.equal(depth.length,2);
  for(const mark of depth){assert.ok(mark.y+mark.ry<605);assert.ok(mark.alpha>0&&mark.alpha<=.18);assert.ok(mark.rx<=180);}
  signatures.push(depth.map((mark:any)=>mark.color).join(':'));
 }
 assert.ok(new Set(signatures).size>=4);
});
test('depth marks use a quieter two-fill hierarchy than practical glows',async()=>{
 const m=await dusk(),fills:number[][]=[];
 const painter={fillStyle(){},lineStyle(){},fillEllipse(...args:number[]){fills.push(args);},strokeEllipse(){}};
 m.paintDuskAtmosphere(painter,[{kind:'depth',x:200,y:300,rx:80,ry:20,color:0xabcdee,alpha:.1}],{x:0,y:0,scale:1});
 assert.equal(fills.length,2);
});
test('depth marks stay in the middle of the field, clear of the #158 tap zones and the HUD band',async()=>{
 const m=await dusk(),{DIRECT_ORDER_EDGE_FRACTION}=await import('../src/ui/battlefield-orders.ts');
 const width=900,left=width*DIRECT_ORDER_EDGE_FRACTION,right=width*(1-DIRECT_ORDER_EDGE_FRACTION),tolerance=width*.05;
 for(let age=0;age<6;age++)for(const time of [0,12,31.4,62.8,125.6,1e6])for(const reduced of [false,true]){
  for(const mark of m.duskAtmosphereFrame(age,time,reduced).filter((mark:any)=>mark.kind==='depth')){
   assert.ok(mark.x>=left&&mark.x<=right,`chapter ${age} depth centre ${mark.x} must sit between the Hold and Advance tap zones`);
   assert.ok(left-(mark.x-mark.rx)<=tolerance&&(mark.x+mark.rx)-right<=tolerance,`chapter ${age} depth haze reaches too far into an edge tap zone`);
   assert.ok(mark.y-mark.ry>=300,`chapter ${age} depth haze must stay below the sky band behind the HUD and title`);
  }
 }
});
// Observe the real Graphics boundary, rather than a prospective forty-value API.
function duskPainter(){
 const shapes:{kind:string;args:number[];style:number[]}[]=[];
 let fill:number[]=[],line:number[]=[];
 return {shapes,
  fillStyle(color:number,alpha:number){fill=[color,alpha];},
  lineStyle(width:number,color:number,alpha:number){line=[width,color,alpha];},
  fillEllipse(...args:number[]){shapes.push({kind:'fill',args,style:fill});},
  strokeEllipse(...args:number[]){shapes.push({kind:'stroke',args,style:line});},
 };
}

test('painting applies the landscape translation and scale to actual depth and ripple geometry',async()=>{
 const m=await dusk(),painter=duskPainter();
 const marks=Object.freeze([
  Object.freeze({kind:'depth',x:200,y:300,rx:80,ry:20,color:0xabcdee,alpha:.1}),
  Object.freeze({kind:'ripple',x:240,y:540,rx:30,ry:2,color:0x123456,alpha:.12}),
 ]),placement=Object.freeze({x:13,y:-7,scale:.5});
 const before=JSON.stringify({marks,placement});
 m.paintDuskAtmosphere(painter,marks,placement);
 // Independent half-scale fixture: centre (200,300) becomes (113,143).
 const depth=painter.shapes.filter(s=>s.kind==='fill');
 assert.equal(depth.length,2);
 assert.deepEqual(depth[0].args,[113,143,80,20]);
 assert.equal(depth[1].args[0],113);assert.equal(depth[1].args[1],143);
 assert.ok(depth[1].args[2]>0&&depth[1].args[2]<80);
 assert.ok(depth[1].args[3]>0&&depth[1].args[3]<20);
 for(const shape of depth){assert.equal(shape.style[0],0xabcdee);assert.ok(shape.style[1]>0&&shape.style[1]<.1);}
 const ripple=painter.shapes.filter(s=>s.kind==='stroke');
 assert.equal(ripple.length,1);assert.deepEqual(ripple[0].args,[133,263,30,2]);
 assert.deepEqual(ripple[0].style,[.5,0x123456,.12]);
 assert.equal(JSON.stringify({marks,placement}),before);
});

test('each painted mark supplies its own style without reusing a preceding glow or ripple style',async()=>{
 const m=await dusk(),painter=duskPainter();
 m.paintDuskAtmosphere(painter,[
  {kind:'glow',x:20,y:30,rx:8,ry:6,color:0xfedcba,alpha:.16},
  {kind:'ripple',x:40,y:50,rx:12,ry:2,color:0x456789,alpha:.09},
  {kind:'depth',x:60,y:70,rx:30,ry:10,color:0xabcdef,alpha:.05},
 ],{x:0,y:0,scale:2});
 assert.equal(painter.shapes.length,6);
 const [g1,g2,g3,r,d1,d2]=painter.shapes;
 for(const glow of [g1,g2,g3]){assert.equal(glow.kind,'fill');assert.equal(glow.style[0],0xfedcba);}
 assert.equal(r.kind,'stroke');assert.deepEqual(r.style,[1.8,0x456789,.09]);
 for(const depth of [d1,d2]){assert.equal(depth.kind,'fill');assert.equal(depth.style[0],0xabcdef);assert.ok(depth.style[1]>0&&depth.style[1]<.05);}
});

test('the rendered six-chapter composition freezes in reduced motion and keeps finite phone geometry',async()=>{
 const m=await dusk();
 const render=(age:number,time:number,reduced:boolean,width:number,height:number)=>{
  const painter=duskPainter();
  m.paintDuskAtmosphere(painter,m.duskAtmosphereFrame(age,time,reduced),landscapePlacement(width,height));
  return painter.shapes;
 };
 for(let age=0;age<6;age++)for(const [width,height] of [[320,520],[450,300],[450,620]]){
  const a=render(age,1,true,width,height),b=render(age,99,true,width,height);
  assert.ok(a.length>0);assert.deepEqual(a,b);
  assert.notDeepEqual(render(age,1,false,width,height),render(age,99,false,width,height));
  for(const shape of a){
   for(const value of [...shape.args,...shape.style])assert.ok(Number.isFinite(value));
   assert.ok(shape.args[2]>0&&shape.args[3]>0);
   const alpha=shape.style.at(-1)!;assert.ok(alpha>0&&alpha<=.18);
  }
 }
});
test('refinement strengths are bounded, deterministic and calm for bad input',async()=>{
 const m=await dusk();
 for(let age=-2;age<9;age++)for(const time of [0,12,1e9,NaN,-5,Infinity])for(const reduced of [false,true]){
  const r=m.duskRefinement40(age,time,reduced);
  assert.deepEqual(Object.keys(r),[...m.DUSK_REFINEMENT_GROUPS]);
  for(const group of m.DUSK_REFINEMENT_GROUPS){assert.equal(r[group].length,5);for(const v of r[group])assert.ok(Number.isFinite(v)&&v>=0&&v<=1,`${group} ${v}`);}
 }
 assert.deepEqual(m.duskRefinement40(3,12,false),m.duskRefinement40(3,12,false));
 assert.notDeepEqual(m.duskRefinement40(0,12,false).depth,m.duskRefinement40(5,12,false).depth);
});
