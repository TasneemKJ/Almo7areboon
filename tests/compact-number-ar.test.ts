import test from 'node:test';
import assert from 'node:assert/strict';
import { compactNumber } from '../src/game/format.ts';
import { setLang } from '../src/game/locale.ts';

test('compact numbers speak the current language: k/m/b in English, Arabic words in Arabic', () => {
  assert.deepEqual([999, 2500, 3_400_000, 1_200_000_000, 999_950].map(compactNumber), ['999', '2.5k', '3.4m', '1.2b', '1m']);
  setLang('ar');
  try {
    assert.deepEqual([999, 2500, 3_400_000, 1_200_000_000, 999_950].map(compactNumber), ['999', '2.5 ألف', '3.4 مليون', '1.2 مليار', '1 مليون']);
    assert.doesNotMatch([1500, 2e6, 3e9, 4e12, 999.6].map(compactNumber).join(' '), /[A-Za-z]/);
  } finally { setLang('en'); }
});
