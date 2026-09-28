export function createLifetime() {
  let disposed = false;
  const cleanups: (() => void)[] = [];
  const add = (cleanup: () => void) => { if (disposed) cleanup(); else cleanups.push(cleanup); };
  return {
    get disposed() { return disposed; },
    add,
    listen<T extends Event>(target: EventTarget, type: string, listener: (event: T) => void, options?: AddEventListenerOptions | boolean) {
      if (disposed) return;
      const handler = listener as EventListener;
      target.addEventListener(type, handler, options);
      add(() => target.removeEventListener(type, handler, options));
    },
    dispose(): unknown[] {
      if (disposed) return []; disposed = true;
      const errors: unknown[] = [];
      for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup(); } catch (error) { errors.push(error); } }
      return errors;
    },
  };
}
