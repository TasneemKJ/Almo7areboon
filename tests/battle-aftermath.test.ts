import test from 'node:test';
import assert from 'node:assert/strict';

const path='../src/view/battle-aftermath.ts';
async function subject(){
 const module=await import(path).catch(error=>{if((error as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(module,'battle aftermath presentation model must exist');
 return module;
}

test('survivor verdict exists only for a terminal phase and valid side',async()=>{
 const m=await subject(),base={side:'player',kind:0,elapsed:.4,reduced:false} as const;
 for(const phase of ['ready','running'] as const)assert.equal(m.battleAftermathPose({...base,phase}),null);
 assert.ok(m.battleAftermathPose({...base,phase:'won'}));
 assert.ok(m.battleAftermathPose({...base,phase:'lost'}));
 for(const side of ['friend','enemy-player',null,3])assert.equal(m.battleAftermathPose({...base,phase:'won',side} as any),null);
 for(const phase of ['victory','defeat',null,3])assert.equal(m.battleAftermathPose({...base,phase,side:'player'} as any),null);
});

test('win and loss reverse winner and defeated ownership truthfully',async()=>{
 const m=await subject(),pose=(phase:'won'|'lost',side:'player'|'enemy')=>m.battleAftermathPose({phase,side,kind:0,elapsed:.6,reduced:false});
 assert.equal(pose('won','player').mode,'triumph');
 assert.equal(pose('won','enemy').mode,'withdraw');
 assert.equal(pose('lost','player').mode,'withdraw');
 assert.equal(pose('lost','enemy').mode,'triumph');
 assert.equal(pose('won','enemy').facing,'home');
 assert.equal(pose('lost','player').facing,'home');
 assert.equal(pose('won','player').facing,'front');
});

test('all three winning roles hold pairwise distinct silhouettes',async()=>{
 const m=await subject(),poses=[0,1,2].map(kind=>m.battleAftermathPose({phase:'won',side:'player',kind,elapsed:.7,reduced:false}));
 assert.equal(new Set(poses.map((pose:any)=>JSON.stringify([pose.frame,pose.lift,pose.angle,pose.sx,pose.sy]))).size,3);
 assert.deepEqual(poses.map((pose:any)=>pose.mode),['triumph','triumph','triumph']);
 assert.deepEqual(poses.map((pose:any)=>pose.facing),['front','front','front']);
});

test('defeated survivors face home and every transform stays inside authored bounds',async()=>{
 const m=await subject();
 for(const phase of ['won','lost'] as const)for(const side of ['player','enemy'] as const)for(const kind of [0,1,2])for(const elapsed of [0,.01,.3,.65,1.3,99,NaN,Infinity,-4]){
  const pose=m.battleAftermathPose({phase,side,kind,elapsed,reduced:false});assert.ok(pose);
  const values=[pose.forward,pose.lift,pose.angle,pose.sx,pose.sy];assert.ok(values.every(Number.isFinite));
  assert.ok(pose.forward>=0&&pose.forward<=4);assert.ok(pose.lift>=0&&pose.lift<=4);assert.ok(Math.abs(pose.angle)<=4);
  assert.ok(pose.sx>=.96&&pose.sx<=1.04);assert.ok(pose.sy>=.96&&pose.sy<=1.04);
  assert.ok(Number.isInteger(pose.frame)&&pose.frame>=0&&pose.frame<=5);
  if(pose.mode==='withdraw')assert.equal(pose.facing,'home');
 }
});

test('reduced motion is a fixed zero-translation role pose at every time',async()=>{
 const m=await subject();
 for(const phase of ['won','lost'] as const)for(const side of ['player','enemy'] as const)for(const kind of [0,1,2]){
  const opening=m.battleAftermathPose({phase,side,kind,elapsed:0,reduced:true});
  const late=m.battleAftermathPose({phase,side,kind,elapsed:1.2,reduced:true});
  const malformed=m.battleAftermathPose({phase,side,kind,elapsed:NaN,reduced:true});
  assert.deepEqual(late,opening);assert.deepEqual(malformed,opening);
  assert.equal(opening.forward,0);assert.equal(opening.lift,0);
 }
});

test('malformed kind falls back safely and returned poses are deeply immutable',async()=>{
 const m=await subject(),input={phase:'won',side:'player',kind:0,elapsed:.5,reduced:false} as const,before=structuredClone(input);
 const expected=m.battleAftermathPose(input);
 for(const kind of [-1,3,NaN,Infinity,'heavy'])assert.deepEqual(m.battleAftermathPose({...input,kind} as any),expected);
 assert.deepEqual(input,before);assert.ok(Object.isFrozen(expected));
 assert.throws(()=>{(expected as any).angle=99;},TypeError);
});
