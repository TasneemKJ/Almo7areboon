import { activeBattleOrder } from '../game/battle-orders.ts';
import type { BattleState } from '../game/types.ts';
/** Bounded view geometry; simulation owns charge, strength and time. */
export function orderPresentationFrame(state: Readonly<BattleState>, groundY: number, reduced: boolean, laneGap=9) {
 const order=activeBattleOrder(state,state.time);if(!order)return null;
 const pulse=reduced?1:.85+Math.sin(state.time*4)*.15;
 const marks=state.units.filter(u=>u.side==='player'&&u.hp>0).slice(0,24).map(u=>({id:u.id,x:Math.max(0,Math.min(450,u.x*.45)),y:groundY+u.lane*laneGap,radius:u.kind===2?15:10}));
 return {order,pulse,marks,pennant:{x:78,y:groundY-54},color:order==='advance'?0xf0ce87:0xa9dfdc};
}
