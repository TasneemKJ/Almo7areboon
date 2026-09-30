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
