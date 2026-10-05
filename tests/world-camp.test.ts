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
