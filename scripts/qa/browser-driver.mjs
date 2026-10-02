import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium,webkit,firefox} from 'playwright';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../../src/game/save.ts';
export {assert,defaultProfile,SAVE_KEY,BACKUP_KEY};
export const origin=process.env.QA_URL??'http://127.0.0.1:4173';
export const out=process.env.QA_OUT??'artifacts/expanded-qa/browser';
mkdirSync(out,{recursive:true});
export const report={revision:process.env.QA_REVISION??execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),started:new Date().toISOString(),scope:'Production browser UI; prepared saves and injected faults are recorded per case; not physical-device acceptance',cases:[],screens:[],errors:[],browsers:{}};
let current;
export async function launch(engine='chromium'){
 const driver={chromium,webkit,firefox}[engine];assert.ok(driver);
 const browser=await driver.launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:engine==='chromium'?['--no-sandbox','--enable-unsafe-swiftshader']:[]});
 report.browsers[engine]=browser.version();return browser;
}
export async function open(browser,viewport={width:390,height:844},profile=defaultProfile(),opts={}){
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:browser.browserType().name()!=='firefox',reducedMotion:'reduce',...opts.context});
 context.setDefaultTimeout(12000);
 const fixture=await context.newPage();
 // Route only a fixture setup page. Production requests, input and rendering remain unmodified.
 await fixture.route(`${origin}/__qa_setup`,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>QA setup</title>'}));
 await fixture.goto(`${origin}/__qa_setup`);
 await fixture.evaluate(({profile,primary,backup})=>{localStorage.setItem(primary,JSON.stringify(profile));localStorage.setItem(backup,JSON.stringify(profile));},{profile:{...profile,sound:false,motion:'reduced'},primary:SAVE_KEY,backup:BACKUP_KEY});
 await fixture.close();
 if(opts.init)await context.addInitScript(opts.init);
 const page=await context.newPage();
 page.on('pageerror',error=>{report.errors.push({case:current?.id,message:String(error)});});
 await page.goto(origin,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('canvas')?.width>0&&['active','temporary'].includes(document.querySelector('#app')?.dataset.saveSession));
 return {page,context};
}
export const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
export async function shot(page,label){
 await settle(page);
 const file=`${current.id}-${label}.png`.replace(/[^a-zA-Z0-9._-]/g,'-');
 await page.screenshot({path:`${out}/${file}`});
 current.screens.push(file);report.screens.push(file);return file;
}
export async function run(id,behavior,meta,fn){
 current={id,behavior,...meta,status:'failed',screens:[],metrics:{}};report.cases.push(current);
 try{await fn(current);current.status='passed';}
 catch(error){current.error=error.stack??String(error);}
 console.log(JSON.stringify({id,status:current.status,error:current.error?.split('\n')[0]}));
 return current;
}
export const save=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);
export const box=locator=>locator.evaluate(e=>{const r=e.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right,hit:!!top&&(e===top||e.contains(top)),viewportHeight:innerHeight};});
export async function usableFocus(page){return page.evaluate(()=>{const e=document.activeElement,r=e?.getBoundingClientRect();return !!e&&e!==document.body&&e!==document.documentElement&&!e.closest('[hidden],[inert]')&&!e.matches(':disabled')&&r.width>0&&r.height>0;});}
export async function inventory(page){
 return page.evaluate(()=>{
  const visible=e=>e.getClientRects().length&&!e.closest('[hidden],[inert]')&&getComputedStyle(e).visibility!=='hidden';
  const controls=[...document.querySelectorAll('button,input,summary')].filter(visible).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {tag:e.tagName,type:e.type,key:e.id||e.dataset.command||e.dataset.tab||e.dataset.storyPage||e.dataset.unit||e.innerText?.trim().slice(0,45),text:e.innerText?.trim().slice(0,70),disabled:!!e.disabled,width:r.width,height:r.height,x:r.x,y:r.y,onscreen:r.y>=0&&r.bottom<=innerHeight,hit:!!top&&e.contains(top),clip:e.scrollWidth>e.clientWidth+1&&s.overflowX!=='visible'};});
  return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,controls,canvas:document.querySelector('canvas')?{width:document.querySelector('canvas').width,height:document.querySelector('canvas').height}:null};
 });
}
export function finish(){
 report.finished=new Date().toISOString();
 report.distinctBehaviors=[...new Set(report.cases.map(c=>c.behavior))];
 report.passed=report.cases.filter(c=>c.status==='passed').length;
 report.failed=report.cases.length-report.passed;
 report.status=report.failed===0&&report.errors.length===0?'passed':'failed';
 writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
 console.log('SUMMARY',JSON.stringify({status:report.status,behaviors:report.distinctBehaviors.length,executions:report.cases.length,passed:report.passed,errors:report.errors.length,screens:report.screens.length}));
 if(report.status!=='passed')process.exitCode=1;
}
