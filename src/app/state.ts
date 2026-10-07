

import { type CampOwner } from '../ui/camp-owner.ts';
import { Game } from '../game/simulation.ts';
import type { AudioMix } from '../game/audio-mix.ts';
import type { Phase } from '../game/types.ts';
import type { SaveSession } from '../game/save-session.ts';
import type { BattlefieldPort } from '../game/battlefield-port.ts';
import { defaultProfile } from '../game/save.ts';
import type { LegacyChoice, Profile } from '../game/types.ts';
import { type VillagePresentation } from '../view/village-mood.ts';
import { loadAtmosphere, loadAudioMix } from '../ui/audio-preferences.ts';

/** Every piece of mutable shell state, in one object that the app modules share. */
export interface AppState {
  game: Game;
  activeTab: string;
  modal: string|null;
  manualPaused: boolean;
  battlefieldPointer: {id:number;x:number;y:number}|null;
  villagePresentation: VillagePresentation|null;
  atmosphereEnabled: boolean;
  audioMix: AudioMix;
  lastSavedAt: number;
  lastUpdate: number;
  lastSave: number;
  resultShown: string;
  lastPhase: Phase;
  resultDue: number;
  toastTimer: number;
  focusFrame: number;
  modalVersion: number;
  savedWarning: boolean;
  pendingImport: Profile|null;
  importRequest: number;
  evolutionFromResult: boolean;
  prestigeOrigin: 'result'|'battles'|null;
  prestigeDraft: LegacyChoice|null;
  prestigeExpectedTimeline: number|null;
  modalPointerSequence: boolean;
  sessionReady: boolean;
  pagePresent: boolean;
  resumeOwnership: boolean;
  acquisitionVersion: number;
  hasPlayed: boolean;
  entryEntered: boolean;
  entrySaved: boolean;
  resultDetailsOpen: boolean;
  entryWelcome: string|null;
  settingsOrigin: 'field-pause'|null;
  campOwner: CampOwner|null;
  campRenderKey: string;
  questSelection: string|null;
  questCalendarDay: number|null;
  acquiring: Promise<void>|null;
  focusBefore: HTMLElement|null;
  session: SaveSession;
  retriedSession: boolean;
  port: BattlefieldPort;
  renderer: {destroy():void}|null;
  rendererClosed: boolean;
}

// The initial render is a non-playable default. Only ownership makes a loaded Game authoritative.
const game=new Game(defaultProfile());

export const app:AppState={
  game,
  activeTab: 'battle',
  modal: null,
  manualPaused: false,
  battlefieldPointer: null,
  villagePresentation: null,
  atmosphereEnabled: loadAtmosphere(),
  audioMix: loadAudioMix(),
  lastSavedAt: 0,
  lastUpdate: 0,
  lastSave: 0,
  resultShown: '',
  lastPhase: game.state.phase,
  resultDue: 0,
  toastTimer: 0,
  focusFrame: 0,
  modalVersion: 0,
  savedWarning: false,
  pendingImport: null,
  importRequest: 0,
  evolutionFromResult: false,
  prestigeOrigin: null,
  prestigeDraft: null,
  prestigeExpectedTimeline: null,
  modalPointerSequence: false,
  sessionReady: false,
  pagePresent: true,
  resumeOwnership: false,
  acquisitionVersion: 0,
  hasPlayed: false,
  entryEntered: false,
  entrySaved: false,
  resultDetailsOpen: false,
  entryWelcome: null,
  settingsOrigin: null,
  campOwner: null,
  campRenderKey: '',
  questSelection: null,
  questCalendarDay: null,
  acquiring: null,
  focusBefore: null,
  retriedSession: false,
  renderer: null,
  rendererClosed: false,
} as AppState;
