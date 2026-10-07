






import { questRecords } from '../ui/quest-records.ts';
import { storyFollowUp } from '../ui/story-flow.ts';
import { battlefieldOrderFromGesture } from '../ui/battlefield-orders.ts';
import { journeyScreenHtml } from '../ui/journey-screen.ts';
import { chronicleScreenHtml, chronicleActionFromData } from '../ui/chronicle-screen.ts';
import { advanceStatus } from '../game/mastery.ts';
import { isLegacyChoice } from '../game/prestige.ts';
import { localDay } from '../game/data.ts';
import { MAX_SAVE_CHARS, SAVE_KEY, BACKUP_KEY } from '../game/save.ts';
import { startOverProfile } from '../game/reset.ts';
import { importBackup, restoreBackupWithSave } from '../game/backup.ts';
import type { Skill, UnitKind } from '../game/types.ts';
import { chapterPresentation } from '../ui/chapter-presentation.ts';
import { unlockAudio, suspendAudio, updateAudioMix } from '../view/audio.ts';
import { troopUnlockMessage } from '../ui/army-screen.ts';
import { summonedCardsHtml } from '../ui/cards-screen.ts';
import { expeditionChoiceHtml } from '../ui/results-screen.ts';
import { claimableWeek, syncWeekly, weekId } from '../game/weekly.ts';
import { earlierChapter } from '../ui/regroup-learning.ts';
import { waveInspectionHtml } from '../ui/wave-inspection.ts';
import { battleSelectionHtml, evolutionDialogHtml } from '../ui/progression-screen.ts';
import { modalFocusables, nextFocusIndex, isEditingTarget } from '../ui/accessibility.ts';
import { saveAtmosphere, normalizeAudioMix, saveAudioMix } from '../ui/audio-preferences.ts';
import { textIfChanged } from '../ui/dom-state.ts';
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** State owned by the listeners module. Siblings see only the slice it exposes through its ports. */
export interface InputState {
  battlefieldPointer: {id:number;x:number;y:number}|null;
  importRequest: number;
  modalPointerSequence: boolean;
}

/** What the listeners module needs: its slice of state, DOM handles and sibling operations. */
export interface ListenersDeps {
  dom: Pick<Runtime, '$' | 'blockModalTap' | 'fieldControls' | 'lifetime' | 'money' | 'motionQuery' | 'root' | 'activeElement' | 'hidden' | 'now' | 'pageEvents' | 'reload' | 'viewEvents'>;
  ports: Pick<ShellApi, 'acquireSession' | 'action' | 'adoptRestoredGame' | 'claimQuestRecord' | 'clearPrestigeContext' | 'closeModal' | 'continueWithProvision' | 'dismissModal' | 'enterCamp' | 'enterWorld' | 'exportSave' | 'guardAction' | 'handleCampInput' | 'leaveBattle' | 'navState' | 'openPrestige' | 'persist' | 'playable' | 'preferenceNotice' | 'questState' | 'rebuildArmy' | 'refreshPrestige' | 'refreshQuestRecord' | 'renderScreen' | 'returnToCamp' | 'returnToChapters' | 'sessionState' | 'showFieldPause' | 'showHome' | 'showLeaveBattle' | 'showModal' | 'showQuests' | 'showResult' | 'showResultDetails' | 'showSaveRecovery' | 'showSettings' | 'showStoryFollowUp' | 'suspendSession' | 'switchTab' | 'syncMarks' | 'syncMotion' | 'syncPause' | 'syncWeek' | 'toast' | 'update'>;
}

