import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unitSheetSvg,unitSvg} from '../src/view/unit-illustrations.ts';

async function expression(){
 const path='../src/view/character-expression.ts';
 const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});
 assert.ok(m,'character expression model must exist');
 return m;
}

test('six animation frames create a controlled expression progression instead of one mask',async()=>{
 const m=await expression();
 for(const kind of [0,1,2] as const){
  const frames=Array.from({length:6},(_,frame)=>m.characterExpression(kind,frame));
  assert.ok(new Set(frames.map((x:any)=>JSON.stringify(x))).size>=4,`role ${kind} needs at least four readable expression states`);
  assert.equal(frames[0].intent,'ready');
  assert.equal(frames[4].intent,'anticipate');
  assert.equal(frames[5].intent,'follow-through');
 }
});

test('role personality stays distinct at attack anticipation without exaggerated geometry',async()=>{
 const m=await expression();
 const melee=m.characterExpression(0,4),ranged=m.characterExpression(1,4),heavy=m.characterExpression(2,4);
 assert.notDeepEqual(melee,ranged);assert.notDeepEqual(ranged,heavy);assert.notDeepEqual(melee,heavy);
 assert.ok(melee.browTilt>ranged.browTilt,'melee should commit more strongly through the brow');
 assert.ok(ranged.gazeX>melee.gazeX,'ranged anticipation should look farther toward the target');
 assert.ok(heavy.eyeOpen<=melee.eyeOpen,'heavy expression should stay compressed/stern');
 for(const pose of [melee,ranged,heavy]){
  assert.ok(pose.gazeX>=-.9&&pose.gazeX<=1.4);
  assert.ok(pose.gazeY>=-.5&&pose.gazeY<=.5);
  assert.ok(pose.eyeOpen>=.72&&pose.eyeOpen<=1.08);
  assert.ok(Math.abs(pose.browTilt)<=2.4);
 }
});

test('expression SVG is bounded, side-independent and uses no external/text content',async()=>{
 const m=await expression();
 for(const kind of [0,1,2] as const)for(let frame=0;frame<6;frame++){
  const svg=m.characterExpressionSvg(kind,frame,'url(#us)');
  assert.match(svg,new RegExp(`data-expression-frame="${frame}"`));
  assert.match(svg,new RegExp(`data-expression-role="${kind}"`));
  assert.doesNotMatch(svg,/<text|<image|<script|foreignObject|NaN|undefined|Infinity/);
  assert.ok(svg.length<2600);
  // Face detail stays within the existing 3/4 head box, never changing outer silhouette.
  const circles=[...svg.matchAll(/<(?:ellipse|circle)[^>]*(?:cx|data-cx)="([\d.]+)"[^>]*(?:cy|data-cy)="([\d.]+)"/g)];
  for(const match of circles){const x=Number(match[1]),y=Number(match[2]);assert.ok(x>=55&&x<=81);assert.ok(y>=40&&y<=68);}
 }
});

test('unit portraits and all six atlas frames use the expression source without faction-specific face geometry',async()=>{
 for(let age=0;age<6;age++)for(const kind of [0,1] as const){
  const player=unitSvg(age,kind,'player',4),enemy=unitSvg(age,kind,'enemy',4);
  assert.match(player,/data-expression-frame="4"/);assert.match(enemy,/data-expression-frame="4"/);
  const signature=(svg:string)=>(svg.match(/<g data-expression-frame="4"[\s\S]*?<\/g>/)?.[0]??'').replaceAll('url(#us)','SKIN');
  assert.equal(signature(player),signature(enemy));
  const sheet=unitSheetSvg(age,kind,'player');
  for(let frame=0;frame<6;frame++)assert.ok(sheet.includes(`data-expression-frame="${frame}"`));
 }
});

test('invalid role/frame inputs fall back safely and static face markup is replaced by the helper',async()=>{
 const m=await expression(),fallback=m.characterExpression(0,0);
 for(const kind of [-1,3,NaN,Infinity])assert.deepEqual(m.characterExpression(kind,0),fallback);
 for(const frame of [-1,6,1.5,NaN,Infinity])assert.deepEqual(m.characterExpression(0,frame),fallback);
 const source=readFileSync(new URL('../src/view/unit-illustrations.ts',import.meta.url),'utf8');
 assert.match(source,/characterExpressionSvg\(kind,frame,skin\)/);
 assert.doesNotMatch(source,/e\(62,51,2\.5,3\.5,INK\)/);
 assert.doesNotMatch(source,/M59 42l7-1M74 41l5 1/);
});

test('determined attack mouth reads as a set line rather than a worried downturn',async()=>{
 const m=await expression();
 for(const kind of [0,2] as const){
  const svg=m.characterExpressionSvg(kind,4,'url(#us)');
  assert.match(svg,/M64 65L75 65/);
  assert.doesNotMatch(svg,/M64 65Q70 63 75 65/);
 }
});
