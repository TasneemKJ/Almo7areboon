import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/ui/world-play.css',import.meta.url),'utf8');
test('field gives the actual persistent notice its own intrinsic row, rather than shrinking only the canvas',()=>{
 // Source contract only; actual wrapped text and sprite/contact geometry need native evidence.
 assert.match(css,/\.game-shell\{[^}]*display:grid[^}]*grid-template-rows:minmax\(0,1fr\) auto/);
 assert.match(css,/\.battle-view\{[^}]*grid-row:1/);
 assert.match(css,/\.session-notice\{[^}]*grid-row:2[^}]*height:auto[^}]*min-height:28px/);
 assert.doesNotMatch(css,/height:calc\(100% - 28px\)/);
});
