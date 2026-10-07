import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {baseSvg} from '../src/view/world-illustrations.ts';

async function projectiles() {
 const path='../src/view/projectile-art.ts';
 const m=await import(path).catch(()=>null);
 assert.ok(m,'combat projectiles must retain their weapon-specific silhouettes');
 return m;
}
test('all era bases keep their contact shadow and padded sampling boundary',()=>{
 for(let age=0;age<6;age++)for(const side of ['player','enemy'] as const){
  const svg=baseSvg(age,side);
  assert.match(svg,/opacity="\.25"/,`age ${age} ${side} needs a grounding shadow`);
  assert.match(svg,/translate\(80 140\) scale\(0\.96\) translate\(-80 -140\)/);
 }
});
test('projectile identities distinguish rocks, arrows, ammunition and energy',async()=>{
 const m=await projectiles();
 assert.equal(m.projectileStyle(0,false).shape,'stone');
 assert.equal(m.projectileStyle(1,false).shape,'sling');
 assert.equal(m.projectileStyle(2,false).shape,'arrow');
 assert.equal(m.projectileStyle(3,false).shape,'bullet');
 assert.equal(m.projectileStyle(3,true).shape,'cannonball');
 assert.equal(m.projectileStyle(4,true).shape,'shell');
 assert.equal(m.projectileStyle(5,true).shape,'energy');
 assert.equal(m.projectileStyle(0,true,true).shape,'meteor');
});
test('arrow geometry points at its target from either faction, not sideways',async()=>{
 const m=await projectiles();
 for(const to of [{x:100,y:10},{x:0,y:10},{x:50,y:100}]){
  const from={x:50,y:10};const geometry=m.projectileGeometry(from,to,1,0,2,false,'player');
  assert.deepEqual(geometry.tip,to);
  assert.ok(geometry.marks.some((mark:any)=>mark.type==='triangle'));
  const shaft=geometry.marks.find((mark:any)=>mark.type==='line');
  assert.ok((shaft.x2-shaft.x1)*(to.x-from.x)+(shaft.y2-shaft.y1)*(to.y-from.y)>0);
 }
});
test('ordinary thrown rocks do not acquire a fire trail; energy remains team-colored',async()=>{
 const m=await projectiles(),from={x:20,y:30},to={x:150,y:80};
 const stone=m.projectileGeometry(from,to,.5,14,0,false,'player');
 assert.ok(stone.marks.every((mark:any)=>mark.type!=='line'));
 const blue=m.projectileGeometry(from,to,.5,0,5,false,'player');
 const red=m.projectileGeometry(from,to,.5,0,5,false,'enemy');
 assert.notDeepEqual(blue.marks,red.marks);
});
test('projectile draw geometry stays finite and bounded even for coincident impacts',async()=>{
 const m=await projectiles();
 for(const progress of [NaN,-4,0,.5,1,9])for(let age=0;age<6;age++){
  const geometry=m.projectileGeometry({x:80,y:40},{x:80,y:40},progress,14,age,true,'player');
  assert.ok(geometry.marks.length<=8);
  for(const mark of geometry.marks)for(const value of Object.values(mark))if(typeof value==='number')assert.ok(Number.isFinite(value));
 }
});

test('portrait slot source contract: labels and pricing reserve separate space from troop artwork',async()=>{
 const {readFileSync}=await import('node:fs');
 const css=readFileSync(new URL('../src/ui/continuation.css',import.meta.url),'utf8');
 assert.match(css,/--portrait-top:\s*32px/);
 assert.match(css,/--portrait-bottom:\s*24px/);
 assert.match(css,/top:\s*var\(--portrait-top\)/);
 assert.match(css,/height:\s*calc\(100% - var\(--portrait-top\) - var\(--portrait-bottom\)\)/);
 assert.match(css,/\.battle-select:disabled\s*\{[^}]*visibility:\s*hidden/);
});


test('the four-pass layout polish layer is loaded after readability',()=>{
 const main=mainSource();
 assert.match(main,/import '\.\/ui\/layout-polish\.css';/);
 assert.ok(main.indexOf('layout-polish.css')>main.indexOf('readability.css'));
});
test('desktop composition widens deliberately without becoming dashboard-wide',()=>{
 const css=readFileSync(new URL('../src/ui/layout-polish.css',import.meta.url),'utf8');
 assert.match(css,/@media\s*\(min-width:900px\)/);
 assert.match(css,/\.game-shell\s*\{[^}]*max-width:\s*560px/s);
});
test('small phones reserve breathing room for primary and result actions',()=>{
 const css=readFileSync(new URL('../src/ui/layout-polish.css',import.meta.url),'utf8');
 assert.match(css,/@media\s*\(max-width:360px\)/);
 assert.match(css,/\.ready \.big-button\s*\{[^}]*max-width:/s);
 assert.match(css,/\.result-dialog\s*\{[^}]*scroll-padding-block:/s);
});
test('settings and dialogs use a calmer readable rhythm',()=>{
 const css=readFileSync(new URL('../src/ui/layout-polish.css',import.meta.url),'utf8');
 assert.match(css,/\.setting-row\s*\{[^}]*margin:/s);
 assert.match(css,/\.dialog>p\s*\{[^}]*max-width:/s);
});
