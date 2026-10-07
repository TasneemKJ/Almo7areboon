import { syncBattleHud } from '../ui/hud-sync.ts';
import { Game } from '../game/simulation.ts';
import { localDay } from '../game/data.ts';
import type { SaveSessionStatus } from '../game/save-session.ts';
import { saveSessionDialogHtml, temporarySessionNotice } from '../ui/save-session-screen.ts';
import { exportBackup } from '../game/backup.ts';
import type { Action, GameEvent } from '../game/types.ts';
import { advanceVillagePresentation } from '../view/village-mood.ts';
import { hasPriorPlay } from '../ui/entry-screen.ts';
import { playCombatEvents, playSummonAudio, stopCombatAudio, unlockAudio, suspendAudio, updateSoundscape } from '../view/audio.ts';
import { weekId } from '../game/weekly.ts';
import { welcomeBackLine } from '../ui/welcome-back.ts';
import { pauseReason } from '../ui/pause.ts';
import { ambienceAllowed } from '../ui/audio-preferences.ts';
import { textIfChanged } from '../ui/dom-state.ts';
import type { AppState } from './state.ts';
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** What the lifecycle module needs: its slice of state, DOM handles and sibling operations. */
export interface LifecycleDeps {
  state: Pick<AppState, 'acquiring' | 'acquisitionVersion' | 'activeTab' | 'atmosphereEnabled' | 'campOwner' | 'entryEntered' | 'entrySaved' | 'entryWelcome' | 'evolutionFromResult' | 'game' | 'hasPlayed' | 'lastPhase' | 'lastSave' | 'lastSavedAt' | 'lastUpdate' | 'manualPaused' | 'modal' | 'pagePresent' | 'pendingImport' | 'questCalendarDay' | 'resultDue' | 'resultShown' | 'resumeOwnership' | 'retriedSession' | 'savedWarning' | 'session' | 'sessionReady' | 'settingsOrigin' | 'toastTimer' | 'villagePresentation'>;
  dom: Pick<Runtime, '$' | 'coin' | 'fieldControls' | 'isolateModal' | 'lifetime' | 'money' | 'motionQuery' | 'root' | 'updateArmy' | 'automated' | 'clearTimer' | 'downloadText' | 'hidden' | 'now' | 'query' | 'rootElement' | 'setTimer'>;
  ports: Pick<ShellApi, 'clearPrestigeContext' | 'closeModal' | 'questSaveNotice' | 'refreshQuestRecord' | 'renderScreen' | 'showModal' | 'showResult' | 'switchTab' | 'syncCamp' | 'syncEntry' | 'syncWeek'>;
}

