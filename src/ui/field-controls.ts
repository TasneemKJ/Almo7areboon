/** Native semantic targets lie over the matching painted world objects. */
export function fieldControlsHtml():string{return `<div id="field-targets" class="field-targets">
${[0,1,2].map(kind=>`<button class="world-hit recruit-hit" data-field-recruit="${kind}" data-unit="${kind}" hidden><span class="troop-mark troop-mark-${kind}" aria-hidden="true"></span><span class="recruit-cost" aria-hidden="true"></span></button>`).join('')}
<button class="world-hit gate-hit" data-field-gate="hold" data-order="hold" aria-label="Hold at your gate"><span class="world-target-name">Hold · 60 momentum</span></button>
<button class="world-hit gate-hit" data-field-gate="advance" data-order="advance" aria-label="Advance toward the enemy gate"><span class="world-target-name">Advance · 60 momentum</span></button>
<button id="field-standard" class="world-hit" data-command="story-rally" aria-label="Gather newly deployed troops at the standard" hidden><span class="world-target-name">Gather</span></button>
<button id="field-supplies" class="world-hit" data-field-context="supplies" aria-label="Inspect supplies" hidden><span class="world-target-name">Supplies</span></button>
<button id="field-enemy" class="world-hit enemy-hit" data-field-context="enemy" aria-label="Select enemy for a tactical skill" hidden><span class="world-target-name">Select enemy</span></button>
<button id="field-cover" class="world-hit cover-hit" data-field-context="cover" aria-label="Select road shelter for Meteor to break cover" hidden><span class="world-target-name">Break cover</span></button>
</div><p id="field-cue" class="field-cue"></p><p id="field-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p><div class="field-chrome"><button class="field-pause" data-command="field-pause" aria-label="Pause">Ⅱ</button><div id="field-context" hidden></div></div>`;}
