import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=()=>readFileSync(new URL('../scripts/review-chronicle.mjs',import.meta.url),'utf8');

test('native journey reaches fresh outcomes through public controls only',()=>{
 const script=source();
 assert.match(script,/async function reachNaturalOutcome\(page,outcome\)/);
 assert.match(script,/locator\('\[data-command="start"\]'\)\.click\(\)/);
 assert.match(script,/locator\(`\[data-unit="\$\{kind\}"\]`\)/);
 assert.match(script,/locator\(`\[data-skill="\$\{skill\}"\]`\)/);
 assert.match(script,/preparedChronicleProfile\(\)/);
 assert.doesNotMatch(script,/game\.state\.(phase|playerHp|enemyHp)\s*=/,'browser review must not fabricate an outcome');
});

test('victory and defeat tableaux are captured before the unchanged result sheet at every target width',()=>{
 const script=source();
 for(const width of [320,390,1024])assert.match(script,new RegExp(`${width}[^\\n]*aftermath`));
 assert.match(script,/\['320-aftermath-loss',320,568,'lost'\]/);
 assert.match(script,/\['390-aftermath-win',390,844,'won'\]/);
 assert.match(script,/\['1024-aftermath-win',1024,768,'won'\]/);
 assert.match(script,/assert\.equal\(await f\.page\.locator\('\.result-dialog'\)\.count\(\),0/);
 assert.match(script,/await shot\(f,`\$\{outcome\}-survivor-verdict`\)/);
 assert.match(script,/await f\.page\.locator\('\.result-dialog'\)\.waitFor\(\{timeout:2500\}\)/);
});

test('journey validates bounded diagnostics, settlement stability, overflow, runtime and assets',()=>{
 const script=source();
 assert.match(script,/function validateAftermathSnapshot\(state,outcome\)/);
 for(const field of ['maxForward','maxLift','maxAngle'])assert.match(script,new RegExp(`state\\.${field}`));
 assert.match(script,/state\.roles\.length,3/);
 assert.match(script,/const afterSettlement=await saved\(f\.page\)/);
 assert.match(script,/assert\.equal\(await saved\(f\.page\),afterSettlement/);
 assert.match(script,/await noOverflow\(f\.page\)/);
 assert.match(script,/assetFailures/);
 assert.match(script,/assert\.equal\(assetFailures\.length,0/);
});

test('aftermath scenarios opt into full motion while existing reduced-motion fixtures stay unchanged',()=>{
 const script=source();
 assert.match(script,/async function open\(name,width,height,profile,reducedMotion='reduce'\)/);
 assert.match(script,/reducedMotion\}\)/);
 assert.match(script,/open\(name,width,height,p,'no-preference'\)/);
});
