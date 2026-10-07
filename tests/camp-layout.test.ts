import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const main=mainSource();
const path=new URL('../src/ui/camp.css',import.meta.url),css=existsSync(path)?readFileSync(path,'utf8'):'';
test('physical Camp mounts a separate scene and intrinsic notice/footer rather than the old deck',()=>{
 assert.match(main,/id="camp-view"/);assert.match(css,/grid-template-rows:minmax\(0,1fr\) auto/);
 for(const selector of ['.resources','.deployment','.upgrades','.bottom-nav','.world-tools','#field-return'])assert.ok(css.includes(selector),`${selector} must not overlay Camp`);
 assert.match(css,/\.camp-place[^}]*min-width:56px/);assert.match(css,/\.camp-place[^}]*min-height:56px/);
 assert.match(css,/\.camp-footer[^}]*position:relative/);assert.match(css,/\.camp-scene[^}]*overflow:auto/);
 assert.match(css,/\.camp-place:focus-visible/);assert.match(css,/prefers-reduced-motion/);
});
test('Camp removes the old Space-start shortcut and excludes automatic modal close chrome',()=>{
 assert.match(main,/campOwner\|\|.*activeTab|campOwner\)return/);
 assert.match(main,/\[.*'camp-focus'.*'field-pause'/);
});

test('desktop Camp stations keep bounded physical hit regions instead of stretching across empty courtyard',()=>{
 assert.match(css,/\.camp-place\{[^}]*max-width:210px/);
 assert.match(css,/\.camp-place\{[^}]*justify-self:center/);
});
