import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {simulateChronicle,preparedChronicleProfile} from './simulate-chronicle.ts';
const base=process.env.REVIEW_URL??'http://127.0.0.1:4173',out='artifacts/chronicle';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--enable-unsafe-swiftshader']});
const errors=[],checks=[],screens=[];
async function open(name,width,height,profile){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'});
 if(profile)await context.addInitScript(p=>{if(!localStorage.getItem('chronicle-fixture-loaded')){localStorage.setItem('almo7areboon.save.v1',JSON.stringify(p));localStorage.setItem('chronicle-fixture-loaded','yes');}},profile);
 const page=await context.newPage();page.on('pageerror',e=>errors.push({name,error:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({name,error:m.text()});});
 await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('canvas');await page.waitForTimeout(500);return {page,context,name};
}
async function shot(fixture,state){const file=`${fixture.name}-${state}.png`;await fixture.page.screenshot({path:`${out}/${file}`});screens.push(file);}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'root must not overflow horizontally');}
const saved=page=>page.evaluate(()=>localStorage.getItem('almo7areboon.save.v1'));
try{
 for(const [width,height] of [[320,568],[390,844],[1024,768]]){
  const f=await open(`${width}`,width,height);await shot(f,'ready');await noOverflow(f.page);
  await f.page.locator('[data-command="chronicle"]').first().click();await f.page.locator('.chronicle-book').waitFor();await noOverflow(f.page);await shot(f,'journey');
  assert.equal(await f.page.locator('[data-story-route="bell"]').isDisabled(),true);assert.equal(await f.page.locator('[data-story-route="whisper"]').isDisabled(),true);
  await f.page.locator('[data-story-route="escort"]').click();await f.page.locator('[data-command="start"]').click();
  await f.page.locator('#story-rally').click();await f.page.locator('[data-unit="0"]').click();
  await f.page.waitForTimeout(1400);assert.equal(await f.page.locator('#story-rally').getAttribute('aria-pressed'),'true');await shot(f,'rally');
  await f.page.locator('#story-rally').click();assert.equal(await f.page.locator('#story-rally').getAttribute('aria-pressed'),'false');checks.push(`${width}: boot, journey, route gate, escort, rally/release, no overflow`);await f.context.close();
 }
 for(const restoration of [0,7]){
  const p=preparedChronicleProfile();p.chronicle.restoration=restoration;const f=await open(`390-restoration-${restoration?'full':'none'}`,390,844,p),before=await saved(f.page);
  await shot(f,'ready');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before);await noOverflow(f.page);
  checks.push(`disclosed restoration=${restoration} ready-state fixture renders the current painted settlement without presentation save writes`);await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.sound=true;const f=await open('390-company',390,844,p);
  await f.page.locator('[data-command="chronicle"]').first().click();await f.page.locator('.story-company summary').click();
  const dialog=f.page.locator('.chronicle-dialog'),captain=f.page.locator('[data-story-captain="gatekeeper"]');await captain.scrollIntoViewIfNeeded();await captain.focus();const captainScroll=await dialog.evaluate(node=>node.scrollTop);await captain.click();
  assert.equal(await f.page.evaluate(()=>document.activeElement?.getAttribute('data-story-captain')),'gatekeeper');assert.ok(Math.abs(await dialog.evaluate(node=>node.scrollTop)-captainScroll)<=2);
  const tale=f.page.locator('[data-story-tale="borrowed-bell"]');await tale.focus();const taleScroll=await dialog.evaluate(node=>node.scrollTop);await tale.click();assert.equal(await f.page.evaluate(()=>document.activeElement?.getAttribute('data-story-tale')),'borrowed-bell');assert.ok(Math.abs(await dialog.evaluate(node=>node.scrollTop)-taleScroll)<=2);await shot(f,'preparation');
  await f.page.locator('[data-story-route="escort"]').click();await f.page.locator('[data-command="start"]').click();await f.page.locator('[data-unit="0"]').click();
  await f.page.waitForTimeout(1400);await f.page.locator('[data-unit="1"]').click();await f.page.waitForTimeout(1700);await f.page.locator('[data-unit="2"]').click();
  await f.page.locator('[data-skill="food"]').click();assert.equal(await f.page.locator('[data-skill="food"]').isDisabled(),true);
  await shot(f,'escort-captain');await noOverflow(f.page);checks.push('captain and featured tale preserve storybook scroll/focus; captain cast consumed once');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.speed=1;const f=await open('390-formation',390,844,p);await f.page.locator('[data-command="start"]').click();
  await f.page.locator('[data-unit="0"]').click();const ranged=f.page.locator('[data-unit="1"]');await f.page.waitForFunction(()=>{const node=document.querySelector('[data-unit="1"]');return node instanceof HTMLButtonElement&&!node.disabled;},null,{timeout:15000});assert.equal(await ranged.isDisabled(),false);await ranged.click();await f.page.waitForTimeout(900);
  const before=await saved(f.page);await shot(f,'protected-thread');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before);
  assert.match(await f.page.locator('#deploy-hint').textContent(),/Freeze|keeps watch|Gather/);await noOverflow(f.page);checks.push('real defender then ranged deployment renders its live formation relationship without presentation save writes');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.chronicle.route='bell';const f=await open('390-bell',390,844,p);await f.page.locator('[data-command="start"]').click();
  await f.page.waitForFunction(()=>document.querySelector('#deploy-hint')?.textContent?.includes('Bell ringing in'),null,{timeout:90000});await shot(f,'warning');assert.match(await f.page.locator('#deploy-hint').textContent(),/Bell ringing in/);checks.push('boss actor and objective guidance are present');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.timeline=2;p.mastery.timeline=2;p.chronicle.timeline=2;p.chronicle.route='lantern';const f=await open('390-night',390,844,p);await f.page.locator('[data-command="start"]').click();await f.page.locator('[data-unit="0"]').click();await f.page.waitForTimeout(3600);await shot(f,'lantern');checks.push('alternate timeline and lantern route render without errors');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.chronicle.route='scout';const f=await open('390-rescue',390,844,p);await f.page.locator('[data-command="start"]').click();
  for(const kind of [0,1,0,2,1,2]){const button=f.page.locator(`[data-unit="${kind}"]`);await f.page.waitForFunction(value=>{const node=document.querySelector(`[data-unit="${value}"]`);return node instanceof HTMLButtonElement&&!node.disabled;},String(kind),{timeout:20000});await button.click();}
  await f.page.waitForFunction(()=>/^Free the scout · [123]\./.test(document.querySelector('#deploy-hint')?.textContent??''),null,{timeout:60000});await f.page.keyboard.press('Space');await f.page.getByRole('button',{name:/Resume battle/i}).waitFor();
  let before=await saved(f.page);await shot(f,'cage-progress');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before,'paused rescue presentation must not write progress');
  await f.page.keyboard.press('Space');await f.page.waitForFunction(()=>document.querySelector('#deploy-hint')?.textContent?.includes('Scout returning home'),null,{timeout:20000});await f.page.keyboard.press('Space');await f.page.getByRole('button',{name:/Resume battle/i}).waitFor();
  before=await saved(f.page);await shot(f,'scout-homecoming');await f.page.waitForTimeout(450);assert.equal(await saved(f.page),before,'paused homecoming presentation must not write progress');await noOverflow(f.page);
  checks.push('public controls reach real cage progress and a rescued scout returning separately, without presentation save writes');await f.context.close();
 }
 {
  const p=simulateChronicle('escort').profile;p.chronicle.discoveries=0;const f=await open('390-discovery',390,844,p);await f.page.locator('.result-dialog').waitFor();await f.page.locator('.story-discoveries summary').click();
  await f.page.locator('[data-story-discovery="door"]').click();await f.page.waitForTimeout(200);assert.equal(await f.page.locator('[data-story-discovery="door"]').isDisabled(),true);assert.equal(await f.page.evaluate(()=>{const active=document.activeElement;return active instanceof HTMLElement&&active.closest('.result-dialog')!==null&&!active.matches(':disabled,[aria-disabled="true"]');}),true);await shot(f,'found-page');
  await f.page.locator('.result-dialog [data-command="chronicle"]').click();await f.page.keyboard.press('Escape');await f.page.locator('.result-dialog').waitFor();
  await f.page.reload({waitUntil:'networkidle'});await f.page.locator('.result-dialog').waitFor();const save=await f.page.evaluate(()=>JSON.parse(localStorage.getItem('almo7areboon.save.v1')));assert.equal(save.chronicle.discoveries,1);checks.push('discovery persists, restores enabled focus and closing storybook restores the result instead of stranding the player');await f.context.close();
 }
 {
  const p=preparedChronicleProfile();p.chronicle.route='escort';p.chronicle.expedition={stage:0,chapter:0,reserve:0,provision:'supplies'};const won=simulateChronicle('escort',p).profile;
  const f=await open('390-expedition',390,844,won);await f.page.locator('.result-dialog').waitFor();assert.equal(await f.page.locator('[data-command="next"]').count(),0);
  await f.page.locator('[data-story-provision="shelter"]').click();await shot(f,'checkpoint');await f.page.locator('[data-command="story-continue"]').click();
  await f.page.reload({waitUntil:'networkidle'});await f.page.locator('[data-command="start"]').waitFor();const saved=await f.page.evaluate(()=>JSON.parse(localStorage.getItem('almo7areboon.save.v1')));assert.equal(saved.chronicle.expedition.stage,1);assert.equal(saved.chronicle.expedition.provision,'shelter');assert.equal(saved.pendingVictory,null);checks.push('expedition continue consumes receipt once and resumes the next objective after reload');await f.context.close();
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){errors.push({name:'review',error:String(error)});process.exitCode=1;}
finally{await writeFile(`${out}/report.json`,JSON.stringify({scope:'Chromium software rendering; portrait and desktop fixtures, not physical-device or organic-progression acceptance',checks,screens,errors},null,2));console.log(JSON.stringify({checks,screens,errors},null,2));await browser.close();}
