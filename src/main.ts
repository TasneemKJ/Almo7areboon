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
import { createAppState } from './app/state.ts';
import { createRuntime } from './app/runtime.ts';
import { createLifecycle } from './app/lifecycle.ts';
import { createNavigation } from './app/navigation.ts';
import { createQuests } from './app/quests.ts';
import { installListeners } from './app/listeners.ts';
import type { ShellApi } from './app/shell.ts';

// Composition root: state, DOM handles and the three flow modules are wired here and nowhere else.
const state = createAppState();
const dom = createRuntime(state.game.profile);
const { $, root, lifetime, isolateModal } = dom;
const ports = {} as ShellApi;
const wiring = { state, dom, ports };
Object.assign(ports, createLifecycle(wiring), createNavigation(wiring), createQuests(wiring));
installListeners(wiring);
updateAudioMix(state.audioMix);
state.session=createSaveSession({
  // Access storage inside the guarded read/write, since the browser getter itself can throw.
  storage:dom.storage(),
  locks:dom.locks(),
  onStatus:ports.sessionPresentation,
});
state.port=createBattlefieldPort(()=>state.game,ports.action,dt=>{
  ports.syncPause();if(!ports.playable())return;
  // Establish the calendar baseline before this frame can award seals. Home and pause remain read-only.
  if(state.game.state.phase==='running'&&!state.game.state.paused&&(state.game.state.time===0||!state.game.profile.weekly||state.game.profile.weekly.week<weekId(localDay()))){
    if(!ports.guardAction())return;
    state.game.dispatch({type:'weekly-sync',week:weekId(localDay())});
  }
  state.game.step(dt*state.game.profile.speed);
});
ports.rebuildArmy();
ports.syncMotion();
ports.syncPause();
ports.update(true);
$('battlefield').dataset.renderer='loading';
void import('./view/battlefield.ts').then(({mountBattlefield})=>{
  if(state.rendererClosed)return;
  state.renderer=mountBattlefield($('battlefield'),state.port,force=>ports.update(force),ports.events,{isVisible:()=>state.entryEntered&&root!.dataset.fieldMode==='field'&&state.activeTab==='battle'&&!dom.hidden(),villageMood:()=>state.villagePresentation!.mood,onPresentation:ports.syncVillagePresentation});
  $('battlefield').dataset.renderer='ready';
}).catch(()=>{$('battlefield').dataset.renderer='failed';ports.syncEntry();ports.toast('The battlefield could not load. Check your connection and reload.');});
lifetime.add(()=>{state.rendererClosed=true;state.renderer?.destroy();});
lifetime.add(disposeAudio);
lifetime.add(()=>{dom.clearTimer(state.toastTimer);dom.cancelFrame(state.focusFrame);isolateModal(false);});
lifetime.add(()=>{state.acquisitionVersion++;state.sessionReady=false;state.session.dispose();});
if(import.meta.hot)import.meta.hot.dispose(()=>{ports.suspendSession();lifetime.dispose();});
if(import.meta.env.PROD)dom.registerWorker('./sw.js');
ports.sessionPresentation('starting');
void ports.acquireSession();
