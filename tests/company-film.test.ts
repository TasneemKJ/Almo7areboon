import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {companyFilmHtml,COMPANY_FILMS} from '../src/ui/company-film.ts';
import {introHtml,introLength} from '../src/ui/intro-screen.ts';

test('optional movie offers both local languages without fetching before deliberate play',()=>{
 const html=companyFilmHtml();assert.match(html,/preload="none"/);assert.match(html,/<video[^>]*controls[^>]*playsinline/);assert.doesNotMatch(html,/<video[^>]*\ssrc=/);assert.doesNotMatch(html,/autoplay/);
 assert.equal(COMPANY_FILMS.ar,'./film/company-ar.mp4');assert.equal(COMPANY_FILMS.en,'./film/company-en.mp4');assert.match(html,/Game English/);assert.match(html,/data-command="close"/);
});
test('cinema opening preserves local art and offers explicit Arabic with a bounded 12 seconds',()=>{
 assert.equal(introLength(),12000);const html=introHtml(0,'ar');assert.match(html,/lang="ar" dir="rtl"/);assert.match(html,/تخطّ/);assert.match(html,/Opening language/);assert.doesNotMatch(html,/<video|\.mp4/);
});
test('optional movie is excluded from service-worker caching and range interception',()=>{
 const worker=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');assert.match(worker,/request\.headers\?\.has\('range'\)/);assert.match(worker,/mp4\|wav/);
 const build=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');assert.doesNotMatch(build,/mp4/);
});

test('movie requests never call respondWith or cache APIs',async()=>{
 const {runInNewContext}=await import('node:vm');const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');let fetchHandler:(event:unknown)=>void=()=>{};
 runInNewContext(source,{URL,self:{location:{origin:'https://game.test'},registration:{scope:'https://game.test/'},addEventListener:(name:string,fn:(event:unknown)=>void)=>{if(name==='fetch')fetchHandler=fn;}}});
 for(const url of ['https://game.test/film/company-en.mp4','https://game.test/film/company-ar.mp4'])fetchHandler({request:{url,method:'GET',headers:new Headers()},respondWith:()=>assert.fail('optional film must use browser fetch'),waitUntil:()=>assert.fail('no film cache writes')});
 fetchHandler({request:{url:'https://game.test/custom-video',method:'GET',headers:new Headers({range:'bytes=100-'})},respondWith:()=>assert.fail('range request must pass through')});
});
