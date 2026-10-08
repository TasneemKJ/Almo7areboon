import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gateChoiceLabel} from '../src/ui/field-gate-label.ts';

test('physical gate choices speak only a short command at readiness',()=>{
 assert.equal(gateChoiceLabel('hold',true,false),'Hold');
 assert.equal(gateChoiceLabel('advance',true,false),'Advance');
 assert.equal(gateChoiceLabel('hold',false,true),'Holding');
 assert.equal(gateChoiceLabel('advance',false,true),'Advancing');
 assert.equal(gateChoiceLabel('hold',false,false),'Hold · 60 momentum');
 assert.equal(gateChoiceLabel('advance',false,false),'Advance · 60 momentum');
});
test('native touch players see real gate commands when ready, never a persistent battle command deck',()=>{
 const css=readFileSync('src/ui/world-play.css','utf8');
 const controller=readFileSync('src/ui/field-controller.ts','utf8');
 assert.match(css,/\.gate-hit\.order-ready \.world-target-name/);
 assert.match(css,/\.gate-hit\[aria-pressed="true"\] \.world-target-name/);
 assert.match(css,/\.world-target-name\{[^}]*opacity:0/);
 assert.match(controller,/textIfChanged\(label,gateChoiceLabel\(/);
 assert.match(css,/#app\[data-field-mode="field"\] \.resources/);
});
