import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('P36: compact touch controls and safe areas have explicit layout rules',()=>{
 const path=new URL('../src/ui/continuation.css',import.meta.url);assert.equal(existsSync(path),true);
 const css=readFileSync(path,'utf8');assert.match(css,/min-height:\s*44px/);assert.match(css,/safe-area-inset-top/);assert.match(css,/max-height:\s*700px/);assert.match(css,/minmax\(0,\s*1fr\)/);
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');assert.match(main,/continuation\.css/);
});
test('P37: short landscape viewports can scroll instead of clipping the game',()=>{
 const path=new URL('../src/ui/continuation.css',import.meta.url);assert.equal(existsSync(path),true);
 const css=readFileSync(path,'utf8');assert.match(css,/max-height:\s*539px/);assert.match(css,/overflow-y:\s*auto/);assert.match(css,/overscroll-behavior:\s*auto/);
});

test('informational text keeps an 11px floor and the readability sheet loads last',()=>{
 const css=readFileSync(new URL('../src/ui/readability.css',import.meta.url),'utf8'),main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 for(const selector of ['.deploy-hint','.card-copies','.quest-row small','.skill-rule'])assert.ok(css.includes(selector),`${selector} needs a size floor`);
 for(const size of css.match(/font-size:\s*(\d+)px/g)??[])assert.ok(Number(size.match(/\d+/)![0])>=10,size);
 assert.ok(main.indexOf('./ui/readability.css')>main.indexOf('./ui/era-glow.css'),'the floor must win the cascade');
});

test('rarity captions use dark ink so rare and epic headers stay legible',()=>{
 const css=readFileSync(new URL('../src/ui/readability.css',import.meta.url),'utf8');
 assert.match(css,/\.rarity\s*\{\s*color:\s*#1[0-9a-f]{5}/i);
});

test('the resource header precedes the battle view so keyboard focus follows the visual order',()=>{
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 assert.ok(main.indexOf('<header class="resources">')<main.indexOf('id="battle-view"'));
});

test('the wave and threat readout keeps the 11px floor',()=>{
 const css=readFileSync(new URL('../src/ui/readability.css',import.meta.url),'utf8');
 assert.match(css,/\.battle-meta>span\s*\{\s*font-size:\s*11px/);
});

test('troop role captions are at least 10px',()=>{
 const css=readFileSync(new URL('../src/ui/readability.css',import.meta.url),'utf8');
 assert.match(css,/\.unit-role\s*\{\s*font-size:\s*10px/);
});

test('offline support: a same-origin GET-only worker is registered in production builds only',()=>{
 const worker=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 assert.match(worker,/request\.method !== 'GET'/);
 assert.match(worker,/origin !== self\.location\.origin/);
 assert.match(worker,/request\.mode === 'navigate'/);
 assert.match(main,/import\.meta\.env\.PROD&&'serviceWorker' in navigator/);
 assert.match(main,/register\('\.\/sw\.js'\)\.catch/);
});

test('the worker precaches the page bundles and trims old ones',()=>{
 const worker=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
 assert.match(worker,/async function precache/);
 assert.match(worker,/event\.waitUntil\(precache\(\)/);
 assert.match(worker,/KEEP_BUNDLES = \d+/);
 assert.match(worker,/trimBundles\(cache\)/);
});

test('the page paints the game colour and a loading or no-script message before any script runs',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/html,body\{[^}]*background:#293541/);
 assert.match(html,/<div id="app"><p class="boot" role="status">Loading/);
 assert.match(html,/<noscript>.*needs JavaScript/);
});

test('install and sharing metadata: manifest identity, maskable icon and link preview tags',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/manifest.webmanifest',import.meta.url),'utf8')),html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const key of ['id','scope','lang','description','categories'])assert.ok(manifest[key],key);
 assert.ok(manifest.icons.some((icon:{purpose:string;sizes:string})=>icon.purpose==='maskable'&&icon.sizes==='512x512'));
 for(const icon of manifest.icons)assert.equal(existsSync(new URL(`../public/${icon.src.replace('./','')}`,import.meta.url)),true,icon.src);
 for(const tag of ['og:title','og:description','og:type','twitter:card','apple-mobile-web-app-title'])assert.ok(html.includes(tag),tag);
});
