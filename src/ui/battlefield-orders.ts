import type { BattleOrder } from '../game/battle-orders.ts';

export const DIRECT_ORDER_EDGE_FRACTION = .30;
export const DIRECT_ORDER_MAX_TRAVEL = 18;

export interface BattlefieldOrderBounds {
 readonly left: number;
 readonly top: number;
 readonly width: number;
 readonly height: number;
}
export interface BattlefieldOrderGesture {
 readonly startX: number;
 readonly startY: number;
 readonly endX: number;
 readonly endY: number;
}
const finite=(value:number)=>Number.isFinite(value);

export function battlefieldOrderFromGesture(
 gesture:Readonly<BattlefieldOrderGesture>,
 bounds:Readonly<BattlefieldOrderBounds>,
):BattleOrder|null {
 if(!finite(bounds.left)||!finite(bounds.top)||!finite(bounds.width)||!finite(bounds.height)||bounds.width<=0||bounds.height<=0)return null;
 if(!finite(gesture.startX)||!finite(gesture.startY)||!finite(gesture.endX)||!finite(gesture.endY))return null;
 const dx=gesture.endX-gesture.startX,dy=gesture.endY-gesture.startY;
 if(Math.hypot(dx,dy)>DIRECT_ORDER_MAX_TRAVEL+1e-9)return null;
 const right=bounds.left+bounds.width,bottom=bounds.top+bounds.height;
 if(gesture.startX<bounds.left||gesture.startX>right||gesture.startY<bounds.top||gesture.startY>bottom)return null;
 if(gesture.endX<bounds.left||gesture.endX>right||gesture.endY<bounds.top||gesture.endY>bottom)return null;
 const fraction=(gesture.endX-bounds.left)/bounds.width;
 if(fraction<=DIRECT_ORDER_EDGE_FRACTION)return 'hold';
 if(fraction>=1-DIRECT_ORDER_EDGE_FRACTION)return 'advance';
 return null;
}
