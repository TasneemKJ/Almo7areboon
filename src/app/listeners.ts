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
import type { AppState } from './state.ts';
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** What the listeners module needs: its slice of state, DOM handles and sibling operations. */
export interface ListenersDeps {
  state: Pick<AppState, 'activeTab' | 'atmosphereEnabled' | 'audioMix' | 'battlefieldPointer' | 'campOwner' | 'entryEntered' | 'evolutionFromResult' | 'game' | 'hasPlayed' | 'importRequest' | 'manualPaused' | 'modal' | 'modalPointerSequence' | 'modalVersion' | 'pagePresent' | 'pendingImport' | 'prestigeDraft' | 'prestigeExpectedTimeline' | 'prestigeOrigin' | 'questSelection' | 'resumeOwnership' | 'retriedSession' | 'savedWarning' | 'session' | 'sessionReady'>;
  dom: Pick<Runtime, '$' | 'blockModalTap' | 'fieldControls' | 'lifetime' | 'money' | 'motionQuery' | 'root'>;
  ports: Pick<ShellApi, 'acquireSession' | 'action' | 'adoptRestoredGame' | 'claimQuestRecord' | 'clearPrestigeContext' | 'closeModal' | 'continueWithProvision' | 'dismissModal' | 'enterCamp' | 'enterWorld' | 'exportSave' | 'guardAction' | 'handleCampInput' | 'leaveBattle' | 'openPrestige' | 'persist' | 'playable' | 'preferenceNotice' | 'rebuildArmy' | 'refreshPrestige' | 'refreshQuestRecord' | 'renderScreen' | 'returnToCamp' | 'returnToChapters' | 'showFieldPause' | 'showHome' | 'showLeaveBattle' | 'showModal' | 'showQuests' | 'showResult' | 'showResultDetails' | 'showSaveRecovery' | 'showSettings' | 'showStoryFollowUp' | 'suspendSession' | 'switchTab' | 'syncMarks' | 'syncMotion' | 'syncPause' | 'syncWeek' | 'toast' | 'update'>;
}

