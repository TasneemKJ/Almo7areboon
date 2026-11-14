import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {visualAssets,unitTexture,baseTexture} from '../src/view/visual-assets.ts';
import {storybookArt} from '../src/view/storybook-art.ts';
import {chapterLandscape} from '../src/ui/chapter-presentation.ts';
import {unitPortrait} from '../src/view/unit-illustrations.ts';

test('storybook assets are local WebP files with matching decoded dimensions and bounded transfer size',()=>{
 let bytes=0;
 for(const age of [0,1,2,3,4,5]){
 bytes=0;
 for(const asset of visualAssets().filter(a=>a.format==='image'&&a.url.slice(0,a.url.lastIndexOf('/'))===storybookArt(age)!.folder)){
  const file=new URL(`../public${asset.url}`,import.meta.url),data=readFileSync(file);
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
  const chunk=data.toString('ascii',12,16);
  assert.ok(chunk==='VP8X'||chunk==='VP8 ');
  const width=chunk==='VP8X'?1+data.readUIntLE(24,3):data.readUInt16LE(26)&0x3fff;
  const height=chunk==='VP8X'?1+data.readUIntLE(27,3):data.readUInt16LE(28)&0x3fff;
  assert.equal(width,asset.width);assert.equal(height,asset.height);
  if(asset.frames){assert.equal(width/asset.frames,storybookArt(age)!.frameWidth);assert.equal(height,192);}
  bytes+=statSync(file).size;
 }
 assert.ok(bytes<800_000,`chapter ${age} transfer budget: ${bytes}`);
 }
});

test('both teams resolve shared painted atlases and portraits resolve to real assets',()=>{
 const keys=new Set(visualAssets().map(a=>a.key));
 for(const age of [0,1,2,3,4,5]){
 assert.equal(baseTexture(age,'player'),baseTexture(age,'enemy'));
 assert.equal(chapterLandscape(age),`${storybookArt(age)!.folder}/village-hd.webp`);
 for(const kind of [0,1,2] as const){
  assert.equal(unitTexture(age,kind,'player'),unitTexture(age,kind,'enemy'));
  assert.ok(keys.has(unitTexture(age,kind,'enemy')));
  const file=new URL(`../public${unitPortrait(age,kind)}`,import.meta.url);
  assert.ok(statSync(file).size>1000);
 }
 }
});

test('the DOM plates and shelters are HD exports of the original art, never larger than their source', async () => {
  const { readFileSync } = await import('node:fs');
  const size = (file: string) => { const b = readFileSync(new URL(`../${file}`, import.meta.url)); const i = b.indexOf('VP8'); const kind = b.toString('latin1', i, i + 4);
    if (kind === 'VP8 ') return [b.readUInt16LE(i + 14) & 0x3fff, b.readUInt16LE(i + 16) & 0x3fff];
    if (kind === 'VP8L') { const v = b.readUInt32LE(i + 9); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
    return [1 + b.readUIntLE(i + 12, 3), 1 + b.readUIntLE(i + 15, 3)]; };
  for (const folder of ['', 'olive/', 'harbor/', 'lantern/', 'hillside/', 'courtyards/']) {
    const [w, h] = size(`public/art/storybook/${folder}village-hd.webp`), [sw, sh] = size(`art-source/storybook/${folder}village.webp`);
    assert.ok(w >= 1170 && w <= sw && h <= sh, `${folder}village-hd ${w}x${h} from ${sw}x${sh}`);
    assert.ok(Math.abs(w / h - .9) < .002, 'the shipped plate\'s aspect');
    assert.deepEqual(size(`public/art/storybook/${folder}shelter-hd.webp`), [512, 512]);
  }
});
