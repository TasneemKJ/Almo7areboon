/* Common game-distribution budget. Keep this checker identical in all six repos.
 * Count all shipped JS, including engines, lazy chunks, workers and inline scripts.
 * This is a reproducible gzip-size ceiling, not a mobile load-time measurement.
 * See docs/javascript-budget.md. Run after packaging: node scripts/check-size.mjs [outDir]. */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const JS_BUDGET_GZIP_BYTES = 500 * 1024;

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`cannot measure a symbolic link: ${path}`);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function attributes(source) {
  const result = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    if (!result.has(name)) result.set(name, match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function inlineJavaScript(html) {
  const blocks = [];
  // HTML comments are skipped; quoted '>' in a script attribute is not a tag end.
  const pattern = /<!--[\s\S]*?-->|<script\b((?:[^'">]|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi;
  for (const match of html.matchAll(pattern)) {
    if (match[1] === undefined) continue;
    const attrs = attributes(match[1]);
    const type = (attrs.get('type') ?? '').trim().toLowerCase();
    const executable = !type || type === 'module' || /^(?:text|application)\/(?:x-)?(?:java|ecma)script(?:1\.[0-5])?$/.test(type) || ['text/jscript', 'text/livescript'].includes(type);
    if (executable && !attrs.has('src') && match[2].trim()) blocks.push(match[2]);
  }
  // Inline blocks share one HTML response, so compress their bodies together.
  return blocks.join('\n');
}

export function measureJavaScript(directory) {
  const entries = [];
  for (const path of filesUnder(directory)) {
    let source;
    if (/\.[cm]?js$/i.test(path)) source = readFileSync(path);
    else if (/\.html?$/i.test(path)) source = inlineJavaScript(readFileSync(path, 'utf8'));
    else continue;
    if (!source.length) continue;
    entries.push({ path: relative(directory, path).replaceAll('\\', '/'), bytes: gzipSync(source, { level: 9 }).length });
  }
  if (!entries.length) throw new Error(`no JavaScript found in ${directory}`);
  const bytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  return { bytes, entries, overBudget: bytes > JS_BUDGET_GZIP_BYTES };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const directory = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../dist/', import.meta.url));
    const report = measureJavaScript(directory);
    const line = `total JavaScript ${report.bytes} bytes (${(report.bytes / 1024).toFixed(1)} KiB) gzip; budget ${JS_BUDGET_GZIP_BYTES} bytes (500 KiB)`;
    for (const entry of report.entries) console.log(`check-size: ${entry.path}: ${entry.bytes} bytes gzip`);
    if (report.overBudget) { console.error(`check-size: over budget, ${line}`); process.exit(1); }
    console.log(`check-size: ${line}`);
  } catch (error) {
    console.error(`check-size: ${error.message}`);
    process.exit(1);
  }
}
