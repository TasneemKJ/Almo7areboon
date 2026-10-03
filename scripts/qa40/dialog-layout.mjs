/** In-memory rendering of the production evolution template and CSS; no game/network mocks.
 * Complements live-game screenshots with an exact sticky-header/caption geometry assertion.
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import {Game} from '../../src/game/simulation.ts';
import {defaultProfile} from '../../src/game/save.ts';
import {evolutionDialogHtml} from '../../src/ui/progression-screen.ts';
import {icon} from '../../src/view/icons.ts';
const engine=process.env.QA_ENGINE??'chromium',out=process.env.QA_OUT??'artifacts/qa40/dialog-layout';mkdirSync(out,{recursive:true});
const main=readFileSync('src/main.ts','utf8');
const css=[...main.matchAll(/import\s+'(\.\/[^']+\.css)'/g)].map(([,name])=>{
 const file=name==='./ui/continuation.css'&&process.env.QA_LAYOUT_CSS?process.env.QA_LAYOUT_CSS:resolve('src',name);
 return readFileSync(file,'utf8');
}).join('\n');
const p={...defaultProfile(),coins:2500,motion:'reduced'},g=new Game(p);
const markup=evolutionDialogHtml(p,g.state);
assert.ok(markup);
const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(process.env.CHROMIUM_PATH&&engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH}:{})});
const report={engine,scope:'Static production-template/CSS geometry, supplementary to live game journeys',cases:[]};
try{
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'});
  try{
   await page.setContent(`<!doctype html><html data-motion="reduced"><head><style>${css}</style></head><body><div id="app"><main class="game-shell"><div id="modal-layer" class="modal-layer"><section class="dialog" role="dialog" aria-labelledby="dialog-title"><div class="dialog-dismiss"><button class="close-button" aria-label="Close">${icon('close')}</button></div>${markup}</section></div></main></div></body></html>`);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const geometry=await page.evaluate(()=>{
    const box=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};
    return {header:box(document.querySelector('.dialog-dismiss')),caption:box(document.querySelector('.dialog>.eyebrow')),heading:box(document.querySelector('#dialog-title'))};
   });
   const status=geometry.caption.top>=geometry.header.bottom&&geometry.heading.top>=geometry.header.bottom?'PASS':'FAIL';
   const item={viewport,...geometry,status};report.cases.push(item);
   await page.screenshot({path:`${out}/${viewport.width}-${status}.png`});
   console.log(JSON.stringify(item));
  }finally{await page.close();}
 }
 assert.ok(report.cases.every(c=>c.status==='PASS'),'sticky dismiss header must not paint over caption or heading');
}catch(error){report.error=error.stack;process.exitCode=1;}
finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}
