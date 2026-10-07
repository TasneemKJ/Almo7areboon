import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
async function focus(){const path='../src/view/silhouette-focus.ts';const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});assert.ok(m,'silhouette focus model must exist');return m;}

test('local focus stays subtle and bounded for every faction, role and lane',async()=>{
 const m=await focus();
 for(const side of ['player','enemy'] as const)for(const kind of [0,1,2] as const)for(const lane of [0,1,2]){
  const marks=m.unitFocusMarks(side,lane,kind,0,false);
  assert.ok(marks.length>=2&&marks.length<=3);
  for(const mark of marks){
   assert.equal(mark.kind,'ellipse');
   assert.ok(mark.alpha>0&&mark.alpha<=.13);
   assert.ok(mark.width>0&&mark.width<=60);assert.ok(mark.height>0&&mark.height<=78);
   assert.ok(Math.abs(mark.x)<=8&&mark.y<0&&mark.y>=-55);
  }
 }
});
test('faction changes color but never focus geometry or scale',async()=>{
 const m=await focus();
 for(const kind of [0,1,2] as const)for(const lane of [0,1,2]){
  const a=m.unitFocusMarks('player',lane,kind,0,false),b=m.unitFocusMarks('enemy',lane,kind,0,false);
  assert.notDeepEqual(a,b);
  const strip=(x:any)=>x.map(({color,...rest}:any)=>rest);
  assert.deepEqual(strip(a),strip(b));
 }
});
test('hit flash strengthens the focal read without breaching the alpha budget, freeze stays cool',async()=>{
 const m=await focus();
 const base=m.unitFocusMarks('enemy',1,0,0,false),hit=m.unitFocusMarks('enemy',1,0,.2,false),frozen=m.unitFocusMarks('enemy',1,0,0,true);
 assert.ok(hit[0].alpha>base[0].alpha);assert.ok(hit.every((x:any)=>x.alpha<=.13));
 assert.notEqual(frozen[0].color,base[0].color);
});
test('invalid lanes and roles use safe middle/melee fallbacks',async()=>{
 const m=await focus();
 for(const lane of [-3,9,NaN,Infinity])assert.deepEqual(m.unitFocusMarks('player',lane,0,0,false),m.unitFocusMarks('player',1,0,0,false));
 for(const kind of [-3,9,NaN,Infinity])assert.deepEqual(m.unitFocusMarks('player',1,kind,0,false),m.unitFocusMarks('player',1,0,0,false));
});
test('battlefield paints focus into the existing shadow layer before each unit shadow',()=>{
 const source=battlefieldSource();
 assert.match(source,/unitFocusMarks\(unit\.side,unit\.lane,unit\.kind,unit\.hitFlash,frozen\)/);
 assert.match(source,/fillEllipse\(x\+mark\.x,y\+mark\.y,mark\.width,mark\.height\)/);
 assert.ok(source.indexOf('unitFocusMarks(unit.side')<source.indexOf('g.fillStyle(0x243c42,perspective.shadowAlpha)'));
});
