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
 assert.match(script,/async function clickEnabled\(page,locator\)/);
 assert.match(script,/locator\.click\(\{timeout:750,noWaitAfter:true,force:true\}\)/,'the native policy must use the real enabled public control without spending the battle clock on HUD stability');
 assert.match(script,/if\(error instanceof Error&&error\.name==='TimeoutError'\)return false/,'a transient redraw must yield to the next public-control retry');
 assert.match(script,/if\(phase!=='won'&&phase!=='lost'\)throw error/);
 assert.match(script,/preparedChronicleProfile\(\)/);
 assert.doesNotMatch(script,/game\.state\.(phase|playerHp|enemyHp)\s*=/,'browser review must not fabricate an outcome');
});

test('victory and defeat tableaux are captured before the unchanged result sheet at every target width',()=>{
 const script=source();
 for(const width of [320,390,1024])assert.match(script,new RegExp(`${width}[^\\n]*aftermath`));
 assert.match(script,/\['320-aftermath-loss',320,568,'lost'\]/);
 assert.match(script,/\['390-aftermath-win',390,844,'won'\]/);
 assert.match(script,/\['1024-aftermath-win',1024,768,'won'\]/);
 assert.match(script,/async function canvasShot\(fixture,state,expected,reduced=false\)/);
 assert.match(script,/node\.battlefieldReviewSnapshot/,'timed verdict evidence must use Phaser post-render readback');
 assert.match(script,/node\.battlefieldReviewArm\(phase\)/,'the renderer must be armed for the authoritative outcome before browser polling can race the result timer');
 assert.doesNotMatch(script,/node\.toDataURL\(/,'an arbitrary WebGL canvas read can be cleared between frames');
 assert.match(script,/resultOpen/,'modal absence must belong to the same rendered snapshot');
 assert.match(script,/await armCanvasShot\(f,outcome\);await reachNaturalOutcome\(f\.page,outcome\);/);
 assert.match(script,/await canvasShot\(f,`\$\{outcome\}-survivor-verdict`,outcome\)/);
 assert.match(script,/await assertVerdictClearOfHud\(f\.page,capture\.villageVerdict\)/);
 assert.match(script,/regions\.map/,'HUD evidence must test each changed primitive rather than one empty-space-spanning union');
 assert.match(script,/\},state\.regions\)/);
 assert.match(script,/await verdictWorldShot\(f,`\$\{outcome\}-survivor-verdict-world`\)/);
 assert.match(script,/page\.screenshot\(\{path:`\$\{out\}\/\$\{file\}`,scale:'css'\}\)/,'the timed full-stage verdict must encode at viewport resolution so PNG work cannot consume the unchanged result delay');
 assert.match(script,/async function releaseVerdictFrame\(fixture\)/);
 assert.match(script,/delete node\.dataset\.battlefieldReviewFrameReady/,'the evidence latch must release immediately after the verified full-stage capture');
 assert.match(script,/finally\{await releaseVerdictFrame\(fixture\);\}/,'every timed evidence wrapper must release its result latch even when capture or validation fails');
 assert.match(script,/const capture=await canvasShotAndRelease\(f,`\$\{outcome\}-survivor-verdict`,outcome,true\)/,'reduced motion must release its canvas-only evidence latch before awaiting the result');
 assert.match(script,/await f\.page\.locator\('\.result-dialog'\)\.waitFor\(\{timeout:2500\}\)/);
});

