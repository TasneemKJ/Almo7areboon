/** Native browser acceptance for the current Home, Camp and physical battlefield.
 * Assertion migration (UX-CONTRACT sections Physical field / Physical Camp):
 * - BATTLE deck -> Home Play/Continue or Camp Battle, exactly one canonical start.
 * - card portraits/role/price geometry -> Camp company portraits and role details;
 *   native deployment costs and >=44px targets -> painted waiting recruits.
 * - ready/combat title shrink -> Home title vs compact world title, stable on Pause.
 * - wave chip/help -> current visible field cue + read-only wave HUD observation;
 *   no live countdown announcement (field announcement retains semantic guidance).
 * - hidden Cards navigation -> Home/Settings isolation and ready Camp isolation.
 * - freeze/meteor/food deck -> keyboard equivalents and selected enemy/supplies.
 * - all chapter/evolution artwork, density, no fallback, input costs, trait
 *   fixtures and reduced-motion invariants remain under real browser assertions.
 */
import {chromium} from 'playwright';
import {reviewPort,startReviewServer} from './review-server.mjs';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';

const troop=(page,kind)=>page.locator(`[data-field-recruit="${kind}"]`);
const pause=page=>page.getByRole('button',{name:'Pause',exact:true}).click();
const resume=page=>page.getByRole('button',{name:'Resume',exact:true}).click();
async function enterField(page){
 await page.getByRole('button',{name:/^(Play|Continue)$/,exact:true}).click();
 await page.locator('#battlefield canvas').waitFor({state:'visible'});
}
async function enterCamp(page){
 await page.getByRole('button',{name:'Camp',exact:true}).click();
 await page.locator('[data-camp-station="company"]').waitFor({state:'visible'});
}
async function company(page){await page.locator('[data-camp-station="company"]').click();}
async function campBattle(page){
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Battle',exact:true}).click();
 await page.locator('#battlefield canvas').waitFor({state:'visible'});
}
async function tacticalSession(browser,errors,assetFailures,overrides={},touch=false,clocked=false){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:touch,isMobile:touch});
 await context.addInitScript(seed=>{
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify(seed));
  document.addEventListener('visual-fallback',()=>{document.body.dataset.reviewFallback='true';});
 },{version:2,timeline:1,age:0,enemyAge:0,coins:0,cards:[],unlocked:[true,true,true],sound:false,deployed:0,...overrides});
 const page=await context.newPage();if(clocked)await page.clock.install();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await page.goto(reviewOrigin,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>!document.querySelector('.world-loader'),{timeout:15000});
 return {context,page};
}
async function publicCounters(page){
 return page.evaluate(()=>({deployed:JSON.parse(localStorage.getItem('almo7areboon.save.v1')).deployed,coins:JSON.parse(localStorage.getItem('almo7areboon.save.v1')).coins,unlocked:JSON.parse(localStorage.getItem('almo7areboon.save.v1')).unlocked,food:Number(document.querySelector('#food-count').textContent)}));
}
function assertTargetGeometry(geometry){
 assert.equal(geometry.overflow,false,'narrow physical UI cannot overflow');
 assert.ok(geometry.world.height>=200,'battlefield retains at least 200px');
 assert.ok(geometry.targets.length>0,'physical controls must actually be visible');
 for(const b of geometry.targets){
  assert.ok(b.width>=44&&b.height>=44,`${b.name} retains a 44px native hit target`);
  assert.ok(b.left>=0&&b.right<=geometry.width&&b.top>=0&&b.bottom<=geometry.height,`${b.name} stays in viewport: ${JSON.stringify({target:b,viewport:[geometry.width,geometry.height]})}`);
 }
}
async function resizeField(page,width,height){
 await page.setViewportSize({width,height});
 // Vite/Phaser and the DOM field controller update on animation frames after the
 // browser viewport changes. Wait for measured projection stability, not bounds.
 await page.evaluate(async ({width,height})=>{
  let previous='',stable=0;
  for(let frame=0;frame<60;frame++){
   await new Promise(resolve=>requestAnimationFrame(resolve));
   const world=document.querySelector('.world').getBoundingClientRect();
   const projection=JSON.stringify([world.toJSON(),...[...document.querySelectorAll('[data-field-recruit],.field-pause')].map(node=>node.getBoundingClientRect().toJSON())]);
   stable=innerWidth===width&&innerHeight===height&&projection===previous?stable+1:0;
   if(stable>=3)return;
   previous=projection;
  }
  throw new Error(`Field projection did not settle at ${width}x${height}`);
 },{width,height});
}
async function assertPhysicalLayout(page){
 const geometry=await page.evaluate(()=>{
  const rect=node=>{const b=node.getBoundingClientRect();return {name:node.getAttribute('aria-label'),left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};
  return {overflow:document.documentElement.scrollWidth>innerWidth,width:innerWidth,height:innerHeight,world:rect(document.querySelector('.world')),targets:[...document.querySelectorAll('[data-field-recruit],.field-pause')].filter(n=>!n.hidden&&n.getBoundingClientRect().width>0).map(rect)};
 });
 assertTargetGeometry(geometry);
 assert.equal(await page.locator('body').getAttribute('data-review-fallback'),null,'production art loads');
 assert.equal(await page.locator('#wave-label').getAttribute('aria-live'),null,'wave countdown is not a live region');
 assert.match(await page.locator('#field-announcement').getAttribute('aria-live'),/^polite$/);
}
async function readyTroop(page,kind){
 await page.waitForFunction(kind=>document.querySelector(`[data-field-recruit="${kind}"]`)?.getAttribute('aria-disabled')==='false',kind,{timeout:20000});
}
async function useFood(page){
 await page.locator('#field-supplies').click();
 await page.locator('#field-context [data-skill="food"]').click();
 assert.equal(await page.locator('#field-context').isVisible(),false,'spent support closes its physical context');
}
async function verifyTacticalInputs(browser,errors,assetFailures){
 for(const method of ['click','touch','keyboard'])for(const kind of [0,1,2]){
  console.log(`BROWSER_STAGE input-${method}-${kind}`);
  const {context,page}=await tacticalSession(browser,errors,assetFailures,{},method==='touch');
  try{
   await enterField(page);await page.keyboard.press('e');await readyTroop(page,kind);
   const before=await publicCounters(page);
   if(method==='keyboard')await page.keyboard.press(String(kind+1));
   else if(method==='touch')await troop(page,kind).tap();else await troop(page,kind).click();
   await pause(page);const after=await publicCounters(page);
   assert.equal(after.deployed,before.deployed+1,`${method} ${kind+1} deploys exactly once`);
   assert.ok(Math.abs((before.food-after.food)-[3,5,7][kind])<=1,`${method} ${kind+1} spends only its cost`);
   assert.deepEqual(after.unlocked,[true,true,true]);
  }finally{await context.close();}
 }
 const locked=await tacticalSession(browser,errors,assetFailures,{unlocked:[true,false,false]},true);
 try{
  const page=locked.page;let before=await publicCounters(page);
  await page.keyboard.press('1');assert.deepEqual(await publicCounters(page),before,'Home keyboard deployment is ignored');
  await enterField(page);const box=await troop(page,0).boundingBox();await pause(page);before=await publicCounters(page);
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  for(const kind of [0,1,2])await page.keyboard.press(String(kind+1));
  assert.deepEqual(await publicCounters(page),before,'paused touch and keyboard never spend');
  await resume(page);before=await publicCounters(page);await page.keyboard.press('2');await page.keyboard.press('3');
  const after=await publicCounters(page);assert.equal(after.deployed,before.deployed);assert.equal(after.coins,before.coins);assert.deepEqual(after.unlocked,[true,false,false]);
  assert.equal(await troop(page,1).isVisible(),false,'locked physical recruits do not offer deployment');
  assert.equal(await troop(page,2).isVisible(),false);
 }finally{await locked.context.close();}
 const {context,page}=await tacticalSession(browser,errors,assetFailures,{},false,true);
 try{
  await enterField(page);await page.clock.pauseAt(new Date(Date.now()+100));const unavailable=await publicCounters(page);
  assert.equal(await troop(page,2).getAttribute('aria-disabled'),'true','heavy starts unaffordable');
  await page.keyboard.press('3');const disabledBox=await troop(page,2).boundingBox();await page.mouse.click(disabledBox.x+disabledBox.width/2,disabledBox.y+disabledBox.height/2);
  assert.equal((await publicCounters(page)).deployed,unavailable.deployed,'unaffordable keyboard and pointer never deploy');
  assert.equal((await publicCounters(page)).food,unavailable.food,'unaffordable actions never spend food with simulation time stopped');await page.clock.resume();
  await page.keyboard.press('e');const before=await publicCounters(page);
  await page.keyboard.down('1');await readyTroop(page,0);await page.keyboard.down('1');await page.keyboard.up('1');
  assert.equal((await publicCounters(page)).deployed,before.deployed+1,'native repeated keydown never double deploys');
  await pause(page);const paused=await publicCounters(page);await page.keyboard.press('1');assert.deepEqual(await publicCounters(page),paused,'manual pause isolates shortcuts');await resume(page);
  await page.evaluate(()=>{const input=document.createElement('input');input.id='review-editor';input.style.cssText='position:fixed;top:0;z-index:100';document.body.append(input);input.focus();});
  const editing=await publicCounters(page);await page.keyboard.press('1');await page.keyboard.press('2');await page.keyboard.press('3');await page.keyboard.press('q');
  assert.equal((await publicCounters(page)).deployed,editing.deployed,'editable focus isolates troop shortcuts');
  assert.equal(await page.locator('.battle-skills [data-skill="freeze"]').isDisabled(),false,'editable focus isolates skills');
  await page.locator('#review-editor').evaluate(node=>node.remove());
  await pause(page);await page.getByRole('button',{name:'Settings',exact:true}).click();const modal=await publicCounters(page);
  await page.keyboard.press('1');await page.keyboard.press('q');assert.deepEqual(await publicCounters(page),modal,'settings modal isolates controls');
  await page.getByRole('button',{name:'Done',exact:true}).click();await resume(page);
  await pause(page);await page.getByRole('button',{name:'Home',exact:true}).click();const home=await publicCounters(page);
  await page.keyboard.press('1');await page.keyboard.press('q');assert.deepEqual(await publicCounters(page),home,'Home isolates controls');await enterField(page);
  await page.keyboard.press('q');assert.equal(await page.locator('.battle-skills [data-skill="freeze"]').isDisabled(),true,'Q casts freeze');
  await page.waitForFunction(()=>!document.querySelector('.battle-skills [data-skill="meteor"]').disabled,{timeout:8000});
  await page.keyboard.press('w');assert.equal(await page.locator('.battle-skills [data-skill="meteor"]').isDisabled(),true,'W casts meteor');
  assert.equal(await page.locator('.battle-skills [data-skill="food"]').isDisabled(),true,'E casts food once');
  const spent=await publicCounters(page);await page.keyboard.press('e');assert.equal((await publicCounters(page)).deployed,spent.deployed,'used skill never deploys');
 }finally{await context.close();}
}
async function captureTacticalWaves(browser,errors,assetFailures,output){
 const {context,page}=await tacticalSession(browser,errors,assetFailures,{speed:2});
 try{
  await enterField(page);assert.equal(await page.locator('#field-cue').textContent(),'Tap the waiting defender. 3 food.');
  for(const [prefix,pattern] of [['33-first-fires-opening',/^RUSH/],['34-incoming-volley',/^VOLLEY/],['35-incoming-bulwark',/^BULWARK/]]){
   await page.waitForFunction(source=>new RegExp(source).test(document.querySelector('#wave-label').textContent),pattern.source,{timeout:25000});
   for(const [width,height] of [[320,640],[390,844]]){await resizeField(page,width,height);await assertPhysicalLayout(page);await page.screenshot({path:`${output}/${prefix}-${width}.png`});}
  }
 }finally{await context.close();}
}
async function captureTraitFixtures(browser,errors,assetFailures,output) {
 const fixtureServer=await startReviewServer({port:reviewPort(process.env.ALMO_FIXTURE_PORT,4175),preview:false,readyPath:'/tests/fixtures/layering.html'});
 try{
  // Isolating each trait prevents the other two accents from masking a missing draw.
  for(const trait of ['guard','pierce','sweep']){
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
   try{
    await page.goto(`${fixtureServer.origin}/tests/fixtures/layering.html?age=3&health=100&lane=1&effects=none&traits=${trait}&width=390`,{waitUntil:'networkidle'});
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
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
   try{
    await page.goto(`${fixtureServer.origin}/tests/fixtures/layering.html?age=3&health=100&lane=1&effects=none&traits=all&motion=${motion}&width=${width}`,{waitUntil:'networkidle'});
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
 }finally{await fixtureServer.close();}
}

async function assertReadableCompany(page){
 const words=await page.evaluate(()=>{
  const words=[];
  for(const element of document.querySelectorAll('.camp-recruit span,.camp-focus p')){
   if(!element.getClientRects().length)continue;
   const bounds=element.getBoundingClientRect(),walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
   for(let node=walker.nextNode();node;node=walker.nextNode())for(const match of node.textContent.matchAll(/[A-Za-z]+/g)){
    const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);const box=range.getBoundingClientRect();
    words.push({text:match[0],fragments:range.getClientRects().length,left:box.left,right:box.right,containerLeft:bounds.left,containerRight:bounds.right});
   }
  }
  return words;
 });
 assert.ok(words.length>0,'visible Company copy is measured');
 for(const word of words){assert.equal(word.fragments,1,`${word.text} remains a whole word`);assert.ok(word.left>=word.containerLeft-1&&word.right<=word.containerRight+1,`${word.text} stays inside its label`);}
}
function assertPortraitIdentity(portraits,age){
 const chapters=[['',['pathkeeper','thrower','rider']],['olive',['fieldhand','slinger','harvester']],['harbor',['quay-guard','archer','quay-rider']],['lantern',['gatekeeper','musketeer','cannon']],['hillside',['sentinel','scout','tank']],['courtyards',['light-guard','trooper','sky-skimmer']]];
 const [folder,roles]=chapters[age];
 assert.deepEqual(portraits.map(p=>p.src),roles.map(role=>`/art/storybook/${folder?folder+'/':''}${role}-portrait.webp`),'chapter portraits preserve exact role identity and ordering');
 assert.ok(portraits.every(p=>p.ready),'all three chapter portraits decode');
}
async function assertCompany(page,age){
 await company(page);
 const portraits=await page.locator('.camp-recruit img').evaluateAll(async images=>Promise.all(images.map(async img=>{await img.decode();return {src:img.getAttribute('src'),ready:img.complete&&img.naturalWidth>0};})));
 assertPortraitIdentity(portraits,age);
 for(const [width,height] of [[390,844],[320,640]]){
  await page.setViewportSize({width,height});
  const geometry=await page.locator('.camp-recruit').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect(),img=node.querySelector('img').getBoundingClientRect(),label=node.querySelector('span').getBoundingClientRect();return {left:b.left,right:b.right,width:b.width,height:b.height,image:img.bottom,label:label.top};}));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  for(const b of geometry){assert.ok(b.width>=44&&b.height>=44);assert.ok(b.left>=0&&b.right<=width+1);assert.ok(b.image<=b.label+1,'portrait clears troop name');}
  await assertReadableCompany(page);await page.screenshot({path:`${output}/chapter-${age}-company-${width}.png`});
 }
 for(const [kind,role] of [[0,'Melee · Guard'],[1,'Ranged · Pierce'],[2,'Heavy · Sweep']]){
  await page.locator(`[data-camp-recruit="${kind}"]`).click();
  assert.ok((await page.locator('.camp-focus').textContent()).includes(role),'Camp preserves role and specialty explanation');await assertReadableCompany(page);
  assert.match(await page.locator('.camp-focus').textContent(),new RegExp(`Deployment in battle costs ${[3,5,age===0?7:9][kind]} food`));
  const before=await publicCounters(page);await page.keyboard.press(String(kind+1));await page.keyboard.press('q');assert.deepEqual(await publicCounters(page),before,'Camp focus never deploys or spends');
  await page.getByRole('button',{name:'Back',exact:true}).click();
 }
 await page.setViewportSize({width:390,height:844});
}
const output='artifacts/browser-review';
mkdirSync(output,{recursive:true});
const server=await startReviewServer({port:reviewPort(process.env.ALMO_REVIEW_PORT,4173)}),reviewOrigin=`${server.origin}/`;
let browser;
try {
 browser=await chromium.launch({...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),headless:true});
 const errors=[],assetFailures=[];
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await page.addInitScript(()=>document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;}));
 await page.goto(reviewOrigin,{waitUntil:'networkidle'});
 const homeTitleSize=await page.locator('#entry-title').evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
 await page.screenshot({path:`${output}/01-home-390.png`});
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await page.waitForSelector('#battlefield canvas');
 await page.waitForFunction(()=>!document.querySelector('.world-loader'));
 assert.equal(await page.evaluate(()=>window.__visualFallback),undefined,'art loads without renderer fallback');
 const paintedIconNames=['coin','gem','food','battle','evolution','cards','skills','shield','gear','quest','lock','freeze','meteor','heart','flag','trophy'];
 const decodedIcons=await page.evaluate(async urls=>Promise.all(urls.map(url=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth===128&&image.naturalHeight===128);image.onerror=()=>resolve(false);image.src=url;}))),paintedIconNames.map(name=>`/art/storybook/interface/${name}.webp`));
 assert.ok(decodedIcons.every(Boolean),'all 16 authored icons decode at intended density');
 const density=await page.locator('#battlefield canvas').evaluate(canvas=>({width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight}));
 assert.ok(density.width/density.cssWidth>=1.9&&density.width/density.cssWidth<=2.1,`canvas density: ${JSON.stringify(density)}`);
 assert.ok(density.height/density.cssHeight>=1.9&&density.height/density.cssHeight<=2.1);
 const activeTitleSize=await page.locator('.stage h1').evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
 assert.ok(activeTitleSize<homeTitleSize,'compact battlefield heading recedes from Home title');
 assert.equal(await page.locator('.battle-select').evaluate(node=>getComputedStyle(node).display),'none');
 await readyTroop(page,0);await troop(page,0).click();await page.screenshot({path:`${output}/02-combat-390.png`});
 await pause(page);assert.equal(await page.locator('.stage h1').evaluate(node=>parseFloat(getComputedStyle(node).fontSize)),activeTitleSize,'Pause retains compact battlefield title');
 await page.getByRole('heading',{name:'A moment by the fire',exact:true}).waitFor();
 assert.equal(await page.locator('#modal-layer button:visible').count(),3,'Pause has exactly Resume, Settings, Home');
 await page.screenshot({path:`${output}/03-pause-390.png`});await resume(page);await useFood(page);await readyTroop(page,0);await troop(page,0).click();
 await page.waitForTimeout(6500);await page.screenshot({path:`${output}/05-skirmish-390.png`});
 for(const [width,height] of [[320,640],[390,844]]){await resizeField(page,width,height);await assertPhysicalLayout(page);await page.screenshot({path:`${output}/04-physical-${width}.png`});}
 await context.close();
 const chapters=[['',['Pathkeeper','Thrower','Dino Rider']],['olive',['Fieldhand','Slinger','Harvester']],['harbor',['Quay Guard','Archer','Rider']],['lantern',['Gatekeeper','Musketeer','Cannon']],['hillside',['Sentinel','Scout','Tank']],['courtyards',['Light Guard','Trooper','Sky Skimmer']]];
 for(const [age,[,names]] of chapters.entries()){
  console.log(`BROWSER_STAGE chapter-${age}`);
  const {context,page}=await tacticalSession(browser,errors,assetFailures,{age,enemyAge:age,furthestBattle:age,deployed:1});
  try{
   await enterCamp(page);await assertCompany(page,age);await campBattle(page);
   await readyTroop(page,0);await troop(page,0).click();await useFood(page);
   for(const kind of [1,2]){await readyTroop(page,kind);assert.match(await troop(page,kind).getAttribute('aria-label'),new RegExp(names[kind]));await troop(page,kind).click();}
   await page.waitForTimeout(8000);await page.screenshot({path:`${output}/chapter-${age}-all-roles.png`});
   await page.waitForTimeout(20000);await page.screenshot({path:`${output}/chapter-${age}-later-battle.png`});
   assert.equal(await page.locator('body').getAttribute('data-review-fallback'),null);assert.equal(await page.locator('#app').getAttribute('data-art-style'),'storybook');
  }finally{await context.close();}
 }
 for(const [age,coins] of [[0,2500],[1,20000],[2,170000],[3,1300000],[4,13000000]]){
  console.log(`BROWSER_STAGE evolution-${age+1}`);
  const {context,page}=await tacticalSession(browser,errors,assetFailures,{age,enemyAge:age,furthestBattle:age,coins,deployed:1});
  try{
   await enterCamp(page);await company(page);await page.getByRole('button',{name:'Evolution',exact:true}).click();
   assert.equal(await page.locator('.era-landscape').nth(age+1).getAttribute('src'),`/art/storybook/${chapters[age+1][0]}/village.webp`);
   await page.locator('[data-command="evolve"]').click();await page.locator('[data-command="confirm-evolve"]').click();
   await page.waitForFunction(age=>document.querySelector('.game-shell').dataset.era===String(age),age+1);
   assert.equal(await page.locator('#app').getAttribute('data-art-style'),'storybook');
   // Evolution retains ready Camp; inspect the new company through its real station.
   await page.locator('[data-camp-station="company"]').click();
   assert.match(await page.locator('[data-camp-recruit="0"]').getAttribute('aria-label'),new RegExp(chapters[age+1][1][0]));
   await page.screenshot({path:`${output}/evolution-${age+1}-mixed-chapters.png`});assert.equal(await page.locator('body').getAttribute('data-review-fallback'),null);
  }finally{await context.close();}
 }
 await verifyTacticalInputs(browser,errors,assetFailures);
 console.log('BROWSER_STAGE waves');await captureTacticalWaves(browser,errors,assetFailures,output);
 console.log('BROWSER_STAGE traits');await captureTraitFixtures(browser,errors,assetFailures,output);
 assert.deepEqual(errors,[],`browser errors: ${errors.join('; ')}`);assert.deepEqual(assetFailures,[],'all storybook asset requests succeeded');
 console.log(JSON.stringify({density,chapters:6,evolutions:5,tacticalInputSessions:11,errors,assetFailures},null,2));
} finally {await browser?.close();await server.close();}
