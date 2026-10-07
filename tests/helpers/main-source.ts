import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');

/** The shell modules that make up the app: the entry file, the shared state, runtime and the flow modules, plus the presenters they use. */
export const APP_FILES = ['main.ts', 'app/state.ts', 'app/runtime.ts', 'app/lifecycle.ts', 'app/navigation.ts', 'app/quests.ts', 'app/listeners.ts', 'ui/app-shell.ts', 'ui/hud-sync.ts'];

/**
 * The app as one text, for source-contract tests and for harnesses that execute named functions.
 * `export` keywords are dropped so extracted declarations run as plain script.
 */
export function mainSource(): string {
  return APP_FILES.map(read).join('\n').replace(/^export (async function|function|const) /gm, '$1 ');
}
