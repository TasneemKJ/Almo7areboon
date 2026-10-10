/**
 * Real browser screenshots and geometry checks for the world-first portrait UI, on the production preview.
 *  - Boot: storybook art and painted icons load without a renderer fallback; the canvas renders at device density.
 *  - Battle: Play opens the world and starts the battle; a tap, a click or a number key on a waiting recruit deploys
 *    exactly once and spends only its food; the field pause, a settings dialog and editable focus isolate the shortcuts.
 *  - Chapters: every era's Camp, company portraits and battlefield, at 320 and 390px, with no sideways scroll.
 *  - Evolution through Camp changes the era's art; trait accents render through the layering fixture.
 * Screenshots go to artifacts/browser-review. Run: npm run build && npm run review:browser
 * (CHROMIUM_PATH reuses an installed Chromium; REVIEW_PORT pins the preview port).
 */
import {freePort, launchChromium, enterCamp, enterWorld, openCampStation, openEvolution, openSettings, pauseField, resumeField} from './lib/browser.mjs';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';

const PORT=await freePort(),ORIGIN=`http://127.0.0.1:${PORT}/`,FIXTURE_PORT=await freePort({fromEnv:false}),FIXTURE=`http://127.0.0.1:${FIXTURE_PORT}`;
const SAVE='almo7areboon.save.v1';
const ERAS=[
 {name:'first-fires',folder:'/art/storybook',roles:['pathkeeper','thrower','rider']},
 {name:'olive-terraces',folder:'/art/storybook/olive',roles:['fieldhand','slinger','harvester']},
 {name:'harbor',folder:'/art/storybook/harbor',roles:['quay-guard','archer','quay-rider']},
 {name:'lantern',folder:'/art/storybook/lantern',roles:['gatekeeper','musketeer','cannon']},
 {name:'hillside',folder:'/art/storybook/hillside',roles:['sentinel','scout','tank']},
 {name:'courtyards',folder:'/art/storybook/courtyards',roles:['light-guard','trooper','sky-skimmer']},
];

/** A page seeded with a save; errors, missing storybook art and renderer fallbacks are recorded. */
async function session(browser,record,{viewport={width:390,height:844},touch=true,profile={}}={}){
 const context=await browser.newContext({viewport,deviceScaleFactor:2,hasTouch:touch,isMobile:touch});
 await context.addInitScript(([key,seed])=>{
  if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem(key,JSON.stringify(seed));}
  document.addEventListener('visual-fallback',()=>{document.body.dataset.reviewFallback='true';});
 },[SAVE,{version:2,timeline:1,age:0,enemyAge:0,coins:0,cards:[],unlocked:[true,true,true],sound:false,deployed:0,...profile}]);
 const page=await context.newPage();
 page.on('pageerror',error=>record.errors.push(error.message));
 page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())record.assetFailures.push(`${response.status()} ${response.url()}`);});
 await page.goto(ORIGIN);
 await page.waitForFunction(()=>!document.querySelector('.world-loader'),null,{timeout:30000});
 return {context,page};
}
const counters=page=>page.evaluate(key=>{const p=JSON.parse(localStorage.getItem(key));return {deployed:p.deployed,coins:p.coins,food:Number(document.querySelector('#food-count').textContent)};},SAVE);
/** Pause, open Settings (which saves), read the saved counters, then resume: the counters are settled, not mid-autosave. */
async function settled(page){
 await pauseField(page);await page.locator('#modal-layer [data-command=settings]').click();await page.locator('#modal-layer .preferences-dialog').waitFor();
 const value=await counters(page);await page.keyboard.press('Escape');await resumeField(page);return value;
}
const noFallback=async page=>assert.equal(await page.locator('body').getAttribute('data-review-fallback'),null,'production art loads without fallback');
const noSideways=async page=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal scroll');

