import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeSave, defaultProfile } from '../src/game/save.ts';
import { startOverProfile } from '../src/game/reset.ts';

const encode = (extra: Record<string, unknown>) => JSON.stringify({ ...defaultProfile(), ...extra });

test('troop shapes preference is optional, normalized and absent unless on', () => {
  assert.equal('marks' in defaultProfile(), false);
  assert.equal(decodeSave(encode({ marks: true })).profile?.marks, true);
  for (const bad of [false, 1, 'true', null, {}, []]) assert.equal('marks' in (decodeSave(encode({ marks: bad })).profile ?? {}), false, String(bad));
  const old = JSON.parse(encode({}));
  delete old.marks;
  assert.equal(decodeSave(JSON.stringify(old)).profile?.marks, undefined);
});
test('troop shapes survive a round trip and Start over', () => {
  const p = defaultProfile(); p.marks = true;
  assert.equal(decodeSave(JSON.stringify(p)).profile?.marks, true);
  assert.equal(startOverProfile(p).marks, true);
  assert.equal('marks' in startOverProfile(defaultProfile()), false);
});
test('cards carry a shape per role and the battlefield draws circle, triangle and square', () => {
  const army = readFileSync(new URL('../src/ui/army-screen.ts', import.meta.url), 'utf8');
  assert.match(army, /troop-mark troop-mark-\$\{index\}/);
  const field = battlefieldSource();
  assert.match(field, /if\(game\.profile\.marks\)for\(const unit of s\.units\)/);
  assert.match(field, /fillTriangle/); assert.match(field, /fillCircle/);
});

test('optional role shapes also belong to the physical waiting recruits, not only hidden army cards',async()=>{
 const {fieldControlsHtml}=await import('../src/ui/field-controls.ts');
 const html=fieldControlsHtml();
 for(const kind of [0,1,2])assert.match(html,new RegExp(`data-field-recruit="${kind}"[^>]*><span class="troop-mark troop-mark-${kind}" aria-hidden="true"`));
 const css=readFileSync(new URL('../src/ui/world-play.css',import.meta.url),'utf8');
 assert.match(css,/\.recruit-hit \.troop-mark\{[^}]*top:-8px/);
});
