/** The browser objects the port wraps. Tests pass a stub context with the same shape. */
export interface DomEnv {
  window: Window;
  document: Document;
  performance: Performance;
  navigator: Navigator;
  URL?: typeof URL;
}

/**
 * Everything the shell needs from the page, as small named operations. The app modules call
 * these instead of touching `document` or `window`, so only this file knows the browser globals.
 * Properties are read from `env` on each call, so a replaced stub is seen immediately.
 */
export function createDomPort(env: DomEnv) {
  return {
    /** Whether the tab is in the background. */
    hidden: (): boolean => env.document.hidden,
    activeElement: (): HTMLElement | null => env.document.activeElement as HTMLElement | null,
    body: (): HTMLElement => env.document.body,
    /** The root element, which carries global presentation flags in its dataset. */
    rootElement: (): HTMLElement => env.document.documentElement,
    query: <T extends Element = HTMLElement>(selector: string): T | null => env.document.querySelector<T>(selector),
    createElement: (tag: string): HTMLElement => env.document.createElement(tag),
    /** Event targets for page and viewport level listeners. */
    pageEvents: (): EventTarget => env.document,
    viewEvents: (): EventTarget => env.window,
    now: (): number => env.performance.now(),
    /** True under browser automation, which switches on review evidence. */
    automated: (): boolean => !!env.navigator?.webdriver,
    requestFrame: (callback: FrameRequestCallback): number => env.window.requestAnimationFrame(callback),
    cancelFrame: (id: number): void => env.window.cancelAnimationFrame(id),
    setTimer: (callback: () => void, ms: number): number => env.window.setTimeout(callback, ms),
    clearTimer: (id: number): void => env.window.clearTimeout(id),
    reload: (): void => env.window.location.reload(),
    /** Local storage, accessed lazily because the getter itself can throw. */
    storage: (): Pick<Storage, 'getItem' | 'setItem'> => ({
      getItem: key => env.window.localStorage.getItem(key),
      setItem: (key, value) => env.window.localStorage.setItem(key, value),
    }),
    locks: (): LockManager | null => env.navigator.locks ?? null,
    /** Offers text as a file download and returns a cleanup that revokes the link. */
    downloadText(text: string, type: string, filename: string): () => void {
      const urls = env.URL ?? URL;
      const url = urls.createObjectURL(new Blob([text], { type }));
      const link = env.document.createElement('a') as HTMLAnchorElement;
      link.href = url; link.download = filename;
      env.document.body.append(link); link.click(); link.remove();
      const timer = env.window.setTimeout(() => urls.revokeObjectURL(url), 1000);
      return () => { env.window.clearTimeout(timer); urls.revokeObjectURL(url); };
    },
    /** Registers the offline worker once the page has loaded; failure only costs offline play. */
    registerWorker(script: string): void {
      if (!('serviceWorker' in env.navigator)) return;
      env.window.addEventListener('load', () => { env.navigator.serviceWorker.register(script).catch(() => { /* Offline play is optional. */ }); }, { once: true });
    },
  };
}

export type DomPort = ReturnType<typeof createDomPort>;
