/** Pure/static verification only. No network, server, browser or game mutations. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {rendererFailureFixture,futureSaveFixture} from './recovery-fixtures.mjs';
import {assertReachable} from './review-geometry.mjs';
const root=process.env.PRODUCT_ROOT;assert(root,'read-only PRODUCT_ROOT required');
const {defaultProfile,decodeSave}=await import(pathToFileURL(resolve(root,'src/game/save.ts')));
const capture=readFileSync(new URL('./capture-entry.mjs',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/single-visual-review.yml',import.meta.url),'utf8');
const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
const valid=()=>({key:'native',visible:true,name:'Play',box:rect(0,0,44,44),effective:rect(0,0,44,44),viewport:rect(0,0,390,844),hits:[{accepted:true}]});
test('native-target gate rejects clipping, occlusion and missing names',()=>{
  assert.doesNotThrow(()=>assertReachable(valid()));
  for(const mutate of [r=>r.box.width=43,r=>r.effective.height=43,r=>r.hits[0].accepted=false,r=>r.visible=false,r=>r.name='',r=>r.box.bottom=850]){const row=valid();mutate(row);assert.throws(()=>assertReachable(row));}
});
test('existing-save renderer recovery fixture roundtrips exact decoder',()=>{
  const [primary,backup]=rendererFailureFixture(defaultProfile,decodeSave);assert.equal(primary,backup);
  assert.deepEqual(decodeSave(primary).profile,{...defaultProfile(),coins:37,deployed:2});
  assert.equal(JSON.parse(primary).foodLevel,0);
});
test('future-save fixture is explicitly unsupported and backup remains normal schema',()=>{
  const [primary,backup]=futureSaveFixture(defaultProfile,decodeSave);assert.equal(decodeSave(primary).problem,'unsupported');assert.deepEqual(decodeSave(backup).profile,defaultProfile());
});
test('first-play never seeds a prepared profile or foodLevel20',()=>{
  const section=capture.slice(capture.indexOf('async function firstPlay()'),capture.indexOf('async function rendererRecovery()'));
  assert.match(section,/open\('fresh-empty-profile'\)/);assert(!section.includes('fixture:'));assert(!capture.includes('foodLevel:20'));
  assert.match(capture,/assert\.deepEqual\(initial,\[null,null\]/);
  assert.match(section,/saved\.deployed,1/);assert.match(section,/data-command="retreat"/);
});
test('native script does not inject styles, bypass renderer or manipulate game clocks/state',()=>{
  for(const banned of [/addStyleTag/,/\.style\./,/clock\.(install|pause|fastForward)/,/battlefieldReviewArm/,/battlefieldReviewSnapshot/,/\.dispatch\(/,/\.step\(/,/document\.hidden\s*=/,/dispatchEvent\(/,/\.focus\(/])assert(!banned.test(capture),String(banned));
  assert.match(capture,/scale:'css'/);assert.match(capture,/\.tap\(\)/);assert.match(capture,/keyboard\.press\(value\)/);
});
test('renderer fault remains exact and durable, and interception is removed before native Reload',()=>{
  assert.match(capture,/chunks\.length,1/);assert.match(capture,/route\.abort\('failed'\)/);assert.match(capture,/waitForTimeout\(5500\)/);
  assert(capture.indexOf('await page.unroute')<capture.indexOf("'native Reload button after removing renderer interception'"));
  assert.match(capture,/getByRole\('button',\{name:'Reload',exact:true\}\)\.tap\(\)/);assert.match(capture,/expectedRawAssetFailure/);
  assert.match(capture,/rawStorageUnchanged:true/);
});
test('workflow has only two jobs and one on-push disposable branch',()=>{
  assert.equal((workflow.match(/^  (compare-390|small-320-rotate):$/gm)||[]).length,2);
  assert.match(workflow,/qa\/almo-simple-entry-20261005/);assert(!workflow.includes('workflow_dispatch'));assert(!workflow.includes('upload-artifact'));
  assert.match(workflow,/7c5554e827c98107da1aaf0bb8d7f0f3bd74c9c1/);assert.match(workflow,/e12c7d4e13378e5c41d7f1b23ff5f75b682680ef/);
  assert.equal((workflow.match(/Atomically transport/g)||[]).length,2);assert.match(workflow,/flock \/tmp\/browser\.lock/);
});
test('source contract used by the boundary probe remains present',()=>{
  const main=readFileSync(resolve(root,'src/main.ts'),'utf8');
  assert.match(main,/if\(!entryEntered\)return;/);assert.match(main,/game\.state\.paused=!entryEntered/);
  assert.match(main,/function entryReady\(\).*dataset\.renderer==='ready'.*world-loader/);
  assert.match(main,/failed\?'Reload'/);assert.match(main,/window\.location\.reload\(\)/);
  const result=readFileSync(resolve(root,'src/ui/results-screen.ts'),'utf8');assert.match(result,/data-command="result-details"/);assert.match(result,/data-command="home"/);
});
