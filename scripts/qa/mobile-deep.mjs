import {assert,defaultProfile,launch,open,run,shot,box,inventory,save,usableFocus,settle,finish} from './browser-driver.mjs';
import {preparedChronicleProfile} from '../simulate-chronicle.ts';
import {createChronicle} from '../../src/game/chronicle.ts';
import {createMastery} from '../../src/game/mastery.ts';
const engines=(process.env.QA_ENGINES??'chromium').split(',');
const sizes=(process.env.QA_SIZES??'320x568,390x844').split(',').map(s=>{const [width,height]=s.split('x').map(Number);return {width,height};});
const enabled=(name)=>(process.env.QA_DEEP_CASES??'eras,company,legacy,cycles,focus,zoom,rapid,background,context').split(',').includes(name);
for(const engine of engines){
 const browser=await launch(engine);
 try{for(const viewport of sizes){
  const tag=`${engine}-${viewport.width}x${viewport.height}`,meta={suite:'deep',engine,viewport};
  if(enabled('eras'))for(let age=0;age<6;age++)await run(`${tag}-era-${age}`,'six-era-render-and-all-role-deployment',{...meta,age},async c=>{
   const p=preparedChronicleProfile();p.age=age;p.enemyAge=age;p.furthestBattle=5;p.chronicle=createChronicle(1,age);p.mastery=createMastery(1);
   const f=await open(browser,viewport,p),page=f.page;
   try{
    await shot(page,'ready');c.metrics.ready=await inventory(page);
    await page.locator('[data-command="start"]').click();await page.locator('[data-skill="food"]').click();
    for(const kind of [0,1,2])await page.locator(`[data-unit="${kind}"]`).click();
    await page.locator('#pause').click();await shot(page,'deployed');c.metrics.battle=await inventory(page);
    assert.equal(c.metrics.battle.overflow,false);assert.equal(c.metrics.ready.overflow,false);
    assert.equal((await save(page)).deployed,p.deployed+3);assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
   }finally{await f.context.close();}
  });
  if(enabled('company'))await run(`${tag}-company`,'captain-tale-preparation-and-expedition-controls',meta,async c=>{
   const p=preparedChronicleProfile();p.chronicle.choices[0]='scout';
   const f=await open(browser,viewport,p),page=f.page;
   try{
    await page.locator('.story-open').click();await page.locator('.story-company summary').click();
    for(const captain of ['gatekeeper','lantern','none']){
     const button=page.locator(`[data-story-captain="${captain}"]`);await button.click();
     assert.equal((await save(page)).chronicle.captain,captain);assert.equal(await button.getAttribute('aria-pressed'),'true');
    }
    for(const tale of ['empty-bowl','borrowed-bell','olive-thread','none']){
     const button=page.locator(`[data-story-tale="${tale}"]`);await button.click();assert.equal((await save(page)).chronicle.tale,tale);
    }
    await shot(page,'company');
    for(const prep of ['bread','repair']){await page.locator(`[data-story-preparation="${prep}"]`).click();assert.equal((await save(page)).chronicle.preparation,prep);}
    await page.locator('.story-expedition summary').click();await page.locator('[data-command="story-expedition"]').click();
    assert.equal((await save(page)).chronicle.expedition.stage,0);await shot(page,'expedition-ready');
    await page.locator('.story-open').click();await page.locator('.story-expedition summary').click();
    await page.locator('[data-command="story-abandon"]').click();assert.equal((await save(page)).chronicle.expedition,null);
    c.metrics.completed={captains:3,tales:4,preparations:2,expedition:'started and abandoned without battle'};
   }finally{await f.context.close();}
  });
  if(enabled('legacy'))await run(`${tag}-legacy`,'unlocked-legacy-touch-controls-and-preview-cancel',meta,async c=>{
   const p=preparedChronicleProfile();p.timeline=2;p.enemyAge=5;p.furthestBattle=5;p.chronicle=createChronicle(2,5);p.mastery=createMastery(2);p.mastery.chapters[5].earnedMask=1;p.legacy={rank:1,selected:'hearth'};
   const f=await open(browser,viewport,p),page=f.page;
   try{
    await page.locator('.bottom-nav [data-tab="evolution"]').click();c.metrics.labels=[];
    for(const choice of ['watch','stillness','hearth']){
     const label=page.locator(`label[for="ready-${choice}"]`);await label.scrollIntoViewIfNeeded();c.metrics.labels.push(await box(label));
     await label.click();assert.equal((await save(page)).legacy.selected,choice);
    }
    await shot(page,'legacy-preparation');
    await page.locator('.bottom-nav [data-tab="battle"]').click();await page.locator('#battle-select').click();await page.locator('[data-command="next"]').click();
    const before=await save(page);
    for(const choice of ['watch','stillness','hearth']){await page.locator(`label[for="prestige-${choice}"]`).click();assert.deepEqual(await save(page),before,'preview choices cannot mutate the save');}
    const summary=page.locator('.prestige-reset summary');await summary.scrollIntoViewIfNeeded();c.metrics.resetTarget=await box(summary);await summary.click();await shot(page,'timeline-preview');
    await page.locator('.close-button').click();assert.deepEqual(await save(page),before,'cancelling prestige preserves current timeline');
    assert.ok(c.metrics.labels.every(r=>r.height>=44&&r.width>=44),'legacy labels need 44px touch targets');
    assert.ok(c.metrics.resetTarget.height>=44,'timeline reset disclosure needs a 44px touch target');
   }finally{await f.context.close();}
  });
  if(enabled('cycles'))await run(`${tag}-cycles`,'repeated-battle-menu-retreat-retry-resource-stability',meta,async c=>{
   const f=await open(browser,viewport,preparedChronicleProfile()),page=f.page;let cdp;
   try{
    if(engine==='chromium'){cdp=await f.context.newCDPSession(page);await cdp.send('Performance.enable');}
    const metrics=async()=>({dom:await page.locator('*').count(),canvases:await page.locator('canvas').count(),...(cdp?{performance:(await cdp.send('Performance.getMetrics')).metrics.filter(m=>['JSHeapUsedSize','Nodes','Documents','JSEventListeners'].includes(m.name))}:{})});
    const cycle=async()=>{
     await page.locator('[data-command="start"]').click();await page.locator('[data-unit="0"]').click();await page.locator('#pause').click();
     for(const tab of ['cards','skills','evolution','battle'])await page.locator(`.bottom-nav [data-tab="${tab}"]`).click();
     assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
     await page.locator('[data-command="settings"]').click();await page.locator('[data-command="retreat"]').click();await page.locator('.result-dialog').waitFor();
     await page.locator('[data-command="retry"]').click();await page.locator('[data-command="start"]').waitFor();
    };
    await cycle();c.metrics.before=await metrics();await shot(page,'warm');const start=Date.now();
    for(let i=0;i<20;i++){await cycle();if(i===9)await shot(page,'cycle-10');}
    c.metrics.durationMs=Date.now()-start;c.metrics.cycles=20;c.metrics.after=await metrics();await shot(page,'cycle-20');
    assert.equal(c.metrics.after.canvases,1);assert.ok(c.metrics.after.dom<=c.metrics.before.dom+5,'DOM nodes must not accumulate after settled cycles');
    if(cdp){const get=(m,name)=>m.performance.find(x=>x.name===name)?.value;assert.ok(get(c.metrics.after,'JSEventListeners')<=get(c.metrics.before,'JSEventListeners')+10,'listeners must not accumulate per menu cycle');}
    assert.equal((await save(page)).pendingVictory,null);
   }finally{await cdp?.detach();await f.context.close();}
  });
  if(enabled('focus'))await run(`${tag}-focus`,'keyboard-trap-reverse-tab-and-escape',meta,async c=>{
   const f=await open(browser,viewport),page=f.page;
   try{
    await page.locator('[data-command="settings"]').click();await settle(page);const labels=[];
    for(let i=0;i<35;i++){await page.keyboard.press(i<25?'Tab':'Shift+Tab');assert.ok(await usableFocus(page));assert.ok(await page.evaluate(()=>!!document.activeElement?.closest('.dialog')));labels.push(await page.evaluate(()=>document.activeElement?.id||document.activeElement?.getAttribute('data-command')||document.activeElement?.tagName));}
    c.metrics.focusSequence=labels;await shot(page,'focus');await page.keyboard.press('Escape');assert.ok(await usableFocus(page));
   }finally{await f.context.close();}
  });
  if(enabled('zoom'))await run(`${tag}-text`,'root-text-enlargement-and-internal-reflow',meta,async c=>{
   const f=await open(browser,viewport,preparedChronicleProfile()),page=f.page;
   try{
    await page.evaluate(()=>document.documentElement.style.fontSize='32px');await settle(page);await shot(page,'enlarged-ready');
    await page.locator('.battle-view').evaluate(e=>e.scrollTop=e.scrollHeight);await shot(page,'enlarged-upgrades');
    c.metrics=await inventory(page);assert.equal(c.metrics.overflow,false);
    await page.locator('.bottom-nav [data-tab="skills"]').click();await shot(page,'enlarged-skills');assert.equal((await inventory(page)).overflow,false);
   }finally{await f.context.close();}
  });
  if(enabled('rapid'))await run(`${tag}-rapid`,'native-double-click-dialog-dismissal-no-click-through',meta,async c=>{
   const f=await open(browser,viewport),page=f.page;
   try{
    const before=await save(page);await page.locator('[data-command="settings"]').click();await page.locator('.close-button').dblclick();await settle(page);
    assert.equal(await page.locator('.dialog').count(),0);assert.equal(await page.locator('#world').getAttribute('data-phase'),'ready');assert.deepEqual(await save(page),before);await shot(page,'dismissed');
   }finally{await f.context.close();}
  });
  if(enabled('background'))await run(`${tag}-background`,'synthetic-visibility-boundary-pauses-without-catchup',{...meta,fixture:'document.hidden override and dispatched visibilitychange, not OS backgrounding'},async c=>{
   const f=await open(browser,viewport),page=f.page;
   try{
    await page.locator('[data-command="start"]').click();await page.locator('[data-unit="0"]').click();
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
    const before=await page.locator('#food-count').textContent();await page.waitForTimeout(1200);assert.equal(await page.locator('#food-count').textContent(),before);
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.locator('#pause').click();await shot(page,'resumed');assert.equal(await page.locator('#world').getAttribute('data-phase'),'running');
   }finally{await f.context.close();}
  });
  if(enabled('context'))await run(`${tag}-context`,'webgl-context-loss-and-restoration',meta,async c=>{
   const f=await open(browser,viewport),page=f.page;
   try{
    await shot(page,'before-loss');
    const supported=await page.locator('canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const extension=gl?.getExtension('WEBGL_lose_context');if(!extension)return false;window.__qaGL=gl;window.__qaRestore=()=>extension.restoreContext();extension.loseContext();return true;});
    c.metrics.extensionAvailable=supported;
    if(!supported){c.metrics.limit='Renderer/engine did not expose WebGL context-loss extension; restoration not tested';return;}
    await page.waitForTimeout(1000);await page.evaluate(()=>window.__qaRestore());await page.waitForFunction(()=>!window.__qaGL.isContextLost());
    await page.locator('[data-command="start"]').click();await page.locator('[data-unit="0"]').click();await page.locator('#pause').click();await shot(page,'restored');
    assert.equal((await save(page)).deployed,1);assert.equal(await page.locator('canvas').count(),1);
   }finally{await f.context.close();}
  });
 }}finally{await browser.close();}
}
finish();
