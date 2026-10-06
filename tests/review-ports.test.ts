import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = (env: Record<string, string>) => spawnSync(process.execPath, ['--input-type=module', '-e', "import {reviewPort} from './scripts/review-port.mjs'; console.log([4173,4175,4179].map(reviewPort).join(','))"], { encoding: 'utf8', env: { ...process.env, REVIEW_PORT_BASE: '', ...env } });

test('review ports keep their defaults and shift together with REVIEW_PORT_BASE', () => {
  assert.equal(run({}).stdout.trim(), '4173,4175,4179');
  assert.equal(run({ REVIEW_PORT_BASE: '4330' }).stdout.trim(), '4330,4332,4336');
  for (const bad of ['abc', '80', '99999', '4330.5']) assert.equal(run({ REVIEW_PORT_BASE: bad }).stdout.trim(), '4173,4175,4179', `ignores ${bad}`);
});
test('no review script binds or visits a literal local port outside comments', () => {
  const files = readdirSync(new URL('../scripts/', import.meta.url)).filter(f => f.endsWith('.mjs') && f !== 'review-port.mjs');
  for (const file of files) {
    const code = readFileSync(new URL(`../scripts/${file}`, import.meta.url), 'utf8').split('\n').filter(l => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
    assert.doesNotMatch(code, /127\.0\.0\.1:4\d\d\d(?!\d)(?!.*reviewPort)/, `${file} has a literal port`);
    assert.doesNotMatch(code, /'--port', ?'\d+'/, `${file} passes a literal --port`);
  }
});
