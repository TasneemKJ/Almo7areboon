import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from 'playwright';
import {execFileSync} from 'node:child_process';
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
const report={revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:'failed',cases:[],errors:[],browsers:{}};
let browser;
async function capture(page,name,phase){
 // A state change can resize the canvas; allow layout and the next render frame to settle.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const data=await page.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const visible=e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden],[inert]');
  const controls=[...document.querySelectorAll('button,summary')].filter(visible).map(e=>{
   const rect=box(e),top=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
   return {command:e.dataset.command??e.dataset.tab??e.dataset.unit??(e.dataset.storyPage!==undefined?`story-page-${e.dataset.storyPage}`:''),dismiss:e.classList.contains('close-button'),text:e.innerText.trim().slice(0,70),disabled:!!e.disabled,...rect,reachable:!!top&&e.contains(top)};
  });
  const regions={};for(const s of ['.game-shell','#world','#battlefield','#world canvas','.stage','#ready','.deployment','.upgrades','.bottom-nav','#deploy-hint','#story-rally','.dialog']){const e=document.querySelector(s);if(e&&visible(e))regions[s]=box(e);}
  return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,session:document.querySelector('#app')?.dataset.saveSession,regions,controls};
 });
 await page.screenshot({path:`${out}/${name}-${phase}.png`});
 return {phase,...data};
}
async function run(engine,width,height,temporary=false,insets=null){
 const name=`${engine}-${width}x${height}${temporary?'-temporary':''}${insets?'-safe':''}`;
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 context.setDefaultTimeout(15000);const item={name,status:'failed',insets,issues:[],screens:[]};report.cases.push(item);
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push({name,message:error.message}));
 try{
  if(insets)await (await context.newCDPSession(page)).send('Emulation.setSafeAreaInsetsOverride',{insets});
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
  await page.locator('.dialog').evaluate(el=>el.scrollTop=400);
  item.screens.push(await capture(page,name,'storybook-scroll'));
  await page.locator('.close-button').tap();
  await page.locator('[data-command="start"]').tap();
  await page.locator('[data-unit="0"]').tap();
  item.screens.push(await capture(page,name,'running'));
  await page.locator('[data-command="story-rally"]').tap();
  await page.waitForFunction(()=>document.querySelector('#story-rally')?.getAttribute('aria-pressed')==='true');
  await page.locator('[data-command="story-rally"]').tap();
  await page.waitForFunction(()=>document.querySelector('#story-rally')?.getAttribute('aria-pressed')==='false');
  await page.locator('[data-command="pause"]').tap();
  await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='true');
  item.screens.push(await capture(page,name,'battle'));
  await page.locator('[data-command="settings"]').tap();
  item.screens.push(await capture(page,name,'settings'));
  await page.locator('.dialog').evaluate(el=>el.scrollTop=el.scrollHeight);
  item.screens.push(await capture(page,name,'settings-scroll'));
  await page.locator('.close-button').tap();
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true','closing a menu preserves manual pause');
  await page.locator('[data-tab="cards"]').tap();
  item.screens.push(await capture(page,name,'cards'));
  await page.locator('[data-tab="battle"]').tap();
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true','returning to battle preserves manual pause');
  if(height>=540&&!insets){
   const before=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);
   await page.setViewportSize({width:height,height:width});
   await page.waitForFunction(()=>document.querySelector('#world canvas')?.width>0);
   item.screens.push(await capture(page,name,'rotated'));
   await page.setViewportSize({width,height});
   assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true','rotation preserves manual pause');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY),before,'rotation cannot change saved progress');
  }
  await page.locator('[data-command="settings"]').tap();
  await page.locator('[data-command="retreat"]').tap();
  await page.getByRole('heading',{name:'REGROUP',exact:true}).waitFor();
  item.screens.push(await capture(page,name,'regroup'));
  await page.locator('[data-command="retry"]').tap();
  await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready');
  item.screens.push(await capture(page,name,'retry'));

  if(process.env.MOBILE_ASSERT==='1'){
   const check=(ok,message)=>{if(!ok)item.issues.push(message);};
   for(const screen of item.screens){
    const prefix=`${name}/${screen.phase}`,top=insets?.top??0,bottom=screen.height-(insets?.bottom??0);
    check(screen.scrollWidth<=screen.width,`${prefix}: horizontal overflow`);
    const world=screen.regions['#world'],surface=screen.regions['#battlefield'],canvas=screen.regions['#world canvas'];
    if(world){
     check(surface&&surface.height>=world.height-1&&surface.width>=world.width-1,`${prefix}: battlefield mount does not fill the visible world`);
     check(canvas&&canvas.height>0&&canvas.width>0,`${prefix}: battlefield canvas has no visible size`);
    }
    const dialog=screen.regions['.dialog'];if(dialog)check(dialog.x>=0&&dialog.right<=screen.width,`${prefix}: dialog overflows`);
    if(screen.height>=540&&!dialog){for(const c of screen.controls.filter(c=>['battle','evolution','cards','skills'].includes(c.command)))check(c.y>=top&&c.bottom<=bottom&&c.reachable,`${prefix}: navigation ${c.command} is obscured`);}
    for(const c of screen.controls.filter(c=>!c.disabled&&(c.command==='story-rally'||c.command.startsWith('story-page-'))))check(c.width>=44&&c.height>=44,`${prefix}: ${c.command} target is ${c.width}x${c.height}, below 44x44`);
    if(screen.phase==='ready'||screen.phase==='retry'){
     const a=screen.controls.find(c=>c.command==='battles');
     for(const b of screen.controls.filter(c=>c.command==='start'||c.command==='chronicle')){
      if(a)check(Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)<=0,`${prefix}: chapter selection overlaps ${b.command}`);
     }
    }
    const close=screen.controls.find(c=>c.dismiss);
    if(close)check(close.y>=top&&close.bottom<=bottom&&close.reachable,`${prefix}: close control is outside the safe visible area`);
   }
   assert.deepEqual(item.issues,[],`${name}: mobile layout boundaries`);
  }
  item.status='passed';console.log('PASS',name);
 }catch(error){item.error=error.stack;console.error('FAIL',name,error.message);await page.screenshot({path:`${out}/${name}-failure.png`}).catch(()=>{});}
 finally{await context.close();}
}
async function verifyPaintedWebkitBattlefield(browser){
 const name='webkit-390x844-painted-stress',item={name,status:'failed',issues:[],screens:[],observations:[]};report.cases.push(item);
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 context.setDefaultTimeout(15000);const page=await context.newPage();page.on('pageerror',error=>report.errors.push({name,message:error.message}));
 const tap=selector=>page.locator(selector).tap(),frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const painted=async(label,persist=false)=>{
  await frames();const file=`${out}/webkit-painted-${label}.png`,image=await page.screenshot(persist?{path:file}:{});
  const sample=await page.evaluate(async({encoded,roi,label})=>{
   const image=new Image();image.src=`data:image/png;base64,${encoded}`;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
   const pixels=context.getImageData(roi.x,roi.y,roi.width,roi.height).data;let count=0,sum=0,squares=0;
   for(let i=0;i<pixels.length;i+=4)for(const channel of [pixels[i],pixels[i+1],pixels[i+2]]){const value=channel/255;count++;sum+=value;squares+=value*value;}
   const mean=sum/count;return {label,rgbStddev:Math.sqrt(Math.max(0,squares/count-mean*mean))};
  },{encoded:image.toString('base64'),roi:{x:45,y:180,width:300,height:220},label});
  item.observations.push(sample);if(persist)item.screens.push(file.split('/').pop());
  assert.ok(sample.rgbStddev>=.15,`${label}: battlefield lost its painted scene (RGB stddev ${sample.rgbStddev})`);return sample;
 };
 try{
  await page.goto(`${origin}/__fixture`);
  await page.evaluate(({p,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(p));localStorage.setItem(backup,JSON.stringify(p));},{p:{...defaultProfile(),sound:false,motion:'reduced'},primary:SAVE_KEY,backup:BACKUP_KEY});
  await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  await painted('before',true);
  for(let cycle=1;cycle<=20;cycle++){
   await tap('[data-command="start"]');await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running');
   await painted(`cycle-${cycle}-start`,cycle===20);
   await tap('#pause');await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='true');
   for(const tab of ['cards','skills','evolution','battle'])await tap(`.bottom-nav [data-tab="${tab}"]`);
   await tap('[data-command="settings"]');await tap('[data-command="retreat"]');await page.getByRole('heading',{name:'REGROUP',exact:true}).waitFor();
   await tap('[data-command="retry"]');await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready');
   await painted(`cycle-${cycle}`,cycle===10||cycle===20);
  }
  item.status='passed';console.log('PASS',name);
 }catch(error){item.error=error.stack;console.error('FAIL',name,error.message);await page.screenshot({path:`${out}/${name}-failure.png`}).catch(()=>{});}
 finally{await context.close();}
}
try{
 for(const engine of (process.env.MOBILE_ENGINES??'chromium').split(',')){
  const driver=engine==='webkit'?webkit:chromium;
  browser=await driver.launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});report.browsers[engine]=browser.version();
  for(const [w,h] of [[320,568],[351,640],[360,640],[361,640],[390,844],[430,932],[390,550],[844,390]])await run(engine,w,h);
  await run(engine,320,568,true);await run(engine,390,550,true);
  if(engine==='webkit')await verifyPaintedWebkitBattlefield(browser);
  if(engine==='chromium'){await run(engine,390,844,false,{top:44,bottom:34,left:0,right:0});await run(engine,390,550,true,{top:44,bottom:34,left:0,right:0});}
  await browser.close();browser=null;
 }
 assert.deepEqual(report.errors,[],'no uncaught browser errors');assert.ok(report.cases.every(c=>c.status==='passed'));
 report.status='passed';
}catch(error){report.error=error.stack;process.exitCode=1;}
finally{writeFileSync(`${out}/diagnostics.json`,JSON.stringify(report,null,2));await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
