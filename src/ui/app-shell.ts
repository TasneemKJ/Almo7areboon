import {entryScreenHtml} from './entry-screen.ts';
import {fieldControlsHtml} from './field-controls.ts';
import {icon} from '../view/icons.ts';
import type {Profile} from '../game/types.ts';

/** The static game shell: every region the screens and the battle HUD fill in later. */
export function appShellHtml(profile:Profile):string {
 return `
<main class="game-shell" aria-label="Almo7areboon">
  ${entryScreenHtml(profile)}
  <header class="resources"><div class="currency">${icon('coin')}<span id="coins">0</span></div><button class="currency gems" data-command="quests" aria-label="Gems and quests">${icon('gem')}<span id="gems">100</span></button><div class="game-wordmark">ALMO7AREBOON</div></header>
  <div id="battle-view" class="battle-view">
    <section id="world" class="world" tabindex="-1" aria-label="Battlefield">
      <div id="battlefield"></div>
      ${fieldControlsHtml()}
      <div class="stage"><div id="timeline" class="eyebrow"></div><h1 id="age-title"></h1><p id="scene-name" class="scene-name"></p><button id="battle-select" class="battle-select" data-command="battles" aria-label="Choose a battle"><span class="stage-progress" id="stage-progress"></span></button></div>
      <div class="world-tools"><button id="quests" class="square-button" data-command="quests" aria-label="Quests">${icon('quest')}<i class="notification"></i></button><button class="square-button" data-command="settings" aria-label="Settings">${icon('gear')}</button></div>
      <div class="battle-meta"><button id="wave-label" class="wave-inspect" data-command="wave-help"></button><div class="battle-toggles"><button id="speed" data-command="speed" aria-label="Change battle speed">1×</button><button id="pause" data-command="pause" aria-label="Pause battle">Ⅱ</button></div></div>
      <div id="ready" class="ready"><div class="ready-title">YOUR ARMY. YOUR ERA.</div><button class="big-button green" data-command="start">BATTLE ${icon('battle')}</button><p id="story-ready-rule">Destroy the enemy base!</p><div class="ready-paths"><button class="story-open" data-command="chronicle">Open the storybook</button><button class="journey-open" id="journey-open" data-command="journey">Your journey</button></div></div>
      <p id="base-status" class="sr-only"></p><p id="game-status" class="sr-only" role="status" aria-live="polite"></p><div id="pause-banner" class="pause-banner" hidden>PAUSED</div>
      <div class="battle-skills" id="battle-skills"></div>
    </section>
    <section class="deployment" aria-label="Deploy your army">
      <div class="order-banner" id="order-banner"><div class="order-charge"><span class="order-status">Deploy troops to build momentum</span><div class="order-meter" aria-hidden="true"><i></i></div></div><button data-order="advance" aria-label="Advance" disabled><span aria-hidden="true">+20% strike</span> Advance</button><button data-order="hold" aria-label="Hold" disabled><span aria-hidden="true">−25% damage</span> Hold</button></div><div class="food-line"><div class="food-total">${icon('food')}<strong id="food-count">6</strong><div class="food-meter"><i id="food-fill"></i></div></div><span id="production"></span></div>
      <div class="unit-cards" id="unit-cards"></div>
      <div class="chronicle-command-row"><div class="deploy-hint" id="deploy-hint">Tap a troop to send it into battle</div><button id="story-rally" class="story-rally" data-command="story-rally" aria-pressed="false" aria-label="Gather newly deployed troops, then release them together">Gather</button></div>
    </section>
    <section class="upgrades" aria-label="Army upgrades"><div class="upgrade-row"><div class="upgrade-label">${icon('food')}<div>Food Production<small id="food-level"></small></div></div><button id="food-upgrade" class="buy-button" data-command="upgrade-food"></button></div><div class="upgrade-row"><div class="upgrade-label">${icon('heart')}<div>Base Health<small id="base-level"></small></div></div><button id="base-upgrade" class="buy-button" data-command="upgrade-base"></button></div></section>
  </div>
  <section id="camp-view" aria-label="Company Camp" hidden></section>
  <button id="field-return" data-command="home">Home</button>
  <section id="secondary-screen" class="secondary-screen" aria-labelledby="secondary-title" hidden></section>
  <p id="session-notice" class="session-notice" role="status" aria-live="polite" hidden></p>
  <nav class="bottom-nav" aria-label="Game screens">${[['battle','Battle'],['evolution','Evolution'],['cards','Cards'],['skills','Skills']].map(([id,label])=>`<button data-tab="${id}" class="nav-item ${id==='battle'?'active':''}" aria-label="${label}" aria-current="${id==='battle'?'page':'false'}">${icon(id)}<span>${label}</span></button>`).join('')}</nav>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="modal-layer" class="modal-layer" hidden></div>
</main>`;
}
