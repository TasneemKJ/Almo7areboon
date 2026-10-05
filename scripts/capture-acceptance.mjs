/** Supplemental acceptance. The isolated large-text case alone applies disclosed root-size emulation. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,sep,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {overlaps,inspectControl,assertReachable,reachableControls,troopLabels,assertTroopLabels,tabTo} from './review-geometry.mjs';
import {ordinaryFixture,laterFixture,chronicleFixture,assertFixture} from './review-fixtures.mjs';

const expected=process.env.SOURCE_SHA,viewportName=process.env.REVIEW_VIEWPORT,reviewCase=process.env.REVIEW_CASE;
assert.match(expected??'',/^[a-f0-9]{40}$/);
assert.equal(process.env.REVIEW_REVISION,'candidate');
const sizes={'320x568':[320,568],'390x844':[390,844],'844x390':[844,390]};
assert(Object.hasOwn(sizes,viewportName));
assert(['temporary','chronicle','later-chapters','orientation-background','large-text'].includes(reviewCase));
const [width,height]=sizes[viewportName],root=process.cwd(),out=resolve(root,'artifacts/supplemental-review');
const harness=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git(['rev-parse','HEAD']),expected);git(['diff','--exit-code','HEAD','--']);
const sourceRequire=createRequire(resolve(root,'package.json')),{chromium}=sourceRequire('playwright');
const {defaultProfile,decodeSave,SAVE_KEY,BACKUP_KEY}=await import(pathToFileURL(resolve(root,'src/game/save.ts')));
const {unitPresentationName,chapterPresentation}=await import(pathToFileURL(resolve(root,'src/ui/chapter-presentation.ts')));
const {unlockCost}=await import(pathToFileURL(resolve(root,'src/game/data.ts')));
const hash=data=>createHash('sha256').update(data).digest('hex');
const hashes=(base,files)=>Object.fromEntries(files.map(file=>[file,hash(readFileSync(resolve(base,file)))]));
mkdirSync(out,{recursive:true});
const manifest={sourceCommit:expected,sourceTree:git(['rev-parse','HEAD^{tree}']),revision:'candidate',viewportName,reviewCase,
  workflowCommit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,game:'Almo7areboon',
  context:{viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'no-preference',cpuThrottle:4,locale:'en-US'},
  largeText:reviewCase==='large-text'?{mechanism:'root-size-emulation',rootPx:32,nativePreference:'unverified'}:null,
  scope:'Built app, disclosed decoder-valid initial fixtures, real taps and keyboard. No render/simulation/clock/visibility overrides. Only the separately labeled large-text case sets root font size, matching the production upgrade-text review. Viewport rotation is emulation, not physical-device evidence.',
  sourceFilesSha256:hashes(root,['package-lock.json','src/main.ts','src/game/save.ts','src/ui/landscape-rail.css']),
  harnessFilesSha256:hashes(harness,['scripts/capture-acceptance.mjs','scripts/review-geometry.mjs','scripts/review-fixtures.mjs','.github/workflows/single-visual-review.yml','scripts/emit-originals.py']),
  fixtures:[],images:[],checks:[],errors:[],nativeBackground:{status:'not-requested'},paintedAcceptance:'pending-original-pixel-review'};
const persist=()=>writeFileSync(resolve(out,'review-manifest.json'),JSON.stringify(manifest,null,2));
persist();
const dist=resolve(root,'dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=resolve(dist,'.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(dist+sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
let browser;const contexts=new Set(),pageErrors=[],assetFailures=[];
const bytes=page=>page.evaluate(({key,backup})=>[localStorage.getItem(key),localStorage.getItem(backup)],{key:SAVE_KEY,backup:BACKUP_KEY});
async function open(profile,{future=false}={}) {
  assertFixture(profile,decodeSave);
  manifest.fixtures.push({profile,profileSha256:hash(JSON.stringify(profile)),primary:future?{version:99}:'same profile',reference:future?'scripts/verify-save-sessions.mjs#future-save-temporary':reviewCase==='chronicle'?'scripts/review-chronicle.mjs#initial-escort':'production defaultProfile with disclosed preparation'});persist();
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,hasTouch:true,isMobile:true,reducedMotion:'no-preference',locale:'en-US'});
  contexts.add(context);context.setDefaultTimeout(30000);
  const page=await context.newPage();
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('response',r=>{if(/\/(art|assets)\//.test(r.url())&&!r.ok())assetFailures.push({status:r.status(),path:new URL(r.url()).pathname});});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const origin=`http://127.0.0.1:${server.address().port}`;
  // Existing production review pattern: a dedicated setup route seeds before the game loads.
  await page.route(`${origin}/__review-setup`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Initial fixture setup</title>'}));
  await page.goto(`${origin}/__review-setup`);
  await page.evaluate(({primary,backup,key,backupKey})=>{localStorage.setItem(key,JSON.stringify(primary));localStorage.setItem(backupKey,JSON.stringify(backup));},
    {primary:future?{version:99}:profile,backup:profile,key:SAVE_KEY,backupKey:BACKUP_KEY});
  const seededBytes=await bytes(page);
  await page.goto(origin,{waitUntil:'networkidle'});
  if(future){await page.getByRole('heading',{name:'This save needs a newer game version',exact:true}).waitFor();await page.locator('[data-command="session-temporary"]').tap();}
  await page.waitForFunction(expected=>document.querySelector('#app')?.dataset.saveSession===expected&&document.querySelector('#battlefield')?.dataset.renderer==='ready'&&!!document.querySelector('canvas'),future?'temporary':'active');
  await page.evaluate(()=>document.fonts.ready);
  return {page,context,seededBytes};
}
async function close(session){await session.context.close();contexts.delete(session.context);}
async function start(page){await page.locator('[data-command="start"]').tap();await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running');}
async function pause(page){if(await page.locator('#pause').getAttribute('aria-pressed')!=='true')await page.locator('#pause').tap();await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='true');}
async function state(page){return page.evaluate(key=>({phase:document.querySelector('#world')?.dataset.phase,session:document.querySelector('#app')?.dataset.saveSession,paused:document.querySelector('#pause')?.getAttribute('aria-pressed'),status:document.querySelector('#game-status')?.textContent,
  saved:JSON.parse(localStorage.getItem(key)),hidden:document.hidden,visibility:document.visibilityState,viewport:{width:innerWidth,height:innerHeight},active:document.activeElement?.id||document.activeElement?.getAttribute('data-tab'),canvas:document.querySelector('canvas')?{width:document.querySelector('canvas').width,height:document.querySelector('canvas').height}:null}),SAVE_KEY);}
async function capture(page,name,purpose='native-supplemental',transport=true){
  const before=await state(page),path=`${viewportName}-${reviewCase}-${name}.png`;
  const png=await page.screenshot({path:resolve(out,path),scale:'css',fullPage:false});
  assert.equal(png.readUInt32BE(16),before.viewport.width);assert.equal(png.readUInt32BE(20),before.viewport.height);
  manifest.images.push({path,bytes:png.length,sha256:hash(png),screenshotScale:'css',viewport:before.viewport,purpose,transport,observationBefore:before,observationAfter:await state(page)});persist();
}
const battleControls='#unit-cards [data-unit],.bottom-nav [data-tab],.order-banner [data-order],#food-upgrade,#base-upgrade,[data-skill],#story-rally';
async function geometry(page,name){
  const rows=await reachableControls(page,battleControls),cards=await troopLabels(page);assertTroopLabels(cards);
  const actual=rows.map(row=>row.after.key);
  assert.equal(rows.filter(row=>['battle','evolution','cards','skills'].includes(row.after.key)).length,4,'all four nav controls checked');
  assert.equal(rows.filter(row=>['freeze','meteor','food'].includes(row.after.key)).length,3,'all three visible skills checked');
  assert.equal(rows.filter(row=>['hold','advance'].includes(row.after.key)).length,2,'both visible orders checked');
  assert(actual.includes('food-upgrade')&&actual.includes('base-upgrade'),'both upgrades checked');
  manifest.checks.push({name,passed:true,controls:rows,cards});persist();
}
async function temporary(){
  const session=await open(chronicleFixture(defaultProfile),{future:true}),{page}=session;
  await start(page);await pause(page);
  await page.locator('.bottom-nav [data-tab="skills"]').tap();
  await page.locator('#secondary-title').waitFor({state:'visible'});
  await page.locator('#secondary-screen').evaluate(node=>node.scrollTo({top:node.scrollHeight,behavior:'instant'}));
  const layout=await page.evaluate(()=>{
    const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    return {secondary:box('#secondary-screen'),notice:box('#session-notice'),nav:box('.bottom-nav'),noticeText:document.querySelector('#session-notice').textContent,
      rootWidth:document.documentElement.scrollWidth,viewport:innerWidth,noticeHidden:document.querySelector('#session-notice').hidden};
  });
  assert.equal(layout.noticeHidden,false);assert.match(layout.noticeText,/progress is not saved/);
  assert(Math.abs(layout.nav.height-44)<1,'running compact nav keeps 44px');assert(Math.abs(layout.notice.height-28)<1,'temporary notice keeps its 28px band');
  assert(layout.secondary.bottom<=layout.notice.top+1,'secondary content clears the entire temporary notice');
  assert(layout.notice.bottom<=layout.nav.top+1,'temporary notice clears navigation');
  assert(!overlaps(layout.secondary,layout.notice)&&!overlaps(layout.secondary,layout.nav)&&!overlaps(layout.notice,layout.nav),'temporary secondary, notice and nav do not overlap');
  assert(layout.rootWidth<=layout.viewport+1);
  const controls=await reachableControls(page,'.bottom-nav [data-tab],#secondary-screen [data-tab="battle"]');
  await capture(page,'secondary-clearance');
  await tabTo(page,'#secondary-screen [data-tab="battle"]');await page.keyboard.press('Enter');
  await page.locator('#secondary-screen').waitFor({state:'hidden'});
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
  await page.waitForTimeout(5500);assert.deepEqual(await bytes(page),session.seededBytes,'temporary play never changes primary or backup across the real autosave interval');
  manifest.checks.push({name:'temporary-secondary-44-plus-28',passed:true,layout,controls,primaryAndBackupUnchanged:true});
  await close(session);
}
async function chronicle(){
  const session=await open(chronicleFixture(defaultProfile)),{page}=session;
  await page.locator('[data-command="chronicle"]').first().tap();await page.locator('.chronicle-book').waitFor();
  assert(await page.locator('[data-story-route="bell"]').isDisabled());assert(await page.locator('[data-story-route="whisper"]').isDisabled());
  await page.locator('[data-story-route="escort"]').tap();await start(page);
  const gatherBefore=await page.locator('#story-rally').evaluate(inspectControl);await page.locator('#story-rally').scrollIntoViewIfNeeded();assertReachable(await page.locator('#story-rally').evaluate(inspectControl));
  await page.locator('#story-rally').tap();assert.equal(await page.locator('#story-rally').getAttribute('aria-pressed'),'true');
  await page.locator('[data-unit="0"]:enabled').tap();
  await page.waitForFunction(()=>/Release [1-6]\/6/.test(document.querySelector('#story-rally')?.textContent??''));
  await pause(page);await geometry(page,'chronicle-visible-controls');
  const gather=await page.locator('#story-rally').evaluate(inspectControl),cards=await page.locator('#unit-cards').evaluate(node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};});
  assert(!overlaps(gather.box,cards),'Gather does not cover any roster band');
  await page.locator('#story-rally').scrollIntoViewIfNeeded();await capture(page,'gathered-public-pause');
  await page.locator('#pause').tap();await page.locator('#story-rally:enabled').tap();assert.equal(await page.locator('#story-rally').getAttribute('aria-pressed'),'false');
  manifest.checks.push({name:'chronicle-real-escort-gather-release',passed:true,gatherBefore,gather,cards,lockedBellAndWhisper:true});await close(session);
}
async function laterChapters(){
  for(let age=1;age<=5;age++){
    const profile=laterFixture(defaultProfile,age),session=await open(profile),{page}=session;
    await start(page);await pause(page);await geometry(page,`chapter-${age}-locked-controls`);
    const cards=await troopLabels(page);
    assert.match(await page.locator('#age-title').innerText(),new RegExp(chapterPresentation(age).title));
    for(const card of cards){
      const name=unitPresentationName(age,card.unit);assert.equal(card.labels[0].text,name);assert(card.name.includes(name));
      assert.equal(card.locked,card.unit!==0);
      if(card.unit!==0){assert(card.disabled,'zero-coin later-chapter lock cannot be activated');assert(card.name.includes(`${unlockCost(card.unit,profile).toLocaleString('en-US')} coins`),'accessible lock names expose the actual expensive price');assert(card.labels[2].text,'visible lock price remains nonempty');}
    }
    if(age===5){await page.locator('[data-unit="2"]').scrollIntoViewIfNeeded();await capture(page,'most-expensive-locks');}
    manifest.checks.push({name:`chapter-${age}-actual-names-and-lock-prices`,passed:true,cards});await close(session);
  }
}
async function largeText(){
  const profile=ordinaryFixture(defaultProfile);
  Object.assign(profile,{coins:10000000,foodLevel:23,baseLevel:23,unlocked:[true,true,true]});
  const session=await open(profile),{page}=session;
  // Explicit diagnostic only. This is not browser zoom or a persisted native font preference.
  await page.evaluate(async()=>{document.documentElement.style.fontSize='32px';await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  assert.equal(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize)),32);
  const upgrades=await reachableControls(page,'#food-upgrade,#base-upgrade');
  await capture(page,'root32-ready','large-text-diagnostic');
  await tabTo(page,'#food-upgrade');const before=JSON.parse((await bytes(page))[0]);
  await page.keyboard.press('Enter');
  const after=JSON.parse((await bytes(page))[0]);assert.equal(after.foodLevel,before.foodLevel+1);assert(after.coins<before.coins,'real keyboard purchase spends coins');
  await start(page);await pause(page);await geometry(page,'large-text-running-public-pause');
  await tabTo(page,'.bottom-nav [data-tab="cards"]');
  const focused=await page.locator('.bottom-nav [data-tab="cards"]').evaluate(inspectControl);assertReachable(focused);assert(focused.focusVisible);
  await capture(page,'root32-native-focus','large-text-diagnostic');
  await page.keyboard.press('Enter');await page.locator('#secondary-title').waitFor({state:'visible'});
  await tabTo(page,'.bottom-nav [data-tab="battle"]');await page.keyboard.press('Enter');await page.locator('#secondary-screen').waitFor({state:'hidden'});
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
  manifest.checks.push({name:'200-percent-root-text-emulation',passed:true,rootPx:32,reference:'scripts/capture-upgrade-text-review.mjs',upgrades,focused,
    nativeDefaultFontPreference:'unverified',physicalZoom:'unverified',paintedFocus:'pending-original-pixel-review'});await close(session);
}
async function orientationBackground(){
  assert.equal(viewportName,'390x844','orientation begins in canonical portrait');
  const session=await open(ordinaryFixture(defaultProfile)),{page}=session;
  await start(page);await page.locator('[data-unit="0"]:enabled').tap();await pause(page);
  const before=await state(page);await capture(page,'portrait-before');
  const rotations=[];
  for(const viewport of [{width:844,height:390},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.waitForFunction(v=>innerWidth===v.width&&innerHeight===v.height,viewport);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await geometry(page,`rotated-${viewport.width}x${viewport.height}`);
    const after=await state(page);assert.equal(after.paused,'true');assert.equal(after.session,'active');assert.equal(after.saved.age,before.saved.age);assert.equal(after.saved.deployed,before.saved.deployed);assert(after.canvas?.width>0&&after.canvas?.height>0);rotations.push(after);
  }
  await page.locator('#world').scrollIntoViewIfNeeded();await capture(page,'portrait-return');
  manifest.checks.push({name:'viewport-orientation-round-trip',passed:true,before,rotations,nativePhysicalOrientation:'unverified'});
  await page.locator('#pause').tap();await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='false');
  // Observe the real driver capability. Do not dispatch visibility events or override document.hidden.
  await page.evaluate(()=>{window.__reviewVisibilityEvents=[{hidden:document.hidden,state:document.visibilityState}];document.addEventListener('visibilitychange',()=>window.__reviewVisibilityEvents.push({hidden:document.hidden,state:document.visibilityState}));});
  const other=await session.context.newPage();await other.goto('about:blank');await other.bringToFront();await other.waitForTimeout(750);
  const background=await state(page),events=await page.evaluate(()=>window.__reviewVisibilityEvents);
  await page.bringToFront();await other.close();await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');
  const foreground=await state(page);
  assert.equal(foreground.saved.age,before.saved.age);assert.equal(foreground.saved.deployed,before.saved.deployed);
  assert.equal(foreground.session,'active');
  if(background.hidden&&background.visibility==='hidden'){
    assert.equal(foreground.hidden,false);assert.equal(foreground.paused,'false');
    manifest.nativeBackground={status:'native-visibility-observed-game-pause-unverified',gamePause:'The paused model is not directly exposed while hidden; a frozen or stale DOM is insufficient proof.',method:'second page bringToFront',background,foreground,events,physicalAppBackground:'unverified'};
  }else{
    manifest.nativeBackground={status:'unverified',method:'second page bringToFront',reason:'The native headless driver did not expose a hidden document; no synthetic visibility substitute was used.',background,foreground,events,physicalAppBackground:'unverified'};
  }
  await close(session);
}
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});manifest.browser={engine:'chromium',version:browser.version(),playwright:sourceRequire('playwright/package.json').version};
  await ({temporary,chronicle,'later-chapters':laterChapters,'orientation-background':orientationBackground,'large-text':largeText}[reviewCase])();
  assert.deepEqual(pageErrors,[]);assert.deepEqual(assetFailures,[]);git(['diff','--exit-code','HEAD','--']);
  manifest.checks.push({name:'immutable-source-and-clean-runtime',passed:true,pageErrors,assetFailures});
}catch(error){
  manifest.errors.push({error:String(error),stack:error.stack,pageErrors,assetFailures});process.exitCode=1;
  const failedPage=[...contexts].flatMap(context=>context.pages()).find(page=>!page.isClosed()&&page.url()!=='about:blank');
  if(failedPage){
    const viewport=failedPage.viewportSize();
    const transport=manifest.images.filter(row=>row.transport).length<3&&viewport?.width===width&&viewport?.height===height;
    await capture(failedPage,'failure',reviewCase==='large-text'?'large-text-diagnostic-failure':'native-failure',transport).catch(captureError=>manifest.errors.push({failureCaptureError:String(captureError)}));
  }
}finally{
  for(const context of contexts)await context.close();await browser?.close();server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));persist();
}
console.log('ARENA_SUPPLEMENTAL_SUMMARY '+JSON.stringify({sourceCommit:expected,sourceTree:manifest.sourceTree,reviewCase,viewportName,checks:manifest.checks.map(({name,passed})=>({name,passed})),nativeBackground:manifest.nativeBackground,errors:manifest.errors}));
