import type {Game} from '../game/simulation.ts';
import {chronicleLandmarkStatus} from '../game/chronicle-combat.ts';
import {chronicleLandmarkFrame,chronicleLandmarkRenderPlan} from '../view/chronicle-landmark.ts';
import {arenaLayout} from '../view/visual-theme.ts';

/** With no enemy to select, native contact follows the painted cover. An enemy's
 * existing tactical menu owns Meteor as soon as one is alive, avoiding overlap. */
export function fieldCoverTarget(game:Game,width:number,height:number){
 if(game.state.units.some(unit=>unit.side==='enemy'&&unit.hp>0))return null;
 const status=chronicleLandmarkStatus(game.profile,game.state);
 if(status?.kind!=='cover'||status.phase==='broken'||!game.canUseSkill('meteor'))return null;
 const arena=arenaLayout(width,height),plan=chronicleLandmarkRenderPlan(arena.groundY,chronicleLandmarkFrame(status),status.x);
 const w=Math.max(44,61*arena.scale),h=Math.max(44,49*arena.scale);
 return {x:Math.max(0,Math.min(width-w,plan.x*arena.scale-w/2)),y:Math.max(0,Math.min(height-h,(arena.groundY-8)*arena.scale-h*.91)),width:w,height:h};
}
