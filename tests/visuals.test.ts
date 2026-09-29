import test from 'node:test';
import assert from 'node:assert/strict';
import { ERAS } from '../src/game/data.ts';
import { createArmyUpdater } from '../src/ui/army-screen.ts';
import { defaultProfile } from '../src/game/save.ts';

async function moduleAt(name:string) {
  const path=`../src/view/${name}.ts`;
  const module=await import(path).catch(()=>null);
  assert.ok(module, `${name}: visual production module must be implemented`);
  return module;
}

test('all six real ages have their own illustrated scene and palette',async()=>{
 const m=await moduleAt('visual-theme');
 assert.deepEqual(m.VISUAL_ERAS.map((x:any)=>x.name),ERAS.map(x=>x.name));
 assert.equal(new Set(m.VISUAL_ERAS.map((x:any)=>x.sky[0])).size,6);
 assert.equal(new Set(m.VISUAL_ERAS.map((x:any)=>x.scene)).size,6);
});
test('arena resizing preserves a single scale for troops and leaves controls below combat',async()=>{
 const m=await moduleAt('visual-theme');
 for(const [width,height] of [[320,282],[390,480],[480,500],[480,720]]){
  const l=m.arenaLayout(width,height);
  assert.equal(l.scale,width/450);
  assert.equal(l.height*l.scale,height);
  assert.ok((l.groundY+24)*l.scale<height-44);
  assert.ok(l.groundY-82>0);
 }
 for(const value of [0,-1,NaN,Infinity])assert.ok(Number.isFinite(m.arenaLayout(value,value).scale));
});
test('reduced motion and stationary troops do not cycle walking or attack frames',async()=>{
 const m=await moduleAt('visual-theme');
 for(const time of [0,.1,100,NaN]){
  assert.deepEqual(m.troopPose(time,true,true,true),{frame:0,lift:0,angle:0});
  assert.equal(m.troopPose(time,false,false,false).frame,0);
 }
 assert.ok([4,5].includes(m.troopPose(.1,false,true,false).frame));
 assert.ok(m.troopPose(.1,true,false,false).frame<4);
});
test('troop sheets contain six anchored frames and every age/role/team has distinct art',async()=>{
 const m=await moduleAt('unit-illustrations');const all=new Set<string>();
 for(let age=0;age<6;age++)for(const side of ['player','enemy'])for(let kind=0;kind<3;kind++){
  const svg=m.unitSvg(age,kind,side);all.add(svg);
  assert.match(svg,/viewBox="0 0 128 144"/);
  assert.doesNotMatch(svg,/(?:NaN|undefined|foreignObject|<script|https?:\/\/[^" ]+\.(?:png|jpg))/);
  const sheet=m.unitSheetSvg(age,kind,side);
  assert.equal((sheet.match(/data-frame=/g)||[]).length,6);
  assert.match(sheet,/width="768" height="144"/);
  assert.equal(m.unitSvg(age,kind,side),svg);
 }
 assert.equal(all.size,36);
});
test('landscape and base illustrations cover all six eras without external assets',async()=>{
 const m=await moduleAt('world-illustrations');const worlds=new Set(),bases=new Set();
 for(let age=0;age<6;age++){
  const svg=m.landscapeSvg(age);worlds.add(svg);
  assert.match(svg,/data-layer="sky"/);assert.match(svg,/data-layer="battle-lane"/);
  assert.doesNotMatch(svg,/<image|<script|foreignObject|NaN|undefined/);
  for(const side of ['player','enemy'])bases.add(m.baseSvg(age,side));
 }
 assert.equal(worlds.size,6);assert.equal(bases.size,12);
});
test('passive cards have 30 different object illustrations rather than repeated generic icons',async()=>{
 const m=await moduleAt('card-illustrations');
 const images=Array.from({length:30},(_,i)=>m.cardIllustration(i));
 assert.equal(new Set(images).size,30);
 for(const image of images){assert.match(image,/^data:image\/svg\+xml/);assert.doesNotMatch(decodeURIComponent(image),/<script|foreignObject|NaN|undefined/);}
});
test('the texture manifest has unique keys and a bounded initial decoded pixel budget',async()=>{
 const m=await moduleAt('visual-assets');const entries=m.visualAssets();
 assert.equal(entries.length,40);assert.equal(new Set(entries.map((x:any)=>x.key)).size,40);
 let pixels=0;
 for(const entry of entries){assert.match(entry.url,entry.format==='image'?/^\/art\/storybook\/(?:(?:olive|harbor|lantern|hillside)\/)?[a-z-]+\.webp$/:/^data:image\/svg\+xml/);pixels+=entry.width*entry.height;assert.ok(entry.width<=2048&&entry.height<=1024);}
 assert.ok(pixels*4<42_000_000,`uncompressed texture budget ${pixels*4}`);
});
test('deployment cards identify their tactical role without changing prices or action IDs',()=>{
 const targets={units:{innerHTML:''},skills:{innerHTML:''},stages:{innerHTML:''}};
 const render=createArmyUpdater(targets,()=>'/portrait.svg');render(defaultProfile());
 const html=targets.units.innerHTML;
 for(const role of ['Melee','Ranged','Heavy'])assert.match(html,new RegExp(`class="unit-role"[^>]*>${role}`));
 assert.match(html,/data-unit="0"/);assert.match(html,/150/);assert.match(html,/400/);
});

test('inline scene assets use the pinned Phaser loader decoding path without network access',async()=>{
 const m=await moduleAt('visual-assets');
 const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
 const xhr=require('phaser/src/loader/XHRLoader.js');
 for(const asset of m.visualAssets()){
  if(asset.format==='image')continue;
  let decoded='';
  assert.doesNotThrow(()=>xhr({url:asset.url,base64:true,xhrSettings:{responseType:'text'},onBase64Load:(result:{responseText:string})=>{decoded=result.responseText;}},{}));
  assert.match(decoded,/^<svg /);assert.match(decoded,/<\/svg>$/);
 }
});

test('projectile curves reach the resolved target exactly and clamp stalled frames',async()=>{
 const m=await moduleAt('visual-theme');assert.equal(typeof m.projectilePoint,'function');
 const a={x:18,y:72},b={x:300,y:120};
 assert.deepEqual(m.projectilePoint(a,b,0,14),a);assert.deepEqual(m.projectilePoint(a,b,1,14),b);
 assert.deepEqual(m.projectilePoint(a,b,8,14),b);assert.deepEqual(m.projectilePoint(a,b,NaN,14),a);
 assert.ok(m.projectilePoint(a,b,.5,14).y<96);
});

test('animation atlas clips each frame independently and leaves weapon sampling margins',async()=>{
 const m=await moduleAt('unit-illustrations');
 const svg=m.unitSheetSvg(2,2,'player');
 assert.match(svg,/<clipPath id="unit-frame"/);
 assert.equal((svg.match(/clip-path="url\(#unit-frame\)"/g)||[]).length,6);
 assert.match(m.unitSvg(2,2,'player',4),/translate\(64 136\) scale\(0\.94\) translate\(-64 -136\)/);
});

test('heavy vehicles have distinct firing frames rather than six copies of idle art',async()=>{
 const m=await moduleAt('unit-illustrations');
 for(const age of [3,4,5])assert.notEqual(m.unitSvg(age,2,'player',0),m.unitSvg(age,2,'player',5),`firing pose for age ${age}`);
});

test('pale rib collectibles have a dark structural silhouette over the parchment',async()=>{
 const m=await moduleAt('card-illustrations');
 const svg=decodeURIComponent(m.cardIllustration(2).split(',')[1]);
 assert.ok((svg.match(/stroke="#354f55"/g)||[]).length>=5,'bone outlines must not disappear into the pale card');
});
