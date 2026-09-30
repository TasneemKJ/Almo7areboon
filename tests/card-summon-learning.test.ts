import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { CARD_DEFS } from '../src/game/cards.ts';
import { summonedCardsHtml } from '../src/ui/cards-screen.ts';

for(const copies of [0,1,2])test(`paid summon teaches ${copies===0?'discovery':copies===1?'duplicate progress':'level-up'} without changing the receipt`,()=>{
 const profile=defaultProfile();profile.cards=CARD_DEFS.map(card=>card.rarity==='common'?copies:0);profile.gems=100;profile.summonCount=16*copies;
 const game=new Game(profile),before=[...game.profile.cards];assert.equal(game.dispatch({type:'summon',count:1}),true);
 const changed=game.profile.cards.findIndex((n,i)=>n>before[i]);assert.ok(changed>=0);assert.equal(CARD_DEFS[changed].rarity,'common');
 const snapshot=JSON.stringify(game.profile),html=summonedCardsHtml(before,game.profile);
 assert.match(html,/Bonuses apply automatically.*evolution and new timelines/);assert.match(html,/data-command="close"/);assert.equal(game.profile.gems,0);assert.equal(JSON.stringify(game.profile),snapshot);
 if(copies===0){assert.match(html,/1\.00 → ×1\.03/);assert.match(html,/NEW/);}
 if(copies===1){assert.match(html,/Next level: 1 \/ 2 copies/);assert.doesNotMatch(html,/→/);}
 if(copies===2){assert.match(html,/1\.03 → ×1\.08/);assert.doesNotMatch(html,/NEW/);}
});

test('a capped bonus or full collection receipt promises no further power',()=>{
 const profile=defaultProfile(),before=[...profile.cards];before[0]=393;profile.cards[0]=394;
 assert.match(summonedCardsHtml(before,profile),/Bonus cap reached/);assert.doesNotMatch(summonedCardsHtml(before,profile),/Next level:/);
 before[0]=999;profile.cards[0]=1000;assert.match(summonedCardsHtml(before,profile),/Collection limit reached/);
});
