import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// The npm review:* browser journeys drive the shipped world-first shell, so they must not target the retired battle HUD.
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')) as {scripts:Record<string,string>};
const reviewFiles=[...new Set(Object.entries(pkg.scripts).filter(([name])=>name.startsWith('review:')).map(([,command])=>command.match(/scripts\/[\w-]+\.mjs/)?.[0]).filter((file):file is string=>!!file))];
const helpers=['scripts/capture-prestige-review.mjs','scripts/capture-scouting-review.mjs'];
const source=(file:string)=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('every review journey launches Chromium through the shared helper',()=>{
 assert.ok(reviewFiles.length>=10,`found ${reviewFiles.length} review scripts`);
 for(const file of reviewFiles){
  const text=source(file);
  if(!/launchChromium|chromium\.launch/.test(text))continue; // review:audio and friends drive no page
  assert.match(text,/from '\.\/lib\/browser\.mjs'/,`${file} uses scripts/lib/browser.mjs (CHROMIUM_PATH, review ports)`);
  assert.doesNotMatch(text,/chromium\.launch\(/,`${file} launches Chromium directly`);
 }
});

test('review journeys never target the retired ready panel, bottom navigation or deployment cards',()=>{
 const retired=[/waitForSelector\('#age-title'/,/\[data-command=("|')?start\1?\]/,/\[data-tab=/,/data-command="battles"\]'\)\.click/,/getByRole\('button',\s*\{\s*name:\s*'(Cards|Evolution|Battle)'/,/\.unit-card\b/,/#deploy-hint/,/data-command="upgrade-food"/];
 for(const file of [...reviewFiles,...helpers]){
  const text=source(file);
  for(const pattern of retired)assert.doesNotMatch(text,pattern,`${file} still targets ${pattern}`);
 }
});

test('self-served reviews take a free port in the repo review range instead of a fixed shared port',()=>{
 const lib=source('scripts/lib/browser.mjs');
 assert.match(lib,/4700/,'review ports live in 4700-4799');
 for(const file of reviewFiles){
  const text=source(file);
  if(!/vite\.js/.test(text))continue;
  assert.match(text,/freePort\(/,`${file} picks a free port`);
  assert.doesNotMatch(text,/'--port',\s*'\d+'/,`${file} hard-codes a port`);
 }
});
