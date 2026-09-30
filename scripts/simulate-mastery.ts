import { pathToFileURL } from 'node:url';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { CARD_DEFS, ERAS, QUESTS, foodUpgradeCost, unlockCost } from '../src/game/data.ts';
import type { Action, UnitKind } from '../src/game/types.ts';

export const MASTERY_POLICIES = ['immediate','reserve-and-counter','mixed'] as const;
export type MasteryPolicy = typeof MASTERY_POLICIES[number];
const counters: Record<string,readonly UnitKind[]> = {rush:[2,0,1],volley:[0,0,2,1],bulwark:[0,1,1],final:[0,1,0]};
export function playMasteryAttempt(game: Game, policy: MasteryPolicy, record?: (action: Action)=>void): void {
  if (!game.dispatch({type:'start'})) throw Error('Attempt did not start from ready');
  let sequenceIndex=0;
  const act=(action:Action)=>{const accepted=game.dispatch(action);if(accepted)record?.(action);return accepted;};
  for(let tick=0;tick<360*60&&game.state.phase==='running';tick++) {
    const time=game.state.time, living=game.state.units.filter(u=>u.side==='enemy'&&u.hp>0).length, waves=game.waveStatus();
    if(time>=8)act({type:'skill',skill:'food'});
    if(time>=33&&living>=3)act({type:'skill',skill:'meteor'});
    if(time>=44&&living>=3)act({type:'skill',skill:'freeze'});
    const planned:readonly UnitKind[]=policy==='immediate'?[0]:policy==='mixed'?[2,1,0,1]:counters[waves.preview?.intent??'final'];
    const available=planned.filter(kind=>game.profile.unlocked[kind]);
    // Ten seconds gathers the starting food into an initial formation; it is
    // the reserve policy, not an artificial campaign-duration floor.
    if((policy==='immediate'||time>=10)&&available.length&&act({type:'spawn',kind:available[sequenceIndex%available.length]}))sequenceIndex++;
    game.step(1/60);game.drainEvents();
  }
  if(game.state.phase==='running')throw Error(`Combat timeout: ${policy}, chapter ${game.profile.enemyAge}`);
}
export function simulateMastery(policy: MasteryPolicy, claimDaily=false) {
  const game=new Game(defaultProfile());
  const actions:Array<{attempt:number;time:number;action:Action;coins:number;gems:number}>=[];
  const attempts:Array<Record<string,unknown>>=[];
  const transitions:Array<Record<string,unknown>>=[];
  let attempt=0,totalSeconds=0,questGems=0,dailyGems=0,firstVictoryPurchase=false;
  let evolution: {age:number;chapter:number;attempt:number;losses:number;wins:number;purchase:boolean}|null=null;
  const evolutionPurchases:Array<Record<string,unknown>>=[];
  const wallets=()=>({coins:game.profile.coins,gems:game.profile.gems});
  const act=(action:Action)=>{const accepted=game.dispatch(action);if(accepted)actions.push({attempt,time:game.state.time,action:structuredClone(action),...wallets()});return accepted;};
  if(claimDaily){const before=game.profile.gems;act({type:'daily',day:20726});dailyGems+=game.profile.gems-before;}
  const collect=()=>{
    for(const q of QUESTS){const before=game.profile.gems;if(act({type:'claim',id:q.id}))questGems+=game.profile.gems-before;}
    while(act({type:'summon',count:1})) { /* paid deterministic stream only */ }
  };
  collect();
  while(game.profile.timeline===1&&attempt<40) {
    collect();
    const oldAge=game.profile.age,oldEnemy=game.profile.enemyAge,oldFrontier=game.profile.furthestBattle;
    if(act({type:'evolve'})) {
      evolution={age:game.profile.age,chapter:oldEnemy,attempt:attempt+1,losses:0,wins:0,purchase:false};
      transitions.push({kind:'evolve',beforeAge:oldAge,afterAge:game.profile.age,enemyBefore:oldEnemy,enemyAfter:game.profile.enemyAge,frontierBefore:oldFrontier,frontierAfter:game.profile.furthestBattle,...wallets()});
    }
    const prepare=()=>{
      const start=actions.length;
      if(policy!=='immediate')act({type:'unlock',kind:1});
      while(game.profile.foodLevel<3&&act({type:'upgrade',stat:'food'})) { /* finite desired levels */ }
      if(policy!=='immediate')act({type:'unlock',kind:2});
      while(game.profile.foodLevel<6&&act({type:'upgrade',stat:'food'})) { /* finite desired levels */ }
      if(evolution&&!evolution.purchase&&actions.length>start) {
        evolution.purchase=true;evolutionPurchases.push({...evolution,atAttempt:game.state.phase==='ready'?attempt+1:attempt,time:game.state.time,phase:game.state.phase,...wallets()});
      }
    };
    prepare();
    attempt++;
    const start={chapter:game.profile.enemyAge,armyAge:game.profile.age,foodLevel:game.profile.foodLevel,unlocked:[...game.profile.unlocked],...wallets()},startActions=actions.length;
    playMasteryAttempt(game,policy,action=>actions.push({attempt,time:game.state.time,action:structuredClone(action),...wallets()}));
    totalSeconds+=game.state.time;
    if(evolution&&!evolution.purchase){if(game.state.phase==='won')evolution.wins++;else evolution.losses++;}
    const receipt=game.profile.pendingVictory;
    attempts.push({attempt,...start,outcome:game.state.phase,seconds:game.state.time,endingWallet:wallets(),stats:structuredClone(game.state.stats),earned:game.state.earned,settlement:receipt?structuredClone(receipt):null,cardCopies:game.profile.cards.reduce((sum,n)=>sum+n,0),actions:actions.length-startActions});
    if(game.state.phase==='won') {
      // The first clear must create an actual useful buying choice, independently
      // of its optional seals. Record the cheapest available purchase here.
      const cost=Math.min(foodUpgradeCost(game.profile),game.profile.unlocked[1]?Infinity:unlockCost(1,game.profile));
      if(game.profile.wins===1)firstVictoryPurchase=game.profile.coins>=cost;
      if(evolution&&!evolution.purchase)prepare();
      collect();
      const before={timeline:game.profile.timeline,chapter:game.profile.enemyAge,...wallets()};
      if(!act({type:'next'}))throw Error('Settled win could not advance');
      transitions.push({kind:'next',before,after:{timeline:game.profile.timeline,chapter:game.profile.enemyAge,...wallets()}});
    } else {
      if(evolution&&!evolution.purchase)prepare();
      if(!act({type:'retry'}))throw Error('Loss could not retry');
    }
  }
  const collection=game.profile.cards.map((copies,index)=>({id:CARD_DEFS[index].id,rarity:CARD_DEFS[index].rarity,copies})).filter(card=>card.copies>0);
  return {policy,claimDaily,completed:game.profile.timeline===2,attempts,totalSeconds,firstVictoryPurchase,questGems,dailyGems,questClaims:[...game.profile.claimed],collection,commonOnly:collection.every(card=>card.rarity==='common'),evolutionPurchases,transitions,finalWallet:wallets(),finalLifetime:{wins:game.profile.wins,kills:game.profile.kills,deployed:game.profile.deployed},actions};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  for(const policy of MASTERY_POLICIES)process.stdout.write(JSON.stringify(simulateMastery(policy))+'\n');
}
