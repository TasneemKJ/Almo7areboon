/** Prepared exact-source Camp probe. Only fixture setup and explicitly isolated save-write faults alter storage. */
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

const expected=process.env.SOURCE_SHA,expectedTree=process.env.SOURCE_TREE,revision=process.env.REVIEW_REVISION,reviewCase=process.env.REVIEW_CASE;
assert.match(expected??'',/^[a-f0-9]{40}$/,'pin the published product source before running');
assert(['baseline','candidate'].includes(revision));
assert(['camp-390','camp-320-rotate','preferences-home-390'].includes(reviewCase));
assert.match(expectedTree??'',/^[a-f0-9]{40}$/,'pin the published product tree before running');
assert(revision!=='baseline'||reviewCase==='camp-390');
const viewportName=reviewCase==='camp-320-rotate'?'320x568':'390x844';
const [width,height]=viewportName.split('x').map(Number),root=process.cwd(),dist=resolve(root,'dist');
const harness=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(root,'artifacts/entry-review');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const pins=JSON.parse(readFileSync(resolve(harness,'source-pins.json'),'utf8'));assert.equal(expected,pins[revision==='candidate'?'candidateSha':'baselineSha']);assert.equal(expectedTree,pins[revision==='candidate'?'candidateTree':'baselineTree']);
assert.equal(git(['rev-parse','HEAD']),expected);assert.equal(git(['rev-parse','HEAD^{tree}']),expectedTree);git(['diff','--exit-code','HEAD','--']);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes=(base,paths)=>Object.fromEntries(paths.map(path=>[path,hash(readFileSync(resolve(base,path)))]));
const files=base=>readdirSync(base,{withFileTypes:true}).flatMap(row=>row.isDirectory()?files(resolve(base,row.name)):[resolve(base,row.name)]).sort();
const sourceRequire=createRequire(resolve(root,'package.json')),{chromium}=sourceRequire('playwright');
const {defaultProfile,decodeSave,SAVE_KEY,BACKUP_KEY}=await import(pathToFileURL(resolve(root,'src/game/save.ts')));
const {foodRate,foodUpgradeCost,baseUpgradeCost,unlockCost}=await import(pathToFileURL(resolve(root,'src/game/data.ts')));
const returningRaw=readFileSync(resolve(harness,'fixtures/returning-profile.json'),'utf8');
assert.equal(decodeSave(returningRaw).problem,null);assert.deepEqual(decodeSave(returningRaw).profile,JSON.parse(returningRaw));
const returningFixture=[returningRaw,returningRaw],fixtureSha256=hash(returningRaw);
const buildFiles=hashes(dist,files(dist).map(file=>relative(dist,file)));
const contextOptions={viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'no-preference',locale:'en-US'};
const manifest={schemaVersion:1,game:'Almo7areboon',sourceCommit:expected,sourceTree:git(['rev-parse','HEAD^{tree}']),revision,reviewCase,viewportName,
  workflowCommit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,context:{...contextOptions,cpuThrottle:4},
  sourceFilesSha256:hashes(root,['package-lock.json','src/main.ts','src/game/save.ts','src/game/save-session.ts','src/view/battlefield.ts',...(revision==='candidate'?['src/ui/entry-screen.ts','src/ui/results-screen.ts','src/ui/simple-entry.css','src/view/world-camp.ts','src/ui/field-controller.ts','src/ui/field-controls.ts','src/ui/field-focus.ts','src/ui/world-play.css','src/ui/camp-screen.ts','src/ui/camp-owner.ts','src/ui/camp.css','src/view/camp-illustrations.ts']:[])]),
  harnessFilesSha256:hashes(harness,['scripts/capture-entry.mjs','scripts/review-geometry.mjs','scripts/recovery-fixtures.mjs','scripts/emit-originals.py','source-pins.json','fixtures/returning-profile.json','.github/workflows/single-visual-review.yml']),
  buildFilesSha256:buildFiles,buildTreeSha256:hash(JSON.stringify(buildFiles)),
  scope:'Three independently scoped native jobs: same returning-profile ready Camp at390, candidate320→844 places/purchases/Battle, and separate Preferences/Home/recovery contexts.',
  fixtureSha256,fixtureSource:'Immutable shared returning-profile.json from baseline-compatible schema5; identical raw bytes for before/after',
  constraints:{noCSSInjection:true,noRendererReplacement:true,noSimulationMutation:true,noClockOverride:true,originalScreenshotScale:'css',advancedLeavesAccepted:false},
  cases:[],actions:[],nativeInputs:[],images:[],checks:[],errors:[],
  remainingGates:['Prepared harness is not evidence of native execution','Original-pixel art-direction review','Chronicle, Journey, Cards, Quests, Evolution, chapters and result Details remain dense and UNACCEPTED','No all-screen acceptance, physical iOS/Android, Safari, screen reader or listening claim','200% text, full background/lifecycle matrix and all remaining portrait widths require separate native checks','Ordinary first120seconds evidence is not replaced by this returning-Camp wave','Service workers are blocked; offline caching unverified']};
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
  saved:JSON.parse(localStorage.getItem(key)||'null'),food:document.querySelector('#food-count')?.textContent,wave:document.querySelector('#wave-label')?.textContent,campOwner:document.querySelector('#app')?.dataset.campOwner??null,
  active:document.activeElement?.id||document.activeElement?.getAttribute('data-command')||document.activeElement?.tagName,
  viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints},
  scroll:{x:scrollX,y:scrollY,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}}),SAVE_KEY);}
