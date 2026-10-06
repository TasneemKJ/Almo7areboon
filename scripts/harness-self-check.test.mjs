/** Static preparation checks only; never launches a browser or server. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertReachable} from './review-geometry.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const capture=read('./capture-entry.mjs'),workflow=read('../.github/workflows/single-visual-review.yml'),emitter=read('./emit-originals.py');
test('three independent native jobs separate Camp comparison, touch/rotation, and Preferences/Home',()=>{
 for(const id of ['camp-390','camp-320-rotate','preferences-home-390'])for(const text of [capture,workflow,emitter])assert(text.includes(id),id);
 assert.equal((workflow.match(/^  (camp-390|camp-320-rotate|preferences-home-390):$/gm)||[]).length,3);
 assert(!workflow.includes('workflow_dispatch'));assert(!workflow.includes('upload-artifact'));
});
test('matched ready Camp seeds the identical fixture without first starting battle',()=>{
 assert.match(capture,/fixtures\/returning-profile\.json/);
 const flow=capture.slice(capture.indexOf('async function matchedCamp()'),capture.indexOf('async function campTouchRotation()'));
 assert.match(flow,/enterReadyCamp/);assert(!flow.includes('#entry-play'));assert.match(capture,/fixtureSha256/);
});
test('read-only ready observations retain food, waves, profile and phase',()=>{
 assert.match(capture,/async function assertReadyFrozen/);assert.match(capture,/after\.phase,'ready'/);
 assert.match(capture,/after\.food,before\.food/);assert.match(capture,/after\.wave,before\.wave/);assert.match(capture,/after\.saved,before\.saved/);
});
test('all four physical targets and canonical purchases are observed by native touch',()=>{
 for(const place of ['storehouse','gate','company','journal'])assert(capture.includes(place));
 assert.match(capture,/foodUpgradeCost/);assert.match(capture,/before\.coins-cost/);assert.match(capture,/data-work-level/);
 assert.match(capture,/camp-battle/);assert.match(capture,/native viewport rotation to844x390/);
});
test('Preferences selectors are modal scoped and input fields are distinct from buttons',()=>{
 assert.match(capture,/fields,7/);assert.match(capture,/\#modal-layer \[data-command="settings"\]/);assert.match(capture,/\#modal-layer \[data-command="home"\]/);
 for(const name of ['settings','home','close','reset','save-recovery'])assert(!capture.includes(`tap(page,'[data-command="${name}"]')`));
 assert.match(capture,/const footer=async command=>.*#modal-layer/s);
});
test('late warning fixture keeps native focus and scroll while real autosave runs',()=>{
 assert.match(capture,/Storage\.prototype\.setItem/);assert.match(capture,/fault\.armed/);assert.match(capture,/same warning node/);
 assert.match(capture,/same focused element/);assert.match(capture,/same dialog scroll/);assert.match(capture,/same-origin foreign storage write/);
});
test('no simulation, renderer, CSS, or clock shortcuts; bounded actual animation settling',()=>{
 for(const banned of [/addStyleTag/,/clock\.(install|pause|fastForward)/,/\.dispatch\(/,/\.step\(/,/dispatchEvent\(/,/\.focus\(/])assert(!banned.test(capture),String(banned));
 assert.match(capture,/async function settle/);assert.match(capture,/timeout:2500/);assert.match(capture,/isTrusted/);assert.match(capture,/scale:'css'/);
});
test('44px topmost geometry rejects clipping and occlusion',()=>{
 const rect=(w,h)=>({left:0,top:0,right:w,bottom:h,width:w,height:h});
 const row={visible:true,name:'Storehouse',box:rect(44,44),effective:rect(44,44),viewport:rect(390,844),hits:[{accepted:true}]};
 assert.doesNotThrow(()=>assertReachable(row));assert.throws(()=>assertReachable({...row,hits:[{accepted:false}]}));assert.throws(()=>assertReachable({...row,effective:rect(43,44)}));
});
test('runtime verifies exact source/tree and preserves explicit unaccepted advanced leaves',()=>{
 assert.match(workflow,/53f7bf91db2589e5590c890636c51e5f972b0269/);assert.match(workflow,/49bb9cf35feda86a15797573d1e2df4b756065dd/);
 assert.match(capture,/expectedTree/);assert.match(capture,/advancedLeavesAccepted:false/);assert.match(capture,/buildTreeSha256/);
 assert.match(workflow,/npm ci --ignore-scripts/);assert.match(workflow,/npx --no-install playwright install/);
});
