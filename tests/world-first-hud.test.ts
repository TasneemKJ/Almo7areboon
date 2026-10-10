import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fieldControlsHtml,fieldFoodReadout} from '../src/ui/field-controls.ts';

const css=(file:string)=>readFileSync(new URL(`../src/ui/${file}`,import.meta.url),'utf8');
const rule=(text:string,selector:string)=>text.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\{([^}]+)\\}`))?.[1]??'';

test('the field shows the food every recruit tap spends',()=>{
 assert.deepEqual(fieldFoodReadout(6.8),{text:'6',label:'Food: 6. Recruits cost food.',full:false});
 assert.deepEqual(fieldFoodReadout(99),{text:'99',label:'Food: 99, storage full. Recruits cost food.',full:true});
 assert.equal(fieldFoodReadout(-1).text,'0');
 const html=fieldControlsHtml();
 assert.match(html,/<p id="field-food" class="field-food" hidden>/,'hidden until a battle runs');
 assert.doesNotMatch(html.match(/<p id="field-food"[\s\S]*?<\/p>/)![0],/<button/,'a readout, not another control');
});

test('the food readout sits at the top-left edge, opposite Pause and clear of safe areas',()=>{
 const food=rule(css('world-play.css'),'.field-food');
 assert.match(food,/left:max\(12px,env\(safe-area-inset-left\)\)/);
 assert.match(food,/top:max\(12px,env\(safe-area-inset-top\)\)/);
 assert.match(food,/pointer-events:none/,'it never steals a tap from the world');
 const stage=rule(css('world-play.css'),'#app[data-field-mode="field"] .stage');
 assert.match(stage,/left:72px/,'the title leaves room for the readout');
 assert.match(food,/max-width:56px/,'the readout stays inside the title gutter (12px + 56px < 72px)');
});

test('Camp pages use the whole screen: no band reserved for the hidden header or bottom navigation',()=>{
 const page=rule(css('camp.css'),'#app[data-field-mode="camp"] .secondary-screen');
 assert.match(page,/position:relative/);assert.match(page,/inset:auto/);
 assert.match(page,/padding-top:max\(16px,env\(safe-area-inset-top\)\)/);
 assert.match(page,/padding-bottom:max\(18px,env\(safe-area-inset-bottom\)\)/);
});

test('Camp place names and the next goal sit on a dark plate over the painting',()=>{
 const camp=css('camp.css');
 assert.match(rule(camp,'.camp-place-name'),/background:#102c29/);
 assert.match(rule(camp,'.camp-heading>.camp-goal'),/background:#102c29/);
});
