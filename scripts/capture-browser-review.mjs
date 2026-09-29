/** Real browser screenshots and geometry checks for the portrait battle UI. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';

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
  await page.getByRole('button',{name:'Pause battle'}).click();
 const pausedTitleSize=await page.locator('.stage h1').evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
 assert.ok(pausedTitleSize<readyTitleSize*.7,`pause heading should remain compact: ${readyTitleSize} → ${pausedTitleSize}`);
 assert.equal(await page.locator('.battle-select').evaluate(node=>getComputedStyle(node).display),'none');
 await page.getByText('PAUSED',{exact:true}).waitFor();
 await page.screenshot({path:`${output}/03-pause-390.png`});
 await page.getByRole('button',{name:'Resume battle'}).click();
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
 assert.deepEqual(errors,[],`browser errors: ${errors.join('; ')}`);
 assert.deepEqual(assetFailures,[],'all storybook asset requests succeeded');
 console.log(JSON.stringify({density,screenshots:27,narrowControls:layout.length,errors,assetFailures},null,2));
} finally {
 await browser?.close();
 server.kill('SIGTERM');
}
