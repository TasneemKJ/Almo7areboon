import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('the sticky dismiss header reserves its full height above dialog captions',()=>{
 const css=readFileSync(new URL('../src/ui/continuation.css',import.meta.url),'utf8');
 const rule=css.match(/\.dialog-dismiss\s*\{([^}]+)\}/)?.[1];
 assert.ok(rule,'shared dialog dismissal rule exists');
 const margin=rule.match(/margin-top:\s*(-?[\d.]+)(?:px)?\s*;/);
 assert.ok(margin,'dismiss header has an explicit flow offset');
 assert.ok(Number(margin[1])>=0,'a negative flow margin lets sticky positioning paint the header over the following caption');
 assert.match(rule,/position:\s*sticky/,'Close remains accessible when scrolled');
 assert.match(rule,/height:\s*44px/,'the existing 44px touch target is preserved');
});

test('the dismiss header backing cannot make a dialog pan sideways',()=>{
 const css=readFileSync(new URL('../src/ui/continuation.css',import.meta.url),'utf8');
 const backing=css.match(/\.dialog-dismiss::before\s*\{([^}]+)\}/)?.[1];
 assert.ok(backing,'the sticky header extends its paper into the dialog padding');
 const inset=backing.match(/inset:\s*([^;]+);/)?.[1].trim().split(/\s+/).map(value=>parseFloat(value));
 assert.ok(inset&&inset.length>=2,'the backing has explicit insets');
 // A negative side inset widens the dialog's scroll area past a 12px phone gutter (it panned 9px sideways at 320px).
 const sides=inset.length===2||inset.length===3?[inset[1]]:[inset[1],inset[3]];
 assert.ok(sides.every(value=>value>=0),'side bands are painted with box-shadow, not a negative inset');
 assert.match(backing,/box-shadow:[^;]*-24px 0 0 var\(--paper\)[^;]*24px 0 0 var\(--paper\)/,'the side padding bands stay covered');
});
