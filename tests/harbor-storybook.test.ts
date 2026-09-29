import test from 'node:test';
import assert from 'node:assert/strict';
import {storybookArt} from '../src/view/storybook-art.ts';
import {visualAssets,unitTexture,baseTexture} from '../src/view/visual-assets.ts';
import {chapterLandscape} from '../src/ui/chapter-presentation.ts';
import {unitPortrait} from '../src/view/unit-illustrations.ts';

test('Harbor Watch uses one coherent painted chapter across battlefield and UI',()=>{
 const art=storybookArt(2);
 assert.ok(art,'third chapter needs authored storybook art');
 assert.deepEqual(art.roles,['quay-guard','archer','quay-rider']);
 assert.equal(chapterLandscape(2),`${art.folder}/village.webp`);
 assert.equal(baseTexture(2,'enemy'),baseTexture(2,'player'));
 for(const kind of [0,1,2] as const){
  assert.equal(unitTexture(2,kind,'enemy'),unitTexture(2,kind,'player'));
  assert.equal(unitPortrait(2,kind),`${art.folder}/${art.roles[kind]}-portrait.webp`);
  const sheet=visualAssets().find(a=>a.key===unitTexture(2,kind,'player'));
  assert.ok(sheet);assert.equal(sheet.frames,6);assert.equal(sheet.height,192);
 }
});

test('later unpainted chapters and invalid chapter lookups retain the existing fallback',()=>{
 for(const age of [4,5,-1,6,NaN,Infinity,1.5])assert.equal(storybookArt(age),undefined);
 for(const age of [4,5])assert.notEqual(unitTexture(age,0,'player'),unitTexture(age,0,'enemy'));
});
