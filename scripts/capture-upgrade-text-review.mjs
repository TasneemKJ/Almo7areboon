/** Bounded production upgrade acceptance. Root-size emulation is not a persisted font preference. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { defaultProfile, decodeSave, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { Game } from '../src/game/simulation.ts';
const output='artifacts/browser-review/upgrade-text',origin='http://127.0.0.1:4177';
mkdirSync(output,{recursive:true});
const diagnostics={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),status:'failed',mechanism:'root-size-emulation',deviceScaleFactor:2,cases:[],pageErrors:[],assetFailures:[],screenshots:[],nativeStatus:{status:'unverified',mechanism:null,reason:'Approved headless Chromium exposes no verified persisted default-font preference. CSS root overrides below are emulation; CDP font sizes are not accepted as a persisted preference.'},paintedFocus:{status:'pending-root-pixel-review',reason:'Unmodified before/after PNGs capture native keyboard focus; a computed outline is not visual acceptance.'}};
let server,browser,serverLog='';
const save=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);
async function tabTo(page,selector){for(let n=0;n<40;n++){if(await page.locator(selector).evaluate(node=>node===document.activeElement))return;await page.keyboard.press('Tab');}throw Error(`Keyboard could not reach ${selector}`);}
async function revealUpgrades(page,name){
 const geometry=()=>page.evaluate(()=>{const view=document.querySelector('.battle-view'),upgrades=document.querySelector('.upgrades'),nav=document.querySelector('.bottom-nav'),v=view.getBoundingClientRect(),u=upgrades.getBoundingClientRect(),n=nav.getBoundingClientRect();return {scrollTop:view.scrollTop,scrollHeight:view.scrollHeight,clientHeight:view.clientHeight,viewTop:v.top,viewBottom:v.bottom,upgradesTop:u.top,upgradesBottom:u.bottom,navTop:n.top,clipped:u.bottom>Math.min(v.bottom,n.top)+1};});
 const before=await geometry();
 if(!before.clipped)return {needed:false,before,after:before};
 assert.ok(before.scrollHeight>before.clientHeight+1,`${name}: clipped upgrades require an internal reflow scroll`);
 await page.locator('.battle-view').evaluate(node=>node.scrollTo({top:node.scrollHeight,behavior:'instant'}));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const after=await geometry();
 assert.ok(after.scrollTop>before.scrollTop,`${name}: enlarged upgrades remain reachable by vertical scroll`);
 assert.ok(after.upgradesTop>=after.viewTop-1,`${name}: scrolled upgrades stay inside the battle view`);
 assert.ok(after.upgradesBottom<=Math.min(after.viewBottom,after.navTop)+1,`${name}: scrolled upgrades stay clear of fixed navigation`);
 return {needed:true,before,after};
}
async function measure(page,name,rootPx,max=false){
 const reflow=await revealUpgrades(page,name);
 const layout=await page.evaluate(()=>{
  const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  const ranges=node=>{const found=[];const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text;while(text=walker.nextNode()){if(text.parentElement.closest('small'))continue;for(const match of text.textContent.matchAll(/\S+/g)){const range=document.createRange();range.setStart(text,match.index);range.setEnd(text,match.index+match[0].length);found.push({word:match[0],fragments:[...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}))});}}return found;};
  const rows=[...document.querySelectorAll('.upgrade-row')].map(row=>{const label=row.querySelector('.upgrade-label>div'),button=row.querySelector('.buy-button'),price=button.querySelector('span')??button,r=rect(button),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {id:button.id,row:rect(row),labelRegion:rect(label),priceRegion:rect(price),purchase:r,labelPx:parseFloat(getComputedStyle(label).fontSize),pricePx:parseFloat(getComputedStyle(price).fontSize),label:ranges(label),price:ranges(price),icons:[...row.querySelectorAll('.icon')].map(rect),disabled:button.disabled,hit:hit===button||button.contains(hit)};});
  return {rootPx:parseFloat(getComputedStyle(document.documentElement).fontSize),rows,shell:rect(document.querySelector('.game-shell')),worldHeight:document.querySelector('#world').getBoundingClientRect().height,pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,nav:[...document.querySelectorAll('.nav-item')].map(rect),phase:document.querySelector('#world').dataset.phase,manualPaused:!document.querySelector('#pause-banner').hidden,controls:[...document.querySelectorAll('[data-unit],[data-skill],#pause,#speed,[data-command="settings"],.nav-item')].map(n=>({key:n.id||n.dataset.unit||n.dataset.skill||n.dataset.tab,group:n.matches('[data-unit]')?'unit':n.matches('[data-skill]')?'skill':n.matches('#pause,#speed')?'toggle':'essential',visible:n.checkVisibility(),disabled:n.disabled}))};
 });
 const contains=(a,b)=>b.left>=a.left-1&&b.right<=a.right+1&&b.top>=a.top-1&&b.bottom<=a.bottom+1;
 const overlaps=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
 assert.equal(layout.rootPx,rootPx);assert.equal(layout.rows.length,2);assert.ok(layout.worldHeight>=200);assert.ok(layout.pageWidth<=layout.viewport);
 for(const row of layout.rows){assert.ok(contains(layout.shell,row.row));assert.ok(contains(row.row,row.purchase));assert.ok(row.purchase.width>=44&&row.purchase.height>=44);assert.equal(row.labelPx,rootPx*(layout.viewport<=360?.625:.6875));assert.equal(row.pricePx,rootPx*.75);
  const other=layout.rows.find(r=>r!==row);
  for(const [kind,region,words] of [['label',row.labelRegion,row.label],['price',row.priceRegion,row.price]])for(const word of words){assert.equal(word.fragments.length,1,`${name} ${row.id} whole ${word.word}`);for(const fragment of word.fragments){assert.ok(contains(region,fragment),`${name}: ${kind} ${word.word} contained`);for(const obstacle of [...row.icons,other.row,...layout.nav,...(kind==='label'?[row.purchase]:[row.labelRegion])])assert.ok(!overlaps(fragment,obstacle),`${name}: ${word.word} intersects adjacent content`);}}
  if(max){assert.equal(row.disabled,true);assert.equal(row.price.map(w=>w.word).join(''),'MAX');}else{assert.equal(row.disabled,false);if(layout.viewport===640){await page.locator(`#${row.id}`).scrollIntoViewIfNeeded();}assert.equal(await page.locator(`#${row.id}`).evaluate(n=>{const r=n.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===n||n.contains(h);}),true);}
 }
 assert.ok(['ready','running'].includes(layout.phase),`${name}: expected an actual ready/running phase`);
 assert.equal(layout.controls.filter(c=>c.group==='unit').length,3,'all troop controls remain present');
 assert.equal(layout.controls.filter(c=>c.group==='skill').length,3,'all skill controls remain present');
 for(const control of layout.controls){
  const battleOnly=control.group==='skill'||control.group==='toggle';
  assert.equal(control.visible,!(layout.phase==='ready'&&battleOnly),`${name}: ${control.key} follows phase visibility`);
  if(control.group==='essential'||control.key==='speed')assert.equal(control.disabled,false,`${name}: ${control.key} remains available`);
  else if(control.key==='pause')assert.equal(control.disabled,layout.phase!=='running',`${name}: pause is available only while running`);
  else if(layout.phase==='ready'||layout.manualPaused)assert.equal(control.disabled,true,`${name}: deployment/skills reject ready or manual pause`);
 }
 diagnostics.cases.push({name,status:'passed',...layout,reflow,rowHeights:layout.rows.map(r=>r.row.height)});return layout;
}
async function capture(page,name){await page.screenshot({path:`${output}/${name}.png`,fullPage:true});diagnostics.screenshots.push(`${name}.png`);}
async function focusCaptures(page,prefix){for(const selector of ['#food-upgrade','#base-upgrade','.nav-item:first-child','.nav-item:last-child']){await page.keyboard.press('Tab');await capture(page,`${prefix}-${selector.replace(/[^a-z]/g,'')}-before`);await tabTo(page,selector);await page.locator(selector).scrollIntoViewIfNeeded();const s=await page.locator(selector).evaluate(n=>{const s=getComputedStyle(n);return {width:s.outlineWidth,offset:s.outlineOffset,style:s.outlineStyle};});assert.deepEqual(s,{width:'3px',offset:'-3px',style:'solid'});await capture(page,`${prefix}-${selector.replace(/[^a-z]/g,'')}-focused`);}}
async function session(viewport,rootPx,{max=false,landscape=false}={}){
 const context=await browser.newContext({viewport,deviceScaleFactor:2,reducedMotion:'reduce'});context.setDefaultTimeout(12000);const page=await context.newPage();
 page.on('pageerror',e=>diagnostics.pageErrors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
 const name=`${viewport.width}x${viewport.height}-root${rootPx}${max?'-max':''}`;
 try{const profile=Object.assign(defaultProfile(),{age:0,enemyAge:0,furthestBattle:0,foodLevel:max?100:23,baseLevel:max?100:23,coins:10000000,unlocked:[true,true,true],sound:false});assert.deepEqual(decodeSave(JSON.stringify(profile)).profile,profile);
  await page.route(`${origin}/__upgrade-setup`,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Seed</title>'}));await page.goto(`${origin}/__upgrade-setup`);await page.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,primary:SAVE_KEY,backup:BACKUP_KEY});await page.goto(origin,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active'&&!document.querySelector('.world-loader')&&document.querySelector('#world')?.dataset.phase==='ready');
  await page.evaluate(async px=>{document.documentElement.style.fontSize=`${px}px`;await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},rootPx);
  await measure(page,`${name}-ready`,rootPx,max);await capture(page,`${name}-ready`);if(max)return;
  if(landscape){for(const selector of ['#food-upgrade','#base-upgrade',...['battle','evolution','cards','skills'].map(t=>`[data-tab="${t}"]`)]){await tabTo(page,selector);await page.locator(selector).scrollIntoViewIfNeeded();assert.equal(await page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=-1&&r.bottom<=innerHeight+1&&(h===n||n.contains(h));}),true);}assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight));await capture(page,`${name}-natural-scroll`);return;}
  const model=new Game(profile);for(const [id,stat,key,expectedPrice] of [['food-upgrade','food','Enter','225.9k'],['base-upgrade','base','Space','298.5k']]){if(stat==='base'){await page.locator('[data-command="start"]').click();await page.waitForFunction(()=>document.querySelector('#world').dataset.phase==='running');await measure(page,`${name}-running`,rootPx);}await tabTo(page,`#${id}`);const handle=await page.locator(`#${id}`).elementHandle(),before=await save(page),cost=model.upgradeStatus(stat).cost;await page.keyboard.press(key);assert.equal(model.dispatch({type:'upgrade',stat}),true);const after=await save(page);assert.equal(after[`${stat}Level`],before[`${stat}Level`]+1);assert.equal(after.coins,before.coins-cost);assert.equal(await handle.evaluate(n=>n===document.activeElement&&n===document.getElementById(n.id)&&!n.disabled),true);assert.equal(await page.locator(`#${id}>span`).textContent(),expectedPrice);await handle.dispose();await measure(page,`${name}-after-${stat}`,rootPx);}
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'false','native Space purchase cannot pause a running battle');
  await page.locator('#pause').click();await page.waitForFunction(()=>!document.querySelector('#pause-banner').hidden);await measure(page,`${name}-manual-paused`,rootPx);await capture(page,`${name}-manual-paused`);
  if((viewport.width===320&&rootPx===32)||(viewport.width===390&&rootPx===16)){await focusCaptures(page,name);if(viewport.width===320){await page.emulateMedia({forcedColors:'active'});await focusCaptures(page,`${name}-forced-colors`);}}
 }catch(error){await capture(page,`${name}-failure`).catch(()=>{});throw error;}finally{await context.close();}
}
try{assert.ok(existsSync('dist/index.html'));server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4177','--strictPort'],{stdio:'pipe'});server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c);let started=false;for(let n=0;n<80;n++){if(server.exitCode!==null)throw Error(serverLog);try{started=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(started)break;await new Promise(r=>setTimeout(r,250));}assert.ok(started);browser=await chromium.launch({...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),headless:true});diagnostics.browser={name:'chromium',version:browser.version()};for(const viewport of [{width:320,height:568},{width:390,height:844}])for(const root of [16,20,24,32])await session(viewport,root);for(const root of [16,32])await session({width:320,height:568},root,{max:true});await session({width:640,height:320},32,{landscape:true});assert.deepEqual(diagnostics.pageErrors,[]);assert.deepEqual(diagnostics.assetFailures,[]);diagnostics.status='passed';console.log('Upgrade acceptance matrix passed; painted PNG review pending; native preference unverified.');}catch(error){diagnostics.error=error.stack;process.exitCode=1;console.error(error);}finally{diagnostics.serverLog=serverLog;writeFileSync(`${output}/diagnostics.json`,JSON.stringify(diagnostics,null,2));try{await browser?.close();}finally{server?.kill('SIGTERM');}}
