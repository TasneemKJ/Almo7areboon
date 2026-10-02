import {assert,launch,open,run,shot,settle,finish,report,out} from './browser-driver.mjs';
import {preparedChronicleProfile} from '../simulate-chronicle.ts';
import {writeFileSync} from 'node:fs';
const engine=process.env.QA_ENGINES??'webkit',browser=await launch(engine);
async function pixels(page,id){
 const png=await page.locator('#battlefield').screenshot();writeFileSync(`${out}/${id}.png`,png);
 const sample=await page.evaluate(async encoded=>{
  const image=new Image();image.src=`data:image/png;base64,${encoded}`;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const {data,width,height}=ctx.getImageData(0,0,canvas.width,canvas.height),colors=new Set();let n=0;
  // Sample the middle of the playfield, clear of top and bottom HUD clusters.
  for(let y=Math.floor(height*.36);y<height*.64;y+=3)for(let x=Math.floor(width*.15);x<width*.85;x+=3){const i=(y*width+x)*4;colors.add(`${data[i]>>4}:${data[i+1]>>4}:${data[i+2]>>4}`);n++;}
  const c=document.querySelector('canvas'),r=c.getBoundingClientRect();
  return {colors:colors.size,samples:n,width,height,buffer:[c.width,c.height],rect:[r.x,r.y,r.width,r.height],phase:document.querySelector('#world').dataset.phase,hidden:document.hidden,resizeEvents:window.__qaResizes};
 },png.toString('base64'));
 return sample;
}
async function samples(page,item,name){
 const result=[];
 for(const delay of [0,50,250,1000]){
  if(delay)await page.waitForTimeout(delay);
  result.push({delay,...await pixels(page,`${item.id}-${name}-${delay}`)});
 }
 item.metrics[name]=result;
 assert.ok(result.at(-1).colors>50,`${name}: battlefield remains blank or near-uniform after recovery`);
}
try{
 for(const viewport of [{width:320,height:568},{width:390,height:844}]){
  await run(`${engine}-${viewport.width}-render`,'painted-battlefield-survives-retry-and-context-loss',{engine,viewport},async item=>{
   const f=await open(browser,viewport,preparedChronicleProfile()),page=f.page;
   try{
    await page.evaluate(()=>{window.__qaResizes=[];new ResizeObserver(entries=>{for(const e of entries)window.__qaResizes.push({at:performance.now(),target:e.target.id,width:e.contentRect.width,height:e.contentRect.height});}).observe(document.querySelector('#battlefield'));});
    await samples(page,item,'initial');
    for(let i=0;i<20;i++){
     await page.locator('[data-command="start"]').tap();await page.locator('[data-unit="0"]').tap();await page.locator('#pause').tap();
     for(const tab of ['cards','skills','evolution','battle'])await page.locator(`.bottom-nav [data-tab="${tab}"]`).tap();
     await page.locator('[data-command="settings"]').tap();await page.locator('[data-command="retreat"]').tap();await page.locator('.result-dialog').waitFor();
     await page.locator('[data-command="retry"]').tap();await page.locator('[data-command="start"]').waitFor();
    }
    await shot(page,'after-cycles');await samples(page,item,'after-cycles');
    const available=await page.locator('canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl'),extension=gl?.getExtension('WEBGL_lose_context');if(!extension)return false;window.__qaGL=gl;window.__qaRestore=()=>extension.restoreContext();extension.loseContext();return true;});
    item.metrics.contextExtension=available;
    if(available){await page.waitForTimeout(500);await page.evaluate(()=>window.__qaRestore());await page.waitForFunction(()=>!window.__qaGL.isContextLost());await samples(page,item,'after-context');}
   }finally{await f.context.close();}
  });
 }
}finally{await browser.close();finish();}
