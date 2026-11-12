import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGE_KEY, dir, lang, pickLanguage, plural, setLang, tr } from '../src/game/locale.ts';
import { n, saveLanguage } from '../src/ui/i18n.ts';
import { preferencesHtml, saveRecoveryHtml } from '../src/ui/preferences-screen.ts';
import { defaultProfile } from '../src/game/save.ts';

test('a saved choice wins, then the device language, then English', () => {
  assert.equal(pickLanguage('ar', ['en-US']), 'ar');
  assert.equal(pickLanguage('en', ['ar-JO']), 'en');
  assert.equal(pickLanguage(null, ['ar-JO', 'en']), 'ar');
  assert.equal(pickLanguage(null, ['AR']), 'ar');
  assert.equal(pickLanguage(null, ['arn-CL']), 'en', 'Mapudungun is not Arabic');
  assert.equal(pickLanguage('fr', ['en-GB', 'ar']), 'en', 'only the first preference counts; an unknown stored value is ignored');
  assert.equal(pickLanguage(undefined, undefined), 'en');
});

test('tr, dir and plural follow the current language', () => {
  setLang('ar');
  assert.equal(lang(), 'ar'); assert.equal(dir(), 'rtl'); assert.equal(tr('Done', 'تمّ'), 'تمّ');
  assert.deepEqual([1, 2, 3, 10, 11, 100].map(c => plural(c, ['card', 'cards'], ['بطاقة', 'بطاقتان', 'بطاقات', 'بطاقة'])), ['بطاقة', 'بطاقتان', 'بطاقات', 'بطاقات', 'بطاقة', 'بطاقة']);
  setLang('en');
  assert.equal(dir(), 'ltr'); assert.equal(tr('Done', 'تمّ'), 'Done');
  assert.equal(plural(1, ['card', 'cards'], ['', '', '', '']), 'card');
  assert.equal(plural(0, ['card', 'cards'], ['', '', '', '']), 'cards');
});

test('numbers are isolated left to right inside text', () => {
  assert.equal(n('3 / 10'), '<bdi dir="ltr">3 / 10</bdi>');
});

test('the language choice is stored under the app prefix, outside the save', () => {
  const written: [string, string][] = [];
  assert.equal(saveLanguage('ar', { setItem: (k, v) => { written.push([k, v]); } }), true);
  assert.deepEqual(written, [[LANGUAGE_KEY, 'ar']]);
  assert.ok(LANGUAGE_KEY.startsWith('almo7areboon.'));
  assert.notEqual(LANGUAGE_KEY, 'almo7areboon.save.v1');
  assert.equal(saveLanguage('en', { setItem: () => { throw new Error('quota'); } }), false);
});

test('Preferences is one language per screen, with a bilingual language picker', () => {
  const mix = { version: 1, effects: 80, atmosphere: 60 } as never;
  setLang('ar');
  const ar = preferencesHtml(defaultProfile(), true, mix, true, '') + saveRecoveryHtml(true, '');
  const withoutPicker = ar.replace(/<label class="preference-select preference-language"[\s\S]*?<\/label>/, '').replace(/<kbd[^>]*>[^<]*<\/kbd>/g, '');
  assert.doesNotMatch(withoutPicker.replace(/<[^>]+>/g, ' '), /[A-Za-z]{3,}/, 'no English words outside the picker in Arabic');
  assert.match(ar, /value="ar" lang="ar" selected/);
  setLang('en');
  const en = preferencesHtml(defaultProfile(), true, mix, true, '');
  assert.doesNotMatch(en.replace(/<label class="preference-select preference-language"[\s\S]*?<\/label>/, ''), /[؀-ۿ]/, 'no Arabic outside the picker in English');
  assert.match(en, /value="en" lang="en" selected/);
});
