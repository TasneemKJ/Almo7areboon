import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// Imports point down: game <- view <- ui <- main.ts (see ARCHITECTURE.md).
const SRC = new URL('../src/', import.meta.url).pathname;
const RANK: Record<string, number> = { game: 0, view: 1, ui: 2, main: 3 };

const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? files(join(dir, entry.name)) : entry.name.endsWith('.ts') ? [join(dir, entry.name)] : []);
const layerOf = (path: string) => {
  const first = relative(SRC, path).split('/')[0];
  return first.endsWith('.ts') ? first.replace('.ts', '') : first;
};
const sources = files(SRC).map(path => ({ path, rel: relative(SRC, path), text: readFileSync(path, 'utf8') }));
const specifiers = (text: string) =>
  [...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\bimport\s+)['"]([^'"]+)['"]/g)].map(match => match[1]);

test('lower layers never import higher layers', () => {
  for (const { path, rel, text } of sources) {
    const own = RANK[layerOf(path)];
    if (own === undefined) continue;
    for (const spec of specifiers(text).filter(s => s.startsWith('.'))) {
      const target = layerOf(join(path, '..', spec));
      if (RANK[target] === undefined) continue;
      assert.ok(RANK[target] <= own, `${rel} (${layerOf(path)}) must not import ${spec} (${target})`);
    }
  }
});

test('src/game has no DOM, Phaser or view/ui dependency', () => {
  // save.ts takes an injectable Storage and only falls back to the global one.
  const storageFallback = new Set(['game/save.ts', 'game/backup.ts']);
  for (const { rel, text } of sources.filter(s => s.rel.startsWith('game/'))) {
    assert.ok(!specifiers(text).some(s => /^phaser$|^three/.test(s)), `${rel} imports a rendering library`);
    const code = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.doesNotMatch(code, /\b(document|window)\./, `${rel} touches the DOM`);
    if (!storageFallback.has(rel)) assert.doesNotMatch(code, /\blocalStorage\b/, `${rel} reaches for localStorage`);
  }
});

test('Phaser is only imported by the view layer and main', () => {
  for (const { rel, text } of sources) {
    if (!specifiers(text).includes('phaser')) continue;
    assert.ok(rel.startsWith('view/') || rel === 'main.ts', `${rel} imports phaser outside view/`);
  }
});

// Modules above the cap. Shrink these over time; do not add to the list.
const SIZE_CAP = 500;
const SIZE_EXCEPTIONS: Record<string, number> = {
  'main.ts': 950,
  'view/battlefield.ts': 900,
  'game/simulation.ts': 650,
};

test('modules stay under the size cap unless listed', () => {
  for (const { rel, text } of sources) {
    const lines = text.split('\n').length;
    const limit = SIZE_EXCEPTIONS[rel] ?? SIZE_CAP;
    assert.ok(lines <= limit, `${rel} has ${lines} lines (limit ${limit})`);
  }
  for (const rel of Object.keys(SIZE_EXCEPTIONS)) {
    assert.ok(sources.some(s => s.rel === rel), `stale size exception ${rel}`);
  }
});
