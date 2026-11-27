import type {Game} from '../game/simulation.ts';
import type {BattleState,Profile} from '../game/types.ts';
import {tr} from './i18n.ts';

/**
 * DESIGN.md #79 «سطرٌ واحد»: the first battle of a new company opens with the storyteller's one line (intro-screen.ts
 * FIELD_TALE) and then teaches through the world, not the guide line: the food sack glows when a soldier can be paid
 * for, a ripple shows where a tap sends him, dust on the road and a horn from the far hill say a stronger wave is near,
 * and the gate's stones crack as it is hurt (base-damage.ts). The guide's lessons come after, in the storyteller's
 * voice, in the result's chronicle. A short line returns only for a player who has sent nothing for 8 s.
 */
export const IDLE_LINE_SECONDS=1.5;
/** How long a player may stand still before the ripple shows where a tap would send a soldier. */
export const RIPPLE_IDLE_SECONDS=1.0;
/** The dust rises this long before a stronger wave reaches the road. */
export const DUST_LEAD_SECONDS=4;

/** The first battle: chapter 1 of the first timeline for a company that has never won (its result included). */
export function isFirstBattle(p:Readonly<Profile>,s:Readonly<BattleState>):boolean {
 return p.enemyAge===0&&p.timeline===1&&!s.dusk&&(s.phase==='won'?p.wins===1:p.wins===0);
}

/** The guide in the first battle: silent, except one short line after 8 s with nothing sent and a soldier affordable. */
export function quietGuidance(game:Game,idleSeconds:number):string {
 const s=game.state,threshold=s.stats.deployed>0?8:IDLE_LINE_SECONDS;
 if(s.phase!=='running'||s.paused||!(idleSeconds>=threshold)||!game.deploymentStatus(0).allowed)return '';
 return tr('Tap a troop card below to send a soldier.','اختر بطاقة مقاتل في الأسفل لترسل جندياً.');
}

export interface WorldTeaching {foodReady:boolean;ripple:boolean;dust:boolean;/** The wave the horn announces, once. */horn:number|null}
/** What the world shows now. `idleSeconds`: battle seconds since the last soldier went out (or since the start). */
export function worldTeaching(game:Game,idleSeconds:number):WorldTeaching {
 const s=game.state,running=s.phase==='running'&&!s.paused,foodReady=running&&game.deploymentStatus(0).allowed;
 const first=isFirstBattle(game.profile,s);
 const ripple=first&&foodReady&&(s.stats.deployed<3||idleSeconds>=IDLE_LINE_SECONDS)&&idleSeconds>=RIPPLE_IDLE_SECONDS;
 const preview=running?game.waveStatus().preview:null;
 const stronger=!!preview&&preview.counts[0]+preview.counts[1]+preview.counts[2]>=2&&preview.nextIn<=DUST_LEAD_SECONDS;
 return {foodReady,ripple,dust:stronger,horn:stronger?preview!.number:null};
}

/** The storyteller's chronicle of the first battle: two or three lines naming the troops and the village, never the
 * player (no gendered address in Arabic). They carry what the guide used to say during the battle. */
export function firstBattleTale(p:Readonly<Profile>,s:Readonly<BattleState>):string[] {
 if(!isFirstBattle(p,s)||(s.phase!=='won'&&s.phase!=='lost'))return [];
 const won=s.phase==='won',sent=s.stats.deployed;
 const lines=[won
  ?(sent>=6?tr('The Pathkeepers went out one after another, and the dust never reached the gate. They held.','خرج حرّاس الدرب واحداً بعد واحد، فلم يبلغ الغبارُ البوّابة. ثبتوا.')
   :tr('Only a few Pathkeepers went out, and it was enough. The village is still talking about it.','لم يخرج من حرّاس الدرب إلا قليل، وكفى ذلك. وما زالت القرية تتحدّث عنه.'))
  :tr('The gate fell this time. The village has a gate again by morning; it has done this before.','سقطت البوّابة هذه المرّة، وستكون للقرية بوّابةٌ أخرى قبل الصباح، فقد اعتادت ذلك.')];
 const lessons:string[]=[];
 if(!won||sent<6)lessons.push(tr('Bread came into the sack all battle long. Each time it glowed, one more Pathkeeper could have gone out.','كانت المؤونة تتجمّع في الكيس طوال المعركة، وكلّما توهّج كان في الوسع أن يخرج حارسٌ آخر.'));
 if(!((s.stats.ordersCast??0)>0))lessons.push(tr('The banner stayed planted all battle. Carried forward when its cloth is lit, it quickens every step.','بقيت الراية مغروسة طوال المعركة، ولو حُملت إلى الأمام حين يضيء قماشها لأسرعت كلّ خطوة.'));
 if(!s.skillsUsed.includes('food'))lessons.push(tr('The supplies by the gate stayed closed. They hold one handful of bread for every battle.','بقيت المؤن عند البوّابة مغلقة، وفيها حفنة خبزٍ لكلّ معركة.'));
 if(!s.skillsUsed.includes('freeze'))lessons.push(tr('The frost stayed in its jar. When the horn sounds and the road crowds, it holds the rivals for a few breaths.','بقي الصقيع في جرّته، وحين يدوّي البوق ويزدحم الطريق يوقف الخصوم بضعة أنفاس.'));
 lessons.push(tr('When the dust rose on the road, the Pathkeepers who walked together held the longest.','حين ارتفع الغبار على الطريق، كان أطولَ الحرّاس صموداً من ساروا معاً.'));
 return [...lines,...lessons.slice(0,2)];
}
