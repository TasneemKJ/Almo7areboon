import type {Game} from '../game/simulation.ts';
import {ERAS} from '../game/data.ts';
import {physicalFieldCue} from './field-skill-guidance.ts';
import {orderStatus} from './battle-orders.ts';
import {skillCue} from './skill-cues.ts';
export {fieldAnnouncement} from './field-announcement.ts';

/** Preserve the canonical decision priority, with one physical instruction owner. */
export function fieldGuidance(game:Game):string {
 const p=game.profile,s=game.state;
 if(s.phase!=='running')return '';
 const status=game.deploymentStatus(0),support=skillCue(p,s,'food',game.canUseSkill('food')).label.split(' · ')[0];
 const hint=physicalFieldCue(p,s,game.waveStatus().preview,status,support);
 if(s.paused||hint.startsWith('Your base is in danger.'))return hint;
 if(s.stats.deployed===0)return `Tap the waiting defender. ${ERAS[p.age].units[0].cost} food.`;
 if(hint)return hint;
 if(status.reason==='food')return `The camp needs food. Ready in ${Math.ceil(status.waitSeconds)}s.`;
 if(p.wins===0&&s.stats.deployed<3)return 'Tap the defender again when their ground lights.';
 return orderStatus(s).canCast?'Momentum ready. Your gate holds; their gate advances.':'';
}
