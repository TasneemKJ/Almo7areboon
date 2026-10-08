/** Adapt the canonical teaching decision to physical enemy selection; do not
 * duplicate or broaden its wins, time, skill-use or enemy-count predicates. */
export function physicalSkillCue(canonical:string):string {
 if(canonical.startsWith('Your base is in danger.'))return canonical;
 if(canonical.startsWith('Food Drop adds'))return canonical.replace('Food Drop adds','Tap Supplies for Food Drop: add');
 if(canonical.startsWith('Food is piling up'))return canonical;
 if(canonical.includes('Tap Freeze'))return 'Select an enemy, then Freeze to hold the group.';
 if(canonical.includes('Tap Meteor'))return 'Select an enemy, then Meteor to strike the group.';
 if(canonical.startsWith('Ranged troops are affordable.'))return 'Ranged troops are affordable. Visit Company in Camp after this battle to unlock them.';
 return canonical;
}
/** One physical instruction: immediate needs precede the current authored objective. */
export function physicalFieldCue(profile:Profile,state:BattleState,preview:WavePreview|null,melee:Readonly<DeploymentStatus>):string {
 const canonical=battleGuidance(profile,state,preview,melee),story=state.chronicle;
 const immediate=canonical.startsWith('Your base is in danger.')||canonical.startsWith('Food is piling up')
  ||canonical.includes('Tap Freeze')||canonical.includes('Tap Meteor')||canonical.startsWith('Try a skill:')
  ||canonical.startsWith('Ranged troops need cover.');
 // Generic road formation advice yields during the canonical eight-second wave-teaching window.
 const incoming=story?.route==='road'&&preview!==null&&preview.nextIn<=8;
 const objective=story?.enabled&&state.phase==='running'&&!state.paused&&state.stats.deployed>0
  &&!immediate&&!incoming&&melee.reason!=='food'
  &&(story.route!=='road'||story.rally||profile.unlocked[1]);
 return physicalSkillCue(objective?chronicleGuidance(profile,state):canonical);
}
import {chronicleGuidance} from '../game/chronicle-combat.ts';
import type {BattleState,DeploymentStatus,Profile} from '../game/types.ts';
import type {WavePreview} from '../game/encounters.ts';
import {battleGuidance} from './battle-hud.ts';
