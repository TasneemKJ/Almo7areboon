import test from 'node:test';
import assert from 'node:assert/strict';
import {landscapeSvg} from '../src/view/world-illustrations.ts';
import {unitSvg} from '../src/view/unit-illustrations.ts';

async function detailModule(){
 const path='../src/view/design-detail.ts';
 const m=await import(path).catch(error=>{if((error as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(m,'design-detail must exist as production rendering code');
 return m;
}

test('all six chapters have distinct bounded material-detail compositions',async()=>{
 const m=await detailModule();
 const scenes=[];
 for(let age=0;age<6;age++){
  const svg=m.sceneMaterialDetailSvg(age);
  scenes.push(svg);
  assert.match(svg,/data-design-layer="material-detail"/);
  assert.match(svg,/data-principle="hierarchy"/);
  assert.doesNotMatch(svg,/<image|<script|foreignObject|NaN|undefined|Infinity/);
  assert.ok(svg.length<18_000,`chapter ${age} detail pass is too large`);
  const ys=[...svg.matchAll(/data-y="([\d.]+)"/g)].map((x:any)=>Number(x[1]));
  assert.ok(ys.length>=8,`chapter ${age} needs enough authored detail clusters`);
  assert.ok(Math.max(...ys)<=590,`chapter ${age} details entered the protected road`);
 }
 assert.equal(new Set(scenes).size,6);
});

test('material detail is integrated above settlement paint but before the battle road',async()=>{
 for(let age=0;age<6;age++){
  const svg=landscapeSvg(age,false);
  const settlement=svg.indexOf('data-layer="settlement"');
  const detail=svg.indexOf('data-design-layer="material-detail"');
  const road=svg.indexOf('data-layer="battle-lane"');
  assert.ok(settlement>=0&&detail>settlement&&road>detail,`chapter ${age}`);
 }
});

test('character material detail is distinct by role, faction-neutral in geometry, and present at game scale',async()=>{
 const m=await detailModule();
 for(let age=0;age<6;age++){
  const roleDetails=[];
  for(const kind of [0,1,2] as const){
   const player=m.unitMaterialDetailSvg(age,kind,'player','u');
   const enemy=m.unitMaterialDetailSvg(age,kind,'enemy','u');
   roleDetails.push(player.replaceAll('#71bdd1','#TEAM').replaceAll('#e58b76','#TEAM'));
   assert.match(player,/data-design-layer="character-material"/);
   assert.match(player,/data-principle="silhouette-first"/);
   assert.ok(unitSvg(age,kind,'player').includes(player));
   assert.ok(unitSvg(age,kind,'enemy').includes(enemy));
   const normalize=(s:string)=>s.replaceAll('#71bdd1','#TEAM').replaceAll('#e58b76','#TEAM');
   assert.equal(normalize(player),normalize(enemy));
   assert.doesNotMatch(player,/<text|<image|<script|foreignObject|NaN|undefined/);
   assert.ok(player.length<6_000);
  }
  assert.equal(new Set(roleDetails).size,3,`chapter ${age} roles need readable equipment detail`);
 }
});

test('invalid design-detail inputs fall back to first chapter and melee role',async()=>{
 const m=await detailModule();
 for(const age of [-1,6,1.2,NaN,Infinity]){
  assert.equal(m.sceneMaterialDetailSvg(age),m.sceneMaterialDetailSvg(0));
  assert.equal(m.unitMaterialDetailSvg(age,9,'player','u'),m.unitMaterialDetailSvg(0,0,'player','u'));
 }
});
