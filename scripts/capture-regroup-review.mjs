import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';

const output='artifacts/browser-review/regroup',origin='http://127.0.0.1:4179';
mkdirSync(output,{recursive:true});
const diagnostics={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),status:'failed',cases:[],pageErrors:[],assetFailures:[]};
let browser,server,serverLog='';
async function tabTo(page,selector){for(let i=0;i<30;i++){if(await page.locator(selector).evaluate(node=>node===document.activeElement))return;await page.keyboard.press('Tab');}throw Error(`Tab could not reach ${selector}`);}
async function session(viewport,kind){
 const name=`${kind}-${viewport.width}`,context=await browser.newContext({viewport,reducedMotion:'reduce'});
 context.setDefaultTimeout(15000);let page;
 try{
  const profile=defaultProfile();Object.assign(profile,{sound:false,motion:'reduced'});
  if(kind==='earlier')Object.assign(profile,{age:1,enemyAge:2,furthestBattle:2,coins:1000});
  if(kind==='terminal'){Object.assign(profile,{age:5,enemyAge:5,furthestBattle:5,timeline:1000,coins:1e9,gems:1e7,foodLevel:100,baseLevel:100,unlocked:[true,true,true]});profile.mastery.timeline=1000;profile.cards.fill(1000);}
  const source=await context.newPage();await source.route(`${origin}/__setup`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Save setup</title>'}));await source.goto(`${origin}/__setup`);
  const keys={primary:SAVE_KEY,backup:BACKUP_KEY};
  await source.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,...keys});
  page=await context.newPage();page.on('pageerror',error=>diagnostics.pageErrors.push(error.message));page.on('response',r=>{if(r.url().includes('/art/')&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  await page.locator('[data-command="start"]').click();await page.locator('[data-command="settings"]').click();await page.locator('[data-command="retreat"]').click();
  await page.getByRole('heading',{name:'REGROUP',exact:true}).waitFor();
  await source.waitForFunction(({primary,backup})=>{const p=localStorage.getItem(primary);return p!==null&&p===localStorage.getItem(backup);},keys,{timeout:10000});
  const bytes=()=>source.evaluate(({primary,backup})=>[localStorage.getItem(primary),localStorage.getItem(backup)],keys),before=await bytes();
  const help=page.locator('.regroup-teaching');assert.equal(await help.getAttribute('open'),null);
  await tabTo(page,'.regroup-teaching summary');await page.keyboard.press('Space');assert.equal(await help.getAttribute('open'),'');
  if(kind==='fresh')assert.match(await help.innerText(),/100 gems.*review/);
  if(kind==='earlier')assert.match(await help.innerText(),/Food production.*400 coins/);
  if(kind==='terminal')assert.match(await help.innerText(),/Choose Return to chapters below/);
  const paragraphs=help.locator('p'),bounds=[];
  for(let i=0;i<await paragraphs.count();i++){
   await paragraphs.nth(i).scrollIntoViewIfNeeded();
   const b=await paragraphs.nth(i).evaluate(node=>{const r=node.getBoundingClientRect(),d=node.closest('.dialog');return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,overflow:d.scrollWidth>d.clientWidth+1};});
   assert.ok(b.left>=0&&b.right<=b.width&&b.top>=0&&b.bottom<=b.height&&!b.overflow,JSON.stringify(b));bounds.push(b);
   await page.screenshot({path:`${output}/regroup-${name}-paragraph-${i}.png`});
  }
  assert.deepEqual(await bytes(),before,'native help keys and scrolling preserve primary and backup');
  const action=page.locator(`#modal-layer [data-command="${kind==='terminal'?'return-chapters':'retry'}"]`);
  await action.scrollIntoViewIfNeeded();
  const button=await action.evaluate(node=>{const r=node.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,bottom:r.bottom,viewport:innerHeight,hit:node.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
  assert.ok(button.height>=44&&button.top>=0&&button.bottom<=button.viewport&&button.hit,JSON.stringify(button));
  await page.screenshot({path:`${output}/regroup-${name}-action.png`});await action.click();
  await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready');assert.equal(await help.count(),0);
  if(kind==='terminal')await page.getByRole('heading',{name:'Choose a battle',exact:true}).waitFor();
  else assert.equal(await page.locator('#modal-layer').evaluate(node=>node.hidden),true);
  const saved=JSON.parse((await bytes())[0]);assert.equal(saved.coins,profile.coins);assert.equal(saved.gems,profile.gems);assert.equal(saved.age,profile.age);assert.equal(saved.foodLevel,profile.foodLevel);
  diagnostics.cases.push({name,status:'passed',bounds,button,unchangedDisclosureBytes:true,noPurchaseOnReturn:true});
 }catch(error){diagnostics.cases.push({name,status:'failed',error:error.stack});await page?.screenshot({path:`${output}/regroup-failure-${name}.png`}).catch(()=>{});throw error;}
 finally{await context.close();}
}
try{
 assert.ok(existsSync('dist/index.html'));server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4179','--strictPort'],{stdio:'pipe'});server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c);
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(serverLog);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,250));}assert.ok(ready,'production preview starts');
 browser=await chromium.launch({headless:true,timeout:30000});diagnostics.browser=browser.version();
 await session({width:320,height:568},'fresh');await session({width:390,height:844},'earlier');await session({width:320,height:568},'terminal');
 assert.deepEqual(diagnostics.pageErrors,[]);assert.deepEqual(diagnostics.assetFailures,[]);diagnostics.status='passed';console.log('Regroup native review passed: 3 scenarios');
}catch(error){diagnostics.error=error.stack;process.exitCode=1;console.error(error);}
finally{diagnostics.serverLog=serverLog;writeFileSync(`${output}/diagnostics.json`,JSON.stringify(diagnostics,null,2));try{await browser?.close();}finally{server?.kill('SIGTERM');}}
