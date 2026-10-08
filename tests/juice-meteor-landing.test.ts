import test from 'node:test';import assert from 'node:assert/strict';import {meteorLandingFrame} from '../src/view/meteor-landing.ts';import {readFileSync} from 'node:fs';
test('landing aureole has a finite expanding grounded shape and static reduced form',()=>{
 assert.equal(meteorLandingFrame(-.01,false),null);assert.equal(meteorLandingFrame(.5,false),null);
 assert.ok(meteorLandingFrame(.3,false)!.radius>meteorLandingFrame(.1,false)!.radius);
 assert.equal(meteorLandingFrame(.1,true)!.radius,meteorLandingFrame(.3,true)!.radius);
 assert.ok(meteorLandingFrame(.1,false)!.alpha>meteorLandingFrame(.3,false)!.alpha);
});
test('live landing is connected to the resolved projectile callback',()=>{
 const src=readFileSync(new URL('../src/view/battlefield-effects.ts',import.meta.url),'utf8');
 assert.match(src,/cues\.stepBolts\(dt,bolt=>\{\s*if\(bolt\.meteor\)answers\.meteorLanding\(bolt\.to\.x,bolt\.to\.y\)/);
});
