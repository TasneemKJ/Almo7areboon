import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import {defaultProfile} from '../src/game/save.ts';
import {Game} from '../src/game/simulation.ts';
import {spoilsHomecomingIntentForEvent} from '../src/view/spoils-homecoming.ts';
import {visualAssets} from '../src/view/visual-assets.ts';
import {readFile} from 'node:fs/promises';

test('the bounded battlefield pool adds no decoded texture allocation',()=>{
 const assets=visualAssets().filter(asset=>asset.key==='spoils-coin');
 assert.deepEqual(assets,[]);
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

test('battlefield launches from the numeric cue with capped painted geometry',async()=>{
 const source=battlefieldSource();
 assert.match(source,/paintSpoilsToken\(host\.fx\(\),frame\)/);
 assert.match(source,/spoils\.slice\(0,SPOILS_HOMECOMING_CAP\)/);
 assert.doesNotMatch(source,/spoilsTokens/);
 assert.doesNotMatch(source,/spoils-coin|coin-token\.webp/);
 assert.match(source,/let spoilsOrder=0/);
 assert.match(source,/rememberSpoilsHomecoming\(spoils,\{\.\.\.intent,x:floater\.text\.x,y:floater\.startY\},\+\+spoilsOrder,host\.layout\(\)\.height\)/);
 assert.match(source,/this\.marks\.restartOrder\(\);this\.effects\.reset\(\)/);
 assert.doesNotMatch(source,/resetEffects[^\n]*this\.spoilsOrder=0/);
});

test('reduced-motion review atomically retains the credited numeric cue before capture',async()=>{
 const review=await readFile(new URL('../scripts/review-chronicle.mjs',import.meta.url),'utf8');
 assert.match(review,/async function pauseAtCreditedCoinCue[\s\S]*dataset\.spoilsReward[\s\S]*button\.click\(\)[\s\S]*return cue/);
 assert.doesNotMatch(review,/waitForCreditedCoin[\s\S]*waitForTimeout\(50\)/);
});
