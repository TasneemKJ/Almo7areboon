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
