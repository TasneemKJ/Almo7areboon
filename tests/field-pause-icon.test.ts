import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldControlsHtml} from '../src/ui/field-controls.ts';

test('battlefield pause remains recognizable without a Roman numeral font glyph',()=>{
 const button=fieldControlsHtml().match(/<button class="field-pause"[^>]*>(.*?)<\/button>/)![0];
 assert.match(button,/aria-label="Pause"/);
 assert.match(button,/<svg[^>]*aria-hidden="true"/);
 assert.equal((button.match(/<rect\b/g)||[]).length,2,'two painted bars identify pause independently of installed fonts');
 assert.doesNotMatch(button,/Ⅱ/);
});
