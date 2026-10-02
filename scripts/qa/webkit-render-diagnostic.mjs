import {webkit} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {preparedChronicleProfile} from '../simulate-chronicle.ts';
import {SAVE_KEY,BACKUP_KEY} from '../../src/game/save.ts';

const out='artifacts/webkit-render-diagnostic';mkdirSync(out,{recursive:true});
const report={status:'failed',cases:[],errors:[]};
async function sample(page,label){
 const box=await page.locator('#battlefield').screenshot();writeFileSync(`${out}/${label}.png`,box);
 return page.evaluate(async encoded=>{
  const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);
  const data=x.getImageData(0,0,c.width,c.height).data,colors=new Set();let opaque=0;
  for(let y=Math.floor(c.height*.30);y<Math.floor(c.height*.70);y+=3)for(let xx=Math.floor(c.width*.10);xx<Math.floor(c.width*.90);xx+=3){const i=(y*c.width+xx)*4;if(data[i+3]>8)opaque++;colors.add(`${data[i]>>4}:${data[i+1]>>4}:${data[i+2]>>4}:${data[i+3]>>4}`);}
  const canvas=document.querySelector('#battlefield canvas'),r=canvas.getBoundingClientRect(),style=getComputedStyle(canvas);
  let context='unknown',lost=null;
  try{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');if(gl){context='webgl';lost=gl.isContextLost();}else if(canvas.getContext('2d'))context='2d';}catch(error){context='probe-error:'+error;}
  return {colors:colors.size,opaque,width:c.width,height:c.height,buffer:[canvas.width,canvas.height],rect:[r.x,r.y,r.width,r.height],display:style.display,visibility:style.visibility,opacity:style.opacity,phase:document.querySelector('#world').dataset.phase,activeTab:document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.tab,hidden:document.hidden,context,lost};
 },box.toString('base64'));
}
async function open(viewport){
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,reducedMotion:'reduce'}),p=preparedChronicleProfile();p.sound=false;p.motion='reduced';
 await context.addInitScript(({p,key,b})=>{localStorage.setItem(key,JSON.stringify(p));localStorage.setItem(b,JSON.stringify(p));},{p,key:SAVE_KEY,b:BACKUP_KEY});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active'&&document.querySelector('#battlefield canvas')?.width>0);return {context,page};
}
const browser=await webkit.launch({headless:true});
try{
 for(const viewport of [{width:320,height:568},{width:390,height:844}]){
  const item={viewport,cycles:[],recoveries:{}};report.cases.push(item);const {context,page}=await open(viewport);
  try{
   item.initial=await sample(page,`${viewport.width}-initial`);
   for(let cycle=1;cycle<=25;cycle++){
    await page.locator('[data-command="start"]').tap();await page.locator('[data-unit="0"]').tap();await page.locator('#pause').tap();
    for(const tab of ['cards','skills','evolution','battle'])await page.locator(`.bottom-nav [data-tab="${tab}"]`).tap();
    await page.locator('[data-command="settings"]').tap();await page.locator('[data-command="retreat"]').tap();await page.locator('.result-dialog').waitFor();
    await page.locator('[data-command="retry"]').tap();await page.locator('[data-command="start"]').waitFor();
    const state=await sample(page,`${viewport.width}-cycle-${cycle}`);item.cycles.push({cycle,...state});
    if(state.colors<=50){
      const size=page.viewportSize();await page.setViewportSize({width:size.width+1,height:size.height});await page.waitForTimeout(150);await page.setViewportSize(size);await page.waitForTimeout(150);item.recoveries.resize=await sample(page,`${viewport.width}-after-resize`);
      await page.locator('.bottom-nav [data-tab="cards"]').tap();await page.locator('.bottom-nav [data-tab="battle"]').tap();await page.waitForTimeout(150);item.recoveries.tabs=await sample(page,`${viewport.width}-after-tabs`);
      await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await page.waitForTimeout(150);item.recoveries.event=await sample(page,`${viewport.width}-after-event`);
      await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#app')?.dataset.saveSession==='active');item.recoveries.reload=await sample(page,`${viewport.width}-after-reload`);
      break;
    }
   }
  }finally{await context.close();}
 }
 report.status='completed';console.log(JSON.stringify(report,null,2));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
