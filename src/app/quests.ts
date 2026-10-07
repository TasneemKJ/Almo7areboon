import {questClaimCheck,questRecords,selectedQuestRecord,questRecordAction,questRecordLabel,questRecordsHtml,questRecordDetailHtml} from '../ui/quest-records.ts';
import { localDay } from '../game/data.ts';
import { temporarySessionNotice } from '../ui/save-session-screen.ts';
import { weekId } from '../game/weekly.ts';
import { textIfChanged, htmlIfChanged } from '../ui/dom-state.ts';
import type { AppState } from './state.ts';
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** What the quests module needs: its slice of state, DOM handles and sibling operations. */
export interface QuestsDeps {
  state: Pick<AppState, 'game' | 'modal' | 'modalVersion' | 'questCalendarDay' | 'questSelection' | 'savedWarning' | 'session'>;
  dom: Pick<Runtime, '$'>;
  ports: Pick<ShellApi, 'action' | 'guardAction' | 'playable' | 'showModal'>;
}

export function createQuests(deps: QuestsDeps) {
  const { state, ports } = deps;
  const { $ } = deps.dom;
  function questSaveNotice(){return state.session.status==='temporary'?temporarySessionNotice:state.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':'';}
  function refreshQuestRecord(focus=false){
    if(state.modal!=='quests'||!ports.guardAction()||state.modal!=='quests')return;
    const day=localDay(),records=questRecords(state.game.profile,day),selected=selectedQuestRecord(records,state.questSelection);
    const active=document.activeElement as HTMLElement|null,focusedClaim=active?.dataset.command==='quest-claim'&&$('modal-layer').contains(active);
    state.questSelection=selected.key;state.questCalendarDay=day;
    const select=$('quest-goal') as HTMLSelectElement;
    // The platform owns the open native picker. Keep its node, focus and option nodes.
    for(const option of Array.from(select.options)){
      const record=records.find(r=>r.key===option.value);if(record)textIfChanged(option,questRecordLabel(record));
    }
    select.value=selected.key;
    htmlIfChanged($('quest-record-detail'),questRecordDetailHtml(selected,state.modalVersion));
    const notice=$('quest-save-status'),message=questSaveNotice();notice.hidden=!message;textIfChanged(notice,message);
    if(focus||focusedClaim)select.focus();
  }
  function syncWeek(){state.game.dispatch({type:'weekly-sync',week:weekId(localDay())});}
  function claimQuestRecord(button:HTMLButtonElement){
    if(state.modal!=='quests'||!$('modal-layer').contains(button)||!ports.guardAction()||state.modal!=='quests')return;
    const day=localDay(),check=questClaimCheck(button.dataset,{key:state.questSelection,version:state.modalVersion,day});
    if(check==='ignore')return;
    if(check==='refresh'){refreshQuestRecord();return;}
    const selected=questRecords(state.game.profile,day).find(r=>r.key===state.questSelection);
    const claim=selected?questRecordAction(selected,day):null;
    if(!claim){refreshQuestRecord();return;}
    const accepted=ports.action(claim);
    // The writer may synchronously give ownership to recovery. Never replace it.
    if(ports.playable()&&state.modal==='quests')refreshQuestRecord(accepted);
  }
  function showQuests(){
    if(!ports.guardAction())return;
    syncWeek();
    const records=questRecords(state.game.profile,localDay()),selected=selectedQuestRecord(records,state.modal==='quests'?state.questSelection:null);
    state.questSelection=selected.key;state.questCalendarDay=selected.day;
    ports.showModal('quests',questRecordsHtml(records,selected,state.modalVersion+1,questSaveNotice()));
  }
  return { questSaveNotice, refreshQuestRecord, syncWeek, claimQuestRecord, showQuests };
}
