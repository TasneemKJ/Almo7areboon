import {storybookArt} from './view/storybook-art.ts';
import './style.css';
import './ui/continuation.css';
import './ui/material-language.css';
import './ui/combat-focus.css';
import './ui/era-glow.css';
import './ui/readability.css';
import { Game } from './game/simulation.ts';
import { ERAS, foodRate, unlockCost, QUESTS, dailyReward, localDay } from './game/data.ts';
import { loadProfileWithStatus, saveProfile, MAX_SAVE_CHARS } from './game/save.ts';
import { exportBackup, importBackup, restoreBackup } from './game/backup.ts';
import type { Action, GameEvent, GamePort, Profile, Skill, UnitKind } from './game/types.ts';
import { mountBattlefield } from './view/battlefield.ts';
import { unitPortrait } from './view/unit-illustrations.ts';
import { chapterPresentation, unitPresentationName } from './ui/chapter-presentation.ts';
import { evolutionScreenHtml } from './ui/evolution-screen.ts';
import { icon } from './view/icons.ts';
import { sound, unlockAudio, suspendAudio, disposeAudio, updateSoundscape } from './view/audio.ts';
import { createArmyUpdater } from './ui/army-screen.ts';
import { cardsScreenHtml, summonedCardsHtml } from './ui/cards-screen.ts';
import { resultsHtml } from './ui/results-screen.ts';
import { battleGuidance, baseHealthDisplay, compactNumber } from './ui/battle-hud.ts';
import { battleSelectionHtml, evolutionDialogHtml } from './ui/progression-screen.ts';
import { createModalIsolation, modalFocusables, nextFocusIndex, isEditingTarget } from './ui/accessibility.ts';
import { pauseReason } from './ui/pause.ts';
import { loadAtmosphere, saveAtmosphere, ambienceAllowed } from './ui/audio-preferences.ts';
import { createLifetime } from './ui/lifetime.ts';
import { textIfChanged, htmlIfChanged } from './ui/dom-state.ts';

const loaded=loadProfileWithStatus();
let game=new Game(loaded.profile);
const root=document.querySelector<HTMLDivElement>('#app');
if(!root)throw new Error('The game mount element is missing.');
const lifetime=createLifetime();
let activeTab='battle',modal:string|null=null,manualPaused=false;
let atmosphereEnabled=loadAtmosphere();
let lastUpdate=0,lastSave=0,resultShown='',lastPhase=game.state.phase,resultDue=0,toastTimer=0,focusFrame=0,modalVersion=0;
let savedWarning=false,pendingImport:Profile|null=null;
const persistenceBlocked=loaded.status==='unsupported';
const money=(value:number)=>value>=10000?compactNumber(value):Math.floor(value).toLocaleString('en-US');
const coin=(value:number)=>`${icon('coin')}<span>${money(value)}</span>`;
root.innerHTML = `
<main class="game-shell" aria-label="Almo7areboon">
  <div id="battle-view" class="battle-view">
    <section id="world" class="world" aria-label="Battlefield">
      <div id="battlefield"></div>
      <div class="stage"><div id="timeline" class="eyebrow"></div><h1 id="age-title"></h1><p id="scene-name" class="scene-name"></p><button id="battle-select" class="battle-select" data-command="battles" aria-label="Choose a battle"><span class="stage-progress" id="stage-progress"></span></button></div>
      <div class="world-tools"><button id="quests" class="square-button" data-command="quests" aria-label="Quests">${icon('quest')}<i class="notification"></i></button><button class="square-button" data-command="settings" aria-label="Settings">${icon('gear')}</button></div>
      <div class="battle-meta"><span id="wave-label"></span><div class="battle-toggles"><button id="speed" data-command="speed" aria-label="Change battle speed">1×</button><button id="pause" data-command="pause" aria-label="Pause battle">Ⅱ</button></div></div>
      <div id="ready" class="ready"><div class="ready-title">YOUR ARMY. YOUR ERA.</div><button class="big-button green" data-command="start">BATTLE ${icon('battle')}</button><p>Destroy the enemy base!</p></div>
      <p id="base-status" class="sr-only"></p><p id="game-status" class="sr-only" role="status" aria-live="polite"></p><div id="pause-banner" class="pause-banner" hidden>PAUSED</div>
      <div class="battle-skills" id="battle-skills"></div>
    </section>
    <section class="deployment" aria-label="Deploy your army">
      <div class="food-line"><div class="food-total">${icon('food')}<strong id="food-count">6</strong><div class="food-meter"><i id="food-fill"></i></div></div><span id="production"></span></div>
      <div class="unit-cards" id="unit-cards"></div>
      <div class="deploy-hint" id="deploy-hint">Tap a troop to send it into battle</div>
    </section>
    <section class="upgrades" aria-label="Army upgrades"><div class="upgrade-row"><div class="upgrade-label">${icon('food')}<div>Food Production<small id="food-level"></small></div></div><button id="food-upgrade" class="buy-button" data-command="upgrade-food"></button></div><div class="upgrade-row"><div class="upgrade-label">${icon('heart')}<div>Base Health<small id="base-level"></small></div></div><button id="base-upgrade" class="buy-button" data-command="upgrade-base"></button></div></section>
  </div>
  <header class="resources"><div class="currency">${icon('coin')}<span id="coins">0</span></div><button class="currency gems" data-command="quests" aria-label="Gems and quests">${icon('gem')}<span id="gems">100</span></button><div class="game-wordmark">ALMO7AREBOON</div></header>
  <section id="secondary-screen" class="secondary-screen" aria-labelledby="secondary-title" hidden></section>
  <nav class="bottom-nav" aria-label="Game screens">${[['battle','Battle'],['evolution','Evolution'],['cards','Cards'],['skills','Skills']].map(([id,label])=>`<button data-tab="${id}" class="nav-item ${id==='battle'?'active':''}" aria-label="${label}" aria-current="${id==='battle'?'page':'false'}">${icon(id)}<span>${label}</span></button>`).join('')}</nav>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="modal-layer" class="modal-layer" hidden></div>
</main>`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;

