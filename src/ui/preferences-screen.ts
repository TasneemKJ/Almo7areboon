import type {Profile} from '../game/types.ts';
import type {AudioMix} from './audio-preferences.ts';

/** Seven independent preference fields; navigation/destruction are separate actions. */
export function preferencesHtml(p:Profile,atmosphere:boolean,mix:AudioMix,canWrite:boolean,notice:string):string {
 const check=(id:string,label:string,checked:boolean,description='')=>`<label class="preference-check" for="preference-${id}"><input id="preference-${id}" data-preference="${id}" type="checkbox" ${checked?'checked':''}${description?` aria-describedby="${id}-description"`:''}><span>${label}</span></label>`;
 const range=(id:string,label:string,value:number)=>`<div class="audio-volume"><div class="audio-volume-label"><label for="${id}-volume">${label}</label><output id="${id}-volume-value" for="${id}-volume">${value}%</output></div><input id="${id}-volume" type="range" min="0" max="100" step="5" value="${value}" aria-valuetext="${value}%"></div>`;
 return `<h2 id="dialog-title">Preferences</h2>
 <div class="preferences-fields"><div class="preference-pair">${check('sound','Sound',p.sound,'master')}${check('atmosphere','Atmosphere',atmosphere,'ambient')}</div>
 <p id="sound-description" class="preference-note">Sound is the master switch.</p><p id="atmosphere-description" class="preference-note">Atmosphere adds music and environmental sound; it pauses in menus.</p>
 ${range('effects','Effects volume',mix.effects)}${range('atmosphere','Atmosphere volume',mix.atmosphere)}
 <div class="preference-pair"><label class="preference-select" for="preference-speed">Battle speed<select id="preference-speed" data-preference="speed"><option value="1" ${p.speed===1?'selected':''}>1×</option><option value="2" ${p.speed===2?'selected':''}>2×</option></select></label>
 <label class="preference-select" for="preference-motion">Motion<select id="preference-motion" data-preference="motion"><option value="system" ${p.motion==='system'?'selected':''}>System</option><option value="reduced" ${p.motion==='reduced'?'selected':''}>Reduced</option></select></label></div>
 ${check('marks','Troop shapes',p.marks===true,'roles')}<p id="marks-description" class="preference-note">Circle: melee · triangle: ranged · square: heavy.</p></div>
 <p class="preference-note">Tap a waiting defender to recruit; tap the standard to gather or release. Select an enemy for tactical powers. <kbd>Tab</kbd> then <kbd>Enter</kbd> selects objects; <kbd>1–3</kbd> recruits; <kbd>Q/W/E</kbd> uses Freeze, Meteor or Food when available. <kbd>Esc</kbd> closes a dialog or clears selection.</p>
 <p id="preference-status" class="save-note" role="status">${notice}</p>
 <div class="preferences-actions"><button class="big-button secondary" data-command="save-recovery">Save &amp; recovery</button><button class="big-button secondary" data-command="reset" ${canWrite?'':'disabled'}>Start over…</button><button class="big-button green" data-command="close">Done</button></div>`;
}
export function saveRecoveryHtml(canWrite:boolean,notice:string):string {
 return `<h2 id="dialog-title">Save &amp; recovery</h2><p id="recovery-status" class="save-note" role="status">${notice}</p><p>Game progress stays in this browser. Export a copy you control; importing replaces the current progress only after confirmation.</p><div class="recovery-actions"><button class="big-button blue" data-command="export">Export</button><button class="big-button secondary" data-command="import" ${canWrite?'':'disabled'}>Import</button><button class="big-button secondary" data-command="close">Back</button></div><input id="import-save" type="file" accept=".json,application/json" hidden>`;
}
