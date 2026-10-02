import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';

const out=process.env.MOBILE_OUT??'artifacts/mobile';
mkdirSync(out,{recursive:true});
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/__fixture'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Fixture</title>');return;}
 const file=resolve(root,`.${path==='/'?'/index.html':path}`);
 if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const report={status:'failed',cases:[],errors:[],browsers:{}};
let browser;
async function capture(page,name,phase){
 const data=await page.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const visible=e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden],[inert]');
  const controls=[...document.querySelectorAll('button,summary')].filter(visible).map(e=>{
   const rect=box(e),top=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
   return {command:e.dataset.command??e.dataset.tab??e.dataset.unit??'',text:e.innerText.trim().slice(0,70),disabled:!!e.disabled,...rect,reachable:!!top&&e.contains(top)};
  });
  const regions={};for(const s of ['.game-shell','#world','.stage','#ready','.deployment','.upgrades','.bottom-nav','#deploy-hint','#story-rally','.dialog']){const e=document.querySelector(s);if(e&&visible(e))regions[s]=box(e);}
  return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,session:document.querySelector('#app')?.dataset.saveSession,regions,controls};
 });
 await page.screenshot({path:`${out}/${name}-${phase}.png`});
 return {phase,...data};
}
async function run(engine,width,height,temporary=false){
 const name=`${engine}-${width}x${height}${temporary?'-temporary':''}`;
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 context.setDefaultTimeout(15000);const item={name,status:'failed',screens:[]};report.cases.push(item);
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push({name,message:error.message}));
 try{
  await page.goto(`${origin}/__fixture`);
  await page.evaluate(({p,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(p));localStorage.setItem(backup,JSON.stringify(p));},{p:{...defaultProfile(),sound:false,motion:'reduced'},primary:SAVE_KEY,backup:BACKUP_KEY});
  if(temporary)await page.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
  await page.goto(origin,{waitUntil:'networkidle'});
  if(temporary){await page.locator('[data-command="session-temporary"]').waitFor();item.screens.push(await capture(page,name,'recovery'));await page.locator('[data-command="session-temporary"]').tap();}
  await page.waitForFunction(expected=>document.querySelector('#app')?.dataset.saveSession===expected,temporary?'temporary':'active');
  await page.waitForFunction(()=>document.querySelector('#world canvas')?.width>0);
  item.screens.push(await capture(page,name,'ready'));
  await page.locator('[data-command="chronicle"]').tap();
  item.screens.push(await capture(page,name,'storybook'));
  await page.locator('.close-button').tap();
  await page.locator('[data-command="start"]').tap();
  await page.locator('[data-unit="0"]').tap();
  await page.locator('[data-command="pause"]').tap();
  await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='true');
  item.screens.push(await capture(page,name,'battle'));
  await page.locator('[data-command="settings"]').tap();
  item.screens.push(await capture(page,name,'settings'));
  await page.locator('.close-button').tap();
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true','closing a menu preserves manual pause');
  await page.locator('[data-tab="cards"]').tap();
  item.screens.push(await capture(page,name,'cards'));
  await page.locator('[data-tab="battle"]').tap();
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true','returning to battle preserves manual pause');
  if(process.env.MOBILE_ASSERT==='1'){
   for(const screen of item.screens){
    assert.ok(screen.scrollWidth<=width,`${name}/${screen.phase}: horizontal overflow`);
    const dialog=screen.regions['.dialog'];if(dialog)assert.ok(dialog.x>=0&&dialog.right<=width,`${name}/${screen.phase}: dialog overflows`);
    if(height>=540&&!dialog){for(const control of screen.controls.filter(c=>['battle','evolution','cards','skills'].includes(c.command)))assert.ok(control.y>=0&&control.bottom<=height&&control.reachable,`${name}/${screen.phase}: navigation ${control.command} is obscured`);}
   }
  }
  item.status='passed';console.log('PASS',name);
 }catch(error){item.error=error.stack;console.error('FAIL',name,error.message);await page.screenshot({path:`${out}/${name}-failure.png`}).catch(()=>{});}
 finally{await context.close();}
}
try{
 for(const engine of (process.env.MOBILE_ENGINES??'chromium').split(',')){
  const driver=engine==='webkit'?webkit:chromium;
  browser=await driver.launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});report.browsers[engine]=browser.version();
  for(const [w,h] of [[320,568],[360,640],[390,844],[430,932],[390,550],[844,390]])await run(engine,w,h);
  await run(engine,320,568,true);await run(engine,390,550,true);
  await browser.close();browser=null;
 }
 assert.deepEqual(report.errors,[],'no uncaught browser errors');assert.ok(report.cases.every(c=>c.status==='passed'));
 report.status='passed';
}catch(error){report.error=error.stack;process.exitCode=1;}
finally{writeFileSync(`${out}/diagnostics.json`,JSON.stringify(report,null,2));await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
