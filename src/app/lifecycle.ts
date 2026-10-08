import { createSaveSession, type SaveSession } from '../game/save-session.ts';
import type { Phase } from '../game/types.ts';
import type { AudioMix } from '../game/audio-mix.ts';
import { loadAtmosphere, loadAudioMix } from '../ui/audio-preferences.ts';
import { type VillagePresentation } from '../view/village-mood.ts';

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
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** State owned by the lifecycle module. Siblings see only the slice it exposes through its ports. */
export interface SessionState {
  game: Game;
  session: SaveSession;
  sessionReady: boolean;
  pagePresent: boolean;
  resumeOwnership: boolean;
  acquisitionVersion: number;
  acquiring: Promise<void>|null;
  retriedSession: boolean;
  hasPlayed: boolean;
  lastSavedAt: number;
  lastUpdate: number;
  lastSave: number;
  lastPhase: Phase;
  resultDue: number;
  resultShown: string;
  savedWarning: boolean;
  toastTimer: number;
  villagePresentation: VillagePresentation|null;
  atmosphereEnabled: boolean;
  audioMix: AudioMix;
  manualPaused: boolean;
}

/** What the lifecycle module needs: its slice of state, DOM handles and sibling operations. */
export interface LifecycleDeps {
  initialGame: Game;
  dom: Pick<Runtime, '$' | 'coin' | 'fieldControls' | 'isolateModal' | 'lifetime' | 'money' | 'motionQuery' | 'root' | 'updateArmy' | 'automated' | 'clearTimer' | 'downloadText' | 'hidden' | 'now' | 'query' | 'rootElement' | 'setTimer' | 'locks' | 'storage'>;
  ports: Pick<ShellApi, 'clearPrestigeContext' | 'closeModal' | 'navState' | 'preferenceNotice' | 'questSaveNotice' | 'questState' | 'refreshQuestRecord' | 'renderScreen' | 'showModal' | 'showResult' | 'switchTab' | 'syncCamp' | 'syncEntry' | 'syncWeek'>;
}