export function installListeners(deps: ListenersDeps): void {
  const { state, ports } = deps;
  const { $, blockModalTap, fieldControls, lifetime, money, motionQuery, root } = deps.dom;
  const commandHandlers:Record<string,(button:HTMLButtonElement)=>void>={
    'start':()=>{state.manualPaused=false;if(ports.action({type:'start'})){root!.dataset.fieldMode='field';ports.update(true);}},
    'upgrade-food':()=>{ports.action({type:'upgrade',stat:'food'});},
    'upgrade-base':()=>{ports.action({type:'upgrade',stat:'base'});},
    'battles':()=>{ports.showModal('battles',battleSelectionHtml(state.game.profile,state.game.state));},
    'wave-help':()=>{if(state.game.state.phase==='running')ports.showModal('wave-help',waveInspectionHtml(state.game.waveStatus(),state.game.state.chronicle?.enabled?state.game.state.chronicle.objective:undefined));},
    'evolve':()=>{const html=evolutionDialogHtml(state.game.profile,state.game.state);if(html){state.evolutionFromResult=state.modal==='result';ports.showModal('evolve',html);};},
    'confirm-evolve':()=>{
      const returnToResult=state.evolutionFromResult,ok=ports.action({type:'evolve'});
      if(!ports.playable()||state.modal==='session')return;
      if(ok){
        state.evolutionFromResult=false;
        {const deck=$('unit-cards');deck.dataset.evolveReveal=deck.dataset.evolveReveal==='a'?'b':'a';}
        if(returnToResult)ports.showResult();else{ports.closeModal(false);ports.switchTab('battle');}
        if(!state.savedWarning)ports.toast(`Entering ${chapterPresentation(state.game.profile.age).title}.`);
      }else{
        const html=evolutionDialogHtml(state.game.profile,state.game.state);
        if(html)ports.showModal('evolve',html);else ports.dismissModal();
      }
    },
    'return-chapters':()=>{ports.returnToChapters();},
    'regroup-chapters':()=>{
      const suggested=earlierChapter(state.game.profile);
      if(state.modal!=='result'||state.game.state.phase!=='lost'||suggested===null)return;
      if(!ports.action({type:'retry'})||!ports.playable()||(state.modal as string|null)==='session')return;
      state.evolutionFromResult=false;state.manualPaused=false;ports.closeModal(false);ports.switchTab('battle');
      ports.showModal('battles',battleSelectionHtml(state.game.profile,state.game.state,true),`choose-battle-${suggested}`);
    },
    'next':()=>{
      const advancement=advanceStatus(state.game.profile,state.game.state);
      if(advancement.allowed&&advancement.target==='timeline'){ports.openPrestige();return;}
      if(ports.action({type:'next'})&&ports.playable()&&state.modal!=='session'){state.evolutionFromResult=false;ports.closeModal(false);state.manualPaused=false;ports.switchTab('battle');}
    },
    'retry':()=>{if(ports.action({type:'retry'})&&ports.playable()&&state.modal!=='session'){state.evolutionFromResult=false;ports.closeModal(false);state.manualPaused=false;ports.switchTab('battle');};},
    'confirm-prestige':()=>{
      if(state.modal!=='prestige'||!state.prestigeOrigin||state.prestigeExpectedTimeline===null||!isLegacyChoice(state.prestigeDraft))return;
      const ok=ports.action({type:'prestige',expectedTimeline:state.prestigeExpectedTimeline,legacy:state.prestigeDraft});
      // The guarded writer can synchronously replace the narrowed prestige modal.
      if(!ports.playable()||(state.modal as string|null)==='session')return;
      if(ok){ports.clearPrestigeContext();state.evolutionFromResult=false;state.manualPaused=false;ports.closeModal(false);ports.switchTab('battle');}
      else ports.refreshPrestige();
    },
    'pause':()=>{if(state.game.state.phase==='running'){state.manualPaused=!state.manualPaused;ports.syncPause();ports.update(true);}},
    'speed':()=>{state.game.profile.speed=state.game.profile.speed===1?2:1;ports.persist();ports.update(true);if(state.modal==='settings'&&ports.playable())ports.showSettings();},
    'settings':()=>{ports.persist();ports.showSettings();},
    'quests':()=>{ports.showQuests();},
    'save-recovery':()=>{ports.showSaveRecovery();},
    'import':()=>{if(state.modal==='save-recovery'&&state.session.status==='active')$('import-save')?.click();},
    'reset':()=>{if(state.modal!=='settings'||state.session.status!=='active')return;ports.showModal('reset',`<h2 id="dialog-title">Start over?</h2><p>This deletes your progress on this browser: your age, coins, upgrades, unlocked battles, every card and all gems, quests and records.</p><p>Your sound, speed, motion and troop-shape choices stay. Export a save first if you might want this progress back.</p><button class="big-button blue" data-command="export">EXPORT SAVE FIRST</button><button class="big-button danger" data-command="confirm-reset">DELETE PROGRESS AND START OVER</button><button class="big-button secondary" data-command="close">KEEP MY PROGRESS</button>`,'close');},
    'confirm-reset':()=>{
      if(state.modal!=='reset'||state.session.status!=='active')return;
      const restored=restoreBackupWithSave(state.game,startOverProfile(state.game.profile),profile=>{syncWeekly(profile,weekId(localDay()));return state.session.save(profile).ok;});
      if(!restored.ok){ports.toast('The new game could not be saved. Your current progress was not deleted.');return;}
      ports.adoptRestoredGame(restored.game);ports.toast('Started a new game.');
    },
    'confirm-import':()=>{
      if(state.modal!=='import'||!state.pendingImport||state.session.status!=='active')return;const restored=restoreBackupWithSave(state.game,state.pendingImport,profile=>{syncWeekly(profile,weekId(localDay()));return state.session.save(profile).ok;});
      if(!restored.ok){ports.toast('The save could not be written. Your current game was not replaced.');return;}
      ports.adoptRestoredGame(restored.game);ports.toast('Save restored.');
    },
    'close':()=>{ports.dismissModal();},
  };
  function routeDataAction(button:HTMLButtonElement,command:string|undefined):boolean {
    if(button.dataset.unit!==undefined){const kind=Number(button.dataset.unit) as UnitKind;if(!state.game.profile.unlocked[kind]){if(ports.action({type:'unlock',kind})&&ports.playable()&&!state.savedWarning)ports.toast(troopUnlockMessage(state.game.profile,state.game.state.phase,kind,state.game.deploymentStatus(kind)),7000);}else ports.action({type:'spawn',kind});return true;}
    if(button.dataset.skill){if(ports.action({type:'skill',skill:button.dataset.skill as Skill}))fieldControls.clear();return true;}
    if(command==='quest-claim'){ports.claimQuestRecord(button);return true;}
    if(button.dataset.weekly){
      // A previously rendered claim cannot settle an expired or future local week. Rejection never syncs.
      const week=claimableWeek(button.dataset.weekly,weekId(localDay()));
      if(week===null)return true;
      if(ports.action({type:'weekly',week}))ports.showQuests();return true;
    }
    if(button.dataset.daily){if(ports.action({type:'daily',day:Number(button.dataset.daily)}))ports.showQuests();return true;}
    if(button.dataset.claim){const fromJourney=state.modal==='journey';if(ports.action({type:'claim',id:button.dataset.claim})){if(fromJourney&&ports.playable()&&state.modal!=='session')ports.showModal('journey',journeyScreenHtml(state.game.profile,state.game.state));else ports.showQuests();}return true;}
    if(button.dataset.battle!==undefined){if(ports.action({type:'select-battle',battle:Number(button.dataset.battle)}))ports.closeModal();return true;}
    if(button.dataset.pack!==undefined){
      const before=[...state.game.profile.cards],count=Number(button.dataset.pack) as 1|10|50;
      if(ports.action({type:'summon',count})&&ports.playable())ports.showModal('summon',summonedCardsHtml(before,state.game.profile));
      else ports.toast('This pack is unavailable. Your gems were not spent.');return true;
    }
    return false;
  }
  function listenPointer():void {
    lifetime.listen<PointerEvent>($('battlefield'),'pointerdown',e=>{
     if(!e.isPrimary||e.button!==0){state.battlefieldPointer=null;return;}
     state.battlefieldPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
    });
    lifetime.listen<PointerEvent>($('battlefield'),'pointercancel',()=>{state.battlefieldPointer=null;});
    lifetime.listen<PointerEvent>($('battlefield'),'pointerup',e=>{
     const start=state.battlefieldPointer;state.battlefieldPointer=null;
     if(root!.dataset.fieldMode==='field'){fieldControls.clear();return;}
     if(!start||!e.isPrimary||e.pointerId!==start.id||!state.entryEntered||state.modal||state.activeTab!=='battle'||state.game.state.phase!=='running'||state.game.state.paused||!ports.playable())return;
     const rect=$('battlefield').getBoundingClientRect();
     const order=battlefieldOrderFromGesture({startX:start.x,startY:start.y,endX:e.clientX,endY:e.clientY},{left:rect.left,top:rect.top,width:rect.width,height:rect.height});
     if(order)ports.action({type:'order',order});
    });
    lifetime.listen(window,'blur',()=>{state.battlefieldPointer=null;});
    lifetime.listen<PointerEvent>(root,'pointerup',e=>blockModalTap.recordPointer(e,performance.now()));
  }
  function listenClick():void {
    lifetime.listen<MouseEvent>(root,'click',e=>{
      const button=e.target instanceof Element?e.target.closest<HTMLButtonElement>('button'):null;
      if(!button||button.disabled)return;
      if(blockModalTap.blocks(e,state.modal,performance.now())){e.preventDefault();return;}
      if(e.detail===1)state.modalPointerSequence=state.modal!==null;
      else if(e.detail>1&&state.modalPointerSequence){
        e.preventDefault();
        if(!state.modal)root!.querySelector<HTMLElement>(`[data-tab="${state.activeTab}"]`)?.focus();
        return;
      }
      const command=button.dataset.command;
      if(command==='export'){ports.exportSave();return;}
      if(command==='session-continue'){state.retriedSession=true;void ports.acquireSession();return;}
      if(command==='session-temporary'){
        if(state.pagePresent&&state.session.playTemporarily()){
          state.sessionReady=true;state.hasPlayed=true;ports.clearPrestigeContext();ports.syncWeek();ports.closeModal(false);ports.rebuildArmy();ports.syncMotion();ports.switchTab('battle');
        }return;
      }
      // Also protects direct preference mutations and synthetic clicks on isolated controls.
      if(!ports.guardAction())return;
      if(state.modal&&!button.closest('#modal-layer'))return;
      if(!state.entryEntered&&!state.modal&&command!=='enter-world'&&command!=='reload-world'&&command!=='settings'&&command!=='home-camp'&&command!=='leave-battle')return;
      if(ports.handleCampInput(button))return;
      unlockAudio(state.game.profile.sound);
      if(command==='reload-world'){if(!state.entryEntered&&!state.modal&&$('battlefield').dataset.renderer==='failed')window.location.reload();return;}
      if(command==='enter-world'){ports.enterWorld();return;}
      if(command==='home'){ports.showHome();return;}
      if(command==='home-camp'){ports.enterCamp();return;}
      if(command==='leave-battle'){ports.showLeaveBattle();return;}
      if(command==='confirm-leave-battle'){ports.leaveBattle();return;}
      if(command==='field-pause'){ports.showFieldPause();return;}
      if(command==='field-resume'){if(state.modal==='field-pause'){state.manualPaused=false;ports.closeModal();}return;}
      if(command==='field-dismiss'){fieldControls.clear();return;}
      if(button.dataset.fieldContext){fieldControls.select(button.dataset.fieldContext,state.game);return;}
      if(button.closest('#field-targets'))fieldControls.clear();
      if(command==='result-details'){ports.showResultDetails();return;}
      if(command==='result-back'){if(state.modal==='result'||state.modal==='result-expedition')ports.showResult('result-details');return;}
      if(command==='result-expedition'){if(state.modal==='result'&&state.game.state.phase==='won'&&state.game.profile.chronicle?.expedition&&state.game.profile.chronicle.expedition.stage<2)ports.showModal('result-expedition',expeditionChoiceHtml());return;}
      if(command==='continue-with-provision'){ports.continueWithProvision(button.dataset.provision);return;}
      if(command==='journey'){ports.showModal('journey',journeyScreenHtml(state.game.profile,state.game.state));return;}
      if(command==='journey-result'){if(state.modal==='journey'&&(state.game.state.phase==='won'||state.game.state.phase==='lost'))ports.showResult();return;}
      if(button.dataset.journeyTab){if(state.modal==='journey'&&['cards','battle'].includes(button.dataset.journeyTab)){ports.closeModal(false);ports.switchTab(button.dataset.journeyTab);}return;}
      if(button.dataset.order){ports.action({type:'order',order:button.dataset.order as 'advance'|'hold'});return;}
      if(command==='chronicle'){ports.showModal('chronicle',chronicleScreenHtml(state.game.profile,state.game.state));return;}
      if(button.dataset.storyPage!==undefined){
        const page=Number(button.dataset.storyPage);if(Number.isInteger(page)&&page>=0&&page<=state.game.profile.furthestBattle)ports.showModal('chronicle',chronicleScreenHtml(state.game.profile,state.game.state,page));return;
      }
      const storyAction=chronicleActionFromData(button.dataset);
      if(storyAction){
        if(ports.action(storyAction)&&ports.playable()&&state.modal!=='session')ports.showStoryFollowUp(storyFollowUp(storyAction.type,state.game.state.phase));
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
      if(!(input instanceof HTMLInputElement)||input.type!=='range'||(input.id!=='effects-volume'&&input.id!=='atmosphere-volume')||state.modal!=='settings'||!$('modal-layer').contains(input))return;
      // A same-document foreign save has no storage notification here. Check the
      // session before changing intent, writing preferences or retargeting buses.
      if(!ports.guardAction()||state.modal!=='settings'||!$('modal-layer').contains(input))return;
      const family=input.id==='effects-volume'?'effects':'atmosphere';
      state.audioMix=normalizeAudioMix({...state.audioMix,[family]:input.valueAsNumber});
      saveAudioMix(state.audioMix);updateAudioMix(state.audioMix);
      const percentage=`${state.audioMix[family]}%`;
      input.value=String(state.audioMix[family]);input.setAttribute('aria-valuetext',percentage);
      textIfChanged($(`${input.id}-value`),percentage);
    });
    lifetime.listen<Event>(root,'change',async e=>{
      const input=e.target;
      if(input instanceof HTMLSelectElement&&input.dataset.questSelect!==undefined){
        if(state.modal!=='quests'||!$('modal-layer').contains(input)||input!==$('quest-goal')||!ports.guardAction()||state.modal!=='quests')return;
        if(!questRecords(state.game.profile,localDay()).some(record=>record.key===input.value))return;
        state.questSelection=input.value;ports.refreshQuestRecord();return;
      }
      if(input instanceof HTMLInputElement||input instanceof HTMLSelectElement){
        const preference=input.dataset.preference;
        if(preference){
          if(state.modal!=='settings'||!input.closest('#modal-layer')||!ports.guardAction()||state.modal!=='settings')return;
          if(input instanceof HTMLInputElement&&input.type==='checkbox'){
            if(preference==='sound'){state.game.profile.sound=input.checked;if(input.checked)unlockAudio(true);else suspendAudio();}
            else if(preference==='atmosphere'){state.atmosphereEnabled=input.checked;saveAtmosphere(state.atmosphereEnabled);ports.syncPause();return;}
            else if(preference==='marks'){if(input.checked)state.game.profile.marks=true;else delete state.game.profile.marks;ports.syncMarks();}
            else return;
          }else if(input instanceof HTMLSelectElement){
            if(preference==='speed'&&(input.value==='1'||input.value==='2'))state.game.profile.speed=Number(input.value) as 1|2;
            else if(preference==='motion'&&(input.value==='system'||input.value==='reduced')){state.game.profile.motion=input.value;ports.syncMotion();}
            else return;
          }else return;
          ports.persist();ports.syncPause();ports.update(true);if(state.modal==='settings')textIfChanged($('preference-status'),ports.preferenceNotice());return;
        }
      }
      if(!(input instanceof HTMLInputElement))return;
      if(input.type==='radio'&&isLegacyChoice(input.value)&&input.checked){
        if(input.name==='prestige-legacy'){
          if(state.modal!=='prestige'||!input.closest('#modal-layer')||!ports.guardAction())return;
          state.prestigeDraft=input.value;ports.refreshPrestige();return;
        }
        if(input.name==='ready-legacy'){
          if(state.modal||state.activeTab!=='evolution'||!input.closest('#secondary-screen')||state.game.state.phase!=='ready'||state.game.profile.legacy.rank===0||!ports.guardAction())return;
          ports.action({type:'select-legacy',legacy:input.value});
          if(ports.playable()&&state.modal!=='session')ports.renderScreen(true);
          return;
        }
      }
      if(input.id!=='import-save'||state.modal!=='save-recovery')return;
      const request=++state.importRequest;
      if(state.session.status!=='active'||!ports.guardAction())return;
      const file=input.files?.[0],version=state.modalVersion;if(!file)return;
      if(file.size>MAX_SAVE_CHARS){ports.toast('Choose a save file smaller than 100 KB.');input.value='';return;}
      try{
        const decoded=importBackup(await file.text());
        if(request!==state.importRequest||lifetime.disposed||version!==state.modalVersion||state.modal!=='save-recovery'||state.session.status!=='active'||!ports.guardAction())return;
        if(!decoded.ok){ports.toast(decoded.error);input.value='';return;}
        state.pendingImport=decoded.profile;
        ports.showModal('import',`<h2 id="dialog-title">Replace this save?</h2><p>Import timeline ${state.pendingImport.timeline}, ${chapterPresentation(state.pendingImport.age).title}, with ${money(state.pendingImport.coins)} coins.</p><p>Your current progress in this browser will be replaced. Export it first to keep a separate copy.</p><button class="big-button blue" data-command="confirm-import">REPLACE WITH THIS SAVE</button><button class="big-button secondary" data-command="close">CANCEL</button>`,'close');
      }catch{
        if(request!==state.importRequest||lifetime.disposed||version!==state.modalVersion||state.modal!=='save-recovery'||state.session.status!=='active'||!ports.guardAction())return;
        input.value='';
        ports.toast('The selected file could not be read. Your current game was not changed.');
      }
    });
  }
  function listenKeys():void {
    lifetime.listen<KeyboardEvent>(document,'keydown',e=>{
      if(state.modal){
        if(e.key==='Escape'){ports.dismissModal();e.preventDefault();}
        if(e.key==='Tab'){
          const elements=modalFocusables($('modal-layer')),index=nextFocusIndex(elements.indexOf(document.activeElement as HTMLElement),elements.length,e.shiftKey);
          e.preventDefault();(index===null?$('modal-layer').querySelector<HTMLElement>('.dialog'):elements[index])?.focus();
        }return;
      }
      if(e.key==='Escape'&&state.entryEntered){if(state.campOwner?.kind==='advanced')ports.returnToCamp();else fieldControls.clear();e.preventDefault();return;}
      if(!state.entryEntered||!ports.guardAction()||state.campOwner||state.activeTab!=='battle'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||document.hidden||isEditingTarget(e.target instanceof HTMLElement?e.target:null))return;
      if(['1','2','3'].includes(e.key)){e.preventDefault();ports.action({type:'spawn',kind:(Number(e.key)-1) as UnitKind});}
      const skillIndex=['q','w','e'].indexOf(e.key.toLowerCase());
      if(skillIndex>=0){e.preventDefault();ports.action({type:'skill',skill:(['freeze','meteor','food'] as Skill[])[skillIndex]});}
      if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){
        e.preventDefault();if(state.game.state.phase==='ready')ports.action({type:'start'});else if(state.game.state.phase==='running'){state.manualPaused=!state.manualPaused;ports.syncPause();ports.update(true);}
      }
    });
  }
  function listenPage():void {
    lifetime.listen(root,'visual-fallback',()=>ports.toast('Some artwork could not load. The simplified battlefield is active.'));
    lifetime.listen<StorageEvent>(window,'storage',event=>{
      if(event.key===SAVE_KEY||event.key===BACKUP_KEY||event.key===null)state.session.check();
    });
    lifetime.listen(window,'focus',()=>{if(state.pagePresent)state.session.check();ports.syncPause();});
    lifetime.listen(document,'visibilitychange',()=>{
      if(document.hidden){ports.persist();ports.syncPause();suspendAudio();}
      else{state.session.check();ports.syncPause();}
    });
    lifetime.listen(window,'pagehide',ports.suspendSession);
    lifetime.listen(window,'pageshow',()=>{
      state.pagePresent=true;
      if(state.session.status==='temporary'){state.sessionReady=true;ports.syncPause();}
      else if(state.resumeOwnership){state.resumeOwnership=false;void ports.acquireSession();}
    });
    lifetime.listen(motionQuery,'change',ports.syncMotion);
  }
  listenPointer();listenClick();listenForm();listenKeys();listenPage();
}
