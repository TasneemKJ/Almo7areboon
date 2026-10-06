import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultProfile } from '../src/game/save.ts';
import { QUESTS, dailyReward } from '../src/game/data.ts';
import { syncWeekly, weekId } from '../src/game/weekly.ts';
import { questRecords, selectedQuestRecord, questRecordAction, questRecordsHtml, questRecordDetailHtml } from '../src/ui/quest-records.ts';

const day=20720;
test('records expose daily, weekly and every canonical milestone without writing profile',()=>{
 const p=defaultProfile();syncWeekly(p,weekId(day));p.kills=11;p.wins=2;p.deployed=8;const before=JSON.stringify(p);
 const records=questRecords(p,day);
 assert.equal(records.length,12);assert.deepEqual(records.slice(2).map(r=>r.key),QUESTS.map(q=>q.id));
 for(const q of QUESTS){const r=records.find(r=>r.key===q.id)!;assert.equal(r.reward,q.reward);assert.equal(r.progress,Math.min(p[q.stat],q.target));assert.equal(r.target,q.target);}
 assert.equal(selectedQuestRecord(records).key,'daily');assert.equal(JSON.stringify(p),before);
});
test('default keeps a valid selected record then favors ready and nearest unfinished records',()=>{
 const p=defaultProfile();p.dailyDay=day;p.kills=10;p.wins=2;
 let records=questRecords(p,day);assert.equal(selectedQuestRecord(records).key,'first-blood');
 assert.equal(selectedQuestRecord(records,'annihilator').key,'annihilator');
 p.claimed.push('first-blood');records=questRecords(p,day);assert.equal(selectedQuestRecord(records).key,'conqueror');
 assert.equal(selectedQuestRecord(records,'forged').key,'conqueror');
});
test('daily display matches canonical streak and grace reward without pressure or automatic claims',()=>{
 const p=defaultProfile();p.dailyDay=day-2;p.dailyStreak=3;
 const r=questRecords(p,day)[0],expected=dailyReward(p,day);
 assert.equal(r.reward,expected.gems);assert.equal(r.ready,true);assert.equal(r.progress,0);assert.equal(r.target,1);assert.match(r.explanation,/grace day/i);
 assert.deepEqual(questRecordAction(r,day),{type:'daily',day});assert.equal(questRecordAction(r,day+1),null);
});
test('weekly record permits only current integer week and never manufactures progress',()=>{
 const p=defaultProfile();syncWeekly(p,weekId(day));p.mastery.chapters[0].earnedMask=7;
 const r=questRecords(p,day)[1];assert.equal(r.progress,3);assert.equal(r.reward,60);assert.equal(r.ready,true);
 assert.deepEqual(questRecordAction(r,day),{type:'weekly',week:weekId(day)});assert.equal(questRecordAction(r,day+7),null);
 p.weekly!.week-=1;const stale=questRecords(p,day)[1];assert.equal(stale.progress,0);assert.equal(stale.ready,false);
});
test('one native field contains all choices with text status; journal has Claim and Back only',()=>{
 const p=defaultProfile(),records=questRecords(p,day),selected=selectedQuestRecord(records),html=questRecordsHtml(records,selected,4);
 assert.equal((html.match(/<select\b/g)||[]).length,1);assert.equal((html.match(/<option\b/g)||[]).length,12);
 assert.match(html,/<label[^>]+for="quest-goal"/);assert.match(html,/<select[^>]+id="quest-goal"/);assert.match(html,/>Daily reward · Ready<\/option>/);
 assert.equal((html.match(/<button\b/g)||[]).length,2);assert.match(html,/data-command="quest-claim"/);assert.match(html,/data-command="close"[^>]*>Back/);
 assert.doesNotMatch(html,/data-claim=|data-daily=|data-weekly=|data-command="journey"/);
});
test('claimed and locked records explain eligibility and preserve exact reward and accessible progress',()=>{
 const p=defaultProfile();p.claimed=['first-blood'];p.kills=12;
 for(const key of ['first-blood','conqueror']){const r=selectedQuestRecord(questRecords(p,day),key),html=questRecordDetailHtml(r,9);
 assert.match(html,/aria-describedby="quest-eligibility"/);assert.match(html,/disabled/);assert.match(html,new RegExp(`${r.reward} gems`));assert.match(html,/role="progressbar"/);assert.match(html,new RegExp(`aria-valuenow="${r.progress}"`));assert.equal(questRecordAction(r,day),null);}
 assert.match(questRecordDetailHtml(selectedQuestRecord(questRecords(p,day),'first-blood'),9),/already claimed/i);
 assert.match(questRecordDetailHtml(selectedQuestRecord(questRecords(p,day),'conqueror'),9),/3 more battles/);
});
test('retained future daily and weekly records explain the device-date mismatch honestly',()=>{
 const p=defaultProfile();p.dailyDay=day+1;p.dailyStreak=3;p.weekly={week:weekId(day)+1,baseSeals:0,claimed:true};p.mastery.chapters[0].earnedMask=7;
 const records=questRecords(p,day);for(const key of ['daily','weekly']){const r=selectedQuestRecord(records,key),html=questRecordDetailHtml(r,1);assert.equal(r.ready,false);assert.match(r.explanation,/saved reward date is ahead of the device date/i);assert.doesNotMatch(r.explanation,/more mastery|claimed for this day/);assert.match(html,/disabled/);}
 assert.notEqual(selectedQuestRecord(records).key,'daily');assert.notEqual(selectedQuestRecord(records).key,'weekly');
 const matching=questRecords(p,day+7);assert.equal(matching[1].claimed,true);assert.match(matching[1].explanation,/Already claimed this week/);
});
test('invalid device date shows a disabled explanation instead of a ready reward',()=>{
 const p=defaultProfile();p.kills=10;
 for(const invalid of [NaN,Infinity,day+.5,-1,1000001])for(const r of questRecords(p,invalid)){assert.equal(r.ready,false);assert.match(r.explanation,/device date is unavailable/i);assert.equal(questRecordAction(r,invalid),null);}
});
