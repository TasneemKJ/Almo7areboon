/** Native entry/result boundary probe. Initial first-play has EMPTY storage; no simulation/render/clock overrides. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,extname,sep,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {inspectControl,assertReachable} from './review-geometry.mjs';
import {rendererFailureFixture,futureSaveFixture} from './recovery-fixtures.mjs';

const expected=process.env.SOURCE_SHA,revision=process.env.REVIEW_REVISION,reviewCase=process.env.REVIEW_CASE;
assert.match(expected??'',/^[a-f0-9]{40}$/,'pin the published product source before running');
assert(['baseline','candidate'].includes(revision));
assert(['field-390','field-320-rotate'].includes(reviewCase));
assert(revision!=='baseline'||reviewCase==='field-390');
const viewportName=reviewCase==='field-390'?'390x844':'320x568';
const [width,height]=viewportName.split('x').map(Number),root=process.cwd(),dist=resolve(root,'dist');
const harness=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(root,'artifacts/entry-review');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git(['rev-parse','HEAD']),expected);git(['diff','--exit-code','HEAD','--']);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes=(base,paths)=>Object.fromEntries(paths.map(path=>[path,hash(readFileSync(resolve(base,path)))]));
const files=base=>readdirSync(base,{withFileTypes:true}).flatMap(row=>row.isDirectory()?files(resolve(base,row.name)):[resolve(base,row.name)]).sort();
const sourceRequire=createRequire(resolve(root,'package.json')),{chromium}=sourceRequire('playwright');
const {defaultProfile,decodeSave,SAVE_KEY,BACKUP_KEY}=await import(pathToFileURL(resolve(root,'src/game/save.ts')));
const buildFiles=hashes(dist,files(dist).map(file=>relative(dist,file)));
const contextOptions={viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'no-preference',locale:'en-US'};
const manifest={schemaVersion:1,game:'Almo7areboon',sourceCommit:expected,sourceTree:git(['rev-parse','HEAD^{tree}']),revision,reviewCase,viewportName,
  workflowCommit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,context:{...contextOptions,cpuThrottle:4},
  sourceFilesSha256:hashes(root,['package-lock.json','src/main.ts','src/game/save.ts','src/game/save-session.ts','src/view/battlefield.ts',...(revision==='candidate'?['src/ui/entry-screen.ts','src/ui/results-screen.ts','src/ui/simple-entry.css','src/view/world-camp.ts','src/ui/field-controller.ts','src/ui/field-controls.ts','src/ui/field-focus.ts','src/ui/world-play.css']:[])]),
  harnessFilesSha256:hashes(harness,['scripts/capture-entry.mjs','scripts/review-geometry.mjs','scripts/recovery-fixtures.mjs','scripts/emit-originals.py','.github/workflows/single-visual-review.yml']),
  buildFilesSha256:buildFiles,buildTreeSha256:hash(JSON.stringify(buildFiles)),
  scope:'Ordinary empty-profile first120seconds, real recruitment/commands and direct physical controls. No profile, simulation or clock mutation. Baseline is the same initial task before physical-play replacement.',
  firstPlay:{profile:'genuinely empty storage; no profile seeding',initialStorage:null},
  constraints:{noCSSInjection:true,noRendererReplacement:true,noSimulationMutation:true,noClockOverride:true,originalScreenshotScale:'css'},
  cases:[],actions:[],nativeInputs:[],images:[],checks:[],errors:[],
  remainingGates:['This bounded two-viewport wave does not accept all advanced screens','Exact published candidate browser execution','Original-pixel art-direction review','Advanced preparation/Settings/Details remain dense and unaccepted','This is one ordinary120-second input policy, not retention evidence','Physical touch, Safari, physical orientation and backgrounding are unverified','Service workers are blocked in the browser context so exact renderer fault interception is reliable; offline caching is unverified','Native audio full-suite unchanged and not rerun in this boundary probe','Victory, expedition provisions and full save-conflict matrix remain source-tested, not browser-certified by this probe']};
mkdirSync(out,{recursive:true});const persist=()=>writeFileSync(resolve(out,'review-manifest.json'),JSON.stringify(manifest,null,2));persist();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(dist,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(dist+sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(readFileSync(file));}
  catch{res.writeHead(404);res.end();}});
let browser,origin,activePage;const contexts=new Set();
const now=()=>new Date().toISOString();
const storage=page=>page.evaluate(({key,backup})=>[localStorage.getItem(key),localStorage.getItem(backup)],{key:SAVE_KEY,backup:BACKUP_KEY});
const storageStamp=raw=>raw.map(value=>value===null?null:{bytes:Buffer.byteLength(value),sha256:hash(value)});
async function observe(page){return page.evaluate(key=>({at:new Date().toISOString(),performanceMs:performance.now(),entry:document.querySelector('#app')?.dataset.entry??null,
  phase:document.querySelector('#world')?.dataset.phase??null,session:document.querySelector('#app')?.dataset.saveSession??null,
  renderer:document.querySelector('#battlefield')?.dataset.renderer??null,loader:!!document.querySelector('.world-loader'),
  result:document.querySelector('.compact-result')?.dataset.outcome??null,heading:document.querySelector('#dialog-title')?.textContent??null,
  entryPrimary:document.querySelector('#entry-play')?.textContent??null,subtitle:document.querySelector('#entry-subtitle')?.textContent??null,
  saved:JSON.parse(localStorage.getItem(key)||'null'),food:document.querySelector('#food-count')?.textContent,
  active:document.activeElement?.id||document.activeElement?.getAttribute('data-command')||document.activeElement?.tagName,
  viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints},
  scroll:{x:scrollX,y:scrollY,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}}),SAVE_KEY);}
async function action(page,name,perform){const row={case:page.__case,name,startedAt:now(),before:await observe(page)};manifest.actions.push(row);
  try{await perform();row.endedAt=now();row.after=await observe(page);}catch(error){row.endedAt=now();row.error=String(error);throw error;}finally{persist();}}
async function tap(page,selector){await action(page,`native touch ${selector}`,async()=>{await page.waitForTimeout(375);const control=page.locator(selector);assertReachable(await control.evaluate(inspectControl));await control.tap();});}
async function key(page,value){await action(page,`native keyboard ${value}`,()=>page.keyboard.press(value));}
async function tabTo(page,selector){for(let i=0;i<50;i++){if(await page.locator(selector).evaluate(node=>node===document.activeElement))return;await key(page,'Tab');}throw Error(`Tab could not reach ${selector}`);}
async function visibleControls(page,selector='button,a[href],input,select,textarea,summary,[role="button"]'){
  return page.locator(selector).evaluateAll(nodes=>nodes.filter(node=>node.checkVisibility()&&!node.closest('[hidden],[inert]')).map(node=>({id:node.id,command:node.getAttribute('data-command'),tag:node.tagName})));
}
async function strictScreen(page,name,selector,max){
  await page.waitForTimeout(250); // Let the untouched native modal animation finish.
  const loc=page.locator(selector),rows=[];
  for(let i=0;i<await loc.count();i++){const row=await loc.nth(i).evaluate(inspectControl);if(row.visible){assertReachable(row);rows.push(row);}}
  assert(rows.length>0&&rows.length<=max,`${name}: too many actions or none`);
  const scroll=await page.evaluate(()=>{const roots=[document.documentElement,...document.querySelectorAll('#entry-screen:not([hidden]),.dialog:has(>.compact-result)')];return roots.map(node=>({key:node.id||node.className,width:node.scrollWidth,clientWidth:node.clientWidth,height:node.scrollHeight,clientHeight:node.clientHeight,scrollTop:node.scrollTop,scrollLeft:node.scrollLeft}));});
  assert(scroll.every(row=>row.width<=row.clientWidth+1&&row.height<=row.clientHeight+1&&row.scrollTop===0&&row.scrollLeft===0),`${name}: ordinary entry/result needs scrolling`);
  const visible=await visibleControls(page);assert.equal(visible.length,rows.length,`${name}: extra visible controls outside primary surface`);
  manifest.checks.push({name,passed:true,at:now(),controls:rows,visible,scroll});persist();return rows;
}
async function capture(page,name,purpose){const before=await observe(page),viewport=page.viewportSize(),path=`${revision}-${viewport.width}x${viewport.height}-${name}.png`;
  const png=await page.screenshot({path:resolve(out,path),fullPage:false,scale:'css',timeout:30000});
  assert.equal(png.readUInt32BE(16),viewport.width);assert.equal(png.readUInt32BE(20),viewport.height);
  manifest.images.push({path,bytes:png.length,sha256:hash(png),screenshotScale:'css',viewport,purpose,transport:true,capturedAt:now(),observationBefore:before,observationAfter:await observe(page)});persist();}
async function open(caseName,{fixture=null,rendererFailure=false,dpr=null}={}){
  const context=await browser.newContext({...contextOptions,deviceScaleFactor:dpr??contextOptions.deviceScaleFactor});contexts.add(context);context.setDefaultTimeout(30000);
  const row={deviceScaleFactor:dpr??contextOptions.deviceScaleFactor,name:caseName,startedAt:now(),pageErrors:[],consoleErrors:[],requestFailures:[],assetFailures:[],blockedAssets:[]};manifest.cases.push(row);
  await context.exposeBinding('__entryQAInput',({page},event)=>manifest.nativeInputs.push({case:caseName,receivedAt:now(),...event}));
  await context.addInitScript(()=>{for(const type of ['pointerdown','pointerup','click','keydown'])document.addEventListener(type,event=>{
    const target=event.target instanceof Element?event.target.closest('button,input,summary,[tabindex]'):null;
    void window.__entryQAInput({type:event.type,isTrusted:event.isTrusted,eventTimeStamp:event.timeStamp,performanceMs:performance.now(),wallClock:new Date().toISOString(),key:event.key??null,pointerType:event.pointerType??null,target:target?.id||target?.getAttribute('data-command')||target?.getAttribute('data-unit')||target?.tagName||null});
  },true);});
  const page=await context.newPage();page.__case=caseName;activePage=page;
  page.on('pageerror',error=>row.pageErrors.push({at:now(),message:error.message}));
  page.on('console',message=>{if(message.type()==='error')row.consoleErrors.push({at:now(),text:message.text(),location:message.location()});});
  page.on('requestfailed',request=>row.requestFailures.push({at:now(),url:request.url(),resourceType:request.resourceType(),failure:request.failure()}));
  page.on('response',response=>{if(/\/(assets|art)\//.test(response.url())&&!response.ok())row.assetFailures.push({at:now(),url:response.url(),status:response.status()});});
  await (await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate',{rate:4});
  // A setup-only document inspects empty storage or seeds the explicitly separate recovery fixture.
  const setup=`${origin}/__entry-qa-setup`;
  await page.route(setup,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>QA storage setup only</title>'}));
  await page.goto(setup);const initial=await storage(page);
  assert.deepEqual(initial,[null,null],'new isolated context must start empty');
  row.initialStorage=storageStamp(initial);
  if(fixture){await page.evaluate(({key,backup,primary,secondary})=>{localStorage.setItem(key,primary);localStorage.setItem(backup,secondary);},{key:SAVE_KEY,backup:BACKUP_KEY,primary:fixture[0],secondary:fixture[1]});row.fixture={primary:JSON.parse(fixture[0]),backup:JSON.parse(fixture[1]),raw:storageStamp(fixture)};}
  if(rendererFailure){
    const chunks=Object.keys(buildFiles).filter(path=>/^assets\/battlefield-[^/]+\.js$/.test(path));assert.equal(chunks.length,1,'identify exact built renderer chunk');
    row.failureInjection={mechanism:'native Playwright route abort on exact built battlefield chunk',path:chunks[0]};
    await page.route(`${origin}/${chunks[0]}`,async route=>{row.blockedAssets.push({at:now(),url:route.request().url()});await route.abort('failed');});
  }
  await page.goto(origin,{waitUntil:'networkidle'});return {context,page,row,fixture};
}
async function close(session){session.row.finishedAt=now();await session.context.close();contexts.delete(session.context);if(activePage===session.page)activePage=null;persist();}
function runtimeClean(row,{expectedRendererFailure=false}={}){
  assert.deepEqual(row.pageErrors,[],`${row.name}: no uncaught runtime errors`);assert.deepEqual(row.assetFailures,[],`${row.name}: no unexpected HTTP asset failures`);
  if(expectedRendererFailure){
    const urls=new Set(row.blockedAssets.map(value=>value.url));assert(urls.size===1&&row.blockedAssets.length>=1,'renderer chunk was actually blocked');
    assert(row.requestFailures.length>=1,'native failed request observed');
    assert(row.requestFailures.every(value=>urls.has(value.url)&&value.failure?.errorText==='net::ERR_FAILED'),'only the explicitly aborted renderer request may fail');
    assert(row.consoleErrors.every(value=>urls.has(value.location?.url)&&/Failed to load resource: net::ERR_FAILED/.test(value.text)),'only exact aborted-asset console diagnostics are expected');
    row.expectedRawAssetFailure={classification:'deliberate renderer-import fault, not a clean normal-load case',blockedAssets:row.blockedAssets,requestFailures:row.requestFailures,consoleErrors:row.consoleErrors};
  }else{assert.deepEqual(row.requestFailures,[],`${row.name}: no failed requests`);assert.deepEqual(row.consoleErrors,[],`${row.name}: no console errors`);}
  row.runtimePassed=true;persist();
}
async function readyHome(page,session='active'){
  await page.waitForFunction(expected=>document.querySelector('#app')?.dataset.entry==='home'&&document.querySelector('#app')?.dataset.saveSession===expected&&document.querySelector('#battlefield')?.dataset.renderer==='ready'&&!document.querySelector('.world-loader')&&!document.querySelector('#entry-play')?.disabled,session);
  await page.evaluate(()=>document.fonts.ready);
}
async function assertFrozenHome(page,name){const before=await observe(page);await page.waitForTimeout(1500);const after=await observe(page);
  assert.equal(before.entry,'home');assert.equal(after.entry,'home');assert.notEqual(after.phase,'running');assert.equal(after.phase,before.phase);
  assert.equal(after.saved?.deployed??0,before.saved?.deployed??0);assert.equal(after.saved?.wins??0,before.saved?.wins??0);
  manifest.checks.push({name,passed:true,before,after,limitation:'Home hides battle HUD; unchanged/absent world phase is a native no-unintended-start check, not a direct simulation-clock reading. Source regression tests establish freeze.'});persist();}
async function tapPaintedRecruit(page,selector){
 await page.waitForFunction(()=>{const raw=document.querySelector('canvas')?.dataset.fieldCamp;if(!raw)return false;return JSON.parse(raw).rendered.some(actor=>actor.kind===0);});
 await action(page,'native touch on the actual painted recruit body',async()=>{
  const point=await page.locator(selector).evaluate(node=>{
   const canvas=document.querySelector('canvas'),origin=canvas.getBoundingClientRect(),report=JSON.parse(canvas.dataset.fieldCamp),actor=report.rendered.find(actor=>actor.kind===Number(node.dataset.fieldRecruit));
   if(!actor)return null;const b=actor.bounds,r=node.getBoundingClientRect(),paint={left:b.left+origin.left,right:b.right+origin.left,top:b.top+origin.top,bottom:b.bottom+origin.top};
   const x=(paint.left+paint.right)/2,y=(paint.top+paint.bottom)/2,hit=document.elementFromPoint(x,y);
   const intersection=Math.max(0,Math.min(paint.right,r.right)-Math.max(paint.left,r.left))*Math.max(0,Math.min(paint.bottom,r.bottom)-Math.max(paint.top,r.top));
   return {x,y,paint,target:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},coverage:intersection/((paint.right-paint.left)*(paint.bottom-paint.top)),owns:hit===node||node.contains(hit),pixelRatio:report.pixelRatio};
  });
  assert(point&&point.owns&&point.coverage>=.88,'painted recruit must overlap and own its native target');
  manifest.checks.push({name:'painted-recruit-owns-native-contact',passed:true,point});await page.touchscreen.tap(point.x,point.y);
 });
}
async function tapMovingEnemy(page){
 await action(page,'native touch on live enemy body without stability wait',async()=>{
  const row=await page.locator('#field-enemy').evaluate(inspectControl);assertReachable(row);
  const x=(row.box.left+row.box.right)/2,y=(row.box.top+row.box.bottom)/2;
  manifest.checks.push({name:'live-enemy-native-contact',passed:true,x,y,row});await page.touchscreen.tap(x,y);
 });
}
async function fieldGeometry(page,label){
 const rows=await page.locator('button,input,select,summary,a[href]').evaluateAll(nodes=>nodes.filter(n=>n.checkVisibility()&&!n.closest('[hidden],[inert]')).map(n=>({world:!!n.closest('#field-targets'),id:n.id,command:n.dataset.command,text:n.getAttribute('aria-label')||n.textContent})));
 const ui=rows.filter(r=>!r.world);assert(ui.length<=3,`${label}: ${ui.length} visible chrome controls`);
 const measured=[];for(const node of await page.locator('#field-targets button,.field-chrome button').all()){if(await node.isVisible())measured.push(await node.evaluate(inspectControl));}
 const scrollOwners=await page.locator('#app,.game-shell,#world,#field-targets').evaluateAll(nodes=>nodes.map(n=>({id:n.id,cls:n.className,left:n.scrollLeft,top:n.scrollTop,width:n.clientWidth,height:n.clientHeight,scrollWidth:n.scrollWidth,scrollHeight:n.scrollHeight})));
 (manifest.geometryAttempts??=[]).push({label,measured,scrollOwners});persist();
 for(const row of measured)assertReachable(row);
 const bounds=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,world:document.querySelector('#world').getBoundingClientRect().toJSON()}));
 assert(bounds.scrollWidth<=bounds.width+1&&bounds.scrollHeight<=bounds.height+1,'active field must fit viewport');
 assert(bounds.world.height>=bounds.height-30,'field should own nearly all available height');
 manifest.checks.push({name:label,passed:true,ui,physicalTargets:rows.filter(r=>r.world),bounds});persist();
}
async function ordinaryField(){
 const session=await open('ordinary-empty-profile-120seconds'),{page}=session;
 manifest.firstPlay.initialStorage=session.row.initialStorage;
 await readyHome(page);await tap(page,'#entry-play');
 await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running');
 const recruit=revision==='baseline'?'#unit-cards [data-unit="0"]':'[data-field-recruit="0"]';
 if(revision==='baseline')await tap(page,recruit);else await tapPaintedRecruit(page,recruit);await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'{}').deployed===1,SAVE_KEY);
 const first=await observe(page);assert.equal(first.saved.foodLevel,0);assert.equal(first.saved.deployed,1);
 if(revision==='baseline'){
  await capture(page,'active-before','Ordinary empty-profile first deployment before physical-play replacement');runtimeClean(session.row);await close(session);return;
 }
 await fieldGeometry(page,'first-recruit-one-chrome-control');
 await capture(page,'active-after','Ordinary empty-profile first deployment, actual painted world and native controls');
 // Native keyboard takes the same physical recruit path, with no hidden-action shortcut.
 await key(page,'Tab');await tabTo(page,recruit);assert((await page.locator(recruit).evaluate(inspectControl)).focusVisible);
 const keyboardBefore=(await observe(page)).saved.deployed;
 await key(page,'Enter');await page.waitForFunction(({key,n})=>JSON.parse(localStorage.getItem(key)||'{}').deployed===n+1,{key:SAVE_KEY,n:keyboardBefore});
 const gather='#field-standard';await tap(page,gather);assert.equal(await page.locator(gather).getAttribute('aria-pressed'),'true');
 if(reviewCase==='field-320-rotate'){
  await action(page,'native viewport rotation to844x390',()=>page.setViewportSize({width:844,height:390}));await page.waitForTimeout(600);
  await fieldGeometry(page,'rotated-field-targets');await capture(page,'landscape-field','Actual running field after native viewport rotation');
  await action(page,'native viewport rotation back to320x568',()=>page.setViewportSize({width:320,height:568}));await page.waitForTimeout(600);await fieldGeometry(page,'restored-portrait-field-targets');
 }
 let lastRecruit=0,gathered=false,released=false,selected=false,order=false;
 const samples=[];
 while(await page.evaluate(()=>performance.now())<120000){
  const state=await observe(page);samples.push({at:state.performanceMs,phase:state.phase,deployed:state.saved?.deployed,food:state.food,coins:state.saved?.coins});
  if(state.phase==='won'||state.phase==='lost'){
   await page.locator('.compact-result').waitFor();await strictScreen(page,'ordinary-outcome-three-actions','.compact-result button',3);
   const left=120000-await page.evaluate(()=>performance.now());if(left>0)await page.waitForTimeout(left);break;
  }
  if(state.phase==='running'){
   if(!selected&&await page.locator('#field-enemy').isVisible()){
    const skills=()=>page.locator('#battle-skills [data-skill]').evaluateAll(nodes=>nodes.filter(n=>n.classList.contains('used')).map(n=>n.dataset.skill));
    const before=await skills();await tapMovingEnemy(page);
    assert.deepEqual(await skills(),before,'selection alone cannot cast any skill; ordinary combat remains running');
    await fieldGeometry(page,'selected-enemy-at-most-three-chrome');await key(page,'Escape');selected=true;
   }
   if(Date.now()-lastRecruit>4200&&await page.locator(recruit).getAttribute('aria-disabled')==='false'){
    const count=(await observe(page)).saved.deployed;await tapPaintedRecruit(page,recruit);lastRecruit=Date.now();
    await page.waitForFunction(({key,n})=>JSON.parse(localStorage.getItem(key)||'{}').deployed===n+1,{key:SAVE_KEY,n:count});gathered=true;
   }
   if(gathered&&!released&&await page.locator(gather).getAttribute('aria-label').then(s=>/Release [1-6]/.test(s||''))){await tap(page,gather);assert.equal(await page.locator(gather).getAttribute('aria-pressed'),'false');released=true;}
   if(!order&&await page.locator('[data-field-gate="advance"]').getAttribute('aria-disabled')==='false'){
    await tap(page,'[data-field-gate="advance"]');assert.equal(await page.locator('[data-field-gate="advance"]').getAttribute('aria-pressed'),'true');order=true;
   }
  }
  await page.waitForTimeout(650);
 }
 const final=await observe(page);assert(final.performanceMs>=120000,'full ordinary observation window');assert(final.saved.deployed>=3,'ordinary repeated recruitment happened');assert(released,'real Gather followed by Release');
 manifest.checks.push({name:'ordinary-empty-profile-first120seconds',passed:true,first,final,samples,selectedEnemy:selected,canonicalOrderIssued:order,realGatherRelease:released,note:'No advanced state injected. This is one ordinary recruitment policy, not retention or difficulty proof.'});
 await capture(page,'after120','Actual outcome or continuing battle after ordinary first120seconds');runtimeClean(session.row);await close(session);
}
async function dprOneContact(){
 const session=await open('ordinary-empty-profile-DPR1',{dpr:1}),{page}=session;
 await readyHome(page);await tap(page,'#entry-play');await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running');
 await tapPaintedRecruit(page,'[data-field-recruit="0"]');await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'{}').deployed===1,SAVE_KEY);
 await fieldGeometry(page,'DPR1-rendered-recruit-owns-touch');const actual=await observe(page);assert.equal(actual.viewport.dpr,1);
 manifest.checks.push({name:'DPR1-actual-world-contact',passed:true,actual});runtimeClean(session.row);await close(session);
}
async function temporaryFieldNotice(){
 const fixture=futureSaveFixture(defaultProfile,decodeSave),session=await open('explicit-future-save-temporary-field',{fixture}),{page}=session;
 await page.getByRole('heading',{name:'This save needs a newer game version',exact:true}).waitFor();await tap(page,'[data-command="session-temporary"]');await readyHome(page,'temporary');await tap(page,'#entry-play');
 const notice=await page.locator('#session-notice').evaluate(node=>{const r=node.getBoundingClientRect(),world=document.querySelector('#world').getBoundingClientRect();return {hidden:node.hidden,text:node.textContent,top:r.top,bottom:r.bottom,height:r.height,width:r.width,viewportHeight:innerHeight,worldBottom:world.bottom};});
 (manifest.temporaryMeasurements??=[]).push(notice);persist();
 assert(!notice.hidden&&/progress is not saved/.test(notice.text));assert(notice.top>=0&&notice.bottom<=notice.viewportHeight&&notice.height>=28,'temporary-session warning must remain inside visible viewport');assert(notice.worldBottom<=notice.top+1,'field must not cover temporary-session warning');
 await page.waitForTimeout(5500);assert.deepEqual(await storage(page),fixture,'temporary play never writes future primary or backup');manifest.checks.push({name:'temporary-field-notice-and-safe-storage',passed:true,notice});runtimeClean(session.row);await close(session);
}
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});manifest.browser={engine:'chromium',version:browser.version(),playwright:sourceRequire('playwright/package.json').version};
 await ordinaryField();if(revision==='candidate'){if(reviewCase==='field-390')await dprOneContact();else await temporaryFieldNotice();}assert(manifest.nativeInputs.every(event=>event.isTrusted),'all actual input must be browser-trusted');git(['diff','--exit-code','HEAD','--']);manifest.executionStatus='passed-awaiting-original-pixel-review';
}catch(error){manifest.errors.push({at:now(),error:String(error),stack:error.stack});manifest.executionStatus='failed';process.exitCode=1;
 const limit=revision==='baseline'?1:reviewCase==='field-390'?2:3;
 if(activePage&&!activePage.isClosed()){
  if(manifest.images.length>=limit)manifest.images.at(-1).transport=false;
  await capture(activePage,'failure','Actual failed boundary; not visual acceptance').catch(error=>manifest.errors.push({captureError:String(error)}));
 }
}finally{for(const context of contexts)await context.close();await browser?.close();server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));persist();}
console.log('FIELD_REVIEW_SUMMARY '+JSON.stringify({sourceCommit:expected,revision,reviewCase,status:manifest.executionStatus,checks:manifest.checks.map(({name,passed})=>({name,passed})),errors:manifest.errors.map(({error})=>error)}));
