import { encounterForAge, type WaveIntent } from '../game/encounters.ts';
import type { Phase, BattleStats } from '../game/types.ts';
import { battleStats } from '../game/statistics.ts';
import { chapterPresentation } from './chapter-presentation.ts';
import { isArabic, tr } from './i18n.ts';

export interface ChapterScouting {
 readonly openingSeconds:number;
 readonly openingCounts:readonly [number,number,number];
 readonly opening:string;
 readonly threatSeconds:number;
 readonly threatIntent:WaveIntent;
 readonly threat:string;
 readonly counter:string;
}
const countsText=(counts:readonly number[])=>isArabic()
 ? counts.flatMap((count,kind)=>count?[`${['قتال قريب','رماية','ثقيل'][kind]}: ${count}`]:[]).join('، ')
 : counts.flatMap((count,kind)=>count?[`${count} ${['melee','ranged','heavy'][kind]}`]:[]).join(', ');

/** Scouting reads the opponent schedule, never the player's army age. */
export function chapterScouting(chapter:number):ChapterScouting {
 const encounter=encounterForAge(chapter),opening=encounter.waves[0];
 const threat=encounter.waves.find(wave=>wave.intent!=='rush')??opening;
 const counts=(members:typeof opening.members):readonly [number,number,number]=>Object.freeze([
  members.filter(member=>member.kind===0).length,
  members.filter(member=>member.kind===1).length,
  members.filter(member=>member.kind===2).length,
 ]);
 const openingCounts=counts(opening.members);
 return Object.freeze({openingSeconds:opening.time,openingCounts,
  opening:tr(`First wave: ${countsText(openingCounts)} in ${opening.time}s.`,`الموجة الأولى بعد ${opening.time} ث: ${countsText(openingCounts)}.`),
  threatSeconds:threat.time,threatIntent:threat.intent,
  threat:tr(`${threat.intent==='bulwark'?'Heavy pressure':'Ranged pressure'} at ${threat.time}s: ${countsText(counts(threat.members))}.`,`${threat.intent==='bulwark'?'ضغطٌ ثقيل':'ضغط الرماة'} عند ${threat.time} ث: ${countsText(counts(threat.members))}.`),
  counter:threat.intent==='bulwark'?tr('Ranged troops pierce heavy enemies. Keep a front line ahead of them.','الرماة يخترقون الأعداء الثقال. أبقِ أمامهم صفّاً أوّل.'):tr('Melee guards resist ranged attacks. Keep your ranged troops behind them.','حرّاس القتال القريب يصمدون أمام الرماية. أبقِ رماتك خلفهم.'),
 });
}

export function chapterScoutingHtml(chapter:number):string {
 const view=chapterScouting(chapter);
 return `<details class="chapter-scouting"><summary>${tr(`Scouting ${chapterPresentation(chapter).title}`,`استطلاع ${chapterPresentation(chapter).title}`)}</summary><p>${view.opening}</p><p>${view.threat}</p><p>${view.counter}</p><small>${tr('Times are battle seconds. Each wave can arrive in a staggered group.','الأوقات بثواني المعركة. قد تصل كلّ موجة على دفعات.')}</small></details>`;
}

/** Optional, repeatable help: no forced tutorial or persistent completion flag. */
export function battleTeachingHtml():string {
 return `<details class="chapter-scouting battle-teaching"><summary>${tr('How a battle works','كيف تجري المعركة')}</summary><p>${tr('Tap Battle to begin. Food grows during battle. Spend it on warriors; they move and fight automatically. Destroy the enemy base to win.','المس «المعركة» لتبدأ. تزداد المؤونة أثناء المعركة، فأنفقها على المحاربين، وهم يسيرون ويقاتلون وحدهم. دمّر حصن العدوّ لتنتصر.')}</p><p>${tr('Melee guards resist ranged attacks. Ranged troops pierce heavy enemies. Heavy troops can sweep two enemies at once. Unlock extra roles with coins, then protect your ranged troops with a front line.','حرّاس القتال القريب يصمدون أمام الرماية، والرماة يخترقون الأعداء الثقال، والثقال يكتسحون عدوّين معاً. افتح أنواعاً أخرى من الجنود بالنقود، ثم احمِ رماتك بصفٍّ أوّل.')}</p><p>${tr('Each skill works once per battle. Freeze starts immediately, even before enemies arrive: save it for a gathering group. Meteor hits living enemies in a group; Food Drop helps you deploy reinforcements.','كلّ مهارة تعمل مرّةً واحدة في المعركة. التجميد يبدأ فوراً، حتى قبل وصول الأعداء، فاحفظه لجمعٍ يتكتّل. النيزك يصيب الأعداء الأحياء المتجمّعين، وإمداد المؤونة يعينك على إرسال المدد.')}</p><p>${tr('Pause to think. Your coins stay after a defeat, so upgrade, change your formation and try again. Extra seals are optional challenges. Clear the chapter to continue.','توقّف لتفكّر. نقودك تبقى بعد الهزيمة، فطوّر وغيّر تشكيلتك وحاول من جديد. الأختام الإضافية تحدّياتٌ اختيارية. انتصر في الفصل لتتابع.')}</p></details>`;
}

