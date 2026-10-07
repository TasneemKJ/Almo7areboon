

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
import { app } from './state.ts';
import { $, coin, fieldControls, isolateModal, lifetime, money, motionQuery, root, updateArmy } from './runtime.ts';
import { clearPrestigeContext, closeModal, renderScreen, showModal, showResult, switchTab, syncCamp, syncEntry } from './navigation.ts';
import { questSaveNotice, refreshQuestRecord, syncWeek } from './quests.ts';

export function playable(){return app.sessionReady&&app.pagePresent&&!lifetime.disposed&&(app.session.status==='active'||app.session.status==='temporary');}
export function guardAction(){return playable()&&app.session.check();}
export function sessionPresentation(status:SaveSessionStatus){
  root!.dataset.saveSession=status;
  const notice=$('session-notice');
  notice.hidden=status!=='starting'&&status!=='temporary';
  textIfChanged(notice,status==='temporary'?temporarySessionNotice:'Opening your saved game…');
  if(status!=='active'&&status!=='temporary'){app.sessionReady=false;app.campOwner=null;app.entryWelcome=null;clearPrestigeContext();}
  if(status==='active'||status==='temporary')app.retriedSession=false;
  const html=saveSessionDialogHtml(status,app.retriedSession);
  if(html){app.pendingImport=null;app.evolutionFromResult=false;showModal('session',html);}
  else if(status==='starting'){
    // An immediate acquisition has no transient modal focus loop.
    isolateModal(true);notice.inert=false;
    $('modal-layer').querySelector<HTMLButtonElement>('[data-command="session-continue"]')?.setAttribute('disabled','');
  }
  syncPause();
}
export async function acquireSession(){
  if(app.acquiring||lifetime.disposed||!app.pagePresent)return app.acquiring;
  const version=app.acquisitionVersion;
  app.acquiring=(async()=>{
    const loaded=await app.session.acquire();
    if(lifetime.disposed||version!==app.acquisitionVersion||!app.pagePresent)return;
    if(loaded.status==='active'&&loaded.profile){
      app.game=new Game(loaded.profile);app.lastPhase=app.game.state.phase;app.resultDue=0;app.hasPlayed=true;app.sessionReady=true;app.entrySaved=hasPriorPlay(app.game.profile);
      app.manualPaused=false;app.resultShown='';app.savedWarning=false;app.pendingImport=null;app.evolutionFromResult=false;clearPrestigeContext();
      app.entryWelcome=loaded.loadStatus==='recovered'||loaded.loadStatus==='corrupt'?null:welcomeBackLine(loaded.profile.lastSeen,Date.now(),loaded.profile.wins);
      if(guardAction())syncWeek();
      closeModal(false);rebuildArmy();syncMotion();switchTab('battle');
      if(loaded.loadStatus==='recovered')toast('Recovered your progress from the backup save.');
      else if(loaded.loadStatus==='corrupt')toast('The stored save could not be recovered. A new game has started.');
    }else if(!app.hasPlayed&&loaded.profile){
      // Safe preview for explicit temporary play only; never replace conflicted work.
      app.entryWelcome=null;app.game=new Game(loaded.profile);app.lastPhase=app.game.state.phase;app.resultDue=0;rebuildArmy();syncMotion();update(true);
    }
  })().finally(()=>{if(version===app.acquisitionVersion)app.acquiring=null;});
  return app.acquiring;
}
export function rebuildArmy(){updateArmy(app.game.profile);}
export function toast(message:string,duration=4200){
  textIfChanged($('toast'),message);$('toast').classList.add('visible');
  window.clearTimeout(app.toastTimer);app.toastTimer=window.setTimeout(()=>$('toast').classList.remove('visible'),duration);
}
export function persist():boolean{
  if(!playable()||app.session.status==='temporary')return false;
  // lastSeen rides on the saved copy only, so the live profile (and every "unchanged progress" check) is untouched.
  const result=app.session.save({...app.game.profile,lastSeen:Math.floor(Date.now()/60000)*60000}),ok=result.ok;app.lastSave=performance.now();
  if(result.reason==='write-failed'&&!app.savedWarning){app.savedWarning=true;toast('Progress could not be saved. Export a backup from Settings before closing this tab.');}
  if(ok){app.savedWarning=false;app.lastSavedAt=Date.now();}
  return ok;
}
export function syncPause(){
  app.game.state.paused=!app.entryEntered||!playable()||pauseReason({phase:app.game.state.phase,manual:app.manualPaused,tab:app.activeTab,modal:app.modal,hidden:document.hidden})!==null;
  if(!app.entryEntered||!app.game.profile.sound||!playable()||document.hidden||app.manualPaused||app.activeTab!=='battle'||(app.modal!==null&&app.modal!=='result')){
    // Only a direct accepted card-summon's finite shimmer may finish in Cards.
    const summonTail=app.game.profile.sound&&playable()&&!document.hidden&&!app.manualPaused&&app.activeTab==='cards'&&(app.modal===null||app.modal==='summon');
    stopCombatAudio(summonTail);
  }
  syncVillagePresentation();
}
export function syncVillagePresentation(dt=0,batch:readonly GameEvent[]=[]){
  app.villagePresentation=advanceVillagePresentation(app.villagePresentation,app.game.state,app.game.profile.age,dt,batch,!app.entryEntered||!playable()||document.hidden||app.activeTab!=='battle'||app.modal!==null);
  // The renderer calls this after stepping and draining events, so a delayed
  // result dialog still gates audio with the actual terminal phase this frame.
  updateSoundscape(app.game.profile.age,ambienceAllowed({sound:app.game.profile.sound&&app.entryEntered,atmosphere:app.atmosphereEnabled,paused:app.game.state.paused,phase:app.game.state.phase,tab:app.activeTab,modal:app.modal,hidden:document.hidden}),app.villagePresentation.mood);
}
export function syncMarks(){document.documentElement.dataset.marks=app.game.profile.marks?'on':'off';}
export function syncMotion(){document.documentElement.dataset.motion=app.game.profile.motion==='reduced'||motionQuery.matches?'reduced':'full';syncMarks();}
export function action(a:Action):boolean{
  if(!guardAction())return false;
  unlockAudio(app.game.profile.sound);const ok=app.game.dispatch(a);
  if(ok){
    if(a.type==='prestige'||app.game.profile.weekly?.week!==weekId(localDay()))app.game.dispatch({type:'weekly-sync',week:weekId(localDay())});
    persist();syncPause();rebuildArmy();update(true);if(app.activeTab!=='battle')renderScreen(a.type==='select-legacy');
    if(a.type==='summon')playSummonAudio(app.game.profile.sound&&playable()&&!document.hidden&&!app.manualPaused&&app.activeTab==='cards'&&app.modal===null);
  }
  return ok;
}
export function update(force=false){
  const now=performance.now();if(!force&&now-app.lastUpdate<80)return;app.lastUpdate=now;
 const s=app.game.state;
 syncEntry();syncCamp();
 if(app.modal==='quests'&&playable()&&!Object.is(app.questCalendarDay,localDay()))refreshQuestRecord();
 if(app.modal==='quests'&&playable()){const notice=$('quest-save-status'),message=questSaveNotice();notice.hidden=!message;textIfChanged(notice,message);}
 if(!app.entryEntered)return;
 syncBattleHud({root:root!,$,game:app.game,money,coin,manualPaused:app.manualPaused});
  fieldControls.update(app.game);
  // Let the finishing blow and base collapse play before the result dialog covers them.
  if(s.phase!==app.lastPhase){if(app.lastPhase==='running'&&(s.phase==='won'||s.phase==='lost'))app.resultDue=now+(document.documentElement.dataset.motion==='reduced'?350:1300);app.lastPhase=s.phase;}
  const reviewHoldingResult=globalThis.navigator?.webdriver&&document.querySelector('canvas')?.dataset.battlefieldReviewFrameReady===s.phase;
  if(app.entryEntered&&playable()&&app.modal!=='session'&&(s.phase==='won'||s.phase==='lost')&&app.resultShown!==s.phase&&now>=app.resultDue&&!reviewHoldingResult){app.resultShown=s.phase;showResult();}
  if(s.phase==='ready'||s.phase==='running')app.resultShown='';
  if(playable()&&app.session.status==='active'&&now-app.lastSave>5000)persist();
}
export function exportSave(){
  try{
    const url=URL.createObjectURL(new Blob([exportBackup(app.game.profile)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='almo7areboon-save.json';document.body.append(link);link.click();link.remove();
    const timer=window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    lifetime.add(()=>{window.clearTimeout(timer);URL.revokeObjectURL(url);});
    toast('Save backup exported.');
  }catch{toast('The backup could not be exported. Your current progress was not changed.');}
}
export function adoptRestoredGame(restored:Game){
  app.game=restored;app.entryWelcome=null;app.entryEntered=false;app.entrySaved=hasPriorPlay(app.game.profile);app.settingsOrigin=null;root!.dataset.fieldMode='field';app.lastPhase=app.game.state.phase;app.resultDue=0;app.manualPaused=false;app.resultShown='';app.savedWarning=false;clearPrestigeContext();rebuildArmy();syncMotion();closeModal(false);switchTab('battle');
}
export function suspendSession(){
  // Save while still active, then deactivate synchronously before releasing the lock.
  persist();app.resumeOwnership=app.resumeOwnership||app.session.status==='active'||app.session.status==='starting';
  app.pagePresent=false;app.acquisitionVersion++;app.acquiring=null;app.sessionReady=false;clearPrestigeContext();
  if(app.resumeOwnership)app.session.release();
  syncPause();suspendAudio();
}
export function events(batch:GameEvent[]){
  // Fresh terminal results are admitted before their dialog; menus and all
  // modal owners block new batches, including accepted menu confirmations.
  playCombatEvents(batch,app.game.profile.sound&&playable()&&!document.hidden&&!app.manualPaused&&!app.game.state.paused&&app.activeTab==='battle'&&app.modal===null);
  if(batch.some(event=>event.type==='win')&&guardAction()){const receipt=app.game.profile.pendingVictory,mask=receipt&&receipt.settlement==='mastery-v1'?receipt.newMask:0;app.game.dispatch({type:'weekly-sync',week:weekId(localDay()),earned:(mask&1)+((mask>>1)&1)+((mask>>2)&1)});}
  if(batch.some(event=>event.type==='win'||event.type==='lose'))persist();
}
