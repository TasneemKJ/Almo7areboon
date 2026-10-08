import test from 'node:test';import assert from 'node:assert/strict';import {projectileTrailPoint} from '../src/view/projectile-trail.ts';
test('arced glow tail follows the path instead of a chord, including opposite-side fire',()=>{
 const p=projectileTrailPoint({x:0,y:0},{x:100,y:0},.5,20);
 assert.equal(p.x,28.000000000000004);assert.ok(Math.abs(p.y+Math.sin(.28*Math.PI)*20)<1e-9);
 const mirror=projectileTrailPoint({x:100,y:0},{x:0,y:0},.5,20);assert.ok(Math.abs(mirror.x+p.x-100)<1e-9);assert.equal(mirror.y,p.y);
 assert.deepEqual(projectileTrailPoint({x:3,y:4},{x:100,y:0},0,20),{x:3,y:4});
 assert.equal(projectileTrailPoint({x:0,y:0},{x:100,y:0},.5,0).y,0);
});
