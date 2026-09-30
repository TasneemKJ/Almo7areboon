import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProfile} from '../src/game/save.ts';
import {readFileSync} from 'node:fs';
import {CARD_DEFS,type CardRarity} from '../src/game/cards.ts';
import {cardIllustration} from '../src/view/card-illustrations.ts';
import {cardsScreenHtml,summonedCardsHtml} from '../src/ui/cards-screen.ts';

async function frameModule(){
 const path='../src/view/card-frame.ts';
 const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});
 assert.ok(m,'crafted card-frame grammar must exist');
 return m;
}
const decode=(uri:string)=>decodeURIComponent(uri.slice(uri.indexOf(',')+1));

test('rarity frame grammar grows in emphasis while preserving a generous object clearing',async()=>{
 const m=await frameModule();
 const rarities:CardRarity[]=['common','rare','epic','legendary'];
 const specs=rarities.map(r=>m.cardFrameSpec(r));
 assert.deepEqual(specs.map((s:any)=>s.ornamentCount),[0,1,3,5]);
 assert.ok(specs.every((s:any)=>s.clearRadius>=42&&s.plinthY>=106&&s.rimWidth<=3));
 assert.ok(specs.every((s:any)=>s.outerInset>=5&&s.outerInset<=9));
});

test('four rarity frames are visually distinct, self-contained and object-safe',async()=>{
 const m=await frameModule();
 const outputs=['common','rare','epic','legendary'].map(r=>m.cardFrameSvg(r as CardRarity,'#76a8de'));
 assert.equal(new Set(outputs).size,4);
 for(const svg of outputs){
  assert.match(svg,/data-layer="card-frame"/);
  assert.match(svg,/data-clear-radius="[4-9][0-9]"/);
  assert.doesNotMatch(svg,/<image|<script|foreignObject|NaN|undefined|Infinity/);
  assert.ok(svg.length<7000);
 }
});

test('all 30 illustrations retain distinct objects inside the shared rarity framing system',()=>{
 const svgs=CARD_DEFS.map((card,index)=>({card,svg:decode(cardIllustration(index))}));
 assert.equal(new Set(svgs.map(x=>x.svg)).size,30);
 for(const {card,svg} of svgs){
  assert.match(svg,new RegExp(`data-rarity="${card.rarity}"`));
  assert.match(svg,/data-layer="card-frame"/);
  assert.match(svg,/data-layer="card-object"/);
  assert.match(svg,/data-layer="card-ground"/);
  assert.doesNotMatch(svg,/<image|<script|foreignObject|NaN|undefined/);
 }
});

test('collection and summon surfaces expose rarity metadata without adding menu structure',()=>{
 const p=defaultProfile();
 p.cards[0]=1;p.cards[16]=1;p.cards[24]=1;p.cards[28]=1;
 const html=cardsScreenHtml(p);
 for(const rarity of ['common','rare','epic','legendary'])assert.match(html,new RegExp(`data-rarity="${rarity}"`));
 assert.equal((html.match(/class="collection-card /g)??[]).length,CARD_DEFS.length);
 const before=[...p.cards];p.cards[28]++;
 const result=summonedCardsHtml(before,p);
 assert.match(result,/data-rarity="legendary"/);
 assert.doesNotMatch(result,/new-panel|extra-menu|card-details-modal/);
});

test('rarity styling remains structural and motion-free',()=>{
 const source=readFileSync(new URL('../src/ui/material-language.css',import.meta.url),'utf8');
 for(const rarity of ['common','rare','epic','legendary'])assert.ok(source.includes(`data-rarity=${rarity}`));
 assert.doesNotMatch(source,/collection-card[^}]*animation\s*:/s);
 assert.doesNotMatch(source,/collection-card[^}]*position\s*:\s*fixed/s);
});

test('a summon reveal lists the rarest cards first and flags first-time cards',()=>{
 const p=defaultProfile();p.cards[0]=1;
 const before=[...p.cards];
 p.cards[0]++;p.cards[9]++;p.cards[28]++;p.cards[16]++;
 const html=summonedCardsHtml(before,p);
 const order=[...html.matchAll(/data-rarity="(\w+)"/g)].map(m=>m[1]);
 assert.deepEqual(order,['legendary','rare','common','common']);
 assert.equal((html.match(/· NEW/g)??[]).length,3,'three cards were new; the duplicate is not');
});

test('an owned card shows the multiplier it contributes on its own',()=>{
 const p=defaultProfile();p.cards[0]=1;p.cards[28]=3;
 const html=cardsScreenHtml(p);
 assert.match(html,/LEVEL 1 · ×1\.03 health/);
 assert.match(html,/LEVEL 2 · ×[\d.]+ damage/);
 assert.match(html,/NOT DISCOVERED/);
});
