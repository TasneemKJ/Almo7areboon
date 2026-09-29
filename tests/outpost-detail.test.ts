import test from 'node:test';
import assert from 'node:assert/strict';
import {baseSvg} from '../src/view/levantine-bases.ts';

async function details(){const path='../src/view/outpost-detail.ts';const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});assert.ok(m,'outpost detail grammar must exist');return m;}

test('six chapters have distinct bounded architectural detail sets',async()=>{
 const m=await details(),all=[];
 for(let age=0;age<6;age++){
  const svg=m.outpostDetailSvg(age,'player');all.push(svg);
  assert.match(svg,/data-layer="outpost-detail"/);assert.match(svg,new RegExp(`data-age="${age}"`));
  assert.doesNotMatch(svg,/<image|<script|foreignObject|NaN|undefined|Infinity/);
  assert.ok(svg.length>450&&svg.length<8000);
  const spec=m.outpostDetailSpec(age);assert.ok(spec.marks>=6&&spec.marks<=18);assert.ok(spec.maxY<=138&&spec.minX>=12&&spec.maxX<=148);
 }
 assert.equal(new Set(all).size,6);
});

test('faction changes color only, never architectural geometry',async()=>{
 const m=await details();
 const normalize=(s:string)=>s.replaceAll('#71bdd1','#TEAM').replaceAll('#e58b76','#TEAM').replaceAll('#b6edf0','#BRIGHT').replaceAll('#ffe0b2','#BRIGHT');
 for(let age=0;age<6;age++)assert.equal(normalize(m.outpostDetailSvg(age,'player')),normalize(m.outpostDetailSvg(age,'enemy')));
});

test('outpost detail is integrated inside the authored base before practical light',()=>{
 for(let age=0;age<6;age++)for(const side of ['player','enemy'] as const){
  const svg=baseSvg(age,side),detail=svg.indexOf('data-layer="outpost-detail"'),light=svg.indexOf('data-layer="practical-light"');
  assert.ok(detail>0&&light>detail,`${age} ${side}`);
 }
});

test('all twelve detailed bases remain unique and self-contained',()=>{
 const outputs=[];
 for(let age=0;age<6;age++)for(const side of ['player','enemy'] as const){
  const svg=baseSvg(age,side);outputs.push(svg);
  assert.doesNotMatch(svg,/<image|<script|foreignObject|(?:href|src)="https?:\/\//);
  assert.match(svg,/width="160" height="160"/);
 }
 assert.equal(new Set(outputs).size,12);
});

test('invalid chapter detail falls back to first outpost',async()=>{
 const m=await details();
 for(const age of [-1,6,1.5,NaN,Infinity]){
  assert.equal(m.outpostDetailSvg(age,'player'),m.outpostDetailSvg(0,'player'));
  assert.deepEqual(m.outpostDetailSpec(age),m.outpostDetailSpec(0));
 }
});
