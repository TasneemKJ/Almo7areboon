import {chronicleProtector} from '../game/chronicle-combat.ts';
import type {BattleState,Side,Unit} from '../game/types.ts';

export type FormationLink={
 targetId:number;protectorId:number;side:Side;status:'active'|'breached';
 targetX:number;targetLane:number;protectorX:number;protectorLane:number;
};
export type RallyMark={unitId:number;unitX:number;unitLane:number;holdX:number;holdLane:number};
export type ChronicleFormationFrame={links:FormationLink[];rally:RallyMark[]};

const lane=(value:number)=>Number.isFinite(value)&&value>=0&&value<=2?Math.round(value):1;
const alive=(unit:Unit)=>unit.hp>0;

/** Pure view model. It reads battle truth but cannot change combat or saved progression. */
export function chronicleFormationFrame(s:BattleState):ChronicleFormationFrame {
 const c=s.chronicle;if(!c?.enabled)return {links:[],rally:[]};
 const links:FormationLink[]=[];
 for(const side of ['player','enemy'] as const){
  const frontier:FormationLink[]=[];
  for(const target of s.units){
   if(target.side!==side||target.kind!==1||!alive(target))continue;
   const active=chronicleProtector(s,target),protector=active??chronicleProtector(s,target,true);
   if(!protector)continue;
   frontier.push({targetId:target.id,protectorId:protector.id,side,status:active?'active':'breached',targetX:target.x,targetLane:lane(target.lane),protectorX:protector.x,protectorLane:lane(protector.lane)});
   frontier.sort((a,b)=>(side==='player'?b.targetX-a.targetX:a.targetX-b.targetX)||a.targetLane-b.targetLane||a.targetId-b.targetId);if(frontier.length>6)frontier.pop();
  }
  links.push(...frontier);
 }
 const rally:RallyMark[]=[];
 if(c.rally)for(const [index,id] of c.gathered.slice(0,6).entries()){
  const unit=s.units.find(actor=>actor.id===id&&actor.side==='player'&&alive(actor));if(!unit)continue;
  rally.push({unitId:id,unitX:unit.x,unitLane:lane(unit.lane),holdX:240-Math.floor(index/3)*24,holdLane:lane(unit.lane)});
 }
 return {links,rally};
}

/** Threads sort behind both endpoint actors even when the relationship spans adjacent lanes. */
export function chronicleThreadDepth(groundY:number,fromLane:number,toLane:number,laneGap:number):number {
 const ground=Number.isFinite(groundY)?groundY:0,gap=Number.isFinite(laneGap)&&laneGap>0?laneGap:12;
 return ground+Math.min(lane(fromLane),lane(toLane))*gap+.25;
}
