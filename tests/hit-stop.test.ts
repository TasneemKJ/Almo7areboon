import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const field = readFileSync(new URL('../src/view/battlefield.ts', import.meta.url), 'utf8');

test('a heavy blow on a unit starts a 50 ms freeze, at most twice a second, never with reduced motion', () => {
  assert.match(field, /e\.source\?\.kind===2&&e\.target==='unit'&&\(e\.amount\?\?0\)>0&&!this\.reduce&&this\.hitStopCool<=0\)\{this\.hitStop=\.05;this\.hitStopCool=\.5;/);
  assert.match(field, /if\(this\.hitStop>0\)\{this\.hitStop=Math\.max\(0,this\.hitStop-dt\);if\(!reducedMotion\(game\.profile\.motion,motionQuery\.matches\)\)return;this\.hitStop=0;\}/);
});
test('the freeze lands before the simulation steps, so nothing advances during it', () => {
  const freeze = field.indexOf('if(this.hitStop>0)'), step = field.indexOf('game.step(dt);', freeze);
  assert.ok(freeze > 0 && step > freeze);
});
