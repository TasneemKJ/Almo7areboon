import { pathToFileURL } from 'node:url';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { eraEconomyScale } from '../src/game/data.ts';
import type { UnitKind } from '../src/game/types.ts';

export const POLICIES = ['immediate-melee','banked-melee','ranged-supported','heavy-supported','fixed-mixed','threat-aware'] as const;
export type Policy = typeof POLICIES[number] | 'no-deployment';
const sequences: Record<Exclude<Policy,'no-deployment'|'threat-aware'>, readonly UnitKind[]> = {
  'immediate-melee':[0], 'banked-melee':[0], 'ranged-supported':[0,1,1], 'heavy-supported':[2,0,0], 'fixed-mixed':[2,1,0,1],
};
const counters: Record<string, readonly UnitKind[]> = { rush:[2,0,1],volley:[0,0,2,1],bulwark:[0,1,1],final:[0,1,0] };
export function runEncounter(age: number, timeline: number, upgrades: 0 | 2, policy: Policy) {
  const profile=defaultProfile();profile.age=age;profile.enemyAge=age;profile.timeline=timeline;profile.cards.fill(0);profile.coins=1000*eraEconomyScale(age);
  const game=new Game(profile);
  const buy=(action: Parameters<Game['dispatch']>[0])=>{if(!game.dispatch(action))throw new Error(`Purchase failed: ${JSON.stringify(action)}`);};
  for(let level=0;level<upgrades;level++){buy({type:'upgrade',stat:'food'});buy({type:'upgrade',stat:'base'});}
  if(policy!=='immediate-melee'&&policy!=='banked-melee'&&policy!=='no-deployment'){buy({type:'unlock',kind:1});buy({type:'unlock',kind:2});}
  game.dispatch({type:'start'});
  let sequenceIndex=0,previewNumber=0,maxPlayerArmy=0,maxEnemyArmy=0,valid=true;
  for(let tick=0;tick<180*60&&game.state.phase==='running';tick++){
    if(policy!=='no-deployment'){
      const preview=game.waveStatus().preview;
      if(policy==='threat-aware'&&(preview?.number??6)!==previewNumber){previewNumber=preview?.number??6;sequenceIndex=0;}
      const sequence=policy==='threat-aware'?counters[preview?.intent??'final']:sequences[policy];
      if((policy==='immediate-melee'||policy==='threat-aware'||game.state.time>10)&&game.dispatch({type:'spawn',kind:sequence[sequenceIndex%sequence.length]}))sequenceIndex++;
    }
    game.step(1/60);game.drainEvents();
    maxPlayerArmy=Math.max(maxPlayerArmy,game.state.units.filter(u=>u.side==='player').length);maxEnemyArmy=Math.max(maxEnemyArmy,game.state.units.filter(u=>u.side==='enemy').length);
    valid&&=Object.values(game.state).filter(v=>typeof v==='number').every(Number.isFinite)&&game.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.x)&&u.hp>0)&&game.state.food>=0&&game.state.playerHp>=0&&game.state.enemyHp>=0&&maxPlayerArmy<=60&&maxEnemyArmy<=60;
  }
  const stats=game.state.stats;
  return {age,timeline,upgrades,policy,outcome:game.state.phase==='running'?'timeout':game.state.phase,time:game.state.time,baseHp:game.state.playerHp,deployments:stats.deployed,foodSpent:stats.foodSpent,damageTaken:stats.damageTaken,damageDealt:stats.damageDealt,wavesLaunched:game.state.wave,kills:stats.kills,earnings:game.state.earned,maxPlayerArmy,maxEnemyArmy,valid};
}
export function encounterMatrix(){
  const rows=[];
  for(let age=0;age<6;age++)for(const timeline of [1,3])for(const upgrades of [0,2] as const)for(const policy of POLICIES)rows.push(runEncounter(age,timeline,upgrades,policy));
  for(let age=0;age<6;age++)for(const upgrades of [0,2] as const)rows.push(runEncounter(age,1,upgrades,'no-deployment'));
  return rows;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){for(const row of encounterMatrix())process.stdout.write(JSON.stringify(row)+'\n');}
