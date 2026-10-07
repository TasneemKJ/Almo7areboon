/** Short native labels for painted gate interaction targets.
 * Simulation/charge and order admission remain owned by game/orderStatus. */
export function gateChoiceLabel(kind:'hold'|'advance',ready:boolean,active:boolean):string {
 if(active)return kind==='hold'?'Holding':'Advancing';
 if(ready)return kind==='hold'?'Hold':'Advance';
 return kind==='hold'?'Hold · 60 momentum':'Advance · 60 momentum';
}
