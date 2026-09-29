import test from 'node:test';
import assert from 'node:assert/strict';
import {landscapeSvg} from '../src/view/world-illustrations.ts';

async function vignettes(){
 const path='../src/view/environment-vignettes.ts';
 const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});
 assert.ok(m,'environment storytelling vignettes must exist as production SVG code');
 return m;
}

test('all six chapters have distinct functional storytelling clusters',async()=>{
 const m=await vignettes(),all:string[]=[];
 for(let age=0;age<6;age++){
  const svg=m.environmentVignettesSvg(age);all.push(svg);
  assert.match(svg,/data-layer="environment-vignettes"/);
  const names=[...svg.matchAll(/data-vignette="([^"]+)"/g)].map((x:any)=>x[1]);
  assert.ok(new Set(names).size>=4,`chapter ${age} needs at least four distinct functional vignettes`);
  assert.doesNotMatch(svg,/<text|<image|<script|foreignObject|NaN|undefined|Infinity/);
  assert.ok(svg.length<18_000);
 }
 assert.equal(new Set(all).size,6);
});

test('storytelling detail stays above the protected battle road',async()=>{
 const m=await vignettes();
 for(let age=0;age<6;age++){
  const svg=m.environmentVignettesSvg(age);
  const ys=[...svg.matchAll(/data-y="([\d.]+)"/g)].map((x:any)=>Number(x[1]));
  assert.ok(ys.length>=4);
  assert.ok(Math.max(...ys)<=585,`chapter ${age} entered the road band`);
 }
});

test('each chapter carries its own functional vocabulary instead of one repeated prop set',async()=>{
 const m=await vignettes();
 const expected=[
  ['water-jars','firewood','woven-mat','herb-rack'],
  ['olive-baskets','irrigation-bucket','terrace-ladder','press-crates'],
  ['rope-coil','fishing-net','quay-crates','harbor-jars'],
  ['copper-tray','tool-rack','fabric-rolls','workbench'],
  ['water-tank','antenna','cable-spool','utility-box'],
  ['garden-planter','water-node','solar-canopy','service-pod'],
 ];
 for(let age=0;age<6;age++){
  const svg=m.environmentVignettesSvg(age);
  for(const name of expected[age])assert.ok(svg.includes(`data-vignette="${name}"`),`chapter ${age}: ${name}`);
 }
});

test('vignettes integrate after settlement architecture but before generic material detail',()=>{
 for(let age=0;age<6;age++){
  const svg=landscapeSvg(age,false);
  const settlement=svg.indexOf('data-layer="settlement"');
  const vignettes=svg.indexOf('data-layer="environment-vignettes"');
  const detail=svg.indexOf('data-design-layer="material-detail"');
  const road=svg.indexOf('data-layer="battle-lane"');
  assert.ok(settlement>=0&&vignettes>settlement&&detail>vignettes&&road>detail,`chapter ${age}`);
 }
});

test('invalid chapter indices fall back to first chapter without malformed output',async()=>{
 const m=await vignettes(),fallback=m.environmentVignettesSvg(0);
 for(const age of [-1,6,1.5,NaN,Infinity])assert.equal(m.environmentVignettesSvg(age),fallback);
});
