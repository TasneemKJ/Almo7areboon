import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const source=readFileSync(new URL('../scripts/capture-browser-review.mjs',import.meta.url),'utf8');
test('physical target geometry enforces original 44px and 200px floors without hidden targets',()=>{
 const ast=ts.createSourceFile('review.mjs',source,ts.ScriptTarget.Latest,true);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='assertTargetGeometry');
 assert.ok(fn,'main review must verify the visible physical controls');
 const check=runInNewContext(`(${fn.getText(ast)})`,{assert});
 const valid={overflow:false,world:{height:200},targets:[{name:'defender',left:0,top:0,right:44,bottom:44,width:44,height:44}],width:320,height:640};
 check(valid);
 for(const patch of [{overflow:true},{world:{height:199}},{targets:[]},{targets:[{...valid.targets[0],width:43}]},{targets:[{...valid.targets[0],right:321}]}])assert.throws(()=>check({...valid,...patch}));
});
test('main review maps old preparation controls to real Camp and physical field routes',()=>{
 for(const selector of ['data-camp-station','data-camp-recruit','data-field-recruit','#field-cue','#field-supplies'])assert.ok(source.includes(selector),selector);
 assert.doesNotMatch(source,/name:\/\^BATTLE\//);
 assert.doesNotMatch(source,/force:\s*true/);
 assert.match(source,/captureTraitFixtures\(browser,errors,assetFailures,output\)/);
 assert.match(source,/verifyTacticalInputs\(browser,errors,assetFailures\)/);
 assert.match(source,/captureTacticalWaves\(browser,errors,assetFailures,output\)/);
});
test('portrait identity rejects swapped and duplicate roles even within the right chapter',()=>{
 const ast=ts.createSourceFile('review.mjs',source,ts.ScriptTarget.Latest,true);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='assertPortraitIdentity');assert.ok(fn);
 const check=(portraits:unknown,age:number)=>runInNewContext(`(${fn.getText(ast)})(${JSON.stringify(portraits)},${age})`,{assert});
 const correct=['sentinel','scout','tank'].map(role=>({src:`/art/storybook/hillside/${role}-portrait.webp`,ready:true}));
 check(correct,4);
 assert.throws(()=>check([correct[1],correct[0],correct[2]],4));assert.throws(()=>check(Array(3).fill(correct[0]),4));assert.throws(()=>check(correct.map(p=>({...p,ready:false})),4));
});
test('unaffordable action sampling stops simulation time and compares exact food',()=>{
 assert.match(source,/await page\.clock\.pauseAt\(/);
 assert.match(source,/assert\.equal\(\(await publicCounters\(page\)\)\.food,unavailable\.food/);
 assert.match(source,/await page\.clock\.resume\(\)/);
});
test('trait fixture observes live effect objects rather than removed scene arrays',()=>{
 const fixture=readFileSync(new URL('./fixtures/layering.ts',import.meta.url),'utf8');
 const ast=ts.createSourceFile('layering.ts',fixture,ts.ScriptTarget.Latest,true);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='observeEffectCues');assert.ok(fn,'fixture must observe the current effects owner');
 const js=ts.transpile(fn.getText(ast),{target:ts.ScriptTarget.ES2022});
 const observe=runInNewContext(`${js};observeEffectCues`);
 const accepted:unknown[]=[];let resets=0;
 const effects={pushImpactCue:(cue:unknown)=>accepted.push(cue),pushAttackCue:(cue:unknown)=>accepted.push(cue),pushBolt:(cue:unknown)=>accepted.push(cue),reset:()=>{resets++;}};
 const inspect=observe(effects),cue={trait:'guard',life:1,x:10,y:20};effects.pushImpactCue(cue);
 assert.equal(accepted[0],cue,'the real effect receives the original object');assert.equal(inspect().traits[0].life,1);
 cue.life=0;assert.equal(inspect().traits.length,0,'production lifetime mutation is observed');
 effects.pushImpactCue({...cue,life:1});effects.pushAttackCue({life:1});effects.pushBolt({life:1});
 assert.equal(inspect().sourceCues,1);assert.equal(inspect().projectiles,1);
 effects.reset();assert.equal(resets,1);assert.equal(inspect().traits.length,0);assert.equal(inspect().projectiles,0);
 assert.doesNotMatch(fixture,/actual\.(impactCues|attackCues|bolts)/);
});
