import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import {duskLightAnchors} from '../src/view/dusk-atmosphere.ts';
import {landscapePlacement} from '../src/view/visual-theme.ts';

async function hierarchy(){
 const path='../src/view/lighting-hierarchy.ts';
 const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});
 assert.ok(m,'lighting hierarchy model must exist');return m;
}

test('every chapter balances warm focal light with weaker cool atmospheric support',async()=>{
 const m=await hierarchy();
 for(let age=0;age<6;age++){
  const marks=m.lightingHierarchyFrame(age,8,false);
  const warm=marks.filter((x:any)=>x.temperature==='warm'),cool=marks.filter((x:any)=>x.temperature==='cool');
  assert.ok(warm.length>=2&&cool.length>=1);
  assert.ok(Math.max(...warm.map((x:any)=>x.alpha))>Math.max(...cool.map((x:any)=>x.alpha)));
  assert.ok(marks.length<=12);
  for(const mark of marks){
   assert.ok(mark.alpha>0&&mark.alpha<=.1);
   assert.ok(mark.rx>0&&mark.rx<=105);assert.ok(mark.ry>0&&mark.ry<=55);
   assert.ok(mark.y+mark.ry<590);
  }
 }
});

test('warm pools stay registered to real practical-light anchors instead of floating freely',async()=>{
 const m=await hierarchy();
 for(let age=0;age<6;age++){
  const anchors=duskLightAnchors(age),warm=m.lightingHierarchyFrame(age,0,true).filter((x:any)=>x.temperature==='warm');
  for(const anchor of anchors){
   assert.ok(warm.some((mark:any)=>Math.hypot(mark.x-anchor.x,mark.y-anchor.y)<48),`chapter ${age} lamp lacks local hierarchy light`);
  }
 }
});

test('reduced motion preserves the complete lighting composition without breathing',async()=>{
 const m=await hierarchy();
 for(let age=0;age<6;age++){
  const fixed=m.lightingHierarchyFrame(age,0,true);
  for(const t of [1,30,999,Infinity,NaN])assert.deepEqual(m.lightingHierarchyFrame(age,t,true),fixed);
  assert.notDeepEqual(m.lightingHierarchyFrame(age,0,false),m.lightingHierarchyFrame(age,20,false));
 }
});

test('invalid age and time input falls back safely with finite bounded geometry',async()=>{
 const m=await hierarchy(),fallback=m.lightingHierarchyFrame(0,0,false);
 for(const age of [-1,6,1.5,NaN,Infinity])assert.deepEqual(m.lightingHierarchyFrame(age,0,false),fallback);
 for(const time of [-1,NaN,Infinity,1e300])for(const mark of m.lightingHierarchyFrame(3,time,false))for(const value of Object.values(mark))if(typeof value==='number')assert.ok(Number.isFinite(value));
});

test('lighting hierarchy shares the authored scenery crop exactly',async()=>{
 const m=await hierarchy(),sample=m.lightingHierarchyFrame(3,0,true)[0];
 for(const [w,h] of [[320,230],[390,480],[450,650],[480,320]]){
  const placement=landscapePlacement(w,h,h*.66),mark=m.projectHierarchyMark(sample,placement);
  assert.equal(mark.x,placement.x+sample.x*placement.scale);assert.equal(mark.y,placement.y+sample.y*placement.scale);
  assert.equal(mark.rx,sample.rx*placement.scale);assert.equal(mark.ry,sample.ry*placement.scale);
 }
});

test('production painter stays bounded and does not mutate source marks',async()=>{
 const m=await hierarchy();
 for(let age=0;age<6;age++){
  const frame=m.lightingHierarchyFrame(age,3,false),before=JSON.stringify(frame),shapes:number[][]=[];
  const painter={fillStyle(){},fillEllipse(...args:number[]){shapes.push(args);}};
  m.paintLightingHierarchy(painter,frame,{x:0,y:0,scale:1});
  assert.ok(shapes.length>0&&shapes.length<=36);
  for(const [x,y,w,h] of shapes){assert.ok(Number.isFinite(x)&&w>0&&h>0);assert.ok(y+h/2<590);}
  assert.equal(JSON.stringify(frame),before);
 }
});

test('battlefield paints hierarchy through existing ambience before bases and troops',()=>{
 const source=battlefieldSource();
 assert.match(source,/paintLightingHierarchy\(g,lightingHierarchyFrame\(host\.game\.profile\.age,host\.clock\(\),host\.reduce\(\)\),landscapePlacement\(450,host\.layout\(\)\.height,host\.layout\(\)\.groundY\)\)/);
 assert.ok(source.indexOf('this.world.add(this.ambience)')<source.indexOf('this.world.add(this.armyLayer)'));
});
