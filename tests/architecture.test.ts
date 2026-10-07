import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

// Imports point down: game <- view <- ui <- app (shell modules) <- main.ts (see ARCHITECTURE.md).
const SRC = new URL('../src/', import.meta.url).pathname;
const RANK: Record<string, number> = { game: 0, view: 1, ui: 2, app: 3, main: 4 };

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
  // Storage is always injected; game code never reaches for the global.
  for (const { rel, text } of sources.filter(s => s.rel.startsWith('game/'))) {
    assert.ok(!specifiers(text).some(s => /^phaser$|^three/.test(s)), `${rel} imports a rendering library`);
    const code = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.doesNotMatch(code, /\b(document|window)\./, `${rel} touches the DOM`);
    assert.doesNotMatch(code, /\b(localStorage|sessionStorage|indexedDB)\b/, `${rel} reaches for browser storage`);
  }
});

test('Phaser is only imported by the view layer and main', () => {
  for (const { rel, text } of sources) {
    if (!specifiers(text).includes('phaser')) continue;
    assert.ok(rel.startsWith('view/') || rel === 'main.ts', `${rel} imports phaser outside view/`);
  }
});

// Modules allowed above the cap. Empty today: add an entry only with a recorded reason.
const SIZE_CAP = 500;
const SIZE_EXCEPTIONS: Record<string, number> = {
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

// Functions (declarations, methods, arrows) longer than the cap, as `path:name` -> allowed lines. Shrink-only.
const FUNCTION_CAP = 80;
const FUNCTION_EXCEPTIONS: Record<string, number> = {};

/**
 * A function's own length: its lines minus the lines of function declarations nested in it, which are
 * measured on their own. A module factory made of small inner functions therefore counts only its glue.
 */
function functionLengths(rel: string, text: string): { name: string; lines: number }[] {
  const file = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true);
  const lineOf = (pos: number) => file.getLineAndCharacterOfPosition(pos).line;
  const found: { name: string; lines: number }[] = [];
  const nestedLines = (node: ts.Node): number => {
    let total = 0;
    const walk = (child: ts.Node) => {
      if (ts.isFunctionDeclaration(child)) total += lineOf(child.end) - lineOf(child.getStart()) + 1;
      else ts.forEachChild(child, walk);
    };
    ts.forEachChild(node, walk);
    return total;
  };
  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const start = lineOf(node.getStart());
      const own = (node as { name?: ts.Node }).name?.getText(file);
      const owner = ts.isVariableDeclaration(node.parent) ? node.parent.name.getText(file) : ts.isPropertyAssignment(node.parent) ? node.parent.name.getText(file) : undefined;
      found.push({ name: own ?? owner ?? `<anonymous@${start + 1}>`, lines: lineOf(node.end) - start + 1 - nestedLines(node) });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

test('functions stay under the length cap unless listed', () => {
  const seen = new Set<string>();
  for (const { rel, text } of sources) {
    for (const { name, lines } of functionLengths(rel, text)) {
      const key = `${rel}:${name}`;
      seen.add(key);
      const limit = FUNCTION_EXCEPTIONS[key] ?? FUNCTION_CAP;
      assert.ok(lines <= limit, `${key} has ${lines} lines (limit ${limit})`);
    }
  }
  for (const key of Object.keys(FUNCTION_EXCEPTIONS)) assert.ok(seen.has(key), `stale function exception ${key}`);
});

test('app modules receive their dependencies instead of importing each other', () => {
  for (const { rel, text } of sources.filter(s => s.rel.startsWith('app/'))) {
    for (const line of text.split('\n').filter(l => /^import\b/.test(l))) {
      if (/from '\.\/(lifecycle|navigation|quests|listeners)\.ts'/.test(line) && rel !== 'app/shell.ts') assert.fail(`${rel} imports a sibling flow module: ${line}`);
      if (/from '\.\/(state|runtime|shell)\.ts'/.test(line)) assert.match(line, /^import type\b/, `${rel} must take state, DOM handles and ports through deps: ${line}`);
    }
  }
});
