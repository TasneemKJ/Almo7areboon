import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';
import {reviewPort} from './review-port.mjs';

const output='artifacts/browser-review/food-drop',origin=`http://127.0.0.1:${reviewPort(4186)}`;
mkdirSync(output,{recursive:true});
const diagnostics={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),status:'failed',cases:[],pageErrors:[],assetFailures:[]};
let browser,server,serverLog='';
async function capture(page,name){
 const geometry=await page.locator('[data-skill="food"]').evaluate(n=>{
  const r=n.getBoundingClientRect(),b=n.querySelector('small').getBoundingClientRect();
  return{width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight,badge:{left:b.left,right:b.right,top:b.top,bottom:b.bottom},hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
 });
 assert.ok(geometry.width>=44&&geometry.height>=44&&geometry.left>=0&&geometry.right<=geometry.viewportWidth&&geometry.top>=0&&geometry.bottom<=geometry.viewportHeight&&geometry.hit,JSON.stringify(geometry));
 assert.ok(geometry.badge.left>=0&&geometry.badge.right<=geometry.viewportWidth&&geometry.badge.top>=0&&geometry.badge.bottom<=geometry.viewportHeight,JSON.stringify(geometry));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${output}/${name}.png`});return geometry;
}
async function session(viewport,capacity){
 const name=`${capacity?'capacity':'opening'}-${viewport.width}`,context=await browser.newContext({viewport,reducedMotion:'reduce'});context.setDefaultTimeout(90000);let page;
 try{
  const setup=await context.newPage();await setup.route(`${origin}/__setup`,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Save setup</title>'}));await setup.goto(`${origin}/__setup`);
  const profile=defaultProfile();Object.assign(profile,{sound:false,motion:'reduced'});
  // Disclosed historical economy fixture; food reaches capacity only by real battle time.
  if(capacity)Object.assign(profile,{foodLevel:6,baseLevel:100,wins:10});
  await setup.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,primary:SAVE_KEY,backup:BACKUP_KEY});await setup.close();
  page=await context.newPage();page.on('pageerror',e=>diagnostics.pageErrors.push(e.message));page.on('response',r=>{if(/\/(art|assets)\//.test(r.url())&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  const food=page.locator('[data-skill="food"]'),badge=food.locator('small'),troop=page.locator('[data-unit="0"]');await page.locator('[data-command="start"]').click();
  const views=[];
  if(!capacity){
   await troop.click();await troop.click();
   await page.waitForFunction(()=>/Food Drop adds 10 now.*wait \d+s/.test(document.querySelector('#deploy-hint')?.textContent??'')&&Number(document.querySelector('#food-count')?.textContent)<3);
   assert.equal(await food.isEnabled(),true);assert.equal(await badge.innerText(),'+10');
   const hintBounds=await page.locator('#deploy-hint').evaluate(n=>{const r=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);const text=range.getBoundingClientRect(),units=document.querySelector('#unit-cards').getBoundingClientRect(),upgrades=document.querySelector('.upgrades').getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerWidth,unitsBottom:units.bottom,upgradesTop:upgrades.top,font:parseFloat(getComputedStyle(n).fontSize),textTop:text.top,textBottom:text.bottom,overflow:n.scrollWidth>n.clientWidth+1};});
   assert.ok(hintBounds.left>=0&&hintBounds.right<=hintBounds.viewport&&hintBounds.top>=hintBounds.unitsBottom-1&&hintBounds.bottom<=hintBounds.upgradesTop+1&&hintBounds.font>=11&&hintBounds.textTop>=hintBounds.top-1&&hintBounds.textBottom<=hintBounds.bottom+1&&!hintBounds.overflow,JSON.stringify(hintBounds));
   views.push(await capture(page,`food-choice-${name}`));const before=Number(await page.locator('#food-count').innerText());
   await food.click();await page.locator('[data-command="pause"]').click();
   const after=Number(await page.locator('#food-count').innerText());assert.ok(after>=before+10&&after<=before+11,`${before} -> ${after}`);
   assert.equal(await badge.innerText(),'✓');assert.equal(await food.isDisabled(),true);assert.match(await food.getAttribute('aria-label'),/used this battle/);
   views.push(await capture(page,`food-used-${name}`));
   await page.locator('.nav-item[data-tab="skills"]').click();
   const copy=page.locator('.skill-detail').filter({has:page.getByRole('heading',{name:'Food Drop',exact:true})}).locator('p');await copy.scrollIntoViewIfNeeded();
   assert.match(await copy.innerText(),/Gain up to 10 food instantly, limited by 99-food storage/);
   const b=await copy.evaluate(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight};});assert.ok(b.left>=0&&b.right<=b.width&&b.top>=0&&b.bottom<=b.height,JSON.stringify(b));
   await page.screenshot({path:`${output}/food-rules-${name}.png`});
   diagnostics.cases.push({name,status:'passed',fixture:'fresh',views,hintBounds,realTwoDeployments:true,optionalHint:true,acceptedDrop:true,before,after,onceOnly:true,capacityRulesReadable:true});
  }else{
   await page.waitForFunction(()=>document.querySelector('[data-skill="food"] small')?.textContent==='CAP');await page.locator('[data-command="pause"]').click();
   assert.equal(await badge.innerText(),'CAP');assert.match(await food.getAttribute('aria-label'),/storage almost full.*99 food/);views.push(await capture(page,`food-partial-${name}`));
   await page.locator('[data-command="pause"]').click();
   await page.waitForFunction(()=>document.querySelector('[data-skill="food"] small')?.textContent==='FULL'&&document.querySelector('#food-count')?.textContent==='99');
   assert.equal(await food.isDisabled(),true);assert.match(await food.getAttribute('aria-label'),/storage full at 99 food/);views.push(await capture(page,`food-full-${name}`));
   await troop.click();assert.equal(await badge.innerText(),'CAP');assert.equal(await food.isEnabled(),true);
   await food.click();await page.locator('[data-command="pause"]').click();assert.equal(await page.locator('#food-count').innerText(),'99');assert.equal(await badge.innerText(),'✓');assert.equal(await food.isDisabled(),true);
   views.push(await capture(page,`food-limited-use-${name}`));
   diagnostics.cases.push({name,status:'passed',fixture:{foodLevel:6,baseLevel:100,wins:10},views,realFoodGrowth:true,partialCue:true,fullStorageDisabled:true,deploymentFreesCapacity:true,limitedDropFills99:true});
  }
 }catch(error){const lastUi=await page?.evaluate(()=>({phase:document.querySelector('#world')?.dataset.phase,food:document.querySelector('#food-count')?.textContent,badge:document.querySelector('[data-skill="food"] small')?.textContent,hint:document.querySelector('#deploy-hint')?.textContent})).catch(()=>null);diagnostics.cases.push({name,status:'failed',error:error.stack,lastUi});await page?.screenshot({path:`${output}/food-failure-${name}.png`}).catch(()=>{});throw error;}
 finally{await context.close();}
}
try{
 assert.ok(existsSync('dist/index.html'));server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(reviewPort(4186)),'--strictPort'],{stdio:'pipe'});server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c);
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(serverLog);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({headless:true,timeout:30000});diagnostics.browser=browser.version();
 for(const viewport of [{width:320,height:568},{width:390,height:844}]){await session(viewport,false);await session(viewport,true);}
 assert.equal(diagnostics.cases.length,4);assert.deepEqual(diagnostics.pageErrors,[]);assert.deepEqual(diagnostics.assetFailures,[]);diagnostics.status='passed';console.log('Food Drop teaching passed: 4 native production scenarios');
}catch(error){diagnostics.error=error.stack;process.exitCode=1;console.error(error);}
finally{diagnostics.serverLog=serverLog;writeFileSync(`${output}/diagnostics.json`,JSON.stringify(diagnostics,null,2));try{await browser?.close();}finally{server?.kill('SIGTERM');}}
