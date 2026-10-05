import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../../', import.meta.url));
const script = join(root, 'scripts/check-size.mjs');
const gzipBytes = (text) => gzipSync(text, { level: 9 }).length;
const noise = Array.from({ length: 6000 }, (_, i) => createHash('sha256').update(String(i)).digest('hex')).join('');

function check(files) {
  const dir = mkdtempSync(join(tmpdir(), 'game-js-budget-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const path = join(dir, name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    }
    const result = spawnSync(process.execPath, [script, dir], { cwd: root, encoding: 'utf8' });
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function passesWithBytes(result, expected) {
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, new RegExp(`total JavaScript ${expected} bytes`));
  assert.match(result.output, /budget 512000 bytes \(500 KiB\)/);
}

test('uses the common 500 KiB limit for a distribution above the old main-chunk limits', () => {
  const payload = `/*${noise + noise.split('').reverse().join('')}*/`;
  assert.ok(gzipBytes(payload) > 340 * 1024 && gzipBytes(payload) < 500 * 1024);
  passesWithBytes(check({ 'index.js': payload }), gzipBytes(payload));
});

test('counts every main, vendor, lazy, debug, worker and service-worker file once', () => {
  const files = {
    'assets/index-main.js': 'globalThis.game = 1;',
    'assets/vendor.mjs': 'export const engine = 2;',
    'assets/nested/lazy.js': 'export const extra = 3;',
    'assets/debug.cjs': 'module.exports = 4;',
    'assets/worker.js': 'postMessage(5);',
    'sw.js': 'self.addEventListener("install", () => {});',
  };
  passesWithBytes(check(files), Object.values(files).reduce((sum, text) => sum + gzipBytes(text), 0));
});

test('duplicate bytes at different shipped paths are not discounted', () => {
  const code = 'globalThis.game = 1;';
  passesWithBytes(check({ 'assets/a.js': code, 'assets/b.js': code }), gzipBytes(code) * 2);
});

test('fails when combined small chunks exceed the common limit', () => {
  const code = `/*${noise}*/`;
  assert.ok(gzipBytes(code) < 500 * 1024 && gzipBytes(code) * 3 > 500 * 1024);
  const result = check({ 'assets/index-main.js': code, 'assets/vendor.js': code, 'assets/lazy.js': code });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /over budget/);
});

test('counts inline JavaScript together per HTML file and includes standalone modules', () => {
  const a = 'globalThis.first = "مرحبا";', b = 'globalThis.second = 2;', external = 'export const third = 3;';
  const result = check({
    'index.html': `<script>${a}</script><script type="module" data-example=">">${b}</script><script src="./assets/app.js"></script>`,
    'assets/app.js': external,
  });
  passesWithBytes(result, gzipBytes(`${a}\n${b}`) + gzipBytes(external));
});

test('an inline-only single-file game cannot bypass the size limit', () => {
  const result = check({ 'game.html': `<script>/*${noise}*/</script><script>/*${noise.split('').reverse().join('')}*/</script><script>/*${Buffer.from(noise).toString('base64')}*/</script>` });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /over budget/);
});

test('ignores source maps, CSS, inert JSON/import maps and commented-out scripts', () => {
  const code = 'globalThis.first = 1;';
  const result = check({
    'index.html': `<!-- <script>${noise}</script> --><script type=application/ld+json>{"data":"${noise}"}</script><script type="importmap">{"imports":{}}</script><script type="text/javascript">${code}</script>`,
    'assets/app.js.map': noise, 'assets/styles.css': noise,
  });
  passesWithBytes(result, gzipBytes(code));
});

test('retains separately shipped HTML entry points instead of deduplicating them', () => {
  const code = 'globalThis.entry = 1;';
  passesWithBytes(check({ 'index.html': `<script>${code}</script>`, 'other.html': `<script>${code}</script>` }), gzipBytes(code) * 2);
});

test('fails closed for an empty or non-JavaScript build output', () => {
  for (const files of [{}, { 'index.html': '<title>No game</title>' }]) {
    const result = check(files);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /no JavaScript/i);
  }
});

test('reports a missing build as a failure', () => {
  const result = spawnSync(process.execPath, [script, join(tmpdir(), 'missing-game-budget-output-does-not-exist')], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /check-size:/);
});

test('the production packaging command runs the checker after creating output', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const command = pkg.scripts['package:html'] ?? pkg.scripts.build;
  assert.match(command, /&& node scripts\/check-size\.mjs$/);
});


test('alternative Vite output directories use the same checker and cap', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  for (const [name, command] of Object.entries(pkg.scripts)) {
    if (!command.includes('vite build')) continue;
    const output = command.match(/--outDir\s+(\S+)/)?.[1];
    const suffix = ` && node scripts/check-size.mjs${output ? ` ${output}` : ''}`;
    assert.ok(command.endsWith(suffix), `${name} must check its own built output`);
  }
});
