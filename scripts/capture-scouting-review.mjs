import assert from 'node:assert/strict';
import { SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';

async function settleScoutingBaseline(source,keys) {
 // Retry commits primary immediately; periodic persistence rotates it into backup.
 // Observe that transition before proving disclosure keys preserve both byte streams.
 await source.waitForFunction(({primary,backup})=>{
  const current=localStorage.getItem(primary);
  return current!==null&&current===localStorage.getItem(backup);
 },keys,{timeout:10000});
}

/** Reuse real mastery seeds and native production startup/session authority. */
export async function reviewScouting({scenario,seeds,setup,open,active,ready,result,saved,bytes,command,inspect}) {
 async function tabTo(page,selector) {
  for(let count=0;count<24;count++){
   if(await page.locator(selector).evaluate(node=>node===document.activeElement))return;
   await page.keyboard.press('Tab');
  }
  throw new Error(`Native Tab did not reach ${selector}`);
 }
 async function disclosure(page,selector,name) {
  await tabTo(page,`${selector} summary`);await page.keyboard.press('Space');
  assert.equal(await page.locator(selector).getAttribute('open'),'');
  await page.locator(selector).scrollIntoViewIfNeeded();
  const bounds=await page.locator(selector).evaluate(node=>{
   const r=node.getBoundingClientRect(),dialog=node.closest('.dialog');
   return {left:r.left,right:r.right,width:innerWidth,scrollWidth:dialog.scrollWidth,clientWidth:dialog.clientWidth};
  });
  assert.ok(bounds.left>=0&&bounds.right<=bounds.width&&bounds.scrollWidth<=bounds.clientWidth+1,JSON.stringify(bounds));
  const paragraphs=page.locator(`${selector} p`);
  for(let index=0;index<await paragraphs.count();index++){
   const paragraph=paragraphs.nth(index);await paragraph.scrollIntoViewIfNeeded();
   const painted=await paragraph.evaluate(node=>{
    const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;
   });
   assert.equal(painted,true,'scrolled tutorial/scouting paragraph is fully painted');
   await page.screenshot({path:`artifacts/browser-review/mastery/${name}-paragraph-${index}.png`});
  }
  await inspect(page,name);
 }
 for(const viewport of [{width:320,height:568},{width:390,height:844}]){
  await scenario(`scouting-and-teaching-${viewport.width}`,viewport,async context=>{
   const source=await setup(context,seeds.older),page=await open(context);await active(page);await result(page);
   assert.match(await page.locator('.village-voice').innerText(),/press-house/);
   await inspect(page,`scouting-victory-${viewport.width}`);
   await command(page,'retry').click();await ready(page);
   assert.match(await page.locator('#deploy-hint').innerText(),/1 melee in 4s/);
   await page.locator('[data-command="battles"]').click();
   await settleScoutingBaseline(source,{primary:SAVE_KEY,backup:BACKUP_KEY});
   const before=await bytes(source);
   const scout='.chapter-scouting:not(.battle-teaching)';
   assert.equal(await page.locator(scout).getAttribute('open'),null);
   assert.match(await page.locator(`${scout} summary`).innerText(),/Olive Terraces/);
   await disclosure(page,scout,`scouting-open-${viewport.width}`);
   assert.match(await page.locator(scout).innerText(),/Ranged pressure at 27s: 1 melee, 1 ranged/);
   await disclosure(page,'.battle-teaching',`scouting-tutorial-${viewport.width}`);
   assert.match(await page.locator('.battle-teaching').innerText(),/Food grows during battle/);
   assert.deepEqual(await bytes(source),before,'native details keys cannot spend, start or write progress');
   await page.keyboard.press('Escape');await ready(page);
   await page.locator('[data-command="battles"]').click();
   assert.equal(await page.locator(scout).getAttribute('open'),null,'reopened disclosure starts collapsed');
   await page.locator('[data-battle="2"]').click();await ready(page);
   assert.equal((await saved(source)).age,5);assert.equal((await saved(source)).enemyAge,2);
   assert.match(await page.locator('#deploy-hint').innerText(),/1 melee in 3s/);
   await page.locator('[data-command="battles"]').click();
   assert.match(await page.locator(`${scout} summary`).innerText(),/Harbor Watch/);
   await disclosure(page,scout,`scouting-switched-${viewport.width}`);
   assert.match(await page.locator(scout).innerText(),/Heavy pressure at 26s/);
   await page.keyboard.press('Escape');await ready(page);
   await page.locator('[data-command="start"]').click();
   await page.waitForFunction(()=>document.querySelector('#world')?.dataset.phase==='running');
   await page.locator('[data-command="pause"]').click();
   assert.doesNotMatch(await page.locator('#deploy-hint').innerText(),/First wave:/);
   assert.equal(await page.locator('.chapter-scouting').count(),0,'no live battlefield overlay');
   return {opponent:2,armyAge:5,nativeDisclosure:true,unchangedDisclosureBytes:true};
  });
 }
}
