import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';

const output='artifacts/browser-review/skill-cues',origin='http://127.0.0.1:4178';
mkdirSync(output,{recursive:true});
const diagnostics={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),status:'failed',cases:[],pageErrors:[],assetFailures:[]};
let browser,server,serverLog='';
async function tabTo(page,selector){for(let i=0;i<30;i++){if(await page.locator(selector).evaluate(node=>node===document.activeElement))return;await page.keyboard.press('Tab');}throw Error(`Tab could not reach ${selector}`);}
async function capture(page,name){
 const controls=await page.locator('.skill-circle').evaluateAll(nodes=>nodes.map(node=>{
  const r=node.getBoundingClientRect(),s=getComputedStyle(node),badge=node.querySelector('small').getBoundingClientRect();
  return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,
   hit:node.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),badge:{left:badge.left,right:badge.right,top:badge.top,bottom:badge.bottom},
   viewport:{width:innerWidth,height:innerHeight},label:node.getAttribute('aria-label'),opacity:s.opacity,animation:s.animationDuration};
 }));
 assert.ok(controls.every(c=>c.width>=44&&c.height>=44&&c.left>=0&&c.right<=c.viewport.width&&c.bottom<=c.viewport.height&&c.hit),JSON.stringify(controls));
 assert.ok(controls.every(c=>c.badge.left>=0&&c.badge.right<=c.viewport.width&&c.badge.bottom<=c.viewport.height&&c.label),JSON.stringify(controls));
 assert.ok(controls.every(c=>c.animation.split(',').every(v=>parseFloat(v)===0)),'skill cues add no motion');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`${output}/${name}.png`});return controls;
}
async function session(viewport,forced=false){
 const name=`${viewport.width}${forced?'-forced':''}`,context=await browser.newContext({viewport,reducedMotion:'reduce',forcedColors:forced?'active':'none'});
 context.setDefaultTimeout(15000);
 let page;
 try{
  const source=await context.newPage();await source.route(`${origin}/__setup`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Save setup</title>'}));await source.goto(`${origin}/__setup`);
  const profile=defaultProfile();Object.assign(profile,{age:5,enemyAge:5,furthestBattle:5,speed:1,sound:false,motion:'reduced'});
  await source.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,primary:SAVE_KEY,backup:BACKUP_KEY});
  page=await context.newPage();page.on('pageerror',error=>diagnostics.pageErrors.push(error.message));page.on('response',r=>{if(r.url().includes('/art/')&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  await page.locator('[data-command="start"]').click();
  const freeze=page.locator('[data-skill="freeze"]'),meteor=page.locator('[data-skill="meteor"]');
  await page.waitForFunction(()=>document.querySelector('[data-skill="freeze"] small')?.textContent==='0');
  assert.match(await freeze.getAttribute('aria-label'),/starts immediately/);
  await tabTo(page,'[data-skill="freeze"]');const handle=await freeze.elementHandle();
  await page.waitForFunction(()=>document.querySelector('[data-skill="freeze"] small')?.textContent==='3');
  assert.equal(await handle.evaluate(node=>node===document.activeElement&&node===document.querySelector('[data-skill="freeze"]')),true,'target updates preserve native node and focus');
  assert.equal(await freeze.evaluate(node=>node.classList.contains('skill-opportunity')),true);assert.equal(await meteor.evaluate(node=>node.classList.contains('skill-opportunity')),true);
  const group=await capture(page,`skill-group-${name}`);await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('[data-skill="freeze"]')?.classList.contains('freeze-active'));
  assert.equal(await freeze.isDisabled(),true);assert.equal(await freeze.evaluate(node=>node.classList.contains('skill-opportunity')),false);
  await page.locator('[data-command="pause"]').click();
  await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='true'&&!document.querySelector('#pause-banner')?.hidden);
  const paused=await freeze.locator('small').innerText();
  await page.waitForTimeout(1200);assert.equal(await freeze.locator('small').innerText(),paused,'manual pause holds the battle-clock countdown across a full badge tick');
  assert.equal(await meteor.evaluate(node=>node.classList.contains('skill-opportunity')),false);
  const active=await capture(page,`skill-active-paused-${name}`);assert.ok(Number(active[0].opacity)>=.85,'active effect badge is not dimmed as spent');
  await page.locator('[data-command="pause"]').click();await page.waitForFunction(()=>document.querySelector('[data-skill="freeze"] small')?.textContent==='✓');
  assert.match(await freeze.getAttribute('aria-label'),/used this battle/);await handle.dispose();
  await page.locator('[data-command="settings"]').click();await page.locator('[data-command="retreat"]').click();
  await page.getByRole('heading',{name:'REGROUP',exact:true}).waitFor();await page.locator('#modal-layer [data-command="retry"]').click();
  await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready');
  assert.equal(await freeze.locator('small').innerText(),'0');assert.equal(await freeze.evaluate(node=>node.classList.contains('freeze-active')),false);
  diagnostics.cases.push({name,status:'passed',group,active,pausedBadge:paused,retryReset:true});
 }catch(error){diagnostics.cases.push({name,status:'failed',error:error.stack});await page?.screenshot({path:`${output}/skill-failure-${name}.png`}).catch(()=>{});throw error;}
 finally{await context.close();}
}
async function teaching(){
 const context=await browser.newContext({viewport:{width:320,height:568},reducedMotion:'reduce'});
 context.setDefaultTimeout(45000);
 try{
  const source=await context.newPage();await source.route(`${origin}/__setup`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Save setup</title>'}));await source.goto(`${origin}/__setup`);
  const profile=defaultProfile();Object.assign(profile,{wins:1,sound:false,motion:'reduced',speed:1});
  await source.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,primary:SAVE_KEY,backup:BACKUP_KEY});
  const page=await context.newPage();page.on('pageerror',error=>diagnostics.pageErrors.push(error.message));page.on('response',r=>{if(r.url().includes('/art/')&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  await page.locator('[data-command="start"]').click();
  for(let i=0;i<3;i++)await page.locator('[data-unit="0"]').click();
  await page.waitForFunction(()=>/^Try a skill: Food Drop\./.test(document.querySelector('#deploy-hint')?.textContent??'')&&document.querySelector('[data-skill="freeze"] small')?.textContent==='0');
  const emptyHint=await page.locator('#deploy-hint').innerText();
  await page.screenshot({path:`${output}/teaching-empty-hint-320.png`});
  await page.locator('[data-command="pause"]').click();
  const freeze=page.locator('[data-skill="freeze"]'),meteor=page.locator('[data-skill="meteor"]');
  assert.equal(await freeze.locator('small').innerText(),'0');assert.equal(await meteor.isDisabled(),true);
  await capture(page,'teaching-empty-gap-320');
  await page.locator('[data-command="pause"]').click();
  await page.waitForFunction(()=>/Try a skill:.*Freeze.*Meteor/.test(document.querySelector('#deploy-hint')?.textContent??'')&&Number(document.querySelector('[data-skill="freeze"] small')?.textContent)>0);
  await page.locator('[data-command="pause"]').click();
  assert.ok(Number(await freeze.locator('small').innerText())>0);await capture(page,'teaching-live-targets-320');
  diagnostics.cases.push({name:'target-aware-teaching-320',status:'passed',emptyHint,emptyGap:true,liveTargets:true});
 }catch(error){diagnostics.cases.push({name:'target-aware-teaching-320',status:'failed',error:error.stack});throw error;}
 finally{await context.close();}
}
try{
 assert.ok(existsSync('dist/index.html'));server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4178','--strictPort'],{stdio:'pipe'});server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c);
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(serverLog);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,250));}assert.ok(ready,'production preview starts');
 browser=await chromium.launch({headless:true,timeout:30000});diagnostics.browser=browser.version();
 await session({width:320,height:568});await session({width:390,height:844});await session({width:320,height:568},true);
 await teaching();
 assert.deepEqual(diagnostics.pageErrors,[]);assert.deepEqual(diagnostics.assetFailures,[]);diagnostics.status='passed';console.log(`Skill cue native review passed: ${diagnostics.cases.length} scenarios`);
}catch(error){diagnostics.error=error.stack;process.exitCode=1;console.error(error);}
finally{diagnostics.serverLog=serverLog;writeFileSync(`${output}/diagnostics.json`,JSON.stringify(diagnostics,null,2));try{await browser?.close();}finally{server?.kill('SIGTERM');}}
