import test from 'node:test';
import assert from 'node:assert/strict';
import {landscapeSvg} from '../src/view/world-illustrations.ts';
async function depth(){const path='../src/view/cinematic-depth.ts';const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});assert.ok(m,'cinematic depth layer must exist');return m;}

test('each chapter receives a distinct atmospheric-perspective composition',async()=>{
 const m=await depth(),all=[];
 for(let age=0;age<6;age++){
  const svg=m.cinematicDepthSvg(age);all.push(svg);
  assert.match(svg,/data-design-layer="atmospheric-perspective"/);
  assert.match(svg,/data-principle="detail-falloff"/);
  assert.match(svg,/data-depth="far"/);assert.match(svg,/data-depth="mid"/);
  assert.doesNotMatch(svg,/<image|<script|foreignObject|NaN|undefined|Infinity/);
  assert.ok(svg.length<24_000);
  const ys=[...svg.matchAll(/data-y="([\d.]+)"/g)].map((m:any)=>Number(m[1]));
  assert.ok(ys.length>=10);assert.ok(Math.max(...ys)<=590);
 }
 assert.equal(new Set(all).size,6);
});
test('depth layer sits between distant land and the focal settlement',()=>{
 for(let age=0;age<6;age++){
  const svg=landscapeSvg(age,false);
  const distant=svg.indexOf('data-layer="distant-landscape"'),depth=svg.indexOf('data-design-layer="atmospheric-perspective"'),settlement=svg.indexOf('data-layer="settlement"');
  assert.ok(distant>=0&&depth>distant&&settlement>depth,`chapter ${age}`);
 }
});
test('depth grammar increases shape weight toward the focal settlement rather than the horizon',async()=>{
 const m=await depth();
 for(let age=0;age<6;age++){
  const svg=m.cinematicDepthSvg(age);
  const far=(svg.match(/data-depth="far"/g)||[]).length,mid=(svg.match(/data-depth="mid"/g)||[]).length;
  assert.ok(far>=3&&mid>=4);
  const farWidths=[...svg.matchAll(/data-depth="far"[^>]*data-weight="([\d.]+)"/g)].map((x:any)=>Number(x[1]));
  const midWidths=[...svg.matchAll(/data-depth="mid"[^>]*data-weight="([\d.]+)"/g)].map((x:any)=>Number(x[1]));
  assert.ok(Math.max(...farWidths)<Math.max(...midWidths));
 }
});
test('invalid depth input falls back to first chapter',async()=>{const m=await depth();for(const age of [-1,6,1.5,NaN,Infinity])assert.equal(m.cinematicDepthSvg(age),m.cinematicDepthSvg(0));});
