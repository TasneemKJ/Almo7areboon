import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
const dir = new URL('../.github/workflows/', import.meta.url);
const read = (name: string) => readFileSync(new URL(name, dir), 'utf8');
const triggers = (text: string) => text.slice(text.indexOf('\non:'), text.indexOf('\npermissions:'));

test('only the fast verify gate runs automatically on pull requests and pushes', () => {
  for (const file of readdirSync(dir).filter(f => f.endsWith('.yml'))) {
    const t = triggers(read(file));
    if (file === 'verify.yml') { assert.match(t, /pull_request:/); assert.match(t, /branches: \[main\]/); }
    else assert.doesNotMatch(t, /pull_request:|push:/, `${file} must not run on PR or push`);
  }
});
test('fast gate keeps the required job name and stays out of the slow suites', () => {
  const v = read('verify.yml');
  assert.match(v, /\n  verify:\n/); assert.match(v, /npm run build/); assert.match(v, /npm run test:fast/);
  assert.doesNotMatch(v, /playwright|upload-artifact/);
});
test('weekly workflow reuses the manual heavy workflows and never deploys', () => {
  const w = read('weekly-full.yml');
  assert.match(w, /schedule:/); assert.match(w, /workflow_dispatch:/); assert.doesNotMatch(w, /pull_request:|push:|upload-artifact/);
  for (const f of ['full-verify', 'battle-banner-review', 'chronicle-review', 'mobile', 'reliability']) {
    assert.match(w, new RegExp(`uses: \\./\\.github/workflows/${f}\\.yml`));
    assert.match(read(`${f}.yml`), /workflow_call:/);
  }
});
test('every workflow uses the current action majors', () => {
  for (const file of readdirSync(dir).filter(f => f.endsWith('.yml'))) {
    for (const [, name, major] of read(file).matchAll(/uses: actions\/([\w-]+)@v(\d+)/g)) assert.ok(Number(major) >= 7, `${file}: actions/${name}@v${major}`);
  }
});
