import type {Game} from '../game/simulation.ts';
import {chronicleGuidance} from '../game/chronicle-combat.ts';
import {ERAS} from '../game/data.ts';
import {battleGuidance} from './battle-hud.ts';
import {physicalSkillCue} from './field-skill-guidance.ts';
import {orderStatus} from './battle-orders.ts';
import {skillCue} from './skill-cues.ts';

/** The physical field retains the canonical decision, then its authored mission. */
export function fieldGuidance(game:Game):string {
 const p=game.profile,s=game.state;
 if(s.phase!=='running'||s.paused)return '';
 const status=game.deploymentStatus(0),canonical=battleGuidance(p,s,game.waveStatus().preview,status);
 const support=skillCue(p,s,'food',game.canUseSkill('food')).label.split(' · ')[0];
 const hint=physicalSkillCue(canonical,support);
 if(canonical.startsWith('Your base is in danger.'))return hint;
 if(s.stats.deployed===0)return `Tap the waiting defender. ${ERAS[p.age].units[0].cost} food.`;
 if(hint)return hint;
 const story=s.chronicle?.objective!=='siege'?chronicleGuidance(p,s):'';if(story)return story;
 if(status.reason==='food')return `The camp needs food. Ready in ${Math.ceil(status.waitSeconds)}s.`;
 if(p.wins===0&&s.stats.deployed<3)return 'Tap the defender again when their ground lights.';
 return orderStatus(s).canCast?'Momentum ready. Your gate holds; their gate advances.':'';
}

/** A live instruction has a stable meaning; changing progress remains visually readable. */
export function fieldAnnouncement(message:string):string {
 if(message.startsWith('The camp needs food.'))return 'The camp needs food. Wait for the defender’s ground to light.';
 if(message.startsWith('Food is piling up'))return message.replace(/ \(\d+\)/,'');
 if(message.startsWith('Flour cart '))return 'Escort the flour cart. Keep nearby enemies away.';
 if(message.startsWith('Keep the courtyard safe ·'))return 'Keep the courtyard safe until the watch ends.';
 if(message.startsWith('Scout returning home ·'))return 'The scout is returning home. Protect the road.';
 if(message.startsWith('Free the scout ·'))return 'Free the scout. Stand beside the cage.';
 if(/^Lantern \d/.test(message))return 'Hold the lantern, then break the gate.';
 if(message.startsWith('Bell ringing in '))return 'The bell is about to ring. Interrupt with a heavy strike.';
 if(message.startsWith('Bell Keeper ·'))return 'Defeat the Bell Keeper, then break the gate.';
 if(message.startsWith('Gathering '))return 'Gathering troops. Release when your company is ready.';
 if(/^(Claiming|Reclaiming) /.test(message))return `${message.split(' · ')[0]}. Keep the ground clear.`;
 if(message.startsWith('Enemy claiming '))return `${message.split(' · ')[0]}. Contest the ground.`;
 if(/^(Claim|Reclaim) the lantern ·/.test(message))return message.replace(/for [\d.]+ seconds?/, 'until it is yours');
 return message;
}
