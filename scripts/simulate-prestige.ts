// Public-action evidence only. Prepared profiles are explicitly labeled; never assign combat results.
// node --experimental-strip-types scripts/simulate-prestige.ts campaign [choice=hearth] [target=30] [attempts=600] [policy=mixed] [recovery=adaptive] [summon=1]
// node --experimental-strip-types scripts/simulate-prestige.ts comparisons|prepared-seals|clear-only
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { CARD_DEFS, QUESTS, foodUpgradeCost, unlockCost } from '../src/game/data.ts';
import { cardBonuses } from '../src/game/cards.ts';
import { currentSealCount, isLegacyChoice } from '../src/game/prestige.ts';
import type { Action, LegacyChoice, Profile, UnitKind } from '../src/game/types.ts';

export type PrestigePolicy = 'mixed' | 'minimal' | 'immediate' | 'objectives' | 'clear-only' | 'hold-gate';
export interface PrestigeOptions {
 targetTimeline?:number;maxAttempts?:number;policy?:PrestigePolicy;choice?:LegacyChoice;summon?:boolean;recovery?:'adaptive'|'fixed';profile?:Profile;source?:string;claimDaily?:boolean;
}
type Wallet={coins:number;gems:number};
export interface AcceptedAction {attempt:number;timeline:number;chapter:number;time:number;action:Action;before:Wallet;after:Wallet;}
export function playPrestigeAttempt(game:Game,policy:PrestigePolicy,act:(a:Action)=>boolean,limitSeconds=900) {
 assert.equal(act({type:'start'}),true,'every counted attempt must start');let cycle=0;
 const freeze:Array<{castTime:number;until:number;targets:number}>=[];
 for(let tick=0;tick<limitSeconds*60&&game.state.phase==='running';tick++) {
  const time=game.state.time,chapter=game.profile.enemyAge,living=game.state.units.filter(u=>u.side==='enemy'&&u.hp>0).length;
  if(policy==='minimal'&&chapter>0) {
   if(game.state.stats.gateDamageTaken>0){act({type:'skill',skill:'food'});if(chapter!==3&&act({type:'skill',skill:'freeze'}))freeze.push({castTime:time,until:game.state.freezeUntil,targets:game.state.stats.maxFreezeTargets});if(chapter!==4)act({type:'skill',skill:'meteor'});}
  }else if(policy==='objectives') {
   if(time>=8)act({type:'skill',skill:'food'});
   if(chapter!==2&&living>=3){if(act({type:'skill',skill:'freeze'}))freeze.push({castTime:time,until:game.state.freezeUntil,targets:game.state.stats.maxFreezeTargets});act({type:'skill',skill:'meteor'});}
  }else if(policy==='clear-only') {
   if(chapter===2&&time>=8){act({type:'skill',skill:'food'});if(act({type:'skill',skill:'freeze'}))freeze.push({castTime:time,until:game.state.freezeUntil,targets:game.state.stats.maxFreezeTargets});}
  }else if(policy==='hold-gate') {
   if(game.state.stats.gateDamageTaken>0&&act({type:'skill',skill:'freeze'}))freeze.push({castTime:time,until:game.state.freezeUntil,targets:game.state.stats.maxFreezeTargets});
  }else {
   if(time>=8)act({type:'skill',skill:'food'});
   if(time>=33&&living>=3)act({type:'skill',skill:'meteor'});
   if(time>=44&&living>=3&&act({type:'skill',skill:'freeze'}))freeze.push({castTime:time,until:game.state.freezeUntil,targets:game.state.stats.maxFreezeTargets});
  }
  const reserve=policy==='minimal'&&chapter>0?game.state.stats.gateDamageTaken===0:policy==='objectives'?(chapter===3||chapter===4)?!game.state.skillsUsed.includes('freeze'):chapter===5?false:time<10:
   policy==='clear-only'?game.state.stats.gateDamageTaken===0||chapter===0&&time<76:policy==='mixed'?time<10:false;
  const roles:readonly UnitKind[]=policy==='objectives'?[0,1,2]:policy==='immediate'||policy==='clear-only'||policy==='minimal'&&chapter===1?[0]:[2,1,0,1];
  const available=roles.filter(kind=>game.profile.unlocked[kind]);
  if(policy!=='hold-gate'&&!reserve&&available.length&&act({type:'spawn',kind:available[cycle%available.length]}))cycle++;
  game.step(1/60);game.drainEvents();
 }
 return {outcome:game.state.phase,seconds:game.state.time,freeze};
}
export function simulatePrestige(options:PrestigeOptions={}) {
 const {targetTimeline=30,maxAttempts=600,policy='mixed',choice='hearth',summon=true,recovery='adaptive',claimDaily=false}=options;
 assert.ok(Number.isInteger(targetTimeline)&&targetTimeline>=1&&targetTimeline<=1000);assert.ok(Number.isInteger(maxAttempts)&&maxAttempts>=1&&maxAttempts<=100000);assert.ok(['mixed','minimal','immediate','objectives','clear-only','hold-gate'].includes(policy));assert.ok(isLegacyChoice(choice));assert.ok(recovery==='fixed'||recovery==='adaptive');
 assert.ok(!options.profile||options.source,'prepared profiles require a disclosed source');
 const game=new Game(options.profile??defaultProfile()),initialProfile=structuredClone(game.profile);
 const ledger={starting:game.profile.gems,ordinaryGems:0,masteryGems:0,resetGems:0,questGems:0,dailyGems:0,spentGems:0,ordinaryCoins:0,masteryCoins:0,spentCoins:0,discardedCoins:0,expectedGems:game.profile.gems,expectedCoins:game.profile.coins};
 const actions:AcceptedAction[]=[],purchases:AcceptedAction[]=[],attemptRows:Array<Record<string,unknown>&{outcome:string}>=[];
 const transitions:Array<{timeline:number;nextTimeline:number;attempt:number;seals:number;rankBefore:number;rankAfter:number;choice:LegacyChoice;actualGemCredit:number;cards:number;bonuses:ReturnType<typeof cardBonuses>;ledger:typeof ledger}>=[];
 const evolutionPurchases:Array<{age:number;chapter:number;wins:number;losses:number;action:AcceptedAction}>=[];
 const evolution:{current:{age:number;chapter:number;wins:number;losses:number;purchased:boolean}|null}={current:null};
 let attempts=0,totalSeconds=0,streak=0,maxStreak=0,firstVictoryPurchase=false;
 let combatTimeout:Record<string,unknown>|null=null;
 const wallets=():Wallet=>({coins:game.profile.coins,gems:game.profile.gems});
 const act=(action:Action)=>{
  const before=wallets(),time=game.state.time,timeline=game.profile.timeline,chapter=game.profile.enemyAge;
  if(!game.dispatch(action))return false;
  const after=wallets(),record={attempt:attempts,timeline,chapter,time,action:structuredClone(action),before,after};actions.push(record);
  if(action.type==='claim')ledger.questGems+=after.gems-before.gems;
  if(action.type==='daily')ledger.dailyGems+=after.gems-before.gems;
  if(action.type==='summon')ledger.spentGems+=before.gems-after.gems;
  if(action.type==='prestige'){ledger.resetGems+=after.gems-before.gems;ledger.discardedCoins+=before.coins-after.coins;}
  if(action.type==='upgrade'||action.type==='unlock'){ledger.spentCoins+=before.coins-after.coins;purchases.push(record);if(evolution.current&&!evolution.current.purchased){evolution.current.purchased=true;evolutionPurchases.push({...evolution.current,action:record});}}
  if(action.type==='evolve'){ledger.discardedCoins+=before.coins-after.coins;purchases.push(record);evolution.current={age:game.profile.age,chapter,wins:0,losses:0,purchased:false};}
  return true;
 };
 const collect=()=>{for(const q of QUESTS)act({type:'claim',id:q.id});if(summon)for(const count of [50,10,1] as const)while(act({type:'summon',count})){/* bounded by actual wallet/collection */}};
 const prepare=()=>{if(policy!=='immediate')act({type:'unlock',kind:1});while(game.profile.foodLevel<3&&act({type:'upgrade',stat:'food'})){/* finite desired level */}if(policy!=='immediate')act({type:'unlock',kind:2});while(game.profile.foodLevel<6&&act({type:'upgrade',stat:'food'})){/* finite desired level */}};
 if(claimDaily)act({type:'daily',day:20726});
 while(attempts<maxAttempts&&game.profile.timeline<targetTimeline) {
  const p=game.profile;
  if(recovery==='adaptive'&&streak>=2&&p.coins===0&&p.enemyAge>0&&p.mastery.chapters[p.enemyAge-1].earnedMask&1)act({type:'select-battle',battle:p.enemyAge-1});
  collect();if(p.age<5&&p.age<=p.enemyAge)act({type:'evolve'});prepare();attempts++;
  const start={attempt:attempts,timeline:p.timeline,chapter:p.enemyAge,armyAge:p.age,foodLevel:p.foodLevel,baseLevel:p.baseLevel,unlocked:[...p.unlocked],legacy:structuredClone(p.legacy),startingFood:game.state.food,startingGate:game.state.playerMaxHp,coins:p.coins,gems:p.gems,cards:p.cards.reduce((s,n)=>s+n,0)};
  const gemsBefore=p.gems,result=playPrestigeAttempt(game,policy,act);totalSeconds+=result.seconds;
  if(result.outcome==='running'){combatTimeout={...start,seconds:result.seconds,playerHp:game.state.playerHp,enemyHp:game.state.enemyHp};break;}
  assert.ok(result.outcome==='won'||result.outcome==='lost');
  const receipt=p.pendingVictory,masteryGems=receipt?.settlement==='mastery-v1'?receipt.masteryGems:0,masteryCoins=receipt?.settlement==='mastery-v1'?receipt.masteryCoins:0;
  // Derive ordinary credits from actual wallet delta, never the nominal 10 at a cap.
  ledger.ordinaryGems+=p.gems-gemsBefore-masteryGems;ledger.masteryGems+=masteryGems;ledger.ordinaryCoins+=game.state.earned-masteryCoins;ledger.masteryCoins+=masteryCoins;
  attemptRows.push({...start,...result,gateDamage:game.state.stats.gateDamageTaken,remainingGate:game.state.playerHp,stats:structuredClone(game.state.stats),receipt:structuredClone(receipt),earned:game.state.earned,endingCoins:p.coins,endingGems:p.gems});
  if(evolution.current&&!evolution.current.purchased){if(result.outcome==='won')evolution.current.wins++;else evolution.current.losses++;}
  if(result.outcome==='won') {
   streak=0;if(p.wins===1){const cost=Math.min(foodUpgradeCost(p),p.unlocked[1]?Infinity:unlockCost(1,p));firstVictoryPurchase=p.coins>=cost;}
   if(evolution.current&&!evolution.current.purchased)prepare();collect();
   if(p.enemyAge===5){const timeline=p.timeline,seals=currentSealCount(p),rankBefore=p.legacy.rank,gems=p.gems;assert.equal(act({type:'prestige',expectedTimeline:timeline,legacy:choice}),true,'real final win must prestige');transitions.push({timeline,nextTimeline:p.timeline,attempt:attempts,seals,rankBefore,rankAfter:p.legacy.rank,choice,actualGemCredit:p.gems-gems,cards:p.cards.reduce((s,n)=>s+n,0),bonuses:cardBonuses(p.cards),ledger:{...ledger,expectedGems:p.gems,expectedCoins:p.coins}});}
   else assert.equal(act({type:'next'}),true,'real win must continue');
  }else{streak++;maxStreak=Math.max(maxStreak,streak);if(evolution.current&&!evolution.current.purchased)prepare();assert.equal(act({type:'retry'}),true,'real loss must retry');}
 }
 ledger.expectedGems=ledger.starting+ledger.ordinaryGems+ledger.masteryGems+ledger.resetGems+ledger.questGems+ledger.dailyGems-ledger.spentGems;
 ledger.expectedCoins=initialProfile.coins+ledger.ordinaryCoins+ledger.masteryCoins-ledger.spentCoins-ledger.discardedCoins;
 // A timeout may have lawful kill/damage coin income; classify it separately rather than claim a loss.
 if(combatTimeout){const unreported=game.state.earned;ledger.ordinaryCoins+=unreported;ledger.expectedCoins+=unreported;}
 assert.equal(ledger.expectedGems,game.profile.gems,'gem ledger must reconcile actual capped credits');assert.equal(ledger.expectedCoins,game.profile.coins,'coin ledger must reconcile spends/discarded local economy');
 const collection=pCollection(game.profile);
 return {source:options.source??'fresh default profile, untouched random stream',policy,choice,recovery,summon,claimDaily,targetTimeline,maxAttempts,stopReason:combatTimeout?'battle-timeout':game.profile.timeline>=targetTimeline?'target-reached':'attempt-limit',combatTimeout,initialProfile,finalProfile:structuredClone(game.profile),attempts,totalSeconds,maxStreak,endingStreak:streak,firstVictoryPurchase,evolutionPurchases,collection,commonOnly:collection.every(c=>c.rarity==='common'),bonuses:cardBonuses(game.profile.cards),ledger,transitions,attemptRows,actions,purchases};
}
function pCollection(p:Profile){return p.cards.map((copies,index)=>({id:CARD_DEFS[index].id,rarity:CARD_DEFS[index].rarity,copies})).filter(c=>c.copies>0);}

