
import {campRootHtml,campFocusHtml} from '../ui/camp-screen.ts';
import { canOwnCamp, isCampStation, campActionFromData, type CampFocus } from '../ui/camp-owner.ts';
import { type StoryFollowUp } from '../ui/story-flow.ts';
import { journeyScreenHtml } from '../ui/journey-screen.ts';
import { chronicleScreenHtml, chronicleActionFromData } from '../ui/chronicle-screen.ts';
import { CAPTAINS } from '../game/chronicle.ts';
import { advanceStatus } from '../game/mastery.ts';
import { isLegacyChoice, legacyEffects, prestigePreview } from '../game/prestige.ts';
import { temporarySessionNotice } from '../ui/save-session-screen.ts';
import type { UnitKind } from '../game/types.ts';
import { chapterLandscape } from '../ui/chapter-presentation.ts';
import { entryCopy, hasPriorPlay, entrySecondary } from '../ui/entry-screen.ts';
import { preferencesHtml, saveRecoveryHtml } from '../ui/preferences-screen.ts';
import { evolutionScreenHtml } from '../ui/evolution-screen.ts';
import { icon } from '../view/icons.ts';
import { cardsScreenHtml } from '../ui/cards-screen.ts';
import { compactResultsHtml, resultsHtml } from '../ui/results-screen.ts';
import { startCountUp } from '../ui/count-up.ts';
import { legacyCurrentHtml, prestigeDetailsHtml, prestigeDialogHtml } from '../ui/prestige-presentation.ts';
import { compactNumber } from '../ui/battle-hud.ts';
import { battleSelectionHtml } from '../ui/progression-screen.ts';
import { modalFocusables } from '../ui/accessibility.ts';
import { textIfChanged, htmlIfChanged } from '../ui/dom-state.ts';
import { action, guardAction, persist, playable, syncPause, update } from './lifecycle.ts';
import { $, fieldControls, isolateModal, lifetime, root } from './runtime.ts';
import { app } from './state.ts';

