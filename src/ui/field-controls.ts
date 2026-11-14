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
<button id="field-standard" class="world-hit camp-hit" data-command="story-rally" aria-label="${tr('Gather newly deployed troops at your camp','اجمع الجند الجدد عند مخيّمك')}" hidden><span class="world-target-name">${tr('Gather','اجمع')}</span></button>
${fieldBannerHtml()}
<div id="field-blades" class="field-blades"></div>
<button id="field-supplies" class="world-hit" data-field-context="supplies" aria-label="${tr('Inspect supplies','افحص المؤن')}" hidden><span class="world-target-name">${tr('Supplies','المؤن')}</span></button>
<button id="field-enemy" class="world-hit enemy-hit" data-field-context="enemy" aria-label="${tr('Select enemy for a tactical skill','اختر عدوّاً لمهارة تكتيكية')}" hidden><span class="world-target-name">${tr('Select enemy','اختر عدوّاً')}</span></button>
<button id="field-cover" class="world-hit cover-hit" data-field-context="cover" aria-label="${tr('Select road shelter for Meteor to break cover','اختر ملجأ الطريق ليحطّمه «النيزك»')}" hidden><span class="world-target-name">${tr('Break cover','حطّم الملجأ')}</span></button>
</div><p id="field-food" class="field-food" hidden>${icon('food')}<span aria-hidden="true">0</span></p><div id="dusk-veil" class="dusk-veil" aria-hidden="true" hidden></div><p id="field-tale" class="field-tale" hidden></p><p id="field-cue" class="field-cue"></p><p id="field-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p><div class="field-chrome"><button class="field-pause" data-command="field-pause" aria-label="${tr('Pause','إيقاف مؤقّت')}"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false" fill="currentColor"><rect x="4" y="3" width="3" height="12" rx="1"/><rect x="11" y="3" width="3" height="12" rx="1"/></svg></button><div id="field-context" hidden></div></div>`;}

/** The company banner, planted in the field: drag it forward to Advance, back to Hold (see banner-gesture.ts). It is
 * hidden from assistive technology because the native Advance/Hold buttons in #order-banner are its proxies. */
export function fieldBannerHtml():string{
 const art='/art/storybook/interface/standard.webp';
 return `<div id="field-banner" class="field-banner" aria-hidden="true" data-ready="false" data-order="none" data-intent="none" hidden><span class="banner-plate banner-plate-hold">${tr('Hold','اثبُت')}<small>${tr('−25% damage','ضرر <bdi dir="ltr">−25%</bdi>')}</small><small class="banner-wait">${tr('needs 60 momentum',`يلزمه ${n(60)} من الزخم`)}</small></span><span class="banner-plate banner-plate-advance">${tr('Advance','تقدّم')}<small>${tr('+20% strike','ضربة <bdi dir="ltr">+20%</bdi>')}</small><small class="banner-wait">${tr('needs 60 momentum',`يلزمه ${n(60)} من الزخم`)}</small></span><span class="banner-carry"><i class="banner-shadow"></i><i class="banner-staff"></i><img class="banner-cloth banner-furled" src="${art}" alt="" draggable="false"/><img class="banner-cloth banner-lit" src="${art}" alt="" draggable="false"/><i class="banner-steps"><b></b><b></b><b></b><b></b></i></span></div>`;
}