/** Boot, the first battle by touch, and the paused field. */
async function captureOpening(browser,record,output){
 const {context,page}=await session(browser,record);
 try{
  await page.waitForSelector('#battlefield canvas',{state:'attached'});await noFallback(page);
  const paintedIconNames=['coin','gem','food','battle','evolution','cards','skills','shield','gear','quest','lock','freeze','meteor','heart','flag','trophy'];
  const decoded=await page.evaluate(async urls=>Promise.all(urls.map(url=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth===128&&image.naturalHeight===128);image.onerror=()=>resolve(false);image.src=url;}))),paintedIconNames.map(name=>`/art/storybook/interface/${name}.webp`));
  assert.ok(decoded.every(Boolean),'all 16 painted icons decode at their intended density');
  await page.screenshot({path:`${output}/01-entry-390.png`});
  await enterWorld(page);
  // The battlefield is laid out once the world is on screen; it renders at device density.
  const density=await page.locator('#battlefield canvas').evaluate(canvas=>({width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight}));
  assert.ok(density.width/density.cssWidth>=1.9&&density.width/density.cssWidth<=2.1,`canvas density: ${JSON.stringify(density)}`);
  const title=await page.locator('.stage h1').evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
  assert.ok(title<=22,`the battle title stays quiet at the top edge: ${title}px`);
  assert.match(await page.locator('#field-cue').innerText(),/Tap the waiting defender/,'the first battle teaches its first tap on the field');
  await page.locator('[data-field-recruit="0"]').tap();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).deployed===1,SAVE,{timeout:8000}).catch(()=>{});
  await page.screenshot({path:`${output}/02-combat-390.png`});
  await pauseField(page);await page.screenshot({path:`${output}/03-pause-390.png`});await resumeField(page);
  await page.waitForTimeout(6500);await page.screenshot({path:`${output}/04-skirmish-390.png`});
  await noSideways(page);await noFallback(page);
 }finally{await context.close();}
}

/** Click, touch and keyboard each deploy exactly once and spend only the troop's cost; pauses and dialogs isolate shortcuts. */
async function verifyTacticalInputs(browser,record){
 for(const method of ['click','touch','keyboard'])for(const kind of [0,1,2]){
  const {context,page}=await session(browser,record,{touch:method==='touch',profile:{foodLevel:20}});
  try{
   await enterWorld(page);await page.waitForTimeout(400);
   const troop=page.locator(`[data-field-recruit="${kind}"]`);
   await page.waitForFunction(kind=>document.querySelector(`[data-field-recruit="${kind}"]`)?.getAttribute('aria-disabled')==='false',kind,{timeout:20000});
   const before=await settled(page);
   if(method==='keyboard')await page.keyboard.press(String(kind+1));else if(method==='touch')await troop.tap();else await troop.click();
   // Pause through its own control (Space would press the still-focused recruit), then read the saved counters.
   const after=await settled(page);
   assert.equal(after.deployed,before.deployed+1,`${method} ${kind+1} deploys exactly once`);
  }finally{await context.close();}
 }
 const {context,page}=await session(browser,record);
 try{
  await enterWorld(page);await page.waitForTimeout(500);
  await pauseField(page);
  let paused=await counters(page);
  for(const key of ['1','2','3','q','w','e'])await page.keyboard.press(key);
  assert.deepEqual(await counters(page),paused,'the field pause isolates shortcuts');
  await page.locator('#modal-layer [data-command=settings]').click();
  paused=await counters(page);await page.keyboard.press('1');await page.keyboard.press('q');
  assert.deepEqual(await counters(page),paused,'settings isolates game controls');
  await page.keyboard.press('Escape');await resumeField(page);
  // This test document element exercises actual editable focus; no shipped hook.
  await page.evaluate(()=>{const input=document.createElement('input');input.id='review-editor';input.style.cssText='position:fixed;top:0;z-index:100';document.body.append(input);input.focus();});
  const editing=await counters(page);
  for(const key of ['1','2','3'])await page.keyboard.press(key);
  assert.equal((await counters(page)).deployed,editing.deployed,'editable focus isolates troop shortcuts');
 }finally{await context.close();}
}

