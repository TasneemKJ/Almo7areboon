/** Native browser acceptance; prepared saves are isolated fixtures, not real-player data. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, webkit } from 'playwright';
import { defaultProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
const engine=process.env.QA_ENGINE??'chromium',out=process.env.QA_OUT??`artifacts/battle-banner/${engine}`;
assert(['chromium','webkit'].includes(engine));mkdirSync(out,{recursive:true});
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};let disconnected=false;
const server=createServer((req,res)=>{if(disconnected){req.socket.destroy();return;}const path=new URL(req.url,'http://localhost').pathname;res.setHeader('Cache-Control','no-store');if(path==='/__seed'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Isolated fixture</title>');return;}const file=resolve(root,`.${path==='/'?'/index.html':path}`);if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await ({chromium,webkit}[engine]).launch({headless:true});const report={revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),engine,browser:browser.version(),scope:'Production build, real native touchscreen controls, isolated prepared profiles; no hardware acceptance',cases:[],errors:[]};
const ready=p=>p.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready');
const phase=(p,name)=>p.waitForFunction(name=>document.querySelector('#world')?.dataset.phase===name,name);
const tap=async(p,s)=>{await p.locator(`${s}:visible`).tap();if(/journey|retreat|retry|settings|close-button|data-claim/.test(s))await p.waitForTimeout(360);};const save=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE_KEY);
const shot=(p,name)=>p.screenshot({path:`${out}/${name}.png`,fullPage:true});
async function layout(p){const m=await p.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth,canvas:[document.querySelector('canvas')?.width,document.querySelector('canvas')?.height]}));assert(m.scroll<=m.w+1);assert(m.canvas.every(v=>v>0));const sizes=[];for(const selector of ['button[data-order="advance"]','button[data-order="hold"]']){const b=await p.locator(selector).boundingBox();assert(b.width>=44&&b.height>=44);sizes.push(b.height);}assert(Math.abs(sizes[0]-sizes[1])<=1,'order benefits keep an equal-height command row');}
async function navigation(p){
 for(const tab of ['cards','battle']){
  const locator=p.locator(`.bottom-nav [data-tab="${tab}"]`);await locator.scrollIntoViewIfNeeded();
  assert(await locator.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
  await locator.tap();assert.equal(await locator.getAttribute('aria-current'),'page');
 }
}
async function deployment(p,order='advance'){
 await tap(p,'[data-command="start"]');await phase(p,'running');await tap(p,'[data-skill="food"]');
 for(let i=0;i<5;i++){await p.locator('[data-unit="0"]:enabled').waitFor();await tap(p,'[data-unit="0"]');}
 await p.locator(`button[data-order="${order}"]:enabled`).waitFor();await tap(p,`button[data-order="${order}"]`);
 await p.waitForFunction(order=>JSON.parse(document.querySelector('canvas')?.dataset.battleOrder??'null')?.order===order,order);
 assert.equal(await p.locator(`button[data-order="${order}"]`).getAttribute('aria-pressed'),'true');assert.equal(await p.locator('button[data-order="advance"]').isDisabled(),true);assert.equal(await p.locator('button[data-order="hold"]').isDisabled(),true);
}
async function retreat(p){await tap(p,'[data-command="settings"]');await tap(p,'[data-command="retreat"]');await p.getByRole('heading',{name:'REGROUP',exact:true}).waitFor();}
async function session(name,viewport,fn,reduced='reduce'){
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,reducedMotion:reduced});context.setDefaultTimeout(30000);const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{await p.goto(`${origin}/__seed`);const profile=defaultProfile();Object.assign(profile,{sound:false,motion:reduced==='reduce'?'reduced':'system',foodLevel:20,kills:10});profile.chronicle.enabled=false;
 await p.evaluate(({profile,k,b})=>{localStorage.setItem(k,JSON.stringify(profile));localStorage.setItem(b,JSON.stringify(profile));},{profile,k:SAVE_KEY,b:BACKUP_KEY});await p.goto(origin,{waitUntil:'networkidle'});await ready(p);await fn(p,context);assert.deepEqual(errors,[]);report.cases.push({name,viewport,status:'PASS'});
 }catch(e){report.cases.push({name,viewport,status:'FAIL',error:String(e),pageErrors:errors});await shot(p,`${name}-failure`).catch(()=>{});throw e;}finally{disconnected=false;await context.close();}}
try{
 for(const viewport of [{width:320,height:568},{width:390,height:844}])await session(`phone-${viewport.width}`,viewport,async p=>{
  await layout(p);await navigation(p);await shot(p,`${viewport.width}-ready`);await tap(p,'[data-command="journey"]');await p.getByRole('heading',{name:'Your journey',exact:true}).waitFor();const before=await save(p);await tap(p,'[data-claim="first-blood"]');assert.equal((await save(p)).gems,before.gems+50);assert.equal((await save(p)).claimed.filter(x=>x==='first-blood').length,1);await shot(p,`${viewport.width}-journey`);await tap(p,'.close-button');
  await deployment(p);await tap(p,'#pause');const label=await p.locator('.order-status').innerText();assert.match(label,/Paused/);const chargeBefore=await save(p);await p.waitForTimeout(400);assert.equal(await p.locator('.order-status').innerText(),label);assert.equal((await save(p)).deployed,chargeBefore.deployed);await shot(p,`${viewport.width}-advance-paused`);
  await p.setViewportSize({width:844,height:390});await layout(p);await navigation(p);assert.equal(await p.locator('#pause').getAttribute('aria-pressed'),'true');await shot(p,`${viewport.width}-landscape`);await p.setViewportSize(viewport);
  await retreat(p);await tap(p,'[data-command="journey"]');await p.getByRole('heading',{name:'Your journey',exact:true}).waitFor();await tap(p,'[data-command="journey-result"]');await p.getByRole('heading',{name:'REGROUP',exact:true}).waitFor();await tap(p,'[data-command="retry"]');await ready(p);await deployment(p,'hold');await shot(p,`${viewport.width}-hold`);
  await p.reload({waitUntil:'networkidle'});await ready(p);assert.equal(await p.locator('button[data-order="advance"]').isDisabled(),true);assert.match(await p.locator('.order-status').innerText(),/Deploy troops/);
 });
 await session('full-motion',{width:390,height:844},async p=>{await deployment(p);const info=await p.locator('canvas').getAttribute('data-battle-order');assert.equal(JSON.parse(info).reduced,false);await shot(p,'full-motion-advance');},'no-preference');
 await session('offline-return',{width:390,height:844},async(p,context)=>{
  await p.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');await p.reload({waitUntil:'networkidle'});await ready(p);
  // Stop actual origin access; independent uncached, worker-blocked control must fail.
  disconnected=true;const control=await browser.newContext({serviceWorkers:'block'});try{const c=await control.newPage();await assert.rejects(c.goto(origin,{timeout:10000}));}finally{await control.close();}
  const response=await p.reload({waitUntil:'networkidle'});assert(response.fromServiceWorker());await ready(p);await deployment(p);await shot(p,'offline-advance');
 });
 await session('twenty-cycles',{width:390,height:844},async p=>{
  for(let i=0;i<20;i++){await deployment(p,i%2?'hold':'advance');await retreat(p);await tap(p,'[data-command="retry"]');await ready(p);await p.waitForFunction(()=>!document.querySelector('canvas')?.dataset.battleOrder);assert.equal(await p.locator('canvas').getAttribute('data-battle-order'),null);if(i===9||i===19)await shot(p,`cycle-${i+1}`);}
 });
 report.status='PASS';console.log(`Battle banner ${engine}: ${report.cases.length} native sessions PASS;20 stress cycles`);
}catch(e){report.status='FAIL';report.error=String(e);process.exitCode=1;console.error(e);}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