export function createLifecycle(deps: LifecycleDeps) {
  const { ports, dom } = deps;
  const { $, coin, fieldControls, isolateModal, lifetime, money, motionQuery, root, updateArmy } = deps.dom;
  const sessionState: SessionState = {
    game: deps.initialGame,
    session: createSaveSession({ storage: dom.storage(), locks: dom.locks(), onStatus: status => sessionPresentation(status) }),
    sessionReady: false,
    pagePresent: true,
    resumeOwnership: false,
    acquisitionVersion: 0,
    acquiring: null,
    retriedSession: false,
    hasPlayed: false,
    lastSavedAt: 0,
    lastUpdate: 0,
    lastSave: 0,
    lastPhase: deps.initialGame.state.phase,
    resultDue: 0,
    resultShown: '',
    savedWarning: false,
    toastTimer: 0,
    villagePresentation: null,
    atmosphereEnabled: loadAtmosphere(),
    audioMix: loadAudioMix(),
    manualPaused: false,
  };
  function playable(){return sessionState.sessionReady&&sessionState.pagePresent&&!lifetime.disposed&&(sessionState.session.status==='active'||sessionState.session.status==='temporary');}
  function guardAction(){return playable()&&sessionState.session.check();}
  function sessionPresentation(status:SaveSessionStatus){
    root!.dataset.saveSession=status;
    const notice=$('session-notice');
    notice.hidden=status!=='starting'&&status!=='temporary';
    textIfChanged(notice,status==='temporary'?temporarySessionNotice:'Opening your saved game…');
    if(status!=='active'&&status!=='temporary'){sessionState.sessionReady=false;ports.navState.campOwner=null;ports.navState.entryWelcome=null;ports.clearPrestigeContext();}
    if(status==='active'||status==='temporary')sessionState.retriedSession=false;
    const html=saveSessionDialogHtml(status,sessionState.retriedSession);
    if(html){ports.navState.pendingImport=null;ports.navState.evolutionFromResult=false;ports.showModal('session',html);}
    else if(status==='starting'){
      // An immediate acquisition has no transient modal focus loop.
      isolateModal(true);notice.inert=false;
      $('modal-layer').querySelector<HTMLButtonElement>('[data-command="session-continue"]')?.setAttribute('disabled','');
    }
    syncPause();
  }
  async function acquireSession(){
    if(sessionState.acquiring||lifetime.disposed||!sessionState.pagePresent)return sessionState.acquiring;
    const version=sessionState.acquisitionVersion;
    sessionState.acquiring=(async()=>{
      const loaded=await sessionState.session.acquire();
      if(lifetime.disposed||version!==sessionState.acquisitionVersion||!sessionState.pagePresent)return;
      if(loaded.status==='active'&&loaded.profile){
        sessionState.game=new Game(loaded.profile);sessionState.lastPhase=sessionState.game.state.phase;sessionState.resultDue=0;sessionState.hasPlayed=true;sessionState.sessionReady=true;ports.navState.entrySaved=hasPriorPlay(sessionState.game.profile);
        sessionState.manualPaused=false;sessionState.resultShown='';sessionState.savedWarning=false;ports.navState.pendingImport=null;ports.navState.evolutionFromResult=false;ports.clearPrestigeContext();
        ports.navState.entryWelcome=loaded.loadStatus==='recovered'||loaded.loadStatus==='corrupt'?null:welcomeBackLine(loaded.profile.lastSeen,Date.now(),loaded.profile.wins);
        if(guardAction())ports.syncWeek();
        ports.closeModal(false);rebuildArmy();syncMotion();ports.switchTab('battle');
        if(loaded.loadStatus==='recovered')toast('Recovered your progress from the backup save.');
        else if(loaded.loadStatus==='corrupt')toast('The stored save could not be recovered. A new game has started.');
      }else if(!sessionState.hasPlayed&&loaded.profile){
        // Safe preview for explicit temporary play only; never replace conflicted work.
        ports.navState.entryWelcome=null;sessionState.game=new Game(loaded.profile);sessionState.lastPhase=sessionState.game.state.phase;sessionState.resultDue=0;rebuildArmy();syncMotion();update(true);
      }
    })().finally(()=>{if(version===sessionState.acquisitionVersion)sessionState.acquiring=null;});
    return sessionState.acquiring;
  }
  function rebuildArmy(){updateArmy(sessionState.game.profile);}
  function toast(message:string,duration=4200){
    textIfChanged($('toast'),message);$('toast').classList.add('visible');
    dom.clearTimer(sessionState.toastTimer);sessionState.toastTimer=dom.setTimer(()=>$('toast').classList.remove('visible'),duration);
  }
  function persist():boolean{
    if(!playable()||sessionState.session.status==='temporary')return false;
    // lastSeen rides on the saved copy only, so the live profile (and every "unchanged progress" check) is untouched.
    const result=sessionState.session.save({...sessionState.game.profile,lastSeen:Math.floor(Date.now()/60000)*60000}),ok=result.ok;sessionState.lastSave=dom.now();
    if(result.reason==='write-failed'&&!sessionState.savedWarning){sessionState.savedWarning=true;toast('Progress could not be saved. Export a backup from Settings before closing this tab.');}
    if(ok){sessionState.savedWarning=false;sessionState.lastSavedAt=Date.now();}
    if(playable()&&(ports.navState.modal==='settings'||ports.navState.modal==='save-recovery')){
      const notice=$(ports.navState.modal==='settings'?'preference-status':'recovery-status');
      if(notice)textIfChanged(notice,ports.preferenceNotice());
    }
    return ok;
  }
  function syncPause(){
    sessionState.game.state.paused=!ports.navState.entryEntered||!playable()||pauseReason({phase:sessionState.game.state.phase,manual:sessionState.manualPaused,tab:ports.navState.activeTab,modal:ports.navState.modal,hidden:dom.hidden()})!==null;
    if(!ports.navState.entryEntered||!sessionState.game.profile.sound||!playable()||dom.hidden()||sessionState.manualPaused||ports.navState.activeTab!=='battle'||(ports.navState.modal!==null&&ports.navState.modal!=='result')){
      // Only a direct accepted card-summon's finite shimmer may finish in Cards.
      const summonTail=sessionState.game.profile.sound&&playable()&&!dom.hidden()&&!sessionState.manualPaused&&ports.navState.activeTab==='cards'&&(ports.navState.modal===null||ports.navState.modal==='summon');
      stopCombatAudio(summonTail);
    }
    syncVillagePresentation();
  }
  function syncVillagePresentation(dt=0,batch:readonly GameEvent[]=[]){
    sessionState.villagePresentation=advanceVillagePresentation(sessionState.villagePresentation,sessionState.game.state,sessionState.game.profile.age,dt,batch,!ports.navState.entryEntered||!playable()||dom.hidden()||ports.navState.activeTab!=='battle'||ports.navState.modal!==null);
    // The renderer calls this after stepping and draining events, so a delayed
    // result dialog still gates audio with the actual terminal phase this frame.
    updateSoundscape(sessionState.game.profile.age,ambienceAllowed({sound:sessionState.game.profile.sound&&ports.navState.entryEntered,atmosphere:sessionState.atmosphereEnabled,paused:sessionState.game.state.paused,phase:sessionState.game.state.phase,tab:ports.navState.activeTab,modal:ports.navState.modal,hidden:dom.hidden()}),sessionState.villagePresentation.mood);
  }
  function syncMarks(){dom.rootElement().dataset.marks=sessionState.game.profile.marks?'on':'off';}
  function syncMotion(){dom.rootElement().dataset.motion=sessionState.game.profile.motion==='reduced'||motionQuery.matches?'reduced':'full';syncMarks();}
  function action(a:Action):boolean{
    if(!guardAction())return false;
    unlockAudio(sessionState.game.profile.sound);const ok=sessionState.game.dispatch(a);
    if(ok){
      if(a.type==='prestige'||sessionState.game.profile.weekly?.week!==weekId(localDay()))sessionState.game.dispatch({type:'weekly-sync',week:weekId(localDay())});
      persist();syncPause();rebuildArmy();update(true);if(ports.navState.activeTab!=='battle')ports.renderScreen(a.type==='select-legacy');
      if(a.type==='summon')playSummonAudio(sessionState.game.profile.sound&&playable()&&!dom.hidden()&&!sessionState.manualPaused&&ports.navState.activeTab==='cards'&&ports.navState.modal===null);
    }
    return ok;
  }
  function update(force=false){
    const now=dom.now();if(!force&&now-sessionState.lastUpdate<80)return;sessionState.lastUpdate=now;
   const s=sessionState.game.state;
   ports.syncEntry();ports.syncCamp();
   if(ports.navState.modal==='quests'&&playable()&&!Object.is(ports.questState.questCalendarDay,localDay()))ports.refreshQuestRecord();
   if(ports.navState.modal==='quests'&&playable()){const notice=$('quest-save-status'),message=ports.questSaveNotice();notice.hidden=!message;textIfChanged(notice,message);}
   if(!ports.navState.entryEntered)return;
   syncBattleHud({root:root!,$,game:sessionState.game,money,coin,manualPaused:sessionState.manualPaused});
    fieldControls.update(sessionState.game);
    // Let the finishing blow and base collapse play before the result dialog covers them.
    if(s.phase!==sessionState.lastPhase){if(sessionState.lastPhase==='running'&&(s.phase==='won'||s.phase==='lost'))sessionState.resultDue=now+(dom.rootElement().dataset.motion==='reduced'?350:1300);sessionState.lastPhase=s.phase;}
    const reviewHoldingResult=dom.automated()&&dom.query('canvas')?.dataset.battlefieldReviewFrameReady===s.phase;
    if(ports.navState.entryEntered&&playable()&&ports.navState.modal!=='session'&&(s.phase==='won'||s.phase==='lost')&&sessionState.resultShown!==s.phase&&now>=sessionState.resultDue&&!reviewHoldingResult){sessionState.resultShown=s.phase;ports.showResult();}
    if(s.phase==='ready'||s.phase==='running')sessionState.resultShown='';
    if(playable()&&sessionState.session.status==='active'&&now-sessionState.lastSave>5000)persist();
  }
  function exportSave(){
    try{
      lifetime.add(dom.downloadText(exportBackup(sessionState.game.profile),'application/json','almo7areboon-save.json'));
      toast('Save backup exported.');
    }catch{toast('The backup could not be exported. Your current progress was not changed.');}
  }
  function adoptRestoredGame(restored:Game){
    sessionState.game=restored;ports.navState.entryWelcome=null;ports.navState.entryEntered=false;ports.navState.entrySaved=hasPriorPlay(sessionState.game.profile);ports.navState.settingsOrigin=null;root!.dataset.fieldMode='field';sessionState.lastPhase=sessionState.game.state.phase;sessionState.resultDue=0;sessionState.manualPaused=false;sessionState.resultShown='';sessionState.savedWarning=false;ports.clearPrestigeContext();rebuildArmy();syncMotion();ports.closeModal(false);ports.switchTab('battle');
  }
  function suspendSession(){
    // Save while still active, then deactivate synchronously before releasing the lock.
    persist();sessionState.resumeOwnership=sessionState.resumeOwnership||sessionState.session.status==='active'||sessionState.session.status==='starting';
    sessionState.pagePresent=false;sessionState.acquisitionVersion++;sessionState.acquiring=null;sessionState.sessionReady=false;ports.clearPrestigeContext();
    if(sessionState.resumeOwnership)sessionState.session.release();
    syncPause();suspendAudio();
  }
  function events(batch:GameEvent[]){
    // Fresh terminal results are admitted before their dialog; menus and all
    // modal owners block new batches, including accepted menu confirmations.
    playCombatEvents(batch,sessionState.game.profile.sound&&playable()&&!dom.hidden()&&!sessionState.manualPaused&&!sessionState.game.state.paused&&ports.navState.activeTab==='battle'&&ports.navState.modal===null);
    if(batch.some(event=>event.type==='win')&&guardAction()){const receipt=sessionState.game.profile.pendingVictory,mask=receipt&&receipt.settlement==='mastery-v1'?receipt.newMask:0;sessionState.game.dispatch({type:'weekly-sync',week:weekId(localDay()),earned:(mask&1)+((mask>>1)&1)+((mask>>2)&1)});}
    if(batch.some(event=>event.type==='win'||event.type==='lose'))persist();
  }
  return { playable, guardAction, sessionPresentation, acquireSession, rebuildArmy, toast, persist, syncPause, syncVillagePresentation, syncMarks, syncMotion, action, update, exportSave, adoptRestoredGame, suspendSession, events, sessionState: sessionState as Pick<SessionState, 'acquisitionVersion' | 'atmosphereEnabled' | 'audioMix' | 'game' | 'hasPlayed' | 'lastSavedAt' | 'manualPaused' | 'pagePresent' | 'resultShown' | 'resumeOwnership' | 'retriedSession' | 'savedWarning' | 'session' | 'sessionReady' | 'toastTimer' | 'villagePresentation'> };
}