async function action(page,name,perform){const row={case:page.__case,name,startedAt:now(),before:await observe(page)};manifest.actions.push(row);
  try{await perform();row.endedAt=now();row.after=await observe(page);}catch(error){row.endedAt=now();row.error=String(error);throw error;}finally{persist();}}
async function settle(page){
 // Wait for actual finite modal animations only, with an explicit timeout. Never disable animation.
 await page.waitForTimeout(375);
 const record=async stage=>({stage,at:now(),case:page.__case,...await page.evaluate(()=>({heading:document.querySelector('#dialog-title')?.textContent,active:document.activeElement?.outerHTML,animations:document.getAnimations().map(a=>{const n=a.effect?.target,t=a.effect?.getComputedTiming();return {name:a.animationName??null,property:a.transitionProperty??null,playState:a.playState,currentTime:a.currentTime,startTime:a.startTime,pending:a.pending,connected:n?.isConnected,insideModal:n instanceof Element&&!!n.closest('#modal-layer'),target:n instanceof Element?n.outerHTML.slice(0,400):String(n),timing:t?{...t,iterations:String(t.iterations),endTime:String(t.endTime),activeDuration:String(t.activeDuration)}:null};})}))});
 const before=await record('before-settle');
 try {
 await page.waitForFunction(()=>document.getAnimations().filter(a=>{const n=a.effect?.target;return n instanceof Element&&n.closest('#modal-layer')&&a.effect.getComputedTiming().iterations!==Infinity;}).every(a=>a.playState!=='running'),null,{timeout:2500});
 } catch(error) {
  (manifest.animationDiagnostics??=[]).push(before,await record('settle-timeout'));persist();throw error;
 }
}
async function tap(page,selector){await action(page,`native touch ${selector}`,async()=>{await settle(page);const control=page.locator(selector);assert.equal(await control.count(),1,`unique scoped target ${selector}`);assertReachable(await control.evaluate(inspectControl));await control.tap();});}
async function scrollTap(page,selector){await page.locator(selector).scrollIntoViewIfNeeded();await tap(page,selector);}
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
async function open(caseName,{fixture=null,rendererFailure=false,dpr=null,saveWriteFault=false}={}){
  const context=await browser.newContext({...contextOptions,deviceScaleFactor:dpr??contextOptions.deviceScaleFactor});contexts.add(context);context.setDefaultTimeout(30000);
  const row={deviceScaleFactor:dpr??contextOptions.deviceScaleFactor,name:caseName,startedAt:now(),pageErrors:[],consoleErrors:[],requestFailures:[],assetFailures:[],blockedAssets:[]};manifest.cases.push(row);
  if(saveWriteFault){
   row.failureInjection={mechanism:'Isolated Storage.setItem failure for game primary/backup only; armed after native Camp focus opens. Real autosave and all other browser/app code unchanged.'};
   await context.addInitScript(({key,backup})=>{
    const nativeSetItem=Storage.prototype.setItem,fault={armed:false,attempts:[]};
    Object.defineProperty(window,'__campQAWriteFault',{value:fault});
    Storage.prototype.setItem=function(k,v){if(this===localStorage&&fault.armed&&(k===key||k===backup)){fault.attempts.push({key:k,at:performance.now()});throw new DOMException('Explicit QA save-write failure','QuotaExceededError');}return nativeSetItem.call(this,k,v);};
   },{key:SAVE_KEY,backup:BACKUP_KEY});
  }
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
  if(fixture){row.fixtureSha256=hash(fixture[0]);await page.evaluate(({key,backup,primary,secondary})=>{localStorage.setItem(key,primary);localStorage.setItem(backup,secondary);},{key:SAVE_KEY,backup:BACKUP_KEY,primary:fixture[0],secondary:fixture[1]});row.fixture={primary:JSON.parse(fixture[0]),backup:JSON.parse(fixture[1]),raw:storageStamp(fixture)};}
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
 await page.waitForFunction(()=>{const raw=document.querySelector('canvas')?.dataset.fieldCamp,world=document.querySelector('#world');if(!raw||!world)return false;const frame=JSON.parse(raw);return Math.abs(frame.width-world.clientWidth)<1&&Math.abs(frame.height-world.clientHeight)<1&&frame.rendered.some(actor=>actor.kind===0);});
 await action(page,'native touch on the actual painted recruit body',async()=>{
  const point=await page.locator(selector).evaluate(node=>{
   const canvas=document.querySelector('canvas'),origin=canvas.getBoundingClientRect(),report=JSON.parse(canvas.dataset.fieldCamp),actor=report.rendered.find(actor=>actor.kind===Number(node.dataset.fieldRecruit));
   if(!actor)return null;const b=actor.bounds,r=node.getBoundingClientRect(),paint={left:b.left+origin.left,right:b.right+origin.left,top:b.top+origin.top,bottom:b.bottom+origin.top};
   const x=(paint.left+paint.right)/2,y=(paint.top+paint.bottom)/2,hit=document.elementFromPoint(x,y);
   const intersection=Math.max(0,Math.min(paint.right,r.right)-Math.max(paint.left,r.left))*Math.max(0,Math.min(paint.bottom,r.bottom)-Math.max(paint.top,r.top));
   return {x,y,paint,frame:{width:report.width,height:report.height},canvas:{left:origin.left,top:origin.top,width:origin.width,height:origin.height},target:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},coverage:intersection/((paint.right-paint.left)*(paint.bottom-paint.top)),owns:hit===node||node.contains(hit),pixelRatio:report.pixelRatio};
  });
  (manifest.renderedContactAttempts??=[]).push({at:now(),point});persist();
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
 const notice=await page.locator('#session-notice').evaluate(n=>n.hidden?0:n.getBoundingClientRect().height);
 assert(bounds.world.height>=bounds.height-notice-1,'healthy field fills viewport; temporary field reserves only actual notice height');
 manifest.checks.push({name:label,passed:true,ui,physicalTargets:rows.filter(r=>r.world),bounds});persist();
}
async function assertReadyFrozen(page,name){
 const before=await observe(page);assert.equal(before.phase,'ready');await page.waitForTimeout(1500);const after=await observe(page);
 assert.equal(after.phase,'ready');assert.equal(after.food,before.food);assert.equal(after.wave,before.wave);assert.deepEqual(after.saved,before.saved);
 manifest.checks.push({name,passed:true,before,after,limitation:'Native phase/food/wave/save observations; exact internal elapsed clock and spawn timer require the source regression tests. No internal mutation or clock override.'});persist();
}
async function enterReadyCamp(page){await readyHome(page);assert.equal(await page.locator('#entry-secondary').textContent(),'Camp');await tap(page,'#entry-secondary');await page.waitForFunction(()=>document.querySelector('#app').dataset.entry==='play'&&document.querySelector('#world').dataset.phase==='ready');await settle(page);}
async function rootGeometry(page,label){
 await page.waitForFunction(()=>[...document.querySelectorAll('#camp-view img')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:15000});
 const controls=await visibleControls(page),places=await page.locator('#camp-view [data-camp-station]').count();
 assert.equal(places,4);assert.equal(controls.length,6,'Battle/Home plus exactly four physical places');
 const chrome=controls.filter(r=>r.command);assert.deepEqual(chrome.map(r=>r.command).sort(),['camp-battle','camp-home']);
 const rows=[];
 for(const button of await page.locator('#camp-view button').all()){const row=await button.evaluate(inspectControl);rows.push(row);assertReachable(row);}
 const illustrations=await page.locator('#camp-view [data-camp-station]').evaluateAll(nodes=>nodes.map(node=>({station:node.dataset.campStation,label:node.querySelector('.camp-place-name')?.textContent,art:node.querySelector('.camp-place-art')?.getBoundingClientRect().toJSON(),images:[...node.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),complete:i.complete,naturalWidth:i.naturalWidth})),svg:node.querySelectorAll('svg').length})));
 for(const place of illustrations){assert(place.label&&place.art.width>44&&place.art.height>44);assert(place.svg>0||place.images.length>0);assert(place.images.every(i=>i.complete&&i.naturalWidth>0));}
 const bounds=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,footer:document.querySelector('.camp-footer').getBoundingClientRect().toJSON()}));
 assert(bounds.sw<=bounds.w+1&&bounds.sh<=bounds.h+1,'Camp page must not overflow viewport');
 manifest.checks.push({name:label,passed:true,controls,rows,illustrations,bounds,artDirection:'Presence and dimensions only. Genuine composition must be judged from untouched original PNG pixels.'});persist();
}
async function focusGeometry(page,label,max,worldTargets=0){
 await settle(page);const controls=await visibleControls(page),buttons=await visibleControls(page,'button');
 assert.equal(controls.length,buttons.length,'focus has no hidden extra interactive fields');
 const physical=await page.locator('#modal-layer [data-camp-recruit]').count();assert.equal(physical,worldTargets);assert(buttons.length-worldTargets<=max&&buttons.length-worldTargets>0);
 const measurements=[];
 for(const loc of await page.locator('#modal-layer button').all()){
  await loc.scrollIntoViewIfNeeded();const row=await loc.evaluate(inspectControl);assertReachable(row);measurements.push(row);
 }
 assert.equal(await page.locator('#camp-view').evaluate(n=>n.inert),true,'underlying Camp is inert');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 manifest.checks.push({name:label,passed:true,buttons:buttons.length,worldTargets,measurements});persist();
}
async function backToCamp(page,station){
 await scrollTap(page,'#modal-layer [data-command="camp-back"]');await settle(page);
 assert.equal(await page.locator(`#camp-view [data-camp-station="${station}"]`).evaluate(n=>n===document.activeElement),true,'Back restores the originating physical place');
}
async function matchedCamp(){
 const session=await open('matched-returning-profile-ready-Camp',{fixture:returningFixture}),{page}=session;
 await enterReadyCamp(page);await assertReadyFrozen(page,'matched-ready-Camp-never-starts');
 if(revision==='candidate')await rootGeometry(page,'390-Camp-two-chrome-four-places');
 else manifest.checks.push({name:'baseline-ready-Camp-inventory',passed:true,controls:await visibleControls(page),scope:'Old ready dashboard is baseline evidence; not accepted under the new simplicity contract'});
 await capture(page,'ready-camp',revision==='baseline'?'Before: old ready Camp, exact53 and identical returning profile':'After: new physical ready Camp, same returning profile and390x844');
 runtimeClean(session.row);await close(session);
}
async function campTouchRotation(){
 const session=await open('returning-Camp-native-places-purchases-rotation-Battle',{fixture:returningFixture}),{page}=session;
 await enterReadyCamp(page);await rootGeometry(page,'320-Camp-root');await assertReadyFrozen(page,'320-ready-no-clock-food-or-waves');
 await capture(page,'ready-camp','Candidate ready physical Camp at320x568 before any transaction');
 // Opening/closing all four genuine places is profile-read-only and preserves ready state.
 for(const [station,max,figures]of[['storehouse',2,0],['gate',2,0],['company',3,3],['journal',3,0]]){
  const before=(await observe(page)).saved;await tap(page,`#camp-view [data-camp-station="${station}"]`);await focusGeometry(page,`${station}-isolated-focus`,max,figures);
  await assertReadyFrozen(page,`${station}-no-start`);assert.deepEqual((await observe(page)).saved,before);await backToCamp(page,station);assert.deepEqual((await observe(page)).saved,before);
 }
 // Real canonical food purchase: no inferred cost or test-only dispatch.
 await tap(page,'#camp-view [data-camp-station="storehouse"]');let before=(await observe(page)).saved;const cost=foodUpgradeCost(before);
 assert.equal(cost,50,'shared returning fixture has the independently specified initial price');
 assert.match(await page.locator('#modal-layer [data-command="camp-local-food"]').textContent(),new RegExp(`${cost} coins`));
 assert.match(await page.locator('.camp-values').textContent(),/0\.80 → 0\.94/);
 const foodBefore=(await observe(page)).food,artBefore=await page.locator('.camp-focus-art').innerHTML();
 await scrollTap(page,'#modal-layer [data-command="camp-local-food"]');
 await page.waitForFunction(({key,level})=>JSON.parse(localStorage.getItem(key)).foodLevel===level+1,{key:SAVE_KEY,level:before.foodLevel});
 const after=(await observe(page)).saved;assert.equal(after.coins,before.coins-cost);assert.equal(after.foodLevel,before.foodLevel+1);assert.equal((await observe(page)).food,foodBefore);
 assert.equal(await page.locator('.camp-focus-art').getAttribute('data-work-level'),'1');assert.notEqual(await page.locator('.camp-focus-art').innerHTML(),artBefore,'accepted first food upgrade changes actual illustration');
 assert.match(await page.locator('.camp-values').textContent(),new RegExp(foodRate(after).toFixed(2)));await focusGeometry(page,'paid-storehouse-native-actions',2);
 await page.locator('#dialog-title').scrollIntoViewIfNeeded();await capture(page,'paid-storehouse','Real50-coin food purchase updates rate, wallet and drawn work level');
 manifest.checks.push({name:'canonical-paid-food-exactly-once',passed:true,before:{coins:before.coins,foodLevel:before.foodLevel},after:{coins:after.coins,foodLevel:after.foodLevel},cost});
 await backToCamp(page,'storehouse');await tap(page,'#camp-view [data-camp-station="gate"]');before=(await observe(page)).saved;const gateCost=baseUpgradeCost(before);assert.equal(gateCost,40);assert.match(await page.locator('#modal-layer [data-command="camp-local-base"]').textContent(),/40 coins/);assert.match(await page.locator('.camp-values').textContent(),/180 → 252/);
 await scrollTap(page,'#modal-layer [data-command="camp-local-base"]');await page.waitForFunction(({key,level})=>JSON.parse(localStorage.getItem(key)).baseLevel===level+1,{key:SAVE_KEY,level:before.baseLevel});assert.equal((await observe(page)).saved.coins,before.coins-gateCost);await backToCamp(page,'gate');
 await tap(page,'#camp-view [data-camp-station="company"]');await scrollTap(page,'#modal-layer [data-camp-recruit="1"]');await focusGeometry(page,'locked-real-recruit-focus',2);before=(await observe(page)).saved;const joinCost=unlockCost(1,before);assert.equal(joinCost,150);assert.match(await page.locator('#modal-layer [data-command="camp-local-unlock"]').textContent(),/150 coins/);
 await scrollTap(page,'#modal-layer [data-command="camp-local-unlock"]');await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).unlocked[1],SAVE_KEY);
 assert.equal((await observe(page)).saved.coins,before.coins-joinCost);assert.equal((await observe(page)).saved.deployed,before.deployed,'Camp joins a recruit; it never deploys');
 await scrollTap(page,'#modal-layer [data-command="camp-back"]');await focusGeometry(page,'company-after-real-join',3,3);await backToCamp(page,'company');
 await key(page,'Tab');await tabTo(page,'#camp-view [data-camp-station="journal"]');assert((await page.locator('#camp-view [data-camp-station="journal"]').evaluate(inspectControl)).focusVisible);await key(page,'Enter');await settle(page);await key(page,'Escape');assert.equal(await page.locator('#camp-view [data-camp-station="journal"]').evaluate(n=>n===document.activeElement),true);
 await action(page,'native viewport rotation to844x390',()=>page.setViewportSize({width:844,height:390}));await settle(page);await rootGeometry(page,'844-landscape-Camp-root');await assertReadyFrozen(page,'rotated-ready-Camp-no-start');
 await capture(page,'landscape-camp','Same ready Camp after real viewport rotation to844x390');
 await action(page,'native viewport rotation back to320x568',()=>page.setViewportSize({width:320,height:568}));await settle(page);await rootGeometry(page,'320-restored-Camp-root');
 const deployed=(await observe(page)).saved.deployed;await tap(page,'#camp-view [data-command="camp-battle"]');await page.waitForFunction(()=>document.querySelector('#world').dataset.phase==='running');
 assert.equal((await observe(page)).saved.deployed,deployed,'Battle alone does not deploy');assert.equal(await page.locator('#camp-view').isVisible(),false);await fieldGeometry(page,'Battle-enters-physical-field');
 await tapPaintedRecruit(page,'[data-field-recruit="0"]');await page.waitForFunction(({key,n})=>JSON.parse(localStorage.getItem(key)).deployed===n+1,{key:SAVE_KEY,n:deployed});
 manifest.checks.push({name:'deliberate-Battle-start-then-native-recruit',passed:true,actual:await observe(page)});runtimeClean(session.row);await close(session);
}
async function flatPreferencesOwnership(){
 const session=await open('separate-empty-profile-flat-Preferences'),{page}=session;
 await readyHome(page);await tap(page,'#entry-settings');await page.getByRole('heading',{name:'Preferences',exact:true}).waitFor();
 const fields=await page.locator('#modal-layer input:not([type="file"]),#modal-layer select').count();assert.equal(fields,7);
 assert.equal(await page.locator('#modal-layer button').count(),3);assert.equal((await visibleControls(page,'button')).length,3,'background Home controls stay inert');
 await capture(page,'flat-preferences','Actual seven-field Preferences before native input; separate empty context');
 const sound=page.locator('#preference-sound'),handle=await sound.elementHandle();
 const clickLabel=async id=>{const selector=`label[for="${id}"]`;await page.locator(selector).scrollIntoViewIfNeeded();await tap(page,selector);};
 await clickLabel('preference-sound');assert.equal(await sound.isChecked(),false);assert(await handle.evaluate(n=>n===document.getElementById('preference-sound')),'preference changes keep native node');
 await clickLabel('preference-atmosphere');await clickLabel('preference-marks');
 for(const [id,value]of[['preference-speed','2'],['preference-motion','reduced']]){await page.locator('#'+id).scrollIntoViewIfNeeded();await tap(page,'#'+id);await key(page,'End');await key(page,'Enter');assert.equal(await page.locator('#'+id).inputValue(),value);}
 for(const id of ['effects-volume','atmosphere-volume']){await page.locator('#'+id).scrollIntoViewIfNeeded();await tabTo(page,'#'+id);const before=Number(await page.locator('#'+id).inputValue());await key(page,'ArrowLeft');assert.equal(Number(await page.locator('#'+id).inputValue()),Math.max(0,before-5));}
 const scroll=await page.evaluate(()=>({page:{x:scrollX,y:scrollY,w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight},dialog:{top:document.querySelector('.dialog').scrollTop,h:document.querySelector('.dialog').scrollHeight,client:document.querySelector('.dialog').clientHeight},viewport:{w:innerWidth,h:innerHeight}}));assert(scroll.page.x===0&&scroll.page.y===0&&scroll.page.w<=scroll.viewport.w+1&&scroll.page.h<=scroll.viewport.h+1,'only dialog may scroll');
 const footer=async command=>{await page.locator(`#modal-layer [data-command="${command}"]`).scrollIntoViewIfNeeded();await tap(page,`#modal-layer [data-command="${command}"]`);};
 await footer('save-recovery');assert.equal(await page.locator('#modal-layer button').count(),3);await footer('close');assert.equal(await page.locator('#modal-layer [data-command="save-recovery"]').evaluate(n=>n===document.activeElement),true);
 await footer('reset');assert.equal(await page.locator('#modal-layer button').count(),3);await key(page,'Escape');assert.equal(await page.locator('#modal-layer [data-command="reset"]').evaluate(n=>n===document.activeElement),true);
 const focus=await page.locator('#modal-layer [data-command="reset"]').evaluate(inspectControl);assertReachable(focus);await footer('close');
 assert.equal(await page.locator('#entry-settings').evaluate(n=>n===document.activeElement),true);assert.equal((await observe(page)).saved.played,undefined,'Settings alone cannot create play history');
 await page.reload({waitUntil:'networkidle'});await readyHome(page);assert.equal(await page.locator('#entry-play').textContent(),'Play');
 await tap(page,'#entry-play');await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).played===true,SAVE_KEY);
 await tap(page,'[data-command="field-pause"]');assert.equal(await page.locator('#modal-layer button').count(),3);await tap(page,'#modal-layer [data-command="settings"]');await footer('close');assert.equal(await page.locator('#modal-layer [data-command="settings"]').evaluate(n=>n===document.activeElement),true);
 await tap(page,'#modal-layer [data-command="home"]');assert.equal(await page.locator('#entry-secondary').textContent(),'Leave battle…');await tap(page,'#entry-secondary');assert.equal(await page.locator('#modal-layer button').count(),2);await key(page,'Escape');assert.equal(await page.locator('#entry-secondary').evaluate(n=>n===document.activeElement),true);
 await capture(page,'held-home','Actual running encounter held safely at Home after native leave cancellation');
 const before=await observe(page);await page.waitForTimeout(1400);const after=await observe(page);assert.equal(after.saved.deployed,before.saved.deployed);assert.equal(after.food,before.food,'held Home does not produce battle food');
 await tap(page,'#entry-secondary');await tap(page,'#modal-layer [data-command="confirm-leave-battle"]');await page.waitForFunction(()=>document.querySelector('#world').dataset.phase==='ready');await rootGeometry(page,'confirmed-leave-enters-ready-Camp');await assertReadyFrozen(page,'confirmed-leave-Camp-stays-ready');
 await tap(page,'#camp-view [data-command="camp-home"]');await readyHome(page);assert.equal(await page.locator('#entry-secondary').textContent(),'Camp');
 manifest.checks.push({name:'flat-Preferences-native-fields-scroll-and-held-Home',passed:true,fields,scroll,focus,actual:after,scope:'separate initially-empty context; no prepared profile'});runtimeClean(session.row);await close(session);
}
async function lateWarningInOwnedFocus(){
 const session=await open('isolated-late-save-warning-in-owned-Camp-focus',{fixture:returningFixture,saveWriteFault:true}),{page}=session;
 await enterReadyCamp(page);await tap(page,'#camp-view [data-camp-station="storehouse"]');await settle(page);await tabTo(page,'#modal-layer [data-command="camp-local-food"]');
 const notice=await page.locator('#camp-focus-save-status').elementHandle(),focused=await page.locator('#modal-layer [data-command="camp-local-food"]').elementHandle();
 const before=await observe(page),scrollBefore=await page.locator('#modal-layer .dialog').evaluate(n=>n.scrollTop),initial=await storage(page);
 assert.equal(await notice.evaluate(n=>n.hidden),true);
 await page.evaluate(()=>{window.__campQAWriteFault.armed=true;});
 await page.waitForFunction(()=>{const n=document.querySelector('#camp-focus-save-status');return n&&!n.hidden&&/Saving is unavailable/.test(n.textContent);},null,{timeout:12000});
 assert(await notice.evaluate(n=>n===document.querySelector('#camp-focus-save-status')),'same warning node');
 assert(await focused.evaluate(n=>n===document.activeElement),'same focused element');
 assert.equal(await page.locator('#modal-layer .dialog').evaluate(n=>n.scrollTop),scrollBefore,'same dialog scroll');
 const warning=await notice.evaluate(n=>({text:n.textContent,role:n.getAttribute('role'),live:n.getAttribute('aria-live'),rect:n.getBoundingClientRect().toJSON(),height:innerHeight}));
 assert(warning.rect.top>=0&&warning.rect.bottom<=warning.height,'new saving warning is visible inside owned focus');assert.equal(warning.live,'polite');
 assert.deepEqual(await storage(page),initial,'failed autosave retains both original save bytes');assert.equal((await observe(page)).phase,'ready');
 await capture(page,'late-saving-warning','Actual late autosave failure updates the existing Camp focus warning, without closing, replacing, refocusing or scrolling it');
 await page.evaluate(()=>{window.__campQAWriteFault.armed=false;});
 await page.waitForFunction(()=>document.querySelector('#camp-focus-save-status')?.hidden===true,null,{timeout:12000});
 assert(await notice.evaluate(n=>n===document.querySelector('#camp-focus-save-status')));assert(await focused.evaluate(n=>n===document.activeElement));assert.equal(await page.locator('#modal-layer .dialog').evaluate(n=>n.scrollTop),scrollBefore);
 const attempts=await page.evaluate(()=>window.__campQAWriteFault.attempts);assert(attempts.length>0,'the actual autosave attempted a blocked save-key write');
 manifest.checks.push({name:'late-warning-appears-and-clears-without-owner-replacement',passed:true,before,after:await observe(page),warning,attempts,scope:'Controlled save-write boundary failure only; does not represent a real browser quota exhaustion measurement'});runtimeClean(session.row);await close(session);
}
async function recoveryPreemptsCampFocus(){
 const session=await open('genuine-foreign-storage-recovery-preempts-Camp-focus',{fixture:returningFixture}),{page,context}=session;
 await enterReadyCamp(page);await tap(page,'#camp-view [data-camp-station="storehouse"]');await settle(page);
 const initial=await storage(page),foreign=context.newPage();const other=await foreign;
 const setup=`${origin}/__camp-foreign-storage`;await other.route(setup,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated same-origin storage writer</title>'}));await other.goto(setup);
 const changed=JSON.stringify({...JSON.parse(initial[0]),coins:4999});
 await action(page,'same-origin foreign storage write in second native page',()=>other.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:SAVE_KEY,raw:changed}));
 await page.waitForFunction(()=>document.querySelector('#app').dataset.saveSession==='conflict');
 assert.equal(await page.locator('#modal-layer .session-dialog').isVisible(),true);assert.equal(await page.locator('#modal-layer [data-command="camp-local-food"]').count(),0);
 const recovery=await observe(page);await key(page,'Escape');assert.equal((await observe(page)).session,'conflict','Escape cannot restore stale Camp focus');assert.deepEqual(await storage(page),[changed,initial[1]],'recovery preserves foreign primary and existing backup');
 manifest.checks.push({name:'recovery-supersedes-focused-Camp',passed:true,recovery,storage:storageStamp(await storage(page))});await other.close();runtimeClean(session.row);await close(session);
}
async function temporaryCampNotice(){
 const fixture=futureSaveFixture(defaultProfile,decodeSave),session=await open('future-save-temporary-Camp-owned-focus',{fixture}),{page}=session;
 await page.getByRole('heading',{name:'This save needs a newer game version',exact:true}).waitFor();await tap(page,'#modal-layer [data-command="session-temporary"]');await readyHome(page,'temporary');
 await tap(page,'#entry-play');await page.waitForFunction(()=>document.querySelector('#world').dataset.phase==='running');await tap(page,'[data-command="field-pause"]');await tap(page,'#modal-layer [data-command="home"]');await tap(page,'#entry-secondary');await tap(page,'#modal-layer [data-command="confirm-leave-battle"]');
 await page.waitForFunction(()=>document.querySelector('#world').dataset.phase==='ready');await tap(page,'#camp-view [data-camp-station="storehouse"]');await settle(page);
 const notice=await page.locator('#camp-focus-save-status').evaluate(n=>({text:n.textContent,hidden:n.hidden,rect:n.getBoundingClientRect().toJSON(),height:innerHeight}));
 assert(!notice.hidden&&/progress is not saved/.test(notice.text));assert(notice.rect.top>=0&&notice.rect.bottom<=notice.height);await assertReadyFrozen(page,'temporary-Camp-focus-ready-with-warning');assert.deepEqual(await storage(page),fixture,'temporary Camp must retain both future-save bytes');
 manifest.checks.push({name:'temporary-session-warning-inside-owned-focus',passed:true,notice});runtimeClean(session.row);await close(session);
}
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});manifest.browser={engine:'chromium',version:browser.version(),playwright:sourceRequire('playwright/package.json').version};
 if(reviewCase==='camp-390')await matchedCamp();
 else if(reviewCase==='camp-320-rotate')await campTouchRotation();
 else {await flatPreferencesOwnership();await lateWarningInOwnedFocus();await recoveryPreemptsCampFocus();await temporaryCampNotice();}
 assert(manifest.nativeInputs.every(event=>event.isTrusted),'all actual input must be browser-trusted');git(['diff','--exit-code','HEAD','--']);manifest.executionStatus='passed-awaiting-original-pixel-review';
}catch(error){manifest.errors.push({at:now(),error:String(error),stack:error.stack});manifest.executionStatus='failed';process.exitCode=1;
 const limit=revision==='baseline'?1:reviewCase==='camp-390'?2:3;
 if(activePage&&!activePage.isClosed()){
  if(manifest.images.filter(i=>i.transport).length>=limit)manifest.images.filter(i=>i.transport).at(-1).transport=false;
  await capture(activePage,'failure','Actual failed boundary; not visual acceptance').catch(error=>manifest.errors.push({captureError:String(error)}));
 }
}finally{for(const context of contexts)await context.close();await browser?.close();server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));persist();}
console.log('CAMP_REVIEW_SUMMARY '+JSON.stringify({sourceCommit:expected,revision,reviewCase,status:manifest.executionStatus,checks:manifest.checks.map(({name,passed})=>({name,passed})),errors:manifest.errors.map(({error})=>error)}));
