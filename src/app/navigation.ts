

import type { Profile, LegacyChoice } from '../game/types.ts';



import { type CampOwner } from '../ui/camp-owner.ts';
import {campRootHtml,campFocusHtml,campGoalText} from '../ui/camp-screen.ts';
import { localDay } from '../game/data.ts';
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
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** State owned by the navigation module. Siblings see only the slice it exposes through its ports. */
export interface NavState {
  activeTab: string;
  modal: string|null;
  modalVersion: number;
  focusBefore: HTMLElement|null;
  focusFrame: number;
  entryEntered: boolean;
  entrySaved: boolean;
  entryWelcome: string|null;
  resultDetailsOpen: boolean;
  settingsOrigin: 'field-pause'|null;
  campOwner: CampOwner|null;
  campRenderKey: string;
  evolutionFromResult: boolean;
  prestigeOrigin: 'result'|'battles'|null;
  prestigeDraft: LegacyChoice|null;
  prestigeExpectedTimeline: number|null;
  pendingImport: Profile|null;
}

/** What the navigation module needs: its slice of state, DOM handles and sibling operations. */
export interface NavigationDeps {
  dom: Pick<Runtime, '$' | 'fieldControls' | 'isolateModal' | 'lifetime' | 'root' | 'activeElement' | 'body' | 'cancelFrame' | 'requestFrame' | 'rootElement'>;
  ports: Pick<ShellApi, 'action' | 'guardAction' | 'persist' | 'playable' | 'sessionState' | 'syncPause' | 'update'>;
}

