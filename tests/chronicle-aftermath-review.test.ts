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
