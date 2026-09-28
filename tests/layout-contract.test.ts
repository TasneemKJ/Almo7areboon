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
