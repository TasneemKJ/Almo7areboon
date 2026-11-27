import type {Game} from '../game/simulation.ts';
import {ERAS} from '../game/data.ts';
import {physicalFieldCue} from './field-skill-guidance.ts';
import {orderStatus} from './battle-orders.ts';
import {skillCue} from './skill-cues.ts';
import {GUIDE,secondsShort} from './battle-hud.ts';
import {tr} from './i18n.ts';
import {isFirstBattle,quietGuidance} from './first-battle.ts';
export {fieldAnnouncement} from './field-announcement.ts';

/** Preserve the canonical decision priority, with one physical instruction owner. */
export function fieldGuidance(game:Game,idleSeconds=0):string {
 const p=game.profile,s=game.state;
 // The first battle teaches through the world (first-battle.ts, DESIGN.md #79).
 if(isFirstBattle(p,s))return quietGuidance(game,idleSeconds);
 if(s.dusk&&s.phase==='ready')return tr(`Tap the field to hang a lamp (${s.dusk.lamps.length+1} of 3). Raiders show only in their light.`,`انقر على الساحة لتعلّق قنديلاً (${s.dusk.lamps.length+1} من 3). لا يظهر المغيرون إلا في نوره.`);
 if(s.phase!=='running')return '';
 const status=game.deploymentStatus(0),support=skillCue(p,s,'food',game.canUseSkill('food')).label.split(' · ')[0];
 const hint=physicalFieldCue(p,s,game.waveStatus().preview,status,support);
 if(s.paused||hint.startsWith(GUIDE.danger()))return hint;
 if(s.stats.deployed===0)return tr(`Tap a troop card to send your first troop. ${ERAS[p.age].units[0].cost} food.`,`اختر بطاقة مقاتل لترسل جنديّك الأوّل. كلفته ${ERAS[p.age].units[0].cost} من المؤونة.`);
 // Orders are dragged (2026-11-15: a tap never orders). Until this battle's first order the drag lesson shares the
 // line with tactical hints, six seconds each, so neither goes unseen; danger and pause (above) still come first.
 const drag=tr('Momentum ready. Choose Advance or Hold below.','الزخم جاهز. اختر تقدّم أو اثبُت أدناه.');
 if(orderStatus(s).canCast&&!((s.stats.ordersCast??0)>0)&&(!hint||dragTurn(s.time)))return drag;
 if(hint)return hint;
 if(status.reason==='food')return tr(`The camp needs food. Ready in ${Math.ceil(status.waitSeconds)}s.`,`المخيّم يحتاج إلى مؤونة. جاهز بعد ${secondsShort(Math.ceil(status.waitSeconds))}.`);
 if(p.wins===0&&s.stats.deployed<3)return tr('Tap the troop again when its card lights.','انقر على الجنديّ مرّة أخرى حين تضيء بطاقته.');
 return orderStatus(s).canCast?drag:'';
}

/** The drag lesson's share of the guide line while a hint is also due: the even six-second slices of battle time. */
export function dragTurn(time:number):boolean{return Math.floor(Math.max(0,time)/6)%2===0;}
