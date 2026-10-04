import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const deferred=()=>{let resolve!:(value?:any)=>void,reject!:(reason?:any)=>void;const promise=new Promise<any>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function worker({cached=true,mode='cors',url='https://game.test/art/a.webp',method='GET'}={}){
 const network=deferred(),write=deferred(),trim=deferred(),lifetimes:Promise<any>[]=[];
 const handlers:Record<string,Function>={},request={url,method,mode};let response:Promise<any>|undefined,putStarted=false,trimStarted=false,fetches=0;
 const fresh={ok:true,type:'basic',clone(){return this;},async text(){return '';}},old={name:'cached'};
 const cache={match:async()=>cached?old:undefined,put:()=>{putStarted=true;return write.promise;},keys:()=>{trimStarted=true;return trim.promise;},delete:async()=>true};
 runInNewContext(source,{URL,Response:{error:()=>({name:'error'})},caches:{open:async()=>cache},fetch:()=>{fetches++;return network.promise;},self:{location:{origin:'https://game.test'},registration:{scope:'https://game.test/'},addEventListener:(name:string,fn:Function)=>handlers[name]=fn}});
 handlers.fetch({request,respondWith:(p:Promise<any>)=>response=p,waitUntil:(p:Promise<any>)=>lifetimes.push(p)});
 return {network,write,trim,lifetimes,fresh,old,get response(){return response;},get putStarted(){return putStarted;},get trimStarted(){return trimStarted;},get fetches(){return fetches;}};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('cached response remains immediate while refresh lifetime covers write and bundle trim',async()=>{
 const w=worker();assert.ok(w.lifetimes.length,'background refresh must be registered synchronously');assert.equal(await w.response,w.old);
 let settled=false;Promise.all(w.lifetimes).then(()=>settled=true);
 assert.equal(settled,false);w.network.resolve(w.fresh);await flush();assert.equal(w.putStarted,true);assert.equal(settled,false);
 w.write.resolve();await flush();assert.equal(w.trimStarted,true);assert.equal(settled,false);
 w.trim.resolve([]);await Promise.all(w.lifetimes);await flush();assert.equal(settled,true);assert.equal(w.fetches,1);
});
test('fresh response is independent of a pending cache write and offline navigation retains fallback',async()=>{
 const w=worker({cached:false,mode:'navigate'});w.network.resolve(w.fresh);
 assert.equal(await w.response,w.fresh);await flush();assert.equal(w.putStarted,true);
 w.write.reject(Error('quota'));await Promise.all(w.lifetimes);
 const offline=worker({mode:'navigate'});offline.network.reject(Error('offline'));assert.equal(await offline.response,offline.old);await Promise.all(offline.lifetimes);
});
test('background network failure preserves cached asset without an unhandled lifetime rejection',async()=>{
 const w=worker();assert.equal(await w.response,w.old);w.network.reject(Error('offline'));await Promise.all(w.lifetimes);
});
test('external and non-GET requests stay outside the game cache',async()=>{
 for(const options of [{url:'https://other.test/file'},{method:'POST'}]){const w=worker(options);await flush();assert.equal(w.response,undefined);assert.equal(w.lifetimes.length,0);assert.equal(w.fetches,0);}
});

/** Cache API adapter for production-worker tests. Replacements move to the end, as Cache.put does. */
function cacheFixture(options: { failOpen?: boolean; failMatch?: boolean; failKeys?: boolean; failAsset?: string; shell?: string; status?: number; scope?: string; installAssets?: string[] } = {}) {
  const scope = options.scope ?? 'https://game.test/';
  const handlers: Record<string, Function> = {};
  const entries = new Map<string, Response>();
  const names = new Set(['almo7areboon-runtime-v1', 'other-game-v1', 'almo7areboon-runtime-v99']);
  let claimed = false, skipped = false, fetches = 0;
  const href = (request: string | { url: string }) => new URL(typeof request === 'string' ? request : request.url, scope).href;
  const basic = (body: string, status = 200) => {
    const response = new Response(body, { status, headers: { 'Content-Type': 'text/html' } });
    Object.defineProperty(response, 'type', { value: 'basic' });
    return response;
  };
  const cache = {
    async match(request: string | { url: string }, query: { ignoreSearch?: boolean } = {}) {
      if (options.failMatch) throw Error('cache read unavailable');
      const target = new URL(href(request));
      if (query.ignoreSearch) target.search = '';
      for (const [key, value] of entries) {
        const candidate = new URL(key);
        if (query.ignoreSearch) candidate.search = '';
        if (candidate.href === target.href) return value.clone();
      }
      return undefined;
    },
    async put(request: string | { url: string }, response: Response) {
      const key = href(request);
      entries.delete(key);
      entries.set(key, response.clone());
    },
    async keys() { return [...entries.keys()].map(url => ({ url })); },
    async delete(request: string | { url: string }) { return entries.delete(href(request)); },
    async add(request: string | { url: string }) { if(href(request).includes(options.failAsset ?? '\0'))throw Error('asset unavailable');await this.put(request, basic('asset')); },
  };
  const fresh = () => basic('network response', options.status ?? 200);
  runInNewContext(options.installAssets ? source.replace(/const INSTALL_ASSETS = \[\];/, `const INSTALL_ASSETS = ${JSON.stringify(options.installAssets)};`) + (source.includes("const INSTALL_ASSETS") ? "" : `\nconst INSTALL_ASSETS = ${JSON.stringify(options.installAssets)};`) : source, {
    URL, Response,
    caches: {
      async open() { if (options.failOpen) throw Error('cache unavailable'); return cache; },
      async keys() { if (options.failKeys) throw Error('cache listing unavailable'); return [...names]; },
      async delete(name: string) { return names.delete(name); },
    },
    fetch: async (request: string | { url: string }) => { fetches++;if(href(request).includes(options.failAsset ?? '\0'))throw Error('asset unavailable');return href(request)===scope&&options.shell!==undefined?basic(options.shell):fresh(); },
    self: {
      location: { origin: new URL(scope).origin }, registration: { scope },
      clients: { async claim() { claimed = true; } }, skipWaiting: async () => { skipped = true; },
      addEventListener: (name: string, handler: Function) => { handlers[name] = handler; },
    },
  });
  return {
    cache, entries, names, basic, get claimed() { return claimed; }, get skipped() { return skipped; }, get fetches() { return fetches; },
    async request(path = scope, mode = 'navigate') {
      let response: Promise<Response> | undefined;
      const lifetimes: Promise<unknown>[] = [];
      handlers.fetch({
        request: { url: href(path), method: 'GET', mode },
        respondWith: (value: Promise<Response>) => { response = value; },
        waitUntil: (value: Promise<unknown>) => { lifetimes.push(value); },
      });
      try { return await response; }
      finally { await Promise.all(lifetimes); }
    },
    async activate() {
      const lifetimes: Promise<unknown>[] = [];
      handlers.activate({ waitUntil: (value: Promise<unknown>) => { lifetimes.push(value); } });
      await Promise.all(lifetimes);
    },
    async install() {
      const lifetimes: Promise<unknown>[] = [];
      handlers.install({ waitUntil: (value: Promise<unknown>) => { lifetimes.push(value); } });
      await Promise.all(lifetimes);
    },
  };
}

test('a failed install asset keeps the last complete offline shell and does not activate',async()=>{
 const fixture=cacheFixture({shell:'<script src="./assets/new.js"></script>',failAsset:'/assets/new.js'});
 await fixture.cache.put('./',fixture.basic('<script src="./assets/old.js"></script>'));
 await fixture.cache.put('./assets/old.js',fixture.basic('old bundle'));
 await assert.rejects(fixture.install(),/asset unavailable/);
 assert.equal(fixture.skipped,false);
 assert.match(await (await fixture.cache.match('./'))!.text(),/old\.js/);
 assert.equal(await fixture.cache.match('./assets/new.js'),undefined);
});

test('a failed navigation refresh cannot replace the last complete offline shell',async()=>{
 const fixture=cacheFixture({shell:'<script src="./assets/new.js"></script>',failAsset:'/assets/new.js'});
 await fixture.cache.put('./',fixture.basic('<script src="./assets/old.js"></script>'));
 await fixture.cache.put('./assets/old.js',fixture.basic('old bundle'));
 assert.match(await (await fixture.request())!.text(),/new\.js/,'healthy navigation remains immediate');
 assert.match(await (await fixture.cache.match('./'))!.text(),/old\.js/,'failed background refresh must retain the bootable shell');
 assert.ok(await fixture.cache.match('./assets/old.js'));
 assert.equal(await fixture.cache.match('./assets/new.js'),undefined);
});

test('a non-entry navigation cannot replace the cached game shell',async()=>{
 const fixture=cacheFixture();
 await fixture.cache.put('./',fixture.basic('<script src="./assets/game.js"></script>'));
 await fixture.request('https://game.test/icon.svg','navigate');
 assert.match(await (await fixture.cache.match('./'))!.text(),/game\.js/);
 assert.equal(await (await fixture.cache.match('./icon.svg'))!.text(),'network response');
});

test('an unchanged content-hashed shell reuses its complete cached bundle',async()=>{
 const shell='<script src="./assets/game-AB12cd34.js"></script>';
 const fixture=cacheFixture({shell});
 await fixture.cache.put('./',fixture.basic(shell));
 await fixture.cache.put('./assets/game-AB12cd34.js',fixture.basic('hashed bundle'));
 await fixture.request();
 assert.equal(fixture.fetches,1,'the navigation should not re-download an immutable cached bundle');
});

test('installation validates every shell dependency instead of trusting an older cache entry',async()=>{
 const shell='<script src="./assets/game-AB12cd34.js"></script>';
 const fixture=cacheFixture({shell});
 await fixture.cache.put('./assets/game-AB12cd34.js',fixture.basic('older cached bundle'));
 await fixture.install();
 assert.equal(fixture.fetches,2,'install must fetch both the page and its declared bundle');
 assert.equal(fixture.skipped,true);
});

for (const mode of ['navigate', 'cors']) {
  for (const failure of ['failOpen', 'failMatch'] as const) {
    test(`${mode} still reaches the network when ${failure} is unavailable`, async () => {
      const fixture = cacheFixture({ [failure]: true });
      const response = await fixture.request('https://game.test/', mode);
      assert.equal(await response?.text(), 'network response');
      assert.equal(fixture.fetches, 1);
    });
  }
}

test('activation preserves caches belonging to other apps and newer game versions', async () => {
  const fixture = cacheFixture();
  const original = [...fixture.names];
  await fixture.activate();
  assert.deepEqual([...fixture.names], original);
  assert.equal(fixture.claimed, true);
});

test('unavailable cache listing does not prevent the worker from activating', async () => {
  const fixture = cacheFixture({ failKeys: true });
  await fixture.activate();
  assert.equal(fixture.claimed, true);
});

for (const status of [500, 502, 503, 504]) {
  test(`a temporary ${status} navigation uses the healthy offline page`, async () => {
    const fixture = cacheFixture({ status });
    await fixture.cache.put('./', fixture.basic('offline game'));
    const response = await fixture.request();
    assert.equal(response?.status, 200);
    assert.equal(await response?.text(), 'offline game');
    assert.equal(await (await fixture.cache.match('./'))?.text(), 'offline game', 'errors cannot replace the healthy page');
  });
}

test('missing fallback and non-transient HTTP errors preserve the original response', async () => {
  for (const status of [401, 403, 404, 503]) {
    const fixture = cacheFixture({ status });
    if (status !== 503) await fixture.cache.put('./', fixture.basic('offline game'));
    const response = await fixture.request();
    assert.equal(response?.status, status);
    assert.equal(await response?.text(), 'network response');
  }
});

test('bundle cleanup keeps the scripts and styles required by the cached game shell', async () => {
  const fixture = cacheFixture();
  const required = ['assets/index-current.js', 'assets/phaser-stable.js', 'assets/index-current.css'];
  await fixture.cache.put('./', fixture.basic(required.map(src => `<script src="./${src}"></script>`).join('')));
  for (const path of required) await fixture.cache.put(path, fixture.basic('current bundle'));
  // A still-open older tab can request assets from earlier deployments after this page was cached.
  for (let index = 0; index < 9; index++) await fixture.request(`assets/older-${index}.js`, 'cors');
  for (const path of required) assert.ok(await fixture.cache.match(path), `current shell dependency ${path} must survive`);
  assert.equal((await fixture.cache.keys()).filter(key => /\/assets\/.*\.(js|css)$/.test(key.url)).length, 6);
});

test('query-string visits update one canonical offline navigation instead of stranding the old shell', async () => {
  const fixture = cacheFixture();
  await fixture.cache.put('./', fixture.basic('old shell'));
  for (let index = 0; index < 8; index++) await fixture.request(`./?visit=${index}`);
  assert.equal(await (await fixture.cache.match('./'))?.text(), 'network response');
  assert.equal((await fixture.cache.keys()).length, 1, 'query visits must not grow independent page entries');
});

test('a scoped game worker leaves resources outside its directory to the browser', async () => {
  const fixture = cacheFixture({ scope: 'https://game.test/game/' });
  const response = await fixture.request('https://game.test/another-game/assets/app.js', 'cors');
  assert.equal(response, undefined);
  assert.equal(fixture.fetches, 0);
});

// Removing install-time artwork caching must make these fail even when the
// first page loaded its images before the service worker took control.
test('first installation retains artwork and the generated audio worker', async () => {
  const fixture = cacheFixture({ installAssets: ['./art/coin.webp', './assets/soundscape-worker-AB12cd34.js'] });
  await fixture.install();
  assert.ok(await fixture.cache.match('./art/coin.webp'), 'first-visit artwork must survive an offline reload');
  assert.ok(await fixture.cache.match('./assets/soundscape-worker-AB12cd34.js'));
  assert.equal(fixture.skipped, true);
});

test('an unavailable installation dependency retains the previous complete shell', async () => {
  const fixture = cacheFixture({ installAssets: ['./art/coin.webp'], failAsset: '/art/coin.webp' });
  await fixture.cache.put('./', fixture.basic('previous complete shell'));
  await assert.rejects(fixture.install(), /asset unavailable/);
  assert.equal(fixture.skipped, false);
  assert.equal(await (await fixture.cache.match('./'))!.text(), 'previous complete shell');
});

test('a cached content-hashed module makes no background network request',async()=>{
 const w=worker({url:'https://game.test/assets/phaser-AB12cd34.js'});
 assert.equal(await w.response,w.old);
 assert.equal(w.fetches,0,'immutable modules must not start offline network retries');
 await Promise.all(w.lifetimes);
});
