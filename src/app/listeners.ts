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
import { $, blockModalTap, fieldControls, lifetime, money, motionQuery, root } from './runtime.ts';
import { app } from './state.ts';
import { acquireSession, action, adoptRestoredGame, exportSave, guardAction, persist, playable, rebuildArmy, suspendSession, syncMarks, syncMotion, syncPause, toast, update } from './lifecycle.ts';
import { clearPrestigeContext, closeModal, continueWithProvision, dismissModal, enterCamp, enterWorld, handleCampInput, leaveBattle, openPrestige, preferenceNotice, refreshPrestige, renderScreen, returnToCamp, returnToChapters, showFieldPause, showHome, showLeaveBattle, showModal, showResult, showResultDetails, showSaveRecovery, showSettings, showStoryFollowUp, switchTab } from './navigation.ts';
import { claimQuestRecord, refreshQuestRecord, showQuests, syncWeek } from './quests.ts';

lifetime.listen<PointerEvent>($('battlefield'),'pointerdown',e=>{
 if(!e.isPrimary||e.button!==0){app.battlefieldPointer=null;return;}
 app.battlefieldPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
});
lifetime.listen<PointerEvent>($('battlefield'),'pointercancel',()=>{app.battlefieldPointer=null;});
lifetime.listen<PointerEvent>($('battlefield'),'pointerup',e=>{
 const start=app.battlefieldPointer;app.battlefieldPointer=null;
 if(root!.dataset.fieldMode==='field'){fieldControls.clear();return;}
 if(!start||!e.isPrimary||e.pointerId!==start.id||!app.entryEntered||app.modal||app.activeTab!=='battle'||app.game.state.phase!=='running'||app.game.state.paused||!playable())return;
 const rect=$('battlefield').getBoundingClientRect();
 const order=battlefieldOrderFromGesture({startX:start.x,startY:start.y,endX:e.clientX,endY:e.clientY},{left:rect.left,top:rect.top,width:rect.width,height:rect.height});
 if(order)action({type:'order',order});
});
lifetime.listen(window,'blur',()=>{app.battlefieldPointer=null;});
lifetime.listen<PointerEvent>(root,'pointerup',e=>blockModalTap.recordPointer(e,performance.now()));
const commandHandlers:Record<string,(button:HTMLButtonElement)=>void>={
  'start':()=>{app.manualPaused=false;if(action({type:'start'})){root!.dataset.fieldMode='field';update(true);}},
  'upgrade-food':()=>{action({type:'upgrade',stat:'food'});},
  'upgrade-base':()=>{action({type:'upgrade',stat:'base'});},
  'battles':()=>{showModal('battles',battleSelectionHtml(app.game.profile,app.game.state));},
  'wave-help':()=>{if(app.game.state.phase==='running')showModal('wave-help',waveInspectionHtml(app.game.waveStatus(),app.game.state.chronicle?.enabled?app.game.state.chronicle.objective:undefined));},
  'evolve':()=>{const html=evolutionDialogHtml(app.game.profile,app.game.state);if(html){app.evolutionFromResult=app.modal==='result';showModal('evolve',html);};},
  'confirm-evolve':()=>{
    const returnToResult=app.evolutionFromResult,ok=action({type:'evolve'});
    if(!playable()||app.modal==='session')return;
    if(ok){
      app.evolutionFromResult=false;
      {const deck=$('unit-cards');deck.dataset.evolveReveal=deck.dataset.evolveReveal==='a'?'b':'a';}
      if(returnToResult)showResult();else{closeModal(false);switchTab('battle');}
      if(!app.savedWarning)toast(`Entering ${chapterPresentation(app.game.profile.age).title}.`);
    }else{
      const html=evolutionDialogHtml(app.game.profile,app.game.state);
      if(html)showModal('evolve',html);else dismissModal();
    }
  },
  'return-chapters':()=>{returnToChapters();},
  'regroup-chapters':()=>{
    const suggested=earlierChapter(app.game.profile);
    if(app.modal!=='result'||app.game.state.phase!=='lost'||suggested===null)return;
    if(!action({type:'retry'})||!playable()||(app.modal as string|null)==='session')return;
    app.evolutionFromResult=false;app.manualPaused=false;closeModal(false);switchTab('battle');
    showModal('battles',battleSelectionHtml(app.game.profile,app.game.state,true),`choose-battle-${suggested}`);
  },
  'next':()=>{
    const advancement=advanceStatus(app.game.profile,app.game.state);
    if(advancement.allowed&&advancement.target==='timeline'){openPrestige();return;}
    if(action({type:'next'})&&playable()&&app.modal!=='session'){app.evolutionFromResult=false;closeModal(false);app.manualPaused=false;switchTab('battle');}
  },
  'retry':()=>{if(action({type:'retry'})&&playable()&&app.modal!=='session'){app.evolutionFromResult=false;closeModal(false);app.manualPaused=false;switchTab('battle');};},
  'confirm-prestige':()=>{
    if(app.modal!=='prestige'||!app.prestigeOrigin||app.prestigeExpectedTimeline===null||!isLegacyChoice(app.prestigeDraft))return;
    const ok=action({type:'prestige',expectedTimeline:app.prestigeExpectedTimeline,legacy:app.prestigeDraft});
    // The guarded writer can synchronously replace the narrowed prestige modal.
    if(!playable()||(app.modal as string|null)==='session')return;
    if(ok){clearPrestigeContext();app.evolutionFromResult=false;app.manualPaused=false;closeModal(false);switchTab('battle');}
    else refreshPrestige();
  },
  'pause':()=>{if(app.game.state.phase==='running'){app.manualPaused=!app.manualPaused;syncPause();update(true);}},
  'speed':()=>{app.game.profile.speed=app.game.profile.speed===1?2:1;persist();update(true);if(app.modal==='settings'&&playable())showSettings();},
  'settings':()=>{persist();showSettings();},
  'quests':()=>{showQuests();},
  'save-recovery':()=>{showSaveRecovery();},
  'import':()=>{if(app.modal==='save-recovery'&&app.session.status==='active')$('import-save')?.click();},
  'reset':()=>{if(app.modal!=='settings'||app.session.status!=='active')return;showModal('reset',`<h2 id="dialog-title">Start over?</h2><p>This deletes your progress on this browser: your age, coins, upgrades, unlocked battles, every card and all gems, quests and records.</p><p>Your sound, speed, motion and troop-shape choices stay. Export a save first if you might want this progress back.</p><button class="big-button blue" data-command="export">EXPORT SAVE FIRST</button><button class="big-button danger" data-command="confirm-reset">DELETE PROGRESS AND START OVER</button><button class="big-button secondary" data-command="close">KEEP MY PROGRESS</button>`,'close');},
  'confirm-reset':()=>{
    if(app.modal!=='reset'||app.session.status!=='active')return;
    const restored=restoreBackupWithSave(app.game,startOverProfile(app.game.profile),profile=>{syncWeekly(profile,weekId(localDay()));return app.session.save(profile).ok;});
    if(!restored.ok){toast('The new game could not be saved. Your current progress was not deleted.');return;}
    adoptRestoredGame(restored.game);toast('Started a new game.');
  },
  'confirm-import':()=>{
    if(app.modal!=='import'||!app.pendingImport||app.session.status!=='active')return;const restored=restoreBackupWithSave(app.game,app.pendingImport,profile=>{syncWeekly(profile,weekId(localDay()));return app.session.save(profile).ok;});
    if(!restored.ok){toast('The save could not be written. Your current game was not replaced.');return;}
    adoptRestoredGame(restored.game);toast('Save restored.');
  },
  'close':()=>{dismissModal();},
};
lifetime.listen<MouseEvent>(root,'click',e=>{
  const button=e.target instanceof Element?e.target.closest<HTMLButtonElement>('button'):null;
  if(!button||button.disabled)return;
  if(blockModalTap.blocks(e,app.modal,performance.now())){e.preventDefault();return;}
  if(e.detail===1)app.modalPointerSequence=app.modal!==null;
  else if(e.detail>1&&app.modalPointerSequence){
    e.preventDefault();
    if(!app.modal)root!.querySelector<HTMLElement>(`[data-tab="${app.activeTab}"]`)?.focus();
    return;
  }
  const command=button.dataset.command;
  if(command==='export'){exportSave();return;}
  if(command==='session-continue'){app.retriedSession=true;void acquireSession();return;}
  if(command==='session-temporary'){
    if(app.pagePresent&&app.session.playTemporarily()){
      app.sessionReady=true;app.hasPlayed=true;clearPrestigeContext();syncWeek();closeModal(false);rebuildArmy();syncMotion();switchTab('battle');
    }return;
  }
  // Also protects direct preference mutations and synthetic clicks on isolated controls.
  if(!guardAction())return;
  if(app.modal&&!button.closest('#modal-layer'))return;
  if(!app.entryEntered&&!app.modal&&command!=='enter-world'&&command!=='reload-world'&&command!=='settings'&&command!=='home-camp'&&command!=='leave-battle')return;
  if(handleCampInput(button))return;
  unlockAudio(app.game.profile.sound);
  if(command==='reload-world'){if(!app.entryEntered&&!app.modal&&$('battlefield').dataset.renderer==='failed')window.location.reload();return;}
  if(command==='enter-world'){enterWorld();return;}
  if(command==='home'){showHome();return;}
  if(command==='home-camp'){enterCamp();return;}
  if(command==='leave-battle'){showLeaveBattle();return;}
  if(command==='confirm-leave-battle'){leaveBattle();return;}
  if(command==='field-pause'){showFieldPause();return;}
  if(command==='field-resume'){if(app.modal==='field-pause'){app.manualPaused=false;closeModal();}return;}
  if(command==='field-dismiss'){fieldControls.clear();return;}
  if(button.dataset.fieldContext){fieldControls.select(button.dataset.fieldContext,app.game);return;}
  if(button.closest('#field-targets'))fieldControls.clear();
  if(command==='result-details'){showResultDetails();return;}
  if(command==='result-back'){if(app.modal==='result'||app.modal==='result-expedition')showResult('result-details');return;}
  if(command==='result-expedition'){if(app.modal==='result'&&app.game.state.phase==='won'&&app.game.profile.chronicle?.expedition&&app.game.profile.chronicle.expedition.stage<2)showModal('result-expedition',expeditionChoiceHtml());return;}
  if(command==='continue-with-provision'){continueWithProvision(button.dataset.provision);return;}
  if(command==='journey'){showModal('journey',journeyScreenHtml(app.game.profile,app.game.state));return;}
  if(command==='journey-result'){if(app.modal==='journey'&&(app.game.state.phase==='won'||app.game.state.phase==='lost'))showResult();return;}
  if(button.dataset.journeyTab){if(app.modal==='journey'&&['cards','battle'].includes(button.dataset.journeyTab)){closeModal(false);switchTab(button.dataset.journeyTab);}return;}
  if(button.dataset.order){action({type:'order',order:button.dataset.order as 'advance'|'hold'});return;}
  if(command==='chronicle'){showModal('chronicle',chronicleScreenHtml(app.game.profile,app.game.state));return;}
  if(button.dataset.storyPage!==undefined){
    const page=Number(button.dataset.storyPage);if(Number.isInteger(page)&&page>=0&&page<=app.game.profile.furthestBattle)showModal('chronicle',chronicleScreenHtml(app.game.profile,app.game.state,page));return;
  }
  const storyAction=chronicleActionFromData(button.dataset);
  if(storyAction){
    if(action(storyAction)&&playable()&&app.modal!=='session')showStoryFollowUp(storyFollowUp(storyAction.type,app.game.state.phase));
    return;
  }
  if(button.dataset.tab){switchTab(button.dataset.tab);return;}
  if(button.dataset.unit!==undefined){const kind=Number(button.dataset.unit) as UnitKind;if(!app.game.profile.unlocked[kind]){if(action({type:'unlock',kind})&&playable()&&!app.savedWarning)toast(troopUnlockMessage(app.game.profile,app.game.state.phase,kind,app.game.deploymentStatus(kind)),7000);}else action({type:'spawn',kind});return;}
  if(button.dataset.skill){if(action({type:'skill',skill:button.dataset.skill as Skill}))fieldControls.clear();return;}
  if(command==='quest-claim'){claimQuestRecord(button);return;}
  if(button.dataset.weekly){
    // A previously rendered claim cannot settle an expired or future local week. Rejection never syncs.
    const week=claimableWeek(button.dataset.weekly,weekId(localDay()));
    if(week===null)return;
    if(action({type:'weekly',week}))showQuests();return;
  }
  if(button.dataset.daily){if(action({type:'daily',day:Number(button.dataset.daily)}))showQuests();return;}
  if(button.dataset.claim){const fromJourney=app.modal==='journey';if(action({type:'claim',id:button.dataset.claim})){if(fromJourney&&playable()&&app.modal!=='session')showModal('journey',journeyScreenHtml(app.game.profile,app.game.state));else showQuests();}return;}
  if(button.dataset.battle!==undefined){if(action({type:'select-battle',battle:Number(button.dataset.battle)}))closeModal();return;}
  if(button.dataset.pack!==undefined){
    const before=[...app.game.profile.cards],count=Number(button.dataset.pack) as 1|10|50;
    if(action({type:'summon',count})&&playable())showModal('summon',summonedCardsHtml(before,app.game.profile));
    else toast('This pack is unavailable. Your gems were not spent.');return;
  }
  const handler=button.dataset.command;
  if(handler&&Object.hasOwn(commandHandlers,handler))commandHandlers[handler](button);
});
lifetime.listen<Event>(root,'input',e=>{
  const input=e.target;
  if(!(input instanceof HTMLInputElement)||input.type!=='range'||(input.id!=='effects-volume'&&input.id!=='atmosphere-volume')||app.modal!=='settings'||!$('modal-layer').contains(input))return;
  // A same-document foreign save has no storage notification here. Check the
  // session before changing intent, writing preferences or retargeting buses.
  if(!guardAction()||app.modal!=='settings'||!$('modal-layer').contains(input))return;
  const family=input.id==='effects-volume'?'effects':'atmosphere';
  app.audioMix=normalizeAudioMix({...app.audioMix,[family]:input.valueAsNumber});
  saveAudioMix(app.audioMix);updateAudioMix(app.audioMix);
  const percentage=`${app.audioMix[family]}%`;
  input.value=String(app.audioMix[family]);input.setAttribute('aria-valuetext',percentage);
  textIfChanged($(`${input.id}-value`),percentage);
});
lifetime.listen<Event>(root,'change',async e=>{
  const input=e.target;
  if(input instanceof HTMLSelectElement&&input.dataset.questSelect!==undefined){
    if(app.modal!=='quests'||!$('modal-layer').contains(input)||input!==$('quest-goal')||!guardAction()||app.modal!=='quests')return;
    if(!questRecords(app.game.profile,localDay()).some(record=>record.key===input.value))return;
    app.questSelection=input.value;refreshQuestRecord();return;
  }
  if(input instanceof HTMLInputElement||input instanceof HTMLSelectElement){
    const preference=input.dataset.preference;
    if(preference){
      if(app.modal!=='settings'||!input.closest('#modal-layer')||!guardAction()||app.modal!=='settings')return;
      if(input instanceof HTMLInputElement&&input.type==='checkbox'){
        if(preference==='sound'){app.game.profile.sound=input.checked;if(input.checked)unlockAudio(true);else suspendAudio();}
        else if(preference==='atmosphere'){app.atmosphereEnabled=input.checked;saveAtmosphere(app.atmosphereEnabled);syncPause();return;}
        else if(preference==='marks'){if(input.checked)app.game.profile.marks=true;else delete app.game.profile.marks;syncMarks();}
        else return;
      }else if(input instanceof HTMLSelectElement){
        if(preference==='speed'&&(input.value==='1'||input.value==='2'))app.game.profile.speed=Number(input.value) as 1|2;
        else if(preference==='motion'&&(input.value==='system'||input.value==='reduced')){app.game.profile.motion=input.value;syncMotion();}
        else return;
      }else return;
      persist();syncPause();update(true);if(app.modal==='settings')textIfChanged($('preference-status'),preferenceNotice());return;
    }
  }
  if(!(input instanceof HTMLInputElement))return;
  if(input.type==='radio'&&isLegacyChoice(input.value)&&input.checked){
    if(input.name==='prestige-legacy'){
      if(app.modal!=='prestige'||!input.closest('#modal-layer')||!guardAction())return;
      app.prestigeDraft=input.value;refreshPrestige();return;
    }
    if(input.name==='ready-legacy'){
      if(app.modal||app.activeTab!=='evolution'||!input.closest('#secondary-screen')||app.game.state.phase!=='ready'||app.game.profile.legacy.rank===0||!guardAction())return;
      action({type:'select-legacy',legacy:input.value});
      if(playable()&&app.modal!=='session')renderScreen(true);
      return;
    }
  }
  if(input.id!=='import-save'||app.modal!=='save-recovery')return;
  const request=++app.importRequest;
  if(app.session.status!=='active'||!guardAction())return;
  const file=input.files?.[0],version=app.modalVersion;if(!file)return;
  if(file.size>MAX_SAVE_CHARS){toast('Choose a save file smaller than 100 KB.');input.value='';return;}
  try{
    const decoded=importBackup(await file.text());
    if(request!==app.importRequest||lifetime.disposed||version!==app.modalVersion||app.modal!=='save-recovery'||app.session.status!=='active'||!guardAction())return;
    if(!decoded.ok){toast(decoded.error);input.value='';return;}
    app.pendingImport=decoded.profile;
    showModal('import',`<h2 id="dialog-title">Replace this save?</h2><p>Import timeline ${app.pendingImport.timeline}, ${chapterPresentation(app.pendingImport.age).title}, with ${money(app.pendingImport.coins)} coins.</p><p>Your current progress in this browser will be replaced. Export it first to keep a separate copy.</p><button class="big-button blue" data-command="confirm-import">REPLACE WITH THIS SAVE</button><button class="big-button secondary" data-command="close">CANCEL</button>`,'close');
  }catch{
    if(request!==app.importRequest||lifetime.disposed||version!==app.modalVersion||app.modal!=='save-recovery'||app.session.status!=='active'||!guardAction())return;
    input.value='';
    toast('The selected file could not be read. Your current game was not changed.');
  }
});
lifetime.listen<KeyboardEvent>(document,'keydown',e=>{
  if(app.modal){
    if(e.key==='Escape'){dismissModal();e.preventDefault();}
    if(e.key==='Tab'){
      const elements=modalFocusables($('modal-layer')),index=nextFocusIndex(elements.indexOf(document.activeElement as HTMLElement),elements.length,e.shiftKey);
      e.preventDefault();(index===null?$('modal-layer').querySelector<HTMLElement>('.dialog'):elements[index])?.focus();
    }return;
  }
  if(e.key==='Escape'&&app.entryEntered){if(app.campOwner?.kind==='advanced')returnToCamp();else fieldControls.clear();e.preventDefault();return;}
  if(!app.entryEntered||!guardAction()||app.campOwner||app.activeTab!=='battle'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||document.hidden||isEditingTarget(e.target instanceof HTMLElement?e.target:null))return;
  if(['1','2','3'].includes(e.key)){e.preventDefault();action({type:'spawn',kind:(Number(e.key)-1) as UnitKind});}
  const skillIndex=['q','w','e'].indexOf(e.key.toLowerCase());
  if(skillIndex>=0){e.preventDefault();action({type:'skill',skill:(['freeze','meteor','food'] as Skill[])[skillIndex]});}
  if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){
    e.preventDefault();if(app.game.state.phase==='ready')action({type:'start'});else if(app.game.state.phase==='running'){app.manualPaused=!app.manualPaused;syncPause();update(true);}
  }
});
lifetime.listen(root,'visual-fallback',()=>toast('Some artwork could not load. The simplified battlefield is active.'));
lifetime.listen<StorageEvent>(window,'storage',event=>{
  if(event.key===SAVE_KEY||event.key===BACKUP_KEY||event.key===null)app.session.check();
});
lifetime.listen(window,'focus',()=>{if(app.pagePresent)app.session.check();syncPause();});
lifetime.listen(document,'visibilitychange',()=>{
  if(document.hidden){persist();syncPause();suspendAudio();}
  else{app.session.check();syncPause();}
});
lifetime.listen(window,'pagehide',suspendSession);
lifetime.listen(window,'pageshow',()=>{
  app.pagePresent=true;
  if(app.session.status==='temporary'){app.sessionReady=true;syncPause();}
  else if(app.resumeOwnership){app.resumeOwnership=false;void acquireSession();}
});
lifetime.listen(motionQuery,'change',syncMotion);
