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
assert(['compare-390','small-320-rotate'].includes(reviewCase));
assert(revision!=='baseline'||reviewCase==='compare-390');
const viewportName=reviewCase==='compare-390'?'390x844':'320x568';
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
  sourceFilesSha256:hashes(root,['package-lock.json','src/main.ts','src/game/save.ts','src/game/save-session.ts','src/view/battlefield.ts',...(revision==='candidate'?['src/ui/entry-screen.ts','src/ui/results-screen.ts','src/ui/simple-entry.css']:[])]),
  harnessFilesSha256:hashes(harness,['scripts/capture-entry.mjs','scripts/review-geometry.mjs','scripts/recovery-fixtures.mjs','scripts/emit-originals.py','.github/workflows/single-visual-review.yml']),
  buildFilesSha256:buildFiles,buildTreeSha256:hash(JSON.stringify(buildFiles)),
  scope:'Entry/result boundary only. Fresh empty browser profile; Home, Settings, real Play, one genuine troop deployment, deliberate Settings > Retreat defeat, short result, Details, Home, Continue. No dense-main-play or 120-second acceptance.',
  firstPlay:{profile:'genuinely empty storage; no profile seeding',initialStorage:null},
  constraints:{noCSSInjection:true,noRendererReplacement:true,noSimulationMutation:true,noClockOverride:true,originalScreenshotScale:'css'},
  cases:[],actions:[],nativeInputs:[],images:[],checks:[],errors:[],
  remainingGates:['Exact published candidate browser execution','Original-pixel art-direction review','Dense main-play simplification is outside this slice and remains unaccepted','Full 120-second play acceptance is not claimed','Physical touch, Safari, physical orientation and backgrounding are unverified','Service workers are blocked in the browser context so exact renderer fault interception is reliable; offline caching is unverified','Native audio full-suite unchanged and not rerun in this boundary probe','Victory, expedition provisions and full save-conflict matrix remain source-tested, not browser-certified by this probe']};
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
async function open(caseName,{fixture=null,rendererFailure=false}={}){
  const context=await browser.newContext(contextOptions);contexts.add(context);context.setDefaultTimeout(30000);
  const row={name:caseName,startedAt:now(),pageErrors:[],consoleErrors:[],requestFailures:[],assetFailures:[],blockedAssets:[]};manifest.cases.push(row);
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
async function firstPlay(){
  const session=await open('fresh-empty-profile'),{page}=session;manifest.firstPlay.initialStorage=session.row.initialStorage;
  await readyHome(page);assert.equal(await page.getByRole('button',{name:'Play',exact:true}).count(),1);
  await strictScreen(page,'fresh-home-two-actions','#entry-screen button',2);await assertFrozenHome(page,'home-does-not-start-battle');
  await capture(page,'home','canonical-candidate-home-empty-profile');
  await tabTo(page,'#entry-play');await key(page,'Tab');assert(await page.locator('#entry-settings').evaluate(node=>node===document.activeElement));
  const settingsFocus=await page.locator('#entry-settings').evaluate(inspectControl);assertReachable(settingsFocus);assert(settingsFocus.focusVisible,'native keyboard focus must be visible');
  await key(page,'Enter');await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
  const closeSelector='#modal-layer [data-command="close"]';assertReachable(await page.locator(closeSelector).evaluate(inspectControl));
  assert.equal(await page.locator('#modal-layer [data-command="retreat"]').count(),0,'Home settings must not offer retreat from an unstarted battle');
  await tap(page,closeSelector);await page.locator('#modal-layer').waitFor({state:'hidden'});
  assert(await page.locator('#entry-settings').evaluate(node=>node===document.activeElement),'close restores Settings opener');
  manifest.checks.push({name:'home-settings-native-close-focus',passed:true,settingsFocus});
  await tap(page,'#entry-play');await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running'&&document.querySelector('#app')?.dataset.entry==='play');
  const started=await observe(page);assert.equal(started.saved.deployed,0);assert.equal(started.saved.foodLevel,0);assert.equal(started.saved.kills,0);
  await page.locator('#unit-cards [data-unit="0"]:enabled').waitFor();await tap(page,'#unit-cards [data-unit="0"]');
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'{}').deployed===1,SAVE_KEY);
  const deployed=await observe(page);assert.equal(deployed.saved.deployed,1);
  await tap(page,'.world-tools [data-command="settings"]');await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
  await action(page,'native Settings scrolling to Retreat',()=>page.locator('#modal-layer [data-command="retreat"]').scrollIntoViewIfNeeded());
  await tap(page,'#modal-layer [data-command="retreat"]');
  await page.locator('.compact-result[data-outcome="lost"]').waitFor();
  assert.equal(await page.getByRole('heading',{name:'Regroup',exact:true}).count(),1);
  await strictScreen(page,'portrait-short-result-three-actions','.compact-result button',3);
  assert.equal(await page.locator('.compact-result button').count(),3);
  assert.deepEqual(await page.locator('.compact-result button').allTextContents(),['Retry','Details','Home']);
  const result=await observe(page);assert.equal(result.phase,'lost');assert.equal(result.saved.deployed,1);
  await capture(page,'short-result','canonical-candidate-short-result-real-one-deployment-and-retreat');
  if(reviewCase==='small-320-rotate'){
    await action(page,'native viewport rotation to 844x390',()=>page.setViewportSize({width:844,height:390}));
    await page.waitForFunction(()=>innerWidth===844&&innerHeight===390);
    await strictScreen(page,'landscape-short-result-three-actions','.compact-result button',3);
    assert.equal((await observe(page)).phase,'lost');await capture(page,'rotated-result','native-emulated-rotation-short-result');
    await action(page,'native viewport return to 320x568',()=>page.setViewportSize({width:320,height:568}));
    await page.waitForFunction(()=>innerWidth===320&&innerHeight===568);
    await strictScreen(page,'portrait-return-result-three-actions','.compact-result button',3);
  }
  const settledBytes=await storage(page);
  await tabTo(page,'[data-command="result-details"]');
  const detailsFocus=await page.locator('[data-command="result-details"]').evaluate(inspectControl);assertReachable(detailsFocus);assert(detailsFocus.focusVisible);
  await key(page,'Enter');await page.locator('.battle-statistics').waitFor();
  assert.equal(await page.locator('.battle-statistics dt').filter({hasText:'Warriors deployed'}).count(),1);
  const deployedReceipt=await page.locator('.battle-statistics div').filter({has:page.locator('dt',{hasText:'Warriors deployed'})}).locator('dd').innerText();assert.equal(deployedReceipt,'1');
  const details=await page.locator('.result-dialog').innerText();assert.match(details,/TOTAL BATTLE EARNINGS/);assert.match(details,/Battle time/);assert.match(details,/Enemies defeated/);
  await tap(page,'[data-command="result-back"]');await page.locator('.compact-result').waitFor();
  assert(await page.locator('[data-command="result-details"]').evaluate(node=>node===document.activeElement));
  await tap(page,'[data-command="home"]');await readyHome(page);
  assert.equal(await page.getByRole('button',{name:'Continue',exact:true}).count(),1);assert.equal((await observe(page)).phase,'lost');
  assert(await page.locator('#entry-play').evaluate(node=>node===document.activeElement));
  await strictScreen(page,'return-home-two-actions','#entry-screen button',2);await assertFrozenHome(page,'home-retains-loss-without-restarting');
  assert.deepEqual(await storage(page),settledBytes,'Details and Home do not re-settle or alter progress');
  await tap(page,'#entry-play');await page.locator('.compact-result[data-outcome="lost"]').waitFor();
  assert.equal((await observe(page)).phase,'lost');assert.deepEqual(await storage(page),settledBytes);
  manifest.checks.push({name:'real-play-deployment-retreat-details-home-continue',passed:true,started,deployed,result,receiptDeployed:deployedReceipt,storageUnchangedAfterSettlement:true,detailsFocus});
  runtimeClean(session.row);await close(session);
}
async function rendererRecovery(){
  const [raw]=rendererFailureFixture(defaultProfile,decodeSave);
  const session=await open('renderer-import-failure-existing-save',{fixture:[raw,raw],rendererFailure:true}),{page,row}=session;
  await page.waitForFunction(()=>document.querySelector('#battlefield')?.dataset.renderer==='failed'&&document.querySelector('#entry-play')?.textContent==='Reload'&&!document.querySelector('#entry-play')?.disabled);
  const failedAt=now();await page.waitForTimeout(5500);
  assert.equal(await page.locator('#toast').evaluate(node=>node.classList.contains('visible')),false,'wait beyond ordinary toast duration');
  assert.match(await page.locator('#entry-subtitle').innerText(),/battlefield could not load.*Reload.*saved progress is kept/i);
  assert.equal(await page.getByRole('button',{name:'Reload',exact:true}).count(),1);
  await strictScreen(page,'durable-renderer-failure-two-actions','#entry-screen button',2);
  assert.deepEqual(await storage(page),[raw,raw],'failed import preserves both save bytes');
  runtimeClean(row,{expectedRendererFailure:true});const beforeReload={...await observe(page),storage:storageStamp(await storage(page))};
  await page.unroute(`${origin}/${row.failureInjection.path}`);
  row.failureInterceptionRemovedAt=now();
  const counts={pageErrors:row.pageErrors.length,consoleErrors:row.consoleErrors.length,requestFailures:row.requestFailures.length,assetFailures:row.assetFailures.length};
  await action(page,'native Reload button after removing renderer interception',async()=>{await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),page.getByRole('button',{name:'Reload',exact:true}).tap()]);});
  await readyHome(page);assert.equal(await page.getByRole('button',{name:'Continue',exact:true}).count(),1);
  assert.deepEqual(await storage(page),[raw,raw],'native reload preserves exact primary and backup');
  for(const [key,count]of Object.entries(counts))assert.equal(row[key].length,count,`recovered reload added unexpected ${key}`);
  await strictScreen(page,'renderer-recovered-home-two-actions','#entry-screen button',2);await assertFrozenHome(page,'renderer-recovery-does-not-start-play');
  manifest.checks.push({name:'renderer-import-failure-durable-reload-and-safe-storage',passed:true,failedAt,durableObservedAt:beforeReload.at,waitMs:5500,beforeReload,afterReload:await observe(page),rawStorageUnchanged:true});await close(session);
}
async function futureTemporary(){
  const [primary,backup]=futureSaveFixture(defaultProfile,decodeSave);
  const session=await open('separate-future-save-temporary-fixture',{fixture:[primary,backup]}),{page}=session;
  await page.getByRole('heading',{name:'This save needs a newer game version',exact:true}).waitFor();assert.deepEqual(await storage(page),session.fixture);
  await tap(page,'[data-command="session-temporary"]');await readyHome(page,'temporary');
  await strictScreen(page,'temporary-home-two-actions','#entry-screen button',2);
  assert.match(await page.locator('#session-notice').innerText(),/Temporary play.*progress is not saved/);
  await tap(page,'#entry-settings');await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
  assert(await page.locator('[data-command="import"]').isDisabled());assert(await page.locator('[data-command="reset"]').isDisabled());
  await tap(page,'#modal-layer [data-command="close"]');await tap(page,'#entry-play');await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running');
  await page.locator('#unit-cards [data-unit="0"]:enabled').waitFor();await tap(page,'#unit-cards [data-unit="0"]');
  await tap(page,'.world-tools [data-command="settings"]');await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
  await action(page,'native temporary Settings scrolling to Retreat',()=>page.locator('[data-command="retreat"]').scrollIntoViewIfNeeded());
  await tap(page,'[data-command="retreat"]');await page.locator('.compact-result[data-outcome="lost"]').waitFor();
  await strictScreen(page,'temporary-result-three-actions','.compact-result button',3);
  await tap(page,'[data-command="result-details"]');await page.locator('.battle-statistics').waitFor();
  assert.equal(await page.locator('.battle-statistics div').filter({has:page.locator('dt',{hasText:'Warriors deployed'})}).locator('dd').innerText(),'1','temporary session records the genuine deployment');
  await tap(page,'[data-command="result-back"]');await page.locator('.compact-result').waitFor();
  await tap(page,'[data-command="home"]');await readyHome(page,'temporary');await page.waitForTimeout(5500);
  assert.deepEqual(await storage(page),session.fixture,'temporary Home/play/deploy/retreat/result remains byte-safe across autosave interval');
  await action(page,'native reload from temporary Home',()=>page.reload({waitUntil:'networkidle'}));
  await page.getByRole('heading',{name:'This save needs a newer game version',exact:true}).waitFor();assert.deepEqual(await storage(page),session.fixture);
  manifest.checks.push({name:'future-save-temporary-boundary-roundtrip',passed:true,fixtureOnly:true,primaryAndBackupByteIdentical:true});runtimeClean(session.row);await close(session);
}
async function baseline(){const session=await open('baseline-fresh-empty-profile'),{page}=session;
  await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active'&&document.querySelector('#battlefield')?.dataset.renderer==='ready'&&!document.querySelector('.world-loader'));
  await page.evaluate(()=>document.fonts.ready);assert.equal((await observe(page)).phase,'ready');
  assert.equal(await page.locator('#entry-screen').count(),0,'matched baseline predates Home');
  await capture(page,'initial-ready','matched-before-home-predecessor-dense-ready-screen');
  manifest.checks.push({name:'baseline-initial-screen',passed:true,note:'Baseline has no Home. This is the same empty-profile initial-load task before the entry change, not an invented Home or a gameplay acceptance.'});
  runtimeClean(session.row);await close(session);
}
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});manifest.browser={engine:'chromium',version:browser.version(),playwright:sourceRequire('playwright/package.json').version};
  if(revision==='baseline')await baseline();else{await firstPlay();if(reviewCase==='small-320-rotate'){await rendererRecovery();await futureTemporary();}}
  assert(manifest.nativeInputs.every(event=>event.isTrusted),'all recorded input must be browser-trusted');
  git(['diff','--exit-code','HEAD','--']);manifest.checks.push({name:'immutable-source-after-browser',passed:true});manifest.executionStatus='passed-awaiting-original-pixel-review';
}catch(error){manifest.errors.push({at:now(),error:String(error),stack:error.stack});manifest.executionStatus='failed';process.exitCode=1;
  const limit=revision==='baseline'?1:reviewCase==='compare-390'?2:3;
  if(activePage&&!activePage.isClosed()&&manifest.images.length<limit)await capture(activePage,'failure','native-failure-boundary-state').catch(error=>manifest.errors.push({captureError:String(error)}));
}finally{for(const context of contexts)await context.close();await browser?.close();server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));persist();}
console.log('ENTRY_REVIEW_SUMMARY '+JSON.stringify({sourceCommit:expected,revision,reviewCase,status:manifest.executionStatus,checks:manifest.checks.map(({name,passed})=>({name,passed})),errors:manifest.errors.map(({error})=>error)}));
