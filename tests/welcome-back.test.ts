import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import { welcomeBackLine, awayPhrase, AWAY_THRESHOLD_MS } from '../src/ui/welcome-back.ts';
import { decodeSave, defaultProfile } from '../src/game/save.ts';

const NOW = 1_800_000_000_000, H = 3_600_000, D = 24 * H;

test('welcome-back line appears only for returning players after a long absence', () => {
  assert.equal(welcomeBackLine(NOW - 2 * H, NOW, 5), null, 'short absence');
  assert.equal(welcomeBackLine(NOW - AWAY_THRESHOLD_MS + 1, NOW, 5), null);
  assert.equal(welcomeBackLine(NOW - 7 * H, NOW, 0), null, 'new player');
  assert.equal(welcomeBackLine(undefined, NOW, 5), null, 'older save');
  assert.equal(welcomeBackLine(NOW + D, NOW, 5), null, 'future timestamp');
  assert.equal(welcomeBackLine(Number.NaN, NOW, 5), null);
  assert.match(welcomeBackLine(NOW - 3 * D, NOW, 5)!, /^Welcome back\. The village kept the lamps lit for 3 days\.$/);
});
test('away phrases scale from hours to seasons', () => {
  assert.equal(awayPhrase(7 * H), '7 hours');
  assert.equal(awayPhrase(D + H), 'a day');
  assert.equal(awayPhrase(20 * D), '2 weeks');
  assert.equal(awayPhrase(100 * D), 'many seasons');
});
test('lastSeen is optional, normalized on load and written on a copy at save time', () => {
  assert.equal('lastSeen' in defaultProfile(), false);
  assert.equal(decodeSave(JSON.stringify({ ...defaultProfile(), lastSeen: NOW })).profile?.lastSeen, NOW);
  for (const bad of [0, -1, 1.5, 'x', null, {}, 5e15]) assert.equal('lastSeen' in (decodeSave(JSON.stringify({ ...defaultProfile(), lastSeen: bad })).profile ?? {}), false, String(bad));
  const main = mainSource();
  assert.match(main, /state\.session\.save\(\{\.\.\.state\.game\.profile,lastSeen:Math\.floor\(Date\.now\(\)\/60000\)\*60000\}\)/);
  assert.match(main, /welcomeBackLine\(loaded\.profile\.lastSeen,Date\.now\(\),loaded\.profile\.wins\)/);
});
