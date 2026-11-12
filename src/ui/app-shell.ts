import {entryScreenHtml} from './entry-screen.ts';
import {fieldControlsHtml} from './field-controls.ts';
import {icon} from '../view/icons.ts';
import type {Profile} from '../game/types.ts';
import {tr} from './i18n.ts';

/** The static game shell: every region the screens and the battle HUD fill in later. */
export function appShellHtml(profile:Profile):string {
 return `
<main class="game-shell" aria-label="${tr('Almo7areboon','المحاربون')}">
  ${entryScreenHtml(profile)}
  <header class="resources"><div class="currency">${icon('coin')}<span id="coins">0</span></div><button class="currency gems" data-command="quests" aria-label="${tr('Gems and quests','الجواهر والمهمّات')}">${icon('gem')}<span id="gems">100</span></button><div class="game-wordmark">${tr('ALMO7AREBOON','المحاربون')}</div></header>
  <div id="battle-view" class="battle-view">
    <section id="world" class="world" tabindex="-1" aria-label="${tr('Battlefield','ساحة المعركة')}">
      <div id="battlefield"></div>
      ${fieldControlsHtml()}
      <div class="stage"><div id="timeline" class="eyebrow"></div><h1 id="age-title"></h1><p id="scene-name" class="scene-name"></p><button id="battle-select" class="battle-select" data-command="battles" aria-label="${tr('Choose a battle','اختر معركة')}"><span class="stage-progress" id="stage-progress"></span></button></div>
      <div class="world-tools"><button id="quests" class="square-button" data-command="quests" aria-label="${tr('Quests','المهمّات')}">${icon('quest')}<i class="notification"></i></button><button class="square-button" data-command="settings" aria-label="${tr('Settings','الإعدادات')}">${icon('gear')}</button></div>
      <div class="battle-meta"><button id="wave-label" class="wave-inspect" data-command="wave-help"></button><div class="battle-toggles"><button id="speed" data-command="speed" aria-label="${tr('Change battle speed','غيّر سرعة المعركة')}">1×</button><button id="pause" data-command="pause" aria-label="${tr('Pause battle','أوقف المعركة مؤقّتاً')}">Ⅱ</button></div></div>
      <div id="ready" class="ready"><div class="ready-title">${tr('YOUR ARMY. YOUR ERA.','جيشك. عصرك.')}</div><button class="big-button green" data-command="start">${tr('BATTLE','المعركة')} ${icon('battle')}</button><p id="story-ready-rule">${tr('Destroy the enemy base!','دمّر حصن العدوّ!')}</p><div class="ready-paths"><button class="story-open" data-command="chronicle">${tr('Open the storybook','افتح كتاب الحكايات')}</button><button class="journey-open" id="journey-open" data-command="journey">${tr('Your journey','رحلتك')}</button></div></div>
      <p id="base-status" class="sr-only"></p><p id="game-status" class="sr-only" role="status" aria-live="polite"></p><div id="pause-banner" class="pause-banner" hidden>${tr('PAUSED','إيقاف مؤقّت')}</div>
      <div class="battle-skills" id="battle-skills"></div>
    </section>
    <section class="deployment" aria-label="${tr('Deploy your army','أرسل جيشك')}">
      <div class="order-banner" id="order-banner"><div class="order-charge"><span class="order-status">${tr('Deploy troops to build momentum','أرسل الجنود لتبني الزخم')}</span><div class="order-meter" aria-hidden="true"><i></i></div></div><button data-order="advance" aria-label="${tr('Advance','تقدّم')}" disabled><span aria-hidden="true">${tr('+20% strike','ضربة <bdi dir="ltr">+20%</bdi>')}</span> ${tr('Advance','تقدّم')}</button><button data-order="hold" aria-label="${tr('Hold','اثبُت')}" disabled><span aria-hidden="true">${tr('−25% damage','ضرر <bdi dir="ltr">−25%</bdi>')}</span> ${tr('Hold','اثبُت')}</button></div><div class="food-line"><div class="food-total">${icon('food')}<strong id="food-count">6</strong><div class="food-meter"><i id="food-fill"></i></div></div><span id="production"></span></div>
      <div class="unit-cards" id="unit-cards"></div>
      <div class="chronicle-command-row"><div class="deploy-hint" id="deploy-hint">${tr('Tap a troop to send it into battle','المس جندياً لترسله إلى المعركة')}</div><button id="story-rally" class="story-rally" data-command="story-rally" aria-pressed="false" aria-label="${tr('Gather newly deployed troops, then release them together','اجمع الجنود الذين أرسلتهم للتوّ، ثم أطلقهم معاً')}">${tr('Gather','اجمع')}</button></div>
    </section>
    <section class="upgrades" aria-label="${tr('Army upgrades','تطويرات الجيش')}"><div class="upgrade-row"><div class="upgrade-label">${icon('food')}<div>${tr('Food Production','إنتاج المؤونة')}<small id="food-level"></small></div></div><button id="food-upgrade" class="buy-button" data-command="upgrade-food"></button></div><div class="upgrade-row"><div class="upgrade-label">${icon('heart')}<div>${tr('Base Health','صمود الحصن')}<small id="base-level"></small></div></div><button id="base-upgrade" class="buy-button" data-command="upgrade-base"></button></div></section>
  </div>
  <section id="camp-view" aria-label="${tr('Company Camp','مخيّم السريّة')}" hidden></section>
  <button id="field-return" data-command="home">${tr('Home','الرئيسية')}</button>
  <section id="secondary-screen" class="secondary-screen" aria-labelledby="secondary-title" hidden></section>
  <p id="session-notice" class="session-notice" role="status" aria-live="polite" hidden></p>
  <nav class="bottom-nav" aria-label="${tr('Game screens','شاشات اللعبة')}">${[['battle',tr('Battle','المعركة')],['evolution',tr('Evolution','الارتقاء')],['cards',tr('Cards','البطاقات')],['skills',tr('Skills','المهارات')]].map(([id,label])=>`<button data-tab="${id}" class="nav-item ${id==='battle'?'active':''}" aria-label="${label}" aria-current="${id==='battle'?'page':'false'}">${icon(id)}<span>${label}</span></button>`).join('')}</nav>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="modal-layer" class="modal-layer" hidden></div>
</main>`;
}
