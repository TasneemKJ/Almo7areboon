import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chronicleActorDepth,chroniclePaintPalette,bellMotion} from '../src/view/chronicle-presentation.ts';
test('props and actors share the foot plane, rather than fixed foreground priority',()=>{assert.ok(chronicleActorDepth(220,1)<chronicleActorDepth(230,0));assert.equal(chronicleActorDepth(220,1),220.1);});
test('storybook props share a small ink and gouache palette',()=>{assert.equal(Object.keys(chroniclePaintPalette).length,6);assert.equal(chroniclePaintPalette.ink,'#28383c');});
test('bell motion respects reduced motion, pause and finite inputs',()=>{assert.equal(bellMotion(8,true,true),0);assert.equal(bellMotion(NaN,true,false),0);assert.equal(bellMotion(8,false,false),0);assert.ok(Math.abs(bellMotion(8,true,false))<=9);});
import {chronicleMaterial} from '../src/view/chronicle-presentation.ts';
test('prop paint has bounded warm light and shadow swatches rather than flat bright fills',()=>{for(const colour of Object.values(chroniclePaintPalette)){const stops=chronicleMaterial(colour);assert.equal(stops.length,3);assert.equal(stops[1],colour);for(const value of stops)assert.match(value,/^#[0-9a-f]{6}$/i);}assert.notEqual(chronicleMaterial(chroniclePaintPalette.linen)[0],chronicleMaterial(chroniclePaintPalette.linen)[2]);});
