import { updateOrderBanner } from './ui/battle-orders.ts';
import { battlefieldOrderFromGesture } from './ui/battlefield-orders.ts';
import { journeyScreenHtml } from './ui/journey-screen.ts';
import './ui/chronicle.css';
import { chronicleScreenHtml, chronicleActionFromData } from './ui/chronicle-screen.ts';
import { chronicleGuidance } from './game/chronicle-combat.ts';
import { CAPTAINS, routeDefinition } from './game/chronicle.ts';
import {storybookArt} from './view/storybook-art.ts';
import './style.css';
import './ui/continuation.css';
import './ui/material-language.css';
import './ui/combat-focus.css';
import './ui/era-glow.css';
import './ui/readability.css';
import './ui/layout-polish.css';
import './ui/skill-cues.css';
import './ui/battle-banner.css';
import './ui/landscape-rail.css';
import { Game } from './game/simulation.ts';
import { createBattlefieldPort } from './game/battlefield-port.ts';
import { advanceStatus } from './game/mastery.ts';
import { isLegacyChoice, legacyEffects, prestigePreview } from './game/prestige.ts';
import { ERAS, foodRate, unlockCost, QUESTS, dailyReward, localDay } from './game/data.ts';
import { defaultProfile, MAX_SAVE_CHARS, SAVE_KEY, BACKUP_KEY } from './game/save.ts';
import { createSaveSession } from './game/save-session.ts';
import type { SaveSessionStatus } from './game/save-session.ts';
import { saveSessionDialogHtml, temporarySessionNotice } from './ui/save-session-screen.ts';
import { startOverProfile } from './game/reset.ts';
import { exportBackup, importBackup, restoreBackupWithSave } from './game/backup.ts';
import type { Action, GameEvent, LegacyChoice, Profile, Skill, UnitKind } from './game/types.ts';
import {advanceVillagePresentation,type VillagePresentation} from './view/village-mood.ts';
import { unitPortrait } from './view/unit-illustrations.ts';
import { chapterPresentation } from './ui/chapter-presentation.ts';
import { evolutionScreenHtml } from './ui/evolution-screen.ts';
import { icon } from './view/icons.ts';
import { playCombatEvents, playSummonAudio, stopCombatAudio, unlockAudio, suspendAudio, disposeAudio, updateSoundscape, updateAudioMix } from './view/audio.ts';
import { createArmyUpdater, troopControlLabel, troopUnlockMessage } from './ui/army-screen.ts';
import { cardsScreenHtml, summonedCardsHtml } from './ui/cards-screen.ts';
import { resultsHtml } from './ui/results-screen.ts';
import { startCountUp } from './ui/count-up.ts';
import { earlierChapter } from './ui/regroup-learning.ts';
import { legacyCurrentHtml, prestigeDetailsHtml, prestigeDialogHtml } from './ui/prestige-presentation.ts';
import { battleGuidance, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel } from './ui/battle-hud.ts';
import { waveInspectionHtml } from './ui/wave-inspection.ts';
import { battleSelectionHtml, evolutionDialogHtml } from './ui/progression-screen.ts';
import { createModalIsolation, modalFocusables, nextFocusIndex, isEditingTarget } from './ui/accessibility.ts';
import { pauseReason } from './ui/pause.ts';
import { loadAtmosphere, saveAtmosphere, ambienceAllowed, loadAudioMix, normalizeAudioMix, saveAudioMix } from './ui/audio-preferences.ts';
import { createLifetime } from './ui/lifetime.ts';
import { createModalTapGuard } from './ui/modal-tap-guard.ts';
import { textIfChanged, htmlIfChanged } from './ui/dom-state.ts';
import { nextGoalLabel } from './ui/next-goal.ts';
import { skillCue } from './ui/skill-cues.ts';

// The initial render is a non-playable default. Only ownership makes a loaded Game authoritative.
let game=new Game(defaultProfile());
const root=document.querySelector<HTMLDivElement>('#app');
if(!root)throw new Error('The game mount element is missing.');
const lifetime=createLifetime();
let activeTab='battle',modal:string|null=null,manualPaused=false;
let battlefieldPointer:{id:number;x:number;y:number}|null=null;
let villagePresentation:VillagePresentation|null=null;
let atmosphereEnabled=loadAtmosphere();
let audioMix=loadAudioMix();
updateAudioMix(audioMix);
let lastUpdate=0,lastSave=0,resultShown='',lastPhase=game.state.phase,resultDue=0,toastTimer=0,focusFrame=0,modalVersion=0;
let savedWarning=false,pendingImport:Profile|null=null;
// Each file selection owns its asynchronous completion, even before a dialog changes.
let importRequest=0;
// Transient modal context only; the saved receipt remains the outcome authority.
let evolutionFromResult=false;
let prestigeOrigin:'result'|'battles'|null=null,prestigeDraft:LegacyChoice|null=null,prestigeExpectedTimeline:number|null=null;
// A native multi-click that starts in a modal must not hit controls it reveals.
let modalPointerSequence=false;
const blockModalTap=createModalTapGuard();
let sessionReady=false,pagePresent=true,resumeOwnership=false,acquisitionVersion=0,hasPlayed=false;
let acquiring:Promise<void>|null=null;
const money=(value:number)=>value>=10000?compactNumber(value):Math.floor(value).toLocaleString('en-US');
const coin=(value:number)=>`${icon('coin')}<span>${money(value)}</span>`;
root.innerHTML = `
<main class="game-shell" aria-label="Almo7areboon">
  <header class="resources"><div class="currency">${icon('coin')}<span id="coins">0</span></div><button class="currency gems" data-command="quests" aria-label="Gems and quests">${icon('gem')}<span id="gems">100</span></button><div class="game-wordmark">ALMO7AREBOON</div></header>
  <div id="battle-view" class="battle-view">
    <section id="world" class="world" aria-label="Battlefield">
      <div id="battlefield"></div>
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
  <section id="secondary-screen" class="secondary-screen" aria-labelledby="secondary-title" hidden></section>
  <p id="session-notice" class="session-notice" role="status" aria-live="polite" hidden></p>
  <nav class="bottom-nav" aria-label="Game screens">${[['battle','Battle'],['evolution','Evolution'],['cards','Cards'],['skills','Skills']].map(([id,label])=>`<button data-tab="${id}" class="nav-item ${id==='battle'?'active':''}" aria-label="${label}" aria-current="${id==='battle'?'page':'false'}">${icon(id)}<span>${label}</span></button>`).join('')}</nav>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="modal-layer" class="modal-layer" hidden></div>
</main>`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;

