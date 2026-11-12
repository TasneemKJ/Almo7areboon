import { activeBattleOrder, canIssueOrder, ORDER_COST } from '../game/battle-orders.ts';
import type { BattleState } from '../game/types.ts';
import { textIfChanged } from './dom-state.ts';
import { secondsShort } from './battle-hud.ts';
import { tr } from './i18n.ts';
export function orderStatus(state: Readonly<BattleState>) {
 const active=activeBattleOrder(state,state.time),seconds=active?Math.max(0,Math.ceil((state.orders?.until??0)-state.time)):0;
 const charge=state.orders?.charge??0;
 const label=state.paused?tr('Paused · orders wait','متوقّف · الأوامر تنتظر'):active?`${active==='advance'?tr('Advance','تقدّم'):tr('Hold','اثبُت')} · ${secondsShort(seconds)}`:state.phase==='ready'?tr('Deploy troops to build momentum','أرسل جندك لتبني الزخم'):state.phase!=='running'?tr('Company stands down','السريّة تستريح'):charge>=ORDER_COST?tr('Momentum ready · tap a gate or choose an order','الزخم جاهز · المس بوّابة أو اختر أمراً'):`${tr('Momentum','الزخم')} ${charge}/${ORDER_COST}`;
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
  button.setAttribute('aria-label',`${order==='advance'?tr('Advance: 20% more troop damage and 15% faster movement','تقدّم: ضرر الجند أكبر بنسبة 20% وحركتهم أسرع بنسبة 15%'):tr('Hold: troops and gate take 25% less damage','اثبُت: الجند والبوّابة يتلقّون ضرراً أقلّ بنسبة 25%')}. ${tr('Costs 60 momentum, lasts 10 seconds.','يكلّف 60 من الزخم ويدوم 10 ثوانٍ.')} ${status.label}.`);
 });
}
