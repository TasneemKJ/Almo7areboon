import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/ui/quest-records.css',import.meta.url),'utf8');
test('every owned quest text size uses root-relative units, retaining its normal 16px-root size',()=>{
 assert.doesNotMatch(css,/font(?:-size)?\s*:[^;}]*\d(?:\.\d+)?px/,'a fixed pixel font cannot honor root-text enlargement');
 for(const [selector,normal] of [['.quest-records>label',16],['.quest-records select',16],['.quest-records .quest-record-note',12],['.quest-records .quest-record-kind',12],['.quest-records #quest-eligibility',14],['.quest-records .quest-record-reward',14],['.quest-records .big-button',16],['.quest-records .quest-record-save',13]] as const){
  const body=css.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]+)\\}'))?.[1];assert.ok(body,selector);
  const rem=Number(body.match(/font-size:([.\d]+)rem/)?.[1]);assert.equal(rem*16,normal,selector);assert.equal(rem*32,normal*2,selector);
 }
 assert.match(css,/\.quest-record h3\{[^}]*font:700 1\.375rem\/1\.25 Georgia/);
 assert.match(css,/\.quest-records \.quest-record-count\{[^}]*font:700 1\.75rem\/1\.25 Georgia/);
 assert.match(css,/\.quest-record-count span\{font:400 \.875rem\/1\.4/);
});
test('the owned dialog title and eyebrow beat legacy px rules without changing normal portrait or short-landscape text size',()=>{
 assert.match(css,/\.quest-record-dialog \.quest-records h2\{font-size:1\.8125rem\}/);
 assert.match(css,/\.quest-records>\.eyebrow\{font-size:\.625rem\}/);
 assert.match(css,/@media\(orientation:landscape\) and \(max-height:540px\)\{\.quest-record-dialog \.quest-records h2\{font-size:1\.5rem\}\}/);
 assert.doesNotMatch(css,/zoom:|transform:scale\(|font-size:clamp/,'text must not be shrunk to pass enlargement');
});
