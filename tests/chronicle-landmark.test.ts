import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chronicleLandmarkFrame,chronicleLandmarkRenderPlan} from '../src/view/chronicle-landmark.ts';
import type {ChronicleLandmarkStatus} from '../src/game/chronicle-combat.ts';

const status=(phase:ChronicleLandmarkStatus['phase'],progress=.5):ChronicleLandmarkStatus=>({kind:'lantern',x:500,owner:'neutral',capture:progress*3,threshold:3,progress,playerCount:phase==='claiming-player'||phase==='contested'?1:0,enemyCount:phase==='claiming-enemy'||phase==='contested'?1:0,phase});

test('landmark seal is bounded and distinguishes player and enemy pressure by shape',()=>{
 const player=chronicleLandmarkFrame(status('claiming-player'));
 const enemy=chronicleLandmarkFrame(status('claiming-enemy'));
 assert.equal(player.marks.length,8);assert.equal(enemy.marks.length,8);
 assert.equal(player.marks.filter(mark=>mark.active).length,4);
 assert.equal(enemy.marks.filter(mark=>mark.active).length,4);
 assert.ok(player.marks.filter(mark=>mark.active).every(mark=>mark.shape==='knot'&&mark.side==='player'));
 assert.ok(enemy.marks.filter(mark=>mark.active).every(mark=>mark.shape==='stitch'&&mark.side==='enemy'));
 for(const frame of [player,enemy])for(const mark of frame.marks){assert.ok(Number.isFinite(mark.x)&&Number.isFinite(mark.y)&&Number.isFinite(mark.angle));assert.ok(Math.hypot(mark.x,mark.y)<=25);}
});
test('contested and broken seals use non-colour shapes without inventing progress',()=>{
 const contested=chronicleLandmarkFrame(status('contested',.75));
 assert.ok(contested.marks.every(mark=>mark.shape==='cross'&&!mark.active));
 const broken=chronicleLandmarkFrame(status('broken',1));
 assert.ok(broken.marks.every(mark=>mark.shape==='gap'&&!mark.active));
});
test('landmark frame sanitizes malformed input and is static for equal state',()=>{
 const malformed={...status('claiming-player'),x:Number.NaN,capture:Number.NaN,threshold:Number.NaN,progress:Number.POSITIVE_INFINITY} as ChronicleLandmarkStatus;
 const first=chronicleLandmarkFrame(malformed),second=chronicleLandmarkFrame(malformed);
 assert.deepEqual(first,second);assert.equal(first.progress,0);
 assert.ok(first.marks.flatMap(mark=>[mark.x,mark.y,mark.angle]).every(Number.isFinite));
});
test('landmark seal sorts under its prop and actors on the same foot plane',()=>{
 const plan=chronicleLandmarkRenderPlan(220,chronicleLandmarkFrame(status('neutral')));
 assert.ok(plan.groundDepth<plan.propDepth);assert.ok(plan.propDepth<plan.actorFrontDepth);
 assert.equal(plan.x,225);assert.equal(plan.y,215);
});
test('Chronicle view paints the authoritative seal on its own ground layer and exposes native evidence',()=>{
 const source=readFileSync(new URL('../src/view/chronicle-view.ts',import.meta.url),'utf8');
 assert.match(source,/private landmarkGround:Phaser\.GameObjects\.Graphics/);
 assert.match(source,/chronicleLandmarkStatus\(p,s\)/);
 assert.match(source,/chronicleLandmarkFrame\(status\)/);
 assert.match(source,/chronicleLandmarkRenderPlan\(/);
 assert.match(source,/dataset\.chronicleLandmark=JSON\.stringify/);
 assert.match(source,/delete this\.scene\.game\.canvas\.dataset\.chronicleLandmark/);
});
