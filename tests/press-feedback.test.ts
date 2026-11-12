import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pressFeedback } from '../src/ui/press-feedback.ts';

test('a press gives a short tap on the Taptic Engine (TasKit maps navigator.vibrate) and a soft wooden tick when sound is on', () => {
  const buzz: unknown[] = [], ticks: boolean[] = [];
  const env = { vibrate: (p: unknown) => { buzz.push(p); return true; }, tick: (on: boolean) => ticks.push(on) };
  pressFeedback({ sound: true, kind: 'press' }, env);
  pressFeedback({ sound: false, kind: 'press' }, env);
  pressFeedback({ sound: true, kind: 'deploy' }, env);
  assert.deepEqual(buzz, [8, 8, 14], 'haptics follow the system setting, not the sound switch; a recruit is a firmer tap');
  assert.deepEqual(ticks, [true, false], 'a recruit already has its own deployment cue');
  assert.doesNotThrow(() => pressFeedback({ sound: true, kind: 'press' }, { vibrate: () => { throw new Error('no'); }, tick: () => {} }));
});

test('every button press in the shell reaches the feedback, right after the audio is resumed on that gesture', () => {
  const listeners = readFileSync(new URL('../src/app/listeners.ts', import.meta.url), 'utf8');
  assert.match(listeners, /unlockAudio\(ports\.sessionState\.game\.profile\.sound\);pressFeedback\(/);
  const audio = readFileSync(new URL('../src/view/audio.ts', import.meta.url), 'utf8');
  assert.match(audio, /press:\{wave:'triangle'/);
});
