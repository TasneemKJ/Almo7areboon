/**
 * Stills of Home and the field for a new and a returning player, phone and iPad, English and Arabic.
 * Run against a running preview:  node scripts/home-shots.mjs <out-dir> [url=http://127.0.0.1:4173/]
 * It writes <device>-<lang>-<new|cont>-<home|play>.png and never writes to the repo unless pointed at it.
 */
import {mkdirSync} from 'node:fs';
import {launchChromium,waitForEntry,press} from './lib/browser.mjs';
const out=process.argv[2];if(!out)throw new Error('usage: node scripts/home-shots.mjs <out-dir> [url]');
const url=process.argv[3]??'http://127.0.0.1:4173/';
mkdirSync(out,{recursive:true});
const returning={version:2,timeline:1,age:2,enemyAge:2,furthestBattle:2,coins:1800,gems:400,foodLevel:3,baseLevel:3,unlocked:[true,true,true],cards:Array(30).fill(0).map((_,i)=>i%3),summonCount:4,summonSeed:4242,pendingVictory:null,kills:140,wins:9,deployed:210,claimed:[],dailyDay:0,dailyStreak:0,sound:false,speed:1,motion:'system',played:true};
const devices={phone:{viewport:{width:390,height:844},deviceScaleFactor:2},ipad:{viewport:{width:1024,height:1366},deviceScaleFactor:1}};
const b=await launchChromium();
for(const [dev,opt] of Object.entries(devices))for(const lang of ['en','ar'])for(const who of ['new','cont']){
 const ctx=await b.newContext({...opt,hasTouch:true,isMobile:dev==='phone'});const p=await ctx.newPage();p.setDefaultTimeout(60000);
 await p.addInitScript(([l,s])=>{localStorage.setItem('almo7areboon.lang.v1',l);if(s)localStorage.setItem('almo7areboon.save.v1',s);},[lang,who==='cont'?JSON.stringify(returning):'']);
 await p.goto(url);await waitForEntry(p);await p.waitForTimeout(1800);
 await p.screenshot({path:`${out}/${dev}-${lang}-${who}-home.png`});
 await press(p,'#entry-play');await p.waitForFunction(()=>document.getElementById('app')?.dataset.entry==='play');
 // A new player meets the opening tale: skip it to reach the field.
 const skip=p.locator('.intro-skip').first();if(await skip.count())await skip.click().catch(()=>{});
 await p.waitForTimeout(3500);
 await p.screenshot({path:`${out}/${dev}-${lang}-${who}-play.png`});
 await ctx.close();
}
await b.close();
console.log('wrote',out);
