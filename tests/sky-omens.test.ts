import test from 'node:test';
import assert from 'node:assert/strict';
import {skyOmensSvg} from '../src/view/sky-omens.ts';
import {landscapeSvg} from '../src/view/levantine-scenery.ts';

test('each chapter has a distinct, bounded celestial and weather composition',()=>{
 const skies=new Set<string>();
 for(let age=0;age<6;age++){
  const svg=skyOmensSvg(age);skies.add(svg);
  assert.match(svg,/data-layer="sky-omens"/);
  assert.match(svg,/data-motif="[^"]+"/);
  assert.doesNotMatch(svg,/<image|<script|foreignObject|NaN|undefined|url\(https?:/);
  assert.ok(svg.length<8500,`sky ${age} is a bounded asset`);
  const scene=landscapeSvg(age,false);
  assert.ok(scene.indexOf('data-layer="sky-omens"')>scene.indexOf('data-layer="sky"'));
  assert.ok(scene.indexOf('data-layer="sky-omens"')<scene.indexOf('data-layer="distant-landscape"'));
 }
 assert.equal(skies.size,6);
 assert.equal(skyOmensSvg(-1),skyOmensSvg(0));
});
