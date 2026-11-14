import type {Game} from '../game/simulation.ts';
import {ERAS} from '../game/data.ts';
import {physicalFieldCue} from './field-skill-guidance.ts';
import {orderStatus} from './battle-orders.ts';
import {skillCue} from './skill-cues.ts';
import {GUIDE,secondsShort} from './battle-hud.ts';
import {tr} from './i18n.ts';
export {fieldAnnouncement} from './field-announcement.ts';

/** Preserve the canonical decision priority, with one physical instruction owner. */
export function fieldGuidance(game:Game):string {
 const p=game.profile,s=game.state;
 if(s.dusk&&s.phase==='ready')return tr(`Tap the field to hang a lamp (${s.dusk.lamps.length+1} of 3). Raiders show only in their light.`,`انقر على الساحة لتعلّق قنديلاً (${s.dusk.lamps.length+1} من 3). لا يظهر المغيرون إلا في نوره.`);
 if(s.phase!=='running')return '';
 const status=game.deploymentStatus(0),support=skillCue(p,s,'food',game.canUseSkill('food')).label.split(' · ')[0];
 const hint=physicalFieldCue(p,s,game.waveStatus().preview,status,support);
 if(s.paused||hint.startsWith(GUIDE.danger()))return hint;
 if(s.stats.deployed===0)return tr(`Tap the field to send your first troop. ${ERAS[p.age].units[0].cost} food.`,`انقر على الساحة لترسل جنديّك الأوّل. كلفته ${ERAS[p.age].units[0].cost} من المؤونة.`);
 if(hint)return hint;
 if(status.reason==='food')return tr(`The camp needs food. Ready in ${Math.ceil(status.waitSeconds)}s.`,`المخيّم يحتاج إلى مؤونة. جاهز بعد ${secondsShort(Math.ceil(status.waitSeconds))}.`);
 if(p.wins===0&&s.stats.deployed<3)return tr('Tap the troop again when its card lights.','انقر على الجنديّ مرّة أخرى حين تضيء بطاقته.');
 return orderStatus(s).canCast?tr('Momentum ready. Drag the banner forward to advance, back to hold.','الزخم جاهز. اسحب الراية إلى الأمام لتتقدّم، وإلى الخلف لتثبت.'):'';
}
