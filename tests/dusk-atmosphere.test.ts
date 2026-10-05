import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/paintDuskAtmosphere\(g,duskAtmosphereFrame\(game.profile.age,this.clock,this.reduce\),landscapePlacement\(450,this.layout.height,this.layout.groundY\)\)/);
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
