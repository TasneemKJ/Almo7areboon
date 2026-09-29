import test from 'node:test';
import assert from 'node:assert/strict';
import {foregroundSvg} from '../src/view/world-illustrations.ts';

async function foregroundVignettes(){
 const path='../src/view/foreground-vignettes.ts';
 const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});
 assert.ok(m,'asymmetric foreground vignette grammar must exist');
 return m;
}

const vocab=[
 ['lantern-shelf','olive-rock'],
 ['harvest-basket','vine-post'],
 ['rope-post','net-bundle'],
 ['pottery-step','awning-edge'],
 ['railing-utility','antenna-edge'],
 ['garden-arch','luminous-planter'],
] as const;

test('all six chapters have distinct asymmetric foreground framing',async()=>{
 const m=await foregroundVignettes(),all:string[]=[];
 for(let age=0;age<6;age++){
  const svg=m.foregroundVignettesSvg(age);all.push(svg);
  assert.match(svg,/data-layer="foreground-vignettes"/);
  assert.match(svg,/data-side="left"/);assert.match(svg,/data-side="right"/);
  for(const name of vocab[age])assert.ok(svg.includes(`data-vignette="${name}"`),`chapter ${age}: ${name}`);
  assert.doesNotMatch(svg,/<text|<image|<script|foreignObject|NaN|undefined|Infinity/);
  assert.ok(svg.length<18_000);
 }
 assert.equal(new Set(all).size,6);
});

test('foreground vignette anchors stay at the edges and below the combat road',async()=>{
 const m=await foregroundVignettes();
 for(let age=0;age<6;age++){
  const svg=m.foregroundVignettesSvg(age);
  const xs=[...svg.matchAll(/data-x="([\d.]+)"/g)].map((x:any)=>Number(x[1]));
  const ys=[...svg.matchAll(/data-y="([\d.]+)"/g)].map((x:any)=>Number(x[1]));
  assert.ok(xs.length>=4&&ys.length>=4);
  assert.ok(xs.every((x:number)=>x<=160||x>=740),`chapter ${age} entered center corridor`);
  assert.ok(ys.every((y:number)=>y>=790&&y<=985),`chapter ${age} foreground depth out of band`);
 }
});

test('left and right foreground clusters are not mirrored copies',async()=>{
 const m=await foregroundVignettes();
 for(let age=0;age<6;age++){
  const svg=m.foregroundVignettesSvg(age);
  const left=[...svg.matchAll(/data-side="left"[^>]*data-vignette="([^"]+)"/g)].map((x:any)=>x[1]);
  const right=[...svg.matchAll(/data-side="right"[^>]*data-vignette="([^"]+)"/g)].map((x:any)=>x[1]);
  assert.ok(left.length>=1&&right.length>=1);
  assert.notDeepEqual(left,right);
 }
});

test('standalone foreground assets include the vignette layer without baking it into landscape backgrounds',async()=>{
 for(let age=0;age<6;age++){
  const svg=foregroundSvg(age);
  assert.match(svg,/data-layer="foreground-vignettes"/);
  assert.match(svg,/viewBox="0 560 900 440"/);
 }
});

test('invalid foreground vignette chapter indices fall back safely',async()=>{
 const m=await foregroundVignettes(),fallback=m.foregroundVignettesSvg(0);
 for(const age of [-1,6,1.2,NaN,Infinity])assert.equal(m.foregroundVignettesSvg(age),fallback);
});
