import { activeBattleOrder, canIssueOrder, ORDER_COST } from '../game/battle-orders.ts';
import type { BattleState } from '../game/types.ts';
import { textIfChanged } from './dom-state.ts';
export function orderStatus(state: Readonly<BattleState>) {
 const active=activeBattleOrder(state,state.time),seconds=active?Math.max(0,Math.ceil((state.orders?.until??0)-state.time)):0;
 const charge=state.orders?.charge??0;
 const label=state.paused?'Paused · orders wait':active?`${active==='advance'?'Advance':'Hold'} · ${seconds}s`:state.phase==='ready'?'Deploy troops to build momentum':state.phase!=='running'?'Company stands down':charge>=ORDER_COST?'Momentum ready · choose an order':`Momentum ${charge}/${ORDER_COST}`;
 return {charge,active,seconds,label,canCast:canIssueOrder(state,'advance')};
}
export function updateOrderBanner(root: HTMLElement, state: Readonly<BattleState>): void {
 const status=orderStatus(state);root.dataset.order=status.active??'none';
 const label=root.querySelector<HTMLElement>('.order-status');if(label)textIfChanged(label,status.label);
 const fill=root.querySelector<HTMLElement>('.order-meter i');if(fill)fill.style.transform=`scaleX(${Math.min(1,status.charge/ORDER_COST)})`;
 root.querySelectorAll<HTMLButtonElement>('[data-order]').forEach(button=>{
  button.disabled=!status.canCast;
  const order=button.dataset.order,active=status.active===order;
  button.setAttribute('aria-pressed',String(active));
  button.setAttribute('aria-label',`${order==='advance'?'Advance: 20% more troop damage and 15% faster movement':'Hold: troops and gate take 25% less damage'}. Costs60 momentum, lasts10 seconds. ${status.label}.`);
 });
}
