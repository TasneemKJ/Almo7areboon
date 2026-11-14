import type { BattleOrder } from '../game/battle-orders.ts';
import { arenaLayout } from '../view/visual-theme.ts';

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

/**
 * Field mode (2026-11-14 audit: only 4% of a new player's taps reached the world). A tap on the open field plants the
 * company banner there: the rival's half of the field Advances, your own half Holds. "Toward the rival" is world x (the
 * rival gate is always on the right), so the mapping is the same in Arabic and English. A drag longer than a tap, or a
 * tap outside the field, is not an order. The simulation still admits the order and charges its momentum.
 */
export function fieldTapOrder(
 gesture:Readonly<BattlefieldOrderGesture>,
 bounds:Readonly<BattlefieldOrderBounds>,
):BattleOrder|null {
 if(!finite(bounds.left)||!finite(bounds.top)||!finite(bounds.width)||!finite(bounds.height)||bounds.width<=0||bounds.height<=0)return null;
 if(!finite(gesture.startX)||!finite(gesture.startY)||!finite(gesture.endX)||!finite(gesture.endY))return null;
 if(Math.hypot(gesture.endX-gesture.startX,gesture.endY-gesture.startY)>DIRECT_ORDER_MAX_TRAVEL+1e-9)return null;
 const right=bounds.left+bounds.width,bottom=bounds.top+bounds.height;
 if(gesture.endX<bounds.left||gesture.endX>right||gesture.endY<bounds.top||gesture.endY>bottom)return null;
 return (gesture.endX-bounds.left)/bounds.width>=.5?'advance':'hold';
}

/** Where a tap hangs a dusk-raid lamp: the field's simulation x under the finger (the field is drawn at .45 of it). */
export function duskLampX(offsetX:number,width:number,height:number):number {
 return offsetX/(.45*arenaLayout(width,height).scale);
}

/**
 * What a tap on the open field does (2026-11-14 first-30 strip: a new player tapped the field for 30 s and nothing
 * went out). With the banner ready it plants the order; otherwise, if a troop is affordable, one runs out of camp into
 * the lane nearest the tap (the cheapest the company can send); only when neither can happen does the banner lean and
 * say what is missing.
 */
export function fieldTapIntent(orderReady:boolean,affordableKind:number|undefined):'order'|'troop'|'nudge' {
 return orderReady?'order':affordableKind!==undefined?'troop':'nudge';
}
/** The lane nearest a tap's height on the field (lanes sit on the ground line, 12 world units apart). */
export function fieldTapLane(offsetY:number,width:number,height:number):number {
 const arena=arenaLayout(width,height);
 if(!Number.isFinite(offsetY))return 0;
 return Math.max(0,Math.min(2,Math.round((offsetY/arena.scale-arena.groundY)/arena.laneGap)));
}
