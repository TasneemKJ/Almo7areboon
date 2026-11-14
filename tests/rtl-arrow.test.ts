import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {icon} from '../src/view/icons.ts';

test('the "go on" arrow points along the reading direction, so Arabic mirrors it',()=>{
 assert.match(icon('arrow'),/<svg class="icon icon-arrow"/);
 assert.match(icon('arrow','big'),/class="icon icon-arrow big"/);
 assert.doesNotMatch(icon('close'),/icon-arrow/);
 assert.match(readFileSync(new URL('../src/style.css',import.meta.url),'utf8'),/\[dir="rtl"\] \.icon-arrow \{ transform:scaleX\(-1\); \}/);
});
