import { activeBattleOrder, canIssueOrder, ORDER_DURATION } from '../game/battle-orders.ts';
import type { BattleState } from '../game/types.ts';
const VILLAGE_ORDER_ANSWER_DURATION=2.4;
/** Bounded view geometry; simulation owns charge, strength and time. */
export function orderPresentationFrame(state: Readonly<BattleState>, groundY: number, reduced: boolean, laneGap=9) {
 const order=activeBattleOrder(state,state.time);
 const ready=canIssueOrder(state,'hold')&&canIssueOrder(state,'advance');
 if(!order&&!ready)return null;
 const start=(state.orders?.until??NaN)-ORDER_DURATION,elapsed=state.time-start;
 const answer=order&&Number.isFinite(elapsed)&&elapsed>=0&&elapsed<VILLAGE_ORDER_ANSWER_DURATION?{kind:order,progress:reduced?1:Math.max(0,Math.min(1,elapsed/VILLAGE_ORDER_ANSWER_DURATION))}:null;
 const pulse=reduced?1:.85+Math.sin(state.time*4)*.15;
 const marks=order?state.units.filter(u=>u.side==='player'&&u.hp>0).slice(0,24).map(u=>({id:u.id,x:Math.max(0,Math.min(450,u.x*.45)),y:groundY+u.lane*laneGap,radius:u.kind===2?15:10})):[];
 // Readiness is a quieter version of the same pennant, never a second HUD or aura.
 const pennant={x:116,y:groundY-54,width:ready?17:22,alpha:ready?.56:.9,tipOffset:reduced?0:Math.sin(state.time*1.4)*.8};
 return {order,ready,answer,pulse,marks,pennant,color:ready?0xb7955f:order==='advance'?0xf0ce87:0xa9dfdc};
}
