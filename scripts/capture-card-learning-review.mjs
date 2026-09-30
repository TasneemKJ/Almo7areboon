import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';
import {Game} from '../src/game/simulation.ts';
import {CARD_DEFS,cardProgress} from '../src/game/cards.ts';

const output='artifacts/browser-review/card-learning',origin='http://127.0.0.1:4187';
mkdirSync(output,{recursive:true});
const diagnostics={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),status:'failed',cases:[],pageErrors:[],assetFailures:[]};
let browser,server,serverLog='';
async function readable(locator){
 await locator.scrollIntoViewIfNeeded();const b=await locator.evaluate(n=>{const r=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);const text=range.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,font:parseFloat(getComputedStyle(n).fontSize),textTop:text.top,textBottom:text.bottom,overflow:n.scrollWidth>n.clientWidth+1};});
 assert.ok(b.font>=12&&b.left>=0&&b.right<=b.width&&b.top>=0&&b.bottom<=b.height&&b.textTop>=b.top-1&&b.textBottom<=b.bottom+1&&!b.overflow,JSON.stringify(b));return b;
}
async function session(viewport,copies){
 const name=`${['discovery','duplicate','level-up'][copies]}-${viewport.width}`,context=await browser.newContext({viewport,reducedMotion:'reduce'});let page;context.setDefaultTimeout(15000);
 try{
  const profile=defaultProfile();Object.assign(profile,{sound:false,motion:'reduced',cards:CARD_DEFS.map(card=>card.rarity==='common'?copies:0),summonCount:16*copies});
  // Historical copies are disclosed fixtures; the receipt is earned by a real pack click.
  const expected=new Game(profile);assert.equal(expected.dispatch({type:'summon',count:1}),true);const index=expected.profile.cards.findIndex((n,i)=>n>profile.cards[i]);assert.equal(CARD_DEFS[index].rarity,'common');
  const setup=await context.newPage();await setup.route(`${origin}/__setup`,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Save setup</title>'}));await setup.goto(`${origin}/__setup`);
  await setup.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile,primary:SAVE_KEY,backup:BACKUP_KEY});await setup.close();
  page=await context.newPage();page.on('pageerror',e=>diagnostics.pageErrors.push(e.message));page.on('response',r=>{if(/\/(art|assets)\//.test(r.url())&&!r.ok())diagnostics.assetFailures.push(`${r.status()} ${r.url()}`);});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');await page.locator('.nav-item[data-tab="cards"]').click();await page.locator('[data-pack="1"]').click();
  await page.getByRole('heading',{name:'1 card summoned',exact:true}).waitFor();
  await page.waitForFunction(({primary,backup,count})=>{const a=localStorage.getItem(primary);return a===localStorage.getItem(backup)&&JSON.parse(a??'{}').summonCount===count;},{primary:SAVE_KEY,backup:BACKUP_KEY,count:profile.summonCount+1});
  const receipt=page.locator('.summon-results article');assert.equal(await receipt.count(),1);assert.equal(await receipt.locator('strong').innerText(),CARD_DEFS[index].name);
  const text=await receipt.locator('.summon-learning').innerText();assert.match(text,copies===0?/This card: (Health|Damage) ×1\.00 → ×1\.03/:copies===1?/Next level: 1 \/ 2 copies/:/This card: (Health|Damage) ×1\.03 → ×1\.08/);
  const explanation=page.locator('.dialog>p');assert.match(await explanation.innerText(),/Bonuses apply automatically.*evolution and new timelines/);const introBounds=await readable(explanation),learningBounds=await readable(receipt.locator('.summon-learning'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${output}/card-receipt-${name}.png`});
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);assert.deepEqual(saved.cards,expected.profile.cards);assert.equal(saved.gems,0);assert.equal(saved.summonSeed,expected.profile.summonSeed);
  const close=page.locator('.big-button[data-command="close"]');assert.equal(await close.count(),1);await close.scrollIntoViewIfNeeded();const closeBounds=await close.evaluate(n=>{const b=n.getBoundingClientRect();return{height:b.height,top:b.top,bottom:b.bottom,viewport:innerHeight,hit:n.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))};});assert.ok(closeBounds.height>=44&&closeBounds.top>=0&&closeBounds.bottom<=closeBounds.viewport&&closeBounds.hit,JSON.stringify(closeBounds));
  await close.focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Cards',exact:true}).waitFor();assert.equal(await page.locator('.summon-results').count(),0);assert.equal(await page.locator('[data-pack="1"]').isDisabled(),true);
  const card=page.locator('.collection-card').nth(index);await card.scrollIntoViewIfNeeded();assert.match(await card.locator('.card-level').innerText(),new RegExp(`LEVEL ${cardProgress(expected.profile.cards[index]).level}`));await page.screenshot({path:`${output}/card-collection-${name}.png`});
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);assert.deepEqual(after.cards,saved.cards);assert.equal(after.gems,0);assert.equal(after.summonCount,saved.summonCount);
  diagnostics.cases.push({name,status:'passed',fixture:{commonCopies:copies,summonCount:profile.summonCount},actualPaidDraw:true,index,text,introBounds,learningBounds,closeBounds,saveMatchesPublicGame:true,noExtraDrawOnClose:true});
 }catch(error){diagnostics.cases.push({name,status:'failed',error:error.stack,lastUi:await page?.locator('.dialog').innerText().catch(()=>null)});await page?.screenshot({path:`${output}/card-failure-${name}.png`}).catch(()=>{});throw error;}finally{await context.close();}
}
try{
 assert.ok(existsSync('dist/index.html'));server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4187','--strictPort'],{stdio:'pipe'});server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c);
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(serverLog);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 browser=await chromium.launch({headless:true,timeout:30000});diagnostics.browser=browser.version();for(const viewport of [{width:320,height:568},{width:390,height:844}])for(const copies of [0,1,2])await session(viewport,copies);
 assert.equal(diagnostics.cases.length,6);assert.deepEqual(diagnostics.pageErrors,[]);assert.deepEqual(diagnostics.assetFailures,[]);diagnostics.status='passed';console.log('Card learning passed: 6 native production scenarios');
}catch(error){diagnostics.error=error.stack;process.exitCode=1;console.error(error);}finally{diagnostics.serverLog=serverLog;writeFileSync(`${output}/diagnostics.json`,JSON.stringify(diagnostics,null,2));try{await browser?.close();}finally{server?.kill('SIGTERM');}}
