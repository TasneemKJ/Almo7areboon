/** Real browser screenshots and geometry checks for the portrait battle UI. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';


// Public save counters and visible food are the production observation seam.
async function tacticalSession(browser, errors, assetFailures, overrides={}, touch=false) {
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:touch});
 await context.addInitScript(seed=>{
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify(seed));
  document.addEventListener('visual-fallback',()=>{document.body.dataset.reviewFallback='true';});
 },{version:2,timeline:1,age:0,enemyAge:0,coins:0,cards:[],unlocked:[true,true,true],sound:false,deployed:0,...overrides});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>!document.querySelector('.world-loader'),{timeout:15000});
 return {context,page};
}
async function publicCounters(page) {
 return page.evaluate(()=>({
  deployed:JSON.parse(localStorage.getItem('almo7areboon.save.v1')).deployed,
  coins:JSON.parse(localStorage.getItem('almo7areboon.save.v1')).coins,
  unlocked:JSON.parse(localStorage.getItem('almo7areboon.save.v1')).unlocked,
  food:Number(document.querySelector('#food-count').textContent),
 }));
}
async function assertTacticalLayout(page) {
 const geometry=await page.evaluate(()=>{
  const rect=node=>{const b=node.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};
  const words=[];
  for(const element of document.querySelectorAll('.upgrade-label>div,.unit-role')){
   const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
   for(let node=walker.nextNode();node;node=walker.nextNode()){
    if(!node.parentElement.getClientRects().length)continue;
    for(const match of node.textContent.matchAll(/[A-Za-z]+/g)){
     const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
     words.push({text:match[0],fragments:range.getClientRects().length,rect:rect({getBoundingClientRect:()=>range.getBoundingClientRect()}),container:rect(element)});
    }
   }
  }
  return {overflow:document.documentElement.scrollWidth>innerWidth,world:rect(document.querySelector('.world')),wave:rect(document.querySelector('#wave-label')),buttons:[...document.querySelectorAll('.unit-card')].map(rect),controls:[...document.querySelectorAll('[data-skill],#pause,#speed')].map(rect),words,roles:[...document.querySelectorAll('.unit-role')].map(n=>n.textContent)};
 });
 assert.equal(geometry.overflow,false,'narrow tactical UI cannot overflow');
 assert.ok(geometry.world.height>=200,'the battlefield retains visible space');
 assert.deepEqual(geometry.roles,['Melee · Guard','Ranged · Pierce','Heavy · Sweep']);
 for(const button of geometry.buttons)assert.ok(button.width>=44&&button.height>=44,'troop hit targets remain at least 44px');
 for(const word of geometry.words){
  assert.equal(word.fragments,1,`${word.text} must remain a whole word`);
  assert.ok(word.rect.left>=word.container.left-1&&word.rect.right<=word.container.right+1,`${word.text} stays inside its label`);
 }
 const wave=geometry.wave,world=geometry.world;
 assert.ok(wave.left>=world.left&&wave.right<=world.right&&wave.top>=world.top&&wave.bottom<=world.bottom,'wave chip stays in the world');
 for(const control of geometry.controls)assert.ok(wave.right<=control.left||wave.left>=control.right||wave.bottom<=control.top||wave.top>=control.bottom,'wave chip clears skills and pause');
 assert.equal(await page.getByRole('button',{name:/^Inspect wave\./}).count(),1,'wave inspection exposes one named native button');
 assert.equal(await page.locator('#wave-label').getAttribute('aria-live'),null,'countdown is not a live region');
 assert.match(await page.locator('#wave-label').getAttribute('aria-label'),/wave|Waves|enemies/i);
 assert.equal(await page.locator('body').getAttribute('data-review-fallback'),null,'production art loads');
}
async function verifyTacticalInputs(browser,errors,assetFailures) {
 for(const method of ['click','touch','keyboard'])for(const kind of [0,1,2]){
  const {context,page}=await tacticalSession(browser,errors,assetFailures,{},method==='touch');
  try{
   await page.getByRole('button',{name:/^BATTLE/}).click();
   await page.keyboard.press('e');
   const before=await publicCounters(page);
   const troop=page.locator(`[data-unit="${kind}"]`);
   if(method==='keyboard')await page.keyboard.press(String(kind+1));
   else if(method==='touch')await troop.tap();
   else await troop.click();
   await page.getByRole('button',{name:'Pause battle',exact:true}).click();
   const after=await publicCounters(page);
   assert.equal(after.deployed,before.deployed+1,`${method} ${kind+1} deploys exactly once`);
   assert.ok(Math.abs((before.food-after.food)-[3,5,7][kind])<=1,`${method} ${kind+1} spends only its cost`);
   assert.deepEqual(after.unlocked,[true,true,true]);
  }finally{await context.close();}
 }
 // Ready, unaffordable locked and paused controls cannot deploy or spend.
 const locked=await tacticalSession(browser,errors,assetFailures,{unlocked:[true,false,false]},true);
 try{
  let before=await publicCounters(locked.page);
  await locked.page.keyboard.press('1');
  assert.deepEqual(await publicCounters(locked.page),before,'ready keyboard deployment is ignored');
  await locked.page.getByRole('button',{name:/^BATTLE/}).click();
  await locked.page.getByRole('button',{name:'Pause battle',exact:true}).click();
  before=await publicCounters(locked.page);
  for(const kind of [0,1,2]){
   const rect=await locked.page.locator(`[data-unit="${kind}"]`).boundingBox();
   await locked.page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
   await locked.page.keyboard.press(String(kind+1));
  }
  assert.deepEqual(await publicCounters(locked.page),before,'locked/paused touch and keyboard never spend');
  await locked.page.getByRole('button',{name:'Resume battle',exact:true}).click();
  before=await publicCounters(locked.page);
  await locked.page.keyboard.press('2');await locked.page.keyboard.press('3');
  const after=await publicCounters(locked.page);
  assert.equal(after.deployed,before.deployed);assert.equal(after.coins,before.coins);assert.deepEqual(after.unlocked,[true,false,false]);
 }finally{await locked.context.close();}
 const isolated=await tacticalSession(browser,errors,assetFailures);
 const page=isolated.page;
 try{
  await page.getByRole('button',{name:/^BATTLE/}).click();
  const unavailable=await publicCounters(page);
  assert.equal(await page.locator('[data-unit="2"]').isDisabled(),true,'heavy starts unaffordable');
  await page.keyboard.press('3');
  const disabledBox=await page.locator('[data-unit="2"]').boundingBox();
  await page.mouse.click(disabledBox.x+disabledBox.width/2,disabledBox.y+disabledBox.height/2);
  assert.equal((await publicCounters(page)).deployed,unavailable.deployed,'unaffordable keyboard and pointer never deploy');
  assert.equal((await publicCounters(page)).food,unavailable.food,'unaffordable actions never spend food');
  await page.keyboard.press('e');
  const before=await publicCounters(page);
  await page.keyboard.down('1');
  // Wait until a second deployment could succeed, so body spacing cannot hide a repeat bug.
  await page.waitForFunction(()=>!document.querySelector('[data-unit="0"]').disabled,{timeout:5000});
  await page.keyboard.down('1');await page.keyboard.up('1');
  assert.equal((await publicCounters(page)).deployed,before.deployed+1,'native repeated keydown never double deploys');
  await page.getByRole('button',{name:'Pause battle',exact:true}).click();
  const paused=await publicCounters(page);
  await page.keyboard.press('1');assert.deepEqual(await publicCounters(page),paused,'manual pause isolates shortcuts');
  await page.getByRole('button',{name:'Resume battle',exact:true}).click();
  // This test document element exercises actual editable focus; no shipped hook.
  await page.evaluate(()=>{const input=document.createElement('input');input.id='review-editor';input.style.cssText='position:fixed;top:0;z-index:100';document.body.append(input);input.focus();});
  const editing=await publicCounters(page);
  await page.keyboard.press('1');await page.keyboard.press('2');await page.keyboard.press('3');await page.keyboard.press('q');
  assert.equal((await publicCounters(page)).deployed,editing.deployed,'editable focus isolates troop shortcuts');
  assert.equal(await page.locator('[data-skill="freeze"]').isDisabled(),false,'editable focus isolates skills');
  await page.locator('#review-editor').evaluate(node=>node.remove());
  await page.getByRole('button',{name:'Cards',exact:true}).click();
  const menu=await publicCounters(page);
  await page.keyboard.press('1');await page.keyboard.press('q');assert.deepEqual(await publicCounters(page),menu,'secondary screen isolates game controls');
  await page.getByRole('button',{name:'Battle',exact:true}).click();
  await page.locator('[data-command="settings"]').click();
  const modal=await publicCounters(page);
  await page.keyboard.press('1');await page.keyboard.press('q');assert.deepEqual(await publicCounters(page),modal,'settings modal isolates game controls');
  await page.keyboard.press('Escape');
  await page.keyboard.press('q');assert.equal(await page.locator('[data-skill="freeze"]').isDisabled(),true,'Q still casts freeze');
  await page.waitForFunction(()=>!document.querySelector('[data-skill="meteor"]').disabled,{timeout:8000});
  await page.keyboard.press('w');assert.equal(await page.locator('[data-skill="meteor"]').isDisabled(),true,'W still casts meteor');
  assert.equal(await page.locator('[data-skill="food"]').isDisabled(),true,'E still casts food once');
  const spent=await publicCounters(page);
  await page.keyboard.press('e');assert.equal((await publicCounters(page)).deployed,spent.deployed,'used skill never deploys');
 }finally{await isolated.context.close();}
}
async function captureTacticalWaves(browser,errors,assetFailures,output) {
 const {context,page}=await tacticalSession(browser,errors,assetFailures,{speed:2});
 try{
  await page.getByRole('button',{name:/^BATTLE/}).click();
  assert.equal(await page.locator('#deploy-hint').textContent(),'Deploy a defender before ranged troops; defenders protect them.');
  for(const [prefix,pattern] of [['33-first-fires-opening',/^RUSH/],['34-incoming-volley',/^VOLLEY/],['35-incoming-bulwark',/^BULWARK/]]){
   await page.waitForFunction(source=>new RegExp(source).test(document.querySelector('#wave-label').textContent),pattern.source,{timeout:25000});
   for(const [width,height] of [[320,640],[390,844]]){
    await page.setViewportSize({width,height});await assertTacticalLayout(page);
    await page.screenshot({path:`${output}/${prefix}-${width}.png`});
   }
  }
 }finally{await context.close();}
}
async function captureTraitFixtures(browser,errors,assetFailures,output) {
 const fixtureServer=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4175','--strictPort'],{stdio:'pipe'});
 try{
  let ready=false;
  for(let attempt=0;attempt<60;attempt++){
   if(fixtureServer.exitCode!==null)throw new Error('Trait fixture server exited');
   try{ready=(await fetch('http://127.0.0.1:4175/tests/fixtures/layering.html')).ok;}catch{}
   if(ready)break;await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert.ok(ready,'trait fixture server starts');
  // Isolating each trait prevents the other two accents from masking a missing draw.
  for(const trait of ['guard','pierce','sweep']){
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
   try{
    await page.goto(`http://127.0.0.1:4175/tests/fixtures/layering.html?age=3&health=100&lane=1&effects=none&traits=${trait}&width=390`,{waitUntil:'networkidle'});
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
    await page.goto(`http://127.0.0.1:4175/tests/fixtures/layering.html?age=3&health=100&lane=1&effects=none&traits=all&motion=${motion}&width=${width}`,{waitUntil:'networkidle'});
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
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173'],{stdio:'pipe'});
let browser;
try {
 let ready=false;
 for(let i=0;i<60;i++){
  if(server.exitCode!==null)throw new Error(`Vite preview exited ${server.exitCode}`);
  try {const response=await fetch('http://127.0.0.1:4173/');if(response.ok){ready=true;break;}} catch {}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert.ok(ready,'Vite preview did not start');
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 const page=await context.newPage(),errors=[],assetFailures=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await page.addInitScript(()=>document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;}));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForSelector('#battlefield canvas');
 await page.waitForFunction(()=>!document.querySelector('.world-loader'));
 assert.equal(await page.evaluate(()=>window.__visualFallback),undefined,'art must load without renderer fallback');
 const interfaceImages=await page.locator('svg.icon image').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
 assert.ok(interfaceImages.length>=10,'painted icons are present in the initial HUD');
 const paintedIconNames=['coin','gem','food','battle','evolution','cards','skills','shield','gear','quest','lock','freeze','meteor','heart','flag','trophy'];
 const allInterfaceImages=paintedIconNames.map(name=>`/art/storybook/interface/${name}.webp`);
 const decodedIcons=await page.evaluate(async urls=>Promise.all([...new Set(urls)].map(url=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>resolve(image.naturalWidth===128&&image.naturalHeight===128);image.onerror=()=>resolve(false);image.src=url;
 }))),[...interfaceImages,...allInterfaceImages]);
 assert.ok(decodedIcons.every(Boolean),'all 16 painted icons decode at their intended density, including result and progression icons');
 const portraits=await page.locator('.unit-card img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),ready:img.complete&&img.naturalWidth>0})));
 assert.ok(portraits.every(p=>p.ready&&p.src.includes('/art/storybook/')),'all opening portraits use loaded storybook art');
 const density=await page.locator('#battlefield canvas').evaluate(canvas=>({width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight}));
 assert.ok(density.width/density.cssWidth>=1.9&&density.width/density.cssWidth<=2.1,`canvas density: ${JSON.stringify(density)}`);
 assert.ok(density.height/density.cssHeight>=1.9&&density.height/density.cssHeight<=2.1,`canvas height density: ${JSON.stringify(density)}`);
 const portraitBounds=await page.locator('.unit-card').first().evaluate(card=>({image:card.querySelector('img').getBoundingClientRect().bottom,price:card.querySelector('.unit-price').getBoundingClientRect().top}));
 assert.ok(portraitBounds.image<=portraitBounds.price+1,`portrait clipped by price bar: ${JSON.stringify(portraitBounds)}`);
 await page.screenshot({path:`${output}/01-ready-390.png`});
 const readyTitleSize=await page.locator('.stage h1').evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
 await page.getByRole('button',{name:/^BATTLE/}).click();
 const activeTitleSize=await page.locator('.stage h1').evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
 assert.ok(activeTitleSize<readyTitleSize*.7,`combat heading should recede: ${readyTitleSize} → ${activeTitleSize}`);
 assert.equal(await page.locator('.battle-select').evaluate(node=>getComputedStyle(node).display),'none');
 await page.getByRole('button',{name:/Deploy Pathkeeper/}).click();
 await page.screenshot({path:`${output}/02-combat-390.png`});
  await page.getByRole('button',{name:'Pause battle',exact:true}).click();
 const pausedTitleSize=await page.locator('.stage h1').evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
 assert.ok(pausedTitleSize<readyTitleSize*.7,`pause heading should remain compact: ${readyTitleSize} → ${pausedTitleSize}`);
 assert.equal(await page.locator('.battle-select').evaluate(node=>getComputedStyle(node).display),'none');
 await page.getByText('PAUSED',{exact:true}).waitFor();
 await page.screenshot({path:`${output}/03-pause-390.png`});
 await page.getByRole('button',{name:'Resume battle',exact:true}).click();
 await page.getByRole('button',{name:/Food drop/i}).click();
 await page.getByRole('button',{name:/Deploy Pathkeeper/}).click();
 await page.waitForTimeout(6500);
 await page.screenshot({path:`${output}/05-skirmish-390.png`});
 await context.close();

 const narrow=await browser.newContext({viewport:{width:320,height:640},deviceScaleFactor:2});
 const small=await narrow.newPage();
 small.on('pageerror',error=>errors.push(error.message));
 await small.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await small.waitForFunction(()=>!document.querySelector('.world-loader'));
 const layout=await small.evaluate(()=>{
  const shell=document.querySelector('.game-shell').getBoundingClientRect();
  return [...document.querySelectorAll('.upgrade-row,.buy-button,.unit-card,.nav-item')].map(el=>{
   const rect=el.getBoundingClientRect();return {className:el.className,left:rect.left,right:rect.right,shellLeft:shell.left,shellRight:shell.right};
  });
 });
 for(const item of layout)assert.ok(item.left>=item.shellLeft-1&&item.right<=item.shellRight+1,`narrow overflow: ${JSON.stringify(item)}`);
 const narrowPortrait=await small.locator('.unit-card').first().evaluate(card=>({image:card.querySelector('img').getBoundingClientRect().bottom,price:card.querySelector('.unit-price').getBoundingClientRect().top}));
 assert.ok(narrowPortrait.image<=narrowPortrait.price+1,`narrow portrait clipped: ${JSON.stringify(narrowPortrait)}`);
 await small.screenshot({path:`${output}/04-ready-320.png`});
 await narrow.close();
 // Isolated visual fixture: all three roles unlocked, normal combat actions thereafter.
 const showcase=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await showcase.addInitScript(()=>localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:0,enemyAge:0,coins:0,cards:[],unlocked:[true,true,true],sound:false})));
 const army=await showcase.newPage();army.on('pageerror',error=>errors.push(error.message));
 await army.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await army.waitForFunction(()=>!document.querySelector('.world-loader'));
 await army.getByRole('button',{name:/^BATTLE/}).click();
 await army.getByRole('button',{name:/Food drop/i}).click();
 for(const name of ['Pathkeeper','Thrower','Dino Rider'])await army.getByRole('button',{name:new RegExp(`Deploy ${name}`)}).click();
 await army.waitForTimeout(8000);
 await army.screenshot({path:`${output}/06-all-roles-fixture-390.png`});
 await army.waitForTimeout(20000);
 await army.screenshot({path:`${output}/07-clash-fixture-390.png`});
 await showcase.close();
 // Save fixtures expose later chapters; transitions and deployment still use real UI actions.
 const chapter=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await chapter.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:0,enemyAge:0,coins:2500,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const journey=await chapter.newPage();journey.on('pageerror',error=>errors.push(error.message));
 journey.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await journey.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await journey.waitForFunction(()=>!document.querySelector('.world-loader'));
 await journey.getByRole('button',{name:'Evolution',exact:true}).click();
 assert.ok(await journey.locator('.era-landscape').nth(1).getAttribute('src')==='/art/storybook/olive/village.webp');
 await journey.locator('[data-command="evolve"]').click();
 await journey.getByRole('button',{name:'EVOLVE TO OLIVE TERRACES',exact:true}).click();
 await journey.waitForFunction(()=>document.querySelector('.game-shell').dataset.era==='1');
 assert.equal(await journey.locator('#app').getAttribute('data-art-style'),'storybook');
 await journey.getByRole('button',{name:/Deploy Fieldhand/}).waitFor();
 await journey.screenshot({path:`${output}/08-evolution-mixed-chapters-390.png`});
 assert.equal(await journey.evaluate(()=>window.__visualFallback),undefined);
 await chapter.close();
 const olive=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await olive.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:1,enemyAge:1,furthestBattle:1,coins:0,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const farm=await olive.newPage();farm.on('pageerror',error=>errors.push(error.message));
 farm.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await farm.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await farm.waitForFunction(()=>!document.querySelector('.world-loader'));
 const farmPortraits=await farm.locator('.unit-card img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),ready:img.complete&&img.naturalWidth>0})));
 assert.equal(farmPortraits.length,3);
 assert.ok(farmPortraits.every(p=>p.ready&&p.src.includes('/art/storybook/olive/')));
 await farm.screenshot({path:`${output}/09-olive-ready-390.png`});
 await farm.setViewportSize({width:320,height:640});
 const farmOverflow=await farm.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 assert.equal(farmOverflow,false,'Olive Terraces must fit 320px');
 const farmCards=await farm.locator('.unit-card').evaluateAll(cards=>cards.map(card=>({left:card.getBoundingClientRect().left,right:card.getBoundingClientRect().right,image:card.querySelector('img').getBoundingClientRect().bottom,price:card.querySelector('.unit-price').getBoundingClientRect().top})));
 for(const card of farmCards){assert.ok(card.left>=0&&card.right<=321,'farm card stays in viewport');assert.ok(card.image<=card.price+1,'farm portrait clears its price');}
 await farm.screenshot({path:`${output}/10-olive-ready-320.png`});
 await farm.setViewportSize({width:390,height:844});
 await farm.getByRole('button',{name:/^BATTLE/}).click();
 await farm.getByRole('button',{name:/Food drop/i}).click();
 for(const name of ['Fieldhand','Slinger','Harvester'])await farm.getByRole('button',{name:new RegExp(`Deploy ${name}`)}).click();
 await farm.waitForTimeout(8000);
 await farm.screenshot({path:`${output}/11-olive-all-roles-390.png`});
 await farm.waitForTimeout(20000);
 await farm.screenshot({path:`${output}/12-olive-clash-390.png`});
 assert.equal(await farm.evaluate(()=>window.__visualFallback),undefined);
 await olive.close();
 // Harbor transition uses the real evolution dialog; no simulation state is mutated.
 const harborTransition=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await harborTransition.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:1,enemyAge:1,furthestBattle:1,coins:20000,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const coast=await harborTransition.newPage();coast.on('pageerror',error=>errors.push(error.message));
 coast.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await coast.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await coast.waitForFunction(()=>!document.querySelector('.world-loader'));
 await coast.getByRole('button',{name:'Evolution',exact:true}).click();
 assert.equal(await coast.locator('.era-landscape').nth(2).getAttribute('src'),'/art/storybook/harbor/village.webp');
 await coast.locator('[data-command="evolve"]').click();
 await coast.getByRole('button',{name:'EVOLVE TO HARBOR WATCH',exact:true}).click();
 await coast.waitForFunction(()=>document.querySelector('.game-shell').dataset.era==='2');
 assert.equal(await coast.locator('#app').getAttribute('data-art-style'),'storybook');
 await coast.getByRole('button',{name:/Deploy Quay Guard/}).waitFor();
 await coast.screenshot({path:`${output}/13-harbor-evolution-mixed-390.png`});
 assert.equal(await coast.evaluate(()=>window.__visualFallback),undefined);
 await harborTransition.close();
 const harbor=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await harbor.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:2,enemyAge:2,furthestBattle:2,coins:0,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const quay=await harbor.newPage();quay.on('pageerror',error=>errors.push(error.message));
 quay.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await quay.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await quay.waitForFunction(()=>!document.querySelector('.world-loader'));
 const harborPortraits=await quay.locator('.unit-card img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),ready:img.complete&&img.naturalWidth>0})));
 assert.equal(harborPortraits.length,3);assert.ok(harborPortraits.every(p=>p.ready&&p.src.includes('/art/storybook/harbor/')));
 await quay.screenshot({path:`${output}/14-harbor-ready-390.png`});
 await quay.setViewportSize({width:320,height:640});
 assert.equal(await quay.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const quayCards=await quay.locator('.unit-card').evaluateAll(cards=>cards.map(card=>({left:card.getBoundingClientRect().left,right:card.getBoundingClientRect().right,image:card.querySelector('img').getBoundingClientRect().bottom,price:card.querySelector('.unit-price').getBoundingClientRect().top})));
 for(const card of quayCards){assert.ok(card.left>=0&&card.right<=321);assert.ok(card.image<=card.price+1,'harbor portrait clears price');}
 await quay.screenshot({path:`${output}/15-harbor-ready-320.png`});
 await quay.setViewportSize({width:390,height:844});
 await quay.getByRole('button',{name:/^BATTLE/}).click();
 await quay.getByRole('button',{name:/Food drop/i}).click();
 for(const name of ['Quay Guard','Archer','Rider'])await quay.getByRole('button',{name:new RegExp(`Deploy ${name},`)}).click();
 await quay.waitForTimeout(8000);
 await quay.screenshot({path:`${output}/16-harbor-all-roles-390.png`});
 await quay.waitForTimeout(20000);
 await quay.screenshot({path:`${output}/17-harbor-clash-390.png`});
 assert.equal(await quay.evaluate(()=>window.__visualFallback),undefined);
 await harbor.close();
 // Keep later-chapter captures in a separate artifact-sized folder.
 const lanternOutput=`${output}/lantern`;mkdirSync(lanternOutput,{recursive:true});
 const lanternTransition=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await lanternTransition.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:2,enemyAge:2,furthestBattle:2,coins:170000,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const crossing=await lanternTransition.newPage();crossing.on('pageerror',error=>errors.push(error.message));
 crossing.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await crossing.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await crossing.waitForFunction(()=>!document.querySelector('.world-loader'));
 await crossing.getByRole('button',{name:'Evolution',exact:true}).click();
 assert.equal(await crossing.locator('.era-landscape').nth(3).getAttribute('src'),'/art/storybook/lantern/village.webp');
 await crossing.locator('[data-command="evolve"]').click();
 await crossing.getByRole('button',{name:'EVOLVE TO LANTERN QUARTER',exact:true}).click();
 await crossing.waitForFunction(()=>document.querySelector('.game-shell').dataset.era==='3');
 assert.equal(await crossing.locator('#app').getAttribute('data-art-style'),'storybook');
 await crossing.getByRole('button',{name:/Deploy Gatekeeper/}).waitFor();
 await crossing.screenshot({path:`${lanternOutput}/18-lantern-evolution-mixed-390.png`});
 assert.equal(await crossing.evaluate(()=>window.__visualFallback),undefined);
 await lanternTransition.close();
 const lantern=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await lantern.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:3,enemyAge:3,furthestBattle:3,coins:0,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const quarter=await lantern.newPage();quarter.on('pageerror',error=>errors.push(error.message));
 quarter.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await quarter.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await quarter.waitForFunction(()=>!document.querySelector('.world-loader'));
 const lanternPortraits=await quarter.locator('.unit-card img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),ready:img.complete&&img.naturalWidth>0})));
 assert.equal(lanternPortraits.length,3);assert.ok(lanternPortraits.every(p=>p.ready&&p.src.includes('/art/storybook/lantern/')));
 await quarter.screenshot({path:`${lanternOutput}/19-lantern-ready-390.png`});
 await quarter.setViewportSize({width:320,height:640});
 assert.equal(await quarter.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const quarterCards=await quarter.locator('.unit-card').evaluateAll(cards=>cards.map(card=>({left:card.getBoundingClientRect().left,right:card.getBoundingClientRect().right,image:card.querySelector('img').getBoundingClientRect().bottom,price:card.querySelector('.unit-price').getBoundingClientRect().top})));
 for(const card of quarterCards){assert.ok(card.left>=0&&card.right<=321);assert.ok(card.image<=card.price+1,'lantern portrait clears price');}
 await quarter.screenshot({path:`${lanternOutput}/20-lantern-ready-320.png`});
 await quarter.setViewportSize({width:390,height:844});
 await quarter.getByRole('button',{name:/^BATTLE/}).click();
 await quarter.getByRole('button',{name:/Food drop/i}).click();
 for(const name of ['Gatekeeper','Musketeer','Cannon'])await quarter.getByRole('button',{name:new RegExp(`Deploy ${name},`)}).click();
 await quarter.waitForTimeout(8000);
 await quarter.screenshot({path:`${lanternOutput}/21-lantern-all-roles-390.png`});
 await quarter.waitForTimeout(20000);
 await quarter.screenshot({path:`${lanternOutput}/22-lantern-later-battle-390.png`});
 assert.equal(await quarter.evaluate(()=>window.__visualFallback),undefined);
 await lantern.close();
 const hillsideOutput=`${output}/hillside`;mkdirSync(hillsideOutput,{recursive:true});
 const hillsideTransition=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await hillsideTransition.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:3,enemyAge:3,furthestBattle:3,coins:1300000,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const ascent=await hillsideTransition.newPage();ascent.on('pageerror',error=>errors.push(error.message));
 ascent.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await ascent.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await ascent.waitForFunction(()=>!document.querySelector('.world-loader'));
 await ascent.getByRole('button',{name:'Evolution',exact:true}).click();
 assert.equal(await ascent.locator('.era-landscape').nth(4).getAttribute('src'),'/art/storybook/hillside/village.webp');
 await ascent.locator('[data-command="evolve"]').click();
 await ascent.getByRole('button',{name:'EVOLVE TO HILLSIDE WATCH',exact:true}).click();
 await ascent.waitForFunction(()=>document.querySelector('.game-shell').dataset.era==='4');
 assert.equal(await ascent.locator('#app').getAttribute('data-art-style'),'storybook');
 await ascent.getByRole('button',{name:/Deploy Sentinel/}).waitFor();
 await ascent.screenshot({path:`${hillsideOutput}/23-hillside-evolution-mixed-390.png`});
 assert.equal(await ascent.evaluate(()=>window.__visualFallback),undefined);
 await hillsideTransition.close();
 const hillside=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await hillside.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:4,enemyAge:4,furthestBattle:4,coins:0,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const watch=await hillside.newPage();watch.on('pageerror',error=>errors.push(error.message));
 watch.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await watch.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await watch.waitForFunction(()=>!document.querySelector('.world-loader'));
 const hillsidePortraits=await watch.locator('.unit-card img').evaluateAll(async images=>Promise.all(images.map(async img=>{
  await img.decode();return {src:img.getAttribute('src'),ready:img.complete&&img.naturalWidth>0&&img.naturalHeight>0};
 })));
 assert.deepEqual(hillsidePortraits.map(p=>p.src),['sentinel','scout','tank'].map(role=>`/art/storybook/hillside/${role}-portrait.webp`));
 assert.ok(hillsidePortraits.every(p=>p.ready),'all three Hillside portraits decode');
 assert.equal(await watch.locator('#app').getAttribute('data-art-style'),'storybook');
 await watch.screenshot({path:`${hillsideOutput}/24-hillside-ready-390.png`});
 await watch.setViewportSize({width:320,height:640});
 assert.equal(await watch.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Hillside Watch must fit 320px');
 const watchCards=await watch.locator('.unit-card').evaluateAll(cards=>cards.map(card=>({left:card.getBoundingClientRect().left,right:card.getBoundingClientRect().right,image:card.querySelector('img').getBoundingClientRect().bottom,price:card.querySelector('.unit-price').getBoundingClientRect().top})));
 for(const card of watchCards){assert.ok(card.left>=0&&card.right<=321,'Hillside card stays in viewport');assert.ok(card.image<=card.price+1,'Hillside portrait clears price');}
 await watch.screenshot({path:`${hillsideOutput}/25-hillside-ready-320.png`});
 await watch.setViewportSize({width:390,height:844});
 await watch.getByRole('button',{name:/^BATTLE/}).click();
 await watch.getByRole('button',{name:/Food drop/i}).click();
 for(const name of ['Sentinel','Scout','Tank'])await watch.getByRole('button',{name:new RegExp(`Deploy ${name},`)}).click();
 await watch.waitForTimeout(8000);
 await watch.screenshot({path:`${hillsideOutput}/26-hillside-all-roles-390.png`});
 await watch.waitForTimeout(20000);
 await watch.screenshot({path:`${hillsideOutput}/27-hillside-later-battle-390.png`});
 assert.equal(await watch.evaluate(()=>window.__visualFallback),undefined);
 await hillside.close();
 const courtyardsOutput=`${output}/courtyards`;mkdirSync(courtyardsOutput,{recursive:true});
 const courtyardsTransition=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await courtyardsTransition.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:4,enemyAge:4,furthestBattle:4,coins:13000000,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const beyond=await courtyardsTransition.newPage();beyond.on('pageerror',error=>errors.push(error.message));
 beyond.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await beyond.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await beyond.waitForFunction(()=>!document.querySelector('.world-loader'));
 await beyond.getByRole('button',{name:'Evolution',exact:true}).click();
 assert.equal(await beyond.locator('.era-landscape').nth(5).getAttribute('src'),'/art/storybook/courtyards/village.webp');
 await beyond.locator('[data-command="evolve"]').click();
 await beyond.getByRole('button',{name:'EVOLVE TO COURTYARDS BEYOND',exact:true}).click();
 await beyond.waitForFunction(()=>document.querySelector('.game-shell').dataset.era==='5');
 assert.equal(await beyond.locator('#app').getAttribute('data-art-style'),'storybook');
 await beyond.getByRole('button',{name:/Deploy Light Guard/}).waitFor();
 await beyond.screenshot({path:`${courtyardsOutput}/28-courtyards-evolution-mixed-390.png`});
 assert.equal(await beyond.evaluate(()=>window.__visualFallback),undefined);
 await courtyardsTransition.close();
 const courtyards=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
 await courtyards.addInitScript(()=>{
  document.addEventListener('visual-fallback',()=>{window.__visualFallback=true;});
  localStorage.setItem('almo7areboon.save.v1',JSON.stringify({version:2,timeline:1,age:5,enemyAge:5,furthestBattle:5,coins:0,cards:[],unlocked:[true,true,true],sound:false}));
 });
 const future=await courtyards.newPage();future.on('pageerror',error=>errors.push(error.message));
 future.on('response',response=>{if(response.url().includes('/art/storybook/')&&!response.ok())assetFailures.push(`${response.status()} ${response.url()}`);});
 await future.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await future.waitForFunction(()=>!document.querySelector('.world-loader'));
 const courtyardsPortraits=await future.locator('.unit-card img').evaluateAll(async images=>Promise.all(images.map(async img=>{
  await img.decode();return {src:img.getAttribute('src'),ready:img.complete&&img.naturalWidth>0&&img.naturalHeight>0};
 })));
 assert.deepEqual(courtyardsPortraits.map(p=>p.src),['light-guard','trooper','sky-skimmer'].map(role=>`/art/storybook/courtyards/${role}-portrait.webp`));
 assert.ok(courtyardsPortraits.every(p=>p.ready),'all three Courtyards portraits decode');
 assert.equal(await future.locator('#app').getAttribute('data-art-style'),'storybook');
 await future.screenshot({path:`${courtyardsOutput}/29-courtyards-ready-390.png`});
 await future.setViewportSize({width:320,height:640});
 assert.equal(await future.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Courtyards Beyond must fit 320px');
 const futureCards=await future.locator('.unit-card').evaluateAll(cards=>cards.map(card=>({left:card.getBoundingClientRect().left,right:card.getBoundingClientRect().right,image:card.querySelector('img').getBoundingClientRect().bottom,price:card.querySelector('.unit-price').getBoundingClientRect().top})));
 for(const card of futureCards){assert.ok(card.left>=0&&card.right<=321,'Courtyards card stays in viewport');assert.ok(card.image<=card.price+1,'Courtyards portrait clears price');}
 await future.screenshot({path:`${courtyardsOutput}/30-courtyards-ready-320.png`});
 await future.setViewportSize({width:390,height:844});
 await future.getByRole('button',{name:/^BATTLE/}).click();
 await future.getByRole('button',{name:/Food drop/i}).click();
 for(const name of ['Light Guard','Trooper','Sky Skimmer'])await future.getByRole('button',{name:new RegExp(`Deploy ${name},`)}).click();
 await future.waitForTimeout(8000);
 await future.screenshot({path:`${courtyardsOutput}/31-courtyards-all-roles-390.png`});
 await future.waitForTimeout(20000);
 await future.screenshot({path:`${courtyardsOutput}/32-courtyards-later-battle-390.png`});
 assert.equal(await future.evaluate(()=>window.__visualFallback),undefined);
 await courtyards.close();
 await verifyTacticalInputs(browser,errors,assetFailures);
 await captureTacticalWaves(browser,errors,assetFailures,output);
 await captureTraitFixtures(browser,errors,assetFailures,output);
 assert.deepEqual(errors,[],`browser errors: ${errors.join('; ')}`);
 assert.deepEqual(assetFailures,[],'all storybook asset requests succeeded');
 console.log(JSON.stringify({density,screenshots:42,tacticalInputSessions:11,narrowControls:layout.length,errors,assetFailures},null,2));
} finally {
 await browser?.close();
 server.kill('SIGTERM');
}
