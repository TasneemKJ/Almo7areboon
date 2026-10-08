import type {Game} from '../game/simulation.ts';
import {chronicleLandmarkStatus} from '../game/chronicle-combat.ts';

/** A painted shelter is the fallback only when no living enemy owns the target. */
export function fieldCoverTarget(game:Game){
 if(game.state.units.some(unit=>unit.side==='enemy'&&unit.hp>0))return null;
 const landmark=chronicleLandmarkStatus(game.profile,game.state);
 return landmark?.kind==='cover'&&landmark.phase!=='broken'&&game.canUseSkill('meteor')?landmark:null;
}
