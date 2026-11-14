import {activeBattleOrder,canIssueOrder,ORDER_COST,ORDER_DURATION,type BattleOrder} from '../game/battle-orders.ts';
import type {BattleState} from '../game/types.ts';

/**
 * The company banner is the order control (2026-11-14). Drag it toward the enemy gate to Advance, back toward your own
 * gate to Hold. "Forward" is world x (the rival gate is always on the right of the field), never reading direction, so
 * the gesture is the same in Arabic and English. Releasing inside the neutral zone, or dragging mostly up or down,
 * plants the banner where it was and issues nothing. The order itself (60 momentum, 10 s, +20% strike / -25% damage)
 * is still admitted and applied only by the simulation's issueBattleOrder.
 */
export const BANNER_COMMIT=36;
export const BANNER_TRAVEL=72;

export function bannerOrderFromDrag(dx:number,dy:number):BattleOrder|null {
 if(!Number.isFinite(dx)||!Number.isFinite(dy))return null;
 if(Math.abs(dx)<BANNER_COMMIT||Math.abs(dy)>Math.abs(dx))return null;
 return dx>0?'advance':'hold';
}

/** How far the painted banner follows the finger (CSS px), bounded so it never leaves its stretch of ground. */
export function bannerDragOffset(dx:number):number {
 if(!Number.isFinite(dx))return 0;
 return Math.max(-BANNER_TRAVEL,Math.min(BANNER_TRAVEL,dx));
}

/** What the drag would do if released now: shown on the banner's small plate while the finger is down. */
export function bannerDragIntent(dx:number,dy:number,ready:boolean):BattleOrder|'wait'|null {
 const order=bannerOrderFromDrag(dx,dy);
 if(!order)return null;
 return ready?order:'wait';
}

export interface BannerView {
 /** Momentum ready and no order running: the cloth is full and the banner can be carried. */
 ready:boolean;
 order:BattleOrder|null;
 /** 0..1: how much of the cloth is lit. Momentum toward 60 while gathering; time left while an order runs. */
 cloth:number;
 /** The same amount in four visible steps (a non-colour cue: the cloth unfurls a quarter at a time). */
 steps:0|1|2|3|4;
}

export function bannerView(state:Readonly<BattleState>):BannerView {
 const order=activeBattleOrder(state,state.time);
 const charge=state.orders?.charge??0;
 const raw=order?((state.orders?.until??0)-state.time)/ORDER_DURATION:charge/ORDER_COST;
 const cloth=Math.max(0,Math.min(1,Number.isFinite(raw)?raw:0));
 return {ready:canIssueOrder(state,'advance'),order,cloth,steps:Math.min(4,Math.floor(cloth*4+1e-9)) as BannerView['steps']};
}
