import type {GameEvent} from '../game/types.ts';

export const VILLAGE_MUSTER_DURATION=2.4;

export interface VillageMusterState {readonly startedAt:number|null}
export interface VillageMusterFrame {readonly progress:number}

const EMPTY:VillageMusterState=Object.freeze({startedAt:null});

export function createVillageMuster():Readonly<VillageMusterState> {return EMPTY;}

export function rememberVillageMuster(previous:Readonly<VillageMusterState>,event:Readonly<GameEvent>,time:number):Readonly<VillageMusterState> {
 if(previous.startedAt!==null||event.type!=='spawn'||event.side!=='player'||!Number.isFinite(time)||time<0)return previous;
 return Object.freeze({startedAt:time});
}

export function villageMusterFrame(state:Readonly<VillageMusterState>,time:number,reduced:boolean):Readonly<VillageMusterFrame>|null {
 if(state.startedAt===null||!Number.isFinite(state.startedAt)||!Number.isFinite(time))return null;
 const elapsed=time-state.startedAt;
 if(elapsed<0||elapsed>=VILLAGE_MUSTER_DURATION)return null;
 return Object.freeze({progress:reduced?1:Math.max(0,Math.min(1,elapsed/VILLAGE_MUSTER_DURATION))});
}
