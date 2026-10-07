import { runInNewContext } from 'node:vm';
import { createDomPort, type DomEnv } from '../../src/app/dom-port.ts';

/**
 * Runs extracted shell code in a stub context. Each app factory owns a state object (sessionState, navState,
 * questState, inputState) and reaches siblings through `ports`; the harness context is all of them,
 * so stubbed fields and extracted functions stay plain globals.
 */
export function runInApp(code: string, context: Record<string, unknown>): unknown {
  for (const name of ['sessionState', 'navState', 'questState', 'inputState', 'ports']) context[name] ??= context;
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
