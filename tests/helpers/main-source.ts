import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');

/** `main.ts` plus the presenters it delegates to (shell markup and HUD sync), for source-contract tests that read the app as one text. */
export function mainSource(): string {
  return ['main.ts', 'ui/app-shell.ts', 'ui/hud-sync.ts'].map(read).join('\n');
}
