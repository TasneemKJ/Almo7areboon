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

test('the story rally row does not override the phone hint below the 11px floor',()=>{
 const css=readFileSync(new URL('../src/ui/chronicle.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:350px\)\{[^\n]*\.chronicle-command-row \.deploy-hint\{font-size:11px\}/);
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
 assert.match(css,/\.battle-meta>\.wave-inspect\s*\{\s*font-size:\s*11px/);
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
 assert.doesNotMatch(html.match(/html,body\{[^}]*\}/)![0],/color:(?!#293541)|font-family/,'the inline rule must not override the ink colour or font that :root provides');
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

test('touch surfaces suppress Safari text selection and long-press callouts',()=>{
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(css,/button,\.game-shell\s*\{[^}]*-webkit-user-select:\s*none[^}]*-webkit-touch-callout:\s*none/);
 assert.match(css,/svg,img\s*\{[^}]*-webkit-touch-callout:\s*none/);
});

test('quest progress uses the same thousands separators as the quest titles',()=>{
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 assert.match(main,/Math\.min\(count,q\.target\)\.toLocaleString\('en-US'\)\} \/ \$\{q\.target\.toLocaleString\('en-US'\)\}/);
});

test('muted body copy and blue button gradients keep AA contrast on their surfaces',()=>{
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 const hex=(name:string)=>css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`,'i'))![1];
 const lum=(color:string)=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
 const ratio=(a:string,b:string)=>(Math.max(lum(a),lum(b))+0.05)/(Math.min(lum(a),lum(b))+0.05);
 assert.ok(ratio(hex('muted'),hex('paper'))>=5.5,'muted copy on paper');
 assert.ok(ratio(hex('muted'),'#e1e7cd')>=4.5,'muted copy on the tinted panels');
 for(const top of css.match(/linear-gradient\(#3[0-9a-f]{5},#244d64\)/g)??[])assert.ok(ratio('#fff3d7',top.slice(16,23))>=4.5,top);
 assert.equal((css.match(/linear-gradient\(#326a86,#244d64\)/g)??[]).length,2,'both blue button surfaces use the darker gradient');
});


test('legacy and timeline-reset controls keep the mobile 44px touch floor',()=>{
 const css=readFileSync(new URL('../src/ui/continuation.css',import.meta.url),'utf8');
 assert.match(css,/\.legacy-choice label\s*\{[^}]*min-height:\s*44px/s);
 assert.match(css,/\.prestige-reset summary\s*\{[^}]*min-height:\s*44px/s);
});

test('ordinary scrolling dialogs reserve a sticky dismiss header instead of floating Close over content',()=>{
 const css=readFileSync(new URL('../src/ui/continuation.css',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 assert.match(css,/\.dialog-dismiss\s*\{[^}]*position:\s*sticky[^}]*height:\s*44px/s);
 assert.match(css,/\.dialog-dismiss>\.close-button\s*\{[^}]*position:\s*static/s);
 assert.ok(main.includes('class="dialog-dismiss"'));
});
