import {createChronicle,chooseRoute,chooseCaptain,chooseTale,preparationAvailable,discover,beginExpedition,continueExpedition,abandonExpedition,type ChronicleAction,type ChronicleProgress} from './chronicle.ts';
import type {Profile,BattleState} from './types.ts';
export interface ChronicleActionPlan {chronicle:ChronicleProgress;enemyAge:number;reset:boolean;}
/** Only the Game transaction applies this plan and subsequently persists through its owner. */
export function planChronicleAction(p:Profile,s:BattleState,a:ChronicleAction):ChronicleActionPlan|null {
  if(s.phase==='running')return null;
  const c=p.chronicle??createChronicle(p.timeline,p.enemyAge);
  let next:ChronicleProgress|null=null,chapter=p.enemyAge,reset=true;
  switch(a.type){
    case 'chronicle-route':next=chooseRoute(c,a.route,a.battle,p.furthestBattle);chapter=a.battle;break;
    case 'chronicle-captain':next=chooseCaptain(c,a.captain);break;
    case 'chronicle-tale':next=chooseTale(c,a.tale);break;
    case 'chronicle-preparation':if(preparationAvailable(c,a.preparation))next={...c,preparation:a.preparation};break;
    case 'chronicle-discover':next=discover(c,a.discovery,(s.phase==='won'||s.phase==='ready')&&(c.clears[p.enemyAge]??0)!==0);reset=false;break;
    case 'chronicle-expedition':next=beginExpedition(c,a.battle,p.furthestBattle);chapter=a.battle;break;
    case 'chronicle-continue':
      if(p.pendingVictory?.timeline!==p.timeline||p.pendingVictory.battle!==p.enemyAge)return null;
      next=continueExpedition(c,s.phase==='won');break;
    case 'chronicle-abandon':if(c.expedition)next=abandonExpedition(c);break;
    case 'chronicle-provision':
      if(c.expedition&&(a.provision==='supplies'||a.provision==='shelter'))next={...c,expedition:{...c.expedition,provision:a.provision}};
      reset=false;break;
    default:return null;
  }
  if((s.phase==='won'||s.phase==='lost')&&['chronicle-captain','chronicle-tale','chronicle-preparation'].includes(a.type))reset=false;
  return next?{chronicle:next,enemyAge:chapter,reset}:null;
}
