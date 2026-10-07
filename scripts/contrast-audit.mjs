/**
 * Rendered-pixel contrast audit. For every visible text element on each screen and dialog it hides the text, screenshots the
 * area behind it, and compares the text colour with the darkest, median and lightest background pixel (WCAG AA: 4.5, or 3 for
 * large text). It sees gradients and art that a computed-style check cannot, so it reports candidates, not verdicts: elements
 * partly under the bottom bar, containers that also hold an icon or chip, and decorative circles can read as false positives.
 * Run against a running preview:  node scripts/contrast-audit.mjs [url=http://127.0.0.1:4173/]
 * Set CHROMIUM_PATH to reuse an installed Chromium. Always exits 0; read the list.
 */
import {launchChromium,enterCamp,openCampStation,openEvolution,openJourney,openQuests,pauseField,waitForEntry} from './lib/browser.mjs';
const url=process.argv[2]??'http://127.0.0.1:4173/';
const b=await launchChromium();
const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(90000);
const prof={version:2,timeline:1,age:0,enemyAge:1,furthestBattle:1,coins:3000,gems:2000,foodLevel:2,baseLevel:1,unlocked:[true,true,false],cards:Array(30).fill(0).map((_,i)=>i%4),summonCount:10,summonSeed:4242,pendingVictory:null,kills:12,wins:2,deployed:30,claimed:[],dailyDay:0,dailyStreak:0,sound:true,speed:1,motion:'system',played:true};
await p.addInitScript(s=>{if(!localStorage.getItem('almo7areboon.save.v1'))localStorage.setItem('almo7areboon.save.v1',s)},JSON.stringify(prof));
await p.goto(url);
async function audit(label){
  const items=await p.evaluate(()=>{document.querySelectorAll('[data-audit-id]').forEach(e=>e.removeAttribute('data-audit-id'));const out=[];let n=0;document.querySelectorAll('body *').forEach(e=>{
    if(e.closest('[inert]')&&!e.closest('#modal-layer'))return;if(e.closest('[hidden]'))return;if(e.tagName==='CANVAS'||e.closest('svg'))return;
    if(e.disabled||e.closest(':disabled'))return;
    // Text in a closed <details> is not shown, so there is nothing to measure.
    const closed=e.closest('details:not([open])');if(closed&&!e.closest('summary'))return;
    const t=[...e.childNodes].filter(x=>x.nodeType===3&&x.textContent.trim()).map(x=>x.textContent.trim()).join(' ');if(!t)return;
    const r=e.getBoundingClientRect();if(r.width<4||r.height<4||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return;
    // Anything reaching under a visible bottom bar (Camp's footer) is only partly visible, so its sample would include the bar.
    const nav=[...document.querySelectorAll('.bottom-nav,.camp-footer')].find(n=>n.getClientRects().length&&n.getBoundingClientRect().height>0);if(nav&&!e.closest('.bottom-nav,.camp-footer')&&!e.closest('#modal-layer')&&r.bottom>nav.getBoundingClientRect().top+1)return;
    // Dialogs scroll: text cut by the dialog's own edge is only partly visible too.
    const dlg=e.closest('.dialog');if(dlg){const dr=dlg.getBoundingClientRect();if(r.bottom>dr.bottom-4||r.top<dr.top+4)return;}
    const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0)return;
    e.dataset.auditId=String(n);out.push({id:n,text:t.slice(0,24),cls:(e.className&&e.className.baseVal===undefined?e.className:e.tagName),color:cs.color,size:parseFloat(cs.fontSize),weight:+cs.fontWeight,x:Math.max(0,r.left),y:Math.max(0,r.top),w:Math.min(r.width,innerWidth-Math.max(0,r.left)),h:Math.min(r.height,innerHeight-Math.max(0,r.top))});n++;});return out;});
  const bad=[];
  for(const it of items){
    // Hide this element's text and any nested text, icons and images so only the surface behind it is sampled.
    await p.evaluate(id=>{const style=document.createElement('style');style.id='audit-hide';style.textContent=`[data-audit-id="${id}"],[data-audit-id="${id}"] *{color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important}[data-audit-id="${id}"] svg,[data-audit-id="${id}"] img{visibility:hidden!important}`;document.head.append(style);},it.id);
    const png=await p.screenshot({clip:{x:it.x,y:it.y,width:Math.max(1,it.w),height:Math.max(1,it.h)}});
    await p.evaluate(()=>document.getElementById('audit-hide')?.remove());
    const ratio=await p.evaluate(async([b64,color])=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);const d=g.getImageData(0,0,c.width,c.height).data;
      const lum=(r,g,b)=>[r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const m=color.match(/[\d.]+/g).map(Number);const fl=lum(m[0],m[1],m[2]);
      // worst case: the background pixel whose luminance is closest to the text's
      let worst=99;const ls=[];for(let i=0;i<d.length;i+=4)ls.push(lum(d[i],d[i+1],d[i+2]));ls.sort((a,b)=>a-b);
      const sample=[ls[Math.floor(ls.length*.1)],ls[Math.floor(ls.length*.5)],ls[Math.floor(ls.length*.9)]];
      for(const l of sample){const r=(Math.max(fl,l)+.05)/(Math.min(fl,l)+.05);worst=Math.min(worst,r);}return worst;},[png.toString('base64'),it.color]);
    const large=it.size>=18.66||(it.size>=14&&it.weight>=700);
    if(ratio<(large?3:4.5))bad.push(`${it.cls}|${it.text} ${ratio.toFixed(2)}`);
  }
  console.log(label.padEnd(12),items.length,'elements;',bad.length?'LOW: '+bad.join(' ; '):'all pass');
}
await waitForEntry(p);await audit('entry');
await enterCamp(p);await p.waitForTimeout(500);await audit('camp');
for(const station of ['storehouse','gate','company','journal']){await openCampStation(p,station);await p.waitForTimeout(400);await audit(station);await p.keyboard.press('Escape');await p.waitForTimeout(250);}
await openCampStation(p,'journal');await p.click('[data-command=camp-chapters]');await p.waitForTimeout(600);await audit('battles');await p.keyboard.press('Escape');await p.waitForTimeout(300);
await openEvolution(p);await p.waitForTimeout(400);await audit('evolution');await p.click('[data-command=camp-return]');await p.waitForTimeout(300);
await openJourney(p);await p.waitForTimeout(400);await audit('journal');await p.click('[data-journey-tab=cards]');await p.waitForTimeout(400);await audit('cards');
await p.click('[data-pack="1"]');await p.waitForTimeout(700);await audit('summon');await p.keyboard.press('Escape');await p.waitForTimeout(300);await p.click('[data-command=camp-return]');await p.waitForTimeout(300);
await openQuests(p);await p.waitForTimeout(500);await audit('quests');await p.keyboard.press('Escape');await p.waitForTimeout(300);
await p.click('[data-command=camp-battle]');await p.waitForTimeout(1500);await audit('running');
await pauseField(p);await audit('pause');
await p.click('#modal-layer [data-command=settings]');await p.waitForTimeout(600);await audit('settings');
await p.click('#modal-layer [data-command=reset]');await p.waitForTimeout(600);await audit('reset');
await b.close();
