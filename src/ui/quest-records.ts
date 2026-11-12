import { dailyReward, MAX_DAILY_DAY, QUESTS } from '../game/data.ts';
import { weekId, weeklyStatus } from '../game/weekly.ts';
import type { Action, Profile } from '../game/types.ts';
import { n, tr } from './i18n.ts';

export interface QuestRecord {
 key:string;title:string;kind:'daily'|'weekly'|'milestone';progress:number;target:number;
 reward:number;ready:boolean;claimed:boolean;explanation:string;day:number;blocked?:boolean;status?:'Date ahead'|'Date unavailable';
}
const number=(value:number)=>value.toLocaleString('en-US');
/** Arabic counted noun: «عدوّاً واحداً», «عدوّين», «3 أعداء», «25 محارباً», «100 عدوّ» (agrees with the last two digits). */
const NOUNS={kills:['عدوّاً واحداً','عدوّين','عدوّ','أعداء','عدوّاً'],wins:['معركة واحدة','معركتين','معركة','معارك','معركةً'],deployed:['محارباً واحداً','محاربَين','محارب','محاربين','محارباً'],seals:['ختمَ إتقان واحداً','ختمَي إتقان','ختم إتقان','أختام إتقان','ختمَ إتقان']} as const;
function counted(count:number,noun:keyof typeof NOUNS):string {
 const [one,two,single,few,accusative]=NOUNS[noun],last=Math.abs(Math.floor(count))%100;
 if(count===1)return one;
 if(count===2)return two;
 return `${number(count)} ${last>=3&&last<=10?few:last>=11?accusative:single}`;
}
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** A read-only catalogue. All rewards and admission facts come from the canonical game. */
export function questRecords(profile:Readonly<Profile>,day:number):QuestRecord[]{
 const daily=dailyReward(profile,day),week=weekId(day),weekly=weeklyStatus(profile,week),validDay=Number.isInteger(day)&&day>=0&&day<=MAX_DAILY_DAY;
 const dailyAhead=validDay&&profile.dailyDay>day,weeklyAhead=validDay&&!!profile.weekly&&profile.weekly.week>week;
 const records:QuestRecord[]=[
  {key:'daily',title:tr('Daily reward','مكافأة اليوم'),kind:'daily',progress:daily.available||dailyAhead||!validDay?0:1,target:1,reward:daily.gems,ready:daily.available,claimed:!daily.available&&!dailyAhead&&validDay,day,blocked:dailyAhead,status:dailyAhead?'Date ahead':undefined,
   explanation:dailyAhead?tr('The saved reward date is ahead of the device date. This reward is unavailable until that date is reached.','تاريخ المكافأة المحفوظ يسبق تاريخ الجهاز، فلن تُتاح حتى يحين ذلك اليوم.'):daily.available?`${tr(`Day ${daily.streak} reward is ready.`,`مكافأة اليوم رقم ${daily.streak} جاهزة.`)}${daily.graced?tr(' A grace day preserves your streak.',' يوم سماح يحفظ أيامك المتتالية.'):''}`:tr('Already claimed for this day. The next daily reward opens after local midnight.','استلمتها اليوم. تُفتح مكافأة الغد بعد منتصف الليل.')},
  {key:'weekly',title:tr('Earn 3 new seals','اكسب 3 أختام جديدة'),kind:'weekly',progress:weekly.progress,target:weekly.target,reward:weekly.gems,ready:weekly.ready,claimed:weekly.claimed,day,blocked:weeklyAhead,status:weeklyAhead?'Date ahead':undefined,
   explanation:weeklyAhead?tr('The saved reward date is ahead of the device date. This weekly goal is unavailable until that week is reached.','تاريخ المكافأة المحفوظ يسبق تاريخ الجهاز، فلن يُتاح هدف الأسبوع حتى يحين ذلك الأسبوع.'):weekly.claimed?tr('Already claimed this week. A new goal opens on Monday.','استلمتها هذا الأسبوع. يُفتح هدف جديد يوم الاثنين.'):weekly.ready?tr('Three new mastery seals earned this week. Your reward is ready.','نلت ثلاثة أختام إتقان جديدة هذا الأسبوع. مكافأتك جاهزة.'):weeklyLeft(weekly.target-weekly.progress)},
  ...QUESTS.map(q=>{const progress=Math.min(profile[q.stat],q.target),claimed=profile.claimed.includes(q.id),ready=!claimed&&progress>=q.target,remaining=q.target-progress;
   const activity=q.stat==='kills'?`${number(remaining)} more ${remaining===1?'enemy':'enemies'}`:q.stat==='wins'?`${number(remaining)} more ${remaining===1?'battle':'battles'}`:`${number(remaining)} more ${remaining===1?'warrior':'warriors'}`;
   const activityAr=q.stat==='kills'?`اهزم ${counted(remaining,'kills')} بعدُ`:q.stat==='wins'?`انتصر في ${counted(remaining,'wins')} بعدُ`:`أرسل ${counted(remaining,'deployed')} بعدُ`;
   return {key:q.id,title:q.title,kind:'milestone' as const,progress,target:q.target,reward:q.reward,ready,claimed,day,
    explanation:claimed?tr('Already claimed. This milestone reward is earned once.','استلمتها. مكافأة هذا المَعلَم تُنال مرّة واحدة.'):ready?tr('Milestone complete. Your reward is ready.','اكتمل المَعلَم. مكافأتك جاهزة.'):tr(`${q.stat==='kills'?'Defeat':q.stat==='wins'?'Win':'Deploy'} ${activity} to claim this reward.`,`${activityAr} لتستلم هذه المكافأة.`)};})
 ];
 return validDay?records:records.map(record=>({...record,ready:false,blocked:true,status:'Date unavailable',explanation:tr('The device date is unavailable. Check its date before claiming.','تاريخ الجهاز غير متاح. تحقّق منه قبل أن تستلم.')}));
}
/** "Earn N more mastery seals…" with the Arabic count agreeing. */
function weeklyLeft(left:number):string {
 return tr(`Earn ${left} more mastery ${left===1?'seal':'seals'} in battle this week. A new goal opens on Monday.`,`اكسب ${counted(left,'seals')} بعدُ في المعارك هذا الأسبوع. يُفتح هدف جديد يوم الاثنين.`);
}
/** The status id in the current language. */
const statusText=(status:NonNullable<QuestRecord['status']>)=>status==='Date ahead'?tr('Date ahead','التاريخ أبعد'):tr('Date unavailable','التاريخ غير متاح');
export function selectedQuestRecord(records:QuestRecord[],selected?:string|null):QuestRecord{
 return records.find(r=>r.key===selected)??records.find(r=>r.ready)??records.filter(r=>!r.claimed&&!r.blocked).sort((a,b)=>b.progress/b.target-a.progress/a.target)[0]??records[0];
}
export function questRecordAction(record:QuestRecord,day:number):Action|null{
 if(!record.ready||record.claimed)return null;
 if(record.kind==='daily')return Number.isInteger(day)&&record.day===day?{type:'daily',day}:null;
 if(record.kind==='weekly'){
  const week=weekId(record.day);
  return Number.isInteger(week)&&week>=0&&week===weekId(day)?{type:'weekly',week}:null;
 }
 return {type:'claim',id:record.key};
}
export function questRecordLabel(record:QuestRecord):string{
 return `${record.kind==='weekly'?tr('Weekly · ','الأسبوع · '):''}${record.title} · ${record.status?statusText(record.status):record.claimed?tr('Claimed','استُلمت'):record.ready?tr('Ready','جاهزة'):`${number(record.progress)}/${number(record.target)}`}`;
}
export function questRecordDetailHtml(record:QuestRecord,version:number):string{
 return `<article class="quest-record" aria-labelledby="quest-record-title">
 <p class="quest-record-kind">${record.kind==='milestone'?tr('Company milestone','مَعلَم السريّة'):record.kind==='weekly'?tr('This week','هذا الأسبوع'):tr('Daily reward','مكافأة اليوم')}</p>
 <h3 id="quest-record-title">${escape(record.title)}</h3>
 <p class="quest-record-count">${tr(`${number(record.progress)} <span>/ ${number(record.target)}${record.kind==='daily'?' claimed':record.kind==='weekly'?' seals':''}</span>`,`<bdi dir="ltr">${number(record.progress)} <span>/ ${number(record.target)}</span></bdi><span>${record.kind==='daily'?' استُلمت':record.kind==='weekly'?' أختام':''}</span>`)}</p>
 <div class="quest-record-meter" role="progressbar" aria-label="${escape(tr(`${record.title} progress`,`تقدّم: ${record.title}`))}" aria-valuemin="0" aria-valuemax="${record.target}" aria-valuenow="${record.progress}"><i style="transform:scaleX(${record.progress/record.target})"></i></div>
 <p id="quest-eligibility">${escape(record.explanation)}</p>
 <p class="quest-record-reward">${tr('Reward','المكافأة')} <strong>${tr(`${number(record.reward)} gems`,`${n(number(record.reward))} من الجواهر`)}</strong></p>
 <button class="big-button blue" data-command="quest-claim" data-quest-key="${record.key}" data-quest-day="${record.day}" data-quest-version="${version}" aria-describedby="quest-eligibility" ${record.ready?'':'disabled'}>${tr('Claim','استلم')}</button>
 </article>`;
}
export function questRecordsHtml(records:QuestRecord[],selected:QuestRecord,version:number,notice=''):string{
 return `<div class="quest-records"><span class="eyebrow">${tr('THE COMPANY JOURNAL','دفتر السريّة')}</span><h2 id="dialog-title">${tr('Quests','المهمّات')}</h2>
 <label for="quest-goal">${tr('Goal','الهدف')}</label><select id="quest-goal" data-quest-select data-initial-focus aria-describedby="quest-selector-note">${records.map(r=>`<option value="${r.key}" ${r.key===selected.key?'selected':''}>${escape(questRecordLabel(r))}</option>`).join('')}</select>
 <p id="quest-selector-note" class="quest-record-note">${tr('Daily, weekly and company milestones.','مكافآت اليوم والأسبوع ومعالم السريّة.')}</p>
 <div id="quest-record-detail">${questRecordDetailHtml(selected,version)}</div>
 <p id="quest-save-status" class="quest-record-save" role="status" ${notice?'':'hidden'}>${escape(notice)}</p>
 <button class="big-button secondary" data-command="close">${tr('Back','رجوع')}</button></div>`;
}

export type QuestClaimCheck='ignore'|'refresh'|'claim';
/** Decides whether a rendered Claim press still matches the open dialog: a stale version is ignored, a stale day refreshes. */
export function questClaimCheck(data:{questKey?:string;questVersion?:string;questDay?:string},open:{key:string|null;version:number;day:number}):QuestClaimCheck {
  if(data.questKey!==open.key||Number(data.questVersion)!==open.version)return 'ignore';
  const day=Number(data.questDay);
  return Number.isInteger(day)&&day===open.day?'claim':'refresh';
}
