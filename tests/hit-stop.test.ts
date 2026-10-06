import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const field = readFileSync(new URL('../src/view/battlefield.ts', import.meta.url), 'utf8');

test('a heavy blow on a unit starts a 50 ms freeze, at most twice a second, never with reduced motion', () => {
  assert.match(field, /e\.source\?\.kind===2&&e\.target==='unit'&&\(e\.amount\?\?0\)>0&&!this\.reduce&&this\.hitStopCool<=0\)\{this\.hitStop=\.05;this\.hitStopCool=\.5;/);
  assert.match(field, /if\(this\.hitStop>0\)\{this\.hitStop=Math\.max\(0,this\.hitStop-dt\);return;\}/);
});
test('the freeze lands before the simulation steps, so nothing advances during it', () => {
  const freeze = field.indexOf('if(this.hitStop>0)'), step = field.indexOf('game.step(dt);', freeze);
  assert.ok(freeze > 0 && step > freeze);
});

test('lifecycle invalidation precedes the freeze gate and resets discard transient timers', () => {
  const guard = "if(this.lastState!==game.state||game.state.phase!=='running'||game.state.paused||(options.isVisible&&!options.isVisible())||reduced){this.hitStop=0;this.hitStopCool=0;}";
  assert.ok(field.indexOf(guard) > 0);
  assert.ok(field.indexOf(guard) < field.indexOf('if(this.hitStop>0)'));
  assert.match(field, /private resetEffects\(reason:'motion'\|'scene'='scene'\):void \{this\.hitStop=0;this\.hitStopCool=0;/);
});
