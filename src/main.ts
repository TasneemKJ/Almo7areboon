import {questRecords,selectedQuestRecord,questRecordAction,questRecordLabel,questRecordsHtml,questRecordDetailHtml} from './ui/quest-records.ts';
import './ui/quest-records.css';
import {campRootHtml,campFocusHtml} from './ui/camp-screen.ts';
import {canOwnCamp,isCampStation,campActionFromData,type CampOwner,type CampFocus} from './ui/camp-owner.ts';
import './ui/camp.css';
import {fieldControlsHtml} from './ui/field-controls.ts';
import {createFieldController} from './ui/field-controller.ts';
import './ui/world-play.css';
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
import './ui/simple-entry.css';
import './ui/preferences.css';
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
import { chapterLandscape, chapterPresentation } from './ui/chapter-presentation.ts';
import { entryCopy, entryScreenHtml, hasPriorPlay, entrySecondary } from './ui/entry-screen.ts';
import { preferencesHtml, saveRecoveryHtml } from './ui/preferences-screen.ts';
import { evolutionScreenHtml } from './ui/evolution-screen.ts';
import { icon } from './view/icons.ts';
import { playCombatEvents, playSummonAudio, stopCombatAudio, unlockAudio, suspendAudio, disposeAudio, updateSoundscape, updateAudioMix } from './view/audio.ts';
import { createArmyUpdater, troopControlLabel, troopUnlockMessage } from './ui/army-screen.ts';
import { cardsScreenHtml, summonedCardsHtml } from './ui/cards-screen.ts';
import { compactResultsHtml, expeditionChoiceHtml, resultsHtml } from './ui/results-screen.ts';
import { startCountUp } from './ui/count-up.ts';
import { syncWeekly, weekId, weeklyStatus } from './game/weekly.ts';
import { welcomeBackLine } from './ui/welcome-back.ts';
import { earlierChapter } from './ui/regroup-learning.ts';
import { legacyCurrentHtml, prestigeDetailsHtml, prestigeDialogHtml } from './ui/prestige-presentation.ts';
import { battleGuidance, foodIsPiling, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel } from './ui/battle-hud.ts';
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
root.dataset.fieldMode='field';
const lifetime=createLifetime();
let activeTab='battle',modal:string|null=null,manualPaused=false;
let battlefieldPointer:{id:number;x:number;y:number}|null=null;
let villagePresentation:VillagePresentation|null=null;
let atmosphereEnabled=loadAtmosphere();
let audioMix=loadAudioMix();
updateAudioMix(audioMix);
let lastSavedAt=0;
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
let entryEntered=false,entrySaved=false,resultDetailsOpen=false;
let entryWelcome:string|null=null;
let settingsOrigin:'field-pause'|null=null;
let campOwner:CampOwner|null=null,campRenderKey='';
let questSelection:string|null=null,questCalendarDay:number|null=null;
let acquiring:Promise<void>|null=null;
const money=(value:number)=>value>=10000?compactNumber(value):Math.floor(value).toLocaleString('en-US');
const coin=(value:number)=>`${icon('coin')}<span>${money(value)}</span>`;
root.innerHTML = `
<main class="game-shell" aria-label="Almo7areboon">
  ${entryScreenHtml(game.profile)}
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
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;

const updateArmy=createArmyUpdater({units:$('unit-cards'),skills:$('battle-skills'),stages:$('stage-progress')},unitPortrait,money);
const isolateModal=createModalIsolation($('modal-layer'));
const fieldControls=createFieldController(root);
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
  if(status!=='active'&&status!=='temporary'){sessionReady=false;campOwner=null;entryWelcome=null;clearPrestigeContext();}
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
      game=new Game(loaded.profile);lastPhase=game.state.phase;resultDue=0;hasPlayed=true;sessionReady=true;entrySaved=hasPriorPlay(game.profile);
      manualPaused=false;resultShown='';savedWarning=false;pendingImport=null;evolutionFromResult=false;clearPrestigeContext();
      entryWelcome=loaded.loadStatus==='recovered'||loaded.loadStatus==='corrupt'?null:welcomeBackLine(loaded.profile.lastSeen,Date.now(),loaded.profile.wins);
      if(guardAction())game.dispatch({type:'weekly-sync',week:weekId(localDay())});
      closeModal(false);rebuildArmy();syncMotion();switchTab('battle');
      if(loaded.loadStatus==='recovered')toast('Recovered your progress from the backup save.');
      else if(loaded.loadStatus==='corrupt')toast('The stored save could not be recovered. A new game has started.');
    }else if(!hasPlayed&&loaded.profile){
      // Safe preview for explicit temporary play only; never replace conflicted work.
      entryWelcome=null;game=new Game(loaded.profile);lastPhase=game.state.phase;resultDue=0;rebuildArmy();syncMotion();update(true);
    }
  })().finally(()=>{if(version===acquisitionVersion)acquiring=null;});
  return acquiring;
}

function entryReady(){return playable()&&$('battlefield').dataset.renderer==='ready'&&!$('battlefield').querySelector('.world-loader');}
function syncEntry(){
  const mode=entryEntered?'play':'home';
  if(root!.dataset.entry!==mode)root!.dataset.entry=mode;
  if($('entry-screen').hidden!==entryEntered)$('entry-screen').hidden=entryEntered;
  if(entryEntered)return;
  const copy=entryCopy(game.profile,entrySaved||hasPriorPlay(game.profile)),failed=$('battlefield').dataset.renderer==='failed';
  textIfChanged($('entry-play'),failed?'Reload':entryReady()?copy.action:'Loading…');
  $('entry-play').dataset.command=failed?'reload-world':'enter-world';
  textIfChanged($('entry-chapter'),copy.chapter);
  textIfChanged($('entry-subtitle'),failed?'The battlefield could not load. Reload to try again; your saved progress is kept.':entryWelcome??copy.subtitle);
  const art=$('entry-art'),source=chapterLandscape(game.profile.enemyAge);
  if(art.dataset.source!==source){art.setAttribute('src',source);art.dataset.source=source;}
  const secondary=entrySecondary(game.profile,game.state),extra=$('entry-secondary');
  extra.hidden=failed||secondary===null;extra.dataset.command=secondary==='leave'?'leave-battle':'home-camp';
  textIfChanged(extra,secondary==='leave'?'Leave battle…':'Camp');extra.toggleAttribute('disabled',!entryReady());
  $('entry-play').toggleAttribute('disabled',!playable()||(!failed&&!entryReady()));$('entry-settings').toggleAttribute('disabled',!playable());
}
function enterWorld(){
  if(entryEntered||modal||!guardAction()||!entryReady())return;
  root!.dataset.fieldMode='field';
  entryEntered=true;entrySaved=true;entryWelcome=null;syncEntry();
  manualPaused=false;
  if(game.state.phase==='ready')action({type:'start'});
  switchTab('battle');
  if(!modal)$('world').focus({preventScroll:true});
}
function rebuildArmy(){updateArmy(game.profile);}
function toast(message:string,duration=4200){
  textIfChanged($('toast'),message);$('toast').classList.add('visible');
  window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').classList.remove('visible'),duration);
}
function persist():boolean{
  if(!playable()||session.status==='temporary')return false;
  // lastSeen rides on the saved copy only, so the live profile (and every "unchanged progress" check) is untouched.
  const result=session.save({...game.profile,lastSeen:Math.floor(Date.now()/60000)*60000}),ok=result.ok;lastSave=performance.now();
  if(result.reason==='write-failed'&&!savedWarning){savedWarning=true;toast('Progress could not be saved. Export a backup from Settings before closing this tab.');}
  if(ok){savedWarning=false;lastSavedAt=Date.now();}
  return ok;
}
function syncPause(){
  game.state.paused=!entryEntered||!playable()||pauseReason({phase:game.state.phase,manual:manualPaused,tab:activeTab,modal,hidden:document.hidden})!==null;
  if(!entryEntered||!game.profile.sound||!playable()||document.hidden||manualPaused||activeTab!=='battle'||(modal!==null&&modal!=='result')){
    // Only a direct accepted card-summon's finite shimmer may finish in Cards.
    const summonTail=game.profile.sound&&playable()&&!document.hidden&&!manualPaused&&activeTab==='cards'&&(modal===null||modal==='summon');
    stopCombatAudio(summonTail);
  }
  syncVillagePresentation();
}
function syncVillagePresentation(dt=0,batch:readonly GameEvent[]=[]){
  villagePresentation=advanceVillagePresentation(villagePresentation,game.state,game.profile.age,dt,batch,!entryEntered||!playable()||document.hidden||activeTab!=='battle'||modal!==null);
  // The renderer calls this after stepping and draining events, so a delayed
  // result dialog still gates audio with the actual terminal phase this frame.
  updateSoundscape(game.profile.age,ambienceAllowed({sound:game.profile.sound&&entryEntered,atmosphere:atmosphereEnabled,paused:game.state.paused,phase:game.state.phase,tab:activeTab,modal,hidden:document.hidden}),villagePresentation.mood);
}
function syncMarks(){document.documentElement.dataset.marks=game.profile.marks?'on':'off';}
function syncMotion(){document.documentElement.dataset.motion=game.profile.motion==='reduced'||motionQuery.matches?'reduced':'full';syncMarks();}
function action(a:Action):boolean{
  if(!guardAction())return false;
  unlockAudio(game.profile.sound);const ok=game.dispatch(a);
  if(ok){
    if(a.type==='prestige'||game.profile.weekly?.week!==weekId(localDay()))game.dispatch({type:'weekly-sync',week:weekId(localDay())});
    persist();syncPause();rebuildArmy();update(true);if(activeTab!=='battle')renderScreen(a.type==='select-legacy');
    if(a.type==='summon')playSummonAudio(game.profile.sound&&playable()&&!document.hidden&&!manualPaused&&activeTab==='cards'&&modal===null);
  }
  return ok;
}
function update(force=false){
  const now=performance.now();if(!force&&now-lastUpdate<80)return;lastUpdate=now;
 const p=game.profile,s=game.state;
 syncEntry();syncCamp();
 if(modal==='quests'&&playable()&&!Object.is(questCalendarDay,localDay()))refreshQuestRecord();
 if(modal==='quests'&&playable()){const notice=$('quest-save-status'),message=questSaveNotice();notice.hidden=!message;textIfChanged(notice,message);}
 if(!entryEntered)return;
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
    button.classList.toggle('teach',kind===0&&!button.disabled&&((p.wins===0&&s.phase==='running'&&!s.paused&&s.stats.deployed===0)||foodIsPiling(p,s)));
    const label=troopControlLabel(p,kind,status);
    button.title=label;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
    const fill=button.querySelector<HTMLElement>('.unit-fill');if(fill)fill.style.transform=`scaleX(${Math.max(0,Math.min(1,s.food/ERAS[p.age].units[kind].cost))})`;
  });
  root!.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(button=>{
    const skill=button.dataset.skill as Skill,used=s.skillsUsed.includes(skill);
    button.disabled=!game.canUseSkill(skill);button.classList.toggle('used',used);
    const cue=skillCue(p,s,skill,!button.disabled);
    button.classList.toggle('skill-opportunity',cue.opportunity);
    button.classList.toggle('freeze-active',cue.activeEffect);
    button.title=cue.label;button.setAttribute('aria-label',cue.label);
    button.classList.toggle('badge-targets',/^\d+$/.test(cue.badge));
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
  fieldControls.update(game);
  // Let the finishing blow and base collapse play before the result dialog covers them.
  if(s.phase!==lastPhase){if(lastPhase==='running'&&(s.phase==='won'||s.phase==='lost'))resultDue=now+(document.documentElement.dataset.motion==='reduced'?350:1300);lastPhase=s.phase;}
  const reviewHoldingResult=globalThis.navigator?.webdriver&&document.querySelector('canvas')?.dataset.battlefieldReviewFrameReady===s.phase;
  if(entryEntered&&playable()&&modal!=='session'&&(s.phase==='won'||s.phase==='lost')&&resultShown!==s.phase&&now>=resultDue&&!reviewHoldingResult){resultShown=s.phase;showResult();}
  if(s.phase==='ready'||s.phase==='running')resultShown='';
  if(playable()&&session.status==='active'&&now-lastSave>5000)persist();
}
function switchTab(tab:string){
  if(!playable()||!['battle','evolution','cards','skills'].includes(tab))return;
  activeTab=tab;
  if(entryEntered&&tab==='battle'&&canOwnCamp(game.profile,game.state))root!.dataset.fieldMode='camp';
  root!.querySelectorAll<HTMLElement>('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===tab);button.setAttribute('aria-current',button.dataset.tab===tab?'page':'false');});
  $('secondary-screen').hidden=tab==='battle';$('battle-view').inert=tab!=='battle';
  $('battle-view').setAttribute('aria-hidden',String(tab!=='battle'));
  syncPause();renderScreen();update(true);
  if(entryEntered&&tab==='battle'&&!modal&&(game.state.phase==='won'||game.state.phase==='lost')){resultShown=game.state.phase;showResult();}
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
    html=`<div class="screen-heading"><span class="eyebrow">TURN THE TIDE</span><h2 id="secondary-title" tabindex="-1">Battle skills</h2><p>The right move can change everything.</p></div><div class="skill-list">${[{id:'freeze',name:'Freeze',tag:'CONTROL',copy:`Freeze every enemy for ${legacyEffects(p.legacy).freezeSeconds} seconds. Give your army time to strike.`,color:'#73bbdb'},{id:'meteor',name:'Meteor',tag:'DAMAGE',copy:'Hit every enemy on the battlefield. Best saved for a big wave.',color:'#de805d'},{id:'food',name:captain?.skill??'Food Drop',tag:captain?'CAPTAIN':'SUPPORT',copy:captain?.description??'Gain up to 10 food instantly, limited by 99-food storage. Deploy reinforcements when you need them.',color:'#97bc6a'}].map(s=>`<article class="skill-detail"><div class="skill-art" style="background:${s.color}">${icon(s.id)}</div><div><small>${s.tag}</small><h3>${s.name}</h3><p>${s.copy}</p><span class="skill-rule">ONCE PER BATTLE</span></div></article>`).join('')}</div><div class="skill-note">${icon('battle')}<p>Select an enemy in battle for Freeze or Meteor. Inspect the supplies after deploying a troop for your support skill. Each skill refreshes when a new battle begins.</p></div><button class="big-button green" data-tab="battle">BACK TO BATTLE ${icon('arrow')}</button>`;
  }
  if(activeTab!=='battle')htmlIfChanged($('secondary-screen'),`${campOwner?.kind==='advanced'?'<button class="big-button secondary camp-advanced-return" data-command="camp-return">Back to Camp</button>':''}${html}`);
}
function showModal(id:string,html:string,focusCommand?:string){
  if(id!=='session'&&!playable())return;
  // A canonical ready transition may open a retained task after mounting Camp.
  // Its modal, not the underlying root, owns all of those deliberate controls.
  if(campOwner?.kind==='root'&&canOwnCamp(game.profile,game.state)&&id!=='camp-focus'&&id!=='session')campOwner={kind:'advanced',returnTarget:'journal'};
  const replacing=modal!==null,sameModal=modal===id,active=document.activeElement as HTMLElement|null,command=active?.dataset.command;
  const storyAction=active?chronicleActionFromData(active.dataset):null,storyPage=active?.dataset.storyPage;
  const layer=$('modal-layer'),previousScroll=sameModal?layer.querySelector<HTMLElement>('.dialog')?.scrollTop:null;
  if(!replacing)focusBefore=document.activeElement as HTMLElement;
  modal=id;modalVersion++;const version=modalVersion;
  const dismissButton=`<button class="close-button" data-command="close" aria-label="Close">${icon('close')}</button>`;
  const dismissMarkup=['quests','camp-focus','field-pause','settings','save-recovery','reset','import','leave-battle','result','result-expedition','session'].includes(id)?'':id==='chronicle'?dismissButton:`<div class="dialog-dismiss">${dismissButton}</div>`;
  layer.hidden=false;layer.innerHTML=`<section class="dialog ${(id==='result'||id==='result-expedition')?'result-dialog':id==='session'?'session-dialog':id==='camp-focus'?'camp-dialog':id==='settings'?'preferences-dialog':id==='quests'?'quest-record-dialog':id==='prestige'?'prestige-dialog':id==='chronicle'?'chronicle-dialog':''}" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="dialog-title">${dismissMarkup}${html}</section>`;
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
      (entryEntered?root!.querySelector<HTMLElement>(campOwner?campOwner.kind==='advanced'&&activeTab!=='battle'?'[data-command="camp-return"]':'[data-command="camp-battle"]':root!.dataset.fieldMode==='field'?'[data-command="field-pause"]':`.bottom-nav [data-tab="${activeTab}"]`):$('entry-play'))?.focus({preventScroll:true});
  }
  if(refresh)update(true);
}
function showResult(focusCommand?:string){
  if(!guardAction()||modal==='session')return;
  if(game.state.phase!=='won'&&game.state.phase!=='lost')return;
  persist();
  // A failed ownership check/save may synchronously replace this modal with recovery.
  const fresh=modal!=='result';
  if(playable()&&modal!=='session'){resultDetailsOpen=false;showModal('result',compactResultsHtml(game.profile,game.state),focusCommand);}
  if(fresh&&modal==='result')startCountUp($('modal-layer'),compactNumber,document.documentElement.dataset.motion==='reduced');
}
function showResultDetails(){
  if(!guardAction()||modal!=='result')return;
  resultDetailsOpen=true;
  showModal('result',`<button class="big-button secondary result-back" data-command="result-back">Back to result</button>${resultsHtml(game.profile,game.state)}`,'result-back');
}
function showHome(){
  const fromCamp=entryEntered&&root!.dataset.fieldMode==='camp'&&modal===null;
  if(!guardAction()||(!fromCamp&&modal!=='field-pause'&&(modal!=='result'||!['won','lost'].includes(game.state.phase))))return;
  const owner=modal;persist();if(!playable()||modal!==owner)return;
  fieldControls.clear();campOwner=null;$('camp-view').hidden=true;
  entryEntered=false;entrySaved=hasPriorPlay(game.profile);root!.dataset.fieldMode='field';resultDetailsOpen=false;syncEntry();closeModal(false);syncPause();
  $('entry-play').focus({preventScroll:true});
}
function enterCamp(){
  if(entryEntered||modal||!guardAction()||!entryReady()||entrySecondary(game.profile,game.state)!=='camp')return;
  entryEntered=true;entrySaved=true;entryWelcome=null;root!.dataset.fieldMode='camp';manualPaused=false;
  fieldControls.clear();syncEntry();switchTab('battle');syncPause();root!.querySelector<HTMLElement>('[data-command="camp-battle"]')?.focus({preventScroll:true});
}
/** Camp is presentation only. The renderer continues to receive canonical ready state. */
function syncCamp(){
  const visible=entryEntered&&root!.dataset.fieldMode==='camp'&&playable()&&canOwnCamp(game.profile,game.state);
  if(!visible){campOwner=null;$('camp-view').hidden=true;if(!canOwnCamp(game.profile,game.state))root!.dataset.fieldMode='field';return;}
  campOwner??={kind:'root'};
  if(campOwner.kind==='advanced'&&!modal&&activeTab==='battle')campOwner={kind:'root'};
  const p=game.profile,key=JSON.stringify([p.age,p.enemyAge,p.foodLevel,p.baseLevel,p.unlocked,p.chronicle?.route]);
  if(key!==campRenderKey){campRenderKey=key;htmlIfChanged($('camp-view'),campRootHtml(p));}
  $('camp-view').hidden=activeTab!=='battle';$('camp-view').inert=modal!==null||activeTab!=='battle';
  $('battle-view').inert=true;
  root!.querySelectorAll<HTMLElement>('.resources,.bottom-nav').forEach(node=>{node.inert=true;});
  root!.dataset.campOwner=campOwner.kind;
  const notice=$('session-notice');notice.hidden=session.status!=='temporary'&&!savedWarning;
  const message=session.status==='temporary'?temporarySessionNotice:savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':'';
  textIfChanged(notice,message);
  // A later autosave/background failure must also reach the isolated active focus.
  // Update this stable node only: no modal replacement, refocus or scroll change.
  if(modal==='camp-focus'&&campOwner.kind==='focus'){
    const focusNotice=$('camp-focus-save-status');
    if(focusNotice){focusNotice.hidden=!message;textIfChanged(focusNotice,message);}
  }
}
function showCampFocus(focus:CampFocus,focusCommand?:string){
  if(!campOwner||!guardAction()||!canOwnCamp(game.profile,game.state)||modal==='session')return;
  const returnTarget=typeof focus==='object'?'company':focus;
  campOwner={kind:'focus',focus,returnTarget};
  showModal('camp-focus',campFocusHtml(game,focus,session.status==='temporary'?temporarySessionNotice:savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':''),focusCommand);syncCamp();
}
function returnToCamp(){
  if(!campOwner||!guardAction()||!canOwnCamp(game.profile,game.state)||modal==='session')return;
  if(campOwner.kind==='focus'&&typeof campOwner.focus==='object'){showCampFocus('company');return;}
  const target=campOwner.kind==='root'?'journal':campOwner.returnTarget;
  closeModal(false);if(!playable()||modal==='session')return;
  campOwner={kind:'root'};switchTab('battle');syncCamp();
  root!.querySelector<HTMLElement>(`[data-camp-station="${target}"]`)?.focus({preventScroll:true});
}
function handleCampInput(button:HTMLButtonElement):boolean {
  const command=button.dataset.command;
  if(command==='camp-return'){returnToCamp();return true;}
  if(!campOwner)return command?.startsWith('camp-')??false;
  if(!guardAction()||!canOwnCamp(game.profile,game.state))return true;
  if(campOwner.kind==='advanced')return !modal&&!button.closest('#secondary-screen');
  if(campOwner.kind==='root'){
    if(isCampStation(button.dataset.campStation)){showCampFocus(button.dataset.campStation);return true;}
    if(command==='camp-home'){showHome();return true;}
    if(command==='camp-battle'&&entryReady()&&!modal){manualPaused=false;if(action({type:'start'})&&playable()&&modal!=='session'){campOwner=null;root!.dataset.fieldMode='field';switchTab('battle');$('world').focus({preventScroll:true});}return true;}
    return true;
  }
  if(modal!=='camp-focus')return true;
  const focus=campOwner.focus;
  if(command==='camp-back'){returnToCamp();return true;}
  if(focus==='company'&&/^[0-2]$/.test(button.dataset.campRecruit??'')){showCampFocus({recruit:Number(button.dataset.campRecruit) as UnitKind});return true;}
  const local=campActionFromData(focus,button.dataset);
  if(local){
    const accepted=action(local);
    if(accepted&&playable()&&modal==='camp-focus'&&campOwner?.kind==='focus'){
      const again=local.type==='upgrade'&&game.upgradeStatus(local.stat).allowed||local.type==='chronicle-preparation';
      showCampFocus(focus,again?command:'camp-back');
    }
    return true;
  }
  const destination=focus==='company'?(command==='camp-evolution'?'evolution':command==='camp-storybook'?'chronicle':null):focus==='journal'?(command==='camp-chapters'?'battles':command==='camp-journal'?'journey':null):null;
  if(destination){
    const returnTarget=campOwner.returnTarget;campOwner={kind:'advanced',returnTarget};
    if(destination==='evolution'){closeModal(false);if(playable()&&(modal as string|null)!=='session')switchTab('evolution');}
    else showModal(destination,destination==='chronicle'?chronicleScreenHtml(game.profile,game.state):destination==='battles'?battleSelectionHtml(game.profile,game.state):journeyScreenHtml(game.profile,game.state));
  }
  return true;
}
function showFieldPause(focusCommand?:string){
  if(!entryEntered||!guardAction()||game.state.phase!=='running')return;
  fieldControls.clear();showModal('field-pause','<h2 id="dialog-title">A moment by the fire</h2><button class="big-button green" data-command="field-resume">Resume</button><button class="big-button secondary" data-command="settings">Settings</button><button class="big-button secondary" data-command="home">Home</button>',focusCommand);
}
function showLeaveBattle(){
  if(entryEntered||modal||!guardAction()||entrySecondary(game.profile,game.state)!=='leave')return;
  showModal('leave-battle','<h2 id="dialog-title">Leave this battle?</h2><p>Leaving counts as a loss. Coins you already earned are kept. Your current troops and battle progress end before you return to Camp.</p><button class="big-button danger" data-command="confirm-leave-battle">Leave for Camp</button><button class="big-button secondary" data-command="close">Keep this battle</button>','close');
}
function leaveBattle(){
  if(entryEntered||modal!=='leave-battle'||!guardAction()||game.state.phase!=='running'||game.profile.pendingVictory)return;
  if(!action({type:'retreat'})||!playable()||modal!=='leave-battle')return;
  if(!action({type:'retry'})||!playable()||modal!=='leave-battle')return;
  closeModal(false);enterCamp();
}
function continueWithProvision(provision:string|undefined){
  const run=game.profile.chronicle?.expedition;
  if(!guardAction()||modal!=='result-expedition'||game.state.phase!=='won'||!run||run.stage>=2||(provision!=='supplies'&&provision!=='shelter'))return;
  if(!action({type:'chronicle-provision',provision})||!playable()||modal!=='result-expedition')return;
  if(action({type:'chronicle-continue'})&&playable()&&modal==='result-expedition'){
    closeModal(false);manualPaused=false;switchTab('battle');
  }
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
  if(modal==='session'||!guardAction())return;
  if(modal==='camp-focus'){returnToCamp();return;}
  if(campOwner?.kind==='advanced'&&['chronicle','journey','quests','battles'].includes(modal??'')){returnToCamp();return;}
  if(modal==='settings'){const origin=settingsOrigin;settingsOrigin=null;if(origin==='field-pause'){showFieldPause('settings');return;}closeModal();return;}
  if(modal==='save-recovery'||modal==='reset'){showSettings(modal==='reset'?'reset':'save-recovery');return;}
  if(modal==='import'){pendingImport=null;showSaveRecovery('import');return;}
  if((modal==='chronicle'||modal==='journey'||modal==='quests')&&(game.state.phase==='won'||game.state.phase==='lost')){showResult();return;}
  if(modal==='prestige'){returnFromPrestige();return;}
  if(modal==='result-expedition'){showResult();return;}
  if(modal==='result'){
    if(resultDetailsOpen){showResult('result-details');return;}
    if(advanceStatus(game.profile,game.state).reason==='complete')returnToChapters();
    return;
  }
  if(modal==='evolve'&&evolutionFromResult){evolutionFromResult=false;showResult();return;}
  evolutionFromResult=false;closeModal();
}
function preferenceNotice(){return session.status==='temporary'?temporarySessionNotice:savedWarning?'Saving is unavailable. Export a backup before closing.':`Progress saves in this browser. Export keeps a separate copy.${lastSavedAt?` Last saved ${new Date(lastSavedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}.`:''}`;}
function showSettings(focusCommand?:string){
  if(!['settings','save-recovery','reset','import'].includes(modal??''))settingsOrigin=modal==='field-pause'?'field-pause':null;
  showModal('settings',preferencesHtml(game.profile,atmosphereEnabled,audioMix,session.status==='active',preferenceNotice()),focusCommand);
}
function showSaveRecovery(focusCommand?:string){
  if(!guardAction()||!['settings','import','save-recovery'].includes(modal??''))return;
  showModal('save-recovery',saveRecoveryHtml(session.status==='active',preferenceNotice()),focusCommand);
}
function questSaveNotice(){return session.status==='temporary'?temporarySessionNotice:savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':'';}
function refreshQuestRecord(focus=false){
  if(modal!=='quests'||!guardAction()||modal!=='quests')return;
  const day=localDay(),records=questRecords(game.profile,day),selected=selectedQuestRecord(records,questSelection);
  const active=document.activeElement as HTMLElement|null,focusedClaim=active?.dataset.command==='quest-claim'&&$('modal-layer').contains(active);
  questSelection=selected.key;questCalendarDay=day;
  const select=$('quest-goal') as HTMLSelectElement;
  // The platform owns the open native picker. Keep its node, focus and option nodes.
  for(const option of Array.from(select.options)){
    const record=records.find(r=>r.key===option.value);if(record)textIfChanged(option,questRecordLabel(record));
  }
  select.value=selected.key;
  htmlIfChanged($('quest-record-detail'),questRecordDetailHtml(selected,modalVersion));
  const notice=$('quest-save-status'),message=questSaveNotice();notice.hidden=!message;textIfChanged(notice,message);
  if(focus||focusedClaim)select.focus();
}
function claimQuestRecord(button:HTMLButtonElement){
  if(modal!=='quests'||!$('modal-layer').contains(button)||!guardAction()||modal!=='quests')return;
  const day=localDay();
  if(button.dataset.questKey!==questSelection||Number(button.dataset.questVersion)!==modalVersion)return;
  if(!Number.isInteger(Number(button.dataset.questDay))||Number(button.dataset.questDay)!==day){refreshQuestRecord();return;}
  const selected=questRecords(game.profile,day).find(r=>r.key===questSelection);
  const claim=selected?questRecordAction(selected,day):null;
  if(!claim){refreshQuestRecord();return;}
  const accepted=action(claim);
  // The writer may synchronously give ownership to recovery. Never replace it.
  if(playable()&&modal==='quests')refreshQuestRecord(accepted);
}
function showQuests(){
  if(!guardAction())return;
  game.dispatch({type:'weekly-sync',week:weekId(localDay())});
  const records=questRecords(game.profile,localDay()),selected=selectedQuestRecord(records,modal==='quests'?questSelection:null);
  questSelection=selected.key;questCalendarDay=selected.day;
  showModal('quests',questRecordsHtml(records,selected,modalVersion+1,questSaveNotice()));
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
 if(root!.dataset.fieldMode==='field'){fieldControls.clear();return;}
 if(!start||!e.isPrimary||e.pointerId!==start.id||!entryEntered||modal||activeTab!=='battle'||game.state.phase!=='running'||game.state.paused||!playable())return;
 const rect=$('battlefield').getBoundingClientRect();
 const order=battlefieldOrderFromGesture({startX:start.x,startY:start.y,endX:e.clientX,endY:e.clientY},{left:rect.left,top:rect.top,width:rect.width,height:rect.height});
 if(order)action({type:'order',order});
});
lifetime.listen(window,'blur',()=>{battlefieldPointer=null;});
lifetime.listen<PointerEvent>(root,'pointerup',e=>blockModalTap.recordPointer(e,performance.now()));
/** Replaces the running game after a validated reset or import and returns the shell to a fresh battle view. */
function adoptRestoredGame(restored:Game){
  game=restored;entryWelcome=null;entryEntered=false;entrySaved=hasPriorPlay(game.profile);settingsOrigin=null;root!.dataset.fieldMode='field';lastPhase=game.state.phase;resultDue=0;manualPaused=false;resultShown='';savedWarning=false;clearPrestigeContext();rebuildArmy();syncMotion();closeModal(false);switchTab('battle');
}
/** Command handlers keyed by data-command (table instead of a switch chain). */
const commandHandlers:Record<string,(button:HTMLButtonElement)=>void>={
  'start':()=>{manualPaused=false;if(action({type:'start'})){root!.dataset.fieldMode='field';update(true);}},
  'upgrade-food':()=>{action({type:'upgrade',stat:'food'});},
  'upgrade-base':()=>{action({type:'upgrade',stat:'base'});},
  'battles':()=>{showModal('battles',battleSelectionHtml(game.profile,game.state));},
  'wave-help':()=>{if(game.state.phase==='running')showModal('wave-help',waveInspectionHtml(game.waveStatus(),game.state.chronicle?.enabled?game.state.chronicle.objective:undefined));},
  'evolve':()=>{const html=evolutionDialogHtml(game.profile,game.state);if(html){evolutionFromResult=modal==='result';showModal('evolve',html);};},
  'confirm-evolve':()=>{
    const returnToResult=evolutionFromResult,ok=action({type:'evolve'});
    if(!playable()||modal==='session')return;
    if(ok){
      evolutionFromResult=false;
      {const deck=$('unit-cards');deck.dataset.evolveReveal=deck.dataset.evolveReveal==='a'?'b':'a';}
      if(returnToResult)showResult();else{closeModal(false);switchTab('battle');}
      if(!savedWarning)toast(`Entering ${chapterPresentation(game.profile.age).title}.`);
    }else{
      const html=evolutionDialogHtml(game.profile,game.state);
      if(html)showModal('evolve',html);else dismissModal();
    }
  },
  'return-chapters':()=>{returnToChapters();},
  'regroup-chapters':()=>{
    const suggested=earlierChapter(game.profile);
    if(modal!=='result'||game.state.phase!=='lost'||suggested===null)return;
    if(!action({type:'retry'})||!playable()||(modal as string|null)==='session')return;
    evolutionFromResult=false;manualPaused=false;closeModal(false);switchTab('battle');
    showModal('battles',battleSelectionHtml(game.profile,game.state,true),`choose-battle-${suggested}`);
  },
  'next':()=>{
    const advancement=advanceStatus(game.profile,game.state);
    if(advancement.allowed&&advancement.target==='timeline'){openPrestige();return;}
    if(action({type:'next'})&&playable()&&modal!=='session'){evolutionFromResult=false;closeModal(false);manualPaused=false;switchTab('battle');}
  },
  'retry':()=>{if(action({type:'retry'})&&playable()&&modal!=='session'){evolutionFromResult=false;closeModal(false);manualPaused=false;switchTab('battle');};},
  'confirm-prestige':()=>{
    if(modal!=='prestige'||!prestigeOrigin||prestigeExpectedTimeline===null||!isLegacyChoice(prestigeDraft))return;
    const ok=action({type:'prestige',expectedTimeline:prestigeExpectedTimeline,legacy:prestigeDraft});
    // The guarded writer can synchronously replace the narrowed prestige modal.
    if(!playable()||(modal as string|null)==='session')return;
    if(ok){clearPrestigeContext();evolutionFromResult=false;manualPaused=false;closeModal(false);switchTab('battle');}
    else refreshPrestige();
  },
  'pause':()=>{if(game.state.phase==='running'){manualPaused=!manualPaused;syncPause();update(true);}},
  'speed':()=>{game.profile.speed=game.profile.speed===1?2:1;persist();update(true);if(modal==='settings'&&playable())showSettings();},
  'settings':()=>{persist();showSettings();},
  'quests':()=>{showQuests();},
  'save-recovery':()=>{showSaveRecovery();},
  'import':()=>{if(modal==='save-recovery'&&session.status==='active')$('import-save')?.click();},
  'reset':()=>{if(modal!=='settings'||session.status!=='active')return;showModal('reset',`<h2 id="dialog-title">Start over?</h2><p>This deletes your progress on this browser: your age, coins, upgrades, unlocked battles, every card and all gems, quests and records.</p><p>Your sound, speed, motion and troop-shape choices stay. Export a save first if you might want this progress back.</p><button class="big-button blue" data-command="export">EXPORT SAVE FIRST</button><button class="big-button danger" data-command="confirm-reset">DELETE PROGRESS AND START OVER</button><button class="big-button secondary" data-command="close">KEEP MY PROGRESS</button>`,'close');},
  'confirm-reset':()=>{
    if(modal!=='reset'||session.status!=='active')return;
    const restored=restoreBackupWithSave(game,startOverProfile(game.profile),profile=>{syncWeekly(profile,weekId(localDay()));return session.save(profile).ok;});
    if(!restored.ok){toast('The new game could not be saved. Your current progress was not deleted.');return;}
    adoptRestoredGame(restored.game);toast('Started a new game.');
  },
  'confirm-import':()=>{
    if(modal!=='import'||!pendingImport||session.status!=='active')return;const restored=restoreBackupWithSave(game,pendingImport,profile=>{syncWeekly(profile,weekId(localDay()));return session.save(profile).ok;});
    if(!restored.ok){toast('The save could not be written. Your current game was not replaced.');return;}
    adoptRestoredGame(restored.game);toast('Save restored.');
  },
  'close':()=>{dismissModal();},
};
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
  if(command==='session-continue'){retriedSession=true;void acquireSession();return;}
  if(command==='session-temporary'){
    if(pagePresent&&session.playTemporarily()){
      sessionReady=true;hasPlayed=true;clearPrestigeContext();game.dispatch({type:'weekly-sync',week:weekId(localDay())});closeModal(false);rebuildArmy();syncMotion();switchTab('battle');
    }return;
  }
  // Also protects direct preference mutations and synthetic clicks on isolated controls.
  if(!guardAction())return;
  if(modal&&!button.closest('#modal-layer'))return;
  if(!entryEntered&&!modal&&command!=='enter-world'&&command!=='reload-world'&&command!=='settings'&&command!=='home-camp'&&command!=='leave-battle')return;
  if(handleCampInput(button))return;
  unlockAudio(game.profile.sound);
  if(command==='reload-world'){if(!entryEntered&&!modal&&$('battlefield').dataset.renderer==='failed')window.location.reload();return;}
  if(command==='enter-world'){enterWorld();return;}
  if(command==='home'){showHome();return;}
  if(command==='home-camp'){enterCamp();return;}
  if(command==='leave-battle'){showLeaveBattle();return;}
  if(command==='confirm-leave-battle'){leaveBattle();return;}
  if(command==='field-pause'){showFieldPause();return;}
  if(command==='field-resume'){if(modal==='field-pause'){manualPaused=false;closeModal();}return;}
  if(command==='field-dismiss'){fieldControls.clear();return;}
  if(button.dataset.fieldContext){fieldControls.select(button.dataset.fieldContext,game);return;}
  if(button.closest('#field-targets'))fieldControls.clear();
  if(command==='result-details'){showResultDetails();return;}
  if(command==='result-back'){if(modal==='result'||modal==='result-expedition')showResult('result-details');return;}
  if(command==='result-expedition'){if(modal==='result'&&game.state.phase==='won'&&game.profile.chronicle?.expedition&&game.profile.chronicle.expedition.stage<2)showModal('result-expedition',expeditionChoiceHtml());return;}
  if(command==='continue-with-provision'){continueWithProvision(button.dataset.provision);return;}
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
  if(button.dataset.skill){if(action({type:'skill',skill:button.dataset.skill as Skill}))fieldControls.clear();return;}
  if(command==='quest-claim'){claimQuestRecord(button);return;}
  if(button.dataset.weekly){
    const week=Number(button.dataset.weekly);
    // A previously rendered claim cannot settle an expired or future local week. Rejection never syncs.
    if(!Number.isInteger(week)||week!==weekId(localDay()))return;
    if(action({type:'weekly',week}))showQuests();return;
  }
  if(button.dataset.daily){if(action({type:'daily',day:Number(button.dataset.daily)}))showQuests();return;}
  if(button.dataset.claim){const fromJourney=modal==='journey';if(action({type:'claim',id:button.dataset.claim})){if(fromJourney&&playable()&&modal!=='session')showModal('journey',journeyScreenHtml(game.profile,game.state));else showQuests();}return;}
  if(button.dataset.battle!==undefined){if(action({type:'select-battle',battle:Number(button.dataset.battle)}))closeModal();return;}
  if(button.dataset.pack!==undefined){
    const before=[...game.profile.cards],count=Number(button.dataset.pack) as 1|10|50;
    if(action({type:'summon',count})&&playable())showModal('summon',summonedCardsHtml(before,game.profile));
    else toast('This pack is unavailable. Your gems were not spent.');return;
  }
  const handler=button.dataset.command;
  if(handler&&Object.hasOwn(commandHandlers,handler))commandHandlers[handler](button);
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
  const input=e.target;
  if(input instanceof HTMLSelectElement&&input.dataset.questSelect!==undefined){
    if(modal!=='quests'||!$('modal-layer').contains(input)||input!==$('quest-goal')||!guardAction()||modal!=='quests')return;
    if(!questRecords(game.profile,localDay()).some(record=>record.key===input.value))return;
    questSelection=input.value;refreshQuestRecord();return;
  }
  if(input instanceof HTMLInputElement||input instanceof HTMLSelectElement){
    const preference=input.dataset.preference;
    if(preference){
      if(modal!=='settings'||!input.closest('#modal-layer')||!guardAction()||modal!=='settings')return;
      if(input instanceof HTMLInputElement&&input.type==='checkbox'){
        if(preference==='sound'){game.profile.sound=input.checked;if(input.checked)unlockAudio(true);else suspendAudio();}
        else if(preference==='atmosphere'){atmosphereEnabled=input.checked;saveAtmosphere(atmosphereEnabled);syncPause();return;}
        else if(preference==='marks'){if(input.checked)game.profile.marks=true;else delete game.profile.marks;syncMarks();}
        else return;
      }else if(input instanceof HTMLSelectElement){
        if(preference==='speed'&&(input.value==='1'||input.value==='2'))game.profile.speed=Number(input.value) as 1|2;
        else if(preference==='motion'&&(input.value==='system'||input.value==='reduced')){game.profile.motion=input.value;syncMotion();}
        else return;
      }else return;
      persist();syncPause();update(true);if(modal==='settings')textIfChanged($('preference-status'),preferenceNotice());return;
    }
  }
  if(!(input instanceof HTMLInputElement))return;
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
  if(input.id!=='import-save'||modal!=='save-recovery')return;
  const request=++importRequest;
  if(session.status!=='active'||!guardAction())return;
  const file=input.files?.[0],version=modalVersion;if(!file)return;
  if(file.size>MAX_SAVE_CHARS){toast('Choose a save file smaller than 100 KB.');input.value='';return;}
  try{
    const decoded=importBackup(await file.text());
    if(request!==importRequest||lifetime.disposed||version!==modalVersion||modal!=='save-recovery'||session.status!=='active'||!guardAction())return;
    if(!decoded.ok){toast(decoded.error);input.value='';return;}
    pendingImport=decoded.profile;
    showModal('import',`<h2 id="dialog-title">Replace this save?</h2><p>Import timeline ${pendingImport.timeline}, ${chapterPresentation(pendingImport.age).title}, with ${money(pendingImport.coins)} coins.</p><p>Your current progress in this browser will be replaced. Export it first to keep a separate copy.</p><button class="big-button blue" data-command="confirm-import">REPLACE WITH THIS SAVE</button><button class="big-button secondary" data-command="close">CANCEL</button>`,'close');
  }catch{
    if(request!==importRequest||lifetime.disposed||version!==modalVersion||modal!=='save-recovery'||session.status!=='active'||!guardAction())return;
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
  if(e.key==='Escape'&&entryEntered){if(campOwner?.kind==='advanced')returnToCamp();else fieldControls.clear();e.preventDefault();return;}
  if(!entryEntered||!guardAction()||campOwner||activeTab!=='battle'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||document.hidden||isEditingTarget(e.target instanceof HTMLElement?e.target:null))return;
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
  if(batch.some(event=>event.type==='win')&&guardAction()){const receipt=game.profile.pendingVictory,mask=receipt&&receipt.settlement==='mastery-v1'?receipt.newMask:0;game.dispatch({type:'weekly-sync',week:weekId(localDay()),earned:(mask&1)+((mask>>1)&1)+((mask>>2)&1)});}
  if(batch.some(event=>event.type==='win'||event.type==='lose'))persist();
}
const port=createBattlefieldPort(()=>game,action,dt=>{
  syncPause();if(!playable())return;
  // Establish the calendar baseline before this frame can award seals. Home and pause remain read-only.
  if(game.state.phase==='running'&&!game.state.paused&&(game.state.time===0||!game.profile.weekly||game.profile.weekly.week<weekId(localDay()))){
    if(!guardAction())return;
    game.dispatch({type:'weekly-sync',week:weekId(localDay())});
  }
  game.step(dt*game.profile.speed);
});
rebuildArmy();syncMotion();syncPause();update(true);
// Phaser (about 1.2 MB) loads after the shell is interactive, so weak phones see the game at once.
let renderer:{destroy():void}|null=null,rendererClosed=false;
$('battlefield').dataset.renderer='loading';
void import('./view/battlefield.ts').then(({mountBattlefield})=>{
  if(rendererClosed)return;
  renderer=mountBattlefield($('battlefield'),port,force=>update(force),events,{isVisible:()=>entryEntered&&root!.dataset.fieldMode==='field'&&activeTab==='battle'&&!document.hidden,villageMood:()=>villagePresentation!.mood,onPresentation:syncVillagePresentation});
  $('battlefield').dataset.renderer='ready';
}).catch(()=>{$('battlefield').dataset.renderer='failed';syncEntry();toast('The battlefield could not load. Check your connection and reload.');});
lifetime.add(()=>{rendererClosed=true;renderer?.destroy();});lifetime.add(disposeAudio);
lifetime.add(()=>{window.clearTimeout(toastTimer);window.cancelAnimationFrame(focusFrame);isolateModal(false);});
lifetime.add(()=>{acquisitionVersion++;sessionReady=false;session.dispose();});
if(import.meta.hot)import.meta.hot.dispose(()=>{suspendSession();lifetime.dispose();});
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{/* Offline play is optional. */});},{once:true});
sessionPresentation('starting');
void acquireSession();
