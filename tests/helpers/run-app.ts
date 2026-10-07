import { runInNewContext } from 'node:vm';

/**
 * Runs extracted shell code in a stub context. The app modules reach their shared state through
 * an `app` object, so the harness context is its own `app`: stubbed fields stay plain globals.
 */
export function runInApp(code: string, context: Record<string, unknown>): unknown {
  context.app ??= context;
  return runInNewContext(code, context);
}
