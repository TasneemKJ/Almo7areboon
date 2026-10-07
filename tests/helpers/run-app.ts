import { runInNewContext } from 'node:vm';
import { createDomPort, type DomEnv } from '../../src/app/dom-port.ts';

/**
 * Runs extracted shell code in a stub context. The app factories reach their state slice and sibling
 * operations through `state` and `ports`, so the harness context is its own `state` and `ports`:
 * stubbed fields and extracted functions stay plain globals.
 */
export function runInApp(code: string, context: Record<string, unknown>): unknown {
  context.state ??= context;
  context.ports ??= context;
  // The page port runs over the same stubbed window, document and performance the harness provides.
  context.dom ??= createDomPort(stubEnv(context));
  return runInNewContext(code, context);
}

/** A live view of the harness context as page globals; bare stubs (requestAnimationFrame, timers) stand in for window methods. */
function stubEnv(context: Record<string, any>): DomEnv {
  const bare = (name: string) => (...args: unknown[]) => context[name]?.(...args);
  return {
    get document() { return context.document; },
    get performance() { return context.performance; },
    get navigator() { return context.navigator; },
    get URL() { return context.URL; },
    get window() {
      return { requestAnimationFrame: bare('requestAnimationFrame'), cancelAnimationFrame: bare('cancelAnimationFrame'), setTimeout: bare('setTimeout'), clearTimeout: bare('clearTimeout'), ...(context.window ?? {}) };
    },
  } as unknown as DomEnv;
}
