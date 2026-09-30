import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';
const output='artifacts/browser-review/formation-learning',origin='http://127.0.0.1:4188',cue='Ranged troops need cover. Add a melee guard.';
mkdirSync(output,{recursive:true});
const diagnostics={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),status:'failed',cases:[],pageErrors:[],assetFailures:[]};
let browser,server,serverLog='';
async function capture(page,name){
 const bounds=await page.locator('#deploy-hint').evaluate(n=>{const r=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);const t=range.getBoundingClientRect(),units=document.querySelector('#unit-cards').getBoundingClientRect(),upgrades=document.querySelector('.upgrades').getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerWidth,font:parseFloat(getComputedStyle(n).fontSize),textTop:t.top,textBottom:t.bottom,unitsBottom:units.bottom,upgradesTop:upgrades.top,overflow:n.scrollWidth>n.clientWidth+1,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
 assert.ok(bounds.left>=0&&bounds.right<=bounds.viewport&&bounds.top>=bounds.unitsBottom-1&&bounds.bottom<=bounds.upgradesTop+1&&bounds.textTop>=bounds.top-1&&bounds.textBottom<=bounds.bottom+1&&bounds.font>=11&&!bounds.overflow&&bounds.hit,JSON.stringify(bounds));
 const control=await page.locator('[data-unit="0"]').evaluate(n=>{const r=n.getBoundingClientRect();return{width:r.width,height:r.height,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});assert.ok(control.width>=44&&control.height>=44&&control.hit,JSON.stringify(control));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${output}/${name}.png`});return{bounds,control};
}
async function session(viewport){
 const name=String(viewport.width),context=await browser.newContext({viewport,reducedMotion:'reduce'});context.setDefaultTimeout(20000);let page;
 try{
  const profile=defaultProfile();Object.assign(profile,{coins:150,sound:false,motion:'reduced'});
  const setup=await context.newPage();await setup.route(`${origin}/__setup`,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Save setup</title>'}));await setup.goto(`${origin}/__setup`);await setup.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,primary:SAVE_KEY,backup:BACKUP_KEY});await setup.close();
  page=await context.newPage();page.on('pageerror',e=>diagnostics.pageErrors.push(e.message));page.on('response',r=>{if(/\/(art|assets)\//.test(r.url())&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  await page.locator('[data-unit="1"]').click();await page.locator('[data-command="start"]').click();await page.locator('[data-unit="1"]').click();
  // Wait for the real unlock acknowledgement to finish, so the live hint is unobscured.
  await page.waitForFunction(cue=>document.querySelector('#deploy-hint')?.textContent===cue&&Number(getComputedStyle(document.querySelector('#toast')).opacity)<=.05,cue);
  const guard=page.locator('[data-unit="0"]');assert.equal(await guard.isEnabled(),true);assert.equal(await page.locator('#deploy-hint').innerText(),cue);
  const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);assert.equal(before.deployed,1);assert.equal(before.coins,0);assert.equal(before.unlocked[1],true);
  const ranged=await capture(page,`formation-ranged-${name}`);await guard.click();await page.waitForFunction(({key,cue})=>JSON.parse(localStorage.getItem(key)).deployed===2&&document.querySelector('#deploy-hint')?.textContent!==cue,{key:SAVE_KEY,cue});
  const covered=await capture(page,`formation-covered-${name}`);const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);assert.equal(after.deployed,2);assert.equal(after.coins,0);assert.equal(after.gems,before.gems);
  diagnostics.cases.push({name,status:'passed',fixture:{coins:150},actualUnlock:true,actualRangedDeployment:true,realFoodGrowth:true,ranged,covered,actualGuardDeployment:true,cueRemovedAfterCover:true});
 }catch(error){diagnostics.cases.push({name,status:'failed',error:error.stack,lastUi:await page?.evaluate(()=>({hint:document.querySelector('#deploy-hint')?.textContent,food:document.querySelector('#food-count')?.textContent})).catch(()=>null)});await page?.screenshot({path:`${output}/formation-failure-${name}.png`}).catch(()=>{});throw error;}finally{await context.close();}
}
try{
 assert.ok(existsSync('dist/index.html'));server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4188','--strictPort'],{stdio:'pipe'});server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c);
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(serverLog);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({headless:true,timeout:30000});diagnostics.browser=browser.version();for(const viewport of [{width:320,height:568},{width:390,height:844}])await session(viewport);assert.equal(diagnostics.cases.length,2);assert.deepEqual(diagnostics.pageErrors,[]);assert.deepEqual(diagnostics.assetFailures,[]);diagnostics.status='passed';console.log('Formation learning passed: 2 native production scenarios');
}catch(error){diagnostics.error=error.stack;process.exitCode=1;console.error(error);}finally{diagnostics.serverLog=serverLog;writeFileSync(`${output}/diagnostics.json`,JSON.stringify(diagnostics,null,2));try{await browser?.close();}finally{server?.kill('SIGTERM');}}