test('journey validates bounded diagnostics, settlement stability, overflow, runtime and assets',()=>{
 const script=source();
 assert.match(script,/function validateAftermathSnapshot\(state,outcome,reduced=false\)/);
 for(const field of ['maxForward','maxLift','maxAngle'])assert.match(script,new RegExp(`state\\.${field}`));
 assert.match(script,/state\.roles\.length,3/);
 assert.match(script,/if\(outcome==='lost'\)assert\.equal\(state\.withdraw>0,true/);
 assert.match(script,/#base-status/);
 assert.match(script,/\[data-unit="2"\]/);
 assert.match(script,/const afterSettlement=await saved\(f\.page\)/);
 assert.match(script,/assert\.equal\(await saved\(f\.page\),afterSettlement/);
 assert.match(script,/await noOverflow\(f\.page\)/);
 assert.match(script,/capture\.opaque/);
 assert.match(script,/capture\.colors/);
 assert.match(script,/readUInt32BE\(16\)/);
 assert.match(script,/assetFailures/);
 assert.match(script,/assert\.equal\(assetFailures\.length,0/);
});

test('the same post-render verdict snapshot proves the village reaction at every target width',()=>{
 const script=source();
 assert.match(script,/node\.battlefieldReviewSnapshot\(\(\{image,resultOpen,aftermath,villageVerdict\}\)=>/);
 assert.match(script,/function validateVillageVerdictSnapshot\(state,outcome,reduced=false\)/);
 assert.match(script,/assert\.equal\(state\.mode,outcome==='won'\?'celebrate':'shelter'\)/);
 assert.match(script,/assert\.equal\(state\.progress,1\)/);
 assert.match(script,/state\.witnesses>=1&&state\.witnesses<=2/);
 assert.match(script,/state\.strokes,state\.witnesses\*3/);
 assert.match(script,/state\.strokes===2\|\|state\.strokes===4/);
 assert.match(script,/Number\.isInteger\(state\.lights\)&&state\.lights>=2&&state\.lights<=6/);
 assert.match(script,/Number\.isInteger\(state\.affectedLights\)&&state\.affectedLights>=0&&state\.affectedLights<=state\.lights/);
 assert.match(script,/assert\.equal\(state\.paused,false\)/);
 assert.match(script,/validateVillageVerdictSnapshot\(capture\.villageVerdict,expected,reduced\)/);
 assert.match(script,/async function waitForVerdictFrame\(fixture,expected\)/);
 assert.match(script,/document\.querySelector\('canvas'\)\?\.dataset\.battlefieldReviewFrameReady===phase/,'the full-stage capture must wait on the post-render boundary instead of serialized PNG completion');
 assert.match(script,/await waitForVerdictFrame\(f,outcome\);await verdictWorldShot\(f,`\$\{outcome\}-survivor-verdict-world`\);\s*const capture=await canvasShot/,'full-stage evidence must be captured as soon as the armed post-render frame is ready, before PNG transfer and probes consume the result delay');
 assert.doesNotMatch(script,/state\.elapsed<\.\d+/,'verdict evidence must not race the wall-clock result sheet through a clamped elapsed threshold');
 assert.match(script,/function assertVerdictClearOfHud\(page,state\)/);
 assert.match(script,/const selectors='\.resources \.currency,\.resources \.game-wordmark,\.stage \.eyebrow,\.stage h1,\.stage \.scene-name,\.stage \.battle-select,\.world-tools button,\.battle-meta span,\.battle-meta button,\.battle-skills button'/);
 assert.match(script,/document\.querySelectorAll\(selectors\)/);
 assert.match(script,/assert\.deepEqual\(geometry\.collisions,\[\]/);
});

test('aftermath scenarios include full-motion coverage plus a native stable reduced-motion verdict',()=>{
 const script=source();
 assert.match(script,/async function open\(name,width,height,profile,reducedMotion='reduce'\)/);
 assert.match(script,/reducedMotion\}\)/);
 assert.match(script,/open\(name,width,height,p,'no-preference'\)/);
 assert.match(script,/\['390-aftermath-reduced',390,844,'won','reduce'\]/);
 assert.match(script,/assert\.deepEqual\(settled,capture\.villageVerdict,'reduced-motion verdict must remain complete and static'\)/);
});

test('native battle-memory journeys use public actions and prove HUD-safe paused and reduced road scars',()=>{
 const script=source();
 assert.match(script,/function validateBattlefieldMemory\(state,kind,reduced=false,paused=true\)/);
 assert.match(script,/state\.count>=1&&state\.count<=state\.cap/);
 assert.match(script,/assert\.equal\(state\.cap,6\)/);
 assert.match(script,/assert\.ok\(state\.kinds\.includes\(kind\)\)/);
 assert.match(script,/state\.ages\.length,state\.count/);
 assert.match(script,/state\.alphas\.length,state\.count/);
 assert.match(script,/async function pauseAtBattlefieldMemory\(page,kind\)/);
 assert.match(script,/async function observeReducedBattlefieldMemory\(page,kind\)/);
 assert.match(script,/state\.ages\.some\(age=>age>=10\.25\)/,'reduced evidence must cross the normal-motion fade boundary while active');
 assert.match(script,/state\.alphas\.every\(alpha=>alpha===\.26\)/);
 assert.match(script,/JSON\.parse\(node\.dataset\.battlefieldMemory\)/);
 assert.match(script,/button\.click\(\)/,'the real public pause button must own the frozen evidence state');
 assert.match(script,/assert\.deepEqual\(paused,observed,'public pause must freeze battlefield memory'\)/);
 assert.match(script,/async function assertMemoryClearOfHud\(page,state\)/);
 assert.match(script,/state\.regions\.map/);
 assert.match(script,/for\(const \[width,height\] of \[\[320,568\],\[390,844\],\[1024,768\]\]\)\{/);
 assert.match(script,/open\(`\$\{width\}-memory-heavy`,width,height,p,'no-preference'\)/);
 assert.match(script,/locator\('\[data-unit="2"\]'\)\.click\(\)/);
 assert.match(script,/shot\(f,'battlefield-memory-heavy'\)/);
 assert.match(script,/open\('390-memory-reduced',390,844,p,'reduce'\)/);
 assert.match(script,/getByRole\('button',\{name:\/Meteor\/i\}\)\.click\(\)/);
 assert.match(script,/observeReducedBattlefieldMemory\(f\.page,'meteor'\)/);
 assert.match(script,/shot\(f,'battlefield-memory-meteor'\)/);
 assert.match(script,/assert\.deepEqual\(still,state,'reduced-motion battlefield memory must remain static'\)/);
 assert.match(script,/page\.emulateMedia\(\{reducedMotion:'reduce'\}\)/,'the native journey must preserve a live mark while system motion becomes reduced');
 assert.match(script,/page\.emulateMedia\(\{reducedMotion:'no-preference'\}\)/,'the native journey must preserve the same mark when system motion resumes');
 assert.match(script,/page\.setViewportSize\(\{width:1000,height:760\}\)/,'resize cleanup must execute in native Chromium');
 assert.match(script,/dataset\.battlefieldEnemyViews/,'the native journey must wait for a real current enemy before casting Meteor');
 assert.match(script,/document\.querySelector\('\[data-skill=\"meteor\"\]'\)/,'the native journey must use the stable Meteor control identity rather than rendered text');
 assert.match(script,/dataset\.battlefieldMemoryPending/,'the native journey must observe the real projectile interval');
 assert.match(script,/normal-motion Meteor memory must remain absent during its observed in-flight frame/);
 assert.match(script,/const handle=await waitForBattlefieldStage\(page,'Meteor projectile carries memory'/,'the in-flight absence proof must use the exact wait handle rather than a later page round trip');
 assert.match(script,/await handle\.jsonValue\(\)/,'the exact observed projectile frame must be materialized for assertion');
 assert.match(script,/control\.click\(\);\}return \{landed,paused:shouldPause\}/,'the motion-transition journey must publicly pause in the same browser frame that proves the Meteor is still in flight');
 assert.match(script,/memory\.reduced===true&&memory\.paused===true/,'the reset-commit evidence must remain under public pause ownership');
 assert.match(script,/const paused=await pauseAtBattlefieldMemory\(f\.page,'meteor'\)/,'the transition comparison must freeze active-time aging through the public pause control');
 assert.match(script,/the publicly paused in-flight mark must survive reduced-to-system without aging/);
 assert.match(script,/entering reduced motion during an observed Meteor flight commits its accepted target memory before clearing animation/);
 assert.match(script,/waitForFunction\(\(\)=>!document\.querySelector\('canvas'\)\?\.dataset\.battlefieldMemory/,'the native journey must prove active-time expiry after the paused check');
});
