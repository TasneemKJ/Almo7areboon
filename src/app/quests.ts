






import {questClaimCheck,questRecords,selectedQuestRecord,questRecordAction,questRecordLabel,questRecordsHtml,questRecordDetailHtml} from '../ui/quest-records.ts';
import { localDay } from '../game/data.ts';
import { temporarySessionNotice } from '../ui/save-session-screen.ts';
import { weekId } from '../game/weekly.ts';
import { textIfChanged, htmlIfChanged } from '../ui/dom-state.ts';
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** State owned by the quests module. Siblings see only the slice it exposes through its ports. */
export interface QuestState {
  questSelection: string|null;
  questCalendarDay: number|null;
}

/** What the quests module needs: its slice of state, DOM handles and sibling operations. */
export interface QuestsDeps {
  dom: Pick<Runtime, '$' | 'activeElement'>;
  ports: Pick<ShellApi, 'action' | 'guardAction' | 'navState' | 'playable' | 'sessionState' | 'showModal'>;
}

export function createQuests(deps: QuestsDeps) {
  const { ports, dom } = deps;
  const { $ } = deps.dom;
  const questState: QuestState = {
    questSelection: null,
    questCalendarDay: null,
  };
  function questSaveNotice(){return ports.sessionState.session.status==='temporary'?temporarySessionNotice:ports.sessionState.savedWarning?'Saving is unavailable. Return Home, then open Settings to export a backup before closing.':'';}
  function refreshQuestRecord(focus=false){
    if(ports.navState.modal!=='quests'||!ports.guardAction()||ports.navState.modal!=='quests')return;
    const day=localDay(),records=questRecords(ports.sessionState.game.profile,day),selected=selectedQuestRecord(records,questState.questSelection);
    const active=dom.activeElement() as HTMLElement|null,focusedClaim=active?.dataset.command==='quest-claim'&&$('modal-layer').contains(active);
    questState.questSelection=selected.key;questState.questCalendarDay=day;
    const select=$('quest-goal') as HTMLSelectElement;
    // The platform owns the open native picker. Keep its node, focus and option nodes.
    for(const option of Array.from(select.options)){
      const record=records.find(r=>r.key===option.value);if(record)textIfChanged(option,questRecordLabel(record));
    }
    select.value=selected.key;
    htmlIfChanged($('quest-record-detail'),questRecordDetailHtml(selected,ports.navState.modalVersion));
    const notice=$('quest-save-status'),message=questSaveNotice();notice.hidden=!message;textIfChanged(notice,message);
    if(focus||focusedClaim)select.focus();
  }
  function syncWeek(){ports.sessionState.game.dispatch({type:'weekly-sync',week:weekId(localDay())});}
  function claimQuestRecord(button:HTMLButtonElement){
    if(ports.navState.modal!=='quests'||!$('modal-layer').contains(button)||!ports.guardAction()||ports.navState.modal!=='quests')return;
    const day=localDay(),check=questClaimCheck(button.dataset,{key:questState.questSelection,version:ports.navState.modalVersion,day});
    if(check==='ignore')return;
    if(check==='refresh'){refreshQuestRecord();return;}
    const selected=questRecords(ports.sessionState.game.profile,day).find(r=>r.key===questState.questSelection);
    const claim=selected?questRecordAction(selected,day):null;
    if(!claim){refreshQuestRecord();return;}
    const accepted=ports.action(claim);
    // The writer may synchronously give ownership to recovery. Never replace it.
    if(ports.playable()&&ports.navState.modal==='quests')refreshQuestRecord(accepted);
  }
  function showQuests(){
    if(!ports.guardAction())return;
    syncWeek();
    const records=questRecords(ports.sessionState.game.profile,localDay()),selected=selectedQuestRecord(records,ports.navState.modal==='quests'?questState.questSelection:null);
    questState.questSelection=selected.key;questState.questCalendarDay=selected.day;
    ports.showModal('quests',questRecordsHtml(records,selected,ports.navState.modalVersion+1,questSaveNotice()));
  }
  return { questSaveNotice, refreshQuestRecord, syncWeek, claimQuestRecord, showQuests, questState: questState as Pick<QuestState, 'questCalendarDay' | 'questSelection'> };
}
