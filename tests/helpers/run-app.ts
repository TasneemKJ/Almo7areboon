import { runInNewContext } from 'node:vm';

/**
 * Runs extracted shell code in a stub context. The app factories reach their state slice and sibling
 * operations through `state` and `ports`, so the harness context is its own `state` and `ports`:
 * stubbed fields and extracted functions stay plain globals.
 */
export function runInApp(code: string, context: Record<string, unknown>): unknown {
  context.state ??= context;
  context.ports ??= context;
  return runInNewContext(code, context);
}
