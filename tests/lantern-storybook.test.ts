import test from 'node:test';
import assert from 'node:assert/strict';
import {storybookArt} from '../src/view/storybook-art.ts';
import {chapterLandscape} from '../src/ui/chapter-presentation.ts';
import {unitPortrait} from '../src/view/unit-illustrations.ts';

test('Lantern Quarter uses matching authored scenery and all three portraits',()=>{
 const art=storybookArt(3);assert.ok(art);
 assert.deepEqual(art.roles,['gatekeeper','musketeer','cannon']);
 assert.equal(chapterLandscape(3),`${art.folder}/village.webp`);
 for(const kind of [0,1,2] as const)assert.equal(unitPortrait(3,kind),`${art.folder}/${art.roles[kind]}-portrait.webp`);
});
