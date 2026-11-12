import {tr} from './i18n.ts';

/** Short native labels for painted gate interaction targets.
 * Simulation/charge and order admission remain owned by game/orderStatus. */
export function gateChoiceLabel(kind:'hold'|'advance',ready:boolean,active:boolean):string {
 if(active)return kind==='hold'?tr('Holding','ثابتون'):tr('Advancing','متقدّمون');
 if(ready)return kind==='hold'?tr('Hold','اثبُت'):tr('Advance','تقدّم');
 return kind==='hold'?tr('Hold · 60 momentum','اثبُت · 60 من الزخم'):tr('Advance · 60 momentum','تقدّم · 60 من الزخم');
}

/**
 * How far (CSS px) a revealed gate label sits above its hit box so it clears the base health bar painted above the
 * gate (bar top is 21 art units above the hit box for storybook bases, 41 for the older vector bases).
 */
export function gateLabelLift(scale:number,storybook:boolean):number {
 const s=Number.isFinite(scale)&&scale>0?scale:1;
 return Math.round((storybook?21:41)*s+4);
}
