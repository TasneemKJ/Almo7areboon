import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

async function impact(){
 const path='../src/view/impact-material.ts';
 const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});
 assert.ok(m,'material-specific impact choreography must exist');
 return m;
}

test('impact families progress from earth to metal and energy without changing combat rules',async()=>{
 const m=await impact();
 assert.equal(m.impactMaterial(0,0),'earth');
 assert.equal(m.impactMaterial(1,1),'earth');
 assert.equal(m.impactMaterial(2,0),'bronze');
 assert.equal(m.impactMaterial(3,1),'powder');
 assert.equal(m.impactMaterial(4,2),'steel');
 assert.equal(m.impactMaterial(5,0),'energy');
});

test('contact-to-dissipation timing changes mark language while staying tightly local',async()=>{
 const m=await impact();
 for(let age=0;age<6;age++)for(const kind of [0,1,2] as const){
  const start=m.impactMaterialFrame(age,kind,'player',0,false);
  const late=m.impactMaterialFrame(age,kind,'player',.8,false);
  assert.notDeepEqual(start,late);
  assert.ok(start.length>=2&&start.length<=9);assert.ok(late.length>=1&&late.length<=9);
  for(const mark of [...start,...late]){
   assert.ok(Math.abs(mark.x)<=30&&mark.y>=-31&&mark.y<=18);
   assert.ok(mark.size>0&&mark.size<=28);assert.ok(mark.alpha>=0&&mark.alpha<=1);
   assert.ok(Number.isFinite(mark.angle));
  }
 }
});

test('heavy impacts carry more visual mass without multiplying effect count out of budget',async()=>{
 const m=await impact();
 for(let age=0;age<6;age++){
  const light=m.impactMaterialFrame(age,0,'player',.15,false),heavy=m.impactMaterialFrame(age,2,'player',.15,false);
  assert.ok(Math.max(...heavy.map((x:any)=>x.size))>=Math.max(...light.map((x:any)=>x.size)));
  assert.ok(heavy.length<=9);
 }
});

test('faction direction mirrors geometry; only energy hue is faction-coded',async()=>{
 const m=await impact();
 for(let age=0;age<6;age++){
  const player=m.impactMaterialFrame(age,1,'player',.2,false),enemy=m.impactMaterialFrame(age,1,'enemy',.2,false);
  assert.equal(player.length,enemy.length);
  for(let i=0;i<player.length;i++){
   assert.equal(player[i].x,-enemy[i].x);assert.equal(player[i].y,enemy[i].y);assert.equal(player[i].size,enemy[i].size);
   assert.equal(player[i].angle,-enemy[i].angle);
   if(age!==5)assert.equal(player[i].color,enemy[i].color);
  }
 }
});

test('reduced motion uses one static readable contact composition',async()=>{
 const m=await impact();
 for(let age=0;age<6;age++)for(const kind of [0,1,2] as const){
  const fixed=m.impactMaterialFrame(age,kind,'player',0,true);
  assert.ok(fixed.length>=1&&fixed.length<=3);
  for(const p of [.1,.5,.99,NaN,Infinity])assert.deepEqual(m.impactMaterialFrame(age,kind,'player',p,true),fixed);
 }
});

test('invalid impact inputs fall back to finite first-chapter melee geometry',async()=>{
 const m=await impact(),fallback=m.impactMaterialFrame(0,0,'player',0,false);
 for(const age of [-1,6,1.5,NaN,Infinity])assert.deepEqual(m.impactMaterialFrame(age,0,'player',0,false),fallback);
 for(const kind of [-1,3,NaN,Infinity])assert.deepEqual(m.impactMaterialFrame(0,kind,'player',0,false),fallback);
 for(const p of [-1,NaN,Infinity,1e300])for(const mark of m.impactMaterialFrame(3,1,'player',p,false))for(const value of Object.values(mark))if(typeof value==='number')assert.ok(Number.isFinite(value));
});

test('battlefield queues material impact at direct and projectile contact without touching simulation state',()=>{
 const source=battlefieldSource();
 assert.match(source,/impactMaterialFrame\(cue\.age,cue\.kind,cue\.side,progress,host\.reduce\(\)\)/);
 assert.match(source,/impactCues\.push\(\{x,y,age,kind,side/);
 assert.match(source,/impact\(bolt\.to\.x,bolt\.to\.y,bolt\.damage,bolt\.age,bolt\.kind,bolt\.side/);
 assert.doesNotMatch(source,/game\.state\.[A-Za-z0-9_]+\s*=[^=]/);
});