const updateArmy=createArmyUpdater({units:$('unit-cards'),skills:$('battle-skills'),stages:$('stage-progress')},unitPortrait,money);
const isolateModal=createModalIsolation($('modal-layer'));
const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
let focusBefore:HTMLElement|null=null;
const session=createSaveSession({
  // Access storage inside the guarded read/write, since the browser getter itself can throw.
  storage:{getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)},
  locks:navigator.locks??null,
  onStatus:sessionPresentation,
});
function playable(){return sessionReady&&pagePresent&&!lifetime.disposed&&(session.status==='active'||session.status==='temporary');}
function guardAction(){return playable()&&session.check();}
let retriedSession=false;
function sessionPresentation(status:SaveSessionStatus){
  root!.dataset.saveSession=status;
  const notice=$('session-notice');
  notice.hidden=status!=='starting'&&status!=='temporary';
  textIfChanged(notice,status==='temporary'?temporarySessionNotice:'Opening your saved game…');
  if(status!=='active'&&status!=='temporary'){sessionReady=false;clearPrestigeContext();}
  if(status==='active'||status==='temporary')retriedSession=false;
  const html=saveSessionDialogHtml(status,retriedSession);
  if(html){pendingImport=null;evolutionFromResult=false;showModal('session',html);}
  else if(status==='starting'){
    // An immediate acquisition has no transient modal focus loop.
    isolateModal(true);notice.inert=false;
    $('modal-layer').querySelector<HTMLButtonElement>('[data-command="session-continue"]')?.setAttribute('disabled','');
  }
  syncPause();
}
async function acquireSession(){
  if(acquiring||lifetime.disposed||!pagePresent)return acquiring;
  const version=acquisitionVersion;
  acquiring=(async()=>{
    const loaded=await session.acquire();
    if(lifetime.disposed||version!==acquisitionVersion||!pagePresent)return;
    if(loaded.status==='active'&&loaded.profile){
      game=new Game(loaded.profile);lastPhase=game.state.phase;resultDue=0;hasPlayed=true;sessionReady=true;
      manualPaused=false;resultShown='';savedWarning=false;pendingImport=null;evolutionFromResult=false;clearPrestigeContext();
      closeModal(false);rebuildArmy();syncMotion();switchTab('battle');
      if(loaded.loadStatus==='recovered')toast('Recovered your progress from the backup save.');
      else if(loaded.loadStatus==='corrupt')toast('The stored save could not be recovered. A new game has started.');
    }else if(!hasPlayed&&loaded.profile){
      // Safe preview for explicit temporary play only; never replace conflicted work.
      game=new Game(loaded.profile);lastPhase=game.state.phase;resultDue=0;rebuildArmy();syncMotion();update(true);
    }
  })().finally(()=>{if(version===acquisitionVersion)acquiring=null;});
  return acquiring;
}

