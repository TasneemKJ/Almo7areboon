import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { setImmediate } from 'node:timers/promises';

// Execute the production worker against a bounded network whose request slots
// stay occupied until the corresponding response streams have been consumed.
test('installation drains response bodies before waiting for every download header', async () => {
  const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  const scope = 'https://game.test/';
  const html = Array.from({ length: 6 }, (_, i) => `<script src="./assets/bundle-${i}.js"></script>`).join('');
  const entries = new Map<string, Response>([[scope, new Response('previous complete shell')]]);
  const handlers: Record<string, Function> = {};
  const queued: Array<() => void> = [];
  let active = 0, peak = 0, downloaded = 0, skipped = false;
  const cache = {
    async match(key: string) { return entries.get(key)?.clone(); },
    async put(key: string, response: Response) { entries.set(key, new Response(await response.arrayBuffer())); },
    async keys() { return []; },
    async delete() { return true; },
  };
  const fetch = (url: string) => url === scope ? Promise.resolve(new Response(html)) : new Promise<Response>(resolve => {
    const start = () => {
      active++;
      peak = Math.max(peak, active);
      let chunk = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (chunk++ < 4) controller.enqueue(new Uint8Array(16384));
          else {
            controller.close();
            active--;
            downloaded++;
            queued.shift()?.();
          }
        },
      }, { highWaterMark: 0 });
      resolve(new Response(stream));
    };
    if (active < 2) start(); else queued.push(start);
  });
  runInNewContext(source, {
    URL, Response, fetch, caches: { open: async () => cache },
    self: {
      registration: { scope }, location: { origin: 'https://game.test' },
      skipWaiting: async () => { skipped = true; }, clients: { claim: async () => {} },
      addEventListener: (name: string, handler: Function) => { handlers[name] = handler; },
    },
  });
  let settled = false, failure: unknown;
  const lifetimes: Promise<unknown>[] = [];
  handlers.install({ waitUntil: (value: Promise<unknown>) => lifetimes.push(value) });
  const completion = Promise.all(lifetimes).then(() => { settled = true; }, error => { failure = error; });
  for (let i = 0; i < 100 && !settled && !failure; i++) await setImmediate();
  assert.equal(failure, undefined);
  assert.equal(settled, true, 'installer must consume bodies to release download slots');
  await completion;
  assert.equal(downloaded, 6);
  assert.equal(queued.length, 0);
  assert.ok(peak <= 2);
  assert.equal(entries.size, 7);
  assert.equal(skipped, true);
  assert.equal(await entries.get(scope)!.text(), html);
});
