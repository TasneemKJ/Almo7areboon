import {assert,defaultProfile,launch,open,run,shot,box,inventory,save,usableFocus,settle,finish} from './browser-driver.mjs';
import {preparedChronicleProfile,simulateChronicle} from '../simulate-chronicle.ts';
const suite=process.env.QA_SUITE??'interface';
const engines=(process.env.QA_ENGINES??'chromium').split(',');
const sizes=(process.env.QA_SIZES??'320x568,360x640,375x667,390x844,414x896,430x932,320x480,568x320,844x390').split(',').map(s=>{const [width,height]=s.split('x').map(Number);return {width,height};});
const captureAll=process.env.QA_CAPTURE_ALL==='1';
const snap=v=>captureAll||[320,390,430,844].includes(v.width);
for(const engine of engines){
 const browser=await launch(engine);
 try{
  for(const viewport of sizes){
   const tag=`${engine}-${viewport.width}x${viewport.height}`,meta={suite,engine,viewport};
   if(suite==='interface'){
    const p=preparedChronicleProfile();p.furthestBattle=5;p.chronicle.clears=Array(6).fill(127);p.gems=10000;
    const f=await open(browser,viewport,p),page=f.page;
    try{
     for(const screen of ['ready','evolution','cards','skills','settings','quests','battles','chronicle']){
      await run(`${tag}-${screen}`,'screen-navigation-'+screen,meta,async c=>{
       await page.locator('.bottom-nav [data-tab="battle"]').tap();
       if(screen==='evolution'||screen==='cards'||screen==='skills')await page.locator(`.bottom-nav [data-tab="${screen}"]`).tap();
       else if(screen!=='ready')await page.locator(screen==='battles'?'#battle-select':screen==='chronicle'?'.story-open':screen==='quests'?'.resources .gems':'[data-command="settings"]').tap();
       c.metrics.top=await inventory(page);
       if(snap(viewport))await shot(page,'top');
       assert.equal(c.metrics.top.overflow,false,'horizontal viewport overflow');
       const small=c.metrics.top.controls.filter(e=>e.type!=='radio'&&e.type!=='checkbox'&&!e.disabled&&(e.width<43.9||e.height<43.9));
       c.metrics.smallControls=small;
       if(screen!=='ready'&&!['evolution','cards','skills'].includes(screen)){
        await page.locator('.dialog').evaluate(e=>e.scrollTop=e.scrollHeight);await settle(page);
        c.metrics.bottom=await inventory(page);c.metrics.close=await box(page.locator('.close-button'));
        if(snap(viewport))await shot(page,'scrolled');
        assert.ok(c.metrics.close.hit,'Close must stay hit-testable at the bottom of a dialog');
        assert.ok(c.metrics.close.y>=0&&c.metrics.close.bottom<=viewport.height,'Close must stay in viewport');
       }else if(screen!=='ready'){
        await page.locator('#secondary-screen').evaluate(e=>e.scrollTop=e.scrollHeight);
        if(snap(viewport))await shot(page,'scrolled');
        assert.ok(await page.locator('.bottom-nav [data-tab="battle"]').isVisible(),'navigation stays visible');
       }
       assert.deepEqual(small,[],'visible interactive targets below the game 44px minimum');
      });
      if(await page.locator('.close-button').count())await page.locator('.close-button').tap();
     }
     await run(`${tag}-paused-menu-return`,'pause-preserved-through-all-tabs-and-dialogs',meta,async c=>{
      await page.locator('.bottom-nav [data-tab="battle"]').tap();await page.locator('[data-command="start"]').tap();
      await page.locator('[data-unit="0"]').tap();await page.locator('#pause').tap();
      const before=await page.locator('#food-count').textContent();
      for(const tab of ['evolution','cards','skills','battle'])await page.locator(`.bottom-nav [data-tab="${tab}"]`).tap();
      for(const menu of ['settings','quests']){await page.locator(menu==='settings'?'[data-command="settings"]':'.resources .gems').tap();await page.keyboard.press('Escape');}
      assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('#food-count').textContent(),before);
      if(snap(viewport))await shot(page,'paused-return');c.metrics=await inventory(page);
     });
     await run(`${tag}-rotation`,'in-session-rotation-and-return',meta,async c=>{
      await page.setViewportSize({width:viewport.height,height:viewport.width});
      await settle(page);c.metrics.rotated=await inventory(page);if(snap(viewport))await shot(page,'rotated');
      await page.setViewportSize(viewport);await settle(page);c.metrics.returned=await inventory(page);
      assert.equal(c.metrics.returned.overflow,false);assert.ok(c.metrics.returned.canvas.width>0);
      assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
     });
     await run(`${tag}-retreat-retry`,'retreat-and-retry-after-mobile-menu-cycle',meta,async c=>{
      await page.locator('[data-command="settings"]').tap();await page.locator('[data-command="retreat"]').tap();
      await page.locator('.result-dialog').waitFor();if(snap(viewport))await shot(page,'regroup');
      const before=await save(page);assert.equal(before.pendingVictory,null);
      await page.locator('[data-command="retry"]').tap();await page.locator('[data-command="start"]').waitFor();
      const after=await save(page);assert.equal(after.coins,before.coins);assert.equal(after.gems,before.gems);
      c.metrics=await inventory(page);assert.equal(c.metrics.overflow,false);
     });
    }finally{await f.context.close();}
   }
   if(suite==='recovery'){
    await run(`${tag}-restored-focus`,'restored-victory-replay-focus-and-receipt',meta,async c=>{
     const g=simulateChronicle('road');assert.equal(g.state.phase,'won');
     const f=await open(browser,viewport,g.profile);
     try{
      await f.page.locator('.result-dialog').waitFor();await shot(f.page,'restored-victory');
      await f.page.locator('[data-command="retry"]').tap();await f.page.locator('[data-command="start"]').waitFor();await shot(f.page,'replayed');
      c.metrics.focus=await f.page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id}));
      assert.ok(await usableFocus(f.page),'replay must restore visible usable focus');
      const before=await save(f.page);await f.page.reload({waitUntil:'networkidle'});await f.page.locator('[data-command="start"]').waitFor();
      const after=await save(f.page);assert.equal(after.pendingVictory,null);assert.equal(after.coins,before.coins);assert.equal(after.gems,before.gems);
     }finally{await f.context.close();}
    });
    for(const kind of ['rejected','dismissed','overlapping']){
     await run(`${tag}-import-${kind}`,'file-import-'+kind,meta,async c=>{
      const f=await open(browser,viewport),page=f.page;
      try{
       await page.locator('[data-command="settings"]').tap();const before=await save(page);await shot(page,'before');
       await page.evaluate(()=>{window.__realFileText=File.prototype.text;window.__fileReads=[];File.prototype.text=function(){return new Promise((resolve,reject)=>window.__fileReads.push({name:this.name,resolve,reject}));};});
       const file=name=>({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(defaultProfile()))});
       await page.locator('#import-save').setInputFiles(file('first.json'));
       if(kind==='rejected'){
        await page.evaluate(()=>window.__fileReads[0].reject(Error('Disclosed file read failure')));
        await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('could not be read'));
        c.metrics.value=await page.locator('#import-save').inputValue();await shot(page,'read-error');
        assert.equal(c.metrics.value,'','clear failed input so the same file can be selected again');
       }else if(kind==='dismissed'){
        await page.locator('.close-button').tap();await page.locator('.bottom-nav [data-tab="skills"]').tap();
        await page.evaluate(()=>window.__fileReads[0].reject(Error('Disclosed late read failure')));await settle(page);
        c.metrics.toast=await page.locator('#toast').evaluate(e=>({visible:e.classList.contains('visible'),text:e.textContent}));await shot(page,'dismissed');
        assert.equal(c.metrics.toast.visible,false,'dismissed import cannot notify a later screen');
       }else{
        await page.locator('#import-save').setInputFiles(file('second.json'));
        const first={...defaultProfile(),coins:111},second={...defaultProfile(),coins:222};
        await page.evaluate(text=>window.__fileReads[0].resolve(text),JSON.stringify(first));await settle(page);await shot(page,'old-read-complete');
        assert.equal(await page.locator('#import-save').count(),1,'obsolete first read replaced the latest import intent');
        await page.evaluate(text=>window.__fileReads[1].resolve(text),JSON.stringify(second));
        await page.locator('[data-command="confirm-import"]').waitFor();
        c.metrics.confirmation=await page.locator('.dialog').innerText();await shot(page,'latest-read');
        assert.match(c.metrics.confirmation,/222/);assert.doesNotMatch(c.metrics.confirmation,/111/);
        await page.getByRole('button',{name:'CANCEL',exact:true}).tap();
       }
       assert.deepEqual(await save(page),before,'unconfirmed or failed imports cannot change progress');
      }finally{await f.context.close();}
     });
    }
   }
  }
 }finally{await browser.close();}
}
finish();
