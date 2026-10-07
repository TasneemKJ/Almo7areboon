import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../../src/view/', import.meta.url);

/** The battlefield renderer is split across `battlefield.ts` and its `battlefield-*.ts` collaborators; contract tests read them as one source. */
export function battlefieldSource(): string {
  const names = readdirSync(dir).filter(name => name === 'battlefield.ts' || /^battlefield-.+\.ts$/.test(name)).sort((a, b) => (a === 'battlefield.ts' ? -1 : b === 'battlefield.ts' ? 1 : a.localeCompare(b)));
  return names.map(name => readFileSync(new URL(name, dir), 'utf8')).join('\n');
}
