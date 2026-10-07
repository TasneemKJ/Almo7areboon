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
import { disposeAudio, updateAudioMix } from './view/audio.ts';
import { weekId } from './game/weekly.ts';
import { Game } from './game/simulation.ts';
import { defaultProfile } from './game/save.ts';
import { createRuntime } from './app/runtime.ts';
import { createLifecycle } from './app/lifecycle.ts';
import { createNavigation } from './app/navigation.ts';
import { createQuests } from './app/quests.ts';
import { installListeners } from './app/listeners.ts';
import type { ShellApi } from './app/shell.ts';

// Composition root: the DOM handles and the flow modules are wired here and nowhere else. Each module owns its state.
// The initial render is a non-playable default. Only ownership makes a loaded Game authoritative.
const initialGame = new Game(defaultProfile());
const dom = createRuntime(initialGame.profile);
const { $, root, lifetime, isolateModal } = dom;
const ports = {} as ShellApi;
const wiring = { dom, ports };
Object.assign(ports, createLifecycle({ ...wiring, initialGame }), createNavigation(wiring), createQuests(wiring));
installListeners(wiring);
updateAudioMix(ports.sessionState.audioMix);
const port=createBattlefieldPort(()=>ports.sessionState.game,ports.action,dt=>{
  ports.syncPause();if(!ports.playable())return;
  // Establish the calendar baseline before this frame can award seals. Home and pause remain read-only.
  if(ports.sessionState.game.state.phase==='running'&&!ports.sessionState.game.state.paused&&(ports.sessionState.game.state.time===0||!ports.sessionState.game.profile.weekly||ports.sessionState.game.profile.weekly.week<weekId(localDay()))){
    if(!ports.guardAction())return;
    ports.sessionState.game.dispatch({type:'weekly-sync',week:weekId(localDay())});
  }
  ports.sessionState.game.step(dt*ports.sessionState.game.profile.speed);
});
ports.rebuildArmy();
ports.syncMotion();
ports.syncPause();
ports.update(true);
let renderer:{destroy():void}|null=null,rendererClosed=false;
$('battlefield').dataset.renderer='loading';
void import('./view/battlefield.ts').then(({mountBattlefield})=>{
  if(rendererClosed)return;
  renderer=mountBattlefield($('battlefield'),port,force=>ports.update(force),ports.events,{isVisible:()=>ports.navState.entryEntered&&root!.dataset.fieldMode==='field'&&ports.navState.activeTab==='battle'&&!dom.hidden(),villageMood:()=>ports.sessionState.villagePresentation!.mood,onPresentation:ports.syncVillagePresentation});
  $('battlefield').dataset.renderer='ready';
}).catch(()=>{$('battlefield').dataset.renderer='failed';ports.syncEntry();ports.toast('The battlefield could not load. Check your connection and reload.');});
lifetime.add(()=>{rendererClosed=true;renderer?.destroy();});
lifetime.add(disposeAudio);
lifetime.add(()=>{dom.clearTimer(ports.sessionState.toastTimer);dom.cancelFrame(ports.navState.focusFrame);isolateModal(false);});
lifetime.add(()=>{ports.sessionState.acquisitionVersion++;ports.sessionState.sessionReady=false;ports.sessionState.session.dispose();});
if(import.meta.hot)import.meta.hot.dispose(()=>{ports.suspendSession();lifetime.dispose();});
if(import.meta.env.PROD)dom.registerWorker('./sw.js');
ports.sessionPresentation('starting');
void ports.acquireSession();
