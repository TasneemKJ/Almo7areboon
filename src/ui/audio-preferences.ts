import type {Phase} from '../game/types.ts';
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
