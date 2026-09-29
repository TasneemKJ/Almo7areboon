import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {visualAssets,unitTexture} from '../src/view/visual-assets.ts';
import {unitPortrait} from '../src/view/unit-illustrations.ts';

test('storybook assets are local WebP files with matching decoded dimensions and bounded transfer size',()=>{
 let bytes=0;
 for(const asset of visualAssets().filter(a=>a.format==='image')){
  const file=new URL(`../public${asset.url}`,import.meta.url),data=readFileSync(file);
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
  const chunk=data.toString('ascii',12,16);
  assert.ok(chunk==='VP8X'||chunk==='VP8 ');
  const width=chunk==='VP8X'?1+data.readUIntLE(24,3):data.readUInt16LE(26)&0x3fff;
  const height=chunk==='VP8X'?1+data.readUIntLE(27,3):data.readUInt16LE(28)&0x3fff;
  assert.equal(width,asset.width);assert.equal(height,asset.height);
  if(asset.frames){assert.equal(width/asset.frames,256);assert.equal(height,192);}
  bytes+=statSync(file).size;
 }
 assert.ok(bytes<800_000,`storybook transfer budget: ${bytes}`);
});

test('both teams resolve shared painted atlases and portraits resolve to real assets',()=>{
 const keys=new Set(visualAssets().map(a=>a.key));
 for(const kind of [0,1,2] as const){
  assert.equal(unitTexture(0,kind,'player'),unitTexture(0,kind,'enemy'));
  assert.ok(keys.has(unitTexture(0,kind,'enemy')));
  const file=new URL(`../public${unitPortrait(0,kind)}`,import.meta.url);
  assert.ok(statSync(file).size>1000);
 }
});
