import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { chapterInBothLanguages } from '../src/ui/chapter-presentation.ts';

// 1.1 naming pass (DESIGN.md "names that belong to this tale"): the player-facing words come from this tale's own world.

test('the First Fires heavy is the Lizard Rider in both languages; no dinosaur is named among the troops', () => {
  const first = chapterInBothLanguages(0);
  assert.equal(first.en.units[2], 'Lizard Rider');
  assert.equal(first.ar.units[2], 'فارس الضبّ');
  for (let age = 0; age < 6; age++) {
    const both = chapterInBothLanguages(age);
    assert.doesNotMatch([...both.en.units, ...both.ar.units].join(' '), /dino|ديناصور|caveman|spartan/i);
  }
});

test('no screen speaks of evolving or ages: the company moves camp along the road', () => {
  const sources = ['src/ui', 'src/app'].flatMap(dir => readdirSync(new URL(`../${dir}/`, import.meta.url)).filter(f => f.endsWith('.ts')).map(f => readFileSync(new URL(`../${dir}/${f}`, import.meta.url), 'utf8')));
  // The first (English) and second (Arabic) text of every tr(...) pair, wherever it sits in a template.
  const copy = sources.flatMap(source => source.match(/\btr\((?:'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\\n]|\\.)*")\s*,\s*(?:'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/g) ?? []);
  assert.ok(copy.length > 400, 'the copy was found');
  const said = copy.join('\n');
  assert.doesNotMatch(said, /\bEvolution\b|\bEVOLVE\b|\bEvolve\b|\bevolv(e|es|ing)\b|FINAL AGE|CURRENT AGE|YOUR ERA|age economy|age upgrades|first age/);
  assert.doesNotMatch(said, /ارتقِ|الارتقاء|يرتقي|ترتقي|عصرك|العصر/);
  assert.match(said, /MOVE CAMP/); assert.match(said, /انقل المخيّم/); assert.match(said, /'The Road','الطريق'/);
});
