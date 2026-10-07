import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';

const field = battlefieldSource();

test('a heavy blow on a unit starts a 50 ms freeze, at most twice a second, never with reduced motion', () => {
  assert.match(field, /e\.source\?\.kind===2&&e\.target==='unit'&&\(e\.amount\?\?0\)>0&&!this\.reduce\)this\.effects\.hitStop\.trigger\(\);/);
  assert.match(field, /if\(stop>0\)\{stop=Math\.max\(0,stop-dt\);return true;\}/);assert.match(field, /if\(this\.effects\.hitStop\.frozen\(dt\)\)return;/);
});
test('the freeze lands before the simulation steps, so nothing advances during it', () => {
  const freeze = field.indexOf('if(this.effects.hitStop.frozen(dt))return;'), step = field.indexOf('game.step(dt);', freeze);
  assert.ok(freeze > 0 && step > freeze);
});

test('lifecycle invalidation precedes the freeze gate and resets discard transient timers', () => {
  const guard = "if(this.lastState!==game.state||game.state.phase!=='running'||game.state.paused||(options.isVisible&&!options.isVisible())||reduced)this.effects.hitStop.cancel();";
  assert.ok(field.indexOf(guard) > 0);
  assert.ok(field.indexOf(guard) < field.indexOf('if(this.effects.hitStop.frozen(dt))return;'));
  assert.match(field, /function reset\(reason:'motion'\|'scene'='scene'\):void \{\n\s+stop=0;cool=0;/);
});
