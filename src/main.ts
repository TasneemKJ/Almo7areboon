
import './ui/quest-records.css';
import './ui/camp.css';
import './ui/world-play.css';
import './ui/chronicle.css';
import './style.css';
import './ui/continuation.css';
import './ui/material-language.css';
import './ui/combat-focus.css';
import './ui/era-glow.css';
import './ui/readability.css';
import './ui/layout-polish.css';
import './ui/skill-cues.css';
import './ui/battle-banner.css';
import './ui/simple-entry.css';
import './ui/preferences.css';
import './ui/landscape-rail.css';
import { createBattlefieldPort } from './game/battlefield-port.ts';
import { localDay } from './game/data.ts';
import { createSaveSession } from './game/save-session.ts';
import { disposeAudio, updateAudioMix } from './view/audio.ts';
import { weekId } from './game/weekly.ts';
import './app/listeners.ts';
import { app } from './app/state.ts';
import { acquireSession, action, events, guardAction, playable, rebuildArmy, sessionPresentation, suspendSession, syncMotion, syncPause, syncVillagePresentation, toast, update } from './app/lifecycle.ts';
import { $, isolateModal, lifetime, root } from './app/runtime.ts';
import { syncEntry } from './app/navigation.ts';

updateAudioMix(app.audioMix);
app.session=createSaveSession({
  // Access storage inside the guarded read/write, since the browser getter itself can throw.
  storage:{getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)},
  locks:navigator.locks??null,
  onStatus:sessionPresentation,
});
app.port=createBattlefieldPort(()=>app.game,action,dt=>{
  syncPause();if(!playable())return;
  // Establish the calendar baseline before this frame can award seals. Home and pause remain read-only.
  if(app.game.state.phase==='running'&&!app.game.state.paused&&(app.game.state.time===0||!app.game.profile.weekly||app.game.profile.weekly.week<weekId(localDay()))){
    if(!guardAction())return;
    app.game.dispatch({type:'weekly-sync',week:weekId(localDay())});
  }
  app.game.step(dt*app.game.profile.speed);
});
rebuildArmy();
syncMotion();
syncPause();
update(true);
$('battlefield').dataset.renderer='loading';
void import('./view/battlefield.ts').then(({mountBattlefield})=>{
  if(app.rendererClosed)return;
  app.renderer=mountBattlefield($('battlefield'),app.port,force=>update(force),events,{isVisible:()=>app.entryEntered&&root!.dataset.fieldMode==='field'&&app.activeTab==='battle'&&!document.hidden,villageMood:()=>app.villagePresentation!.mood,onPresentation:syncVillagePresentation});
  $('battlefield').dataset.renderer='ready';
}).catch(()=>{$('battlefield').dataset.renderer='failed';syncEntry();toast('The battlefield could not load. Check your connection and reload.');});
lifetime.add(()=>{app.rendererClosed=true;app.renderer?.destroy();});
lifetime.add(disposeAudio);
lifetime.add(()=>{window.clearTimeout(app.toastTimer);window.cancelAnimationFrame(app.focusFrame);isolateModal(false);});
lifetime.add(()=>{app.acquisitionVersion++;app.sessionReady=false;app.session.dispose();});
if(import.meta.hot)import.meta.hot.dispose(()=>{suspendSession();lifetime.dispose();});
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{/* Offline play is optional. */});},{once:true});
sessionPresentation('starting');
void acquireSession();
