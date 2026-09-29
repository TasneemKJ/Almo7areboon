import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

async function illustrations(){
 const path='../src/view/world-illustrations.ts';
 const m=await import(path);
 assert.equal(typeof m.foregroundSvg,'function','foreground art must be separately renderable above troops');
 return m;
}
async function theme(){
 const path='../src/view/visual-theme.ts';
 const m=await import(path);
 assert.equal(typeof m.foregroundPlacement,'function','foreground placement must share the world crop transform');
 return m;
}
async function assets(){
 const path='../src/view/visual-assets.ts';
 const m=await import(path);
 assert.equal(typeof m.foregroundTexture,'function','foreground textures need stable manifest keys');
 return m;
}

test('six era foreground frames are transparent standalone overlays rather than baked into the battlefield texture',async()=>{
 const m=await illustrations();
 const overlays=new Set<string>();
 for(let age=0;age<6;age++){
  const foreground=m.foregroundSvg(age);overlays.add(foreground);
  assert.match(foreground,/viewBox="0 560 900 440"/);
  assert.match(foreground,/data-layer="foreground"/);
  assert.doesNotMatch(foreground,/<image|<script|foreignObject|NaN|undefined/);
  assert.doesNotMatch(m.landscapeSvg(age,false),/data-layer="foreground"/);
  assert.match(m.landscapeSvg(age),/data-layer="foreground"/);
 }
 assert.equal(overlays.size,6);
});

test('foreground crop stays registered to the exact landscape transform at short and tall battle heights',async()=>{
 const m=await theme();
 for(const [width,height,ground] of [[450,430,283.8],[450,620,409.2],[320,520,343.2],[390,300,198]]){
  const world=m.landscapePlacement(width,height,ground);
  const foreground=m.foregroundPlacement(width,height,ground);
  assert.equal(foreground.x,world.x);
  assert.equal(foreground.y,world.y+560*world.scale);
  assert.equal(foreground.scale,world.scale);
  assert.equal(foreground.width,900*world.scale);
  assert.equal(foreground.height,440*world.scale);
 }
 for(const value of [NaN,Infinity,-1,0]){
  const foreground=m.foregroundPlacement(value,value,value);
  for(const number of Object.values(foreground))if(typeof number==='number')assert.ok(Number.isFinite(number));
 }
});

test('foreground assets stay within the existing texture-memory guardrail',async()=>{
 const m=await assets();const entries=m.visualAssets();
 assert.equal(entries.length,36);
 assert.equal(new Set(entries.map((entry:any)=>entry.key)).size,36);
 for(let age=0;age<6;age++){
  const item=entries.find((entry:any)=>entry.key===m.foregroundTexture(age));
  assert.ok(item,`foreground ${age} is in manifest`);
  assert.equal(item.width,1);assert.equal(item.height,1);
 }
 const pixels=entries.reduce((sum:number,entry:any)=>sum+entry.width*entry.height,0);
 assert.ok(pixels*4<42_000_000,`uncompressed texture budget ${pixels*4}`);
});

test('renderer sandwiches foreground art between actors and combat readability effects',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/private foreground!:/);
 assert.match(source,/foregroundTexture/);
 const army=source.indexOf('this.world.add(this.armyLayer)');
 const foreground=source.indexOf('this.world.add(this.foreground)');
 const action=source.indexOf('this.world.add(this.fx)');
 assert.ok(army>=0&&foreground>army&&action>foreground,'foreground must cover lower actor silhouettes but not hit cues or HUD effects');
 assert.match(source,/foregroundPlacement\(450,this\.layout\.height,this\.layout\.groundY\)/);
});
