import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = (path: string) => readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');

/** The shell modules that make up the app: the entry file, the shared state, runtime and the flow modules, plus the presenters they use. */
export const APP_FILES = ['main.ts', 'app/runtime.ts', 'app/dom-port.ts', 'app/lifecycle.ts', 'app/navigation.ts', 'app/quests.ts', 'app/listeners.ts', 'ui/app-shell.ts', 'ui/hud-sync.ts'];

/**
 * The app as one text, for source-contract tests and for harnesses that execute named functions.
 * `export` keywords are dropped so extracted declarations run as plain script.
 */
export function mainSource(): string {
  return APP_FILES.map(read).join('\n').replace(/^export (async function|function|const) /gm, '$1 ');
}

/**
 * Every statement of a source file, descending into function declarations. The app modules are
 * factories of inner functions, so extraction by name must see statements at any declaration depth.
 */
export function flatStatements(file: ts.SourceFile): ts.Statement[] {
  const out: ts.Statement[] = [];
  const walk = (statements: readonly ts.Statement[]) => {
    for (const statement of statements) {
      out.push(statement);
      if (ts.isFunctionDeclaration(statement) && statement.body) walk(statement.body.statements);
    }
  };
  walk(file.statements);
  return out;
}
