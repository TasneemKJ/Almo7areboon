import { dailyReward, MAX_DAILY_DAY, QUESTS } from '../game/data.ts';
import { weekId, weeklyStatus } from '../game/weekly.ts';
import type { Action, Profile } from '../game/types.ts';

export interface QuestRecord {
 key:string;title:string;kind:'daily'|'weekly'|'milestone';progress:number;target:number;
 reward:number;ready:boolean;claimed:boolean;explanation:string;day:number;blocked?:boolean;status?:'Date ahead'|'Date unavailable';
}
const number=(value:number)=>value.toLocaleString('en-US');
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** A read-only catalogue. All rewards and admission facts come from the canonical game. */
export function questRecords(profile:Readonly<Profile>,day:number):QuestRecord[]{
 const daily=dailyReward(profile,day),week=weekId(day),weekly=weeklyStatus(profile,week),validDay=Number.isInteger(day)&&day>=0&&day<=MAX_DAILY_DAY;
 const dailyAhead=validDay&&profile.dailyDay>day,weeklyAhead=validDay&&!!profile.weekly&&profile.weekly.week>week;
 const records:QuestRecord[]=[
  {key:'daily',title:'Daily reward',kind:'daily',progress:daily.available||dailyAhead||!validDay?0:1,target:1,reward:daily.gems,ready:daily.available,claimed:!daily.available&&!dailyAhead&&validDay,day,blocked:dailyAhead,status:dailyAhead?'Date ahead':undefined,
   explanation:dailyAhead?'The saved reward date is ahead of the device date. This reward is unavailable until that date is reached.':daily.available?`Day ${daily.streak} reward is ready.${daily.graced?' A grace day preserves your streak.':''}`:'Already claimed for this day. The next daily reward opens after local midnight.'},
  {key:'weekly',title:'Earn 3 new seals',kind:'weekly',progress:weekly.progress,target:weekly.target,reward:weekly.gems,ready:weekly.ready,claimed:weekly.claimed,day,blocked:weeklyAhead,status:weeklyAhead?'Date ahead':undefined,
   explanation:weeklyAhead?'The saved reward date is ahead of the device date. This weekly goal is unavailable until that week is reached.':weekly.claimed?'Already claimed this week. A new goal opens on Monday.':weekly.ready?'Three new mastery seals earned this week. Your reward is ready.':`Earn ${weekly.target-weekly.progress} more mastery ${weekly.target-weekly.progress===1?'seal':'seals'} in battle this week. A new goal opens on Monday.`},
  ...QUESTS.map(q=>{const progress=Math.min(profile[q.stat],q.target),claimed=profile.claimed.includes(q.id),ready=!claimed&&progress>=q.target,remaining=q.target-progress;
   const activity=q.stat==='kills'?`${number(remaining)} more ${remaining===1?'enemy':'enemies'}`:q.stat==='wins'?`${number(remaining)} more ${remaining===1?'battle':'battles'}`:`${number(remaining)} more ${remaining===1?'warrior':'warriors'}`;
   return {key:q.id,title:q.title,kind:'milestone' as const,progress,target:q.target,reward:q.reward,ready,claimed,day,
    explanation:claimed?'Already claimed. This milestone reward is earned once.':ready?'Milestone complete. Your reward is ready.':`${q.stat==='kills'?'Defeat':q.stat==='wins'?'Win':'Deploy'} ${activity} to claim this reward.`};})
 ];
 return validDay?records:records.map(record=>({...record,ready:false,blocked:true,status:'Date unavailable',explanation:'The device date is unavailable. Check its date before claiming.'}));
}
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
 return `${record.kind==='weekly'?'Weekly · ':''}${record.title} · ${record.status??(record.claimed?'Claimed':record.ready?'Ready':`${number(record.progress)}/${number(record.target)}`)}`;
}
export function questRecordDetailHtml(record:QuestRecord,version:number):string{
 return `<article class="quest-record" aria-labelledby="quest-record-title">
 <p class="quest-record-kind">${record.kind==='milestone'?'Company milestone':record.kind==='weekly'?'This week':'Daily reward'}</p>
 <h3 id="quest-record-title">${escape(record.title)}</h3>
 <p class="quest-record-count">${number(record.progress)} <span>/ ${number(record.target)}${record.kind==='daily'?' claimed':record.kind==='weekly'?' seals':''}</span></p>
 <div class="quest-record-meter" role="progressbar" aria-label="${escape(record.title)} progress" aria-valuemin="0" aria-valuemax="${record.target}" aria-valuenow="${record.progress}"><i style="transform:scaleX(${record.progress/record.target})"></i></div>
 <p id="quest-eligibility">${escape(record.explanation)}</p>
 <p class="quest-record-reward">Reward <strong>${number(record.reward)} gems</strong></p>
 <button class="big-button blue" data-command="quest-claim" data-quest-key="${record.key}" data-quest-day="${record.day}" data-quest-version="${version}" aria-describedby="quest-eligibility" ${record.ready?'':'disabled'}>Claim</button>
 </article>`;
}
export function questRecordsHtml(records:QuestRecord[],selected:QuestRecord,version:number,notice=''):string{
 return `<div class="quest-records"><span class="eyebrow">THE COMPANY JOURNAL</span><h2 id="dialog-title">Quests</h2>
 <label for="quest-goal">Goal</label><select id="quest-goal" data-quest-select data-initial-focus aria-describedby="quest-selector-note">${records.map(r=>`<option value="${r.key}" ${r.key===selected.key?'selected':''}>${escape(questRecordLabel(r))}</option>`).join('')}</select>
 <p id="quest-selector-note" class="quest-record-note">Daily, weekly and company milestones.</p>
 <div id="quest-record-detail">${questRecordDetailHtml(selected,version)}</div>
 <p id="quest-save-status" class="quest-record-save" role="status" ${notice?'':'hidden'}>${escape(notice)}</p>
 <button class="big-button secondary" data-command="close">Back</button></div>`;
}
