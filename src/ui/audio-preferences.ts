import type {Phase} from '../game/types.ts';
export interface AudioMix {readonly effects:number;readonly atmosphere:number}
export const AUDIO_MIX_KEY='almo7areboon.audio.mix.v1';
export const DEFAULT_AUDIO_MIX:AudioMix={effects:100,atmosphere:100};
export function normalizeAudioMix(value:unknown):AudioMix {
 const object=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const level=(field:unknown)=>typeof field==='number'&&Number.isFinite(field)?Math.round(Math.max(0,Math.min(100,field))/5)*5:100;
 return {effects:level(object.effects),atmosphere:level(object.atmosphere)};
}
export function loadAudioMix(storage?:Pick<Storage,'getItem'>):AudioMix {
 try{const raw=(storage??globalThis.localStorage)?.getItem(AUDIO_MIX_KEY),data=raw?JSON.parse(raw):undefined;return data?.version===1?normalizeAudioMix(data):{...DEFAULT_AUDIO_MIX};}catch{return {...DEFAULT_AUDIO_MIX};}
}
export function saveAudioMix(mix:AudioMix,storage?:Pick<Storage,'setItem'>):boolean {
 try{const target=storage??globalThis.localStorage;if(!target)return false;target.setItem(AUDIO_MIX_KEY,JSON.stringify({version:1,...normalizeAudioMix(mix)}));return true;}catch{return false;}
}
export const ATMOSPHERE_KEY='almo7areboon.audio.atmosphere.v1';
export function loadAtmosphere(storage?:Pick<Storage,'getItem'>):boolean {
 try{return (storage??globalThis.localStorage)?.getItem(ATMOSPHERE_KEY)!=='off';}catch{return true;}
}
export function saveAtmosphere(enabled:boolean,storage?:Pick<Storage,'setItem'>):boolean {
 try{const target=storage??globalThis.localStorage;if(!target)return false;target.setItem(ATMOSPHERE_KEY,enabled?'on':'off');return true;}catch{return false;}
}
export function ambienceAllowed(state:{sound:boolean;atmosphere:boolean;paused:boolean;hidden:boolean;tab:string;modal:string|null;phase:Phase}):boolean {
 return state.sound&&state.atmosphere&&!state.paused&&!state.hidden&&state.tab==='battle'&&!state.modal&&(state.phase==='ready'||state.phase==='running');
}
