// Owner rule (2026-11-14): no Arabic word that could be read wrongly. A tap is «انقر», never a form of ل-م-س.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const LAMS = /(?<![ء-يـ])(?:[وفب]?(?:ال)?لمس(?:ة|ات|تين|ت|ته|تها|ه|ها|هم|ك|ي)?|[وف]?المس(?:ه|ها|هم|هما|ي|وا)?|[وفس]?[يتن]لمس(?:ه|ها|هم|ون|ين|ان)?|[وف]?ملمس(?:ه|ها)?)(?![ء-يـ])/;

test('no player-facing file uses the root ل-م-س; a tap is «انقر»', () => {
  const files = execSync('git ls-files src ios index.html public', { encoding: 'utf8' }).split('\n')
    .filter(f => /\.(js|ts|json|html|mjs|md|strings)$/.test(f));
  const hits = files.flatMap(f => readFileSync(f, 'utf8').split('\n').filter(l => LAMS.test(l)).map(l => `${f}: ${l.trim().slice(0, 80)}`));
  assert.deepEqual(hits, []);
  assert.ok(LAMS.test('المس الجندي') && LAMS.test('بلمسة') && LAMS.test('يلمسها') && !LAMS.test('انقر على الجندي') && !LAMS.test('الشمس'));
});
