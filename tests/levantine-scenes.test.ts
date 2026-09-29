import test from 'node:test';
import assert from 'node:assert/strict';
import {landscapeSvg,baseSvg,foregroundSvg} from '../src/view/world-illustrations.ts';
import {visualAssets} from '../src/view/visual-assets.ts';

const settings=['shelter-valley','olive-terraces','coastal-quay','courtyard-quarter','hillside-homes','future-courtyards'];
const outposts=['stone-shelter','terrace-store','quay-gate','workshop-gate','hill-station','courtyard-station'];
const paths=(svg:string)=>[...svg.matchAll(/<path d="([^"]+)"/g)].map(match=>match[1]);

test('each public landscape is its own Levantine dusk setting, not the retired generic landmark',()=>{
 for(let age=0;age<6;age++)assert.ok(landscapeSvg(age,false).includes(`data-setting="${settings[age]}"`),`chapter ${age}`);
});
test('lighting belongs to inhabited architecture while the road stays its own unobscured paint layer',()=>{
 for(let age=0;age<6;age++){
  const svg=landscapeSvg(age,false);
  assert.match(svg,/data-layer="practical-light"/);
  assert.ok(svg.indexOf('data-layer="practical-light"')<svg.indexOf('data-layer="battle-lane"'));
  assert.doesNotMatch(svg,/<animate|<script|foreignObject|<image|<text/);
 }
});
test('outpost silhouettes share culture across factions while exposing distinct faction trim',()=>{
 for(let age=0;age<6;age++){
  const a=baseSvg(age,'player'),b=baseSvg(age,'enemy');
  assert.ok(a.includes(`data-outpost="${outposts[age]}"`));
  assert.deepEqual(paths(a),paths(b));assert.notEqual(a,b);
  assert.match(a,/opacity="\.25"/);
  assert.match(a,/translate\(80 140\) scale\(0\.96\) translate\(-80 -140\)/);
 }
});
test('new world exports retain scene/foreground dimensions, layering, invalid-input fallback and determinism',()=>{
 for(let age=0;age<6;age++){
  const svg=landscapeSvg(age);
  assert.match(svg,/width="900" height="1000"/);assert.match(svg,/data-layer="sky"/);
  assert.match(svg,/data-layer="foreground"/);assert.doesNotMatch(landscapeSvg(age,false),/data-layer="foreground"/);
  assert.match(foregroundSvg(age),/width="450" height="220" viewBox="0 560 900 440"/);
  assert.equal(svg,landscapeSvg(age));
 }
 for(const age of [-1,6,1.5,NaN,Infinity]){
  assert.equal(landscapeSvg(age),landscapeSvg(0));
  assert.equal(baseSvg(age,'player'),baseSvg(0,'player'));
  assert.equal(foregroundSvg(age),foregroundSvg(0));
 }
});
test('all production SVG gradients resolve and remain compatible with the ASCII base64 loader',()=>{
 for(let age=0;age<6;age++)for(const svg of [landscapeSvg(age),foregroundSvg(age),baseSvg(age,'player')]){
  const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'duplicate SVG identifier');
  for(const match of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.includes(match[1]),`unresolved paint ${match[1]}`);
  assert.doesNotMatch(svg,/NaN|undefined|Infinity/);assert.doesNotThrow(()=>btoa(svg));
 }
});
test('new scenery replaces the existing textures rather than multiplying mobile memory use',()=>{
 const assets=visualAssets();
 assert.equal(assets.length,44);assert.equal(new Set(assets.map(asset=>asset.key)).size,44);
 assert.ok(assets.reduce((sum,asset)=>sum+asset.width*asset.height*4,0)<42_000_000);
});
