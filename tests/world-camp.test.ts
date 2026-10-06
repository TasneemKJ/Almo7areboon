import test from 'node:test';
import assert from 'node:assert/strict';
import {campLayout, campRecruits} from '../src/view/world-camp.ts';
import {defaultProfile} from '../src/game/save.ts';
for(const [width,height] of [[320,568],[390,844],[844,390],[667,375],[1280,800]])test(`physical camp targets fit and do not overlap at ${width}×${height}`,()=>{
 const plan=campLayout(width,height);
 const targets=[...plan.recruits,plan.standard,plan.supplies];
 for(const target of targets){assert.ok(target.width>=44&&target.height>=44);assert.ok(target.x>=0&&target.y>=0);assert.ok(target.x+target.width<=width&&target.y+target.height<=height);}
 for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){
  const a=targets[i],b=targets[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,`${i} overlaps ${j}`);
 }
});
test('fresh camp has one actual recruit and no locked upgrade targets',()=>{
 const p=defaultProfile(),before=JSON.stringify(p);assert.deepEqual(campRecruits(p),[0]);assert.equal(JSON.stringify(p),before);
 p.unlocked=[true,true,true];assert.deepEqual(campRecruits(p),[0,1,2]);
});

test('world controls start with one recruit, one Pause and no card/menu deck',async()=>{
 const {fieldControlsHtml}=await import('../src/ui/field-controls.ts');
 const html=fieldControlsHtml();
 assert.match(html,/data-command="field-pause"/);
 assert.equal((html.match(/data-field-recruit=/g)||[]).length,3);
 assert.doesNotMatch(html,/unit-card|data-tab=|upgrade-food|upgrade-base|data-command="quests"/);
 assert.match(html,/id="field-context" hidden/);
});
for(const [width,height] of [[320,568],[390,844],[844,390],[667,375],[1280,800]])test(`all camp hitboxes stay below the whole combat-lane envelope at ${width}×${height}`,()=>{
 const plan=campLayout(width,height),enemyFoot=height*.66+24*width/450;
 for(const target of [...plan.recruits,plan.standard,plan.supplies])assert.ok(target.y>=enemyFoot+2,`camp begins${target.y}, enemy envelope ends${enemyFoot}`);
});
for(const dpr of [1,1.5,2])for(const [width,height] of [[390,844],[844,390]])test(`painted camp projection matches CSS targets at DPR${dpr},${width}×${height}`,async()=>{
 const {campRenderProjection}=await import('../src/view/world-camp.ts');
 const {plan,cssScale}=campRenderProjection(width*dpr,height*dpr,dpr),dom=campLayout(width,height);
 assert.deepEqual(plan,dom);assert.equal(cssScale,width/450);
 for(const target of [...plan.recruits,plan.standard,plan.supplies]){
  const logicalX=target.footX/cssScale,logicalY=target.footY/cssScale;
  assert.ok(Math.abs(logicalX*(width*dpr/450)/dpr-target.footX)<1e-8);
  assert.ok(Math.abs(logicalY*(width*dpr/450)/dpr-target.footY)<1e-8);
 }
});
for(const [width,height] of [[320,568],[390,844],[844,390],[667,375]])test(`recruit hitbox contains the largest real idle frame including its foot margin at ${width}×${height}`,()=>{
 const plan=campLayout(width,height);
 for(const box of plan.recruits){
  const frame={left:box.footX-32,right:box.footX+32,top:box.footY-48*(136/144),bottom:box.footY+48*(1-136/144)};
  assert.ok(frame.left>=box.x&&frame.right<=box.x+box.width);
  assert.ok(frame.top>=box.y&&frame.bottom<=box.y+box.height);
 }
});
