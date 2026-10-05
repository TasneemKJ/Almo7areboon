/** Unmodified production frames; actual input, canonical saved-profile fixture. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(), out=resolve(root,'artifacts/single-review');mkdirSync(out,{recursive:true});
const {chromium}=createRequire(resolve(root,'package.json'))('playwright');
const {defaultProfile,SAVE_KEY,BACKUP_KEY}=await import(pathToFileURL(resolve(root,'src/game/save.ts')));
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(source,process.env.SOURCE_SHA);
const manifest={sourceCommit:source,sourceTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),revision:process.env.REVIEW_REVISION,game:'Almo7areboon',languageCoverage:'English only; shipped game has no complete Arabic interface',images:[],checks:[],errors:[]};
const persist=()=>writeFileSync(resolve(out,'review-manifest.json'),JSON.stringify(manifest,null,2));
const dist=resolve(root,'dist'), mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;const file=resolve(dist,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(dist+sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
async function capture(page,label,width,height,mobile,reduced,scenario,transport){
 const filename=label+'.png',bytes=await page.screenshot({path:resolve(out,filename),fullPage:false,timeout:30000});
 manifest.images.push({path:filename,sha256:createHash('sha256').update(bytes).digest('hex'),viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,cpuThrottle:mobile?4:1,locale:'en',reducedMotion:reduced,scenario,transport});persist();
}
try{
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 const sizes=[[390,844],[1280,800]]; // Recovery: exact-source originals only; full matrix already passed.

 for(const [width,height,reduced=false] of sizes){
  const mobile=width!==1280,label=`${width}x${height}-${reduced?'reduced':'full'}-en`;
  const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1,reducedMotion:reduced?'reduce':'no-preference'});
  context.setDefaultTimeout(30000);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   const profile=defaultProfile();Object.assign(profile,{sound:false,motion:reduced?'reduced':'system',foodLevel:20,kills:10});profile.chronicle.enabled=false;
   await context.addInitScript(({profile,key,backup})=>{if(!sessionStorage.getItem('review-seeded')){localStorage.setItem(key,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));sessionStorage.setItem('review-seeded','1');}},{profile,key:SAVE_KEY,backup:BACKUP_KEY});
   if(mobile)await(await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate',{rate:4});
   await page.goto(origin,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready');
   const action=async selector=>{const el=page.locator(selector);if(mobile)await el.tap();else await el.click();};
   await action('[data-command="start"]');await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running');
   await action('[data-skill="food"]');
   for(let i=0;i<5;i++){await page.locator('[data-unit="0"]:enabled').waitFor();await action('[data-unit="0"]');}
   await page.locator('button[data-order="advance"]:enabled').waitFor();
   await page.waitForFunction(()=>!document.querySelector('canvas')?.dataset.villageWatchfire);
   const before=await page.evaluate(()=>({order:JSON.parse(document.querySelector('canvas')?.dataset.battleOrder??'null'),width:innerWidth,scroll:document.documentElement.scrollWidth,touch:navigator.maxTouchPoints}));
   if(manifest.revision==='candidate')assert.equal(before.order?.ready,true,'enabled command has visible ready pennant');
   assert(before.scroll<=before.width+1,'no horizontal overflow');if(mobile)assert(before.touch>0,'touch context');
   const selected=[390,844,1280].includes(width)&&!reduced;
   await capture(page,label+'-ready',width,height,mobile,reduced,'prepared constructor-produced profile; five real troop deployments; command enabled',selected);
   await action('button[data-order="advance"]');
   await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas')?.dataset.battleOrder??'null')?.order==='advance');
   const active=await page.evaluate(()=>JSON.parse(document.querySelector('canvas')?.dataset.battleOrder??'null'));
   await capture(page,label+'-advance',width,height,mobile,reduced,'same live battle; accepted Advance input',false);
   await action('#pause');const paused=await page.locator('#pause').getAttribute('aria-pressed');assert.equal(paused,'true');
   if(mobile){await page.setViewportSize({width:height,height:width});assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');await page.setViewportSize({width,height});}
   assert.deepEqual(errors,[]);manifest.checks.push({name:label,passed:true,before,active,paused});
  }catch(error){manifest.errors.push({scenario:label,error:String(error),pageErrors:errors});}
  finally{await context.close();persist();}
 }
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));persist();}
console.log(JSON.stringify({sourceCommit:source,images:manifest.images.length,checks:manifest.checks.length,errors:manifest.errors}));
if(manifest.errors.length)process.exitCode=1;
