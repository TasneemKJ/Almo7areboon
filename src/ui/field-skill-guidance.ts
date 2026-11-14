/** Adapt the canonical teaching decision to physical enemy selection; do not
 * duplicate or broaden its wins, time, skill-use or enemy-count predicates.
 * Recognises the canonical line through the same GUIDE pairs that wrote it, in either language. */
export function physicalSkillCue(canonical:string,supportName=GUIDE.foodDropName()):string {
 if(canonical.startsWith(GUIDE.danger()))return canonical;
 if(canonical.startsWith(GUIDE.foodDrop()))return canonical.replace(GUIDE.foodDrop(),tr('Tap Supplies for Food Drop: add','انقر على المؤن لإمداد المؤونة: يضيف'));
 if(canonical.startsWith(GUIDE.piling()))return canonical;
 if(canonical.includes(GUIDE.tapFreeze()))return tr('Select an enemy, then Freeze to hold the group.','اختر عدوّاً، ثم «التجميد» لتوقف المجموعة.');
 if(canonical.includes(GUIDE.tapMeteor()))return tr('Select an enemy, then Meteor to strike the group.','اختر عدوّاً، ثم «النيزك» لتضرب المجموعة.');
 if(canonical.startsWith(GUIDE.trySkill())&&canonical.includes(supportName))return tr(`Select supplies, then ${supportName}. Each skill works once per battle.`,`اختر المؤن، ثم ${supportName}. كلّ مهارة تعمل مرّةً في المعركة.`);
 if(canonical.startsWith(GUIDE.affordable()))return `${GUIDE.affordable()} ${tr('Visit Company in Camp after this battle to unlock them.','زُر «السريّة» في المخيّم بعد هذه المعركة لتفتحهم.')}`;
 return canonical;
}
/** One physical instruction: immediate needs precede the current authored objective. */
export function physicalFieldCue(profile:Profile,state:BattleState,preview:WavePreview|null,melee:Readonly<DeploymentStatus>,supportName=GUIDE.foodDropName()):string {
 const canonical=battleGuidance(profile,state,preview,melee),story=state.chronicle;
 const immediate=canonical.startsWith(GUIDE.danger())||canonical.startsWith(GUIDE.piling())
  ||canonical.includes(GUIDE.tapFreeze())||canonical.includes(GUIDE.tapMeteor())||canonical.startsWith(GUIDE.trySkill())
  ||canonical.startsWith(GUIDE.needCover());
 // Generic road formation advice yields during the canonical eight-second wave-teaching window.
 const incoming=story?.route==='road'&&preview!==null&&preview.nextIn<=8;
 const objective=story?.enabled&&state.phase==='running'&&!state.paused&&state.stats.deployed>0
  &&!immediate&&!incoming&&melee.reason!=='food'
  &&(story.route!=='road'||story.rally||profile.unlocked[1]);
 return physicalSkillCue(objective?chronicleGuidance(profile,state):canonical,supportName);
}
import {chronicleGuidance} from '../game/chronicle-combat.ts';
import type {BattleState,DeploymentStatus,Profile} from '../game/types.ts';
import type {WavePreview} from '../game/encounters.ts';
import {battleGuidance,GUIDE} from './battle-hud.ts';
import {tr} from './i18n.ts';
