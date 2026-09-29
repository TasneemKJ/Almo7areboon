import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {storybookArt} from '../src/view/storybook-art.ts';
import {visualAssets,baseTexture,unitTexture} from '../src/view/visual-assets.ts';
import {chapterLandscape} from '../src/ui/chapter-presentation.ts';
import {unitPortrait} from '../src/view/unit-illustrations.ts';

test('Hillside Watch shares authored scenery, shelter and three troop atlases across both teams',()=>{
 const art=storybookArt(4);assert.ok(art,'chapter five must use the painted art pipeline');
 assert.deepEqual(art.roles,['sentinel','scout','tank']);
 assert.equal(art.frameWidth,216,'narrow cells preserve the existing decoded texture budget');
 assert.equal(chapterLandscape(4),`${art.folder}/village.webp`);
 assert.equal(baseTexture(4,'player'),baseTexture(4,'enemy'));
 const assets=visualAssets();
 for(const kind of [0,1,2] as const){
  assert.equal(unitTexture(4,kind,'player'),unitTexture(4,kind,'enemy'));
  const sheet=assets.find(asset=>asset.key===unitTexture(4,kind,'player'));
  assert.ok(sheet);assert.equal(sheet.frames,6);assert.equal(sheet.width,1296);assert.equal(sheet.height,192);
  const portrait=unitPortrait(4,kind);
  assert.equal(portrait,`${art.folder}/${art.roles[kind]}-portrait.webp`);
  assert.ok(statSync(new URL(`../public${portrait}`,import.meta.url)).size>1000);
 }
 const packing=JSON.parse(readFileSync(new URL('../art-source/storybook/hillside/packing.json',import.meta.url),'utf8'));
 for(const role of packing){
  assert.equal(role.frames,6);assert.equal(role.frameWidth,216);assert.equal(role.frameHeight,192);assert.equal(role.footBaseline,181);
  assert.ok(role.sharedScale>0&&role.sharedScale<1);
  assert.equal(role.sourceBounds.length,6);
  for(const frame of role.sourceBounds)assert.ok(frame.top<frame.bottom&&frame.left<frame.anchor&&frame.anchor<frame.right);
 }
});
