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
 const neutral=chronicleLandmarkFrame(status('neutral',0));
 assert.ok(neutral.marks.every(mark=>mark.shape==='dash'&&!mark.active));assert.notDeepEqual(neutral,broken);
});
test('abandoned capture and both held owners retain their signed seal grammar',()=>{
 const player=chronicleLandmarkFrame({...status('neutral',.5),capture:1.5});
 const enemy=chronicleLandmarkFrame({...status('neutral',.5),capture:-1.5});
 assert.equal(player.marks.filter(mark=>mark.active).length,4);assert.ok(player.marks.filter(mark=>mark.active).every(mark=>mark.shape==='knot'&&mark.side==='player'));
 assert.equal(enemy.marks.filter(mark=>mark.active).length,4);assert.ok(enemy.marks.filter(mark=>mark.active).every(mark=>mark.shape==='stitch'&&mark.side==='enemy'));
 const heldPlayer=chronicleLandmarkFrame({...status('held-player',1),owner:'player',capture:3}),heldEnemy=chronicleLandmarkFrame({...status('held-enemy',1),owner:'enemy',capture:-3});
 assert.equal(heldPlayer.marks.filter(mark=>mark.active).length,8);assert.equal(heldEnemy.marks.filter(mark=>mark.active).length,8);assert.notDeepEqual(heldPlayer.marks,heldEnemy.marks);
 assert.equal(heldPlayer.ownerShape,'ring');assert.equal(heldEnemy.ownerShape,'corners');
 const abandonedTakeover=chronicleLandmarkFrame({...status('held-player',5/6),owner:'player',capture:-2,playerCount:0,enemyCount:0});
 assert.equal(abandonedTakeover.ownerShape,'ring');assert.equal(abandonedTakeover.marks.filter(mark=>mark.active&&mark.side==='enemy').length,7);
});
test('owned takeover marks retain the same claimant progress when pressure leaves',()=>{
 for(const sample of [
  {owner:'player' as const,capture:2,phase:'claiming-enemy' as const,side:'enemy' as const,progress:1/6},
  {owner:'player' as const,capture:-2,phase:'claiming-enemy' as const,side:'enemy' as const,progress:5/6},
  {owner:'enemy' as const,capture:-2,phase:'claiming-player' as const,side:'player' as const,progress:1/6},
  {owner:'enemy' as const,capture:2,phase:'claiming-player' as const,side:'player' as const,progress:5/6},
 ]){
  const active=chronicleLandmarkFrame({...status(sample.phase,sample.progress),owner:sample.owner,capture:sample.capture,playerCount:sample.side==='player'?1:0,enemyCount:sample.side==='enemy'?1:0});
  const idle=chronicleLandmarkFrame({...status(sample.owner==='player'?'held-player':'held-enemy',sample.progress),owner:sample.owner,capture:sample.capture,playerCount:0,enemyCount:0});
  assert.deepEqual(idle.marks,active.marks);assert.equal(idle.marks.filter(mark=>mark.active).length,Math.round(sample.progress*8));assert.ok(idle.marks.filter(mark=>mark.active).every(mark=>mark.side===sample.side));
 }
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
