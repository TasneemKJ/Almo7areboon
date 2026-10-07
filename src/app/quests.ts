import {questClaimCheck,questRecords,selectedQuestRecord,questRecordAction,questRecordLabel,questRecordsHtml,questRecordDetailHtml} from '../ui/quest-records.ts';
import { localDay } from '../game/data.ts';
import { temporarySessionNotice } from '../ui/save-session-screen.ts';
import { weekId } from '../game/weekly.ts';
import { textIfChanged, htmlIfChanged } from '../ui/dom-state.ts';
import { app } from './state.ts';
import { action, guardAction, playable } from './lifecycle.ts';
import { $ } from './runtime.ts';
import { showModal } from './navigation.ts';

export function questSaveNotice(){return app.session.status==='temporary'?temporarySessionNotice:app.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':'';}
export function refreshQuestRecord(focus=false){
  if(app.modal!=='quests'||!guardAction()||app.modal!=='quests')return;
  const day=localDay(),records=questRecords(app.game.profile,day),selected=selectedQuestRecord(records,app.questSelection);
  const active=document.activeElement as HTMLElement|null,focusedClaim=active?.dataset.command==='quest-claim'&&$('modal-layer').contains(active);
  app.questSelection=selected.key;app.questCalendarDay=day;
  const select=$('quest-goal') as HTMLSelectElement;
  // The platform owns the open native picker. Keep its node, focus and option nodes.
  for(const option of Array.from(select.options)){
    const record=records.find(r=>r.key===option.value);if(record)textIfChanged(option,questRecordLabel(record));
  }
  select.value=selected.key;
  htmlIfChanged($('quest-record-detail'),questRecordDetailHtml(selected,app.modalVersion));
  const notice=$('quest-save-status'),message=questSaveNotice();notice.hidden=!message;textIfChanged(notice,message);
  if(focus||focusedClaim)select.focus();
}
export function syncWeek(){app.game.dispatch({type:'weekly-sync',week:weekId(localDay())});}
export function claimQuestRecord(button:HTMLButtonElement){
  if(app.modal!=='quests'||!$('modal-layer').contains(button)||!guardAction()||app.modal!=='quests')return;
  const day=localDay(),check=questClaimCheck(button.dataset,{key:app.questSelection,version:app.modalVersion,day});
  if(check==='ignore')return;
  if(check==='refresh'){refreshQuestRecord();return;}
  const selected=questRecords(app.game.profile,day).find(r=>r.key===app.questSelection);
  const claim=selected?questRecordAction(selected,day):null;
  if(!claim){refreshQuestRecord();return;}
  const accepted=action(claim);
  // The writer may synchronously give ownership to recovery. Never replace it.
  if(playable()&&app.modal==='quests')refreshQuestRecord(accepted);
}
export function showQuests(){
  if(!guardAction())return;
  syncWeek();
  const records=questRecords(app.game.profile,localDay()),selected=selectedQuestRecord(records,app.modal==='quests'?app.questSelection:null);
  app.questSelection=selected.key;app.questCalendarDay=selected.day;
  showModal('quests',questRecordsHtml(records,selected,app.modalVersion+1,questSaveNotice()));
}
