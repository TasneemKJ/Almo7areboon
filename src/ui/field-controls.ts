import {icon} from '../view/icons.ts';

/** The food readout at the field's top-left edge: what every recruit tap spends. Food is stored up to 99. */
export function fieldFoodReadout(food:number):{text:string;label:string;full:boolean}{
 const amount=Math.max(0,Math.floor(food)),full=amount>=99;
 return {text:String(amount),label:`Food: ${amount}${full?', storage full':''}. Recruits cost food.`,full};
}

/** Native semantic targets lie over the matching painted world objects. */
export function fieldControlsHtml():string{return `<div id="field-targets" class="field-targets">
${[0,1,2].map(kind=>`<button class="world-hit recruit-hit" data-field-recruit="${kind}" data-unit="${kind}" hidden><span class="troop-mark troop-mark-${kind}" aria-hidden="true"></span><span class="recruit-cost" aria-hidden="true"></span></button>`).join('')}
<button class="world-hit gate-hit" data-field-gate="hold" data-order="hold" aria-label="Hold at your gate"><span class="world-target-name">Hold · 60 momentum</span></button>
<button class="world-hit gate-hit" data-field-gate="advance" data-order="advance" aria-label="Advance toward the enemy gate"><span class="world-target-name">Advance · 60 momentum</span></button>
<button id="field-standard" class="world-hit" data-command="story-rally" aria-label="Gather newly deployed troops at the standard" hidden><span class="world-target-name">Gather</span></button>
<button id="field-supplies" class="world-hit" data-field-context="supplies" aria-label="Inspect supplies" hidden><span class="world-target-name">Supplies</span></button>
<button id="field-enemy" class="world-hit enemy-hit" data-field-context="enemy" aria-label="Select enemy for a tactical skill" hidden><span class="world-target-name">Select enemy</span></button>
</div><p id="field-food" class="field-food" hidden>${icon('food')}<span aria-hidden="true">0</span></p><p id="field-cue" class="field-cue" role="status" aria-live="polite"></p><div class="field-chrome"><button class="field-pause" data-command="field-pause" aria-label="Pause">Ⅱ</button><div id="field-context" hidden></div></div>`;}