export function createNavigation(deps: NavigationDeps) {
  const { ports, dom } = deps;
  const { $, fieldControls, isolateModal, lifetime, root } = deps.dom;
  const navState: NavState = {
    activeTab: 'battle',
    modal: null,
    modalVersion: 0,
    focusBefore: null,
    focusFrame: 0,
    entryEntered: false,
    entrySaved: false,
    entryWelcome: null,
    resultDetailsOpen: false,
    settingsOrigin: null,
    campOwner: null,
    campRenderKey: '',
    evolutionFromResult: false,
    prestigeOrigin: null,
    prestigeDraft: null,
    prestigeExpectedTimeline: null,
    pendingImport: null,
  };
  function entryReady(){return ports.playable()&&$('battlefield').dataset.renderer==='ready'&&!$('battlefield').querySelector('.world-loader');}
  function syncEntry(){
    const mode=navState.entryEntered?'play':'home';
    if(root!.dataset.entry!==mode)root!.dataset.entry=mode;
    if($('entry-screen').hidden!==navState.entryEntered)$('entry-screen').hidden=navState.entryEntered;
    if(navState.entryEntered)return;
    const copy=entryCopy(ports.sessionState.game.profile,navState.entrySaved||hasPriorPlay(ports.sessionState.game.profile)),failed=$('battlefield').dataset.renderer==='failed';
    textIfChanged($('entry-play'),failed?'Reload':entryReady()?copy.action:'Loading…');
    $('entry-play').dataset.command=failed?'reload-world':'enter-world';
    textIfChanged($('entry-chapter'),copy.chapter);
    textIfChanged($('entry-subtitle'),failed?'The battlefield could not load. Reload to try again; your saved progress is kept.':navState.entryWelcome??copy.subtitle);
    const art=$('entry-art'),source=chapterLandscape(ports.sessionState.game.profile.enemyAge);
    if(art.dataset.source!==source){art.setAttribute('src',source);art.dataset.source=source;}
    const secondary=entrySecondary(ports.sessionState.game.profile,ports.sessionState.game.state),extra=$('entry-secondary');
    extra.hidden=failed||secondary===null;extra.dataset.command=secondary==='leave'?'leave-battle':'home-camp';
    textIfChanged(extra,secondary==='leave'?'Leave battle…':'Camp');extra.toggleAttribute('disabled',!entryReady());
    $('entry-play').toggleAttribute('disabled',!ports.playable()||(!failed&&!entryReady()));$('entry-settings').toggleAttribute('disabled',!ports.playable());
  }
  function enterWorld(){
    if(navState.entryEntered||navState.modal||!ports.guardAction()||!entryReady())return;
    root!.dataset.fieldMode='field';
    navState.entryEntered=true;navState.entrySaved=true;navState.entryWelcome=null;syncEntry();
    ports.sessionState.manualPaused=false;
    if(ports.sessionState.game.state.phase==='ready')ports.action({type:'start'});
    switchTab('battle');
    if(!navState.modal)$('world').focus({preventScroll:true});
  }
  function switchTab(tab:string){
    if(!ports.playable()||!['battle','evolution','cards','skills'].includes(tab))return;
    navState.activeTab=tab;
    if(navState.entryEntered&&tab==='battle'&&canOwnCamp(ports.sessionState.game.profile,ports.sessionState.game.state))root!.dataset.fieldMode='camp';
    root!.querySelectorAll<HTMLElement>('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===tab);button.setAttribute('aria-current',button.dataset.tab===tab?'page':'false');});
    $('secondary-screen').hidden=tab==='battle';$('battle-view').inert=tab!=='battle';
    $('battle-view').setAttribute('aria-hidden',String(tab!=='battle'));
    ports.syncPause();renderScreen();ports.update(true);
    if(navState.entryEntered&&tab==='battle'&&!navState.modal&&(ports.sessionState.game.state.phase==='won'||ports.sessionState.game.state.phase==='lost')){ports.sessionState.resultShown=ports.sessionState.game.state.phase;showResult();}
    if(tab!=='battle')$('secondary-title')?.focus();
  }
  function renderScreen(legacyOnly=false){
    const p=ports.sessionState.game.profile;let html='';
    if(navState.activeTab==='evolution'){
      if(legacyOnly&&$('legacy-current')){
        htmlIfChanged($('legacy-current'),legacyCurrentHtml(p));
        $('secondary-screen').querySelectorAll<HTMLInputElement>('input[name="ready-legacy"]').forEach(input=>{input.checked=input.value===p.legacy.selected;});
        return;
      }
      html=evolutionScreenHtml(p,ports.sessionState.game.state);
    }else if(navState.activeTab==='cards'){
      html=cardsScreenHtml(p);
    }else if(navState.activeTab==='skills'){
      const captain=p.chronicle?.enabled&&p.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===p.chronicle!.captain):undefined;
      html=`<div class="screen-heading"><span class="eyebrow">TURN THE TIDE</span><h2 id="secondary-title" tabindex="-1">Battle skills</h2><p>The right move can change everything.</p></div><div class="skill-list">${[{id:'freeze',name:'Freeze',tag:'CONTROL',copy:`Freeze every enemy for ${legacyEffects(p.legacy).freezeSeconds} seconds. Give your army time to strike.`,color:'#73bbdb'},{id:'meteor',name:'Meteor',tag:'DAMAGE',copy:'Hit every enemy on the battlefield. Best saved for a big wave.',color:'#de805d'},{id:'food',name:captain?.skill??'Food Drop',tag:captain?'CAPTAIN':'SUPPORT',copy:captain?.description??'Gain up to 10 food instantly, limited by 99-food storage. Deploy reinforcements when you need them.',color:'#97bc6a'}].map(s=>`<article class="skill-detail"><div class="skill-art" style="background:${s.color}">${icon(s.id)}</div><div><small>${s.tag}</small><h3>${s.name}</h3><p>${s.copy}</p><span class="skill-rule">ONCE PER BATTLE</span></div></article>`).join('')}</div><div class="skill-note">${icon('battle')}<p>Select an enemy in battle for Freeze or Meteor. Inspect the supplies after deploying a troop for your support skill. Each skill refreshes when a new battle begins.</p></div><button class="big-button green" data-tab="battle">BACK TO BATTLE ${icon('arrow')}</button>`;
    }
    if(navState.activeTab!=='battle')htmlIfChanged($('secondary-screen'),`${navState.campOwner?.kind==='advanced'?'<button class="big-button secondary camp-advanced-return" data-command="camp-return">Back to Camp</button>':''}${html}`);
  }
  function showModal(id:string,html:string,focusCommand?:string){
    if(id!=='session'&&!ports.playable())return;
    // A canonical ready transition may open a retained task after mounting Camp.
    // Its modal, not the underlying root, owns all of those deliberate controls.
    if(navState.campOwner?.kind==='root'&&canOwnCamp(ports.sessionState.game.profile,ports.sessionState.game.state)&&id!=='camp-focus'&&id!=='session')navState.campOwner={kind:'advanced',returnTarget:'journal'};
    const replacing=navState.modal!==null,sameModal=navState.modal===id,active=dom.activeElement() as HTMLElement|null,command=active?.dataset.command;
    const storyAction=active?chronicleActionFromData(active.dataset):null,storyPage=active?.dataset.storyPage;
    const layer=$('modal-layer'),previousScroll=sameModal?layer.querySelector<HTMLElement>('.dialog')?.scrollTop:null;
    if(!replacing)navState.focusBefore=dom.activeElement() as HTMLElement;
    navState.modal=id;navState.modalVersion++;const version=navState.modalVersion;
    const dismissButton=`<button class="close-button" data-command="close" aria-label="Close">${icon('close')}</button>`;
    const dismissMarkup=['quests','camp-focus','field-pause','settings','save-recovery','reset','import','leave-battle','result','result-expedition','session'].includes(id)?'':id==='chronicle'?dismissButton:`<div class="dialog-dismiss">${dismissButton}</div>`;
    layer.hidden=false;layer.innerHTML=`<section class="dialog ${(id==='result'||id==='result-expedition')?'result-dialog':id==='session'?'session-dialog':id==='camp-focus'?'camp-dialog':id==='settings'?'preferences-dialog':id==='quests'?'quest-record-dialog':id==='prestige'?'prestige-dialog':id==='chronicle'?'chronicle-dialog':''}" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="dialog-title">${dismissMarkup}${html}</section>`;
    isolateModal(true);ports.syncPause();dom.cancelFrame(navState.focusFrame);
    navState.focusFrame=dom.requestFrame(()=>{
      if(lifetime.disposed||layer.hidden||version!==navState.modalVersion)return;
      const previous=sameModal&&command?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===command):null;
      const requested=focusCommand?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===focusCommand):null;
      const storyMatch=storyAction?Array.from(layer.querySelectorAll<HTMLElement>('[data-story-route],[data-story-captain],[data-story-tale],[data-story-preparation],[data-story-discovery],[data-story-provision]')).find(element=>JSON.stringify(chronicleActionFromData(element.dataset))===JSON.stringify(storyAction)):storyPage!==undefined?Array.from(layer.querySelectorAll<HTMLElement>('[data-story-page]')).find(element=>element.dataset.storyPage===storyPage):null;
      const storyPrevious=sameModal&&storyMatch&&!storyMatch.matches(':disabled,[aria-disabled="true"]')?storyMatch:null;
      const dialog=layer.querySelector<HTMLElement>('.dialog');if(previousScroll!==null&&previousScroll!==undefined&&dialog)dialog.scrollTop=previousScroll;
      (requested??previous??storyPrevious??(sameModal?null:layer.querySelector<HTMLElement>('[data-initial-focus]'))??modalFocusables(layer)[0]??dialog)?.focus();
    });
  }
  function closeModal(refresh=true){
    if(!ports.playable()||!ports.sessionState.session.check())return;
    // Loading a saved game also ends with a close; with no dialog open there is no focus to give back, and moving it to the
    // Battle tab button would make Space press that button instead of starting the battle.
    const restoreFocus=navState.modal!==null;
    navState.modal=null;navState.modalVersion++;navState.pendingImport=null;dom.cancelFrame(navState.focusFrame);
    $('modal-layer').hidden=true;$('modal-layer').innerHTML='';isolateModal(false);ports.syncPause();
    if(restoreFocus){
      const target=navState.focusBefore;
      if(navState.focusBefore?.isConnected&&!navState.focusBefore.closest('[hidden],[inert]')&&!navState.focusBefore.matches(':disabled')&&navState.focusBefore.getClientRects().length)navState.focusBefore.focus();
      // A restored result often has BODY as its origin. A connected element can also
      // be non-focusable; verify that focus actually moved before accepting it.
      if(!target||dom.activeElement()!==target||target===dom.body()||target===dom.rootElement())
        (navState.entryEntered?root!.querySelector<HTMLElement>(navState.campOwner?navState.campOwner.kind==='advanced'&&navState.activeTab!=='battle'?'[data-command="camp-return"]':'[data-command="camp-battle"]':root!.dataset.fieldMode==='field'?'[data-command="field-pause"]':`.bottom-nav [data-tab="${navState.activeTab}"]`):$('entry-play'))?.focus({preventScroll:true});
    }
    if(refresh)ports.update(true);
  }
  function showResult(focusCommand?:string){
    if(!ports.guardAction()||navState.modal==='session')return;
    if(ports.sessionState.game.state.phase!=='won'&&ports.sessionState.game.state.phase!=='lost')return;
    ports.persist();
    // A failed ownership check/save may synchronously replace this modal with recovery.
    const fresh=navState.modal!=='result';
    if(ports.playable()&&navState.modal!=='session'){navState.resultDetailsOpen=false;showModal('result',compactResultsHtml(ports.sessionState.game.profile,ports.sessionState.game.state),focusCommand);}
    if(fresh&&navState.modal==='result')startCountUp($('modal-layer'),compactNumber,dom.rootElement().dataset.motion==='reduced');
  }
  /** The full receipt; a return from its own next-timeline preview lands back here on Next. */
  function showResultDetails(focusCommand='result-back'){
    if(!ports.guardAction()||(navState.modal!=='result'&&!(navState.modal==='prestige'&&navState.resultDetailsOpen)))return;
    navState.resultDetailsOpen=true;
    showModal('result',`<button class="big-button secondary result-back" data-command="result-back">Back to result</button>${resultsHtml(ports.sessionState.game.profile,ports.sessionState.game.state)}`,focusCommand);
  }
  function showHome(){
    const fromCamp=navState.entryEntered&&root!.dataset.fieldMode==='camp'&&navState.modal===null;
    if(!ports.guardAction()||(!fromCamp&&navState.modal!=='field-pause'&&(navState.modal!=='result'||!['won','lost'].includes(ports.sessionState.game.state.phase))))return;
    const owner=navState.modal;ports.persist();if(!ports.playable()||navState.modal!==owner)return;
    fieldControls.clear();navState.campOwner=null;$('camp-view').hidden=true;
    navState.entryEntered=false;navState.entrySaved=hasPriorPlay(ports.sessionState.game.profile);root!.dataset.fieldMode='field';navState.resultDetailsOpen=false;syncEntry();closeModal(false);ports.syncPause();
    $('entry-play').focus({preventScroll:true});
  }
  function enterCamp(){
    if(navState.entryEntered||navState.modal||!ports.guardAction()||!entryReady()||entrySecondary(ports.sessionState.game.profile,ports.sessionState.game.state)!=='camp')return;
    navState.entryEntered=true;navState.entrySaved=true;navState.entryWelcome=null;root!.dataset.fieldMode='camp';ports.sessionState.manualPaused=false;
    fieldControls.clear();syncEntry();switchTab('battle');ports.syncPause();root!.querySelector<HTMLElement>('[data-command="camp-battle"]')?.focus({preventScroll:true});
  }
  function syncCamp(){
    const visible=navState.entryEntered&&root!.dataset.fieldMode==='camp'&&ports.playable()&&canOwnCamp(ports.sessionState.game.profile,ports.sessionState.game.state);
    if(!visible){navState.campOwner=null;$('camp-view').hidden=true;if(!canOwnCamp(ports.sessionState.game.profile,ports.sessionState.game.state))root!.dataset.fieldMode='field';return;}
    navState.campOwner??={kind:'root'};
    if(navState.campOwner.kind==='advanced'&&!navState.modal&&navState.activeTab==='battle')navState.campOwner={kind:'root'};
    const p=ports.sessionState.game.profile,day=localDay(),key=JSON.stringify([p.age,p.enemyAge,p.foodLevel,p.baseLevel,p.unlocked,p.chronicle?.route,campGoalText(p,day)]);
    if(key!==navState.campRenderKey){navState.campRenderKey=key;htmlIfChanged($('camp-view'),campRootHtml(p,day));}
    $('camp-view').hidden=navState.activeTab!=='battle';$('camp-view').inert=navState.modal!==null||navState.activeTab!=='battle';
    $('battle-view').inert=true;
    root!.querySelectorAll<HTMLElement>('.resources,.bottom-nav').forEach(node=>{node.inert=true;});
    root!.dataset.campOwner=navState.campOwner.kind;
    const notice=$('session-notice');notice.hidden=ports.sessionState.session.status!=='temporary'&&!ports.sessionState.savedWarning;
    const message=ports.sessionState.session.status==='temporary'?temporarySessionNotice:ports.sessionState.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':'';
    textIfChanged(notice,message);
    // A later autosave/background failure must also reach the isolated active focus.
    // Update this stable node only: no modal replacement, refocus or scroll change.
    if(navState.modal==='camp-focus'&&navState.campOwner.kind==='focus'){
      const focusNotice=$('camp-focus-save-status');
      if(focusNotice){focusNotice.hidden=!message;textIfChanged(focusNotice,message);}
    }
  }
  function showCampFocus(focus:CampFocus,focusCommand?:string){
    if(!navState.campOwner||!ports.guardAction()||!canOwnCamp(ports.sessionState.game.profile,ports.sessionState.game.state)||navState.modal==='session')return;
    const returnTarget=typeof focus==='object'?'company':focus;
    navState.campOwner={kind:'focus',focus,returnTarget};
    showModal('camp-focus',campFocusHtml(ports.sessionState.game,focus,ports.sessionState.session.status==='temporary'?temporarySessionNotice:ports.sessionState.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':''),focusCommand);syncCamp();
  }
  function returnToCamp(){
    if(!navState.campOwner||!ports.guardAction()||!canOwnCamp(ports.sessionState.game.profile,ports.sessionState.game.state)||navState.modal==='session')return;
    if(navState.campOwner.kind==='focus'&&typeof navState.campOwner.focus==='object'){showCampFocus('company');return;}
    const target=navState.campOwner.kind==='root'?'journal':navState.campOwner.returnTarget;
    closeModal(false);if(!ports.playable()||navState.modal==='session')return;
    navState.campOwner={kind:'root'};switchTab('battle');syncCamp();
    root!.querySelector<HTMLElement>(`[data-camp-station="${target}"]`)?.focus({preventScroll:true});
  }
  function handleCampInput(button:HTMLButtonElement):boolean {
    const command=button.dataset.command;
    if(command==='camp-return'){returnToCamp();return true;}
    if(!navState.campOwner)return command?.startsWith('camp-')??false;
    if(!ports.guardAction()||!canOwnCamp(ports.sessionState.game.profile,ports.sessionState.game.state))return true;
    if(navState.campOwner.kind==='advanced')return !navState.modal&&!button.closest('#secondary-screen');
    if(navState.campOwner.kind==='root'){
      if(isCampStation(button.dataset.campStation)){showCampFocus(button.dataset.campStation);return true;}
      if(command==='camp-home'){showHome();return true;}
      if(command==='camp-battle'&&entryReady()&&!navState.modal){ports.sessionState.manualPaused=false;if(ports.action({type:'start'})&&ports.playable()&&navState.modal!=='session'){navState.campOwner=null;root!.dataset.fieldMode='field';switchTab('battle');$('world').focus({preventScroll:true});}return true;}
      return true;
    }
    if(navState.modal!=='camp-focus')return true;
    const focus=navState.campOwner.focus;
    if(command==='camp-back'){returnToCamp();return true;}
    if(focus==='company'&&/^[0-2]$/.test(button.dataset.campRecruit??'')){showCampFocus({recruit:Number(button.dataset.campRecruit) as UnitKind});return true;}
    const local=campActionFromData(focus,button.dataset);
    if(local){
      const accepted=ports.action(local);
      if(accepted&&ports.playable()&&navState.modal==='camp-focus'&&navState.campOwner?.kind==='focus'){
        const again=local.type==='upgrade'&&ports.sessionState.game.upgradeStatus(local.stat).allowed||local.type==='chronicle-preparation';
        showCampFocus(focus,again?command:'camp-back');
      }
      return true;
    }
    const destination=focus==='company'?(command==='camp-evolution'?'evolution':command==='camp-storybook'?'chronicle':null):focus==='journal'?(command==='camp-chapters'?'battles':command==='camp-journal'?'journey':null):null;
    if(destination){
      const returnTarget=navState.campOwner.returnTarget;navState.campOwner={kind:'advanced',returnTarget};
      if(destination==='evolution'){closeModal(false);if(ports.playable()&&(navState.modal as string|null)!=='session')switchTab('evolution');}
      else showModal(destination,destination==='chronicle'?chronicleScreenHtml(ports.sessionState.game.profile,ports.sessionState.game.state):destination==='battles'?battleSelectionHtml(ports.sessionState.game.profile,ports.sessionState.game.state):journeyScreenHtml(ports.sessionState.game.profile,ports.sessionState.game.state));
    }
    return true;
  }
  function showFieldPause(focusCommand?:string){
    if(!navState.entryEntered||!ports.guardAction()||ports.sessionState.game.state.phase!=='running')return;
    fieldControls.clear();showModal('field-pause','<h2 id="dialog-title">A moment by the fire</h2><button class="big-button green" data-command="field-resume">Resume</button><button class="big-button secondary" data-command="settings">Settings</button><button class="big-button secondary" data-command="home">Home</button>',focusCommand);
  }
  function showLeaveBattle(){
    if(navState.entryEntered||navState.modal||!ports.guardAction()||entrySecondary(ports.sessionState.game.profile,ports.sessionState.game.state)!=='leave')return;
    showModal('leave-battle','<h2 id="dialog-title">Leave this battle?</h2><p>Leaving counts as a loss. Coins you already earned are kept. Your current troops and battle progress end before you return to Camp.</p><button class="big-button danger" data-command="confirm-leave-battle">Leave for Camp</button><button class="big-button secondary" data-command="close">Keep this battle</button>','close');
  }
  function leaveBattle(){
    if(navState.entryEntered||navState.modal!=='leave-battle'||!ports.guardAction()||ports.sessionState.game.state.phase!=='running'||ports.sessionState.game.profile.pendingVictory)return;
    if(!ports.action({type:'retreat'})||!ports.playable()||navState.modal!=='leave-battle')return;
    if(!ports.action({type:'retry'})||!ports.playable()||navState.modal!=='leave-battle')return;
    closeModal(false);enterCamp();
  }
  function continueWithProvision(provision:string|undefined){
    const run=ports.sessionState.game.profile.chronicle?.expedition;
    if(!ports.guardAction()||navState.modal!=='result-expedition'||ports.sessionState.game.state.phase!=='won'||!run||run.stage>=2||(provision!=='supplies'&&provision!=='shelter'))return;
    if(!ports.action({type:'chronicle-provision',provision})||!ports.playable()||navState.modal!=='result-expedition')return;
    if(ports.action({type:'chronicle-continue'})&&ports.playable()&&navState.modal==='result-expedition'){
      closeModal(false);ports.sessionState.manualPaused=false;switchTab('battle');
    }
  }
  function clearPrestigeContext(){navState.prestigeOrigin=null;navState.prestigeDraft=null;navState.prestigeExpectedTimeline=null;}
  function openPrestige(){
    if(!ports.guardAction()||(navState.modal!=='result'&&navState.modal!=='battles'))return;
    const preview=prestigePreview(ports.sessionState.game.profile,ports.sessionState.game.state,ports.sessionState.game.profile.legacy.selected);
    if(!preview)return;
    navState.prestigeOrigin=navState.modal;navState.prestigeDraft=preview.choice;navState.prestigeExpectedTimeline=preview.expectedTimeline;
    showModal('prestige',prestigeDialogHtml(ports.sessionState.game.profile,preview));
  }
  function refreshPrestige(){
    if(!ports.guardAction()||navState.modal!=='prestige'||!navState.prestigeOrigin||!isLegacyChoice(navState.prestigeDraft))return;
    const preview=prestigePreview(ports.sessionState.game.profile,ports.sessionState.game.state,navState.prestigeDraft);
    if(preview&&preview.expectedTimeline===navState.prestigeExpectedTimeline){
      htmlIfChanged($('prestige-preview-values'),prestigeDetailsHtml(ports.sessionState.game.profile,preview));
    }else{
      showModal('prestige','<h2 id="dialog-title">This preview is no longer current</h2><p>Keep exploring, then open the next timeline preview again before you begin.</p><button class="big-button secondary" data-command="close">Keep exploring this timeline</button>');
    }
  }
  function returnFromPrestige(){
    if(!ports.guardAction()||navState.modal!=='prestige')return;
    const origin=navState.prestigeOrigin;clearPrestigeContext();
    if(origin==='result'){if(navState.resultDetailsOpen)showResultDetails('next');else showResult('next');}
    else if(origin==='battles')showModal('battles',battleSelectionHtml(ports.sessionState.game.profile,ports.sessionState.game.state),'next');
    else closeModal();
  }
  function returnToChapters(){
    if(advanceStatus(ports.sessionState.game.profile,ports.sessionState.game.state).reason!=='complete'||!ports.action({type:'retry'}))return;
    if(!ports.guardAction()||navState.modal==='session')return;
    navState.evolutionFromResult=false;ports.sessionState.manualPaused=false;closeModal(false);switchTab('battle');
    showModal('battles',battleSelectionHtml(ports.sessionState.game.profile,ports.sessionState.game.state));
  }
  function dismissModal(){
    if(navState.modal==='session'||!ports.guardAction())return;
    if(navState.modal==='camp-focus'){returnToCamp();return;}
    if(navState.campOwner?.kind==='advanced'&&['chronicle','journey','quests','battles'].includes(navState.modal??'')){returnToCamp();return;}
    if(navState.modal==='settings'){const origin=navState.settingsOrigin;navState.settingsOrigin=null;if(origin==='field-pause'){showFieldPause('settings');return;}closeModal();return;}
    if(navState.modal==='save-recovery'||navState.modal==='reset'){showSettings(navState.modal==='reset'?'reset':'save-recovery');return;}
    if(navState.modal==='import'){navState.pendingImport=null;showSaveRecovery('import');return;}
    if((navState.modal==='chronicle'||navState.modal==='journey'||navState.modal==='quests')&&(ports.sessionState.game.state.phase==='won'||ports.sessionState.game.state.phase==='lost')){showResult();return;}
    if(navState.modal==='prestige'){returnFromPrestige();return;}
    if(navState.modal==='result-expedition'){showResult();return;}
    if(navState.modal==='result'){
      if(navState.resultDetailsOpen){showResult('result-details');return;}
      if(advanceStatus(ports.sessionState.game.profile,ports.sessionState.game.state).reason==='complete')returnToChapters();
      return;
    }
    if(navState.modal==='evolve'&&navState.evolutionFromResult){navState.evolutionFromResult=false;showResult();return;}
    navState.evolutionFromResult=false;closeModal();
  }
  function preferenceNotice(){return ports.sessionState.session.status==='temporary'?temporarySessionNotice:ports.sessionState.savedWarning?'Saving is unavailable. Export a backup before closing.':`Progress saves in this browser. Export keeps a separate copy.${ports.sessionState.lastSavedAt?` Last saved ${new Date(ports.sessionState.lastSavedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}.`:''}`;}
  function showSettings(focusCommand?:string){
    if(!['settings','save-recovery','reset','import'].includes(navState.modal??''))navState.settingsOrigin=navState.modal==='field-pause'?'field-pause':null;
    showModal('settings',preferencesHtml(ports.sessionState.game.profile,ports.sessionState.atmosphereEnabled,ports.sessionState.audioMix,ports.sessionState.session.status==='active',preferenceNotice()),focusCommand);
  }
  function showSaveRecovery(focusCommand?:string){
    if(!ports.guardAction()||!['settings','import','save-recovery'].includes(navState.modal??''))return;
    showModal('save-recovery',saveRecoveryHtml(ports.sessionState.session.status==='active',preferenceNotice()),focusCommand);
  }
  function showStoryFollowUp(kind:StoryFollowUp){
    const chronicle=()=>showModal('chronicle',chronicleScreenHtml(ports.sessionState.game.profile,ports.sessionState.game.state));
    const openDetails=(selector:string)=>$('modal-layer').querySelector<HTMLDetailsElement>(selector)?.setAttribute('open','');
    const toBattle=()=>{closeModal(false);ports.sessionState.manualPaused=false;switchTab('battle');};
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
  return { entryReady, syncEntry, enterWorld, switchTab, renderScreen, showModal, closeModal, showResult, showResultDetails, showHome, enterCamp, syncCamp, showCampFocus, returnToCamp, handleCampInput, showFieldPause, showLeaveBattle, leaveBattle, continueWithProvision, clearPrestigeContext, openPrestige, refreshPrestige, returnFromPrestige, returnToChapters, dismissModal, preferenceNotice, showSettings, showSaveRecovery, showStoryFollowUp, navState: navState as Pick<NavState, 'activeTab' | 'campOwner' | 'entryEntered' | 'entrySaved' | 'entryWelcome' | 'evolutionFromResult' | 'focusFrame' | 'modal' | 'modalVersion' | 'pendingImport' | 'prestigeDraft' | 'prestigeExpectedTimeline' | 'prestigeOrigin' | 'settingsOrigin'> };
}