export function entryReady(){return playable()&&$('battlefield').dataset.renderer==='ready'&&!$('battlefield').querySelector('.world-loader');}
export function syncEntry(){
  const mode=app.entryEntered?'play':'home';
  if(root!.dataset.entry!==mode)root!.dataset.entry=mode;
  if($('entry-screen').hidden!==app.entryEntered)$('entry-screen').hidden=app.entryEntered;
  if(app.entryEntered)return;
  const copy=entryCopy(app.game.profile,app.entrySaved||hasPriorPlay(app.game.profile)),failed=$('battlefield').dataset.renderer==='failed';
  textIfChanged($('entry-play'),failed?'Reload':entryReady()?copy.action:'Loading…');
  $('entry-play').dataset.command=failed?'reload-world':'enter-world';
  textIfChanged($('entry-chapter'),copy.chapter);
  textIfChanged($('entry-subtitle'),failed?'The battlefield could not load. Reload to try again; your saved progress is kept.':app.entryWelcome??copy.subtitle);
  const art=$('entry-art'),source=chapterLandscape(app.game.profile.enemyAge);
  if(art.dataset.source!==source){art.setAttribute('src',source);art.dataset.source=source;}
  const secondary=entrySecondary(app.game.profile,app.game.state),extra=$('entry-secondary');
  extra.hidden=failed||secondary===null;extra.dataset.command=secondary==='leave'?'leave-battle':'home-camp';
  textIfChanged(extra,secondary==='leave'?'Leave battle…':'Camp');extra.toggleAttribute('disabled',!entryReady());
  $('entry-play').toggleAttribute('disabled',!playable()||(!failed&&!entryReady()));$('entry-settings').toggleAttribute('disabled',!playable());
}
export function enterWorld(){
  if(app.entryEntered||app.modal||!guardAction()||!entryReady())return;
  root!.dataset.fieldMode='field';
  app.entryEntered=true;app.entrySaved=true;app.entryWelcome=null;syncEntry();
  app.manualPaused=false;
  if(app.game.state.phase==='ready')action({type:'start'});
  switchTab('battle');
  if(!app.modal)$('world').focus({preventScroll:true});
}
export function switchTab(tab:string){
  if(!playable()||!['battle','evolution','cards','skills'].includes(tab))return;
  app.activeTab=tab;
  if(app.entryEntered&&tab==='battle'&&canOwnCamp(app.game.profile,app.game.state))root!.dataset.fieldMode='camp';
  root!.querySelectorAll<HTMLElement>('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===tab);button.setAttribute('aria-current',button.dataset.tab===tab?'page':'false');});
  $('secondary-screen').hidden=tab==='battle';$('battle-view').inert=tab!=='battle';
  $('battle-view').setAttribute('aria-hidden',String(tab!=='battle'));
  syncPause();renderScreen();update(true);
  if(app.entryEntered&&tab==='battle'&&!app.modal&&(app.game.state.phase==='won'||app.game.state.phase==='lost')){app.resultShown=app.game.state.phase;showResult();}
  if(tab!=='battle')$('secondary-title')?.focus();
}
export function renderScreen(legacyOnly=false){
  const p=app.game.profile;let html='';
  if(app.activeTab==='evolution'){
    if(legacyOnly&&$('legacy-current')){
      htmlIfChanged($('legacy-current'),legacyCurrentHtml(p));
      $('secondary-screen').querySelectorAll<HTMLInputElement>('input[name="ready-legacy"]').forEach(input=>{input.checked=input.value===p.legacy.selected;});
      return;
    }
    html=evolutionScreenHtml(p,app.game.state);
  }else if(app.activeTab==='cards'){
    html=cardsScreenHtml(p);
  }else if(app.activeTab==='skills'){
    const captain=p.chronicle?.enabled&&p.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===p.chronicle!.captain):undefined;
    html=`<div class="screen-heading"><span class="eyebrow">TURN THE TIDE</span><h2 id="secondary-title" tabindex="-1">Battle skills</h2><p>The right move can change everything.</p></div><div class="skill-list">${[{id:'freeze',name:'Freeze',tag:'CONTROL',copy:`Freeze every enemy for ${legacyEffects(p.legacy).freezeSeconds} seconds. Give your army time to strike.`,color:'#73bbdb'},{id:'meteor',name:'Meteor',tag:'DAMAGE',copy:'Hit every enemy on the battlefield. Best saved for a big wave.',color:'#de805d'},{id:'food',name:captain?.skill??'Food Drop',tag:captain?'CAPTAIN':'SUPPORT',copy:captain?.description??'Gain up to 10 food instantly, limited by 99-food storage. Deploy reinforcements when you need them.',color:'#97bc6a'}].map(s=>`<article class="skill-detail"><div class="skill-art" style="background:${s.color}">${icon(s.id)}</div><div><small>${s.tag}</small><h3>${s.name}</h3><p>${s.copy}</p><span class="skill-rule">ONCE PER BATTLE</span></div></article>`).join('')}</div><div class="skill-note">${icon('battle')}<p>Select an enemy in battle for Freeze or Meteor. Inspect the supplies after deploying a troop for your support skill. Each skill refreshes when a new battle begins.</p></div><button class="big-button green" data-tab="battle">BACK TO BATTLE ${icon('arrow')}</button>`;
  }
  if(app.activeTab!=='battle')htmlIfChanged($('secondary-screen'),`${app.campOwner?.kind==='advanced'?'<button class="big-button secondary camp-advanced-return" data-command="camp-return">Back to Camp</button>':''}${html}`);
}
export function showModal(id:string,html:string,focusCommand?:string){
  if(id!=='session'&&!playable())return;
  // A canonical ready transition may open a retained task after mounting Camp.
  // Its modal, not the underlying root, owns all of those deliberate controls.
  if(app.campOwner?.kind==='root'&&canOwnCamp(app.game.profile,app.game.state)&&id!=='camp-focus'&&id!=='session')app.campOwner={kind:'advanced',returnTarget:'journal'};
  const replacing=app.modal!==null,sameModal=app.modal===id,active=document.activeElement as HTMLElement|null,command=active?.dataset.command;
  const storyAction=active?chronicleActionFromData(active.dataset):null,storyPage=active?.dataset.storyPage;
  const layer=$('modal-layer'),previousScroll=sameModal?layer.querySelector<HTMLElement>('.dialog')?.scrollTop:null;
  if(!replacing)app.focusBefore=document.activeElement as HTMLElement;
  app.modal=id;app.modalVersion++;const version=app.modalVersion;
  const dismissButton=`<button class="close-button" data-command="close" aria-label="Close">${icon('close')}</button>`;
  const dismissMarkup=['quests','camp-focus','field-pause','settings','save-recovery','reset','import','leave-battle','result','result-expedition','session'].includes(id)?'':id==='chronicle'?dismissButton:`<div class="dialog-dismiss">${dismissButton}</div>`;
  layer.hidden=false;layer.innerHTML=`<section class="dialog ${(id==='result'||id==='result-expedition')?'result-dialog':id==='session'?'session-dialog':id==='camp-focus'?'camp-dialog':id==='settings'?'preferences-dialog':id==='quests'?'quest-record-dialog':id==='prestige'?'prestige-dialog':id==='chronicle'?'chronicle-dialog':''}" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="dialog-title">${dismissMarkup}${html}</section>`;
  isolateModal(true);syncPause();window.cancelAnimationFrame(app.focusFrame);
  app.focusFrame=requestAnimationFrame(()=>{
    if(lifetime.disposed||layer.hidden||version!==app.modalVersion)return;
    const previous=sameModal&&command?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===command):null;
    const requested=focusCommand?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===focusCommand):null;
    const storyMatch=storyAction?Array.from(layer.querySelectorAll<HTMLElement>('[data-story-route],[data-story-captain],[data-story-tale],[data-story-preparation],[data-story-discovery],[data-story-provision]')).find(element=>JSON.stringify(chronicleActionFromData(element.dataset))===JSON.stringify(storyAction)):storyPage!==undefined?Array.from(layer.querySelectorAll<HTMLElement>('[data-story-page]')).find(element=>element.dataset.storyPage===storyPage):null;
    const storyPrevious=sameModal&&storyMatch&&!storyMatch.matches(':disabled,[aria-disabled="true"]')?storyMatch:null;
    const dialog=layer.querySelector<HTMLElement>('.dialog');if(previousScroll!==null&&previousScroll!==undefined&&dialog)dialog.scrollTop=previousScroll;
    (requested??previous??storyPrevious??(sameModal?null:layer.querySelector<HTMLElement>('[data-initial-focus]'))??modalFocusables(layer)[0]??dialog)?.focus();
  });
}
export function closeModal(refresh=true){
  if(!playable()||!app.session.check())return;
  // Loading a saved game also ends with a close; with no dialog open there is no focus to give back, and moving it to the
  // Battle tab button would make Space press that button instead of starting the battle.
  const restoreFocus=app.modal!==null;
  app.modal=null;app.modalVersion++;app.pendingImport=null;window.cancelAnimationFrame(app.focusFrame);
  $('modal-layer').hidden=true;$('modal-layer').innerHTML='';isolateModal(false);syncPause();
  if(restoreFocus){
    const target=app.focusBefore;
    if(app.focusBefore?.isConnected&&!app.focusBefore.closest('[hidden],[inert]')&&!app.focusBefore.matches(':disabled')&&app.focusBefore.getClientRects().length)app.focusBefore.focus();
    // A restored result often has BODY as its origin. A connected element can also
    // be non-focusable; verify that focus actually moved before accepting it.
    if(!target||document.activeElement!==target||target===document.body||target===document.documentElement)
      (app.entryEntered?root!.querySelector<HTMLElement>(app.campOwner?app.campOwner.kind==='advanced'&&app.activeTab!=='battle'?'[data-command="camp-return"]':'[data-command="camp-battle"]':root!.dataset.fieldMode==='field'?'[data-command="field-pause"]':`.bottom-nav [data-tab="${app.activeTab}"]`):$('entry-play'))?.focus({preventScroll:true});
  }
  if(refresh)update(true);
}
export function showResult(focusCommand?:string){
  if(!guardAction()||app.modal==='session')return;
  if(app.game.state.phase!=='won'&&app.game.state.phase!=='lost')return;
  persist();
  // A failed ownership check/save may synchronously replace this modal with recovery.
  const fresh=app.modal!=='result';
  if(playable()&&app.modal!=='session'){app.resultDetailsOpen=false;showModal('result',compactResultsHtml(app.game.profile,app.game.state),focusCommand);}
  if(fresh&&app.modal==='result')startCountUp($('modal-layer'),compactNumber,document.documentElement.dataset.motion==='reduced');
}
export function showResultDetails(){
  if(!guardAction()||app.modal!=='result')return;
  app.resultDetailsOpen=true;
  showModal('result',`<button class="big-button secondary result-back" data-command="result-back">Back to result</button>${resultsHtml(app.game.profile,app.game.state)}`,'result-back');
}
export function showHome(){
  const fromCamp=app.entryEntered&&root!.dataset.fieldMode==='camp'&&app.modal===null;
  if(!guardAction()||(!fromCamp&&app.modal!=='field-pause'&&(app.modal!=='result'||!['won','lost'].includes(app.game.state.phase))))return;
  const owner=app.modal;persist();if(!playable()||app.modal!==owner)return;
  fieldControls.clear();app.campOwner=null;$('camp-view').hidden=true;
  app.entryEntered=false;app.entrySaved=hasPriorPlay(app.game.profile);root!.dataset.fieldMode='field';app.resultDetailsOpen=false;syncEntry();closeModal(false);syncPause();
  $('entry-play').focus({preventScroll:true});
}
export function enterCamp(){
  if(app.entryEntered||app.modal||!guardAction()||!entryReady()||entrySecondary(app.game.profile,app.game.state)!=='camp')return;
  app.entryEntered=true;app.entrySaved=true;app.entryWelcome=null;root!.dataset.fieldMode='camp';app.manualPaused=false;
  fieldControls.clear();syncEntry();switchTab('battle');syncPause();root!.querySelector<HTMLElement>('[data-command="camp-battle"]')?.focus({preventScroll:true});
}
export function syncCamp(){
  const visible=app.entryEntered&&root!.dataset.fieldMode==='camp'&&playable()&&canOwnCamp(app.game.profile,app.game.state);
  if(!visible){app.campOwner=null;$('camp-view').hidden=true;if(!canOwnCamp(app.game.profile,app.game.state))root!.dataset.fieldMode='field';return;}
  app.campOwner??={kind:'root'};
  if(app.campOwner.kind==='advanced'&&!app.modal&&app.activeTab==='battle')app.campOwner={kind:'root'};
  const p=app.game.profile,key=JSON.stringify([p.age,p.enemyAge,p.foodLevel,p.baseLevel,p.unlocked,p.chronicle?.route]);
  if(key!==app.campRenderKey){app.campRenderKey=key;htmlIfChanged($('camp-view'),campRootHtml(p));}
  $('camp-view').hidden=app.activeTab!=='battle';$('camp-view').inert=app.modal!==null||app.activeTab!=='battle';
  $('battle-view').inert=true;
  root!.querySelectorAll<HTMLElement>('.resources,.bottom-nav').forEach(node=>{node.inert=true;});
  root!.dataset.campOwner=app.campOwner.kind;
  const notice=$('session-notice');notice.hidden=app.session.status!=='temporary'&&!app.savedWarning;
  const message=app.session.status==='temporary'?temporarySessionNotice:app.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':'';
  textIfChanged(notice,message);
  // A later autosave/background failure must also reach the isolated active focus.
  // Update this stable node only: no modal replacement, refocus or scroll change.
  if(app.modal==='camp-focus'&&app.campOwner.kind==='focus'){
    const focusNotice=$('camp-focus-save-status');
    if(focusNotice){focusNotice.hidden=!message;textIfChanged(focusNotice,message);}
  }
}
export function showCampFocus(focus:CampFocus,focusCommand?:string){
  if(!app.campOwner||!guardAction()||!canOwnCamp(app.game.profile,app.game.state)||app.modal==='session')return;
  const returnTarget=typeof focus==='object'?'company':focus;
  app.campOwner={kind:'focus',focus,returnTarget};
  showModal('camp-focus',campFocusHtml(app.game,focus,app.session.status==='temporary'?temporarySessionNotice:app.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':''),focusCommand);syncCamp();
}
export function returnToCamp(){
  if(!app.campOwner||!guardAction()||!canOwnCamp(app.game.profile,app.game.state)||app.modal==='session')return;
  if(app.campOwner.kind==='focus'&&typeof app.campOwner.focus==='object'){showCampFocus('company');return;}
  const target=app.campOwner.kind==='root'?'journal':app.campOwner.returnTarget;
  closeModal(false);if(!playable()||app.modal==='session')return;
  app.campOwner={kind:'root'};switchTab('battle');syncCamp();
  root!.querySelector<HTMLElement>(`[data-camp-station="${target}"]`)?.focus({preventScroll:true});
}
export function handleCampInput(button:HTMLButtonElement):boolean {
  const command=button.dataset.command;
  if(command==='camp-return'){returnToCamp();return true;}
  if(!app.campOwner)return command?.startsWith('camp-')??false;
  if(!guardAction()||!canOwnCamp(app.game.profile,app.game.state))return true;
  if(app.campOwner.kind==='advanced')return !app.modal&&!button.closest('#secondary-screen');
  if(app.campOwner.kind==='root'){
    if(isCampStation(button.dataset.campStation)){showCampFocus(button.dataset.campStation);return true;}
    if(command==='camp-home'){showHome();return true;}
    if(command==='camp-battle'&&entryReady()&&!app.modal){app.manualPaused=false;if(action({type:'start'})&&playable()&&app.modal!=='session'){app.campOwner=null;root!.dataset.fieldMode='field';switchTab('battle');$('world').focus({preventScroll:true});}return true;}
    return true;
  }
  if(app.modal!=='camp-focus')return true;
  const focus=app.campOwner.focus;
  if(command==='camp-back'){returnToCamp();return true;}
  if(focus==='company'&&/^[0-2]$/.test(button.dataset.campRecruit??'')){showCampFocus({recruit:Number(button.dataset.campRecruit) as UnitKind});return true;}
  const local=campActionFromData(focus,button.dataset);
  if(local){
    const accepted=action(local);
    if(accepted&&playable()&&app.modal==='camp-focus'&&app.campOwner?.kind==='focus'){
      const again=local.type==='upgrade'&&app.game.upgradeStatus(local.stat).allowed||local.type==='chronicle-preparation';
      showCampFocus(focus,again?command:'camp-back');
    }
    return true;
  }
  const destination=focus==='company'?(command==='camp-evolution'?'evolution':command==='camp-storybook'?'chronicle':null):focus==='journal'?(command==='camp-chapters'?'battles':command==='camp-journal'?'journey':null):null;
  if(destination){
    const returnTarget=app.campOwner.returnTarget;app.campOwner={kind:'advanced',returnTarget};
    if(destination==='evolution'){closeModal(false);if(playable()&&(app.modal as string|null)!=='session')switchTab('evolution');}
    else showModal(destination,destination==='chronicle'?chronicleScreenHtml(app.game.profile,app.game.state):destination==='battles'?battleSelectionHtml(app.game.profile,app.game.state):journeyScreenHtml(app.game.profile,app.game.state));
  }
  return true;
}
export function showFieldPause(focusCommand?:string){
  if(!app.entryEntered||!guardAction()||app.game.state.phase!=='running')return;
  fieldControls.clear();showModal('field-pause','<h2 id="dialog-title">A moment by the fire</h2><button class="big-button green" data-command="field-resume">Resume</button><button class="big-button secondary" data-command="settings">Settings</button><button class="big-button secondary" data-command="home">Home</button>',focusCommand);
}
export function showLeaveBattle(){
  if(app.entryEntered||app.modal||!guardAction()||entrySecondary(app.game.profile,app.game.state)!=='leave')return;
  showModal('leave-battle','<h2 id="dialog-title">Leave this battle?</h2><p>Leaving counts as a loss. Coins you already earned are kept. Your current troops and battle progress end before you return to Camp.</p><button class="big-button danger" data-command="confirm-leave-battle">Leave for Camp</button><button class="big-button secondary" data-command="close">Keep this battle</button>','close');
}
export function leaveBattle(){
  if(app.entryEntered||app.modal!=='leave-battle'||!guardAction()||app.game.state.phase!=='running'||app.game.profile.pendingVictory)return;
  if(!action({type:'retreat'})||!playable()||app.modal!=='leave-battle')return;
  if(!action({type:'retry'})||!playable()||app.modal!=='leave-battle')return;
  closeModal(false);enterCamp();
}
export function continueWithProvision(provision:string|undefined){
  const run=app.game.profile.chronicle?.expedition;
  if(!guardAction()||app.modal!=='result-expedition'||app.game.state.phase!=='won'||!run||run.stage>=2||(provision!=='supplies'&&provision!=='shelter'))return;
  if(!action({type:'chronicle-provision',provision})||!playable()||app.modal!=='result-expedition')return;
  if(action({type:'chronicle-continue'})&&playable()&&app.modal==='result-expedition'){
    closeModal(false);app.manualPaused=false;switchTab('battle');
  }
}
export function clearPrestigeContext(){app.prestigeOrigin=null;app.prestigeDraft=null;app.prestigeExpectedTimeline=null;}
export function openPrestige(){
  if(!guardAction()||(app.modal!=='result'&&app.modal!=='battles'))return;
  const preview=prestigePreview(app.game.profile,app.game.state,app.game.profile.legacy.selected);
  if(!preview)return;
  app.prestigeOrigin=app.modal;app.prestigeDraft=preview.choice;app.prestigeExpectedTimeline=preview.expectedTimeline;
  showModal('prestige',prestigeDialogHtml(app.game.profile,preview));
}
export function refreshPrestige(){
  if(!guardAction()||app.modal!=='prestige'||!app.prestigeOrigin||!isLegacyChoice(app.prestigeDraft))return;
  const preview=prestigePreview(app.game.profile,app.game.state,app.prestigeDraft);
  if(preview&&preview.expectedTimeline===app.prestigeExpectedTimeline){
    htmlIfChanged($('prestige-preview-values'),prestigeDetailsHtml(app.game.profile,preview));
  }else{
    showModal('prestige','<h2 id="dialog-title">This preview is no longer current</h2><p>Keep exploring, then open the next timeline preview again before you begin.</p><button class="big-button secondary" data-command="close">Keep exploring this timeline</button>');
  }
}
export function returnFromPrestige(){
  if(!guardAction()||app.modal!=='prestige')return;
  const origin=app.prestigeOrigin;clearPrestigeContext();
  if(origin==='result')showResult('next');
  else if(origin==='battles')showModal('battles',battleSelectionHtml(app.game.profile,app.game.state),'next');
  else closeModal();
}
export function returnToChapters(){
  if(advanceStatus(app.game.profile,app.game.state).reason!=='complete'||!action({type:'retry'}))return;
  if(!guardAction()||app.modal==='session')return;
  app.evolutionFromResult=false;app.manualPaused=false;closeModal(false);switchTab('battle');
  showModal('battles',battleSelectionHtml(app.game.profile,app.game.state));
}
export function dismissModal(){
  if(app.modal==='session'||!guardAction())return;
  if(app.modal==='camp-focus'){returnToCamp();return;}
  if(app.campOwner?.kind==='advanced'&&['chronicle','journey','quests','battles'].includes(app.modal??'')){returnToCamp();return;}
  if(app.modal==='settings'){const origin=app.settingsOrigin;app.settingsOrigin=null;if(origin==='field-pause'){showFieldPause('settings');return;}closeModal();return;}
  if(app.modal==='save-recovery'||app.modal==='reset'){showSettings(app.modal==='reset'?'reset':'save-recovery');return;}
  if(app.modal==='import'){app.pendingImport=null;showSaveRecovery('import');return;}
  if((app.modal==='chronicle'||app.modal==='journey'||app.modal==='quests')&&(app.game.state.phase==='won'||app.game.state.phase==='lost')){showResult();return;}
  if(app.modal==='prestige'){returnFromPrestige();return;}
  if(app.modal==='result-expedition'){showResult();return;}
  if(app.modal==='result'){
    if(app.resultDetailsOpen){showResult('result-details');return;}
    if(advanceStatus(app.game.profile,app.game.state).reason==='complete')returnToChapters();
    return;
  }
  if(app.modal==='evolve'&&app.evolutionFromResult){app.evolutionFromResult=false;showResult();return;}
  app.evolutionFromResult=false;closeModal();
}
export function preferenceNotice(){return app.session.status==='temporary'?temporarySessionNotice:app.savedWarning?'Saving is unavailable. Export a backup before closing.':`Progress saves in this browser. Export keeps a separate copy.${app.lastSavedAt?` Last saved ${new Date(app.lastSavedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}.`:''}`;}
export function showSettings(focusCommand?:string){
  if(!['settings','save-recovery','reset','import'].includes(app.modal??''))app.settingsOrigin=app.modal==='field-pause'?'field-pause':null;
  showModal('settings',preferencesHtml(app.game.profile,app.atmosphereEnabled,app.audioMix,app.session.status==='active',preferenceNotice()),focusCommand);
}
export function showSaveRecovery(focusCommand?:string){
  if(!guardAction()||!['settings','import','save-recovery'].includes(app.modal??''))return;
  showModal('save-recovery',saveRecoveryHtml(app.session.status==='active',preferenceNotice()),focusCommand);
}
export function showStoryFollowUp(kind:StoryFollowUp){
  const chronicle=()=>showModal('chronicle',chronicleScreenHtml(app.game.profile,app.game.state));
  const openDetails=(selector:string)=>$('modal-layer').querySelector<HTMLDetailsElement>(selector)?.setAttribute('open','');
  const toBattle=()=>{closeModal(false);app.manualPaused=false;switchTab('battle');};
  const screens:Record<StoryFollowUp,()=>void>={
    stay:()=>{},
    discoveries:()=>{showResult();openDetails('.story-discoveries');},
    chronicle,
    battle:toBattle,
    'battle-chronicle':()=>{toBattle();chronicle();},
    company:()=>{chronicle();openDetails('.story-company');},
  };
  screens[kind]();
}
