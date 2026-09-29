import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const path=new URL('../src/ui/material-language.css',import.meta.url);
const css=()=>{assert.ok(existsSync(path),'crafted UI material layer must exist');return readFileSync(path,'utf8');};

test('material language defines a coherent brass, stone and parchment token set',()=>{
 const source=css();
 for(const token of ['--craft-brass-hi','--craft-brass','--craft-brass-shadow','--craft-stone','--craft-paper-line','--craft-ink'])assert.ok(source.includes(token),token);
 assert.ok(Buffer.byteLength(source)<9_000,'craft layer should stay lightweight');
});

test('ornament reinforces existing structure instead of creating new panels',()=>{
 const source=css();
 for(const selector of ['.deployment::before','.unit-card::after','.screen-heading h2::after','.currency','.big-button','.dialog','.bottom-nav'])assert.ok(source.includes(selector),selector);
 for(const forbidden of ['.world','#battlefield','.battle-view','position:fixed','backdrop-filter','@font-face','url('])assert.ok(!source.includes(forbidden),`must not introduce ${forbidden}`);
});

test('craft layer avoids continuous animation and does not redefine touch target dimensions',()=>{
 const source=css();
 assert.doesNotMatch(source,/animation\s*:/);
 assert.doesNotMatch(source,/\.square-button[^}]*\b(?:width|height)\s*:/s);
 assert.doesNotMatch(source,/\.skill-circle[^}]*\b(?:width|height)\s*:/s);
 assert.doesNotMatch(source,/\.buy-button[^}]*\bmin-height\s*:/s);
});

test('paper surfaces use restrained directional texture while live combat controls keep high contrast',()=>{
 const source=css();
 assert.match(source,/\.upgrades\s*,\s*\.secondary-screen/);
 assert.match(source,/linear-gradient\(1(?:0[0-9]|1[0-9])deg/);
 assert.match(source,/\.currency[\s\S]*?box-shadow/);
 assert.match(source,/\.big-button[\s\S]*?box-shadow/);
});

test('material language is loaded after baseline and continuation styles',()=>{
 const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 const base=source.indexOf("import './style.css'");
 const continuation=source.indexOf("import './ui/continuation.css'");
 const craft=source.indexOf("import './ui/material-language.css'");
 assert.ok(base>=0&&continuation>base&&craft>continuation);
});
