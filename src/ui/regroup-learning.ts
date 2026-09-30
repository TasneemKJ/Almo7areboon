import { ERAS, foodUpgradeCost, baseUpgradeCost, unlockCost } from '../game/data.ts';
import { availableSummonOdds, cardPackCost } from '../game/cards.ts';
import { advanceStatus } from '../game/mastery.ts';
import type { Profile, BattleState } from '../game/types.ts';

const number=(value:number)=>value.toLocaleString('en-US');
/** A starting point for voluntary replay, never a prediction of victory. */
export function earlierChapter(profile:Readonly<Profile>):number|null {
 const chapter=Math.min(profile.age,profile.enemyAge-1,profile.furthestBattle);
 return Number.isInteger(chapter)&&chapter>=0?chapter:null;
}
/** Reviewable preparation choices; displaying help never dispatches a purchase. */
export function regroupLearningHtml(profile:Readonly<Profile>,state:Readonly<BattleState>):string {
 if(state.phase!=='lost')return '';
 let funded='Try one change at a time. Your coins already earned are kept.';
 if(profile.age<5&&profile.age<=profile.enemyAge&&profile.coins>=ERAS[profile.age].evolveCost)
  funded=`Evolution is affordable: ${number(ERAS[profile.age].evolveCost)} coins. It resets coins, age upgrades and troop unlocks; review Evolution before confirming.`;
 else if(!profile.unlocked[1]&&profile.coins>=unlockCost(1,profile))
  funded=`Unlock ranged troops for ${number(unlockCost(1,profile))} coins, then protect them with a melee front line.`;
 else if(!profile.unlocked[2]&&profile.coins>=unlockCost(2,profile))
  funded=`Unlock heavy troops for ${number(unlockCost(2,profile))} coins. Their sweep can hit a second nearby enemy.`;
 else if(profile.foodLevel<100&&profile.coins>=foodUpgradeCost(profile))
  funded=`Food production can be upgraded for ${number(foodUpgradeCost(profile))} coins. Faster food lets you deploy more often.`;
 else if(profile.baseLevel<100&&profile.coins>=baseUpgradeCost(profile))
  funded=`Base health can be upgraded for ${number(baseUpgradeCost(profile))} coins. A stronger gate gives your army more time.`;
 else if(profile.gems>=cardPackCost(1)&&availableSummonOdds(profile.summonCount,profile.cards).some(weight=>weight>0))
  funded=`You have enough for a single summon costing ${number(cardPackCost(1))} gems; review its odds and your collection in Cards before spending.`;
 const replay=earlierChapter(profile)!==null
  ?'<p>Earlier unlocked chapters can fund preparation. Your own army and upgrades stay when you choose an opponent. Choose an earlier chapter below to review opponents, or use the chapter selector after returning to preparation.</p>':'';
 const returnLabel=advanceStatus(profile,state).reason==='complete'?'Return to chapters':'Prepare next attempt';
 return `<details class="chapter-scouting regroup-teaching"><summary>Prepare the next attempt</summary><p>${funded}</p>${replay}<p>Cards use gems and stay through evolution and new timelines. Summons are random; review costs, odds and your collection in Cards. Extra seals and quests can also earn gems.</p><p>Choose ${returnLabel} below to return to preparation. It buys nothing and waits for you to start the battle.</p></details>`;
}
