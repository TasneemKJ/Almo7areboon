import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProfile} from '../src/game/save.ts';
import {Game} from '../src/game/simulation.ts';
import {spoilsHomecomingIntentForEvent} from '../src/view/spoils-homecoming.ts';
import {visualAssets} from '../src/view/visual-assets.ts';
import {readFile} from 'node:fs/promises';

test('the existing painted coin is loaded once for the bounded battlefield pool',()=>{
 const assets=visualAssets().filter(asset=>asset.key==='spoils-coin');
 assert.deepEqual(assets,[{key:'spoils-coin',url:'/art/storybook/interface/coin-token.webp',width:48,height:48,format:'image'}]);
});

test('a real public battle credits coins before emitting the presentation intent',()=>{
 const profile=defaultProfile();profile.foodLevel=100;profile.baseLevel=20;profile.unlocked=[true,true,true];
 const game=new Game(profile);assert.equal(game.dispatch({type:'start'}),true);
 let reward=null;
 for(let tick=0;tick<3000&&!reward&&game.state.phase==='running';tick++){
  if(game.state.food>=3)game.dispatch({type:'spawn',kind:0});
  game.step(.1);
  for(const event of game.drainEvents())if(event.type==='coin'){reward=event;break;}
 }
 assert.ok(reward,'the public battle must resolve a credited combat reward');
 assert.ok(Number.isFinite(reward.amount)&&reward.amount!>0);const amount=reward.amount!;
 assert.ok(game.profile.coins>=amount&&game.state.earned>=amount,'simulation credit must precede presentation');
 const intent=spoilsHomecomingIntentForEvent(reward);
 assert.ok(intent&&intent.x>=24&&intent.x<=426&&intent.amount===amount);
});

test('battlefield launches from the numeric cue and suppresses missing-texture placeholders',async()=>{
 const source=await readFile(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/textures\.exists\('spoils-coin'\).*SPOILS_HOMECOMING_CAP/s);
 assert.match(source,/private spoilsOrder=0/);
 assert.match(source,/rememberSpoilsHomecoming\(this\.spoilsHomecoming,\{\.\.\.intent,x:this\.spoilsReward\.text\.x,y:this\.spoilsReward\.startY\},\+\+this\.spoilsOrder,this\.layout\.height\)/);
 assert.match(source,/this\.spoilsOrder=0;this\.resetEffects\(\)/);
 assert.doesNotMatch(source,/resetEffects[^\n]*this\.spoilsOrder=0/);
});

test('reduced-motion review atomically retains the credited numeric cue before capture',async()=>{
 const review=await readFile(new URL('../scripts/review-chronicle.mjs',import.meta.url),'utf8');
 assert.match(review,/async function pauseAtCreditedCoinCue[\s\S]*dataset\.spoilsReward[\s\S]*button\.click\(\)[\s\S]*return cue/);
 assert.doesNotMatch(review,/waitForCreditedCoin[\s\S]*waitForTimeout\(50\)/);
});