/** Per chapter: the speaker (English, Arabic), then the won and lost lines as [English, Arabic]. */
type Line=readonly [string,string];
const voices:readonly (readonly [Line,Line,Line])[]=[
 [['The hearth-keeper says: ','تقول حارسة الموقد: '],['The soup can wait. You cannot.','الحساء ينتظر. أمّا أنت فلا.'],['Same fire tomorrow. Bring a bigger spoon.','النار نفسها غداً. أحضِر ملعقةً أكبر.']],
 [['A voice from the press-house: ','صوتٌ من المعصرة: '],['A fine watch. Even the olives approve.','حراسةٌ حسنة. حتى الزيتون راضٍ.'],['Bent branches still bear fruit. Try again.','الغصن المائل يحمل ثمراً. حاوِل من جديد.']],
 [['The quay-keeper says: ','يقول حارس الرصيف: '],['Not a fish out of place. Mostly.','ولا سمكة في غير مكانها. تقريباً.'],['A rough tide is still a tide. We will find our footing.','المدّ العاتي يبقى مدّاً. سنجد موطئ أقدامنا.']],
 [['The lantern-maker says: ','يقول صانع الفوانيس: '],['A bright evening. I shall take some credit.','مساءٌ مضيء. ولي فيه بعض الفضل.'],['One wick at a time. Then another watch.','فتيلةٌ بعد فتيلة. ثم حراسةٌ أخرى.']],
 [['The hill watch says: ','يقول حارس التلّة: '],['Tea first. Heroics after the kettle.','الشاي أوّلاً. والبطولات بعد الإبريق.'],['The kettle is patient. So are we.','الإبريق صبور. ونحن مثله.']],
 [['From the courtyard: ','من الساحة: '],['Strange stars. Familiar courage.','نجومٌ غريبة. وشجاعةٌ نعرفها.'],['The stars can wait. Begin again when you are ready.','النجوم تنتظر. ابدأ من جديد حين تكون جاهزاً.']],
];
export type VillageMoment='ordinary'|'freeze'|'meteor'|'company';
/** Sanitized attempt evidence only; no random chatter or persistent completion. */
export function villageMoment(stats?:Readonly<BattleStats>):VillageMoment {
 const attempt=battleStats(stats);
 if(attempt.maxFreezeTargets>=3)return 'freeze';
 if(attempt.meteorKills>=3)return 'meteor';
 if(attempt.deployedByKind.every(count=>count>=1))return 'company';
 return 'ordinary';
}
const reactions:readonly (readonly [Line,Line,Line])[]=[
 [['Even the soup went quiet for that Freeze. Briefly.','حتى الشوربة سكتت لذلك التجميد. قليلاً.'],['A Meteor! I said warm the supper, not the sky.','نيزك! قلتُ سخّنوا العشاء، لا السماء.'],['Three troop roles. At last, someone brought a plan with the spoons.','ثلاثة أنواع من الجنود. أخيراً جاء أحدهم بخطّةٍ مع الملاعق.']],
 [['That Freeze gave the olives a moment to think. They declined.','أعطى التجميدُ الزيتونَ لحظةً ليفكّر. فاعتذر.'],['The Meteor startled the olives. A rare achievement.','أفزع النيزكُ الزيتون. إنجازٌ نادر.'],['A whole company! The olives insist they supervised.','سريّةٌ كاملة! والزيتون يصرّ أنّه أشرف عليها.']],
 [['A group held still. Could you try that on the tide?','جمعٌ وقف ساكناً. هلّا جرّبت ذلك على المدّ؟'],['A Meteor at the quay. The fish have opinions.','نيزكٌ عند الرصيف. وللسمك رأيٌ في ذلك.'],['Three roles on watch. Even the gulls waited their turn.','ثلاثة أنواع في الحراسة. حتى النوارس انتظرت دورها.']],
 [['A gathering frozen still. The lanterns kept their warm manners.','جمعٌ تجمّد في مكانه. والفوانيس حافظت على دفء طباعها.'],['A Meteor! I cannot put that much light in a lantern.','نيزك! لا أقدر أن أضع كلّ هذا النور في فانوس.'],['Three roles working together. A well-trimmed wick of an army.','ثلاثة أنواع تعمل معاً. جيشٌ كفتيلةٍ مشذّبة.']],
 [['That Freeze bought a quiet moment. Tea almost happened.','اشترى التجميد لحظة هدوء. كاد الشاي يُصنع.'],['A Meteor! The kettle feels rather ordinary now.','نيزك! صار الإبريق يبدو عاديّاً.'],['A proper company. We will need the larger kettle.','سريّةٌ حقيقية. سنحتاج الإبريق الكبير.']],
 [['A group paused under strange stars. A familiar clever trick.','جمعٌ توقّف تحت نجومٍ غريبة. حيلةٌ ذكيّة نعرفها.'],['A Meteor among strange stars. We noticed that one.','نيزكٌ بين نجومٍ غريبة. هذا لاحظناه.'],['Three roles in the courtyard. Familiar teamwork, strange hats.','ثلاثة أنواع في الساحة. تعاونٌ نعرفه، وقبّعاتٌ غريبة.']],
];
/** Authored fictional dialogue only; no resident simulation or economic effect. */
export function villageVoice(chapter:number,phase:Phase,stats?:Readonly<BattleStats>):string {
 if(phase!=='won'&&phase!=='lost')return '';
 const index=Number.isInteger(chapter)&&chapter>=0&&chapter<voices.length?chapter:0;
 const [speaker,won,lost]=voices[index],moment=villageMoment(stats);
 const said=(line:Line)=>isArabic()?`${speaker[1]}«${line[1]}»`:`${speaker[0]}“${line[0]}”`;
 if(moment==='ordinary')return said(phase==='won'?won:lost);
 return said(reactions[index][moment==='freeze'?0:moment==='meteor'?1:2]);
}
