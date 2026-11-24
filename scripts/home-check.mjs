/**
 * Home check: every text line on Home must reach 4.5:1 against the real pixels behind it, at seven phone and iPad sizes,
 * in English and Arabic, for a new and a returning player (the in-app locked journey note included), plus every chapter's
 * plate at one phone and one iPad size. It also fails on overlapping Home controls, targets under 44px, horizontal
 * scroll and, on a tablet, a phone-width column (Home must fill the screen and its type must grow).
 *
 * Unlike contrast-audit.mjs (percentiles, report only) it measures the WORST background pixels, applies no large-text
 * exemption, freezes animation while sampling and exits 1 on any failure.
 * npm run review:home (serves dist/ on a free port in 4700-4799, REVIEW_PORT wins), or against a running preview: node scripts/home-check.mjs <url>
 * Set CHROMIUM_PATH to reuse an installed Chromium. HOME_CHECK_QUICK=1 runs only 390x844 and 1024x1366.
 */
import {spawn} from 'node:child_process';
import {freePort,launchChromium,waitForEntry} from './lib/browser.mjs';
// With no URL it serves dist/ itself on a free port in the repo's review range (REVIEW_PORT wins) and stops it after.
let server=null,url=process.argv[2];
if(!url){
 const port=String(await freePort());url=`http://127.0.0.1:${port}/`;
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',port,'--strictPort'],{stdio:'pipe'});
 await new Promise((ok,fail)=>{const t=setTimeout(()=>fail(new Error('preview did not start')),30000);server.stderr.resume();server.stdout.on('data',d=>{if(String(d).replace(/\x1b\[[0-9;]*m/g,'').includes(':'+port)){clearTimeout(t);ok();}});server.on('exit',c=>{clearTimeout(t);fail(new Error(`preview exited ${c}`));});});
}
process.on('exit',()=>server?.kill());
const MIN=4.5;
const sizes=[[375,667],[390,844],[430,932],[768,1024],[820,1180],[1024,1366],[1366,1024]];
const quick=process.env.HOME_CHECK_QUICK==='1';
const base={version:2,timeline:1,furthestBattle:2,coins:1800,gems:400,foodLevel:3,baseLevel:3,cards:Array(30).fill(0).map((_,i)=>i%3),summonCount:4,summonSeed:4242,pendingVictory:null,kills:140,wins:9,deployed:210,claimed:[],dailyDay:0,dailyStreak:0,sound:false,speed:1,motion:'system',played:true};
const returning=(age)=>({...base,age:Math.max(0,age-1),enemyAge:age,furthestBattle:age,unlocked:[true,true,age>0]});
const cases=[];
for(const [w,h] of sizes){if(quick&&!((w===390&&h===844)||(w===1024&&h===1366)))continue;for(const lang of ['en','ar']){
 cases.push({w,h,lang,who:'new',save:null,app:false});
 cases.push({w,h,lang,who:'returning',save:returning(2),app:false});
 cases.push({w,h,lang,who:'returning-app',save:returning(2),app:true});
}}
for(const [w,h] of [[390,844],[1024,1366]])for(const lang of ['en','ar'])for(const age of [0,1,3,4,5])cases.push({w,h,lang,who:`chapter-${age+1}`,save:returning(age),app:false});

const b=await launchChromium();
const failures=[];let measured=0,worstSeen=99;
for(const c of cases){
 const ctx=await b.newContext({viewport:{width:c.w,height:c.h},deviceScaleFactor:1,hasTouch:true,isMobile:c.w<600,reducedMotion:'reduce'});
 const p=await ctx.newPage();p.setDefaultTimeout(60000);
 await p.addInitScript(([lang,save,app])=>{
  try{localStorage.setItem('almo7areboon.lang.v1',lang);if(save&&!localStorage.getItem('almo7areboon.save.v1'))localStorage.setItem('almo7areboon.save.v1',save);}catch{}
  // The iPhone app: a message handler makes the bridge report inApp, so the locked chapters note is drawn as it ships.
  if(app)window.webkit={messageHandlers:{almo7areboon:{postMessage(){}}}};
 },[c.lang,c.save?JSON.stringify(c.save):null,c.app]);
 await p.goto(url);await waitForEntry(p);
 await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
 await p.evaluate(()=>Promise.all([...document.querySelectorAll('#entry-screen img')].map(i=>i.complete?0:i.decode().catch(()=>0))));
 await p.waitForTimeout(300);
 const label=`${c.w}x${c.h} ${c.lang} ${c.who}`;
 const items=await p.evaluate(()=>{const out=[];let n=0;document.querySelectorAll('#entry-screen *').forEach(e=>{
  if(e.closest('[hidden]'))return;
  const t=[...e.childNodes].filter(x=>x.nodeType===3&&x.textContent.trim()).map(x=>x.textContent.trim()).join(' ');if(!t)return;
  const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0||cs.display==='none')return;
  const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return;
  // Sample the glyph box only: a Range hugs the text, not the padded element.
  const range=document.createRange();range.selectNodeContents(e);const rects=[...range.getClientRects()].filter(q=>q.width>1&&q.height>1);
  e.dataset.homeId=String(n);out.push({id:n++,text:t.slice(0,28),color:cs.color,rects:rects.map(q=>({x:q.left,y:q.top,w:q.width,h:q.height}))});});return out;});
 for(const it of items){
  await p.evaluate(id=>{const s=document.createElement('style');s.id='home-hide';s.textContent=`#entry-screen *{text-decoration-color:transparent!important}[data-home-id="${id}"],[data-home-id="${id}"] *{color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important}`;document.head.append(s);},it.id);
  let worst=99;
  for(const q of it.rects){
   const clip={x:Math.max(0,q.x),y:Math.max(0,q.y),width:Math.max(1,Math.min(q.w,c.w-Math.max(0,q.x))),height:Math.max(1,Math.min(q.h,c.h-Math.max(0,q.y)))};
   const png=await p.screenshot({clip});
   const r=await p.evaluate(async([b64,color])=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const g=cv.getContext('2d');g.drawImage(img,0,0);const d=g.getImageData(0,0,cv.width,cv.height).data;
    const lum=(r,g,b)=>[r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const m=color.match(/[\d.]+/g).map(Number);const fl=lum(m[0],m[1],m[2]);let w=99;
    for(let i=0;i<d.length;i+=4){const l=lum(d[i],d[i+1],d[i+2]);const ratio=(Math.max(fl,l)+.05)/(Math.min(fl,l)+.05);if(ratio<w)w=ratio;}return w;},[png.toString('base64'),it.color]);
   worst=Math.min(worst,r);
  }
  await p.evaluate(()=>document.getElementById('home-hide')?.remove());
  measured++;worstSeen=Math.min(worstSeen,worst);
  if(worst<MIN)failures.push(`${label}: "${it.text}" ${worst.toFixed(2)}:1`);
 }
 // Layout: controls do not overlap, are at least 44px, nothing scrolls sideways, a tablet Home fills the screen.
 const layout=await p.evaluate(()=>{const problems=[];const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest('[hidden]');};
  const controls=[...document.querySelectorAll('#entry-screen button')].filter(vis);
  for(const e of controls){const r=e.getBoundingClientRect();if(r.height<44-0.5||r.width<44-0.5)problems.push(`target ${e.id||e.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
   if(r.left<-0.5||r.right>innerWidth+0.5||r.top<-0.5||r.bottom>innerHeight+0.5)problems.push(`offscreen ${e.id||e.className}`);}
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i].getBoundingClientRect(),c=controls[j].getBoundingClientRect();if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)problems.push(`overlap ${controls[i].id} / ${controls[j].id}`);}
  const words=[...document.querySelectorAll('#entry-screen .entry-copy')].filter(vis);
  for(const w of words)for(const k of controls.filter(k=>!w.contains(k))){const a=w.getBoundingClientRect(),c=k.getBoundingClientRect();if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)problems.push(`words under ${k.id}`);}
  if(document.documentElement.scrollWidth>innerWidth+1)problems.push('horizontal scroll');
  const screen=document.getElementById('entry-screen').getBoundingClientRect();
  if(innerWidth>=700){
   if(screen.width<innerWidth-1)problems.push(`tablet Home is a ${Math.round(screen.width)}px column`);
   const title=parseFloat(getComputedStyle(document.getElementById('entry-title')).fontSize),play=parseFloat(getComputedStyle(document.getElementById('entry-play')).fontSize);
   if(title<52)problems.push(`tablet title ${title}px`);if(play<20)problems.push(`tablet Play ${play}px`);
   const sub=parseFloat(getComputedStyle(document.getElementById('entry-subtitle')).fontSize);if(sub<16)problems.push(`tablet subtitle ${sub}px`);
  }
  const rtl=document.documentElement.dir==='rtl';if(rtl!==(document.documentElement.lang==='ar'))problems.push('dir does not follow lang');
  return problems;});
 for(const pr of layout)failures.push(`${label}: ${pr}`);
 // The field on a tablet: the HUD and tray grow with the screen and nothing overlaps.
 if(c.who==='returning'){
  await p.tap('#entry-play');await p.waitForFunction(()=>document.getElementById('app')?.dataset.entry==='play');await p.waitForTimeout(1200);
  const play=await p.evaluate(()=>{const problems=[];const box=s=>{const e=document.querySelector(s);if(!e)return null;let r=e.getBoundingClientRect();if(e.tagName!=='BUTTON'&&getComputedStyle(e).display==='block'){const g=document.createRange();g.selectNodeContents(e);r=g.getBoundingClientRect();}return r.width>1&&r.height>1?{r,e}:null;};
   const hud=['.field-food','.field-chrome button','#age-title','#field-goal-pill','#field-cue'].map(box).filter(Boolean);
   for(let i=0;i<hud.length;i++)for(let j=i+1;j<hud.length;j++){const a=hud[i].r,b=hud[j].r;if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)problems.push(`HUD overlap ${hud[i].e.id||hud[i].e.className} / ${hud[j].e.id||hud[j].e.className}`);}
   const cards=[...document.querySelectorAll('.deployment [data-unit]')].filter(e=>e.getBoundingClientRect().height>0);
   for(const c of cards){const r=c.getBoundingClientRect();if(r.height<44||r.width<44)problems.push('tray card under 44px');}
   for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){const a=cards[i].getBoundingClientRect(),b=cards[j].getBoundingClientRect();if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)problems.push('tray cards overlap');}
   const big=innerWidth>=700&&innerHeight>=700;const fs=s=>{const e=document.querySelector(s);return e?parseFloat(getComputedStyle(e).fontSize):99;};
   if(big){if(fs('#age-title')<28)problems.push(`tablet field title ${fs('#age-title')}px`);if(fs('.deployment [data-unit] .unit-name')<15)problems.push(`tablet troop name ${fs('.deployment [data-unit] .unit-name')}px`);if(fs('#field-goal-pill')<15)problems.push(`tablet goal ${fs('#field-goal-pill')}px`);
    const pause=box('.field-chrome button');if(pause&&pause.r.height<52)problems.push('tablet pause under 52px');}
   if(document.documentElement.scrollWidth>innerWidth+1)problems.push('field scrolls sideways');
   return problems;});
  for(const pr of play)failures.push(`${label} field: ${pr}`);
 }
 await ctx.close();
}
await b.close();
console.log(`home-check: ${cases.length} views, ${measured} text lines, worst ${worstSeen.toFixed(2)}:1`);
server?.kill();
if(failures.length){console.log(`FAIL ${failures.length}:\n`+[...new Set(failures)].join('\n'));process.exit(1);}
console.log('home-check: all pass');process.exit(0);
