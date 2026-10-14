import {canFireVolley,volleyCharge,volleyTargets} from '../game/volley.ts';
import type {BattleState} from '../game/types.ts';
import {textIfChanged} from './dom-state.ts';

/** What the watchtower volley button says: ready, charging (with percent), or waiting for an enemy in reach. */
export function volleyLabel(s:Readonly<BattleState>):{text:string;label:string;ready:boolean}{
 const charge=volleyCharge(s),percent=Math.floor(charge*100),ready=canFireVolley(s);
 const state=ready?'Ready.':charge<1?`Charging, ${percent}%.`:volleyTargets(s).length?'Ready.':'Charged. Waits for an enemy near your gate.';
 return {text:ready?'Volley':charge<1?`${percent}%`:'Volley',label:`Watchtower volley: strikes enemies near your gate and throws them back. ${state}`,ready};
}

/** The volley button sits above your own gate, the watchtower. */
export function syncVolley(node:HTMLElement,s:Readonly<BattleState>,arena:{scale:number;groundY:number},running:boolean):void{
 const size=48,left=Math.max(8,39*arena.scale-size/2),top=Math.max(64,arena.groundY*arena.scale-48*arena.scale-size-40);
 const style=`left:${Math.round(left)}px;top:${Math.round(top)}px;width:${size}px;height:${size}px;--charge:${volleyCharge(s).toFixed(2)}`;
 if(node.getAttribute('style')!==style)node.setAttribute('style',style);
 const view=volleyLabel(s);node.hidden=!running;node.setAttribute('aria-disabled',String(!view.ready));
 if(node.getAttribute('aria-label')!==view.label)node.setAttribute('aria-label',view.label);
 node.classList.toggle('volley-ready',view.ready);
 textIfChanged(node.querySelector<HTMLElement>('.world-target-name')!,view.text);
}