function rebuildArmy(){updateArmy(game.profile);}
function toast(message:string,duration=4200){
  textIfChanged($('toast'),message);$('toast').classList.add('visible');
  window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').classList.remove('visible'),duration);
}
function persist():boolean{
  if(!playable()||session.status==='temporary')return false;
  const result=session.save(game.profile),ok=result.ok;lastSave=performance.now();
  if(result.reason==='write-failed'&&!savedWarning){savedWarning=true;toast('Progress could not be saved. Export a backup from Settings before closing this tab.');}
  if(ok)savedWarning=false;
  return ok;
}
function syncPause(){
  game.state.paused=!playable()||pauseReason({phase:game.state.phase,manual:manualPaused,tab:activeTab,modal,hidden:document.hidden})!==null;
  if(!game.profile.sound||!playable()||document.hidden||manualPaused||activeTab!=='battle'||(modal!==null&&modal!=='result')){
    // Only a direct accepted card-summon's finite shimmer may finish in Cards.
    const summonTail=game.profile.sound&&playable()&&!document.hidden&&!manualPaused&&activeTab==='cards'&&(modal===null||modal==='summon');
    stopCombatAudio(summonTail);
  }
  syncVillagePresentation();
}
function syncVillagePresentation(dt=0,batch:readonly GameEvent[]=[]){
  villagePresentation=advanceVillagePresentation(villagePresentation,game.state,game.profile.age,dt,batch,!playable()||document.hidden||activeTab!=='battle'||modal!==null);
  // The renderer calls this after stepping and draining events, so a delayed
  // result dialog still gates audio with the actual terminal phase this frame.
  updateSoundscape(game.profile.age,ambienceAllowed({sound:game.profile.sound,atmosphere:atmosphereEnabled,paused:game.state.paused,phase:game.state.phase,tab:activeTab,modal,hidden:document.hidden}),villagePresentation.mood);
}
function syncMarks(){document.documentElement.dataset.marks=game.profile.marks?'on':'off';}
function syncMotion(){document.documentElement.dataset.motion=game.profile.motion==='reduced'||motionQuery.matches?'reduced':'full';syncMarks();}
function action(a:Action):boolean{
  if(!guardAction())return false;
  unlockAudio(game.profile.sound);const ok=game.dispatch(a);
  if(ok){
    persist();syncPause();rebuildArmy();update(true);if(activeTab!=='battle')renderScreen(a.type==='select-legacy');
    if(a.type==='summon')playSummonAudio(game.profile.sound&&playable()&&!document.hidden&&!manualPaused&&activeTab==='cards'&&modal===null);
  }
  return ok;
}
function update(force=false){
  const now=performance.now();if(!force&&now-lastUpdate<80)return;lastUpdate=now;
 const p=game.profile,s=game.state;
 $('world').dataset.phase=s.phase;
 updateOrderBanner($('order-banner'),s);
 const artStyle=storybookArt(p.age)?'storybook':'legacy';
 if(root!.dataset.artStyle!==artStyle)root!.dataset.artStyle=artStyle;
  textIfChanged($('coins'),money(p.coins));textIfChanged($('gems'),money(p.gems));
  textIfChanged($('timeline'),`TIMELINE ${p.timeline} · BATTLE ${p.enemyAge+1}`);textIfChanged($('age-title'),chapterPresentation(p.age).title);
  textIfChanged($('scene-name'),chapterPresentation(p.age).subtitle);
  textIfChanged($('food-count'),Math.floor(s.food).toString());$('food-fill').style.width=`${s.food>=99?100:(s.food%1)*100}%`;
  textIfChanged($('production'),`${foodRate(p).toFixed(2)}/sec`);
  const food=game.upgradeStatus('food'),base=game.upgradeStatus('base');
  textIfChanged($('food-level'),`${foodRate(p).toFixed(2)} food/sec${food.nextValue===null?' · MAX':` → ${food.nextValue.toFixed(2)}`}`);
  textIfChanged($('base-level'),`${compactNumber(s.playerMaxHp)} health${base.nextValue===null?' · MAX':` → ${compactNumber(base.nextValue)}`}`);
  htmlIfChanged($('food-upgrade'),food.cost===null?'MAX':coin(food.cost));htmlIfChanged($('base-upgrade'),base.cost===null?'MAX':coin(base.cost));
  $('food-upgrade').setAttribute('aria-label',food.cost===null?'Food production fully upgraded':`Upgrade food production for ${food.cost} coins`);
  $('base-upgrade').setAttribute('aria-label',base.cost===null?'Base health fully upgraded':`Upgrade base health for ${base.cost} coins`);
  $('food-upgrade').toggleAttribute('disabled',!food.allowed);$('base-upgrade').toggleAttribute('disabled',!base.allowed);
  $('ready').hidden=s.phase!=='ready';$('pause-banner').hidden=!(manualPaused&&s.phase==='running');
  textIfChanged($('pause'),manualPaused?'▶':'Ⅱ');$('pause').setAttribute('aria-label',manualPaused?'Resume battle':'Pause battle');
  $('pause').setAttribute('aria-pressed',String(manualPaused));$('pause').toggleAttribute('disabled',s.phase!=='running');
  textIfChanged($('speed'),`${p.speed}×`);$('speed').setAttribute('aria-label',`Battle speed ${p.speed} times. Change speed.`);
  $('battle-select').toggleAttribute('disabled',s.phase!=='ready');
  const wave=game.waveStatus();
  textIfChanged($('wave-label'),s.phase==='running'?waveLabel(wave,s.chronicle?.enabled?s.chronicle.objective:undefined):s.phase==='ready'?'CHOOSE YOUR ARMY':'BATTLE COMPLETE');
  $('wave-label').setAttribute('aria-label',s.phase==='running'?`Inspect wave. ${waveAccessibleLabel(wave,s.chronicle?.enabled?s.chronicle.objective:undefined)}`:$('wave-label').textContent??'');
  $('wave-label').toggleAttribute('disabled',s.phase!=='running');
  textIfChanged($('deploy-hint'),battleGuidance(p,s,wave.preview,game.deploymentStatus(0)));
  const health=baseHealthDisplay(s.playerHp,s.playerMaxHp);
  $('world').classList.toggle('base-danger',s.phase==='running'&&health.danger);
  textIfChanged($('base-status'),`Your base: ${health.label}. Enemy base: ${baseHealthDisplay(s.enemyHp,s.enemyMaxHp).label}.`);
  textIfChanged($('game-status'),s.phase==='running'?(s.paused?'Battle paused.':health.danger?'Your base is in danger.':'Battle running.'):s.phase==='ready'?'Ready. Start a battle.':s.phase==='won'?'Victory.':'Defeat. Your coins are safe.');
  root!.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach(button=>{
    const kind=Number(button.dataset.unit) as UnitKind,locked=!p.unlocked[kind],status=game.deploymentStatus(kind);
    button.disabled=locked?p.coins<unlockCost(kind,p):!status.allowed;
    button.classList.toggle('affordable',!button.disabled);
    // First battle ever: ring the Light Guard card until the first deployment (static ring when motion is reduced).
    button.classList.toggle('teach',kind===0&&p.wins===0&&s.phase==='running'&&!s.paused&&s.stats.deployed===0&&!button.disabled);
    const label=troopControlLabel(p,kind,status);
    button.title=label;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
    (button.querySelector('.unit-fill') as HTMLElement).style.transform=`scaleX(${Math.max(0,Math.min(1,s.food/ERAS[p.age].units[kind].cost))})`;
  });
  root!.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(button=>{
    const skill=button.dataset.skill as Skill,used=s.skillsUsed.includes(skill);
    button.disabled=!game.canUseSkill(skill);button.classList.toggle('used',used);
    const cue=skillCue(p,s,skill,!button.disabled);
    button.classList.toggle('skill-opportunity',cue.opportunity);
    button.classList.toggle('freeze-active',cue.activeEffect);
    button.title=cue.label;button.setAttribute('aria-label',cue.label);
    const badge=button.querySelector('small');if(badge){badge.setAttribute('aria-hidden','true');textIfChanged(badge,cue.badge);}
  });
  const notification=$('quests').querySelector<HTMLElement>('.notification');
  if(notification)notification.hidden=!(dailyReward(p,localDay()).available||QUESTS.some(q=>p[q.stat]>=q.target&&!p.claimed.includes(q.id)));
  {const goal=nextGoalLabel(p,localDay()),journeyOpen=$('journey-open');textIfChanged(journeyOpen,goal.text);journeyOpen.setAttribute('aria-label',goal.label);}
  const story=s.chronicle;
  $('story-rally').hidden=!story?.enabled;
  $('story-rally').toggleAttribute('disabled',s.phase!=='running'||s.paused);
  $('story-rally').setAttribute('aria-pressed',String(story?.rally??false));
  textIfChanged($('story-rally'),story?.rally?`Release ${story.gathered.length}/6`:'Gather');
  if(story?.enabled){
    const instruction=chronicleGuidance(p,s);
    if(s.phase==='running'&&!s.paused&&(!health.danger)&&(story.route!=='road'||story.rally||p.unlocked[1]))textIfChanged($('deploy-hint'),instruction);
    textIfChanged($('story-ready-rule'),p.wins===0&&story.route==='road'?'Rima waits at the gate. Tap Battle, then send a defender. The company fights together.':routeDefinition(story.route).rule);

  }
  // Let the finishing blow and base collapse play before the result dialog covers them.
  if(s.phase!==lastPhase){if(lastPhase==='running'&&(s.phase==='won'||s.phase==='lost'))resultDue=now+(document.documentElement.dataset.motion==='reduced'?350:1300);lastPhase=s.phase;}
  const reviewHoldingResult=globalThis.navigator?.webdriver&&document.querySelector('canvas')?.dataset.battlefieldReviewFrameReady===s.phase;
  if(playable()&&modal!=='session'&&(s.phase==='won'||s.phase==='lost')&&resultShown!==s.phase&&now>=resultDue&&!reviewHoldingResult){resultShown=s.phase;showResult();}
  if(s.phase==='ready'||s.phase==='running')resultShown='';
  if(playable()&&session.status==='active'&&now-lastSave>5000)persist();
}
function switchTab(tab:string){
  if(!playable()||!['battle','evolution','cards','skills'].includes(tab))return;
  activeTab=tab;
  root!.querySelectorAll<HTMLElement>('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===tab);button.setAttribute('aria-current',button.dataset.tab===tab?'page':'false');});
  $('secondary-screen').hidden=tab==='battle';$('battle-view').inert=tab!=='battle';
  $('battle-view').setAttribute('aria-hidden',String(tab!=='battle'));
  syncPause();renderScreen();update(true);
  if(tab==='battle'&&!modal&&(game.state.phase==='won'||game.state.phase==='lost')){resultShown=game.state.phase;showResult();}
  if(tab!=='battle')$('secondary-title')?.focus();
}
function renderScreen(legacyOnly=false){
  const p=game.profile;let html='';
  if(activeTab==='evolution'){
    if(legacyOnly&&$('legacy-current')){
      htmlIfChanged($('legacy-current'),legacyCurrentHtml(p));
      $('secondary-screen').querySelectorAll<HTMLInputElement>('input[name="ready-legacy"]').forEach(input=>{input.checked=input.value===p.legacy.selected;});
      return;
    }
    html=evolutionScreenHtml(p,game.state);
  }else if(activeTab==='cards'){
    html=cardsScreenHtml(p);
  }else if(activeTab==='skills'){
    const captain=p.chronicle?.enabled&&p.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===p.chronicle!.captain):undefined;
    html=`<div class="screen-heading"><span class="eyebrow">TURN THE TIDE</span><h2 id="secondary-title" tabindex="-1">Battle skills</h2><p>The right move can change everything.</p></div><div class="skill-list">${[{id:'freeze',name:'Freeze',tag:'CONTROL',copy:`Freeze every enemy for ${legacyEffects(p.legacy).freezeSeconds} seconds. Give your army time to strike.`,color:'#73bbdb'},{id:'meteor',name:'Meteor',tag:'DAMAGE',copy:'Hit every enemy on the battlefield. Best saved for a big wave.',color:'#de805d'},{id:'food',name:captain?.skill??'Food Drop',tag:captain?'CAPTAIN':'SUPPORT',copy:captain?.description??'Gain up to 10 food instantly, limited by 99-food storage. Deploy reinforcements when you need them.',color:'#97bc6a'}].map(s=>`<article class="skill-detail"><div class="skill-art" style="background:${s.color}">${icon(s.id)}</div><div><small>${s.tag}</small><h3>${s.name}</h3><p>${s.copy}</p><span class="skill-rule">ONCE PER BATTLE</span></div></article>`).join('')}</div><div class="skill-note">${icon('battle')}<p>Use the three skill buttons above your army during a battle. Each skill refreshes when a new battle begins.</p></div><button class="big-button green" data-tab="battle">BACK TO BATTLE ${icon('arrow')}</button>`;
  }
  if(activeTab!=='battle')htmlIfChanged($('secondary-screen'),html);
}
function showModal(id:string,html:string,focusCommand?:string){
  if(id!=='session'&&!playable())return;
  const replacing=modal!==null,sameModal=modal===id,active=document.activeElement as HTMLElement|null,command=active?.dataset.command;
  const storyAction=active?chronicleActionFromData(active.dataset):null,storyPage=active?.dataset.storyPage;
  const layer=$('modal-layer'),previousScroll=sameModal?layer.querySelector<HTMLElement>('.dialog')?.scrollTop:null;
  if(!replacing)focusBefore=document.activeElement as HTMLElement;
  modal=id;modalVersion++;const version=modalVersion;
  const dismissButton=`<button class="close-button" data-command="close" aria-label="Close">${icon('close')}</button>`;
  const dismissMarkup=id==='result'||id==='session'?'':id==='chronicle'?dismissButton:`<div class="dialog-dismiss">${dismissButton}</div>`;
  layer.hidden=false;layer.innerHTML=`<section class="dialog ${id==='result'?'result-dialog':id==='session'?'session-dialog':id==='prestige'?'prestige-dialog':id==='chronicle'?'chronicle-dialog':''}" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="dialog-title">${dismissMarkup}${html}</section>`;
  isolateModal(true);syncPause();window.cancelAnimationFrame(focusFrame);
  focusFrame=requestAnimationFrame(()=>{
    if(lifetime.disposed||layer.hidden||version!==modalVersion)return;
    const previous=sameModal&&command?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===command):null;
    const requested=focusCommand?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===focusCommand):null;
    const storyMatch=storyAction?Array.from(layer.querySelectorAll<HTMLElement>('[data-story-route],[data-story-captain],[data-story-tale],[data-story-preparation],[data-story-discovery],[data-story-provision]')).find(element=>JSON.stringify(chronicleActionFromData(element.dataset))===JSON.stringify(storyAction)):storyPage!==undefined?Array.from(layer.querySelectorAll<HTMLElement>('[data-story-page]')).find(element=>element.dataset.storyPage===storyPage):null;
    const storyPrevious=sameModal&&storyMatch&&!storyMatch.matches(':disabled,[aria-disabled="true"]')?storyMatch:null;
    const dialog=layer.querySelector<HTMLElement>('.dialog');if(previousScroll!==null&&previousScroll!==undefined&&dialog)dialog.scrollTop=previousScroll;
    (requested??previous??storyPrevious??(sameModal?null:layer.querySelector<HTMLElement>('[data-initial-focus]'))??modalFocusables(layer)[0]??dialog)?.focus();
  });
}
function closeModal(refresh=true){
  if(!playable()||!session.check())return;
  // Loading a saved game also ends with a close; with no dialog open there is no focus to give back, and moving it to the
  // Battle tab button would make Space press that button instead of starting the battle.
  const restoreFocus=modal!==null;
  modal=null;modalVersion++;pendingImport=null;window.cancelAnimationFrame(focusFrame);
  $('modal-layer').hidden=true;$('modal-layer').innerHTML='';isolateModal(false);syncPause();
  if(restoreFocus){
    const target=focusBefore;
    if(focusBefore?.isConnected&&!focusBefore.closest('[hidden],[inert]')&&!focusBefore.matches(':disabled')&&focusBefore.getClientRects().length)focusBefore.focus();
    // A restored result often has BODY as its origin. A connected element can also
    // be non-focusable; verify that focus actually moved before accepting it.
    if(!target||document.activeElement!==target||target===document.body||target===document.documentElement)
      root!.querySelector<HTMLElement>(`.bottom-nav [data-tab="${activeTab}"]`)?.focus();
  }
  if(refresh)update(true);
}
function showResult(focusCommand?:string){
  if(!guardAction()||modal==='session')return;
  if(game.state.phase!=='won'&&game.state.phase!=='lost')return;
  persist();
  // A failed ownership check/save may synchronously replace this modal with recovery.
  const fresh=modal!=='result';
  if(playable()&&modal!=='session')showModal('result',resultsHtml(game.profile,game.state),focusCommand);
  if(fresh&&modal==='result')startCountUp($('modal-layer'),compactNumber,document.documentElement.dataset.motion==='reduced');
}
function clearPrestigeContext(){prestigeOrigin=null;prestigeDraft=null;prestigeExpectedTimeline=null;}
function openPrestige(){
  if(!guardAction()||(modal!=='result'&&modal!=='battles'))return;
  const preview=prestigePreview(game.profile,game.state,game.profile.legacy.selected);
  if(!preview)return;
  prestigeOrigin=modal;prestigeDraft=preview.choice;prestigeExpectedTimeline=preview.expectedTimeline;
  showModal('prestige',prestigeDialogHtml(game.profile,preview));
}
function refreshPrestige(){
  if(!guardAction()||modal!=='prestige'||!prestigeOrigin||!isLegacyChoice(prestigeDraft))return;
  const preview=prestigePreview(game.profile,game.state,prestigeDraft);
  if(preview&&preview.expectedTimeline===prestigeExpectedTimeline){
    htmlIfChanged($('prestige-preview-values'),prestigeDetailsHtml(game.profile,preview));
  }else{
    showModal('prestige','<h2 id="dialog-title">This preview is no longer current</h2><p>Keep exploring, then open the next timeline preview again before you begin.</p><button class="big-button secondary" data-command="close">Keep exploring this timeline</button>');
  }
}
function returnFromPrestige(){
  if(!guardAction()||modal!=='prestige')return;
  const origin=prestigeOrigin;clearPrestigeContext();
  if(origin==='result')showResult('next');
  else if(origin==='battles')showModal('battles',battleSelectionHtml(game.profile,game.state),'next');
  else closeModal();
}
function returnToChapters(){
  if(advanceStatus(game.profile,game.state).reason!=='complete'||!action({type:'retry'}))return;
  if(!guardAction()||modal==='session')return;
  evolutionFromResult=false;manualPaused=false;closeModal(false);switchTab('battle');
  showModal('battles',battleSelectionHtml(game.profile,game.state));
}
function dismissModal(){
  if(modal==='session')return;
  if((modal==='chronicle'||modal==='journey'||modal==='quests')&&(game.state.phase==='won'||game.state.phase==='lost')){showResult();return;}
  if(modal==='prestige'){returnFromPrestige();return;}
  if(modal==='result'){
    if(advanceStatus(game.profile,game.state).reason==='complete')returnToChapters();
    return;
  }
  if(modal==='evolve'&&evolutionFromResult){evolutionFromResult=false;showResult();return;}
  evolutionFromResult=false;closeModal();
}
function showSettings(){
  showModal('settings',`<span class="eyebrow">ALMO7AREBOON</span><h2 id="dialog-title">Settings</h2>
  <button class="setting-row" data-command="sound" aria-pressed="${game.profile.sound}">${icon('sound')} Sound <b>${game.profile.sound?'ON':'OFF'}</b></button>
  <button class="setting-row" data-command="atmosphere" aria-pressed="${atmosphereEnabled}" aria-label="Music and environmental sound">Atmosphere <b>${atmosphereEnabled?'ON':'OFF'}</b></button>
  <p class="save-note">Music and environmental sound. Pauses in menus and when the battle is paused. Sound is the master switch.</p>
  <div class="audio-volume"><div class="audio-volume-label"><label for="effects-volume">Effects volume</label><output id="effects-volume-value" for="effects-volume">${audioMix.effects}%</output></div><input id="effects-volume" type="range" min="0" max="100" step="5" value="${audioMix.effects}" aria-valuetext="${audioMix.effects}%"></div>
  <div class="audio-volume"><div class="audio-volume-label"><label for="atmosphere-volume">Atmosphere volume</label><output id="atmosphere-volume-value" for="atmosphere-volume">${audioMix.atmosphere}%</output></div><input id="atmosphere-volume" type="range" min="0" max="100" step="5" value="${audioMix.atmosphere}" aria-valuetext="${audioMix.atmosphere}%"></div>
  <button class="setting-row" data-command="speed">${icon('evolution')} Battle speed <b>${game.profile.speed}×</b></button>
  <button class="setting-row" data-command="marks" aria-pressed="${game.profile.marks===true}" aria-label="Troop shapes: circle melee, triangle ranged, square heavy">Troop shapes <b>${game.profile.marks?'ON':'OFF'}</b></button>
  <button class="setting-row" data-command="motion" aria-pressed="${game.profile.motion==='reduced'}">Motion <b>${game.profile.motion==='reduced'?'REDUCED':'SYSTEM'}</b></button>
  ${game.state.phase==='running'?'<button class="big-button secondary retreat-button" data-command="retreat">RETREAT FROM THIS BATTLE</button><p class="save-note">Retreating counts as a loss. Coins you already earned are kept.</p>':''}
  <div class="backup-actions"><button class="big-button blue" data-command="export">EXPORT SAVE</button><button class="big-button secondary" data-command="import" ${session.status!=='active'?'disabled':''}>IMPORT SAVE</button><button class="big-button secondary" data-command="reset" ${session.status!=='active'?'disabled':''}>START OVER</button><input id="import-save" type="file" accept=".json,application/json" hidden></div>
  <details class="help-box"><summary>How to play</summary><p>Tap Battle, collect food and deploy troops. Your army fights automatically.</p><p>Deployments and defeated enemies earn momentum. At 60, tap near your gate to Hold or near the enemy gate to Advance; the command buttons remain available. Advance adds 20% troop damage and 15% movement for 10 seconds; Hold reduces incoming troop and gate damage by 25% for 10 seconds.</p><p>Keep ranged troops behind a melee or heavy front line. Spend earned coins on food production and new troops.</p><p>Battle victories unlock opponents. Evolution upgrades your own army and resets coins and upgrades. Your selected opponent, unlocked battles and chapter seals stay.</p><small>1–3 troops · Q / W / E skills · Space pause · Escape closes menus.</small></details>
  <details class="help-box"><summary>About and privacy</summary><p>No accounts, tracking or servers. Progress stays in this browser; export keeps a copy you control. Code and art are original; Phaser (MIT) runs the battlefield. See CREDITS.md in the project.</p></details>
  <p class="save-note">${session.status==='temporary'?temporarySessionNotice:savedWarning?'Saving is unavailable. Export a backup before closing.':'Progress saves on this browser. Export a backup to keep a separate copy.'}</p>`);
}
function dailyRow(p:Profile){
  const day=localDay(),reward=dailyReward(p,day);
  const label=reward.available?`Daily reward · day ${reward.streak}`:`Daily reward claimed · day ${p.dailyStreak}`;
  const hint=reward.graced?'You missed a day. A grace day keeps your streak alive (once a week).':reward.available?'Come back every day to raise the reward.':'Return tomorrow to keep your streak going.';
  return `<div class="quest-row"><div><h3>${label}</h3><small>${hint}</small></div><button class="buy-button" data-daily="${day}" aria-label="${reward.available?`Claim ${reward.gems} gems`:'Claimed today'}" ${reward.available?'':'disabled'}>${reward.available?icon('gem')+reward.gems:'✓'}</button></div>`;
}
function showQuests(){
  const p=game.profile;
  showModal('quests',`<span class="eyebrow">EARN YOUR GLORY</span><h2 id="dialog-title">Quests</h2><p>Complete milestones to earn gems for cards.</p><button class="big-button secondary" data-command="journey">Your journey and next goal</button><div class="quest-list">${dailyRow(p)}${QUESTS.map(q=>{const count=p[q.stat],done=count>=q.target,claimed=p.claimed.includes(q.id);return `<div class="quest-row"><div><h3>${q.title}</h3><div class="quest-meter"><i style="width:${Math.min(100,count/q.target*100)}%"></i></div><small>${Math.min(count,q.target).toLocaleString('en-US')} / ${q.target.toLocaleString('en-US')}</small></div><button class="buy-button" data-claim="${q.id}" aria-label="${claimed?'Claimed':`Claim ${q.reward} gems for ${q.title}`}" ${!done||claimed?'disabled':''}>${claimed?'✓':icon('gem')+q.reward}</button></div>`;}).join('')}</div>`);
}
function exportSave(){
  try{
    const url=URL.createObjectURL(new Blob([exportBackup(game.profile)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='almo7areboon-save.json';document.body.append(link);link.click();link.remove();
    const timer=window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    lifetime.add(()=>{window.clearTimeout(timer);URL.revokeObjectURL(url);});
    toast('Save backup exported.');
  }catch{toast('The backup could not be exported. Your current progress was not changed.');}
}

lifetime.listen<PointerEvent>($('battlefield'),'pointerdown',e=>{
 if(!e.isPrimary||e.button!==0){battlefieldPointer=null;return;}
 battlefieldPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
});
lifetime.listen<PointerEvent>($('battlefield'),'pointercancel',()=>{battlefieldPointer=null;});
lifetime.listen<PointerEvent>($('battlefield'),'pointerup',e=>{
 const start=battlefieldPointer;battlefieldPointer=null;
 if(!start||!e.isPrimary||e.pointerId!==start.id||modal||activeTab!=='battle'||game.state.phase!=='running'||game.state.paused||!playable())return;
 const rect=$('battlefield').getBoundingClientRect();
 const order=battlefieldOrderFromGesture({startX:start.x,startY:start.y,endX:e.clientX,endY:e.clientY},{left:rect.left,top:rect.top,width:rect.width,height:rect.height});
 if(order)action({type:'order',order});
});
lifetime.listen(window,'blur',()=>{battlefieldPointer=null;});
lifetime.listen<PointerEvent>(root,'pointerup',e=>blockModalTap.recordPointer(e,performance.now()));
lifetime.listen<MouseEvent>(root,'click',e=>{
  const button=e.target instanceof Element?e.target.closest<HTMLButtonElement>('button'):null;
  if(!button||button.disabled)return;
  if(blockModalTap.blocks(e,modal,performance.now())){e.preventDefault();return;}
  if(e.detail===1)modalPointerSequence=modal!==null;
  else if(e.detail>1&&modalPointerSequence){
    e.preventDefault();
    if(!modal)root!.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`)?.focus();
    return;
  }
  const command=button.dataset.command;
  if(command==='export'){exportSave();return;}
  if(command==='retreat'){if(game.state.phase==='running'&&action({type:'retreat'})){manualPaused=false;closeModal(false);switchTab('battle');}return;}
  if(command==='session-continue'){retriedSession=true;void acquireSession();return;}
  if(command==='session-temporary'){
    if(pagePresent&&session.playTemporarily()){
      sessionReady=true;hasPlayed=true;clearPrestigeContext();closeModal(false);rebuildArmy();syncMotion();switchTab('battle');
    }return;
  }
  // Also protects direct preference mutations and synthetic clicks on isolated controls.
  if(!guardAction())return;
  if(modal&&!button.closest('#modal-layer'))return;
  unlockAudio(game.profile.sound);
  if(command==='journey'){showModal('journey',journeyScreenHtml(game.profile,game.state));return;}
  if(command==='journey-result'){if(modal==='journey'&&(game.state.phase==='won'||game.state.phase==='lost'))showResult();return;}
  if(button.dataset.journeyTab){if(modal==='journey'&&['cards','battle'].includes(button.dataset.journeyTab)){closeModal(false);switchTab(button.dataset.journeyTab);}return;}
  if(button.dataset.order){action({type:'order',order:button.dataset.order as 'advance'|'hold'});return;}
  if(command==='chronicle'){showModal('chronicle',chronicleScreenHtml(game.profile,game.state));return;}
  if(button.dataset.storyPage!==undefined){
    const page=Number(button.dataset.storyPage);if(Number.isInteger(page)&&page>=0&&page<=game.profile.furthestBattle)showModal('chronicle',chronicleScreenHtml(game.profile,game.state,page));return;
  }
  const storyAction=chronicleActionFromData(button.dataset);
  if(storyAction){
    if(action(storyAction)&&playable()&&modal!=='session'){
      if(storyAction.type==='rally')return;
      if(storyAction.type==='chronicle-discover'||storyAction.type==='chronicle-provision'){
        if(game.state.phase==='won'||game.state.phase==='lost'){showResult();$('modal-layer').querySelector<HTMLDetailsElement>('.story-discoveries')?.setAttribute('open','');}
        else showModal('chronicle',chronicleScreenHtml(game.profile,game.state));
      }else if(['chronicle-route','chronicle-expedition','chronicle-continue','chronicle-abandon'].includes(storyAction.type)){
        closeModal(false);manualPaused=false;switchTab('battle');
        if(storyAction.type==='chronicle-abandon')showModal('chronicle',chronicleScreenHtml(game.profile,game.state));
      }else {showModal('chronicle',chronicleScreenHtml(game.profile,game.state));$('modal-layer').querySelector<HTMLDetailsElement>('.story-company')?.setAttribute('open','');}
    }
    return;
  }
  if(button.dataset.tab){switchTab(button.dataset.tab);return;}
  if(button.dataset.unit!==undefined){const kind=Number(button.dataset.unit) as UnitKind;if(!game.profile.unlocked[kind]){if(action({type:'unlock',kind})&&playable()&&!savedWarning)toast(troopUnlockMessage(game.profile,game.state.phase,kind,game.deploymentStatus(kind)),7000);}else action({type:'spawn',kind});return;}
  if(button.dataset.skill){action({type:'skill',skill:button.dataset.skill as Skill});return;}
  if(button.dataset.daily){if(action({type:'daily',day:Number(button.dataset.daily)}))showQuests();return;}
  if(button.dataset.claim){const fromJourney=modal==='journey';if(action({type:'claim',id:button.dataset.claim})){if(fromJourney&&playable()&&modal!=='session')showModal('journey',journeyScreenHtml(game.profile,game.state));else showQuests();}return;}
  if(button.dataset.battle!==undefined){if(action({type:'select-battle',battle:Number(button.dataset.battle)}))closeModal();return;}
  if(button.dataset.pack!==undefined){
    const before=[...game.profile.cards],count=Number(button.dataset.pack) as 1|10|50;
    if(action({type:'summon',count})&&playable())showModal('summon',summonedCardsHtml(before,game.profile));
    else toast('This pack is unavailable. Your gems were not spent.');return;
  }
  switch(button.dataset.command){
    case 'start':manualPaused=false;action({type:'start'});break;
    case 'upgrade-food':action({type:'upgrade',stat:'food'});break;
    case 'upgrade-base':action({type:'upgrade',stat:'base'});break;
    case 'battles':showModal('battles',battleSelectionHtml(game.profile,game.state));break;
    case 'wave-help':if(game.state.phase==='running')showModal('wave-help',waveInspectionHtml(game.waveStatus(),game.state.chronicle?.enabled?game.state.chronicle.objective:undefined));break;
    case 'evolve':{const html=evolutionDialogHtml(game.profile,game.state);if(html){evolutionFromResult=modal==='result';showModal('evolve',html);}break;}
    case 'confirm-evolve':{
      const returnToResult=evolutionFromResult,ok=action({type:'evolve'});
      if(!playable()||modal==='session')break;
      if(ok){
        evolutionFromResult=false;
        {const deck=$('unit-cards');deck.dataset.evolveReveal=deck.dataset.evolveReveal==='a'?'b':'a';}
        if(returnToResult)showResult();else{closeModal(false);switchTab('battle');}
        if(!savedWarning)toast(`Entering ${chapterPresentation(game.profile.age).title}.`);
      }else{
        const html=evolutionDialogHtml(game.profile,game.state);
        if(html)showModal('evolve',html);else dismissModal();
      }break;
    }
    case 'return-chapters':returnToChapters();break;
    case 'regroup-chapters':{
      const suggested=earlierChapter(game.profile);
      if(modal!=='result'||game.state.phase!=='lost'||suggested===null)break;
      if(!action({type:'retry'})||!playable()||(modal as string|null)==='session')break;
      evolutionFromResult=false;manualPaused=false;closeModal(false);switchTab('battle');
      showModal('battles',battleSelectionHtml(game.profile,game.state,true),`choose-battle-${suggested}`);
      break;
    }
    case 'next':{
      const advancement=advanceStatus(game.profile,game.state);
      if(advancement.allowed&&advancement.target==='timeline'){openPrestige();break;}
      if(action({type:'next'})&&playable()&&modal!=='session'){evolutionFromResult=false;closeModal(false);manualPaused=false;switchTab('battle');}break;
    }
    case 'retry':if(action({type:'retry'})&&playable()&&modal!=='session'){evolutionFromResult=false;closeModal(false);manualPaused=false;switchTab('battle');}break;
    case 'confirm-prestige':{
      if(modal!=='prestige'||!prestigeOrigin||prestigeExpectedTimeline===null||!isLegacyChoice(prestigeDraft))break;
      const ok=action({type:'prestige',expectedTimeline:prestigeExpectedTimeline,legacy:prestigeDraft});
      // The guarded writer can synchronously replace the narrowed prestige modal.
      if(!playable()||(modal as string|null)==='session')break;
      if(ok){clearPrestigeContext();evolutionFromResult=false;manualPaused=false;closeModal(false);switchTab('battle');}
      else refreshPrestige();
      break;
    }
    case 'pause':if(game.state.phase==='running'){manualPaused=!manualPaused;syncPause();update(true);}break;
    case 'speed':game.profile.speed=game.profile.speed===1?2:1;persist();update(true);if(modal==='settings'&&playable())showSettings();break;
    case 'settings':showSettings();break;
    case 'quests':showQuests();break;
    case 'sound':game.profile.sound=!game.profile.sound;if(game.profile.sound)unlockAudio(true);else suspendAudio();persist();if(playable())showSettings();break;
    case 'atmosphere':atmosphereEnabled=!atmosphereEnabled;saveAtmosphere(atmosphereEnabled);syncPause();showSettings();break;
    case 'marks':if(game.profile.marks)delete game.profile.marks;else game.profile.marks=true;syncMarks();persist();if(playable())showSettings();break;
    case 'motion':game.profile.motion=game.profile.motion==='reduced'?'system':'reduced';syncMotion();persist();if(playable())showSettings();break;
    case 'import':$('import-save')?.click();break;
    case 'reset':if(session.status!=='active')break;showModal('reset',`<h2 id="dialog-title">Start over?</h2><p>This deletes your progress on this browser: your age, coins, upgrades, unlocked battles, every card and all gems, quests and records.</p><p>Your sound, speed and motion choices stay. Export a save first if you might want this progress back.</p><button class="big-button blue" data-command="export">EXPORT SAVE FIRST</button><button class="big-button danger" data-command="confirm-reset">DELETE PROGRESS AND START OVER</button><button class="big-button secondary" data-command="close">KEEP MY PROGRESS</button>`);break;
    case 'confirm-reset':{
      if(session.status!=='active')break;
      const restored=restoreBackupWithSave(game,startOverProfile(game.profile),profile=>session.save(profile).ok);
      if(!restored.ok){toast('The new game could not be saved. Your current progress was not deleted.');break;}
      game=restored.game;lastPhase=game.state.phase;resultDue=0;manualPaused=false;resultShown='';savedWarning=false;clearPrestigeContext();rebuildArmy();syncMotion();closeModal(false);switchTab('battle');toast('Started a new game.');break;
    }
    case 'confirm-import':{
      if(!pendingImport||session.status!=='active')break;const restored=restoreBackupWithSave(game,pendingImport,profile=>session.save(profile).ok);
      if(!restored.ok){toast('The save could not be written. Your current game was not replaced.');break;}
      game=restored.game;lastPhase=game.state.phase;resultDue=0;manualPaused=false;resultShown='';savedWarning=false;clearPrestigeContext();rebuildArmy();syncMotion();closeModal(false);switchTab('battle');toast('Save restored.');break;
    }
    case 'close':dismissModal();break;
  }
});
lifetime.listen<Event>(root,'input',e=>{
  const input=e.target;
  if(!(input instanceof HTMLInputElement)||input.type!=='range'||(input.id!=='effects-volume'&&input.id!=='atmosphere-volume')||modal!=='settings'||!$('modal-layer').contains(input))return;
  // A same-document foreign save has no storage notification here. Check the
  // session before changing intent, writing preferences or retargeting buses.
  if(!guardAction()||modal!=='settings'||!$('modal-layer').contains(input))return;
  const family=input.id==='effects-volume'?'effects':'atmosphere';
  audioMix=normalizeAudioMix({...audioMix,[family]:input.valueAsNumber});
  saveAudioMix(audioMix);updateAudioMix(audioMix);
  const percentage=`${audioMix[family]}%`;
  input.value=String(audioMix[family]);input.setAttribute('aria-valuetext',percentage);
  textIfChanged($(`${input.id}-value`),percentage);
});
lifetime.listen<Event>(root,'change',async e=>{
  const input=e.target;if(!(input instanceof HTMLInputElement))return;
  if(input.type==='radio'&&isLegacyChoice(input.value)&&input.checked){
    if(input.name==='prestige-legacy'){
      if(modal!=='prestige'||!input.closest('#modal-layer')||!guardAction())return;
      prestigeDraft=input.value;refreshPrestige();return;
    }
    if(input.name==='ready-legacy'){
      if(modal||activeTab!=='evolution'||!input.closest('#secondary-screen')||game.state.phase!=='ready'||game.profile.legacy.rank===0||!guardAction())return;
      action({type:'select-legacy',legacy:input.value});
      if(playable()&&modal!=='session')renderScreen(true);
      return;
    }
  }
  if(input.id!=='import-save')return;
  const request=++importRequest;
  if(session.status!=='active'||!guardAction())return;
  const file=input.files?.[0],version=modalVersion;if(!file)return;
  if(file.size>MAX_SAVE_CHARS){toast('Choose a save file smaller than 100 KB.');input.value='';return;}
  try{
    const decoded=importBackup(await file.text());
    if(request!==importRequest||lifetime.disposed||version!==modalVersion||modal!=='settings'||session.status!=='active'||!guardAction())return;
    if(!decoded.ok){toast(decoded.error);input.value='';return;}
    pendingImport=decoded.profile;
    showModal('import',`<h2 id="dialog-title">Replace this save?</h2><p>Import timeline ${pendingImport.timeline}, ${chapterPresentation(pendingImport.age).title}, with ${money(pendingImport.coins)} coins.</p><p>Your current progress in this browser will be replaced. Export it first to keep a separate copy.</p><button class="big-button blue" data-command="confirm-import">REPLACE WITH THIS SAVE</button><button class="big-button secondary" data-command="close">CANCEL</button>`);
  }catch{
    if(request!==importRequest||lifetime.disposed||version!==modalVersion||modal!=='settings'||session.status!=='active'||!guardAction())return;
    input.value='';
    toast('The selected file could not be read. Your current game was not changed.');
  }
});
lifetime.listen<KeyboardEvent>(document,'keydown',e=>{
  if(modal){
    if(e.key==='Escape'){dismissModal();e.preventDefault();}
    if(e.key==='Tab'){
      const elements=modalFocusables($('modal-layer')),index=nextFocusIndex(elements.indexOf(document.activeElement as HTMLElement),elements.length,e.shiftKey);
      e.preventDefault();(index===null?$('modal-layer').querySelector<HTMLElement>('.dialog'):elements[index])?.focus();
    }return;
  }
  if(!guardAction()||activeTab!=='battle'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||document.hidden||isEditingTarget(e.target instanceof HTMLElement?e.target:null))return;
  if(['1','2','3'].includes(e.key)){e.preventDefault();action({type:'spawn',kind:(Number(e.key)-1) as UnitKind});}
  const skillIndex=['q','w','e'].indexOf(e.key.toLowerCase());
  if(skillIndex>=0){e.preventDefault();action({type:'skill',skill:(['freeze','meteor','food'] as Skill[])[skillIndex]});}
  if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){
    e.preventDefault();if(game.state.phase==='ready')action({type:'start'});else if(game.state.phase==='running'){manualPaused=!manualPaused;syncPause();update(true);}
  }
});
lifetime.listen(root,'visual-fallback',()=>toast('Some artwork could not load. The simplified battlefield is active.'));
lifetime.listen<StorageEvent>(window,'storage',event=>{
  if(event.key===SAVE_KEY||event.key===BACKUP_KEY||event.key===null)session.check();
});
lifetime.listen(window,'focus',()=>{if(pagePresent)session.check();syncPause();});
lifetime.listen(document,'visibilitychange',()=>{
  if(document.hidden){persist();syncPause();suspendAudio();}
  else{session.check();syncPause();}
});
function suspendSession(){
  // Save while still active, then deactivate synchronously before releasing the lock.
  persist();resumeOwnership=resumeOwnership||session.status==='active'||session.status==='starting';
  pagePresent=false;acquisitionVersion++;acquiring=null;sessionReady=false;clearPrestigeContext();
  if(resumeOwnership)session.release();
  syncPause();suspendAudio();
}
lifetime.listen(window,'pagehide',suspendSession);
lifetime.listen(window,'pageshow',()=>{
  pagePresent=true;
  if(session.status==='temporary'){sessionReady=true;syncPause();}
  else if(resumeOwnership){resumeOwnership=false;void acquireSession();}
});
lifetime.listen(motionQuery,'change',syncMotion);
function events(batch:GameEvent[]){
  // Fresh terminal results are admitted before their dialog; menus and all
  // modal owners block new batches, including accepted menu confirmations.
  playCombatEvents(batch,game.profile.sound&&playable()&&!document.hidden&&!manualPaused&&!game.state.paused&&activeTab==='battle'&&modal===null);
  if(batch.some(event=>event.type==='win'||event.type==='lose'))persist();
}
const port=createBattlefieldPort(()=>game,action,dt=>{syncPause();if(playable())game.step(dt*game.profile.speed);});
rebuildArmy();syncMotion();syncPause();update(true);
// Phaser (about 1.2 MB) loads after the shell is interactive, so weak phones see the game at once.
let renderer:{destroy():void}|null=null,rendererClosed=false;
$('battlefield').dataset.renderer='loading';
void import('./view/battlefield.ts').then(({mountBattlefield})=>{
  if(rendererClosed)return;
  renderer=mountBattlefield($('battlefield'),port,force=>update(force),events,{isVisible:()=>activeTab==='battle'&&!document.hidden,villageMood:()=>villagePresentation!.mood,onPresentation:syncVillagePresentation});
  $('battlefield').dataset.renderer='ready';
}).catch(()=>{$('battlefield').dataset.renderer='failed';toast('The battlefield could not load. Check your connection and reload.');});
lifetime.add(()=>{rendererClosed=true;renderer?.destroy();});lifetime.add(disposeAudio);
lifetime.add(()=>{window.clearTimeout(toastTimer);window.cancelAnimationFrame(focusFrame);isolateModal(false);});
lifetime.add(()=>{acquisitionVersion++;sessionReady=false;session.dispose();});
if(import.meta.hot)import.meta.hot.dispose(()=>{suspendSession();lifetime.dispose();});
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{/* Offline play is optional. */});},{once:true});
sessionPresentation('starting');
void acquireSession();
