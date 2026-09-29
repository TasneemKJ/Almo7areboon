import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SKY_CEILING,cloudFrame,shootingStar,skyProfile,starFrame} from '../src/view/living-sky.ts';

test('cloud banks stay above the tallest authored skyline in every chapter and time',()=>{
 for(let age=0;age<6;age++)for(const t of [0,17,333,9000]){
  const puffs=cloudFrame(age,t,411,false);
  assert.equal(puffs.length,24);
  for(const p of puffs){assert.ok(p.y+p.ry*.5<=SKY_CEILING*411,`chapter ${age} cloud dips into the skyline`);assert.ok(p.alpha>0&&p.alpha<=.6);}
 }
});

test('near clouds drift faster than far clouds (parallax) and hold still under reduced motion',()=>{
 const a=cloudFrame(2,10,411,false),b=cloudFrame(2,11,411,false);
 const moved=(i:number)=>Math.abs(b[i].x-a[i].x);
 assert.ok(moved(21)>moved(0),'the nearest bank must outrun the farthest');
 assert.deepEqual(cloudFrame(2,0,411,true),cloudFrame(2,500,411,true));
});

test('stars twinkle in the upper band and night chapters carry more of them',()=>{
 assert.ok(skyProfile(5).stars>skyProfile(0).stars);
 for(let age=0;age<6;age++){
  const stars=starFrame(age,4,411,false);
  for(const s of stars){assert.ok(s.y<411*.34&&s.x>0&&s.x<450);assert.ok(s.alpha>0&&s.alpha<=.8);}
  assert.notDeepEqual(starFrame(age,4,411,false).map(s=>s.alpha),starFrame(age,5.3,411,false).map(s=>s.alpha));
  assert.deepEqual(starFrame(age,4,411,true),starFrame(age,90,411,true));
 }
});

test('shooting stars are rare, brief, high and absent under reduced motion',()=>{
 let visible=0;
 for(let t=0;t<110;t+=.05){const s=shootingStar(3,t,411,false);if(s){visible++;assert.ok(s.y2<411*.25&&s.alpha<=.8&&s.alpha>=0);}}
 const fraction=visible*.05/110;
 assert.ok(fraction>.03&&fraction<.1,`shooting stars visible ${(fraction*100).toFixed(1)}% of the time`);
 for(let t=0;t<60;t+=.1)assert.equal(shootingStar(3,t,411,true),null);
 assert.equal(shootingStar(3,Number.NaN,411,false),null);
});

test('battlefield paints the sky behind the scenery layers with pooled quads',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 const at=(needle:string)=>{const i=source.indexOf(needle);assert.ok(i>=0,needle);return i;};
 assert.ok(at('this.stars=this.add.container()')<at('this.armyLayer=this.add.container()'));
 assert.match(source,/this\.paintSoft\(this\.stars,starFrame\(/,'stars must be pooled quads, not per-frame tessellated circles');
 assert.ok(at('this.clouds=this.add.container()')<at('this.armyLayer=this.add.container()'));
 assert.match(source,/this\.paintSoft\(this\.clouds,cloudFrame\(/);
});
