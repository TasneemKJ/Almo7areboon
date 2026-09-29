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
 await army.waitForTimeout(7000);
 await army.screenshot({path:`${output}/07-clash-fixture-390.png`});
 await showcase.close();
 assert.deepEqual(errors,[],`browser errors: ${errors.join('; ')}`);
 assert.deepEqual(assetFailures,[],'all storybook asset requests succeeded');
 console.log(JSON.stringify({density,screenshots:7,narrowControls:layout.length,errors,assetFailures},null,2));
} finally {
 await browser?.close();
 server.kill('SIGTERM');
}