export function installListeners(deps: ListenersDeps): void {
  const { ports, dom } = deps;
  const { $, blockModalTap, fieldControls, lifetime, money, motionQuery, root } = deps.dom;
  const inputState: InputState = {
    battlefieldPointer: null,
    importRequest: 0,
    modalPointerSequence: false,
  };
  const commandHandlers:Record<string,(button:HTMLButtonElement)=>void>={
    'start':()=>{ports.sessionState.manualPaused=false;if(ports.action({type:'start'})){root!.dataset.fieldMode='field';ports.update(true);}},
    'upgrade-food':()=>{ports.action({type:'upgrade',stat:'food'});},
    'upgrade-base':()=>{ports.action({type:'upgrade',stat:'base'});},
    'battles':()=>{ports.showModal('battles',battleSelectionHtml(ports.sessionState.game.profile,ports.sessionState.game.state));},
    'wave-help':()=>{if(ports.sessionState.game.state.phase==='running')ports.showModal('wave-help',waveInspectionHtml(ports.sessionState.game.waveStatus(),ports.sessionState.game.state.chronicle?.enabled?ports.sessionState.game.state.chronicle.objective:undefined));},
    'evolve':()=>{const html=evolutionDialogHtml(ports.sessionState.game.profile,ports.sessionState.game.state);if(html){ports.navState.evolutionFromResult=ports.navState.modal==='result';ports.showModal('evolve',html);};},
    'confirm-evolve':()=>{
      const returnToResult=ports.navState.evolutionFromResult,ok=ports.action({type:'evolve'});
      if(!ports.playable()||ports.navState.modal==='session')return;
      if(ok){
        ports.navState.evolutionFromResult=false;
        {const deck=$('unit-cards');deck.dataset.evolveReveal=deck.dataset.evolveReveal==='a'?'b':'a';}
        if(returnToResult)ports.showResult();else{ports.closeModal(false);ports.switchTab('battle');}
        if(!ports.sessionState.savedWarning)ports.toast(`Entering ${chapterPresentation(ports.sessionState.game.profile.age).title}.`);
      }else{
        const html=evolutionDialogHtml(ports.sessionState.game.profile,ports.sessionState.game.state);
        if(html)ports.showModal('evolve',html);else ports.dismissModal();
      }
    },
    'return-chapters':()=>{ports.returnToChapters();},
    'regroup-chapters':()=>{
      const suggested=earlierChapter(ports.sessionState.game.profile);
      if(ports.navState.modal!=='result'||ports.sessionState.game.state.phase!=='lost'||suggested===null)return;
      if(!ports.action({type:'retry'})||!ports.playable()||(ports.navState.modal as string|null)==='session')return;
      ports.navState.evolutionFromResult=false;ports.sessionState.manualPaused=false;ports.closeModal(false);ports.switchTab('battle');
      ports.showModal('battles',battleSelectionHtml(ports.sessionState.game.profile,ports.sessionState.game.state,true),`choose-battle-${suggested}`);
    },
    'next':()=>{
      const advancement=advanceStatus(ports.sessionState.game.profile,ports.sessionState.game.state);
      if(advancement.allowed&&advancement.target==='timeline'){ports.openPrestige();return;}
      if(ports.action({type:'next'})&&ports.playable()&&ports.navState.modal!=='session'){ports.navState.evolutionFromResult=false;ports.closeModal(false);ports.sessionState.manualPaused=false;ports.switchTab('battle');}
    },
    'retry':()=>{if(ports.action({type:'retry'})&&ports.playable()&&ports.navState.modal!=='session'){ports.navState.evolutionFromResult=false;ports.closeModal(false);ports.sessionState.manualPaused=false;ports.switchTab('battle');};},
    'confirm-prestige':()=>{
      if(ports.navState.modal!=='prestige'||!ports.navState.prestigeOrigin||ports.navState.prestigeExpectedTimeline===null||!isLegacyChoice(ports.navState.prestigeDraft))return;
      const ok=ports.action({type:'prestige',expectedTimeline:ports.navState.prestigeExpectedTimeline,legacy:ports.navState.prestigeDraft});
      // The guarded writer can synchronously replace the narrowed prestige modal.
      if(!ports.playable()||(ports.navState.modal as string|null)==='session')return;
      if(ok){ports.clearPrestigeContext();ports.navState.evolutionFromResult=false;ports.sessionState.manualPaused=false;ports.closeModal(false);ports.switchTab('battle');}
      else ports.refreshPrestige();
    },
    'pause':()=>{if(ports.sessionState.game.state.phase==='running'){ports.sessionState.manualPaused=!ports.sessionState.manualPaused;ports.syncPause();ports.update(true);}},
    'speed':()=>{ports.sessionState.game.profile.speed=ports.sessionState.game.profile.speed===1?2:1;ports.persist();ports.update(true);if(ports.navState.modal==='settings'&&ports.playable())ports.showSettings();},
    'settings':()=>{ports.persist();ports.showSettings();},
    'quests':()=>{ports.showQuests();},
    'save-recovery':()=>{ports.showSaveRecovery();},
    'import':()=>{if(ports.navState.modal==='save-recovery'&&ports.sessionState.session.status==='active')$('import-save')?.click();},
    'reset':()=>{if(ports.navState.modal!=='settings'||ports.sessionState.session.status!=='active')return;ports.showModal('reset',`<h2 id="dialog-title">Start over?</h2><p>This deletes your progress on this browser: your age, coins, upgrades, unlocked battles, every card and all gems, quests and records.</p><p>Your sound, speed, motion and troop-shape choices stay. Export a save first if you might want this progress back.</p><button class="big-button blue" data-command="export">EXPORT SAVE FIRST</button><button class="big-button danger" data-command="confirm-reset">DELETE PROGRESS AND START OVER</button><button class="big-button secondary" data-command="close">KEEP MY PROGRESS</button>`,'close');},
    'confirm-reset':()=>{
      if(ports.navState.modal!=='reset'||ports.sessionState.session.status!=='active')return;
      const restored=restoreBackupWithSave(ports.sessionState.game,startOverProfile(ports.sessionState.game.profile),profile=>{syncWeekly(profile,weekId(localDay()));return ports.sessionState.session.save(profile).ok;});
      if(!restored.ok){ports.toast('The new game could not be saved. Your current progress was not deleted.');return;}
      ports.adoptRestoredGame(restored.game);ports.toast('Started a new game.');
    },
    'confirm-import':()=>{
      if(ports.navState.modal!=='import'||!ports.navState.pendingImport||ports.sessionState.session.status!=='active')return;const restored=restoreBackupWithSave(ports.sessionState.game,ports.navState.pendingImport,profile=>{syncWeekly(profile,weekId(localDay()));return ports.sessionState.session.save(profile).ok;});
      if(!restored.ok){ports.toast('The save could not be written. Your current game was not replaced.');return;}
      ports.adoptRestoredGame(restored.game);ports.toast('Save restored.');
    },
    'close':()=>{ports.dismissModal();},
  };
  function routeDataAction(button:HTMLButtonElement,command:string|undefined):boolean {
    if(button.dataset.unit!==undefined){const kind=Number(button.dataset.unit) as UnitKind;if(!ports.sessionState.game.profile.unlocked[kind]){if(ports.action({type:'unlock',kind})&&ports.playable()&&!ports.sessionState.savedWarning)ports.toast(troopUnlockMessage(ports.sessionState.game.profile,ports.sessionState.game.state.phase,kind,ports.sessionState.game.deploymentStatus(kind)),7000);}else ports.action({type:'spawn',kind});return true;}
    if(button.dataset.skill){if(ports.action({type:'skill',skill:button.dataset.skill as Skill}))fieldControls.clear();return true;}
    if(command==='quest-claim'){ports.claimQuestRecord(button);return true;}
    if(button.dataset.weekly){
      // A previously rendered claim cannot settle an expired or future local week. Rejection never syncs.
      const week=claimableWeek(button.dataset.weekly,weekId(localDay()));
      if(week===null)return true;
      if(ports.action({type:'weekly',week}))ports.showQuests();return true;
    }
    if(button.dataset.daily){if(ports.action({type:'daily',day:Number(button.dataset.daily)}))ports.showQuests();return true;}
    if(button.dataset.claim){const fromJourney=ports.navState.modal==='journey';if(ports.action({type:'claim',id:button.dataset.claim})){if(fromJourney&&ports.playable()&&ports.navState.modal!=='session')ports.showModal('journey',journeyScreenHtml(ports.sessionState.game.profile,ports.sessionState.game.state));else ports.showQuests();}return true;}
    if(button.dataset.battle!==undefined){if(ports.action({type:'select-battle',battle:Number(button.dataset.battle)}))ports.closeModal();return true;}
    if(button.dataset.pack!==undefined){
      const before=[...ports.sessionState.game.profile.cards],count=Number(button.dataset.pack) as 1|10|50;
      if(ports.action({type:'summon',count})&&ports.playable())ports.showModal('summon',summonedCardsHtml(before,ports.sessionState.game.profile));
      else ports.toast('This pack is unavailable. Your gems were not spent.');return true;
    }
    return false;
  }
  function listenPointer():void {
    lifetime.listen<PointerEvent>($('battlefield'),'pointerdown',e=>{
     if(!e.isPrimary||e.button!==0){inputState.battlefieldPointer=null;return;}
     inputState.battlefieldPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
    });
    lifetime.listen<PointerEvent>($('battlefield'),'pointercancel',()=>{inputState.battlefieldPointer=null;});
    lifetime.listen<PointerEvent>($('battlefield'),'pointerup',e=>{
     const start=inputState.battlefieldPointer;inputState.battlefieldPointer=null;
     if(root!.dataset.fieldMode==='field'){fieldControls.clear();return;}
     if(!start||!e.isPrimary||e.pointerId!==start.id||!ports.navState.entryEntered||ports.navState.modal||ports.navState.activeTab!=='battle'||ports.sessionState.game.state.phase!=='running'||ports.sessionState.game.state.paused||!ports.playable())return;
     const rect=$('battlefield').getBoundingClientRect();
     const order=battlefieldOrderFromGesture({startX:start.x,startY:start.y,endX:e.clientX,endY:e.clientY},{left:rect.left,top:rect.top,width:rect.width,height:rect.height});
     if(order)ports.action({type:'order',order});
    });
    lifetime.listen(dom.viewEvents(),'blur',()=>{inputState.battlefieldPointer=null;});
    lifetime.listen<PointerEvent>(root,'pointerup',e=>blockModalTap.recordPointer(e,dom.now()));
  }
  function listenClick():void {
    lifetime.listen<MouseEvent>(root,'click',e=>{
      const button=e.target instanceof Element?e.target.closest<HTMLButtonElement>('button'):null;
      if(!button||button.disabled)return;
      if(blockModalTap.blocks(e,ports.navState.modal,dom.now())){e.preventDefault();return;}
      if(e.detail===1)inputState.modalPointerSequence=ports.navState.modal!==null;
      else if(e.detail>1&&inputState.modalPointerSequence){
        e.preventDefault();
        if(!ports.navState.modal)root!.querySelector<HTMLElement>(`[data-tab="${ports.navState.activeTab}"]`)?.focus();
        return;
      }
      const command=button.dataset.command;
      if(command==='export'){ports.exportSave();return;}
      if(command==='session-continue'){ports.sessionState.retriedSession=true;void ports.acquireSession();return;}
      if(command==='session-temporary'){
        if(ports.sessionState.pagePresent&&ports.sessionState.session.playTemporarily()){
          ports.sessionState.sessionReady=true;ports.sessionState.hasPlayed=true;ports.clearPrestigeContext();ports.syncWeek();ports.closeModal(false);ports.rebuildArmy();ports.syncMotion();ports.switchTab('battle');
        }return;
      }
      // Also protects direct preference mutations and synthetic clicks on isolated controls.
      if(!ports.guardAction())return;
      if(ports.navState.modal&&!button.closest('#modal-layer'))return;
      if(!ports.navState.entryEntered&&!ports.navState.modal&&command!=='enter-world'&&command!=='reload-world'&&command!=='settings'&&command!=='home-camp'&&command!=='leave-battle')return;
      if(ports.handleCampInput(button))return;
      unlockAudio(ports.sessionState.game.profile.sound);
      if(command==='reload-world'){if(!ports.navState.entryEntered&&!ports.navState.modal&&$('battlefield').dataset.renderer==='failed')dom.reload();return;}
      if(command==='enter-world'){ports.enterWorld();return;}
      if(command==='home'){ports.showHome();return;}
      if(command==='home-camp'){ports.enterCamp();return;}
      if(command==='leave-battle'){ports.showLeaveBattle();return;}
      if(command==='confirm-leave-battle'){ports.leaveBattle();return;}
      if(command==='field-pause'){ports.showFieldPause();return;}
      if(command==='field-resume'){if(ports.navState.modal==='field-pause'){ports.sessionState.manualPaused=false;ports.closeModal();}return;}
      if(command==='field-dismiss'){fieldControls.clear();return;}
      if(button.dataset.fieldContext){fieldControls.select(button.dataset.fieldContext,ports.sessionState.game);return;}
      if(button.closest('#field-targets'))fieldControls.clear();
      if(command==='result-details'){ports.showResultDetails();return;}
      if(command==='result-back'){if(ports.navState.modal==='result'||ports.navState.modal==='result-expedition')ports.showResult('result-details');return;}
      if(command==='result-expedition'){if(ports.navState.modal==='result'&&ports.sessionState.game.state.phase==='won'&&ports.sessionState.game.profile.chronicle?.expedition&&ports.sessionState.game.profile.chronicle.expedition.stage<2)ports.showModal('result-expedition',expeditionChoiceHtml());return;}
      if(command==='continue-with-provision'){ports.continueWithProvision(button.dataset.provision);return;}
      if(command==='journey'){ports.showModal('journey',journeyScreenHtml(ports.sessionState.game.profile,ports.sessionState.game.state));return;}
      if(command==='journey-result'){if(ports.navState.modal==='journey'&&(ports.sessionState.game.state.phase==='won'||ports.sessionState.game.state.phase==='lost'))ports.showResult();return;}
      if(button.dataset.journeyTab){if(ports.navState.modal==='journey'&&['cards','battle'].includes(button.dataset.journeyTab)){ports.closeModal(false);ports.switchTab(button.dataset.journeyTab);}return;}
      if(button.dataset.order){ports.action({type:'order',order:button.dataset.order as 'advance'|'hold'});return;}
      if(command==='chronicle'){ports.showModal('chronicle',chronicleScreenHtml(ports.sessionState.game.profile,ports.sessionState.game.state));return;}
      if(button.dataset.storyPage!==undefined){
        const page=Number(button.dataset.storyPage);if(Number.isInteger(page)&&page>=0&&page<=ports.sessionState.game.profile.furthestBattle)ports.showModal('chronicle',chronicleScreenHtml(ports.sessionState.game.profile,ports.sessionState.game.state,page));return;
      }
      const storyAction=chronicleActionFromData(button.dataset);
      if(storyAction){
        if(ports.action(storyAction)&&ports.playable()&&ports.navState.modal!=='session')ports.showStoryFollowUp(storyFollowUp(storyAction.type,ports.sessionState.game.state.phase));
        return;
      }
      if(button.dataset.tab){ports.switchTab(button.dataset.tab);return;}
      if(routeDataAction(button,command))return;
      const handler=button.dataset.command;
      if(handler&&Object.hasOwn(commandHandlers,handler))commandHandlers[handler](button);
    });
  }
  function listenForm():void {
    lifetime.listen<Event>(root,'input',e=>{
      const input=e.target;
      if(!(input instanceof HTMLInputElement)||input.type!=='range'||(input.id!=='effects-volume'&&input.id!=='atmosphere-volume')||ports.navState.modal!=='settings'||!$('modal-layer').contains(input))return;
      // A same-document foreign save has no storage notification here. Check the
      // session before changing intent, writing preferences or retargeting buses.
      if(!ports.guardAction()||ports.navState.modal!=='settings'||!$('modal-layer').contains(input))return;
      const family=input.id==='effects-volume'?'effects':'atmosphere';
      ports.sessionState.audioMix=normalizeAudioMix({...ports.sessionState.audioMix,[family]:input.valueAsNumber});
      saveAudioMix(ports.sessionState.audioMix);updateAudioMix(ports.sessionState.audioMix);
      const percentage=`${ports.sessionState.audioMix[family]}%`;
      input.value=String(ports.sessionState.audioMix[family]);input.setAttribute('aria-valuetext',percentage);
      textIfChanged($(`${input.id}-value`),percentage);
    });
    lifetime.listen<Event>(root,'change',async e=>{
      const input=e.target;
      if(input instanceof HTMLSelectElement&&input.dataset.questSelect!==undefined){
        if(ports.navState.modal!=='quests'||!$('modal-layer').contains(input)||input!==$('quest-goal')||!ports.guardAction()||ports.navState.modal!=='quests')return;
        if(!questRecords(ports.sessionState.game.profile,localDay()).some(record=>record.key===input.value))return;
        ports.questState.questSelection=input.value;ports.refreshQuestRecord();return;
      }
      if(input instanceof HTMLInputElement||input instanceof HTMLSelectElement){
        const preference=input.dataset.preference;
        if(preference){
          if(ports.navState.modal!=='settings'||!input.closest('#modal-layer')||!ports.guardAction()||ports.navState.modal!=='settings')return;
          if(input instanceof HTMLInputElement&&input.type==='checkbox'){
            if(preference==='sound'){ports.sessionState.game.profile.sound=input.checked;if(input.checked)unlockAudio(true);else suspendAudio();}
            else if(preference==='atmosphere'){ports.sessionState.atmosphereEnabled=input.checked;saveAtmosphere(ports.sessionState.atmosphereEnabled);ports.syncPause();return;}
            else if(preference==='marks'){if(input.checked)ports.sessionState.game.profile.marks=true;else delete ports.sessionState.game.profile.marks;ports.syncMarks();}
            else return;
          }else if(input instanceof HTMLSelectElement){
            if(preference==='speed'&&(input.value==='1'||input.value==='2'))ports.sessionState.game.profile.speed=Number(input.value) as 1|2;
            else if(preference==='motion'&&(input.value==='system'||input.value==='reduced')){ports.sessionState.game.profile.motion=input.value;ports.syncMotion();}
            else return;
          }else return;
          ports.persist();ports.syncPause();ports.update(true);if(ports.navState.modal==='settings')textIfChanged($('preference-status'),ports.preferenceNotice());return;
        }
      }
      if(!(input instanceof HTMLInputElement))return;
      if(input.type==='radio'&&isLegacyChoice(input.value)&&input.checked){
        if(input.name==='prestige-legacy'){
          if(ports.navState.modal!=='prestige'||!input.closest('#modal-layer')||!ports.guardAction())return;
          ports.navState.prestigeDraft=input.value;ports.refreshPrestige();return;
        }
        if(input.name==='ready-legacy'){
          if(ports.navState.modal||ports.navState.activeTab!=='evolution'||!input.closest('#secondary-screen')||ports.sessionState.game.state.phase!=='ready'||ports.sessionState.game.profile.legacy.rank===0||!ports.guardAction())return;
          ports.action({type:'select-legacy',legacy:input.value});
          if(ports.playable()&&ports.navState.modal!=='session')ports.renderScreen(true);
          return;
        }
      }
      if(input.id!=='import-save'||ports.navState.modal!=='save-recovery')return;
      const request=++inputState.importRequest;
      if(ports.sessionState.session.status!=='active'||!ports.guardAction())return;
      const file=input.files?.[0],version=ports.navState.modalVersion;if(!file)return;
      if(file.size>MAX_SAVE_CHARS){ports.toast('Choose a save file smaller than 100 KB.');input.value='';return;}
      try{
        const decoded=importBackup(await file.text());
        if(request!==inputState.importRequest||lifetime.disposed||version!==ports.navState.modalVersion||ports.navState.modal!=='save-recovery'||ports.sessionState.session.status!=='active'||!ports.guardAction())return;
        if(!decoded.ok){ports.toast(decoded.error);input.value='';return;}
        ports.navState.pendingImport=decoded.profile;
        ports.showModal('import',`<h2 id="dialog-title">Replace this save?</h2><p>Import timeline ${ports.navState.pendingImport.timeline}, ${chapterPresentation(ports.navState.pendingImport.age).title}, with ${money(ports.navState.pendingImport.coins)} coins.</p><p>Your current progress in this browser will be replaced. Export it first to keep a separate copy.</p><button class="big-button blue" data-command="confirm-import">REPLACE WITH THIS SAVE</button><button class="big-button secondary" data-command="close">CANCEL</button>`,'close');
      }catch{
        if(request!==inputState.importRequest||lifetime.disposed||version!==ports.navState.modalVersion||ports.navState.modal!=='save-recovery'||ports.sessionState.session.status!=='active'||!ports.guardAction())return;
        input.value='';
        ports.toast('The selected file could not be read. Your current game was not changed.');
      }
    });
  }
  function listenKeys():void {
    lifetime.listen<KeyboardEvent>(dom.pageEvents(),'keydown',e=>{
      if(ports.navState.modal){
        if(e.key==='Escape'){ports.dismissModal();e.preventDefault();}
        if(e.key==='Tab'){
          const elements=modalFocusables($('modal-layer')),index=nextFocusIndex(elements.indexOf(dom.activeElement() as HTMLElement),elements.length,e.shiftKey);
          e.preventDefault();(index===null?$('modal-layer').querySelector<HTMLElement>('.dialog'):elements[index])?.focus();
        }return;
      }
      if(e.key==='Escape'&&ports.navState.entryEntered){if(ports.navState.campOwner?.kind==='advanced')ports.returnToCamp();else fieldControls.clear();e.preventDefault();return;}
      if(!ports.navState.entryEntered||!ports.guardAction()||ports.navState.campOwner||ports.navState.activeTab!=='battle'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||dom.hidden()||isEditingTarget(e.target instanceof HTMLElement?e.target:null))return;
      if(['1','2','3'].includes(e.key)){e.preventDefault();ports.action({type:'spawn',kind:(Number(e.key)-1) as UnitKind});}
      const skillIndex=['q','w','e'].indexOf(e.key.toLowerCase());
      if(skillIndex>=0){e.preventDefault();ports.action({type:'skill',skill:(['freeze','meteor','food'] as Skill[])[skillIndex]});}
      if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){
        e.preventDefault();if(ports.sessionState.game.state.phase==='ready')ports.action({type:'start'});else if(ports.sessionState.game.state.phase==='running'){ports.sessionState.manualPaused=!ports.sessionState.manualPaused;ports.syncPause();ports.update(true);}
      }
    });
  }
  function listenPage():void {
    lifetime.listen(root,'visual-fallback',()=>ports.toast('Some artwork could not load. The simplified battlefield is active.'));
    lifetime.listen<StorageEvent>(dom.viewEvents(),'storage',event=>{
      if(event.key===SAVE_KEY||event.key===BACKUP_KEY||event.key===null)ports.sessionState.session.check();
    });
    lifetime.listen(dom.viewEvents(),'focus',()=>{if(ports.sessionState.pagePresent)ports.sessionState.session.check();ports.syncPause();});
    lifetime.listen(dom.pageEvents(),'visibilitychange',()=>{
      if(dom.hidden()){ports.persist();ports.syncPause();suspendAudio();}
      else{ports.sessionState.session.check();ports.syncPause();}
    });
    lifetime.listen(dom.viewEvents(),'pagehide',ports.suspendSession);
    lifetime.listen(dom.viewEvents(),'pageshow',()=>{
      ports.sessionState.pagePresent=true;
      if(ports.sessionState.session.status==='temporary'){ports.sessionState.sessionReady=true;ports.syncPause();}
      else if(ports.sessionState.resumeOwnership){ports.sessionState.resumeOwnership=false;void ports.acquireSession();}
    });
    lifetime.listen(motionQuery,'change',ports.syncMotion);
  }
  listenPointer();listenClick();listenForm();listenKeys();listenPage();
}
