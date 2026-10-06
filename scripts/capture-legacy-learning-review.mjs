import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';
import {reviewPort} from './review-port.mjs';

const output='artifacts/browser-review/legacy-learning',origin=`http://127.0.0.1:${reviewPort(4185)}`;
mkdirSync(output,{recursive:true});
const diagnostics={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),status:'failed',cases:[],pageErrors:[],assetFailures:[]};
let browser,server,serverLog='';
async function tabTo(page,selector){for(let i=0;i<40;i++){if(await page.locator(selector).evaluate(n=>n===document.activeElement))return;await page.keyboard.press('Tab');}throw Error(`Tab could not reach ${selector}`);}
function fixture(kind){
 const profile=defaultProfile();Object.assign(profile,{sound:false,motion:'reduced'});
 if(kind==='rank-two'){
  profile.timeline=2;profile.mastery.timeline=2;profile.legacy={rank:2,selected:'watch'};profile.furthestBattle=3;
  for(let i=0;i<4;i++)profile.mastery.chapters[i].earnedMask=7;
 }else if(kind.startsWith('terminal')){
  profile.timeline=1000;profile.mastery.timeline=1000;profile.age=5;profile.enemyAge=5;profile.furthestBattle=5;
  profile.legacy={rank:kind==='terminal-earned'?3:0,selected:'stillness'};
 }
 profile.chronicle.timeline=profile.timeline;profile.chronicle.chapter=profile.enemyAge;
 return profile;
}
async function session(viewport,kind){
 const name=`${kind}-${viewport.width}`,context=await browser.newContext({viewport,reducedMotion:'reduce'});context.setDefaultTimeout(15000);let page;
 try{
  const setup=await context.newPage();await setup.route(`${origin}/__setup`,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Save setup</title>'}));await setup.goto(`${origin}/__setup`);
  const keys={primary:SAVE_KEY,backup:BACKUP_KEY},profile=fixture(kind);
  await setup.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,...keys});await setup.close();
  page=await context.newPage();page.on('pageerror',e=>diagnostics.pageErrors.push(e.message));page.on('response',r=>{if(/\/(art|assets)\//.test(r.url())&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  await page.locator('.nav-item[data-tab="evolution"]').click();
  await page.waitForFunction(({primary,backup})=>{const p=localStorage.getItem(primary);return p&&p===localStorage.getItem(backup);},keys);
  const bytes=()=>page.evaluate(({primary,backup})=>[localStorage.getItem(primary),localStorage.getItem(backup)],keys),before=await bytes();
  const details=page.locator('.legacy-learning'),summarySelector='.legacy-learning summary',summary=page.locator(summarySelector);
  assert.equal(await details.evaluate(n=>n.open),false,'help starts closed');
  const selected=()=>page.locator('input[name="ready-legacy"]:checked').evaluateAll(nodes=>nodes[0]?.value??null),selectedBefore=await selected();
  assert.equal(selectedBefore,kind==='rank-two'?'watch':kind==='terminal-earned'?'stillness':null);
  await tabTo(page,summarySelector);
  const summaryBounds=await summary.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return{height:r.height,width:r.width,left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerWidth,viewportHeight:innerHeight,outline:parseFloat(s.outlineWidth),hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
  assert.ok(summaryBounds.height>=44&&summaryBounds.width>=44&&summaryBounds.left>=0&&summaryBounds.right<=summaryBounds.viewport&&summaryBounds.top>=0&&summaryBounds.bottom<=summaryBounds.viewportHeight&&summaryBounds.outline>=2&&summaryBounds.hit,JSON.stringify(summaryBounds));
  await page.screenshot({path:`${output}/legacy-summary-${name}.png`});await page.keyboard.press('Enter');assert.equal(await details.evaluate(n=>n.open),true);
  const copy=await details.innerText();assert.match(copy,new RegExp(`This timeline: ${kind==='rank-two'?12:0} / 18 seals`));
  if(kind.startsWith('terminal'))assert.match(copy,/Timeline limit reached: no further reset or rank upgrade through a reset/);
  else assert.match(copy,/confirm a new timeline/);
  assert.equal(await details.locator('button,input').count(),0,'help cannot select, buy or reset');
  const paragraphs=details.locator('p'),bounds=[];assert.equal(await paragraphs.count(),6);
  for(let i=0;i<await paragraphs.count();i++){
   await paragraphs.nth(i).scrollIntoViewIfNeeded();
   const b=await paragraphs.nth(i).evaluate(n=>{const r=n.getBoundingClientRect(),screen=document.querySelector('#secondary-screen'),v=screen.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerWidth,screenTop:v.top,screenBottom:v.bottom,font:parseFloat(getComputedStyle(n).fontSize),overflow:screen.scrollWidth>screen.clientWidth+1};});
   assert.ok(b.left>=0&&b.right<=b.viewport&&b.top>=b.screenTop-1&&b.bottom<=b.screenBottom+1&&b.font>=12&&!b.overflow,JSON.stringify(b));bounds.push(b);
   await page.screenshot({path:`${output}/legacy-note-${name}-${i}.png`});
  }
  await summary.scrollIntoViewIfNeeded();await tabTo(page,summarySelector);await page.keyboard.press('Enter');assert.equal(await details.evaluate(n=>n.open),false);
  assert.equal(await selected(),selectedBefore,'reading never changes a legacy choice');
  assert.deepEqual(await bytes(),before,'reading and closing preserve both settled save streams');
  await page.locator('.nav-item[data-tab="battle"]').click();await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready'&&!document.querySelector('#battle-view')?.inert);
  assert.deepEqual(await bytes(),before,'return buys nothing and waits for Start');assert.equal(await page.locator('[data-command="start"]').isEnabled(),true);
  diagnostics.cases.push({name,status:'passed',fixture:kind,summaryBounds,bounds,nativeKeyboard:true,unchangedSaveBytes:true,choiceUnchanged:true,returnedReady:true});
 }catch(error){diagnostics.cases.push({name,status:'failed',error:error.stack});await page?.screenshot({path:`${output}/legacy-failure-${name}.png`}).catch(()=>{});throw error;}
 finally{await context.close();}
}
try{
 assert.ok(existsSync('dist/index.html'));server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(reviewPort(4185)),'--strictPort'],{stdio:'pipe'});server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c);
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(serverLog);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({headless:true,timeout:30000});diagnostics.browser=browser.version();
 for(const viewport of [{width:320,height:568},{width:390,height:844}])for(const kind of ['fresh','rank-two','terminal-zero','terminal-earned'])await session(viewport,kind);
 assert.equal(diagnostics.cases.length,8);assert.deepEqual(diagnostics.pageErrors,[]);assert.deepEqual(diagnostics.assetFailures,[]);diagnostics.status='passed';console.log('Legacy learning passed: 8 native production scenarios');
}catch(error){diagnostics.error=error.stack;process.exitCode=1;console.error(error);}
finally{diagnostics.serverLog=serverLog;writeFileSync(`${output}/diagnostics.json`,JSON.stringify(diagnostics,null,2));try{await browser?.close();}finally{server?.kill('SIGTERM');}}