const updateArmy=createArmyUpdater({units:$('unit-cards'),skills:$('battle-skills'),stages:$('stage-progress')},unitPortrait,money);
const isolateModal=createModalIsolation($('modal-layer'));
const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
let focusBefore:HTMLElement|null=null;
function rebuildArmy(){updateArmy(game.profile);}
function toast(message:string){
  textIfChanged($('toast'),message);$('toast').classList.add('visible');
  window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').classList.remove('visible'),4200);
}
function persist():boolean{
  if(persistenceBlocked)return false;
  const ok=saveProfile(game.profile);lastSave=performance.now();
  if(!ok&&!savedWarning){savedWarning=true;toast('Progress could not be saved. Export a backup from Settings before closing this tab.');}
  if(ok)savedWarning=false;
  return ok;
}
function syncPause(){
  game.state.paused=pauseReason({phase:game.state.phase,manual:manualPaused,tab:activeTab,modal,hidden:document.hidden})!==null;
  updateSoundscape(game.profile.age,ambienceAllowed({sound:game.profile.sound,atmosphere:atmosphereEnabled,paused:game.state.paused,phase:game.state.phase,tab:activeTab,modal,hidden:document.hidden}));
}
function syncMotion(){document.documentElement.dataset.motion=game.profile.motion==='reduced'||motionQuery.matches?'reduced':'full';}
function action(a:Action):boolean{
  unlockAudio(game.profile.sound);const ok=game.dispatch(a);
  if(ok){persist();syncPause();rebuildArmy();update(true);if(activeTab!=='battle')renderScreen();}
  return ok;
}
function update(force=false){
  const now=performance.now();if(!force&&now-lastUpdate<80)return;lastUpdate=now;
 const p=game.profile,s=game.state;
 $('world').dataset.phase=s.phase;
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
  textIfChanged($('wave-label'),s.phase==='running'?(wave.nextIn===null?(wave.cleared?'WAVES CLEARED · ATTACK THE BASE':`${wave.enemiesRemaining} ENEMIES REMAIN`):`WAVE ${wave.spawned} / ${wave.total} · NEXT ${Math.ceil(wave.nextIn)}s`):s.phase==='ready'?'CHOOSE YOUR ARMY':'BATTLE COMPLETE');
  textIfChanged($('deploy-hint'),battleGuidance(p,s));
  const health=baseHealthDisplay(s.playerHp,s.playerMaxHp);
  $('world').classList.toggle('base-danger',s.phase==='running'&&health.danger);
  textIfChanged($('base-status'),`Your base: ${health.label}. Enemy base: ${baseHealthDisplay(s.enemyHp,s.enemyMaxHp).label}.`);
  textIfChanged($('game-status'),s.phase==='running'?(s.paused?'Battle paused.':health.danger?'Your base is in danger.':'Battle running.'):s.phase==='ready'?'Ready. Start a battle.':s.phase==='won'?'Victory.':'Defeat. Your coins are safe.');
  root!.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach(button=>{
    const kind=Number(button.dataset.unit) as UnitKind,locked=!p.unlocked[kind],status=game.deploymentStatus(kind);
    button.disabled=locked?p.coins<unlockCost(kind,p):!status.allowed;
    button.classList.toggle('affordable',!button.disabled);
    const hint=status.reason==='food'?`Ready in ${Math.ceil(status.waitSeconds)} seconds`:status.reason==='blocked'?'Deployment area full':status.reason==='capacity'?'Army limit reached':status.reason==='paused'?'Resume battle to deploy':status.reason==='ready'?'Start battle to deploy':'Tap to deploy';
    button.title=locked?`Unlock for ${unlockCost(kind,p).toLocaleString('en-US')} coins`:hint;
    (button.querySelector('.unit-fill') as HTMLElement).style.transform=`scaleX(${Math.max(0,Math.min(1,s.food/ERAS[p.age].units[kind].cost))})`;
  });
  root!.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(button=>{
    const skill=button.dataset.skill as Skill,used=s.skillsUsed.includes(skill);
    button.disabled=!game.canUseSkill(skill);button.classList.toggle('used',used);
    button.title=used?'Used this battle':skill==='meteor'?'Strike all active enemies':skill==='freeze'?'Freeze enemies for 7 seconds':'Gain up to 10 food';
  });
  const notification=$('quests').querySelector<HTMLElement>('.notification');
  if(notification)notification.hidden=!(dailyReward(p,localDay()).available||QUESTS.some(q=>p[q.stat]>=q.target&&!p.claimed.includes(q.id)));
  // Let the finishing blow and base collapse play before the result dialog covers them.
  if(s.phase!==lastPhase){if(lastPhase==='running'&&(s.phase==='won'||s.phase==='lost'))resultDue=now+(document.documentElement.dataset.motion==='reduced'?350:1300);lastPhase=s.phase;}
  if((s.phase==='won'||s.phase==='lost')&&resultShown!==s.phase&&now>=resultDue){resultShown=s.phase;showResult();}
  if(s.phase==='ready'||s.phase==='running')resultShown='';
  if(now-lastSave>5000)persist();
}
function switchTab(tab:string){
  if(!['battle','evolution','cards','skills'].includes(tab))return;
  activeTab=tab;
  root!.querySelectorAll<HTMLElement>('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===tab);button.setAttribute('aria-current',button.dataset.tab===tab?'page':'false');});
  $('secondary-screen').hidden=tab==='battle';$('battle-view').inert=tab!=='battle';
  $('battle-view').setAttribute('aria-hidden',String(tab!=='battle'));
  syncPause();renderScreen();update(true);
  if(tab!=='battle')$('secondary-title')?.focus();
}
function renderScreen(){
  const p=game.profile;let html='';
  if(activeTab==='evolution'){
    html=evolutionScreenHtml(p,game.state);
  }else if(activeTab==='cards'){
    html=cardsScreenHtml(p);
  }else if(activeTab==='skills'){
    html=`<div class="screen-heading"><span class="eyebrow">TURN THE TIDE</span><h2 id="secondary-title" tabindex="-1">Battle skills</h2><p>The right move can change everything.</p></div><div class="skill-list">${[{id:'freeze',name:'Freeze',tag:'CONTROL',copy:'Freeze every enemy for 7 seconds. Give your army time to strike.',color:'#73bbdb'},{id:'meteor',name:'Meteor',tag:'DAMAGE',copy:'Hit every enemy on the battlefield. Best saved for a big wave.',color:'#de805d'},{id:'food',name:'Food Drop',tag:'SUPPORT',copy:'Gain 10 food instantly. Deploy reinforcements when you need them.',color:'#97bc6a'}].map(s=>`<article class="skill-detail"><div class="skill-art" style="background:${s.color}">${icon(s.id)}</div><div><small>${s.tag}</small><h3>${s.name}</h3><p>${s.copy}</p><span class="skill-rule">ONCE PER BATTLE</span></div></article>`).join('')}</div><div class="skill-note">${icon('battle')}<p>Use the three skill buttons above your army during a battle. Each skill refreshes when a new battle begins.</p></div><button class="big-button green" data-tab="battle">BACK TO BATTLE ${icon('arrow')}</button>`;
  }
  if(activeTab!=='battle')htmlIfChanged($('secondary-screen'),html);
}
function showModal(id:string,html:string){
  const replacing=modal!==null,command=(document.activeElement as HTMLElement|null)?.dataset.command;
  if(!replacing)focusBefore=document.activeElement as HTMLElement;
  modal=id;modalVersion++;const version=modalVersion,layer=$('modal-layer');
  layer.hidden=false;layer.innerHTML=`<section class="dialog ${id==='result'?'result-dialog':''}" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="dialog-title">${id!=='result'?`<button class="close-button" data-command="close" aria-label="Close">${icon('close')}</button>`:''}${html}</section>`;
  isolateModal(true);syncPause();window.cancelAnimationFrame(focusFrame);
  focusFrame=requestAnimationFrame(()=>{
    if(lifetime.disposed||layer.hidden||version!==modalVersion)return;
    const previous=replacing&&command?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===command):null;
    (previous??modalFocusables(layer)[0]??layer.querySelector<HTMLElement>('.dialog'))?.focus();
  });
}
function closeModal(refresh=true){
  modal=null;modalVersion++;pendingImport=null;window.cancelAnimationFrame(focusFrame);
  $('modal-layer').hidden=true;$('modal-layer').innerHTML='';isolateModal(false);syncPause();
  if(focusBefore?.isConnected&&!focusBefore.hasAttribute('disabled'))focusBefore.focus();
  else root!.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`)?.focus();
  if(refresh)update(true);
}
function showResult(){persist();showModal('result',resultsHtml(game.profile,game.state));}
function showSettings(){
  showModal('settings',`<span class="eyebrow">ALMO7AREBOON</span><h2 id="dialog-title">Settings</h2>
  <button class="setting-row" data-command="sound" aria-pressed="${game.profile.sound}">${icon('sound')} Sound <b>${game.profile.sound?'ON':'OFF'}</b></button>
  <button class="setting-row" data-command="atmosphere" aria-pressed="${atmosphereEnabled}" aria-label="Atmospheric music and ambience">Atmosphere <b>${atmosphereEnabled?'ON':'OFF'}</b></button>
  <p class="save-note">Quiet original music and environmental sound. Pauses in menus and when the battle is paused. Sound is the master switch.</p>
  <button class="setting-row" data-command="speed">${icon('evolution')} Battle speed <b>${game.profile.speed}×</b></button>
  <button class="setting-row" data-command="motion" aria-pressed="${game.profile.motion==='reduced'}">Motion <b>${game.profile.motion==='reduced'?'REDUCED':'SYSTEM'}</b></button>
  <div class="backup-actions"><button class="big-button blue" data-command="export">EXPORT SAVE</button><button class="big-button secondary" data-command="import" ${persistenceBlocked?'disabled':''}>IMPORT SAVE</button><input id="import-save" type="file" accept=".json,application/json" hidden></div>
  <details class="help-box"><summary>How to play</summary><p>Tap Battle, collect food and deploy troops. Your army fights automatically.</p><p>Keep ranged troops behind a melee or heavy front line. Spend earned coins on food production and new troops.</p><p>Battle victories unlock opponents. Evolution upgrades your own army but resets coins, upgrades and battle unlocks.</p><small>1–3 troops · Q / W / E skills · Space pause · Escape closes menus.</small></details>
  <p class="save-note">${persistenceBlocked?'A newer save was found. It is protected from overwrite; this session is temporary.':savedWarning?'Saving is unavailable. Export a backup before closing.':'Progress saves on this browser. Export a backup to keep a separate copy.'}</p>`);
}
function dailyRow(p:Profile){
  const day=localDay(),reward=dailyReward(p,day);
  const label=reward.available?`Daily reward · day ${reward.streak}`:`Daily reward claimed · day ${p.dailyStreak}`;
  const hint=reward.available?'Come back every day to raise the reward.':'Return tomorrow to keep your streak going.';
  return `<div class="quest-row"><div><h3>${label}</h3><small>${hint}</small></div><button class="buy-button" data-daily="${day}" aria-label="${reward.available?`Claim ${reward.gems} gems`:'Claimed today'}" ${reward.available?'':'disabled'}>${reward.available?icon('gem')+reward.gems:'✓'}</button></div>`;
}
function showQuests(){
  const p=game.profile;
  showModal('quests',`<span class="eyebrow">EARN YOUR GLORY</span><h2 id="dialog-title">Quests</h2><p>Complete milestones to earn gems for cards.</p><div class="quest-list">${dailyRow(p)}${QUESTS.map(q=>{const count=p[q.stat],done=count>=q.target,claimed=p.claimed.includes(q.id);return `<div class="quest-row"><div><h3>${q.title}</h3><div class="quest-meter"><i style="width:${Math.min(100,count/q.target*100)}%"></i></div><small>${Math.min(count,q.target)} / ${q.target}</small></div><button class="buy-button" data-claim="${q.id}" aria-label="${claimed?'Claimed':`Claim ${q.reward} gems for ${q.title}`}" ${!done||claimed?'disabled':''}>${claimed?'✓':icon('gem')+q.reward}</button></div>`;}).join('')}</div>`);
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

lifetime.listen<MouseEvent>(root,'click',e=>{
  const button=e.target instanceof Element?e.target.closest<HTMLButtonElement>('button'):null;
  if(!button||button.disabled)return;unlockAudio(game.profile.sound);
  if(button.dataset.tab){switchTab(button.dataset.tab);return;}
  if(button.dataset.unit!==undefined){const kind=Number(button.dataset.unit) as UnitKind;if(!game.profile.unlocked[kind]){if(action({type:'unlock',kind}))toast(`${unitPresentationName(game.profile.age,kind)} unlocked!`);}else action({type:'spawn',kind});return;}
  if(button.dataset.skill){action({type:'skill',skill:button.dataset.skill as Skill});return;}
  if(button.dataset.daily){if(action({type:'daily',day:Number(button.dataset.daily)}))showQuests();return;}
  if(button.dataset.claim){if(action({type:'claim',id:button.dataset.claim}))showQuests();return;}
  if(button.dataset.battle!==undefined){if(action({type:'select-battle',battle:Number(button.dataset.battle)}))closeModal();return;}
  if(button.dataset.pack!==undefined){
    const before=[...game.profile.cards],count=Number(button.dataset.pack) as 1|10|50;
    if(action({type:'summon',count}))showModal('summon',summonedCardsHtml(before,game.profile));
    else toast('This pack is unavailable. Your gems were not spent.');return;
  }
  switch(button.dataset.command){
    case 'start':manualPaused=false;action({type:'start'});break;
    case 'upgrade-food':action({type:'upgrade',stat:'food'});break;
    case 'upgrade-base':action({type:'upgrade',stat:'base'});break;
    case 'battles':showModal('battles',battleSelectionHtml(game.profile,game.state));break;
    case 'evolve':{const html=evolutionDialogHtml(game.profile,game.state);if(html)showModal('evolve',html);break;}
    case 'confirm-evolve':if(action({type:'evolve'})){closeModal(false);switchTab('battle');toast(`Entering ${chapterPresentation(game.profile.age).title}.`);}break;
    case 'next':case 'retry':if(action({type:button.dataset.command})){closeModal(false);manualPaused=false;switchTab('battle');}break;
    case 'pause':if(game.state.phase==='running'){manualPaused=!manualPaused;syncPause();update(true);}break;
    case 'speed':game.profile.speed=game.profile.speed===1?2:1;persist();update(true);if(modal==='settings')showSettings();break;
    case 'settings':showSettings();break;
    case 'quests':showQuests();break;
    case 'sound':game.profile.sound=!game.profile.sound;if(game.profile.sound)unlockAudio(true);else suspendAudio();persist();showSettings();break;
    case 'atmosphere':atmosphereEnabled=!atmosphereEnabled;saveAtmosphere(atmosphereEnabled);syncPause();showSettings();break;
    case 'motion':game.profile.motion=game.profile.motion==='reduced'?'system':'reduced';syncMotion();persist();showSettings();break;
    case 'export':exportSave();break;
    case 'import':$('import-save')?.click();break;
    case 'confirm-import':{
      if(!pendingImport)break;const restored=restoreBackup(game,pendingImport);
      if(!restored.ok){toast('The save could not be written. Your current game was not replaced.');break;}
      game=restored.game;lastPhase=game.state.phase;resultDue=0;manualPaused=false;resultShown='';savedWarning=false;rebuildArmy();syncMotion();closeModal(false);switchTab('battle');toast('Save restored.');break;
    }
    case 'close':closeModal();break;
  }
});
lifetime.listen<Event>(root,'change',async e=>{
  const input=e.target;if(!(input instanceof HTMLInputElement)||input.id!=='import-save')return;
  const file=input.files?.[0],version=modalVersion;if(!file)return;
  if(file.size>MAX_SAVE_CHARS){toast('Choose a save file smaller than 100 KB.');input.value='';return;}
  try{
    const decoded=importBackup(await file.text());
    if(lifetime.disposed||version!==modalVersion||modal!=='settings')return;
    if(!decoded.ok){toast(decoded.error);input.value='';return;}
    pendingImport=decoded.profile;
    showModal('import',`<h2 id="dialog-title">Replace this save?</h2><p>Import timeline ${pendingImport.timeline}, ${chapterPresentation(pendingImport.age).title}, with ${money(pendingImport.coins)} coins.</p><p>Your current progress in this browser will be replaced. Export it first to keep a separate copy.</p><button class="big-button blue" data-command="confirm-import">REPLACE WITH THIS SAVE</button><button class="big-button secondary" data-command="close">CANCEL</button>`);
  }catch{toast('The selected file could not be read. Your current game was not changed.');}
});
lifetime.listen<KeyboardEvent>(document,'keydown',e=>{
  if(modal){
    if(e.key==='Escape'&&modal!=='result'){closeModal();e.preventDefault();}
    if(e.key==='Tab'){
      const elements=modalFocusables($('modal-layer')),index=nextFocusIndex(elements.indexOf(document.activeElement as HTMLElement),elements.length,e.shiftKey);
      e.preventDefault();(index===null?$('modal-layer').querySelector<HTMLElement>('.dialog'):elements[index])?.focus();
    }return;
  }
  if(activeTab!=='battle'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||document.hidden||isEditingTarget(e.target instanceof HTMLElement?e.target:null))return;
  if(['1','2','3'].includes(e.key)){e.preventDefault();action({type:'spawn',kind:(Number(e.key)-1) as UnitKind});}
  const skillIndex=['q','w','e'].indexOf(e.key.toLowerCase());
  if(skillIndex>=0){e.preventDefault();action({type:'skill',skill:(['freeze','meteor','food'] as Skill[])[skillIndex]});}
  if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){
    e.preventDefault();if(game.state.phase==='ready')action({type:'start'});else if(game.state.phase==='running'){manualPaused=!manualPaused;syncPause();update(true);}
  }
});
lifetime.listen(root,'visual-fallback',()=>toast('Some artwork could not load. The simplified battlefield is active.'));
lifetime.listen(document,'visibilitychange',()=>{syncPause();if(document.hidden){persist();suspendAudio();}});
lifetime.listen(window,'pagehide',()=>{persist();suspendAudio();});
lifetime.listen(motionQuery,'change',syncMotion);
function events(batch:GameEvent[]){
  const played=new Set<string>();for(const event of batch)if(!played.has(event.type)){sound(event.type,game.profile.sound&&!document.hidden);played.add(event.type);}
  if(batch.some(event=>event.type==='win'||event.type==='lose'))persist();
}
const port:GamePort={get profile(){return game.profile;},get state(){return game.state;},dispatch:a=>game.dispatch(a),step:dt=>{syncPause();game.step(dt*game.profile.speed);},drainEvents:()=>game.drainEvents()};
rebuildArmy();syncMotion();syncPause();update(true);
const renderer=mountBattlefield($('battlefield'),port,()=>update(),events,{isVisible:()=>activeTab==='battle'&&!document.hidden});
lifetime.add(()=>renderer.destroy());lifetime.add(disposeAudio);
lifetime.add(()=>{window.clearTimeout(toastTimer);window.cancelAnimationFrame(focusFrame);isolateModal(false);});
if(import.meta.hot)import.meta.hot.dispose(()=>{persist();lifetime.dispose();});
if(loaded.status==='recovered')toast('Recovered your progress from the backup save.');
else if(persistenceBlocked)toast('A newer save is protected. This session will not overwrite it.');
else if(loaded.status==='corrupt')toast('The stored save could not be recovered. A new game has started.');
else if(loaded.status==='unavailable')toast('Browser storage is unavailable. Use Settings to export your progress.');
