import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gateChoiceLabel,gateLabelLift} from '../src/ui/field-gate-label.ts';

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
test('revealed gate labels clear the base health bar and grow inward from the screen edges',()=>{
 const css=readFileSync('src/ui/world-play.css','utf8');
 const controller=readFileSync('src/ui/field-controller.ts','utf8');
 // A storybook bar's top is 21 art units above the hit box; the label clears it at every phone scale.
 for(const scale of [320/450,390/450,412/450,844/450])assert.ok(gateLabelLift(scale,true)>=21*scale+2);
 assert.ok(gateLabelLift(1,false)>gateLabelLift(1,true));
 assert.equal(gateLabelLift(Number.NaN,true),25);
 assert.match(css,/bottom:calc\(100% \+ var\(--gate-label-lift,5px\)\)/);
 assert.match(css,/\.gate-hit\[data-field-gate="hold"\] \.world-target-name\{left:0;right:auto;transform:none\}/);
 assert.match(css,/\.gate-hit\[data-field-gate="advance"\] \.world-target-name\{left:auto;right:0;transform:none\}/);
 assert.match(controller,/--gate-label-lift:\$\{lift\}px/);
});
test('the sticky Back to Camp return keeps paper above it so scrolled cards never peek over it',()=>{
 const css=readFileSync('src/ui/camp.css','utf8');
 assert.match(css,/\.camp-advanced-return::before\{[^}]*bottom:100%[^}]*background:var\(--paper\)/);
});
