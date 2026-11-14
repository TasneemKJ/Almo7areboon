import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// Store compliance (2026-11-14): honest weapons answer, folk-tale subtitles, honest keywords,
// no cards promised that the game lacks, and no doc or comment calling the game a recreation.
const listing = JSON.parse(readFileSync(new URL('../ios/store/listing.json', import.meta.url), 'utf8'));

test('the listing answers weapons honestly and reads as a folk tale', () => {
  assert.equal(listing.ageRating.answers.gunsOrOtherWeapons, 'INFREQUENT_OR_MILD');
  assert.equal(listing.localizations['ar-SA'].subtitle, 'حكاية معارك من زمن الحكايات');
  for (const loc of ['ar-SA', 'en-US']) {
    const l = listing.localizations[loc];
    assert.ok(l.subtitle.length <= 30, `${loc} subtitle fits`);
    assert.ok(l.keywords.length <= 100, `${loc} keywords fit`);
    const words = l.keywords.split(',').map((k: string) => k.trim().toLowerCase());
    for (const banned of ['غزو', 'medieval', 'castle', 'kingdom', 'td', 'قلعة', 'ممالك', 'conquer']) assert.ok(!words.includes(banned), `${loc}: ${banned}`);
    assert.doesNotMatch(l.description, /Olive Wood Shield|Golden Sickle|درع خشب الزيتون|المنجل الذهبي/);
    assert.doesNotMatch(l.subtitle, /بلاد الشام|Levant/);
  }
});

test('no source comment or plan calls the game a faithful recreation', () => {
  const files = ['docs/superpowers/plans/2026-09-28-almo7areboon.md', 'docs/superpowers/specs/2026-09-28-almo7areboon-design.md', 'docs/VERIFICATION.md',
    ...readdirSync(new URL('../src/game/', import.meta.url)).filter((f) => f.endsWith('.ts')).map((f) => `src/game/${f}`)];
  for (const f of files) assert.doesNotMatch(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), /faithful|recreat/i, f);
});