/** Each era: Camp, the company portraits and the battlefield at 320 and 390px. */
async function captureChapters(browser,record,output){
 for(const [age,era] of ERAS.entries())for(const width of [320,390]){
  const {context,page}=await session(browser,record,{viewport:{width,height:width===320?640:844},profile:{age,enemyAge:age,furthestBattle:age,wins:age+1,deployed:5,played:true}});
  try{
   const prefix=`${output}/chapter-${age}-${era.name}-${width}`;
   await enterCamp(page);await page.waitForTimeout(400);await page.screenshot({path:`${prefix}-camp.png`});await noSideways(page);
   await openCampStation(page,'company');
   const portraits=await page.locator('#modal-layer .camp-recruit img').evaluateAll(images=>Promise.all(images.map(async img=>{await img.decode().catch(()=>{});return {src:img.getAttribute('src'),ready:img.complete&&img.naturalWidth>0};})));
   assert.deepEqual(portraits.map(p=>p.src),era.roles.map(role=>`${era.folder}/${role}-portrait.webp`),`${era.name} company portraits`);
   assert.ok(portraits.every(p=>p.ready),`${era.name} portraits decode`);
   await page.screenshot({path:`${prefix}-company.png`});
   await page.keyboard.press('Escape');await page.waitForTimeout(250);
   await page.locator('[data-command=camp-battle]').tap();
   await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running');
   for(const kind of ['0','1','2'])await page.locator(`[data-field-recruit="${kind}"]:not([hidden])`).tap({timeout:2000}).catch(()=>{});
   await page.waitForTimeout(2500);await page.screenshot({path:`${prefix}-battle.png`});
   assert.equal(await page.locator('#app').getAttribute('data-art-style'),'storybook');
   await noSideways(page);await noFallback(page);
  }finally{await context.close();}
 }
}