export function createLifecycle(deps: LifecycleDeps) {
  const { state, ports, dom } = deps;
  const { $, coin, fieldControls, isolateModal, lifetime, money, motionQuery, root, updateArmy } = deps.dom;
  function playable(){return state.sessionReady&&state.pagePresent&&!lifetime.disposed&&(state.session.status==='active'||state.session.status==='temporary');}
  function guardAction(){return playable()&&state.session.check();}
  function sessionPresentation(status:SaveSessionStatus){
    root!.dataset.saveSession=status;
    const notice=$('session-notice');
    notice.hidden=status!=='starting'&&status!=='temporary';
    textIfChanged(notice,status==='temporary'?temporarySessionNotice:'Opening your saved game…');
    if(status!=='active'&&status!=='temporary'){state.sessionReady=false;state.campOwner=null;state.entryWelcome=null;ports.clearPrestigeContext();}
    if(status==='active'||status==='temporary')state.retriedSession=false;
    const html=saveSessionDialogHtml(status,state.retriedSession);
    if(html){state.pendingImport=null;state.evolutionFromResult=false;ports.showModal('session',html);}
    else if(status==='starting'){
      // An immediate acquisition has no transient modal focus loop.
      isolateModal(true);notice.inert=false;
      $('modal-layer').querySelector<HTMLButtonElement>('[data-command="session-continue"]')?.setAttribute('disabled','');
    }
    syncPause();
  }
  async function acquireSession(){
    if(state.acquiring||lifetime.disposed||!state.pagePresent)return state.acquiring;
    const version=state.acquisitionVersion;
    state.acquiring=(async()=>{
      const loaded=await state.session.acquire();
      if(lifetime.disposed||version!==state.acquisitionVersion||!state.pagePresent)return;
      if(loaded.status==='active'&&loaded.profile){
        state.game=new Game(loaded.profile);state.lastPhase=state.game.state.phase;state.resultDue=0;state.hasPlayed=true;state.sessionReady=true;state.entrySaved=hasPriorPlay(state.game.profile);
        state.manualPaused=false;state.resultShown='';state.savedWarning=false;state.pendingImport=null;state.evolutionFromResult=false;ports.clearPrestigeContext();
        state.entryWelcome=loaded.loadStatus==='recovered'||loaded.loadStatus==='corrupt'?null:welcomeBackLine(loaded.profile.lastSeen,Date.now(),loaded.profile.wins);
        if(guardAction())ports.syncWeek();
        ports.closeModal(false);rebuildArmy();syncMotion();ports.switchTab('battle');
        if(loaded.loadStatus==='recovered')toast('Recovered your progress from the backup save.');
        else if(loaded.loadStatus==='corrupt')toast('The stored save could not be recovered. A new game has started.');
      }else if(!state.hasPlayed&&loaded.profile){
        // Safe preview for explicit temporary play only; never replace conflicted work.
        state.entryWelcome=null;state.game=new Game(loaded.profile);state.lastPhase=state.game.state.phase;state.resultDue=0;rebuildArmy();syncMotion();update(true);
      }
    })().finally(()=>{if(version===state.acquisitionVersion)state.acquiring=null;});
    return state.acquiring;
  }
  function rebuildArmy(){updateArmy(state.game.profile);}
  function toast(message:string,duration=4200){
    textIfChanged($('toast'),message);$('toast').classList.add('visible');
    dom.clearTimer(state.toastTimer);state.toastTimer=dom.setTimer(()=>$('toast').classList.remove('visible'),duration);
  }
  function persist():boolean{
    if(!playable()||state.session.status==='temporary')return false;
    // lastSeen rides on the saved copy only, so the live profile (and every "unchanged progress" check) is untouched.
    const result=state.session.save({...state.game.profile,lastSeen:Math.floor(Date.now()/60000)*60000}),ok=result.ok;state.lastSave=dom.now();
    if(result.reason==='write-failed'&&!state.savedWarning){state.savedWarning=true;toast('Progress could not be saved. Export a backup from Settings before closing this tab.');}
    if(ok){state.savedWarning=false;state.lastSavedAt=Date.now();}
    return ok;
  }
  function syncPause(){
    state.game.state.paused=!state.entryEntered||!playable()||pauseReason({phase:state.game.state.phase,manual:state.manualPaused,tab:state.activeTab,modal:state.modal,hidden:dom.hidden()})!==null;
    if(!state.entryEntered||!state.game.profile.sound||!playable()||dom.hidden()||state.manualPaused||state.activeTab!=='battle'||(state.modal!==null&&state.modal!=='result')){
      // Only a direct accepted card-summon's finite shimmer may finish in Cards.
      const summonTail=state.game.profile.sound&&playable()&&!dom.hidden()&&!state.manualPaused&&state.activeTab==='cards'&&(state.modal===null||state.modal==='summon');
      stopCombatAudio(summonTail);
    }
    syncVillagePresentation();
  }
  function syncVillagePresentation(dt=0,batch:readonly GameEvent[]=[]){
    state.villagePresentation=advanceVillagePresentation(state.villagePresentation,state.game.state,state.game.profile.age,dt,batch,!state.entryEntered||!playable()||dom.hidden()||state.activeTab!=='battle'||state.modal!==null);
    // The renderer calls this after stepping and draining events, so a delayed
    // result dialog still gates audio with the actual terminal phase this frame.
    updateSoundscape(state.game.profile.age,ambienceAllowed({sound:state.game.profile.sound&&state.entryEntered,atmosphere:state.atmosphereEnabled,paused:state.game.state.paused,phase:state.game.state.phase,tab:state.activeTab,modal:state.modal,hidden:dom.hidden()}),state.villagePresentation.mood);
  }
  function syncMarks(){dom.rootElement().dataset.marks=state.game.profile.marks?'on':'off';}
  function syncMotion(){dom.rootElement().dataset.motion=state.game.profile.motion==='reduced'||motionQuery.matches?'reduced':'full';syncMarks();}
  function action(a:Action):boolean{
    if(!guardAction())return false;
    unlockAudio(state.game.profile.sound);const ok=state.game.dispatch(a);
    if(ok){
      if(a.type==='prestige'||state.game.profile.weekly?.week!==weekId(localDay()))state.game.dispatch({type:'weekly-sync',week:weekId(localDay())});
      persist();syncPause();rebuildArmy();update(true);if(state.activeTab!=='battle')ports.renderScreen(a.type==='select-legacy');
      if(a.type==='summon')playSummonAudio(state.game.profile.sound&&playable()&&!dom.hidden()&&!state.manualPaused&&state.activeTab==='cards'&&state.modal===null);
    }
    return ok;
  }
  function update(force=false){
    const now=dom.now();if(!force&&now-state.lastUpdate<80)return;state.lastUpdate=now;
   const s=state.game.state;
   ports.syncEntry();ports.syncCamp();
   if(state.modal==='quests'&&playable()&&!Object.is(state.questCalendarDay,localDay()))ports.refreshQuestRecord();
   if(state.modal==='quests'&&playable()){const notice=$('quest-save-status'),message=ports.questSaveNotice();notice.hidden=!message;textIfChanged(notice,message);}
   if(!state.entryEntered)return;
   syncBattleHud({root:root!,$,game:state.game,money,coin,manualPaused:state.manualPaused});
    fieldControls.update(state.game);
    // Let the finishing blow and base collapse play before the result dialog covers them.
    if(s.phase!==state.lastPhase){if(state.lastPhase==='running'&&(s.phase==='won'||s.phase==='lost'))state.resultDue=now+(dom.rootElement().dataset.motion==='reduced'?350:1300);state.lastPhase=s.phase;}
    const reviewHoldingResult=dom.automated()&&dom.query('canvas')?.dataset.battlefieldReviewFrameReady===s.phase;
    if(state.entryEntered&&playable()&&state.modal!=='session'&&(s.phase==='won'||s.phase==='lost')&&state.resultShown!==s.phase&&now>=state.resultDue&&!reviewHoldingResult){state.resultShown=s.phase;ports.showResult();}
    if(s.phase==='ready'||s.phase==='running')state.resultShown='';
    if(playable()&&state.session.status==='active'&&now-state.lastSave>5000)persist();
  }
  function exportSave(){
    try{
      lifetime.add(dom.downloadText(exportBackup(state.game.profile),'application/json','almo7areboon-save.json'));
      toast('Save backup exported.');
    }catch{toast('The backup could not be exported. Your current progress was not changed.');}
  }
  function adoptRestoredGame(restored:Game){
    state.game=restored;state.entryWelcome=null;state.entryEntered=false;state.entrySaved=hasPriorPlay(state.game.profile);state.settingsOrigin=null;root!.dataset.fieldMode='field';state.lastPhase=state.game.state.phase;state.resultDue=0;state.manualPaused=false;state.resultShown='';state.savedWarning=false;ports.clearPrestigeContext();rebuildArmy();syncMotion();ports.closeModal(false);ports.switchTab('battle');
  }
  function suspendSession(){
    // Save while still active, then deactivate synchronously before releasing the lock.
    persist();state.resumeOwnership=state.resumeOwnership||state.session.status==='active'||state.session.status==='starting';
    state.pagePresent=false;state.acquisitionVersion++;state.acquiring=null;state.sessionReady=false;ports.clearPrestigeContext();
    if(state.resumeOwnership)state.session.release();
    syncPause();suspendAudio();
  }
  function events(batch:GameEvent[]){
    // Fresh terminal results are admitted before their dialog; menus and all
    // modal owners block new batches, including accepted menu confirmations.
    playCombatEvents(batch,state.game.profile.sound&&playable()&&!dom.hidden()&&!state.manualPaused&&!state.game.state.paused&&state.activeTab==='battle'&&state.modal===null);
    if(batch.some(event=>event.type==='win')&&guardAction()){const receipt=state.game.profile.pendingVictory,mask=receipt&&receipt.settlement==='mastery-v1'?receipt.newMask:0;state.game.dispatch({type:'weekly-sync',week:weekId(localDay()),earned:(mask&1)+((mask>>1)&1)+((mask>>2)&1)});}
    if(batch.some(event=>event.type==='win'||event.type==='lose'))persist();
  }
  return { playable, guardAction, sessionPresentation, acquireSession, rebuildArmy, toast, persist, syncPause, syncVillagePresentation, syncMarks, syncMotion, action, update, exportSave, adoptRestoredGame, suspendSession, events };
}
