/** Native production-page controls/session checks. No duplicate settings UI or fake graph. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {installNativeAudioObserver} from './audio-native-observer.mjs';
const primary='almo7areboon.save.v1',backup=`${primary}.backup`,mixKey='almo7areboon.audio.mix.v1';
// Same valid reduced-motion startup shape used by the accepted save-session fixture.
const profile=()=>({version:2,timeline:1,age:0,enemyAge:0,furthestBattle:0,coins:500,gems:100,foodLevel:0,baseLevel:0,unlocked:[true,false,false],cards:Array(30).fill(0),summonCount:0,summonSeed:1831565813,pendingVictory:null,kills:0,wins:0,deployed:0,claimed:[],sound:false,speed:1,motion:'reduced'});
const snapshot=page=>page.evaluate(()=>window.nativeAudioReview.snapshot());
const bytes=page=>page.evaluate(({primary,backup,mixKey})=>({primary:localStorage.getItem(primary),backup:localStorage.getItem(backup),mix:localStorage.getItem(mixKey)}),{primary,backup,mixKey});
async function active(page){await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active'&&!document.querySelector('#modal-layer .session-dialog'));}
async function settings(page){await page.locator('[data-command="settings"]').click();await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();}
async function labeledRanges(page){
 const effects=page.getByLabel('Effects volume',{exact:true}),atmosphere=page.getByLabel('Atmosphere volume',{exact:true});
 assert.ok(await effects.count()===1&&await atmosphere.count()===1,'Missing labeled native ranges: Effects volume and Atmosphere volume');
 for(const range of [effects,atmosphere])assert.deepEqual(await range.evaluate(node=>({tag:node.tagName,type:node.type,min:node.min,max:node.max,step:node.step})),{tag:'INPUT',type:'range',min:'0',max:'100',step:'5'});
 return {effects,atmosphere};
}
async function checkValue(page,id,value,handle){
 const state=await handle.evaluate((node,{id})=>({same:node===document.getElementById(id),focused:node===document.activeElement,value:node.value,spoken:node.getAttribute('aria-valuetext')}),{id});
 assert.deepEqual(state,{same:true,focused:true,value:String(value),spoken:`${value}%`},`${id}: native input identity, focus and spoken percentage`);
 assert.equal(await page.locator(`#${id}-value`).textContent(),`${value}%`);
}
async function keyboardLevel(page,range,id,value){
 await range.focus();const handle=await range.elementHandle();assert.ok(handle);await range.press('Home');
 for(let i=0;i<value/5;i++)await range.press('ArrowRight');
 await checkValue(page,id,value,handle);await handle.dispose();
}
function noGraph(probe){assert.equal(probe.createdContexts,0,'muted settings must not create an AudioContext');assert.equal(probe.createdWorkers,0,'muted settings must not create a synthesis worker');}
function bounded(probe){assert.equal(probe.nativeAudio,true);assert.equal(probe.nativeWorker,true);assert.ok(probe.maxWorkers<=1,'one native synthesis worker');assert.ok(probe.maxBeds<=2,'one current bed plus one retiring bed');assert.ok(probe.maxTransients<=8,'eight shared transient voices');assert.ok(probe.maxAccents<=2,'at most two atmosphere accents');assert.ok(probe.contextStates.filter(state=>state!=='closed').length<=1,'one owned native AudioContext');}
export async function reviewAudioBrowser({browser,origin,directory,reports,errors,persist}){
 const capture=async(page,name)=>page.screenshot({path:resolve(directory,`${name}.png`),fullPage:true});
 const watch=page=>{page.on('pageerror',error=>errors.push({url:page.url(),message:error.message}));page.on('console',message=>{if(message.type()==='error')errors.push({url:page.url(),console:message.text()});});return page;};
 async function open(context){const page=watch(await context.newPage());await page.goto(origin,{waitUntil:'networkidle'});return page;}
 async function seed(context,fixture=profile()){
  const source=watch(await context.newPage());await source.route(`${origin}/__audio-setup`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Audio review seed</title>'}));
  await source.goto(`${origin}/__audio-setup`);
  await source.evaluate(({primary,backup,mixKey,profile})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));localStorage.removeItem(mixKey);localStorage.setItem('almo7areboon.audio.atmosphere.v1','on');},{primary,backup,mixKey,profile:fixture});return source;
 }
 async function scenario(name,callback,{blockStorage=false}={}){
  const context=await browser.newContext({viewport:{width:320,height:640},reducedMotion:'reduce'});context.setDefaultTimeout(15000);
  await context.addInitScript(installNativeAudioObserver,{blockStorage});
  const result={name,status:'in-progress',assertions:[],nativePages:[]};reports.push(result);persist('in-progress');
  try{await callback(context,result);result.status='passed';}
  catch(error){result.status='failed';result.error=error.stack??String(error);for(const [index,page] of context.pages().entries())await capture(page,`${name}-failure-${index}`).catch(()=>{});}
  finally{
   for(const page of context.pages())if(new URL(page.url()).origin===origin){const probe=await snapshot(page).catch(()=>null);if(probe)result.nativePages.push({url:page.url(),...probe});}
   writeFileSync(resolve(directory,`${name}.json`),JSON.stringify(result,null,2)+'\n');persist('in-progress');await context.close();
  }
 }
 await scenario('1-muted-native-input',async(context,result)=>{
  await seed(context);const page=await open(context);await active(page);noGraph(await snapshot(page));result.assertions.push('Fresh sound:false profile: zero contexts/workers before interaction');
  await settings(page);await capture(page,'settings-before-input-320');const {effects,atmosphere}=await labeledRanges(page);
  noGraph(await snapshot(page));await keyboardLevel(page,effects,'effects-volume',50);await keyboardLevel(page,atmosphere,'atmosphere-volume',25);
  const handle=await effects.elementHandle();await effects.focus();await effects.press('ArrowLeft');await checkValue(page,'effects-volume',45,handle);
  await effects.press('ArrowRight');await checkValue(page,'effects-volume',50,handle);
  await effects.press('Home');await checkValue(page,'effects-volume',0,handle);await capture(page,'zero-focused-muted-320');
  await effects.press('End');await checkValue(page,'effects-volume',100,handle);
  // Move the real thumb using Playwright mouse input; no synthetic range input for pointer acceptance.
  await effects.press('Home');const box=await effects.boundingBox();assert.ok(box&&box.width>40,'range must be operable at 320px');
  const start={x:box.x+8,y:box.y+box.height/2},end={x:box.x+box.width*.75,y:start.y};
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();
  const dragged=Number(await effects.inputValue());assert.ok(dragged>0&&dragged<100&&dragged%5===0,'native pointer drag updates a five-point percentage');await checkValue(page,'effects-volume',dragged,handle);await handle.dispose();
  await keyboardLevel(page,effects,'effects-volume',50);await keyboardLevel(page,atmosphere,'atmosphere-volume',25);noGraph(await snapshot(page));
  assert.equal(JSON.parse((await bytes(page)).mix).effects,50);assert.equal(JSON.parse((await bytes(page)).mix).atmosphere,25);
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(width.scroll<=width.viewport,`320px overflow: ${JSON.stringify(width)}`);
  await capture(page,'focused-muted-levels-320');result.assertions.push('Keyboard Home/End and exact five-point arrows retain identity/focus; native pointer drag; persistent50/25; no graph; no320px overflow');
 });
 await scenario('2-switch-reload-live-settings',async(context,result)=>{
  await seed(context);const page=await open(context);await active(page);await settings(page);let ranges=await labeledRanges(page);
  await keyboardLevel(page,ranges.effects,'effects-volume',50);await keyboardLevel(page,ranges.atmosphere,'atmosphere-volume',25);
  for(const command of ['sound','atmosphere']){
   await page.locator(`#modal-layer [data-command="${command}"]`).click();await page.locator(`#modal-layer [data-command="${command}"]`).click();
  }
  assert.equal(await page.locator('#effects-volume').inputValue(),'50');assert.equal(await page.locator('#atmosphere-volume').inputValue(),'25');
  await page.reload({waitUntil:'networkidle'});await active(page);await settings(page);ranges=await labeledRanges(page);
  assert.equal(await ranges.effects.inputValue(),'50');assert.equal(await ranges.atmosphere.inputValue(),'25');noGraph(await snapshot(page));
  await page.locator('#modal-layer [data-command="sound"]').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().contextStates.includes('running'));
  let probe=await snapshot(page);assert.equal(probe.createdContexts,1);assert.equal(probe.createdWorkers,0);assert.equal(probe.liveBeds,0);assert.equal(probe.liveTransients,0);
  const buses=probe.nodes.filter(node=>node.kind==='gain').slice(0,2);assert.equal(buses.length,2);
  assert.deepEqual(buses.map(bus=>probe.events.find(event=>event.id===bus.id&&event.method==='setValueAtTime')?.args[0]),[.5,.25],'latest stored mix initializes native buses');
  await page.locator('#modal-layer [data-command="close"]').click();await page.locator('[data-command="start"]').click();
  await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running'&&window.nativeAudioReview.snapshot().liveBeds===1);
  probe=await snapshot(page);bounded(probe);assert.equal(probe.createdContexts,1);result.assertions.push('Switch cycles/reload preserve50/25; enabled gesture initializes one native context/two latest-level buses; battle starts one bed/at most one worker');
  await settings(page);await page.waitForFunction(()=>window.nativeAudioReview.snapshot().liveBeds===0&&window.nativeAudioReview.snapshot().liveTransients===0);
  probe=await snapshot(page);const before={starts:probe.nodes.reduce((n,node)=>n+node.starts.length,0),workers:probe.createdWorkers,contexts:probe.createdContexts};
  const switches=()=>page.evaluate(()=>({sound:document.querySelector('#modal-layer [data-command="sound"]').getAttribute('aria-pressed'),atmosphere:document.querySelector('#modal-layer [data-command="atmosphere"]').getAttribute('aria-pressed')}));
  const enabledSwitches=await switches();assert.deepEqual(enabledSwitches,{sound:'true',atmosphere:'true'});
  // Observe real native resume calls during this Settings interaction without replacing its promise or behavior.
  await page.evaluate(()=>{
   window.settingsAudioResumeCalls=0;const nativeResume=AudioContext.prototype.resume;
   AudioContext.prototype.resume=function(...args){window.settingsAudioResumeCalls++;return Reflect.apply(nativeResume,this,args);};
  });
  const noPreview=async()=>{
   // Keep cumulative starts so even a short preview that already ended is detected.
   await page.waitForTimeout(120);const observed=await snapshot(page);
   assert.equal(observed.nodes.reduce((n,node)=>n+node.starts.length,0),before.starts,'enabled Settings input never starts a preview');
   assert.equal(observed.createdWorkers,before.workers);assert.equal(observed.createdContexts,before.contexts);
   assert.equal(await page.evaluate(()=>window.settingsAudioResumeCalls),0,'range input never resumes a native context');
   assert.equal(observed.liveBeds,0);assert.equal(observed.liveTransients,0);assert.deepEqual(await switches(),enabledSwitches);return observed;
  };
  ranges=await labeledRanges(page);
  for(const [range,id,fraction] of [[ranges.effects,'effects-volume',.75],[ranges.atmosphere,'atmosphere-volume',.65]]){
   await range.focus();const retained=await range.elementHandle(),previous=Number(await range.inputValue()),box=await range.boundingBox();assert.ok(retained&&box&&box.width>40);
   const y=box.y+box.height/2,start=box.x+8+(box.width-16)*previous/100,end=box.x+8+(box.width-16)*fraction;
   await page.mouse.move(start,y);await page.mouse.down();await page.mouse.move(end,y,{steps:12});await page.mouse.up();
   const dragged=Number(await range.inputValue());assert.ok(dragged>0&&dragged<100&&dragged%5===0&&dragged!==previous,`${id}: enabled pointer drag must change to a positive five-point percentage`);
   await checkValue(page,id,dragged,retained);await noPreview();await checkValue(page,id,dragged,retained);await retained.dispose();
  }
  await capture(page,'live-settings-positive-pointer-silent-320');
  await keyboardLevel(page,ranges.effects,'effects-volume',0);await keyboardLevel(page,ranges.atmosphere,'atmosphere-volume',0);
  const after=await noPreview();
  const state=await page.evaluate(()=>({sound:document.querySelector('[data-command="sound"]').getAttribute('aria-pressed'),atmosphere:document.querySelector('[data-command="atmosphere"]').getAttribute('aria-pressed'),effects:document.querySelector('#effects-volume').value,level:document.querySelector('#atmosphere-volume').value}));
  await page.locator('#modal-layer [data-command="motion"]').click();assert.deepEqual(await page.evaluate(()=>({sound:document.querySelector('[data-command="sound"]').getAttribute('aria-pressed'),atmosphere:document.querySelector('[data-command="atmosphere"]').getAttribute('aria-pressed'),effects:document.querySelector('#effects-volume').value,level:document.querySelector('#atmosphere-volume').value})),state);
  await capture(page,'live-settings-zero-silent-320');bounded(after);result.assertions.push('Mid-battle Settings retires the observed bed and leaves zero transients; positive pointer drags retain both input identities/focus with no starts/workers/contexts/resume calls or live sources; zero keyboard input stays silent; switches and motion settings preserve levels');
 });
 await scenario('3a-ownership-loss-retained-range',async(context,result)=>{
  await seed(context);const a=await open(context);await active(a);await settings(a);const {effects}=await labeledRanges(a),retained=await effects.elementHandle();
  const b=await open(context);await b.getByRole('heading',{name:'Game open in another tab',exact:true}).waitFor();
  await b.evaluate(backup=>localStorage.setItem(backup,JSON.stringify({version:99})),backup);
  await a.getByRole('heading',{name:'Your save changed in another tab',exact:true}).waitFor();
  const protectedBytes=await bytes(b),probe=await snapshot(a),game=await a.locator('#food-count').textContent();
  await retained.evaluate(node=>{node.value='5';node.dispatchEvent(new Event('input',{bubbles:true}));});await retained.dispose();
  assert.deepEqual(await bytes(b),protectedBytes);assert.equal(await a.locator('#food-count').textContent(),game);
  const after=await snapshot(a);assert.equal(after.writes.length,probe.writes.length);assert.equal(after.createdContexts,probe.createdContexts);assert.equal(after.createdWorkers,probe.createdWorkers);noGraph(after);
  await capture(a,'ownership-lost-protected-320');result.assertions.push('Real same-origin peer future-backup change removes settings; retained input after loss writes no mix/profile/backup, mutates no game and creates no graph');
 });
 await scenario('3b-guard-before-storage-notification',async(context,result)=>{
  await seed(context);const page=await open(context);await active(page);await settings(page);await labeledRanges(page);
  const protectedBytes=await page.evaluate(({primary,backup,mixKey})=>{
   // Same-document write deliberately emits no storage event here. The real connected input must check ownership itself.
   const range=document.getElementById('effects-volume');localStorage.setItem(primary,JSON.stringify({version:99}));
   const expected={primary:localStorage.getItem(primary),backup:localStorage.getItem(backup),mix:localStorage.getItem(mixKey)};
   const count=window.nativeAudioReview.snapshot().writes.length;range.value='5';range.dispatchEvent(new Event('input',{bubbles:true}));return {expected,count};
  },{primary,backup,mixKey});
  await page.getByRole('heading',{name:'Your save changed in another tab',exact:true}).waitFor();assert.deepEqual(await bytes(page),protectedBytes.expected);
  const probe=await snapshot(page);assert.equal(probe.writes.length,protectedBytes.count);noGraph(probe);result.assertions.push('Connected input detects unannounced protected save synchronously before any preference/profile write or unlock');
 });
 await scenario('3c-blocked-storage-temporary',async(context,result)=>{
  const page=await open(context);await page.getByRole('heading',{name:'Saving is unavailable',exact:true}).waitFor();
  await page.locator('[data-command="session-temporary"]').click();await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='temporary');
  await settings(page);await page.locator('#modal-layer [data-command="sound"]').click();const before=await snapshot(page);const ranges=await labeledRanges(page);await keyboardLevel(page,ranges.effects,'effects-volume',50);await keyboardLevel(page,ranges.atmosphere,'atmosphere-volume',25);
  await page.locator('#modal-layer [data-command="close"]').click();await settings(page);
  assert.equal(await page.locator('#effects-volume').inputValue(),'50');assert.equal(await page.locator('#atmosphere-volume').inputValue(),'25');
  const probe=await snapshot(page);assert.equal(probe.blockStorage,true);assert.ok(probe.writes.every(write=>!write.ok));assert.equal(probe.createdWorkers,before.createdWorkers);assert.equal(probe.createdContexts,before.createdContexts);assert.equal(probe.liveBeds,0);assert.equal(probe.liveTransients,0);
  await capture(page,'blocked-storage-memory-levels-320');result.assertions.push('Native blocked localStorage get/set: explicit temporary play, in-memory50/25 survives reopen, no successful storage write or audio preview');
 },{blockStorage:true});
 await scenario('4-native-production-lifecycle',async(context,result)=>{
  const historical=profile();historical.furthestBattle=5;await seed(context,historical);const page=await open(context);await active(page);await settings(page);await page.locator('#modal-layer [data-command="sound"]').click();await page.locator('#modal-layer [data-command="close"]').click();
  for(const chapter of [1,2,0]){await page.locator('[data-command="battles"]').click();await page.locator(`[data-battle="${chapter}"]`).click();assert.equal(await page.locator('#world').getAttribute('data-phase'),'ready');}await page.locator('[data-command="start"]').click();
  await page.waitForFunction(()=>window.nativeAudioReview.snapshot().liveBeds===1);const initial=await snapshot(page);bounded(initial);
  const silent=async()=>{await page.waitForFunction(()=>{const p=window.nativeAudioReview.snapshot();return p.liveBeds===0&&p.liveTransients===0;});bounded(await snapshot(page));};
  await page.locator('#pause').click();await silent();await page.locator('#pause').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().liveBeds===1);
  await page.locator('[data-tab="skills"]').click();await silent();await page.locator('.nav-item[data-tab="battle"]').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().liveBeds===1);
  await settings(page);await silent();await page.locator('#modal-layer [data-command="close"]').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().liveBeds===1);
  const peer=await context.newPage();await peer.goto('about:blank');await peer.bringToFront();const hidden=await page.evaluate(()=>document.hidden);
  if(hidden){await silent();const starts=(await snapshot(page)).nodes.reduce((n,v)=>n+v.starts.length,0);await page.bringToFront();await page.waitForTimeout(150);assert.equal((await snapshot(page)).nodes.reduce((n,v)=>n+v.starts.length,0),starts,'visibility return must await enabled gesture');await page.locator('#speed').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().liveBeds===1);result.visibility={status:'passed',documentHidden:true};}
  else result.visibility={status:'unverified',documentHidden:false,reason:'Headless tab switch leaves document.hidden false; no synthetic hidden event used. Deterministic visibility lifecycle tests remain required.'};
  await peer.close();const beforeNavigation=await snapshot(page);await page.goto(`${origin}/tests/fixtures/audio-live-review.html`,{waitUntil:'networkidle'});noGraph(await snapshot(page));await page.goBack({waitUntil:'networkidle'});await active(page);await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='ready');const returned=await snapshot(page);assert.equal(returned.liveBeds,0);assert.equal(returned.liveTransients,0);assert.ok(returned.contextStates.every(state=>state!=='running'),'pageshow must not unlock audio automatically');if(returned.createdContexts)assert.equal(returned.nodes.reduce((n,v)=>n+v.starts.length,0),beforeNavigation.nodes.reduce((n,v)=>n+v.starts.length,0),'BFCache return adds no native starts');
  await settings(page);await page.locator('#modal-layer [data-command="close"]').click();await page.locator('[data-command="start"]').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().liveBeds===1);bounded(await snapshot(page));
  // Natural terminal loss exercises integrated result-state ambience, with no outcome assignment.
  await page.getByRole('heading',{name:'REGROUP',exact:true}).waitFor({timeout:150000});await silent();await capture(page,'native-lifecycle-result-320');
  result.assertions.push('Running native pause/resume, menu and Settings cleanup, real visibility capability recorded, navigation/pagehide and back/pageshow require a new gesture, natural loss result cleans native sources');
 });
 await scenario('5-controlled-production-exports',async(context,result)=>{
  const page=watch(await context.newPage());await page.goto(`${origin}/tests/fixtures/audio-live-review.html`,{waitUntil:'networkidle'});await page.waitForSelector('body[data-ready="true"]');noGraph(await snapshot(page));
  await page.evaluate(()=>window.audioLiveReview.updateAudioMix({effects:50,atmosphere:25}));noGraph(await snapshot(page));await page.locator('#unlock').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().contextStates.includes('running'));
  const before=await snapshot(page);assert.equal(before.createdContexts,1);const buses=before.nodes.filter(n=>n.kind==='gain').slice(0,2);assert.deepEqual(buses.map(n=>before.events.find(e=>e.id===n.id&&e.method==='setValueAtTime').args[0]),[.5,.25]);
  const starts=probe=>probe.nodes.filter(n=>n.kind==='transient').reduce((n,v)=>n+v.starts.length,0);
  await page.evaluate(()=>window.audioLiveReview.playCombatEvents([{type:'hit',target:'base',side:'enemy',x:0,lane:0,amount:1},{type:'win',amount:0}],true));let probe=await snapshot(page);assert.equal(starts(probe)-starts(before),1,'result+base batch admits exactly one production result cue');assert.ok(Math.abs(probe.nodes.filter(n=>n.kind==='transient').at(-1).stops[0]-probe.nodes.filter(n=>n.kind==='transient').at(-1).starts[0].at-.6)<1e-6);
  await page.evaluate(()=>window.audioLiveReview.stopCombatAudio());
  // Identical simulation cadence is delivered twice as fast at 2x. Native currentTime owns cooldown.
  const cadence=[];for(const speed of [1,2]){const count=await page.evaluate(async speed=>{const a=window.audioLiveReview;const before=window.nativeAudioReview.snapshot().nodes.filter(n=>n.kind==='transient').length;for(let i=0;i<3;i++){a.playCombatEvents([{type:'spawn',side:'player',x:0,lane:0}],true);await new Promise(r=>setTimeout(r,200/speed));}return window.nativeAudioReview.snapshot().nodes.filter(n=>n.kind==='transient').length-before;},speed);assert.equal(count,speed===1?3:2);cadence.push({speed,realIntervalMs:200/speed,accepted:count});}
  const rampBefore=await snapshot(page);await page.evaluate(()=>{window.audioLiveReview.updateAudioMix({effects:0,atmosphere:65});window.audioLiveReview.playCombatEvents([{type:'skill',skill:'meteor',x:0,lane:0}],true);});probe=await snapshot(page);assert.equal(starts(probe),starts(rampBefore),'zero effects drops new native cue');for(const target of [0,.65])assert.ok(probe.events.some(e=>e.method==='linearRampToValueAtTime'&&e.args[0]===target));await page.evaluate(()=>window.audioLiveReview.updateAudioMix({effects:75,atmosphere:65}));
  await page.evaluate(()=>window.audioLiveReview.updateSoundscape(0,true));await page.waitForFunction(()=>window.nativeAudioReview.snapshot().liveBeds===1);bounded(await snapshot(page));
  // Production chapter intent replacement cancels real workers, never runs a parallel graph.
  await page.evaluate(()=>{const a=window.audioLiveReview;a.updateSoundscape(1,true);a.updateAudioMix({effects:25,atmosphere:45});a.updateSoundscape(2,true);a.suspendAudio();});await page.waitForFunction(()=>window.nativeAudioReview.snapshot().contextStates.includes('suspended'));await page.evaluate(()=>window.audioLiveReview.suspendAudio());await page.waitForFunction(()=>{const p=window.nativeAudioReview.snapshot();return p.liveWorkers===0&&p.liveBeds===0&&p.liveTransients===0;});const cancelled=await snapshot(page);await page.waitForTimeout(200);assert.equal((await snapshot(page)).nodes.reduce((n,v)=>n+v.starts.length,0),cancelled.nodes.reduce((n,v)=>n+v.starts.length,0),'cancelled native generation never starts late');
  await page.evaluate(()=>window.nativeAudioReview.closeLatestContext());await page.locator('#unlock').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().createdContexts===2&&window.nativeAudioReview.snapshot().liveBeds===1);probe=await snapshot(page);assert.equal(probe.workers.at(-1).requests.at(-1).age,2,'replacement starts latest requested chapter');const replacementBuses=probe.nodes.filter(n=>n.contextIndex===1&&n.kind==='gain').slice(0,2);assert.deepEqual(replacementBuses.map(n=>probe.events.find(e=>e.id===n.id&&e.method==='setValueAtTime').args[0]),[.25,.45]);bounded(probe);
  await page.evaluate(()=>window.audioLiveReview.updateSoundscape(2,true,{alarmMix:1,alarmSerial:0}));await page.waitForTimeout(1850);
  const admission=await page.evaluate(()=>{const a=window.audioLiveReview;a.updateSoundscape(2,true,{alarmMix:1,alarmSerial:0});a.updateSoundscape(2,true,{alarmMix:1,alarmSerial:1});for(let i=0;i<6;i++)a.playSummonAudio(true);const full=window.nativeAudioReview.snapshot();a.playCombatEvents([{type:'skill',skill:'meteor',x:0}],true);const reclaimed=window.nativeAudioReview.snapshot();a.playCombatEvents([{type:'hit',target:'base',side:'enemy',x:0}],true);return {full,reclaimed,critical:window.nativeAudioReview.snapshot()};});
  assert.equal(admission.full.liveAccents,2);assert.equal(admission.full.liveTransients,8);assert.equal(admission.reclaimed.liveAccents,1);assert.equal(admission.critical.liveAccents,0);assert.equal(admission.critical.liveTransients,8);bounded(admission.critical);await page.evaluate(()=>window.audioLiveReview.stopCombatAudio());
  await page.evaluate(()=>{const a=window.audioLiveReview;for(let i=0;i<12;i++)a.playCombatEvents([{type:'skill',skill:'food',x:0,lane:0}],true);});probe=await snapshot(page);assert.equal(probe.liveTransients,8);bounded(probe);await page.locator('#dispose').click();await page.waitForFunction(()=>window.nativeAudioReview.snapshot().contextStates.every(s=>s==='closed'));await page.evaluate(()=>window.audioLiveReview.disposeAudio());probe=await snapshot(page);assert.equal(probe.liveBeds,0);assert.equal(probe.liveTransients,0);assert.equal(probe.liveWorkers,0);bounded(probe);
  result.cadence=cadence;result.assertions.push('Actual production exports after native gesture: one result for result+base batch, native 1x/2x cooldown cadence, live mix ramps/zero suppression, real Worker cancellation and latest intent, native closed-context replacement/latest mix, eight-transient admission, repeated disposal');result.lateCompletion={status:'native-cancellation-observed',reason:'Actual cancelled Worker and native resume promises settle without stale starts; deliberately delayed/rejected callbacks stay covered by deterministic integration tests.'};
 });
 assert.deepEqual(errors,[],'native production audio controls must not raise page/console errors');
 assert.equal(reports.length,7);assert.ok(reports.every(report=>report.status==='passed'),JSON.stringify(reports.filter(report=>report.status!=='passed').map(({name,error})=>({name,error})),null,2));
 return {implementedCases:'Task2 cases1–5, including three ownership/storage subcases',outstandingCases:['Headphone and phone-speaker listening','Real hidden state when headless runner reports document.hidden=false']};
}