/** Evolution through Camp moves the army into the next era's art. */
async function captureEvolution(browser,record,output){
 const {context,page}=await session(browser,record,{profile:{coins:2500,played:true,wins:1}});
 try{
  await openEvolution(page);
  assert.equal(await page.locator('.era-landscape').nth(1).getAttribute('src'),'/art/storybook/olive/village.webp');
  await page.locator('[data-command="evolve"]').click();
  await page.getByRole('button',{name:'EVOLVE TO OLIVE TERRACES',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.game-shell').dataset.era==='1');
  assert.equal(await page.locator('#app').getAttribute('data-art-style'),'storybook');
  await page.screenshot({path:`${output}/05-evolution-olive-390.png`});
  await noFallback(page);
 }finally{await context.close();}
}

async function captureTraitFixtures(browser,record,output) {
 const fixtureServer=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(FIXTURE_PORT),'--strictPort'],{stdio:'pipe'});
 try{
  let ready=false;
  for(let attempt=0;attempt<60;attempt++){
   if(fixtureServer.exitCode!==null)throw new Error('Trait fixture server exited');
   try{ready=(await fetch(`${FIXTURE}/tests/fixtures/layering.html`)).ok;}catch{}
   if(ready)break;await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert.ok(ready,'trait fixture server starts');
  // Isolating each trait prevents the other two accents from masking a missing draw.
  for(const trait of ['guard','pierce','sweep']){
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
   const page=await context.newPage();page.on('pageerror',error=>record.errors.push(error.message));
   page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())record.assetFailures.push(`${response.status()} ${response.url()}`);});
   try{
    await page.goto(`${FIXTURE}/tests/fixtures/layering.html?age=3&health=100&lane=1&effects=none&traits=${trait}&width=390`,{waitUntil:'networkidle'});
    await page.waitForSelector('body[data-ready="true"]',{timeout:15000});
    const diagnostic=await page.evaluate(()=>window.layeringReview.inspect());
    assert.deepEqual(diagnostic.traits.map(c=>c.trait),[trait]);
    assert.ok(diagnostic.groundEffects[1].commandCount>8,`${trait} draws actual target-lane graphics`);
    assert.equal(diagnostic.sourceCues,trait==='sweep'?0:1);assert.equal(diagnostic.projectiles,trait==='sweep'?0:1);
    assert.equal(await page.locator('body').getAttribute('data-fallback'),null);
    await page.evaluate(()=>window.layeringReview.resumeEffects());
    await page.waitForFunction(()=>window.layeringReview.inspect().traits.length===0,{timeout:2000});
   }finally{await context.close();}
  }
  for(const [width,height] of [[320,640],[390,844]])for(const motion of ['system','reduced']){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,reducedMotion:motion==='reduced'?'reduce':'no-preference'});
   const page=await context.newPage();page.on('pageerror',error=>record.errors.push(error.message));
   page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())record.assetFailures.push(`${response.status()} ${response.url()}`);});
   try{
    await page.goto(`${FIXTURE}/tests/fixtures/layering.html?age=3&health=100&lane=1&effects=none&traits=all&motion=${motion}&width=${width}`,{waitUntil:'networkidle'});
    await page.waitForSelector('body[data-ready="true"]',{timeout:15000});
    const diagnostic=await page.evaluate(()=>window.layeringReview.inspect());
    assert.deepEqual(diagnostic.traits.map(c=>c.trait),['guard','pierce','sweep'],'all resolved accents reach real renderer');
    assert.equal(diagnostic.sourceCues,2,'secondary sweep never invents a second source attack');
    assert.equal(diagnostic.projectiles,motion==='reduced'?0:2,'sweep never creates a projectile; reduced motion creates none');
    assert.equal(diagnostic.reduced,motion==='reduced');assert.equal(diagnostic.state.time,0);
    assert.ok(diagnostic.groundEffects[1].commandCount>8,'trait accents actually paint their target lane');
    const first=diagnostic.traits.map(({x,y})=>({x,y}));
    await page.waitForTimeout(80);
    assert.deepEqual((await page.evaluate(()=>window.layeringReview.inspect())).traits.map(({x,y})=>({x,y})),first,'paused/static accents do not travel');
    assert.equal(await page.locator('body').getAttribute('data-fallback'),null);
    await page.screenshot({path:`${output}/36-trait-feedback-${motion}-${width}.png`});
    await page.evaluate(()=>window.layeringReview.resetEffects());
    await page.waitForFunction(()=>window.layeringReview.inspect().traits.length===0&&window.layeringReview.inspect().projectiles===0,{timeout:2000});
   }finally{await context.close();}
  }
 }finally{fixtureServer.kill('SIGTERM');}
}

const output='artifacts/browser-review';
mkdirSync(output,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{stdio:'pipe'});
let browser;
try{
 let ready=false;
 for(let i=0;i<60&&!ready;i++){
  if(server.exitCode!==null)throw new Error(`Vite preview exited ${server.exitCode}`);
  try{ready=(await fetch(ORIGIN)).ok;}catch{}
  if(!ready)await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert.ok(ready,'Vite preview did not start');
 browser=await launchChromium();
 const record={errors:[],assetFailures:[]};
 await captureOpening(browser,record,output);
 await verifyTacticalInputs(browser,record);
 await captureChapters(browser,record,output);
 await captureEvolution(browser,record,output);
 await captureTraitFixtures(browser,record,output);
 assert.deepEqual(record.errors,[],`browser errors: ${record.errors.join(' | ')}`);
 assert.deepEqual(record.assetFailures,[],'all storybook asset requests succeeded');
 console.log(`Browser review passed; screenshots in ${output}`);
}catch(error){process.exitCode=1;console.error(error);}
finally{try{await browser?.close();}finally{server.kill('SIGTERM');}}
