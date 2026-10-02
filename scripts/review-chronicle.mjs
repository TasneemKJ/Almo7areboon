import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {simulateChronicle,preparedChronicleProfile} from './simulate-chronicle.ts';
import {arrivalReviewFixtures,assertArrivalPaused,validateArrivalSnapshot} from './chronicle-arrival-review.ts';
const base=process.env.REVIEW_URL??'http://127.0.0.1:4173',out='artifacts/chronicle';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--enable-unsafe-swiftshader']});
const errors=[],assetFailures=[],checks=[],screens=[];
async function open(name,width,height,profile,reducedMotion='reduce'){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:width<600,hasTouch:width<600,reducedMotion});
 if(profile)await context.addInitScript(p=>{if(!localStorage.getItem('chronicle-fixture-loaded')){localStorage.setItem('almo7areboon.save.v1',JSON.stringify(p));localStorage.setItem('chronicle-fixture-loaded','yes');}},profile);
 const page=await context.newPage();page.on('pageerror',e=>errors.push({name,error:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({name,error:m.text()});});page.on('response',response=>{if(/\/(art|assets)\//.test(response.url())&&!response.ok())assetFailures.push({name,error:`${response.status()} ${response.url()}`});});
 await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('canvas');await page.waitForTimeout(500);return {page,context,name};
}
async function shot(fixture,state){const file=`${fixture.name}-${state}.png`;await fixture.page.screenshot({path:`${out}/${file}`});screens.push(file);}
async function armCanvasShot(fixture,expected){await fixture.page.locator('canvas').evaluate((node,phase)=>{
 if(typeof node.battlefieldReviewArm!=='function'||!node.battlefieldReviewArm(phase))throw new Error('Phaser post-render snapshot could not be armed');
},expected);}
async function waitForVerdictFrame(fixture,expected){await fixture.page.waitForFunction(phase=>document.querySelector('canvas')?.dataset.battlefieldReviewFrameReady===phase,expected);}
async function canvasShot(fixture,state,expected,reduced=false){
 const capture=await fixture.page.locator('canvas').evaluate((node,phase)=>new Promise((resolve,reject)=>{
  if(typeof node.battlefieldReviewSnapshot!=='function'){reject(new Error('Phaser post-render snapshot is unavailable'));return;}
  node.battlefieldReviewSnapshot(({image,resultOpen,aftermath,villageVerdict})=>{
   if(!(image instanceof HTMLImageElement)){reject(new Error('Phaser post-render snapshot did not return an image'));return;}
   const probe=document.createElement('canvas');probe.width=image.naturalWidth;probe.height=image.naturalHeight;const context=probe.getContext('2d',{willReadFrequently:true});if(!context){reject(new Error('Snapshot pixel probe is unavailable'));return;}context.drawImage(image,0,0);
   const pixels=context.getImageData(0,0,probe.width,probe.height).data,step=Math.max(1,Math.floor(probe.width*probe.height/4096));let opaque=0;const colors=new Set();for(let pixel=0;pixel<probe.width*probe.height;pixel+=step){const i=pixel*4;if(pixels[i+3]>8){opaque++;colors.add(`${pixels[i]>>4}:${pixels[i+1]>>4}:${pixels[i+2]>>4}:${pixels[i+3]>>4}`);}}
   resolve({encoded:image.src.split(',')[1],width:image.naturalWidth,height:image.naturalHeight,resultOpen,aftermath,villageVerdict,opaque,colors:colors.size,phase});
  });
 }),expected);
 assert.equal(capture.resultOpen,false,'survivor verdict snapshot must precede the result sheet');validateAftermathSnapshot(capture.aftermath,expected,reduced);validateVillageVerdictSnapshot(capture.villageVerdict,expected,reduced);assert.ok(capture.opaque>512&&capture.colors>32,`snapshot pixels are blank or uniform: ${JSON.stringify({opaque:capture.opaque,colors:capture.colors})}`);
 const bytes=Buffer.from(capture.encoded,'base64');assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(bytes.readUInt32BE(16),capture.width);assert.equal(bytes.readUInt32BE(20),capture.height);
 const file=`${fixture.name}-${state}.png`;await writeFile(`${out}/${file}`,bytes);screens.push(file);return capture;
}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'root must not overflow horizontally');}
function validateBattlefieldMemory(state,kind,reduced=false,paused=true){
 assert.ok(state&&Number.isInteger(state.count)&&state.count>=1&&state.count<=state.cap);
 assert.equal(state.cap,6);assert.equal(state.kinds.length,state.count);assert.ok(state.kinds.includes(kind));assert.equal(state.regions.length,state.count);assert.equal(state.ages.length,state.count);assert.equal(state.alphas.length,state.count);
 for(const region of state.regions)for(const value of Object.values(region))assert.equal(Number.isFinite(value),true);
 assert.ok(state.regions.every(region=>region.left>=0&&region.right<=450&&region.top>=0&&region.bottom<=500));
 assert.ok(state.ages.every(age=>Number.isFinite(age)&&age>=0&&age<14));assert.ok(state.alphas.every(alpha=>Number.isFinite(alpha)&&alpha>=0&&alpha<=1));
 assert.equal(state.reduced,reduced);assert.equal(state.paused,paused);
}
async function assertMemoryClearOfHud(page,state){
 const geometry=await page.locator('canvas').evaluate((node,regions)=>{
  const canvas=node.getBoundingClientRect(),scale=canvas.width/450,boxes=regions.map(bounds=>({left:canvas.left+bounds.left*scale,top:canvas.top+bounds.top*scale,right:canvas.left+bounds.right*scale,bottom:canvas.top+bounds.bottom*scale}));
  const selectors='.resources .currency,.resources .game-wordmark,.stage .eyebrow,.stage h1,.stage .scene-name,.stage .battle-select,.world-tools button,.battle-meta span,.battle-meta button,.battle-skills button';
  const collisions=[];for(const hud of document.querySelectorAll(selectors)){const style=getComputedStyle(hud),rect=hud.getBoundingClientRect();if(style.display==='none'||style.visibility==='hidden'||!rect.width||!rect.height)continue;if(boxes.some(box=>box.left<rect.right&&box.right>rect.left&&box.top<rect.bottom&&box.bottom>rect.top))collisions.push(hud instanceof HTMLElement?hud.id||hud.className||hud.tagName:hud.nodeName);}
  return {boxes,collisions};
 },state.regions.map(region=>region));
 assert.deepEqual(geometry.collisions,[],'battlefield memory must remain clear of the rendered DOM HUD');return geometry;
}
async function pauseAtBattlefieldMemory(page,kind){
 const deadline=Date.now()+60000;
 while(Date.now()<deadline){
  await page.waitForFunction(value=>{const raw=document.querySelector('canvas')?.dataset.battlefieldMemory;if(!raw)return false;const state=JSON.parse(raw);return state.kinds?.includes(value)&&!state.paused;},kind,{timeout:Math.max(1,deadline-Date.now())});
  const observed=await page.locator('#pause').evaluate((button,value)=>{const raw=document.querySelector('canvas')?.dataset.battlefieldMemory;if(!raw)return null;const state=JSON.parse(raw);if(!state.kinds?.includes(value)||state.paused)return null;button.click();return {...state,paused:true};},kind);
  if(!observed)continue;
  await page.waitForFunction(()=>{const raw=document.querySelector('canvas')?.dataset.battlefieldMemory;return raw&&JSON.parse(raw).paused===true;});
  const paused=await page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory));
  assert.deepEqual(paused,observed,'public pause must freeze battlefield memory');return paused;
 }
 throw new Error(`Timed out pausing at ${kind} battlefield memory`);
}
async function observeReducedBattlefieldMemory(page,kind){
 await page.waitForFunction(value=>{const raw=document.querySelector('canvas')?.dataset.battlefieldMemory;if(!raw)return false;const state=JSON.parse(raw);return state.kinds?.includes(value)&&state.reduced&&!state.paused&&state.ages.some(age=>age>=10.25)&&state.alphas.every(alpha=>alpha===.26);},kind,{timeout:60000});
 return page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory));
}
async function assertVerdictClearOfHud(page,state){
 const geometry=await page.locator('canvas').evaluate((node,regions)=>{
  const canvas=node.getBoundingClientRect(),scale=canvas.width/450,boxes=regions.map(bounds=>({left:canvas.left+bounds.left*scale,top:canvas.top+bounds.top*scale,right:canvas.left+bounds.right*scale,bottom:canvas.top+bounds.bottom*scale}));
  const selectors='.resources .currency,.resources .game-wordmark,.stage .eyebrow,.stage h1,.stage .scene-name,.stage .battle-select,.world-tools button,.battle-meta span,.battle-meta button,.battle-skills button';
  const collisions=[];for(const hud of document.querySelectorAll(selectors)){const style=getComputedStyle(hud),rect=hud.getBoundingClientRect();if(style.display==='none'||style.visibility==='hidden'||!rect.width||!rect.height)continue;if(boxes.some(box=>box.left<rect.right&&box.right>rect.left&&box.top<rect.bottom&&box.bottom>rect.top))collisions.push(hud instanceof HTMLElement?hud.id||hud.className||hud.tagName:hud.nodeName);}
  return {boxes,collisions};
 },state.regions);
 assert.deepEqual(geometry.collisions,[],'village verdict must remain clear of the rendered DOM HUD');return geometry;
}
async function releaseVerdictFrame(fixture){await fixture.page.locator('canvas').evaluate(node=>{delete node.dataset.battlefieldReviewFrameReady;});}
async function canvasShotAndRelease(fixture,state,expected,reduced=false){try{return await canvasShot(fixture,state,expected,reduced);}finally{await releaseVerdictFrame(fixture);}}
async function verdictWorldShot(fixture,state){try{assert.equal(await fixture.page.locator('.result-dialog').count(),0,'full-stage verdict screenshot must precede the result sheet');const file=`${fixture.name}-${state}.png`;await fixture.page.screenshot({path:`${out}/${file}`,scale:'css'});screens.push(file);assert.equal(await fixture.page.locator('.result-dialog').count(),0,'result sheet opened during the full-stage verdict screenshot');}finally{await releaseVerdictFrame(fixture);}}
const saved=page=>page.evaluate(()=>localStorage.getItem('almo7areboon.save.v1'));
async function pauseAtLandmarkPhase(page,phase){
 const deadline=Date.now()+60000;
 while(Date.now()<deadline){
  await page.waitForFunction(value=>{const raw=document.querySelector('canvas')?.dataset.chronicleLandmark;if(!raw)return false;const state=JSON.parse(raw);return state.phase===value&&(value!=='claiming-player'||state.activeMarks>0&&state.activeMarks<8);},phase,{timeout:Math.max(1,deadline-Date.now())});
  const state=await page.locator('#pause').evaluate((button,value)=>{const raw=document.querySelector('canvas')?.dataset.chronicleLandmark;if(!raw)return null;const current=JSON.parse(raw);if(current.phase!==value||value==='claiming-player'&&!(current.activeMarks>0&&current.activeMarks<8))return null;button.click();return current;},phase);
  if(!state)continue;
  await page.locator('#pause[aria-pressed="true"]').waitFor();
  assert.deepEqual(await page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.chronicleLandmark)),state,'public pause control must freeze the observed landmark phase');
  return state;
 }
 throw new Error(`Timed out pausing at landmark phase ${phase}`);
}
// Production persists playable profiles every five seconds. Cross that real
// boundary before asserting that a paused presentation itself writes nothing.
async function settledSaveAfterAutosave(page){await page.waitForTimeout(5250);return saved(page);}
async function pauseAtWaveArrival(page,intent,onObserved){
 const deadline=Date.now()+30000;
 while(Date.now()<deadline){
  await page.waitForFunction(value=>{const raw=document.querySelector('canvas')?.dataset.waveArrival;if(!raw)return false;const state=JSON.parse(raw);return state.intent===value&&state.nextIn>=0&&state.nextIn<=4&&!state.paused;},intent,{timeout:Math.max(1,deadline-Date.now())});
  const observed=await page.locator('canvas').evaluate((node,value)=>{const raw=node.dataset.waveArrival;if(!raw)return null;const state=JSON.parse(raw);return state.intent===value&&!state.paused?state:null;},intent);
  if(!observed)continue;validateArrivalSnapshot(observed,intent);await onObserved?.(observed);
  const before=await page.locator('#pause').evaluate((button,value)=>{const raw=document.querySelector('canvas')?.dataset.waveArrival;if(!raw)return null;const state=JSON.parse(raw);if(state.intent!==value||state.paused)return null;button.click();return state;},intent);
  if(!before)continue;
  await page.waitForFunction(()=>{const raw=document.querySelector('canvas')?.dataset.waveArrival;return raw&&JSON.parse(raw).paused===true;});
  const paused=await page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.waveArrival));
  validateArrivalSnapshot(before,intent);validateArrivalSnapshot(paused,intent);assertArrivalPaused(before,paused);return {before,paused};
 }
 throw new Error(`Timed out pausing at ${intent} wave arrival`);
}
async function pauseAtCatMode(page,mode){
 const deadline=Date.now()+60000;
 while(Date.now()<deadline){
  await page.waitForFunction(value=>{const raw=document.querySelector('canvas')?.dataset.chronicleCat;if(!raw)return false;const state=JSON.parse(raw);return state.mode===value&&!state.paused;},mode,{timeout:Math.max(1,deadline-Date.now())});
  const observed=await page.locator('#pause').evaluate((button,value)=>{const raw=document.querySelector('canvas')?.dataset.chronicleCat;if(!raw)return null;const state=JSON.parse(raw);if(state.mode!==value||state.paused)return null;button.click();return state;},mode);
  if(!observed)continue;
  await page.waitForFunction(()=>{const raw=document.querySelector('canvas')?.dataset.chronicleCat;if(!raw)return false;return JSON.parse(raw).paused===true;});
  const paused=await page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.chronicleCat));
  assert.equal(paused.mode,mode);assert.equal(paused.paused,true);
  assert.deepEqual({mode:paused.mode,x:paused.x,gait:paused.gait,tailAngle:paused.tailAngle,paws:paused.paws},{mode:observed.mode,x:observed.x,gait:observed.gait,tailAngle:observed.tailAngle,paws:observed.paws},'public pause control must freeze the observed cat frame');
  assert.ok(paused.groundDepth<paused.catDepth&&paused.catDepth<paused.endpointDepth);
  return paused;
 }
 throw new Error(`Timed out pausing at cat mode ${mode}`);
}
function validateAftermathSnapshot(state,outcome,reduced=false){
 assert.equal(state.phase,outcome);assert.ok(state.elapsed>=0&&state.elapsed<=1.3);
 assert.equal(state.triumph>0,true,'the surviving winning side must answer the verdict');if(outcome==='lost')assert.equal(state.withdraw>0,true,'a living defeated survivor must visibly withdraw');
 assert.equal(Array.isArray(state.roles),true);assert.equal(state.roles.length,3);assert.equal(state.roles.every(value=>Number.isInteger(value)&&value>=0),true);
 assert.ok(state.maxForward>=0&&state.maxForward<=4);assert.ok(state.maxLift>=0&&state.maxLift<=4);assert.ok(state.maxAngle>=0&&state.maxAngle<=4);assert.equal(state.reduced,reduced);
}
function validateVillageVerdictSnapshot(state,outcome,reduced=false){
 assert.equal(state.mode,outcome==='won'?'celebrate':'shelter');assert.equal(state.progress,1);
 if(outcome==='won'){assert.ok(state.witnesses>=1&&state.witnesses<=2);assert.equal(state.strokes,state.witnesses*3);}else {assert.equal(state.witnesses,0);assert.ok(state.strokes===2||state.strokes===4);}
 assert.ok(Number.isInteger(state.lights)&&state.lights>=2&&state.lights<=6);assert.ok(Number.isInteger(state.affectedLights)&&state.affectedLights>=0&&state.affectedLights<=state.lights);assert.ok(Array.isArray(state.regions)&&state.regions.length>=state.strokes+state.affectedLights);for(const bounds of state.regions){for(const value of Object.values(bounds))assert.ok(Number.isFinite(value));assert.ok(bounds.left<bounds.right&&bounds.top<bounds.bottom);}assert.equal(state.reduced,reduced);assert.equal(state.paused,false);
}
async function clickEnabled(page,locator){
 if(await page.locator('#world').getAttribute('data-phase')!=='running'||!await locator.isEnabled())return false;
 try{await locator.click({timeout:750,noWaitAfter:true,force:true});return true;}catch(error){if(error instanceof Error&&error.name==='TimeoutError')return false;const phase=await page.locator('#world').getAttribute('data-phase');if(phase!=='won'&&phase!=='lost')throw error;return false;}
}
async function reachNaturalOutcome(page,outcome){
 await page.locator('[data-command="start"]').click();
 const deadline=Date.now()+90000,order=[0,1,0,2,1,2];let cursor=0,lateHeavy=false;
 while(Date.now()<deadline){
  const phase=await page.locator('#world').getAttribute('data-phase');
  if(phase===outcome)return;
  if(phase==='won'||phase==='lost')throw new Error(`Expected ${outcome}, reached ${phase}`);
  if(outcome==='won'){
   const kind=order[cursor%order.length],unit=page.locator(`[data-unit="${kind}"]`);
   if(await clickEnabled(page,unit))cursor++;
   for(const skill of ['food','freeze','meteor'])await clickEnabled(page,page.locator(`[data-skill="${skill}"]`));
  }else if(!lateHeavy){
   const label=await page.locator('#base-status').textContent(),health=Number(label?.match(/Your base: ([\d.]+)/)?.[1]??Infinity);
   if(health<=30)lateHeavy=await clickEnabled(page,page.locator('[data-unit="2"]'));
  }
  await page.waitForTimeout(40);
 }
 throw new Error(`Timed out waiting for natural ${outcome}`);
}
try{
 for(const [width,height] of [[320,568],[390,844],[1024,768]]){
  const f=await open(`${width}`,width,height);await shot(f,'ready');await noOverflow(f.page);
  await f.page.locator('[data-command="chronicle"]').first().click();await f.page.locator('.chronicle-book').waitFor();await noOverflow(f.page);await shot(f,'journey');
  assert.equal(await f.page.locator('[data-story-route="bell"]').isDisabled(),true);assert.equal(await f.page.locator('[data-story-route="whisper"]').isDisabled(),true);
  await f.page.locator('[data-story-route="escort"]').click();await f.page.locator('[data-command="start"]').click();
  await f.page.locator('#story-rally').click();await f.page.locator('[data-unit="0"]').click();
  await f.page.waitForTimeout(1400);assert.equal(await f.page.locator('#story-rally').getAttribute('aria-pressed'),'true');await shot(f,'rally');
  await f.page.locator('#story-rally').click();assert.equal(await f.page.locator('#story-rally').getAttribute('aria-pressed'),'false');checks.push(`${width}: boot, journey, route gate, escort, rally/release, no overflow`);await f.context.close();
 }
 for(const restoration of [0,7]){
  const p=preparedChronicleProfile();p.chronicle.restoration=restoration;const f=await open(`390-restoration-${restoration?'full':'none'}`,390,844,p),before=await saved(f.page);
  await shot(f,'ready');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before);await noOverflow(f.page);
  checks.push(`disclosed restoration=${restoration} ready-state fixture renders the current painted settlement without presentation save writes`);await f.context.close();
 }
 for(const fixture of arrivalReviewFixtures()){
  const p=preparedChronicleProfile();p.speed=1;p.enemyAge=0;p.furthestBattle=Math.max(0,p.furthestBattle);p.chronicle.chapter=0;p.chronicle.route=fixture.route;p.chronicle.expedition=null;
  const f=await open(fixture.name,fixture.width,fixture.height,p);await f.page.locator('[data-command="start"]').click();
  const {paused}=await pauseAtWaveArrival(f.page,fixture.intent,()=>shot(f,'incoming-road'));assert.equal(paused.reduced,true);assert.ok(paused.x>=340&&paused.x<=410);assert.ok(paused.y>120&&paused.y<430);
  const before=await settledSaveAfterAutosave(f.page);await noOverflow(f.page);await f.page.waitForTimeout(5250);
  assert.equal(await saved(f.page),before,'paused wave-arrival presentation must remain save-inert across the next autosave boundary');
  const still=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.waveArrival));validateArrivalSnapshot(still,fixture.intent);assert.deepEqual(still,paused,'paused road omen must remain static');
  checks.push(`${fixture.width}: real ${fixture.intent} commander preview renders the schedule-derived road omen behind actors and stays static/save-inert under public pause`);await f.context.close();
 }
 for(const [width,height] of [[320,568],[390,844],[1024,768]]){
  const p=preparedChronicleProfile();p.motion='system';p.speed=2;p.age=0;p.enemyAge=0;p.foodLevel=12;p.unlocked=[true,true,true];p.chronicle.route='road';p.chronicle.expedition=null;
  const f=await open(`${width}-memory-heavy`,width,height,p,'no-preference');await f.page.locator('[data-command="start"]').click();
  await f.page.waitForFunction(()=>{const node=document.querySelector('[data-unit="2"]');return node instanceof HTMLButtonElement&&!node.disabled;},null,{timeout:20000});await f.page.locator('[data-unit="2"]').click();
  const state=await pauseAtBattlefieldMemory(f.page,'heavy');validateBattlefieldMemory(state,'heavy');await assertMemoryClearOfHud(f.page,state);await noOverflow(f.page);
  const before=await settledSaveAfterAutosave(f.page);await shot(f,'battlefield-memory-heavy');await f.page.waitForTimeout(5250);assert.equal(await saved(f.page),before,'paused battlefield memory must remain save-inert across an autosave boundary');assert.deepEqual(await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory)),state,'paused heavy memory must remain static');
  if(width===390){await f.page.emulateMedia({reducedMotion:'reduce'});await f.page.waitForFunction(()=>JSON.parse(document.querySelector('canvas')?.dataset.battlefieldMemory??'null')?.reduced===true);const reduced=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory));assert.deepEqual({...reduced,reduced:false},state,'system-to-reduced transition must preserve the live paused mark');await f.page.emulateMedia({reducedMotion:'no-preference'});await f.page.waitForFunction(()=>JSON.parse(document.querySelector('canvas')?.dataset.battlefieldMemory??'null')?.reduced===false);assert.deepEqual(await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory)),state,'reduced-to-system transition must preserve the live paused mark');}
  if(width===1024){await f.page.setViewportSize({width:1000,height:760});await f.page.waitForFunction(()=>!document.querySelector('canvas')?.dataset.battlefieldMemory);}
  checks.push(`${width}: a real public heavy deployment leaves one bounded depth-safe road gouge that freezes under public pause without save writes; live motion transitions preserve it and resize cleanup is verified`);await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.motion='system';p.speed=1;p.age=0;p.enemyAge=0;p.chronicle.route='road';p.chronicle.expedition=null;
  const f=await open('390-memory-meteor-landing',390,844,p,'no-preference');await f.page.locator('[data-command="start"]').click();await f.page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.battlefieldEnemyViews??0)>0,null,{timeout:60000});const meteor=f.page.getByRole('button',{name:/Meteor/i});await f.page.waitForFunction(()=>{const node=[...document.querySelectorAll('button')].find(button=>/Meteor/i.test(button.textContent??''));return node instanceof HTMLButtonElement&&!node.disabled;});await meteor.click();
  await f.page.waitForFunction(()=>JSON.parse(document.querySelector('canvas')?.dataset.battlefieldMemoryPending??'[]').includes('meteor'));const beforeLanding=await f.page.locator('canvas').evaluate(node=>node.dataset.battlefieldMemory?JSON.parse(node.dataset.battlefieldMemory):null);assert.equal(beforeLanding?.kinds?.includes('meteor')??false,false,'normal-motion Meteor memory must remain absent during its observed in-flight frame');
  await f.page.waitForFunction(()=>!document.querySelector('canvas')?.dataset.battlefieldMemoryPending&&JSON.parse(document.querySelector('canvas')?.dataset.battlefieldMemory??'null')?.kinds?.includes('meteor'));const landed=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory));validateBattlefieldMemory(landed,'meteor',false,false);await f.context.close();checks.push('390: normal-motion Meteor remains absent during an observed projectile frame and records real target memory only after landing');
 }
 {
  const p=preparedChronicleProfile();p.motion='system';p.speed=1;p.age=0;p.enemyAge=0;p.chronicle.route='road';p.chronicle.expedition=null;
  const f=await open('390-memory-flight-transition',390,844,p,'no-preference');await f.page.locator('[data-command="start"]').click();await f.page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.battlefieldEnemyViews??0)>0,null,{timeout:60000});const meteor=f.page.getByRole('button',{name:/Meteor/i});await f.page.waitForFunction(()=>{const node=[...document.querySelectorAll('button')].find(button=>/Meteor/i.test(button.textContent??''));return node instanceof HTMLButtonElement&&!node.disabled;});await meteor.click();
  await f.page.waitForFunction(()=>JSON.parse(document.querySelector('canvas')?.dataset.battlefieldMemoryPending??'[]').includes('meteor'));assert.equal(await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory??'null')?.kinds?.includes('meteor')??false),false);await f.page.emulateMedia({reducedMotion:'reduce'});
  await f.page.waitForFunction(()=>!document.querySelector('canvas')?.dataset.battlefieldMemoryPending&&JSON.parse(document.querySelector('canvas')?.dataset.battlefieldMemory??'null')?.kinds?.includes('meteor')&&JSON.parse(document.querySelector('canvas')?.dataset.battlefieldMemory??'null')?.reduced===true);const committed=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory));validateBattlefieldMemory(committed,'meteor',true,false);const paused=await pauseAtBattlefieldMemory(f.page,'meteor');validateBattlefieldMemory(paused,'meteor',true,true);await f.page.emulateMedia({reducedMotion:'no-preference'});await f.page.waitForFunction(()=>JSON.parse(document.querySelector('canvas')?.dataset.battlefieldMemory??'null')?.reduced===false);assert.deepEqual(await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory)),{...paused,reduced:false},'the publicly paused in-flight mark must survive reduced-to-system without aging');await f.context.close();checks.push('390: entering reduced motion during an observed Meteor flight commits its accepted target memory before clearing animation');
 }
 {
  const p=preparedChronicleProfile();p.motion='system';p.speed=1;p.age=0;p.enemyAge=0;p.chronicle.route='road';p.chronicle.expedition=null;
  const f=await open('390-memory-reduced',390,844,p,'reduce');await f.page.locator('[data-command="start"]').click();await f.page.waitForTimeout(5000);await f.page.getByRole('button',{name:/Meteor/i}).click();
  const aging=await observeReducedBattlefieldMemory(f.page,'meteor');validateBattlefieldMemory(aging,'meteor',true,false);assert.ok(aging.alphas.every(alpha=>alpha===.26));
  const state=await pauseAtBattlefieldMemory(f.page,'meteor');validateBattlefieldMemory(state,'meteor',true,true);await assertMemoryClearOfHud(f.page,state);await noOverflow(f.page);await shot(f,'battlefield-memory-meteor');
  await f.page.waitForTimeout(450);const still=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.battlefieldMemory));assert.deepEqual(still,state,'reduced-motion battlefield memory must remain static');await f.page.locator('#pause').click();await f.page.waitForFunction(()=>!document.querySelector('canvas')?.dataset.battlefieldMemory,null,{timeout:6000});checks.push('390: accepted public Meteor leaves a constant-alpha reduced-motion rosette past the normal fade boundary, freezes under pause, and expires after active time resumes');await f.context.close();
 }
 for(const [name,width,height,outcome] of [['320-aftermath-loss',320,568,'lost'],['390-aftermath-win',390,844,'won'],['1024-aftermath-win',1024,768,'won']]){
  const p=preparedChronicleProfile();p.motion='system';p.speed=2;p.age=0;p.enemyAge=0;p.chronicle.route='road';p.chronicle.expedition=null;
  if(outcome==='lost'){p.baseLevel=0;p.foodLevel=0;p.unlocked=[true,true,true];}
 const f=await open(name,width,height,p,'no-preference');await armCanvasShot(f,outcome);await reachNaturalOutcome(f.page,outcome);
  await waitForVerdictFrame(f,outcome);await verdictWorldShot(f,`${outcome}-survivor-verdict-world`);
  const capture=await canvasShot(f,`${outcome}-survivor-verdict`,outcome);await assertVerdictClearOfHud(f.page,capture.villageVerdict);await noOverflow(f.page);
  await f.page.locator('.result-dialog').waitFor({timeout:2500});const afterSettlement=await saved(f.page);await f.page.waitForTimeout(450);assert.equal(await saved(f.page),afterSettlement,'settled verdict presentation must remain save-inert');
  checks.push(`${width}: public controls reach a natural ${outcome}; same-frame canvas and full-stage HUD evidence precede the unchanged result sheet and remain save-inert`);await f.context.close();
 }
 for(const [name,width,height,outcome,reducedMotion] of [['390-aftermath-reduced',390,844,'won','reduce']]){
  const p=preparedChronicleProfile();p.motion='system';p.speed=2;p.age=0;p.enemyAge=0;p.chronicle.route='road';p.chronicle.expedition=null;
  const f=await open(name,width,height,p,reducedMotion);await armCanvasShot(f,outcome);await reachNaturalOutcome(f.page,outcome);
  const capture=await canvasShotAndRelease(f,`${outcome}-survivor-verdict`,outcome,true);await assertVerdictClearOfHud(f.page,capture.villageVerdict);await noOverflow(f.page);
  await f.page.locator('.result-dialog').waitFor({timeout:2500});await f.page.waitForTimeout(450);const settled=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.villageVerdict));assert.deepEqual(settled,capture.villageVerdict,'reduced-motion verdict must remain complete and static');
  checks.push('390: reduced motion renders the complete stable village verdict through the same natural public-control win');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.sound=true;const f=await open('390-company',390,844,p);
  await f.page.locator('[data-command="chronicle"]').first().click();await f.page.locator('.story-company summary').click();
  const dialog=f.page.locator('.chronicle-dialog'),captain=f.page.locator('[data-story-captain="gatekeeper"]');await captain.scrollIntoViewIfNeeded();await captain.focus();const captainScroll=await dialog.evaluate(node=>node.scrollTop);await captain.click();
  assert.equal(await f.page.evaluate(()=>document.activeElement?.getAttribute('data-story-captain')),'gatekeeper');assert.ok(Math.abs(await dialog.evaluate(node=>node.scrollTop)-captainScroll)<=2);
  const tale=f.page.locator('[data-story-tale="borrowed-bell"]');await tale.focus();const taleScroll=await dialog.evaluate(node=>node.scrollTop);await tale.click();assert.equal(await f.page.evaluate(()=>document.activeElement?.getAttribute('data-story-tale')),'borrowed-bell');assert.ok(Math.abs(await dialog.evaluate(node=>node.scrollTop)-taleScroll)<=2);await shot(f,'preparation');
  await f.page.locator('[data-story-route="escort"]').click();await f.page.locator('[data-command="start"]').click();await f.page.locator('[data-unit="0"]').click();
  await f.page.waitForTimeout(1400);await f.page.locator('[data-unit="1"]').click();await f.page.waitForTimeout(1700);await f.page.locator('[data-unit="2"]').click();
  await f.page.locator('[data-skill="food"]').click();assert.equal(await f.page.locator('[data-skill="food"]').isDisabled(),true);
  await shot(f,'escort-captain');await noOverflow(f.page);checks.push('captain and featured tale preserve storybook scroll/focus; captain cast consumed once');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.speed=1;const f=await open('390-formation',390,844,p);await f.page.locator('[data-command="start"]').click();
  await f.page.locator('[data-unit="0"]').click();const ranged=f.page.locator('[data-unit="1"]');await f.page.waitForFunction(()=>{const node=document.querySelector('[data-unit="1"]');return node instanceof HTMLButtonElement&&!node.disabled;},null,{timeout:15000});assert.equal(await ranged.isDisabled(),false);await ranged.click();await f.page.waitForTimeout(900);
  const before=await saved(f.page);await shot(f,'protected-thread');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before);
  assert.match(await f.page.locator('#deploy-hint').textContent(),/Freeze|keeps watch|Gather/);await noOverflow(f.page);checks.push('real defender then ranged deployment renders its live formation relationship without presentation save writes');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.chronicle.route='bell';const f=await open('390-bell',390,844,p);await f.page.locator('[data-command="start"]').click();
  await f.page.waitForFunction(()=>document.querySelector('#deploy-hint')?.textContent?.includes('Bell ringing in'),null,{timeout:90000});await shot(f,'warning');assert.match(await f.page.locator('#deploy-hint').textContent(),/Bell ringing in/);checks.push('boss actor and objective guidance are present');await f.context.close();
 }
 for(const [width,height] of [[320,568],[390,844],[1024,768]]){
  const p=preparedChronicleProfile();p.timeline=2;p.mastery.timeline=2;p.chronicle.timeline=2;p.chronicle.route='lantern';const f=await open(`${width}-night`,width,height,p);await f.page.locator('[data-command="start"]').click();
  for(const kind of [0,1,0,2,1,2]){const button=f.page.locator(`[data-unit="${kind}"]`);await f.page.waitForFunction(value=>{const node=document.querySelector(`[data-unit="${value}"]`);return node instanceof HTMLButtonElement&&!node.disabled;},String(kind),{timeout:20000});await button.click();}
  for(const [phase,name,shape] of [['claiming-player','lantern-claim','knot'],['contested','lantern-contested','cross'],['held-player','lantern-owned','knot']]){
   const state=await pauseAtLandmarkPhase(f.page,phase);
   assert.equal(state.phase,phase);assert.ok(state.groundDepth<state.propDepth&&state.propDepth<state.actorFrontDepth);assert.deepEqual(state.shapes,[shape]);
   if(phase==='claiming-player')assert.ok(state.progress>0&&state.progress<1&&state.activeMarks>0&&state.activeMarks<8);
   if(phase==='contested')assert.ok(state.playerCount>0&&state.enemyCount>0&&state.activeMarks===0);
   if(phase==='held-player')assert.ok(state.progress===1&&state.activeMarks===8&&state.owner==='player');
   await f.page.waitForTimeout(5250);assert.deepEqual(await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.chronicleLandmark)),state,'paused landmark presentation must stay static while legitimate pre-pause combat changes settle');const before=await saved(f.page);
   await shot(f,name);await f.page.waitForTimeout(5250);assert.equal(await saved(f.page),before,'paused landmark presentation must stay save-inert across the next autosave boundary');assert.deepEqual(await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.chronicleLandmark)),state,'paused landmark presentation must stay static');await noOverflow(f.page);
   await f.page.locator('#pause').click();await f.page.locator('#pause[aria-pressed="false"]').waitFor();
  }
  checks.push(`${width}: public deployments reach real lantern claim, contest and ownership; seal is depth-safe, static and save-inert`);await f.context.close();
 }
 for(const [width,height] of [[320,568],[390,844],[1024,768]]){
  const p=preparedChronicleProfile();p.chronicle.route='scout';const f=await open(`${width}-rescue`,width,height,p);await f.page.locator('[data-command="start"]').click();
  for(const kind of [0,1,0,2,1,2]){const button=f.page.locator(`[data-unit="${kind}"]`);await f.page.waitForFunction(value=>{const node=document.querySelector(`[data-unit="${value}"]`);return node instanceof HTMLButtonElement&&!node.disabled;},String(kind),{timeout:20000});await button.click();}
  await f.page.waitForFunction(()=>/^Free the scout · [123]\./.test(document.querySelector('#deploy-hint')?.textContent??''),null,{timeout:60000});await f.page.keyboard.press('Space');await f.page.locator('[data-command="pause"]').waitFor();
  let before=await settledSaveAfterAutosave(f.page),state=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.chronicleRescue));
  assert.deepEqual(state.cage,{visible:true,x:279,texture:'chronicle-cage-ink-v1'});assert.equal(state.scout.visible,false);assert.ok(state.groundDepth<state.cageDepth);
  await shot(f,'cage-progress');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before,'paused rescue presentation must not write progress');
  await f.page.keyboard.press('Space');await f.page.waitForFunction(()=>{const match=document.querySelector('#deploy-hint')?.textContent?.match(/Scout returning home · (\d+)%/);return match&&Number(match[1])>=25;},null,{timeout:20000});await f.page.keyboard.press('Space');await f.page.locator('[data-command="pause"]').waitFor();
  state=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.chronicleRescue));assert.deepEqual(state.cage,{visible:true,x:279,texture:'chronicle-cage-open-ink-v1'});assert.equal(state.scout.visible,true);assert.ok(state.scout.x<state.cage.x);assert.equal(state.scout.frame,0);assert.equal(state.scout.mode,'painted');assert.match(state.scout.texture,/^army-\d-1-player$/);assert.ok(state.groundDepth<state.cageDepth&&state.groundDepth<state.scoutDepth);
  before=await settledSaveAfterAutosave(f.page);await shot(f,'scout-homecoming');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before,'paused homecoming presentation must not write progress');await noOverflow(f.page);
  checks.push(`${width}: public controls reach real cage progress; runtime actors remain separate and depth-safe; paused presentation is static and save-inert`);await f.context.close();
 }
 for(const [width,height] of [[320,568],[390,844],[1024,768]]){
  const p=preparedChronicleProfile();p.speed=1;p.chronicle.discoveries=7;p.chronicle.route='whisper';p.chronicle.expedition=null;
  const f=await open(`${width}-cat`,width,height,p,'no-preference');await f.page.locator('[data-command="start"]').click();
  let cat=await pauseAtCatMode(f.page,'leading'),before=await settledSaveAfterAutosave(f.page);assert.ok(cat.x>=78&&cat.x<249);await shot(f,'cat-leading');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before,'paused cat presentation must remain save-inert');
  await f.page.locator('#pause').click();
  for(const kind of [0,1,0,2,1,2]){const button=f.page.locator(`[data-unit="${kind}"]`);await f.page.waitForFunction(value=>{const node=document.querySelector(`[data-unit="${value}"]`);return node instanceof HTMLButtonElement&&!node.disabled;},String(kind),{timeout:20000});await button.click();}
  cat=await pauseAtCatMode(f.page,'watching');assert.equal(cat.x,249);let rescue=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.chronicleRescue));assert.equal(rescue.cage.texture,'chronicle-cage-ink-v1');assert.equal(rescue.scout.visible,false);await shot(f,'cat-watching');
  await f.page.locator('#pause').click();await f.page.waitForFunction(()=>{const match=document.querySelector('#deploy-hint')?.textContent?.match(/Scout returning home · (\d+)%/);return match&&Number(match[1])>=10;},null,{timeout:30000});
  cat=await pauseAtCatMode(f.page,'home');rescue=await f.page.locator('canvas').evaluate(node=>JSON.parse(node.dataset.chronicleRescue));assert.ok(cat.mode==='home'&&cat.x<rescue.scout.x);assert.equal(rescue.cage.texture,'chronicle-cage-open-ink-v1');await shot(f,'cat-home');await noOverflow(f.page);
  checks.push(`${width}: discovered missing-page cat leads, watches the real cage and accompanies the publicly rescued scout home without save or input ownership`);await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.speed=1;p.chronicle.discoveries=7;p.chronicle.route='whisper';const f=await open('390-cat-reduced',390,844,p);await f.page.locator('[data-command="start"]').click();
  const cat=await pauseAtCatMode(f.page,'watching');assert.deepEqual({x:cat.x,gait:cat.gait,paws:cat.paws,reduced:cat.reduced},{x:249,gait:0,paws:0,reduced:true});await shot(f,'cat-reduced-watch');
  checks.push('390: reduced-motion cat uses a fixed watching pose with no presentation travel or gait');await f.context.close();
 }
 {
  const p=simulateChronicle('escort').profile;p.chronicle.discoveries=0;const f=await open('390-discovery',390,844,p);await f.page.locator('.result-dialog').waitFor();await f.page.locator('.story-discoveries summary').click();
  await f.page.locator('[data-story-discovery="door"]').click();await f.page.waitForTimeout(200);assert.equal(await f.page.locator('[data-story-discovery="door"]').isDisabled(),true);assert.equal(await f.page.evaluate(()=>{const active=document.activeElement;return active instanceof HTMLElement&&active.closest('.result-dialog')!==null&&!active.matches(':disabled,[aria-disabled="true"]');}),true);await shot(f,'found-page');
  await f.page.locator('.result-dialog [data-command="chronicle"]').click();await f.page.keyboard.press('Escape');await f.page.locator('.result-dialog').waitFor();
  await f.page.reload({waitUntil:'networkidle'});await f.page.locator('.result-dialog').waitFor();const save=await f.page.evaluate(()=>JSON.parse(localStorage.getItem('almo7areboon.save.v1')));assert.equal(save.chronicle.discoveries,1);checks.push('discovery persists, restores enabled focus and closing storybook restores the result instead of stranding the player');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.chronicle.route='escort';p.chronicle.expedition={stage:0,chapter:0,reserve:0,provision:'supplies'};const won=simulateChronicle('escort',p).profile;
  const f=await open('390-expedition',390,844,won);await f.page.locator('.result-dialog').waitFor();assert.equal(await f.page.locator('[data-command="next"]').count(),0);
  await f.page.locator('[data-story-provision="shelter"]').click();await shot(f,'checkpoint');await f.page.locator('[data-command="story-continue"]').click();
  await f.page.reload({waitUntil:'networkidle'});await f.page.locator('[data-command="start"]').waitFor();const saved=await f.page.evaluate(()=>JSON.parse(localStorage.getItem('almo7areboon.save.v1')));assert.equal(saved.chronicle.expedition.stage,1);assert.equal(saved.chronicle.expedition.provision,'shelter');assert.equal(saved.pendingVictory,null);checks.push('expedition continue consumes receipt once and resumes the next objective after reload');await f.context.close();
 }
 assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(assetFailures.length,0,JSON.stringify(assetFailures));
}catch(error){errors.push({name:'review',error:String(error)});process.exitCode=1;}
finally{await writeFile(`${out}/report.json`,JSON.stringify({scope:'Chromium software rendering; disclosed preparation fixtures, public battle controls, portrait and desktop viewports; not physical-device, Safari, organic-balance or retention acceptance',checks,screens,errors,assetFailures},null,2));console.log(JSON.stringify({checks,screens,errors,assetFailures},null,2));await browser.close();}
