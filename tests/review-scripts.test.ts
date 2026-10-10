import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// The npm review:* browser journeys drive the shipped world-first shell, so they must not target the retired battle HUD.
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')) as {scripts:Record<string,string>};
const reviewFiles=[...new Set(Object.entries(pkg.scripts).filter(([name])=>name.startsWith('review:')).map(([,command])=>command.match(/scripts\/[\w-]+\.mjs/)?.[0]).filter((file):file is string=>!!file))];
const helpers=['scripts/capture-prestige-review.mjs','scripts/capture-scouting-review.mjs'];
// Main's reconciled review scripts (merged 2026-10-10) still use fixed ports and some legacy
// controls; they stay listed here until they move to scripts/lib/browser.mjs (TODO.md).
const pendingUpdate=new Set(['scripts/verify-save-sessions.mjs','scripts/capture-mastery-review.mjs','scripts/capture-upgrade-text-review.mjs','scripts/capture-browser-review.mjs','scripts/capture-layering-review.mjs']);
const source=(file:string)=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('review journeys never target the retired ready panel, bottom navigation or deployment cards',()=>{
 const retired=[/waitForSelector\('#age-title'/,/\[data-command=("|')?start\1?\]/,/\[data-tab=/,/data-command="battles"\]'\)\.click/,/getByRole\('button',\s*\{\s*name:\s*'(Cards|Evolution|Battle)'/,/\.unit-card\b/,/#deploy-hint/,/data-command="upgrade-food"/];
 for(const file of [...reviewFiles,...helpers]){
  if(pendingUpdate.has(file))continue;
  const text=source(file);
  for(const pattern of retired)assert.doesNotMatch(text,pattern,`${file} still targets ${pattern}`);
 }
});

test('self-served reviews take a free port in the repo review range instead of a fixed shared port',()=>{
 const lib=source('scripts/lib/browser.mjs');
 assert.match(lib,/4700/,'review ports live in 4700-4799');
 for(const file of reviewFiles){
  if(pendingUpdate.has(file))continue;
  const text=source(file);
  if(!/vite\.js/.test(text))continue;
  assert.match(text,/freePort\(/,`${file} picks a free port`);
  assert.doesNotMatch(text,/'--port',\s*'\d+'/,`${file} hard-codes a port`);
 }
});

test('the pending list only names real review scripts, so it cannot hide a typo',()=>{
 for(const file of pendingUpdate)assert.ok(reviewFiles.includes(file),`${file} is a review script`);
});
