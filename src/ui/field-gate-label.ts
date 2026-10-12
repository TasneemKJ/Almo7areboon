/** Short native labels for painted gate interaction targets.
 * Simulation/charge and order admission remain owned by game/orderStatus. */
export function gateChoiceLabel(kind:'hold'|'advance',ready:boolean,active:boolean):string {
 if(active)return kind==='hold'?'Holding':'Advancing';
 if(ready)return kind==='hold'?'Hold':'Advance';
 return kind==='hold'?'Hold · 60 momentum':'Advance · 60 momentum';
}

/**
 * How far (CSS px) a revealed gate label sits above its hit box so it clears the base health bar painted above the
 * gate (bar top is 21 art units above the hit box for storybook bases, 41 for the older vector bases).
 */
export function gateLabelLift(scale:number,storybook:boolean):number {
 const s=Number.isFinite(scale)&&scale>0?scale:1;
 return Math.round((storybook?21:41)*s+4);
}
