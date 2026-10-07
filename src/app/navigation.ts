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
import type { AppState } from './state.ts';
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** What the navigation module needs: its slice of state, DOM handles and sibling operations. */
export interface NavigationDeps {
  state: Pick<AppState, 'activeTab' | 'atmosphereEnabled' | 'audioMix' | 'campOwner' | 'campRenderKey' | 'entryEntered' | 'entrySaved' | 'entryWelcome' | 'evolutionFromResult' | 'focusBefore' | 'focusFrame' | 'game' | 'lastSavedAt' | 'manualPaused' | 'modal' | 'modalVersion' | 'pendingImport' | 'prestigeDraft' | 'prestigeExpectedTimeline' | 'prestigeOrigin' | 'resultDetailsOpen' | 'resultShown' | 'savedWarning' | 'session' | 'settingsOrigin'>;
  dom: Pick<Runtime, '$' | 'fieldControls' | 'isolateModal' | 'lifetime' | 'root'>;
  ports: Pick<ShellApi, 'action' | 'guardAction' | 'persist' | 'playable' | 'syncPause' | 'update'>;
}

export function createNavigation(deps: NavigationDeps) {
  const { state, ports } = deps;
  const { $, fieldControls, isolateModal, lifetime, root } = deps.dom;
  function entryReady(){return ports.playable()&&$('battlefield').dataset.renderer==='ready'&&!$('battlefield').querySelector('.world-loader');}
  function syncEntry(){
    const mode=state.entryEntered?'play':'home';
    if(root!.dataset.entry!==mode)root!.dataset.entry=mode;
    if($('entry-screen').hidden!==state.entryEntered)$('entry-screen').hidden=state.entryEntered;
    if(state.entryEntered)return;
    const copy=entryCopy(state.game.profile,state.entrySaved||hasPriorPlay(state.game.profile)),failed=$('battlefield').dataset.renderer==='failed';
    textIfChanged($('entry-play'),failed?'Reload':entryReady()?copy.action:'Loading…');
    $('entry-play').dataset.command=failed?'reload-world':'enter-world';
    textIfChanged($('entry-chapter'),copy.chapter);
    textIfChanged($('entry-subtitle'),failed?'The battlefield could not load. Reload to try again; your saved progress is kept.':state.entryWelcome??copy.subtitle);
    const art=$('entry-art'),source=chapterLandscape(state.game.profile.enemyAge);
    if(art.dataset.source!==source){art.setAttribute('src',source);art.dataset.source=source;}
    const secondary=entrySecondary(state.game.profile,state.game.state),extra=$('entry-secondary');
    extra.hidden=failed||secondary===null;extra.dataset.command=secondary==='leave'?'leave-battle':'home-camp';
    textIfChanged(extra,secondary==='leave'?'Leave battle…':'Camp');extra.toggleAttribute('disabled',!entryReady());
    $('entry-play').toggleAttribute('disabled',!ports.playable()||(!failed&&!entryReady()));$('entry-settings').toggleAttribute('disabled',!ports.playable());
  }
  function enterWorld(){
    if(state.entryEntered||state.modal||!ports.guardAction()||!entryReady())return;
    root!.dataset.fieldMode='field';
    state.entryEntered=true;state.entrySaved=true;state.entryWelcome=null;syncEntry();
    state.manualPaused=false;
    if(state.game.state.phase==='ready')ports.action({type:'start'});
    switchTab('battle');
    if(!state.modal)$('world').focus({preventScroll:true});
  }
  function switchTab(tab:string){
    if(!ports.playable()||!['battle','evolution','cards','skills'].includes(tab))return;
    state.activeTab=tab;
    if(state.entryEntered&&tab==='battle'&&canOwnCamp(state.game.profile,state.game.state))root!.dataset.fieldMode='camp';
    root!.querySelectorAll<HTMLElement>('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===tab);button.setAttribute('aria-current',button.dataset.tab===tab?'page':'false');});
    $('secondary-screen').hidden=tab==='battle';$('battle-view').inert=tab!=='battle';
    $('battle-view').setAttribute('aria-hidden',String(tab!=='battle'));
    ports.syncPause();renderScreen();ports.update(true);
    if(state.entryEntered&&tab==='battle'&&!state.modal&&(state.game.state.phase==='won'||state.game.state.phase==='lost')){state.resultShown=state.game.state.phase;showResult();}
    if(tab!=='battle')$('secondary-title')?.focus();
  }
  function renderScreen(legacyOnly=false){
    const p=state.game.profile;let html='';
    if(state.activeTab==='evolution'){
      if(legacyOnly&&$('legacy-current')){
        htmlIfChanged($('legacy-current'),legacyCurrentHtml(p));
        $('secondary-screen').querySelectorAll<HTMLInputElement>('input[name="ready-legacy"]').forEach(input=>{input.checked=input.value===p.legacy.selected;});
        return;
      }
      html=evolutionScreenHtml(p,state.game.state);
    }else if(state.activeTab==='cards'){
      html=cardsScreenHtml(p);
    }else if(state.activeTab==='skills'){
      const captain=p.chronicle?.enabled&&p.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===p.chronicle!.captain):undefined;
      html=`<div class="screen-heading"><span class="eyebrow">TURN THE TIDE</span><h2 id="secondary-title" tabindex="-1">Battle skills</h2><p>The right move can change everything.</p></div><div class="skill-list">${[{id:'freeze',name:'Freeze',tag:'CONTROL',copy:`Freeze every enemy for ${legacyEffects(p.legacy).freezeSeconds} seconds. Give your army time to strike.`,color:'#73bbdb'},{id:'meteor',name:'Meteor',tag:'DAMAGE',copy:'Hit every enemy on the battlefield. Best saved for a big wave.',color:'#de805d'},{id:'food',name:captain?.skill??'Food Drop',tag:captain?'CAPTAIN':'SUPPORT',copy:captain?.description??'Gain up to 10 food instantly, limited by 99-food storage. Deploy reinforcements when you need them.',color:'#97bc6a'}].map(s=>`<article class="skill-detail"><div class="skill-art" style="background:${s.color}">${icon(s.id)}</div><div><small>${s.tag}</small><h3>${s.name}</h3><p>${s.copy}</p><span class="skill-rule">ONCE PER BATTLE</span></div></article>`).join('')}</div><div class="skill-note">${icon('battle')}<p>Select an enemy in battle for Freeze or Meteor. Inspect the supplies after deploying a troop for your support skill. Each skill refreshes when a new battle begins.</p></div><button class="big-button green" data-tab="battle">BACK TO BATTLE ${icon('arrow')}</button>`;
    }
    if(state.activeTab!=='battle')htmlIfChanged($('secondary-screen'),`${state.campOwner?.kind==='advanced'?'<button class="big-button secondary camp-advanced-return" data-command="camp-return">Back to Camp</button>':''}${html}`);
  }
  function showModal(id:string,html:string,focusCommand?:string){
    if(id!=='session'&&!ports.playable())return;
    // A canonical ready transition may open a retained task after mounting Camp.
    // Its modal, not the underlying root, owns all of those deliberate controls.
    if(state.campOwner?.kind==='root'&&canOwnCamp(state.game.profile,state.game.state)&&id!=='camp-focus'&&id!=='session')state.campOwner={kind:'advanced',returnTarget:'journal'};
    const replacing=state.modal!==null,sameModal=state.modal===id,active=document.activeElement as HTMLElement|null,command=active?.dataset.command;
    const storyAction=active?chronicleActionFromData(active.dataset):null,storyPage=active?.dataset.storyPage;
    const layer=$('modal-layer'),previousScroll=sameModal?layer.querySelector<HTMLElement>('.dialog')?.scrollTop:null;
    if(!replacing)state.focusBefore=document.activeElement as HTMLElement;
    state.modal=id;state.modalVersion++;const version=state.modalVersion;
    const dismissButton=`<button class="close-button" data-command="close" aria-label="Close">${icon('close')}</button>`;
    const dismissMarkup=['quests','camp-focus','field-pause','settings','save-recovery','reset','import','leave-battle','result','result-expedition','session'].includes(id)?'':id==='chronicle'?dismissButton:`<div class="dialog-dismiss">${dismissButton}</div>`;
    layer.hidden=false;layer.innerHTML=`<section class="dialog ${(id==='result'||id==='result-expedition')?'result-dialog':id==='session'?'session-dialog':id==='camp-focus'?'camp-dialog':id==='settings'?'preferences-dialog':id==='quests'?'quest-record-dialog':id==='prestige'?'prestige-dialog':id==='chronicle'?'chronicle-dialog':''}" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="dialog-title">${dismissMarkup}${html}</section>`;
    isolateModal(true);ports.syncPause();window.cancelAnimationFrame(state.focusFrame);
    state.focusFrame=requestAnimationFrame(()=>{
      if(lifetime.disposed||layer.hidden||version!==state.modalVersion)return;
      const previous=sameModal&&command?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===command):null;
      const requested=focusCommand?Array.from(layer.querySelectorAll<HTMLElement>('[data-command]')).find(element=>element.dataset.command===focusCommand):null;
      const storyMatch=storyAction?Array.from(layer.querySelectorAll<HTMLElement>('[data-story-route],[data-story-captain],[data-story-tale],[data-story-preparation],[data-story-discovery],[data-story-provision]')).find(element=>JSON.stringify(chronicleActionFromData(element.dataset))===JSON.stringify(storyAction)):storyPage!==undefined?Array.from(layer.querySelectorAll<HTMLElement>('[data-story-page]')).find(element=>element.dataset.storyPage===storyPage):null;
      const storyPrevious=sameModal&&storyMatch&&!storyMatch.matches(':disabled,[aria-disabled="true"]')?storyMatch:null;
      const dialog=layer.querySelector<HTMLElement>('.dialog');if(previousScroll!==null&&previousScroll!==undefined&&dialog)dialog.scrollTop=previousScroll;
      (requested??previous??storyPrevious??(sameModal?null:layer.querySelector<HTMLElement>('[data-initial-focus]'))??modalFocusables(layer)[0]??dialog)?.focus();
    });
  }
  function closeModal(refresh=true){
    if(!ports.playable()||!state.session.check())return;
    // Loading a saved game also ends with a close; with no dialog open there is no focus to give back, and moving it to the
    // Battle tab button would make Space press that button instead of starting the battle.
    const restoreFocus=state.modal!==null;
    state.modal=null;state.modalVersion++;state.pendingImport=null;window.cancelAnimationFrame(state.focusFrame);
    $('modal-layer').hidden=true;$('modal-layer').innerHTML='';isolateModal(false);ports.syncPause();
    if(restoreFocus){
      const target=state.focusBefore;
      if(state.focusBefore?.isConnected&&!state.focusBefore.closest('[hidden],[inert]')&&!state.focusBefore.matches(':disabled')&&state.focusBefore.getClientRects().length)state.focusBefore.focus();
      // A restored result often has BODY as its origin. A connected element can also
      // be non-focusable; verify that focus actually moved before accepting it.
      if(!target||document.activeElement!==target||target===document.body||target===document.documentElement)
        (state.entryEntered?root!.querySelector<HTMLElement>(state.campOwner?state.campOwner.kind==='advanced'&&state.activeTab!=='battle'?'[data-command="camp-return"]':'[data-command="camp-battle"]':root!.dataset.fieldMode==='field'?'[data-command="field-pause"]':`.bottom-nav [data-tab="${state.activeTab}"]`):$('entry-play'))?.focus({preventScroll:true});
    }
    if(refresh)ports.update(true);
  }
  function showResult(focusCommand?:string){
    if(!ports.guardAction()||state.modal==='session')return;
    if(state.game.state.phase!=='won'&&state.game.state.phase!=='lost')return;
    ports.persist();
    // A failed ownership check/save may synchronously replace this modal with recovery.
    const fresh=state.modal!=='result';
    if(ports.playable()&&state.modal!=='session'){state.resultDetailsOpen=false;showModal('result',compactResultsHtml(state.game.profile,state.game.state),focusCommand);}
    if(fresh&&state.modal==='result')startCountUp($('modal-layer'),compactNumber,document.documentElement.dataset.motion==='reduced');
  }
  function showResultDetails(){
    if(!ports.guardAction()||state.modal!=='result')return;
    state.resultDetailsOpen=true;
    showModal('result',`<button class="big-button secondary result-back" data-command="result-back">Back to result</button>${resultsHtml(state.game.profile,state.game.state)}`,'result-back');
  }
  function showHome(){
    const fromCamp=state.entryEntered&&root!.dataset.fieldMode==='camp'&&state.modal===null;
    if(!ports.guardAction()||(!fromCamp&&state.modal!=='field-pause'&&(state.modal!=='result'||!['won','lost'].includes(state.game.state.phase))))return;
    const owner=state.modal;ports.persist();if(!ports.playable()||state.modal!==owner)return;
    fieldControls.clear();state.campOwner=null;$('camp-view').hidden=true;
    state.entryEntered=false;state.entrySaved=hasPriorPlay(state.game.profile);root!.dataset.fieldMode='field';state.resultDetailsOpen=false;syncEntry();closeModal(false);ports.syncPause();
    $('entry-play').focus({preventScroll:true});
  }
  function enterCamp(){
    if(state.entryEntered||state.modal||!ports.guardAction()||!entryReady()||entrySecondary(state.game.profile,state.game.state)!=='camp')return;
    state.entryEntered=true;state.entrySaved=true;state.entryWelcome=null;root!.dataset.fieldMode='camp';state.manualPaused=false;
    fieldControls.clear();syncEntry();switchTab('battle');ports.syncPause();root!.querySelector<HTMLElement>('[data-command="camp-battle"]')?.focus({preventScroll:true});
  }
  function syncCamp(){
    const visible=state.entryEntered&&root!.dataset.fieldMode==='camp'&&ports.playable()&&canOwnCamp(state.game.profile,state.game.state);
    if(!visible){state.campOwner=null;$('camp-view').hidden=true;if(!canOwnCamp(state.game.profile,state.game.state))root!.dataset.fieldMode='field';return;}
    state.campOwner??={kind:'root'};
    if(state.campOwner.kind==='advanced'&&!state.modal&&state.activeTab==='battle')state.campOwner={kind:'root'};
    const p=state.game.profile,key=JSON.stringify([p.age,p.enemyAge,p.foodLevel,p.baseLevel,p.unlocked,p.chronicle?.route]);
    if(key!==state.campRenderKey){state.campRenderKey=key;htmlIfChanged($('camp-view'),campRootHtml(p));}
    $('camp-view').hidden=state.activeTab!=='battle';$('camp-view').inert=state.modal!==null||state.activeTab!=='battle';
    $('battle-view').inert=true;
    root!.querySelectorAll<HTMLElement>('.resources,.bottom-nav').forEach(node=>{node.inert=true;});
    root!.dataset.campOwner=state.campOwner.kind;
    const notice=$('session-notice');notice.hidden=state.session.status!=='temporary'&&!state.savedWarning;
    const message=state.session.status==='temporary'?temporarySessionNotice:state.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':'';
    textIfChanged(notice,message);
    // A later autosave/background failure must also reach the isolated active focus.
    // Update this stable node only: no modal replacement, refocus or scroll change.
    if(state.modal==='camp-focus'&&state.campOwner.kind==='focus'){
      const focusNotice=$('camp-focus-save-status');
      if(focusNotice){focusNotice.hidden=!message;textIfChanged(focusNotice,message);}
    }
  }
  function showCampFocus(focus:CampFocus,focusCommand?:string){
    if(!state.campOwner||!ports.guardAction()||!canOwnCamp(state.game.profile,state.game.state)||state.modal==='session')return;
    const returnTarget=typeof focus==='object'?'company':focus;
    state.campOwner={kind:'focus',focus,returnTarget};
    showModal('camp-focus',campFocusHtml(state.game,focus,state.session.status==='temporary'?temporarySessionNotice:state.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':''),focusCommand);syncCamp();
  }
  function returnToCamp(){
    if(!state.campOwner||!ports.guardAction()||!canOwnCamp(state.game.profile,state.game.state)||state.modal==='session')return;
    if(state.campOwner.kind==='focus'&&typeof state.campOwner.focus==='object'){showCampFocus('company');return;}
    const target=state.campOwner.kind==='root'?'journal':state.campOwner.returnTarget;
    closeModal(false);if(!ports.playable()||state.modal==='session')return;
    state.campOwner={kind:'root'};switchTab('battle');syncCamp();
    root!.querySelector<HTMLElement>(`[data-camp-station="${target}"]`)?.focus({preventScroll:true});
  }
  function handleCampInput(button:HTMLButtonElement):boolean {
    const command=button.dataset.command;
    if(command==='camp-return'){returnToCamp();return true;}
    if(!state.campOwner)return command?.startsWith('camp-')??false;
    if(!ports.guardAction()||!canOwnCamp(state.game.profile,state.game.state))return true;
    if(state.campOwner.kind==='advanced')return !state.modal&&!button.closest('#secondary-screen');
    if(state.campOwner.kind==='root'){
      if(isCampStation(button.dataset.campStation)){showCampFocus(button.dataset.campStation);return true;}
      if(command==='camp-home'){showHome();return true;}
      if(command==='camp-battle'&&entryReady()&&!state.modal){state.manualPaused=false;if(ports.action({type:'start'})&&ports.playable()&&state.modal!=='session'){state.campOwner=null;root!.dataset.fieldMode='field';switchTab('battle');$('world').focus({preventScroll:true});}return true;}
      return true;
    }
    if(state.modal!=='camp-focus')return true;
    const focus=state.campOwner.focus;
    if(command==='camp-back'){returnToCamp();return true;}
    if(focus==='company'&&/^[0-2]$/.test(button.dataset.campRecruit??'')){showCampFocus({recruit:Number(button.dataset.campRecruit) as UnitKind});return true;}
    const local=campActionFromData(focus,button.dataset);
    if(local){
      const accepted=ports.action(local);
      if(accepted&&ports.playable()&&state.modal==='camp-focus'&&state.campOwner?.kind==='focus'){
        const again=local.type==='upgrade'&&state.game.upgradeStatus(local.stat).allowed||local.type==='chronicle-preparation';
        showCampFocus(focus,again?command:'camp-back');
      }
      return true;
    }
    const destination=focus==='company'?(command==='camp-evolution'?'evolution':command==='camp-storybook'?'chronicle':null):focus==='journal'?(command==='camp-chapters'?'battles':command==='camp-journal'?'journey':null):null;
    if(destination){
      const returnTarget=state.campOwner.returnTarget;state.campOwner={kind:'advanced',returnTarget};
      if(destination==='evolution'){closeModal(false);if(ports.playable()&&(state.modal as string|null)!=='session')switchTab('evolution');}
      else showModal(destination,destination==='chronicle'?chronicleScreenHtml(state.game.profile,state.game.state):destination==='battles'?battleSelectionHtml(state.game.profile,state.game.state):journeyScreenHtml(state.game.profile,state.game.state));
    }
    return true;
  }
  function showFieldPause(focusCommand?:string){
    if(!state.entryEntered||!ports.guardAction()||state.game.state.phase!=='running')return;
    fieldControls.clear();showModal('field-pause','<h2 id="dialog-title">A moment by the fire</h2><button class="big-button green" data-command="field-resume">Resume</button><button class="big-button secondary" data-command="settings">Settings</button><button class="big-button secondary" data-command="home">Home</button>',focusCommand);
  }
  function showLeaveBattle(){
    if(state.entryEntered||state.modal||!ports.guardAction()||entrySecondary(state.game.profile,state.game.state)!=='leave')return;
    showModal('leave-battle','<h2 id="dialog-title">Leave this battle?</h2><p>Leaving counts as a loss. Coins you already earned are kept. Your current troops and battle progress end before you return to Camp.</p><button class="big-button danger" data-command="confirm-leave-battle">Leave for Camp</button><button class="big-button secondary" data-command="close">Keep this battle</button>','close');
  }
  function leaveBattle(){
    if(state.entryEntered||state.modal!=='leave-battle'||!ports.guardAction()||state.game.state.phase!=='running'||state.game.profile.pendingVictory)return;
    if(!ports.action({type:'retreat'})||!ports.playable()||state.modal!=='leave-battle')return;
    if(!ports.action({type:'retry'})||!ports.playable()||state.modal!=='leave-battle')return;
    closeModal(false);enterCamp();
  }
  function continueWithProvision(provision:string|undefined){
    const run=state.game.profile.chronicle?.expedition;
    if(!ports.guardAction()||state.modal!=='result-expedition'||state.game.state.phase!=='won'||!run||run.stage>=2||(provision!=='supplies'&&provision!=='shelter'))return;
    if(!ports.action({type:'chronicle-provision',provision})||!ports.playable()||state.modal!=='result-expedition')return;
    if(ports.action({type:'chronicle-continue'})&&ports.playable()&&state.modal==='result-expedition'){
      closeModal(false);state.manualPaused=false;switchTab('battle');
    }
  }
  function clearPrestigeContext(){state.prestigeOrigin=null;state.prestigeDraft=null;state.prestigeExpectedTimeline=null;}
  function openPrestige(){
    if(!ports.guardAction()||(state.modal!=='result'&&state.modal!=='battles'))return;
    const preview=prestigePreview(state.game.profile,state.game.state,state.game.profile.legacy.selected);
    if(!preview)return;
    state.prestigeOrigin=state.modal;state.prestigeDraft=preview.choice;state.prestigeExpectedTimeline=preview.expectedTimeline;
    showModal('prestige',prestigeDialogHtml(state.game.profile,preview));
  }
  function refreshPrestige(){
    if(!ports.guardAction()||state.modal!=='prestige'||!state.prestigeOrigin||!isLegacyChoice(state.prestigeDraft))return;
    const preview=prestigePreview(state.game.profile,state.game.state,state.prestigeDraft);
    if(preview&&preview.expectedTimeline===state.prestigeExpectedTimeline){
      htmlIfChanged($('prestige-preview-values'),prestigeDetailsHtml(state.game.profile,preview));
    }else{
      showModal('prestige','<h2 id="dialog-title">This preview is no longer current</h2><p>Keep exploring, then open the next timeline preview again before you begin.</p><button class="big-button secondary" data-command="close">Keep exploring this timeline</button>');
    }
  }
  function returnFromPrestige(){
    if(!ports.guardAction()||state.modal!=='prestige')return;
    const origin=state.prestigeOrigin;clearPrestigeContext();
    if(origin==='result')showResult('next');
    else if(origin==='battles')showModal('battles',battleSelectionHtml(state.game.profile,state.game.state),'next');
    else closeModal();
  }
  function returnToChapters(){
    if(advanceStatus(state.game.profile,state.game.state).reason!=='complete'||!ports.action({type:'retry'}))return;
    if(!ports.guardAction()||state.modal==='session')return;
    state.evolutionFromResult=false;state.manualPaused=false;closeModal(false);switchTab('battle');
    showModal('battles',battleSelectionHtml(state.game.profile,state.game.state));
  }
  function dismissModal(){
    if(state.modal==='session'||!ports.guardAction())return;
    if(state.modal==='camp-focus'){returnToCamp();return;}
    if(state.campOwner?.kind==='advanced'&&['chronicle','journey','quests','battles'].includes(state.modal??'')){returnToCamp();return;}
    if(state.modal==='settings'){const origin=state.settingsOrigin;state.settingsOrigin=null;if(origin==='field-pause'){showFieldPause('settings');return;}closeModal();return;}
    if(state.modal==='save-recovery'||state.modal==='reset'){showSettings(state.modal==='reset'?'reset':'save-recovery');return;}
    if(state.modal==='import'){state.pendingImport=null;showSaveRecovery('import');return;}
    if((state.modal==='chronicle'||state.modal==='journey'||state.modal==='quests')&&(state.game.state.phase==='won'||state.game.state.phase==='lost')){showResult();return;}
    if(state.modal==='prestige'){returnFromPrestige();return;}
    if(state.modal==='result-expedition'){showResult();return;}
    if(state.modal==='result'){
      if(state.resultDetailsOpen){showResult('result-details');return;}
      if(advanceStatus(state.game.profile,state.game.state).reason==='complete')returnToChapters();
      return;
    }
    if(state.modal==='evolve'&&state.evolutionFromResult){state.evolutionFromResult=false;showResult();return;}
    state.evolutionFromResult=false;closeModal();
  }
  function preferenceNotice(){return state.session.status==='temporary'?temporarySessionNotice:state.savedWarning?'Saving is unavailable. Export a backup before closing.':`Progress saves in this browser. Export keeps a separate copy.${state.lastSavedAt?` Last saved ${new Date(state.lastSavedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}.`:''}`;}
  function showSettings(focusCommand?:string){
    if(!['settings','save-recovery','reset','import'].includes(state.modal??''))state.settingsOrigin=state.modal==='field-pause'?'field-pause':null;
    showModal('settings',preferencesHtml(state.game.profile,state.atmosphereEnabled,state.audioMix,state.session.status==='active',preferenceNotice()),focusCommand);
  }
  function showSaveRecovery(focusCommand?:string){
    if(!ports.guardAction()||!['settings','import','save-recovery'].includes(state.modal??''))return;
    showModal('save-recovery',saveRecoveryHtml(state.session.status==='active',preferenceNotice()),focusCommand);
  }
  function showStoryFollowUp(kind:StoryFollowUp){
    const chronicle=()=>showModal('chronicle',chronicleScreenHtml(state.game.profile,state.game.state));
    const openDetails=(selector:string)=>$('modal-layer').querySelector<HTMLDetailsElement>(selector)?.setAttribute('open','');
    const toBattle=()=>{closeModal(false);state.manualPaused=false;switchTab('battle');};
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
  return { entryReady, syncEntry, enterWorld, switchTab, renderScreen, showModal, closeModal, showResult, showResultDetails, showHome, enterCamp, syncCamp, showCampFocus, returnToCamp, handleCampInput, showFieldPause, showLeaveBattle, leaveBattle, continueWithProvision, clearPrestigeContext, openPrestige, refreshPrestige, returnFromPrestige, returnToChapters, dismissModal, preferenceNotice, showSettings, showSaveRecovery, showStoryFollowUp };
}
