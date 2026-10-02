import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium,webkit} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';
import {simulateChronicle} from './simulate-chronicle.ts';

const output=process.env.UI_REVIEW_OUT??'artifacts/ui-recovery';
mkdirSync(output,{recursive:true});
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,`.${path==='/'?'/index.html':path}`);
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=process.env.REVIEW_URL??`http://127.0.0.1:${server.address().port}`;
const iterations=(process.env.UI_ITERATIONS??'1,2,3,4').split(',').map(Number);
const engines=(process.env.UI_ENGINES??'chromium').split(',');
const report={revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),origin,scope:'Real production UI; disclosed prepared victory and file-read-failure fixtures; browser emulation, not physical-device acceptance',status:'failed',cases:[],pageErrors:[],screens:[]};
let browser;
const pauseRender=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function shot(page,item,state){await pauseRender(page);const name=`${item.name}-${state}.png`;await page.screenshot({path:`${output}/${name}`});item.screens.push(name);report.screens.push(name);}
async function geometry(locator){return locator.evaluate(element=>{
  const rect=element.getBoundingClientRect(),top=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
  return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom,reachable:!!top&&element.contains(top),viewportWidth:innerWidth,viewportHeight:innerHeight};
});}
async function activeFocus(page){return page.evaluate(()=>{
  const element=document.activeElement;
  if(!(element instanceof HTMLElement))return {usable:false,tag:null};
  const rect=element.getBoundingClientRect();
  return {tag:element.tagName,id:element.id,command:element.dataset.command,tab:element.dataset.tab,usable:element!==document.body&&element!==document.documentElement&&!element.closest('[hidden],[inert]')&&!element.matches(':disabled')&&rect.width>0&&rect.height>0};
});}
async function run(iteration,engine,width,height){
  const item={name:`iteration-${iteration}-${engine}-${width}x${height}`,iteration,status:'failed',issues:[],metrics:{},screens:[]};report.cases.push(item);
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<600,isMobile:width<600,reducedMotion:'reduce'});
  context.setDefaultTimeout(15000);
  const p=iteration===3?simulateChronicle('road').profile:defaultProfile();p.sound=false;p.motion='reduced';
  await context.addInitScript(({profile,primary,backup})=>{
    if(!sessionStorage.getItem('ui-review-seeded')){
      localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));sessionStorage.setItem('ui-review-seeded','yes');
    }
  },{profile:p,primary:SAVE_KEY,backup:BACKUP_KEY});
  const page=await context.newPage();page.on('pageerror',error=>report.pageErrors.push({name:item.name,message:error.message}));
  const check=(condition,message)=>{if(!condition)item.issues.push(message);};
  try{
    await page.goto(origin,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active'&&document.querySelector('canvas')?.width>0);
    if(iteration===1){
      item.metrics.gems=await geometry(page.locator('.resources .gems'));
      await shot(page,item,'ready');
      await page.locator('.resources .gems').click();await page.getByRole('heading',{name:'Quests',exact:true}).waitFor();await shot(page,item,'quests');
      await page.locator('.close-button').click();await page.locator('[data-command="start"]').click();await page.locator('[data-unit="0"]').click();await page.locator('#pause').click();await shot(page,item,'battle');
      const r=item.metrics.gems;
      check(r.width>=44&&r.height>=44,`gems target is ${r.width}x${r.height}; expected at least 44x44`);
      check(r.reachable,'gems target must be unobscured');
    }else if(iteration===2){
      await page.locator('[data-command="settings"]').click();await shot(page,item,'settings-top');
      await page.locator('.dialog').evaluate(node=>{node.scrollTop=node.scrollHeight;});
      await shot(page,item,'settings-bottom');item.metrics.settingsClose=await geometry(page.locator('.close-button'));
      await page.locator('.close-button').click();await page.locator('.resources .gems').click();
      await page.locator('.dialog').evaluate(node=>{node.scrollTop=node.scrollHeight;});
      await shot(page,item,'quests-bottom');item.metrics.questsClose=await geometry(page.locator('.close-button'));
      for(const [name,r] of Object.entries(item.metrics))check(r.reachable&&r.y>=0&&r.bottom<=height,`${name}: scrolled dismiss control is outside the visible hit area`);
    }else if(iteration===3){
      await page.locator('.result-dialog').waitFor();await shot(page,item,'restored-victory');
      await page.locator('[data-command="retry"]').click();
      await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready');
      item.metrics.afterRetry=await activeFocus(page);await shot(page,item,'retry-focus');
      check(item.metrics.afterRetry.usable,'replaying a restored result must return focus to a visible usable game control');
      await page.keyboard.press('Tab');item.metrics.afterTab=await activeFocus(page);await shot(page,item,'keyboard-next');
      check(item.metrics.afterTab.usable,'keyboard navigation must remain usable after replay');
      const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);
      await page.reload({waitUntil:'networkidle'});await page.locator('[data-command="start"]').waitFor();
      const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);
      check(before.pendingVictory===null&&after.pendingVictory===null,'replay must consume the pending receipt without restoring it on reload');
      check(after.coins===before.coins&&after.gems===before.gems,'reloading after replay cannot credit the result twice');
    }else if(iteration===4){
      await page.locator('[data-command="settings"]').click();await shot(page,item,'before-import');
      const saved=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);
      await page.evaluate(()=>{
        window.__originalFileText=File.prototype.text;
        File.prototype.text=function(){return new Promise((_,reject)=>{window.__rejectFileRead=()=>reject(new Error('Disclosed file-read failure fixture'));});};
      });
      await page.locator('#import-save').setInputFiles({name:'saved-game.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});
      await page.evaluate(()=>window.__rejectFileRead());
      await page.waitForFunction(()=>document.querySelector('#toast')?.textContent?.includes('could not be read'));
      item.metrics.failedInputValue=await page.locator('#import-save').inputValue();
      await shot(page,item,'read-failure');
      check(item.metrics.failedInputValue==='','a failed import must clear the file input so the same file can be retried');
      await page.waitForFunction(()=>!document.querySelector('#toast')?.classList.contains('visible'),null,{timeout:7000});
      await page.locator('#import-save').setInputFiles({name:'another-game.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});
      await page.locator('.close-button').click();await page.locator('[data-tab="skills"]').first().click();
      await page.evaluate(()=>window.__rejectFileRead());await pauseRender(page);
      item.metrics.staleToast=await page.locator('#toast').evaluate(node=>node.classList.contains('visible'));
      await shot(page,item,'dismissed-import');
      check(!item.metrics.staleToast,'a dismissed import must not publish a late file-read error into another screen');
      check(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)===saved,'failed or dismissed imports must not change saved progress');
      await page.evaluate(()=>{File.prototype.text=window.__originalFileText;});
    }else throw new Error(`Unknown UI iteration ${iteration}`);
    assert.deepEqual(item.issues,[],item.name);item.status='passed';
  }catch(error){item.error=String(error);await page.screenshot({path:`${output}/${item.name}-failure.png`}).catch(()=>{});}
  finally{await context.close();console.log('CASE',JSON.stringify({name:item.name,status:item.status,issues:item.issues,metrics:item.metrics,error:item.error}));}
}
try{
  for(const engine of engines){
    assert.ok(engine==='chromium'||engine==='webkit',`unsupported engine ${engine}`);
    browser=await (engine==='webkit'?webkit:chromium).launch({headless:true});
    for(const iteration of iterations)for(const [width,height] of [[320,568],[390,844],[1024,768]])await run(iteration,engine,width,height);
    await browser.close();browser=null;
  }
  assert.deepEqual(report.pageErrors,[],'uncaught browser errors');
  assert.ok(report.cases.every(item=>item.status==='passed'),'UI recovery regressions');report.status='passed';
}catch(error){report.error=String(error);process.exitCode=1;}
finally{
  writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));console.log('SUMMARY',JSON.stringify({revision:report.revision,status:report.status,cases:report.cases.length,passed:report.cases.filter(item=>item.status==='passed').length,pageErrors:report.pageErrors,screens:report.screens.length}));
  await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
