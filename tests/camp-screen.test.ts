import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {createChronicle} from '../src/game/chronicle.ts';
import {chapterPresentation} from '../src/ui/chapter-presentation.ts';
const path=new URL('../src/ui/camp-screen.ts',import.meta.url);
const camp=existsSync(path)?await import('../src/ui/camp-screen.ts'):null;
const buttons=(html:string)=>[...html.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]);
const gameAt=(age:number,coins=0)=>{const p=defaultProfile();Object.assign(p,{age,enemyAge:age,furthestBattle:age,coins});return new Game(p);};

test('Camp root has exactly Battle/Home chrome and four illustrated named physical places',()=>{
 assert.ok(camp,'physical root must replace the old dashboard');
 for(let age=0;age<6;age++){
  const game=gameAt(age),before=JSON.stringify([game.profile,game.state]);game.profile.enemyAge=5;
  const html=camp.campRootHtml(game.profile),all=buttons(html),physical=all.filter(b=>b.includes('data-camp-station'));
  assert.equal(all.length,6);assert.equal(physical.length,4);
  for(const place of ['storehouse','gate','company','journal'])assert.match(html,new RegExp(`data-camp-station="${place}"`));
  assert.match(html,/data-command="camp-battle"/);assert.match(html,/data-command="camp-home"/);
  assert.match(html,new RegExp(chapterPresentation(age).title));assert.match(html,/Destination: Courtyards Beyond/);
  assert.doesNotMatch(html,/data-tab=|data-unit=|data-skill=|data-order=|data-claim=|bottom-nav|unit-card/);
  assert.ok((html.match(/<img|<svg/g)??[]).length>=5,'places need actual illustration, not icon labels');
  game.profile.enemyAge=age;assert.equal(JSON.stringify([game.profile,game.state]),before);
 }
});
test('Camp reads all station and troop views without changing profile, RNG, time, wave, food or units',()=>{
 assert.ok(camp);const game=gameAt(2,1e6),before=JSON.stringify([game.profile,game.state]);
 for(const focus of ['storehouse','gate','company','journal',{recruit:0},{recruit:1},{recruit:2}] as const)camp.campFocusHtml(game,focus);
 for(let n=0;n<120;n++)game.step(1);
 assert.equal(JSON.stringify([game.profile,game.state]),before);
});
for(let age=0;age<6;age++)for(const stat of ['food','base'] as const)test(`Camp ${stat} exact boundary wallets in army age ${age}`,()=>{
 assert.ok(camp);const expected=(stat==='food'?50:40)*8**age,focus=stat==='food'?'storehouse':'gate';
 for(const offset of [-1,0,1]){
  const game=gameAt(age,expected+offset);const html:string=camp.campFocusHtml(game,focus);const buy:string=buttons(html).find(b=>b.includes(`data-camp-action="${stat}"`))!;
  assert.ok(buy);assert.equal(buy.includes('disabled'),offset<0);assert.match(html,new RegExp(`${expected.toLocaleString('en-US')} coins`));
  if(offset<0)assert.match(html,/1 more coin/);
  assert.equal(buttons(html).length,2);
 }
 const capped=gameAt(age,1e9);capped.profile[stat==='food'?'foodLevel':'baseLevel']=100;
 const html=camp.campFocusHtml(capped,focus);assert.match(html,/Fully improved/);assert.match(buttons(html)[0],/disabled/);
});
test('Food and gate focused previews match canonical accepted effects and next price',()=>{
 assert.ok(camp);const food=gameAt(0,50);let html=camp.campFocusHtml(food,'storehouse');
 assert.match(html,/0\.80.*0\.94/s);assert.ok(food.dispatch({type:'upgrade',stat:'food'}));html=camp.campFocusHtml(food,'storehouse');
 assert.equal(food.profile.coins,0);assert.match(html,/71 coins/);assert.match(html,/0\.94/);assert.match(html,/data-work-level="1"/);
 assert.equal(food.dispatch({type:'upgrade',stat:'food'}),false);assert.equal(food.profile.foodLevel,1);
 const gate=gameAt(0,40);assert.match(camp.campFocusHtml(gate,'gate'),/180.*252/s);assert.ok(gate.dispatch({type:'upgrade',stat:'base'}));
 assert.equal(gate.state.playerHp,252);assert.equal(gate.profile.coins,0);assert.match(camp.campFocusHtml(gate,'gate'),/252/);
});
test('Bread and repairs are existing exclusive preparations with exact unlocked focused controls',()=>{
 assert.ok(camp);const game=gameAt(0);game.profile.chronicle=createChronicle(1,0);game.profile.chronicle.restoration=7;
 assert.equal(buttons(camp.campFocusHtml(game,'storehouse')).length,3);assert.equal(buttons(camp.campFocusHtml(game,'gate')).length,3);
 assert.match(camp.campFocusHtml(game,'storehouse'),/Pack bread/);assert.match(camp.campFocusHtml(game,'gate'),/Prepare repairs/);
 assert.ok(game.dispatch({type:'chronicle-preparation',preparation:'bread'}));assert.match(camp.campFocusHtml(game,'storehouse'),/Remove bread/);
 assert.ok(game.dispatch({type:'chronicle-preparation',preparation:'repair'}));assert.equal(game.profile.chronicle.preparation,'repair');
 assert.match(camp.campFocusHtml(game,'storehouse'),/replaces.*repairs/);assert.match(camp.campFocusHtml(game,'gate'),/Remove repairs/);
 assert.ok(game.dispatch({type:'chronicle-preparation',preparation:'none'}));assert.equal(game.profile.chronicle.preparation,'none');assert.equal(game.profile.coins,0);
});
test('All six chapters keep canonical locked recruit coins and separate future food costs',()=>{
 assert.ok(camp);
 for(let age=0;age<6;age++)for(const kind of [1,2] as const){
  const expected=(kind===1?150:400)*8**age,game=gameAt(age,expected),html=camp.campFocusHtml(game,{recruit:kind});
  assert.match(html,new RegExp(`${expected.toLocaleString('en-US')} coins`));assert.match(html,new RegExp(`${kind===1?5:age===0?7:9} food`));
  assert.equal(buttons(html).length,2);assert.doesNotMatch(html,/data-unit=|data-skill=|data-order=/);
  assert.ok(game.dispatch({type:'unlock',kind}));assert.equal(game.profile.coins,0);assert.equal(game.state.stats.deployed,0);
  assert.equal(buttons(camp.campFocusHtml(game,{recruit:kind})).length,1);
 }
});
test('Company and journal keep new focus limits and identify unresolved legacy destinations specifically',()=>{
 assert.ok(camp);const game=gameAt(0),html=camp.campFocusHtml(game,'company'),all=buttons(html);
 assert.equal(all.filter(b=>b.includes('data-camp-recruit')).length,3);assert.equal(all.filter(b=>!b.includes('data-camp-recruit')).length,3);
 assert.match(html,/Evolution/);assert.match(html,/Storybook decisions/);assert.match(html,/Freeze/);assert.match(html,/Meteor/);assert.match(html,/Food Drop/);
 assert.doesNotMatch(html,/three skill buttons above/);
 const journal=camp.campFocusHtml(game,'journal');assert.equal(buttons(journal).length,3);assert.match(journal,/Choose battle/);assert.match(journal,/Company journal/);
});
test('the first accepted food upgrade changes the physical Storehouse depiction',()=>{
 assert.ok(camp);const game=gameAt(0,50),before=camp.campRootHtml(game.profile);assert.ok(game.dispatch({type:'upgrade',stat:'food'}));assert.notEqual(camp.campRootHtml(game.profile),before);
});
test('mid and near-cap Camp prices preserve independently calculated canonical rounding in every age',()=>{
 assert.ok(camp);
 for(let age=0;age<6;age++)for(const level of [1,7,37,99])for(const stat of ['food','base'] as const){
  const expected=Math.min(1e9,Math.round((stat==='food'?50:40)*8**age*(stat==='food'?1.42:1.45)**level));
  for(const delta of [-1,0,1]){
   const p=defaultProfile();Object.assign(p,{age,enemyAge:age,furthestBattle:age,coins:expected+delta,[stat==='food'?'foodLevel':'baseLevel']:level});const game=new Game(p);
   const html:string=camp.campFocusHtml(game,stat==='food'?'storehouse':'gate'),buy=buttons(html).find(b=>b.includes(`data-camp-action="${stat}"`))!;
   assert.match(html,new RegExp(`${expected.toLocaleString('en-US')} coins`));assert.equal(buy.includes('disabled'),delta<0);
   const time=game.state.time,food=game.state.food,wave=game.state.wave;assert.equal(game.dispatch({type:'upgrade',stat}),delta>=0);
   assert.equal(game.profile.coins,delta<0?expected-1:Math.min(1e9,expected+delta)-expected);assert.equal(game.state.phase,'ready');assert.equal(game.state.time,time);assert.equal(game.state.wave,wave);assert.equal(game.state.food,food);
  }
 }
});

test('the Camp journal uses the approved painted work prop on root and focused surfaces',()=>{
 assert.ok(camp);const game=gameAt(0);
 for(const html of [camp.campRootHtml(game.profile),camp.campFocusHtml(game,'journal')]){
  assert.match(html,/src="\/art\/storybook\/camp\/journal\.webp"/);
  assert.ok(existsSync(new URL('../public/art/storybook/camp/journal.webp',import.meta.url)));
 }
});

test('the Storehouse is a distinct painted provisioning stall, with an earned food accent',()=>{
 assert.ok(camp);const game=gameAt(0,50),before=camp.campRootHtml(game.profile);
 assert.match(before,/src="\/art\/storybook\/camp\/storehouse\.webp"/);
 assert.doesNotMatch(before,/class="camp-stock-food"/);
 assert.ok(game.dispatch({type:'upgrade',stat:'food'}));
 assert.match(camp.campRootHtml(game.profile),/class="camp-stock-food"/);
 assert.match(camp.campFocusHtml(game,'storehouse'),/src="\/art\/storybook\/camp\/storehouse\.webp"/);
 assert.ok(existsSync(new URL('../public/art/storybook/camp/storehouse.webp',import.meta.url)));
});
