import {icon} from '../view/icons.ts';
import {n,tr} from './i18n.ts';

/** The food readout at the field's top-left edge: what every recruit tap spends. Food is stored up to 99. */
export function fieldFoodReadout(food:number):{text:string;label:string;full:boolean}{
 const amount=Math.max(0,Math.floor(food)),full=amount>=99;
 return {text:String(amount),label:tr(`Food: ${amount}${full?', storage full':''}. Recruits cost food.`,`المؤونة: ${amount}${full?'، المخزن ممتلئ':''}. التجنيد يكلّف مؤونة.`),full};
}

/** Native semantic targets lie over the matching painted world objects. */
export function fieldControlsHtml():string{return `<div id="field-targets" class="field-targets">
${[0,1,2].map(kind=>`<button class="world-hit recruit-hit" data-field-recruit="${kind}" data-unit="${kind}" hidden><span class="troop-mark troop-mark-${kind}" aria-hidden="true"></span><span class="recruit-cost" aria-hidden="true"></span></button>`).join('')}
<button class="world-hit gate-hit" data-field-gate="hold" data-order="hold" aria-label="${tr('Hold at your gate','اثبُت عند بوّابتك')}"><span class="world-target-name">${tr('Hold · 60 momentum',`اثبُت · ${n(60)} من الزخم`)}</span></button>
<button class="world-hit gate-hit" data-field-gate="advance" data-order="advance" aria-label="${tr('Advance toward the enemy gate','تقدّم نحو بوّابة العدوّ')}"><span class="world-target-name">${tr('Advance · 60 momentum',`تقدّم · ${n(60)} من الزخم`)}</span></button>
<button id="field-standard" class="world-hit" data-command="story-rally" aria-label="${tr('Gather newly deployed troops at the standard','اجمع الجند الجدد عند الراية')}" hidden><span class="world-target-name">${tr('Gather','اجمع')}</span></button>
<button id="field-supplies" class="world-hit" data-field-context="supplies" aria-label="${tr('Inspect supplies','افحص المؤن')}" hidden><span class="world-target-name">${tr('Supplies','المؤن')}</span></button>
<button id="field-enemy" class="world-hit enemy-hit" data-field-context="enemy" aria-label="${tr('Select enemy for a tactical skill','اختر عدوّاً لمهارة تكتيكية')}" hidden><span class="world-target-name">${tr('Select enemy','اختر عدوّاً')}</span></button>
<button id="field-cover" class="world-hit cover-hit" data-field-context="cover" aria-label="${tr('Select road shelter for Meteor to break cover','اختر ملجأ الطريق ليحطّمه «النيزك»')}" hidden><span class="world-target-name">${tr('Break cover','حطّم الملجأ')}</span></button>
</div><p id="field-food" class="field-food" hidden>${icon('food')}<span aria-hidden="true">0</span></p><p id="field-cue" class="field-cue"></p><p id="field-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p><div class="field-chrome"><button class="field-pause" data-command="field-pause" aria-label="${tr('Pause','إيقاف مؤقّت')}"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false" fill="currentColor"><rect x="4" y="3" width="3" height="12" rx="1"/><rect x="11" y="3" width="3" height="12" rx="1"/></svg></button><div id="field-context" hidden></div></div>`;}
