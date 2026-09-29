import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {storybookArt} from '../src/view/storybook-art.ts';
import {visualAssets,baseTexture,unitTexture} from '../src/view/visual-assets.ts';
import {chapterLandscape} from '../src/ui/chapter-presentation.ts';
import {unitPortrait} from '../src/view/unit-illustrations.ts';

test('Courtyards Beyond completes six painted chapters with matching troop portraits and shared team atlases',()=>{
 for(let age=0;age<6;age++)assert.ok(storybookArt(age),`chapter ${age+1} must use the painted art pipeline`);
 const art=storybookArt(5)!;
 assert.deepEqual(art.roles,['light-guard','trooper','sky-skimmer']);
 assert.equal(art.frameWidth,216);
 assert.equal(chapterLandscape(5),`${art.folder}/village.webp`);
 assert.equal(baseTexture(5,'player'),baseTexture(5,'enemy'));
 for(const kind of [0,1,2] as const){
  assert.equal(unitTexture(5,kind,'player'),unitTexture(5,kind,'enemy'));
  const sheet=visualAssets().find(asset=>asset.key===unitTexture(5,kind,'player'));
  assert.ok(sheet);assert.equal(sheet.frames,6);assert.equal(sheet.width,1296);assert.equal(sheet.height,192);
  const portrait=unitPortrait(5,kind);
  assert.equal(portrait,`${art.folder}/${art.roles[kind]}-portrait.webp`);
  assert.ok(statSync(new URL(`../public${portrait}`,import.meta.url)).size>1000);
 }
 const packing=JSON.parse(readFileSync(new URL('../art-source/storybook/courtyards/packing.json',import.meta.url),'utf8'));
 assert.deepEqual(packing.map((role:{name:string})=>role.name),['light-guard','trooper','sky-skimmer']);
 for(const role of packing){
  assert.equal(role.frames,6);assert.equal(role.frameWidth,216);assert.equal(role.frameHeight,192);assert.equal(role.footBaseline,181);
  assert.ok(role.sharedScale>0&&role.sharedScale<1);
  assert.equal(role.sourceBounds.length,6);
  for(const frame of role.sourceBounds)assert.ok(frame.top<frame.bottom&&frame.left<frame.anchor&&frame.anchor<frame.right);
 }
});
