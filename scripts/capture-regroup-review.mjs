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
// Disclosed equivalent post-evolution profile, not a claim that this browser earned its frontier.
// Outcomes below come only from native deployment clicks and the production simulation.
async function recoverySession(viewport,foreign=false){
 const name=`recovery-${foreign?'foreign-':''}${viewport.width}`,context=await browser.newContext({viewport,reducedMotion:'reduce'});
 context.setDefaultTimeout(15000);let page;
 try{
  const profile=defaultProfile();Object.assign(profile,{age:4,enemyAge:5,furthestBattle:5,coins:0,gems:0,sound:false,motion:'reduced'});
  const keys={primary:SAVE_KEY,backup:BACKUP_KEY};
  const source=await context.newPage();await source.route(`${origin}/__setup`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Disclosed save preparation</title>'}));await source.goto(`${origin}/__setup`);
  await source.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,...keys});
  page=await context.newPage();page.on('pageerror',e=>diagnostics.pageErrors.push(e.message));page.on('response',r=>{if(r.url().includes('/art/')&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  const bytes=()=>source.evaluate(({primary,backup})=>[localStorage.getItem(primary),localStorage.getItem(backup)],keys);
  const settled=()=>source.waitForFunction(({primary,backup})=>localStorage.getItem(primary)===localStorage.getItem(backup),keys);
  async function meleeBattle(){
   await page.locator('[data-command="start"]').click();const deadline=Date.now()+150000;
   while(await page.locator('#world').getAttribute('data-phase')==='running'){
    assert.ok(Date.now()<deadline,'battle must reach its own result within the budget');
    const troop=page.locator('[data-unit="0"]');
    if(await troop.isEnabled())try{await troop.click({timeout:750});}catch(error){if(!['won','lost'].includes(await page.locator('#world').getAttribute('data-phase')))throw error;}
    await page.waitForTimeout(100);
   }
   await page.locator('.result-dialog').waitFor();await settled();
   return {phase:await page.locator('#world').getAttribute('data-phase'),saved:JSON.parse((await bytes())[0])};
  }
  if(foreign){await page.locator('[data-command="start"]').click();await page.locator('[data-command="settings"]').click();await page.locator('[data-command="retreat"]').click();await page.locator('.result-dialog').waitFor();}
  else{const loss=await meleeBattle();assert.equal(loss.phase,'lost');assert.equal(loss.saved.coins,0);assert.equal(loss.saved.kills,0);}
  await settled();const lossBytes=await bytes();
  const route=page.locator('[data-command="regroup-chapters"]');await route.scrollIntoViewIfNeeded();
  const bounds=await route.evaluate(node=>{const r=node.getBoundingClientRect();return {height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,viewport:innerHeight,hit:node.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
  assert.ok(bounds.height>=44&&bounds.left>=0&&bounds.right<=bounds.width&&bounds.top>=0&&bounds.bottom<=bounds.viewport&&bounds.hit,JSON.stringify(bounds));
  await page.screenshot({path:`${output}/${name}-loss.png`});
  if(foreign){
   const changed={...JSON.parse(lossBytes[0]),coins:321};
   await source.evaluate(({primary,backup,changed})=>{const value=JSON.stringify(changed);localStorage.setItem(primary,value);localStorage.setItem(backup,value);},{...keys,changed});
   await page.getByRole('heading',{name:'Your save changed in another tab',exact:true}).waitFor();
   assert.equal(await route.count(),0);assert.deepEqual((await bytes()).map(JSON.parse),[changed,changed]);
   await page.screenshot({path:`${output}/${name}-protected.png`});diagnostics.cases.push({name,status:'passed',foreignSavePreserved:true});return;
  }
  await tabTo(page,'[data-command="regroup-chapters"]');await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Choose a battle',exact:true}).waitFor();
  await page.waitForFunction(()=>document.activeElement?.getAttribute('data-battle')==='4');
  assert.equal(await page.locator('#world').getAttribute('data-phase'),'ready');assert.deepEqual(await bytes(),lossBytes,'opening picker does not select or spend');
  const suggested=page.locator('[data-battle="4"]');assert.match(await suggested.innerText(),/SUGGESTED REPLAY/);assert.equal(await suggested.getAttribute('aria-describedby'),'replay-guidance');
  assert.equal(await page.locator('[data-battle="5"]').getAttribute('aria-current'),'true');
  await page.screenshot({path:`${output}/${name}-suggestion.png`});
  const guidance=page.locator('#replay-guidance');await guidance.scrollIntoViewIfNeeded();
  const textBounds=await guidance.evaluate(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight,overflow:n.closest('.dialog').scrollWidth>n.closest('.dialog').clientWidth+1};});
  assert.ok(textBounds.top>=0&&textBounds.bottom<=textBounds.height&&!textBounds.overflow,JSON.stringify(textBounds));
  await page.screenshot({path:`${output}/${name}-guidance.png`});
  await page.keyboard.press('Escape');assert.equal(await page.locator('#modal-layer').evaluate(n=>n.hidden),true);assert.deepEqual(await bytes(),lossBytes,'cancel keeps current opponent and holdings');
  // A real Retreat reopens the same voluntary route after cancellation.
  await page.locator('[data-command="start"]').click();await page.locator('[data-command="settings"]').click();await page.locator('[data-command="retreat"]').click();await route.click();
  await page.waitForFunction(()=>document.activeElement?.getAttribute('data-battle')==='4');await page.keyboard.press('Enter');await settled();
  const selected=JSON.parse((await bytes())[0]),prior=JSON.parse(lossBytes[0]);assert.equal(selected.enemyAge,4);assert.equal(selected.chronicle.chapter,4);assert.deepEqual({...selected,enemyAge:prior.enemyAge,chronicle:{...selected.chronicle,chapter:prior.chronicle.chapter}},prior);
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');assert.equal(await page.locator('#world').getAttribute('data-phase'),'ready');
  assert.equal(JSON.parse((await bytes())[0]).enemyAge,4);
  await page.screenshot({path:`${output}/${name}-ready.png`});
  const win=await meleeBattle();assert.equal(win.phase,'won');assert.ok(win.saved.coins>0);assert.ok(win.saved.kills>0);assert.equal(win.saved.enemyAge,4);assert.equal(win.saved.age,4);
  assert.equal(win.saved.foodLevel,0);assert.equal(win.saved.baseLevel,0);assert.deepEqual(win.saved.unlocked,[true,false,false]);assert.ok(win.saved.cards.every(n=>n===0));
  assert.ok(win.saved.pendingVictory?.earned>0);assert.equal(win.saved.pendingVictory.earned,win.saved.coins);assert.equal(win.saved.wins,1);
  await page.screenshot({path:`${output}/${name}-victory.png`});
  const winBytes=await bytes();await page.reload({waitUntil:'networkidle'});await page.locator('.result-dialog').waitFor();await settled();assert.deepEqual(await bytes(),winBytes,'reload keeps exactly one victory receipt');
  await page.locator('[data-command="retry"]').click();await page.locator('[data-command="upgrade-food"]').click();await settled();
  const purchased=JSON.parse((await bytes())[0]);assert.equal(purchased.foodLevel,1);assert.equal(purchased.coins,win.saved.coins-204800,'age4 level0 food costs 50 × 4096');
  assert.equal(purchased.pendingVictory,null,'preparation consumes the victory receipt without paying again');
  assert.deepEqual({...purchased,foodLevel:0,coins:win.saved.coins,pendingVictory:win.saved.pendingVictory},win.saved,'only the accepted upgrade and cleared result receipt change');
  await page.screenshot({path:`${output}/${name}-funded-upgrade.png`});
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');await settled();assert.deepEqual(JSON.parse((await bytes())[0]),purchased);
  assert.equal(await page.locator('#world').getAttribute('data-phase'),'ready');
  diagnostics.cases.push({name,status:'passed',fixture:'age4/frontier5 zero coins, no cards/upgrades/skills; native melee-only battles',bounds,textBounds,realLossCoins:0,earned:win.saved.coins,seconds:win.saved.pendingVictory.seconds,cancelPreserved:true,selectionPersisted:true,victoryReloadPreserved:true,actualFoodPurchase:204800,purchaseReloadPreserved:true});
 }catch(error){diagnostics.cases.push({name,status:'failed',error:error.stack});await page?.screenshot({path:`${output}/${name}-failure.png`}).catch(()=>{});throw error;}
 finally{await context.close();}
}
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
async function villageSession(viewport,moment){
 const name=`${moment}-${viewport.width}`,context=await browser.newContext({viewport,reducedMotion:'reduce'});
 context.setDefaultTimeout(30000);let page;
 try{
  const profile=defaultProfile();Object.assign(profile,{age:5,enemyAge:0,furthestBattle:5,foodLevel:12,unlocked:[true,true,true],sound:false,motion:'reduced'});
  const source=await context.newPage();await source.route(`${origin}/__setup`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Save setup</title>'}));await source.goto(`${origin}/__setup`);
  const keys={primary:SAVE_KEY,backup:BACKUP_KEY};
  await source.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,...keys});
  page=await context.newPage();page.on('pageerror',error=>diagnostics.pageErrors.push(error.message));page.on('response',r=>{if(r.url().includes('/art/')&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');await page.locator('[data-command="start"]').click();
  if(moment==='company')for(const role of [0,1,2])await page.locator(`[data-unit="${role}"]`).click();
  else{
   await page.waitForFunction(()=>Number(document.querySelector('[data-skill="freeze"] small')?.textContent)>=3);
   await page.locator(`[data-skill="${moment}"]`).click();
  }
  await page.locator('[data-command="settings"]').click();await page.locator('[data-command="retreat"]').click();await page.getByRole('heading',{name:'REGROUP',exact:true}).waitFor();
  const voice=page.locator('.village-voice');assert.equal(await voice.getAttribute('data-village-moment'),moment);
  assert.match(await voice.innerText(),/hearth-keeper/);assert.match(await voice.innerText(),moment==='freeze'?/Freeze/:moment==='meteor'?/Meteor/:/Three troop roles/);
  await source.waitForFunction(({primary,backup})=>{const p=localStorage.getItem(primary);return p!==null&&p===localStorage.getItem(backup);},keys,{timeout:10000});
  const bytes=()=>source.evaluate(({primary,backup})=>[localStorage.getItem(primary),localStorage.getItem(backup)],keys),before=await bytes();
  await voice.scrollIntoViewIfNeeded();const bounds=await voice.evaluate(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight};});
  assert.ok(bounds.left>=0&&bounds.right<=bounds.width&&bounds.top>=0&&bounds.bottom<=bounds.height,JSON.stringify(bounds));
  await page.screenshot({path:`${output}/village-${name}.png`});assert.deepEqual(await bytes(),before,'viewing a reaction neither spends nor writes progress');
  diagnostics.cases.push({name:`village-${name}`,status:'passed',moment,bounds,voice:await voice.innerText(),actualRetreat:true,unchangedViewBytes:true});
 }catch(error){diagnostics.cases.push({name:`village-${name}`,status:'failed',error:error.stack});await page?.screenshot({path:`${output}/village-failure-${name}.png`}).catch(()=>{});throw error;}
 finally{await context.close();}
}
try{
 assert.ok(existsSync('dist/index.html'));server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4179','--strictPort'],{stdio:'pipe'});server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c);
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(serverLog);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,250));}assert.ok(ready,'production preview starts');
 browser=await chromium.launch({headless:true,timeout:30000});diagnostics.browser=browser.version();
 await session({width:320,height:568},'fresh');await session({width:390,height:844},'earlier');await session({width:320,height:568},'terminal');
 for(const viewport of [{width:320,height:568},{width:390,height:844}])await recoverySession(viewport);
 await recoverySession({width:320,height:568},true);
 for(const viewport of [{width:320,height:568},{width:390,height:844}])for(const moment of ['freeze','meteor','company'])await villageSession(viewport,moment);
 assert.equal(diagnostics.cases.length,12);assert.ok(diagnostics.cases.every(c=>c.status==='passed'));
 assert.deepEqual(diagnostics.pageErrors,[]);assert.deepEqual(diagnostics.assetFailures,[]);diagnostics.status='passed';console.log('Regroup and village native review passed: 12 scenarios');
}catch(error){diagnostics.error=error.stack;process.exitCode=1;console.error(error);}
finally{diagnostics.serverLog=serverLog;writeFileSync(`${output}/diagnostics.json`,JSON.stringify(diagnostics,null,2));try{await browser?.close();}finally{server?.kill('SIGTERM');}}
