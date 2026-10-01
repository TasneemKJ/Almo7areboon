import type {WaveStatus} from './encounters.ts';
import type {Action,GamePort} from './types.ts';

export interface BattlefieldPort extends GamePort {waveStatus():WaveStatus}

/**
 * Keeps the browser's guarded dispatch/step ownership while forwarding every
 * read query required by the battlefield from the authoritative simulation.
 */
export function createBattlefieldPort(
 game:BattlefieldPort,
 dispatch:(action:Action)=>boolean,
 step:(dt:number)=>void,
):BattlefieldPort {
 return {
  get profile(){return game.profile;},
  get state(){return game.state;},
  dispatch,
  step,
  drainEvents:()=>game.drainEvents(),
  waveStatus:()=>game.waveStatus(),
 };
}
