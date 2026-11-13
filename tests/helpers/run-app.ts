import { runInNewContext } from 'node:vm';
import { createDomPort, type DomEnv } from '../../src/app/dom-port.ts';
import { STORE_COMMANDS } from '../../src/app/store-flow.ts';
import { clockTime, n, tr } from '../../src/ui/i18n.ts';
import { journeyPathHtml } from '../../src/ui/entry-screen.ts';

/**
 * Runs extracted shell code in a stub context. Each app factory owns a state object (sessionState, navState,
 * questState, inputState) and reaches siblings through `ports`; the harness context is all of them,
 * so stubbed fields and extracted functions stay plain globals.
 */
export function runInApp(code: string, context: Record<string, unknown>): unknown {
  for (const name of ['sessionState', 'navState', 'questState', 'inputState', 'ports']) context[name] ??= context;
  // The store flow (src/app/store-flow.ts, tested in tests/store-flow.test.ts) as it behaves off the app: nothing is
  // gated and no store command is its own, so every other flow runs exactly as on the web.
  context.gateEvolution ??= () => false;
  context.gateBattle ??= () => false;
  context.gateStart ??= () => false;
  context.journeyHeld ??= () => false;
  context.handleStoreCommand ??= () => false;
  context.STORE_COMMANDS ??= STORE_COMMANDS;
  // The shell's own text goes through the language pair helpers (English in tests).
  context.tr ??= tr;
  context.n ??= n;
  context.clockTime ??= clockTime;
  // The entry's journey path, as on the web: everything owned, nothing locked.
  context.journeyPathHtml ??= journeyPathHtml;
  context.ownsFullJourney ??= () => true;
  context.pressFeedback ??= () => {};
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
