import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('package.json, package-lock.json and the top CHANGELOG heading carry one version', () => {
  const pkg = JSON.parse(read('package.json')), lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  const top = read('CHANGELOG.md').match(/^## (\d+\.\d+\.\d+) - /m)?.[1];
  assert.equal(top, pkg.version);
});
test('every dated CHANGELOG version is unique and descending', () => {
  const versions = [...read('CHANGELOG.md').matchAll(/^## (\d+)\.(\d+)\.(\d+) - /gm)].map(m => m.slice(1).map(Number));
  assert.ok(versions.length > 5);
  for (let i = 1; i < versions.length; i++) {
    const [a, b] = [versions[i - 1], versions[i]];
    assert.ok(a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] > b[2]))), `${a.join('.')} should come before ${b.join('.')}`);
  }
});
test('the UX contract no longer describes the retired floating close button', () => {
  assert.doesNotMatch(read('UX-CONTRACT.md'), /close button floats top-right/);
  assert.match(read('UX-CONTRACT.md'), /sticky, opaque 44px header/);
});