export function preparedSealCampaign(clearOnly=false) {
 const p=defaultProfile();p.age=5;p.foodLevel=clearOnly?100:12;p.unlocked=[true,true,true];
 return simulatePrestige({profile:p,source:`prepared historical age5/food${p.foodLevel}/all roles; EMPTY current mastery; no cards, wallet grants, counters or fabricated outcomes`,targetTimeline:2,maxAttempts:30,policy:clearOnly?'clear-only':'objectives',choice:'stillness',summon:false,recovery:'fixed'});
}
export function compareLegacyPreparations() {
 const rows=[];
 for(const scenario of ['opening','pressured-gate','control'] as const)for(const rank of [0,1,3] as const)for(const choice of ['hearth','watch','stillness'] as const) {
  const p=defaultProfile();p.legacy={rank,selected:choice};
  if(scenario==='pressured-gate'){p.age=1;p.baseLevel=1;}
  if(scenario==='control'){p.age=2;p.enemyAge=3;p.furthestBattle=3;p.foodLevel=0;p.unlocked=[true,true,true];}
  const g=new Game(p),before=structuredClone(g.profile),actions:Array<{time:number;action:Action}>=[];
  const startingFood=g.state.food,startingGate=g.state.playerMaxHp;
  const act=(action:Action)=>{const time=g.state.time;if(!g.dispatch(action))return false;actions.push({time,action:structuredClone(action)});return true;};
  const result=playPrestigeAttempt(g,scenario==='opening'?'immediate':scenario==='pressured-gate'?'hold-gate':'mixed',act);
  rows.push({source:'prepared isolated effects, NOT earned campaign history',scenario,rank,choice,profile:before,startingFood,startingGate,...result,gateDamage:g.state.stats.gateDamageTaken,remainingGate:g.state.playerHp,freezeTargets:g.state.stats.maxFreezeTargets,deployments:g.state.stats.deployed,firstDeployment:actions.find(a=>a.action.type==='spawn')?.time??null,actions});
 }
 return rows;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 const mode=process.argv[2]??'campaign';
 if(mode==='comparisons')process.stdout.write(JSON.stringify(compareLegacyPreparations())+'\n');
 else if(mode==='prepared-seals'||mode==='clear-only')process.stdout.write(JSON.stringify(preparedSealCampaign(mode==='clear-only'))+'\n');
 else {assert.equal(mode,'campaign');const choice=process.argv[3]??'hearth';assert.ok(isLegacyChoice(choice));process.stdout.write(JSON.stringify(simulatePrestige({choice,targetTimeline:Number(process.argv[4]??30),maxAttempts:Number(process.argv[5]??600),policy:(process.argv[6]??'mixed') as PrestigePolicy,recovery:(process.argv[7]??'adaptive') as 'adaptive'|'fixed',summon:process.argv[8]!=='0'}))+'\n');}
}
