import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { stampWorker } from '../tools/vite-pwa.ts';

const ORIGIN = 'https://undeadofnight.forthexp.com';
const SW_URL = `${ORIGIN}/sw.js`;
const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

type Listener = (event: unknown) => void;

class FakeCache {
  readonly entries = new Map<string, Response>();
  async match(request: Request | string, options: { ignoreSearch?: boolean } = {}): Promise<Response | undefined> {
    const wanted = typeof request === 'string' ? request : request.url;
    for (const [key, response] of this.entries) {
      const same = options.ignoreSearch ? key.split('?')[0] === wanted.split('?')[0] : key === wanted;
      if (same) return response.clone();
    }
    return undefined;
  }
  async put(request: Request | string, response: Response): Promise<void> {
    this.entries.set(typeof request === 'string' ? request : request.url, response);
  }
  async add(request: Request): Promise<void> {
    const response = await fakeFetch(request);
    if (!response.ok) throw new Error('precache failed');
    await this.put(request, response);
  }
  async keys(): Promise<Request[]> {
    return [...this.entries.keys()].map((url) => new Request(url));
  }
  async delete(request: Request | string): Promise<boolean> {
    return this.entries.delete(typeof request === 'string' ? request : request.url);
  }
}

let network: (request: Request) => Promise<Response>;
const fetched: string[] = [];
const signals: AbortSignal[] = [];
async function fakeFetch(request: Request | string, init: { signal?: AbortSignal } = {}): Promise<Response> {
  const asRequest = typeof request === 'string' ? new Request(request) : request;
  if (init.signal) signals.push(init.signal);
  fetched.push(`${asRequest.method} ${asRequest.url}${asRequest.headers.get('range') ? ` ${asRequest.headers.get('range')}` : ''}`);
  return network(asRequest);
}

function boot(files: string[] = ['assets/index-abc.js', 'favicon.svg'], buildId = 'b1', musicVersions: Record<string, string> = {}) {
  fetched.length = 0;
  signals.length = 0;
  const stores = new Map<string, FakeCache>();
  const listeners = new Map<string, Listener>();
  const state = { skipped: false, claimed: false };
  const caches = {
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new FakeCache());
      return stores.get(name) as FakeCache;
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name: string) {
      return stores.delete(name);
    },
    async match(request: Request | string, options: { cacheName?: string; ignoreSearch?: boolean } = {}) {
      const names = options.cacheName ? [options.cacheName] : [...stores.keys()];
      for (const name of names) {
        const hit = await stores.get(name)?.match(request, options);
        if (hit) return hit;
      }
      return undefined;
    },
  };
  const self = {
    location: new URL(SW_URL),
    addEventListener: (type: string, listener: Listener) => void listeners.set(type, listener),
    skipWaiting: () => void (state.skipped = true),
    clients: { claim: async () => void (state.claimed = true) },
  };
  const context = vm.createContext({ self, caches, fetch: fakeFetch, URL, Request, Response, Headers, Set, Promise, setTimeout, clearTimeout, Error, Math, Number, String, Array, AbortController });
  vm.runInContext(stampWorker(source, buildId, files, musicVersions), context);

  async function dispatch(type: string, event: Record<string, unknown> = {}): Promise<{ response: Promise<Response> | null; waits: Promise<unknown>[] }> {
    const waits: Promise<unknown>[] = [];
    let response: Promise<Response> | null = null;
    listeners.get(type)?.({
      ...event,
      waitUntil: (promise: Promise<unknown>) => void waits.push(promise),
      respondWith: (promise: Promise<Response>) => void (response = Promise.resolve(promise)),
    });
    return { response, waits };
  }

  async function get(url: string, init: RequestInit & { mode?: RequestMode } = {}) {
    const { mode, ...requestInit } = init;
    const request = new Request(url, requestInit);
    // Only the browser may build a navigate request, so the spec states the mode itself.
    Object.defineProperty(request, 'mode', { value: mode ?? 'cors' });
    const out = await dispatch('fetch', { request });
    return { ...out, settled: async () => Promise.all(out.waits) };
  }

  return { stores, state, dispatch, get, caches };
}

const body = (text: string, type = 'text/plain') => new Response(text, { headers: { 'Content-Type': type } });

describe('service worker', () => {
  it('precaches the stamped shell on install, fresh from the network', async () => {
    network = async (request) => body(request.url);
    const sw = boot(['assets/index-abc.js', 'favicon.svg']);
    const { waits } = await sw.dispatch('install');
    await Promise.all(waits);
    const shell = sw.stores.get('uon-shell-b1');
    expect([...(shell?.entries.keys() ?? [])].sort()).toEqual([`${ORIGIN}/`, `${ORIGIN}/assets/index-abc.js`, `${ORIGIN}/favicon.svg`].sort());
  });

  it('does not take over a waiting page until told to, and then does', async () => {
    const sw = boot();
    await sw.dispatch('message', { data: { type: 'something else' } });
    expect(sw.state.skipped).toBe(false);
    await sw.dispatch('message', { data: { type: 'SKIP_WAITING' } });
    expect(sw.state.skipped).toBe(true);
  });

  it('removes caches of old builds and keeps the shell and the music', async () => {
    const sw = boot([], 'b2');
    await sw.caches.open('uon-shell-b1');
    await sw.caches.open('uon-shell-b2');
    await sw.caches.open('uon-music-v1');
    await sw.caches.open('something-old');
    const { waits } = await sw.dispatch('activate');
    await Promise.all(waits);
    expect([...sw.stores.keys()].sort()).toEqual(['uon-music-v1', 'uon-shell-b2']);
    expect(sw.state.claimed).toBe(true);
  });

  it('answers a page navigation from the network, and from the cached page when offline', async () => {
    const sw = boot();
    network = async () => body('<html>fresh</html>', 'text/html');
    const online = await sw.get(`${ORIGIN}/?join=10.0.0.5:9000`, { mode: 'navigate' });
    expect(await (await online.response)?.text()).toBe('<html>fresh</html>');
    expect([...(sw.stores.get('uon-shell-b1')?.entries.keys() ?? [])]).toEqual([`${ORIGIN}/`]);
    network = async () => {
      throw new TypeError('offline');
    };
    const offline = await sw.get(`${ORIGIN}/?join=10.0.0.5:9000`, { mode: 'navigate' });
    expect(await (await offline.response)?.text()).toBe('<html>fresh</html>');
  });

  it('serves a hashed asset from the cache without asking the network', async () => {
    const sw = boot();
    await (await sw.caches.open('uon-shell-b1')).put(`${ORIGIN}/assets/index-abc.js`, body('cached js'));
    network = async () => body('network js');
    const hit = await sw.get(`${ORIGIN}/assets/index-abc.js`);
    expect(await (await hit.response)?.text()).toBe('cached js');
    expect(fetched).toEqual([]);
  });

  it('fetches and keeps a hashed asset it does not have yet', async () => {
    const sw = boot();
    network = async () => body('new js');
    const miss = await sw.get(`${ORIGIN}/assets/chunk-def.js`);
    expect(await (await miss.response)?.text()).toBe('new js');
    expect(sw.stores.get('uon-shell-b1')?.entries.has(`${ORIGIN}/assets/chunk-def.js`)).toBe(true);
  });

  it('leaves other origins, other methods and co-op traffic alone', async () => {
    const sw = boot();
    for (const [url, init] of [
      ['https://www.googletagmanager.com/gtag/js?id=G-X', {}],
      ['https://region1.google-analytics.com/g/collect', { method: 'POST', body: 'x' }],
      [`${ORIGIN}/assets/index-abc.js`, { method: 'POST', body: 'x' }],
      ['http://10.0.0.5:9000/status', {}],
    ] as const) {
      const out = await sw.get(url, init);
      expect(out.response).toBeNull();
    }
  });

  it('does not add a shell copy for every query a same-origin request comes with', async () => {
    const sw = boot();
    network = async () => body('icon');
    for (const version of ['1', '2', '3']) await (await sw.get(`${ORIGIN}/favicon.svg?v=${version}`)).response;
    await (await sw.get(`${ORIGIN}/assets/chunk-q.js?t=1`)).response;
    await (await sw.get(`${ORIGIN}/assets/chunk-q.js?t=2`)).response;
    const kept = [...(sw.stores.get('uon-shell-b1')?.entries.keys() ?? [])];
    expect(kept).toEqual([]);
    await (await sw.get(`${ORIGIN}/favicon.svg`)).response;
    expect([...(sw.stores.get('uon-shell-b1')?.entries.keys() ?? [])]).toEqual([`${ORIGIN}/favicon.svg`]);
  });

  describe('music', () => {
    const TRACK = `${ORIGIN}/music/escalation.mp3`;
    const bytes = Buffer.from('0123456789');

    function trackNetwork(): void {
      network = async (request) => {
        const range = request.headers.get('range');
        const wholeFile = !range || range === 'bytes=0-';
        const headers = { 'Content-Type': 'audio/mpeg', 'Content-Length': String(bytes.length) };
        if (wholeFile && !range) return new Response(bytes, { status: 200, headers });
        return new Response(bytes, { status: 206, headers: { ...headers, 'Content-Range': `bytes 0-${bytes.length - 1}/${bytes.length}` } });
      };
    }

    it('keeps a track the first time it plays, taking the whole file from a bytes=0- request', async () => {
      const sw = boot();
      trackNetwork();
      const first = await sw.get(TRACK, { headers: { Range: 'bytes=0-' } });
      expect((await first.response)?.status).toBe(206);
      await first.settled();
      const kept = await sw.stores.get('uon-music-v1')?.match(TRACK);
      expect(kept?.status).toBe(200);
      expect(Buffer.from((await kept?.arrayBuffer()) ?? new ArrayBuffer(0)).toString()).toBe('0123456789');
      expect(fetched).toEqual([`GET ${TRACK} bytes=0-`]);
    });

    it('answers a range from the kept track with a correct 206', async () => {
      const sw = boot();
      await (await sw.caches.open('uon-music-v1')).put(TRACK, new Response(bytes, { headers: { 'Content-Type': 'audio/mpeg' } }));
      network = async () => {
        throw new TypeError('offline');
      };
      const middle = await (await sw.get(TRACK, { headers: { Range: 'bytes=2-5' } })).response;
      expect(middle?.status).toBe(206);
      expect(middle?.headers.get('Content-Range')).toBe('bytes 2-5/10');
      expect(await middle?.text()).toBe('2345');
      const tail = await (await sw.get(TRACK, { headers: { Range: 'bytes=7-' } })).response;
      expect(await tail?.text()).toBe('789');
      expect(tail?.headers.get('Content-Range')).toBe('bytes 7-9/10');
      const last = await (await sw.get(TRACK, { headers: { Range: 'bytes=-3' } })).response;
      expect(await last?.text()).toBe('789');
      const whole = await (await sw.get(TRACK)).response;
      expect(whole?.status).toBe(200);
      expect(await whole?.text()).toBe('0123456789');
      const past = await (await sw.get(TRACK, { headers: { Range: 'bytes=40-50' } })).response;
      expect(past?.status).toBe(416);
    });

    it('answers a multi-range request from a kept track instead of failing', async () => {
      const sw = boot();
      await (await sw.caches.open('uon-music-v1')).put(TRACK, new Response(bytes, { headers: { 'Content-Type': 'audio/mpeg' } }));
      network = async () => {
        throw new TypeError('offline');
      };
      const out = await (await sw.get(TRACK, { headers: { Range: 'bytes=0-1,4-5' } })).response;
      expect(out?.status).toBe(200);
      expect(await out?.text()).toBe('0123456789');
    });

    it('keeps no more than twelve tracks when many first plays run at once', async () => {
      const sw = boot();
      trackNetwork();
      const plays = await Promise.all(Array.from({ length: 16 }, (_, i) => sw.get(`${ORIGIN}/music/c${i}.mp3`)));
      await Promise.all(plays.map((play) => play.response));
      await Promise.all(plays.map((play) => play.settled()));
      expect(sw.stores.get('uon-music-v1')?.entries.size).toBe(12);
    });

    it('lets go of a track still streaming from the network when the page says an update is about to take over', async () => {
      const sw = boot();
      trackNetwork();
      const playing = await sw.get(TRACK, { headers: { Range: 'bytes=0-' } });
      await playing.response;
      expect(signals.length).toBeGreaterThan(0);
      expect(signals.some((signal) => signal.aborted)).toBe(false);
      await sw.dispatch('message', { data: { type: 'RELEASE_MUSIC' } });
      expect(signals.every((signal) => signal.aborted)).toBe(true);
      expect(sw.state.skipped).toBe(false);
    });

    it('keeps an unchanged track across builds and fetches a replaced one again', async () => {
      const listed = (hash: string) => ({ 'music/escalation.mp3': hash, 'music/calm.mp3': 'same' });
      const first = boot([], 'b1', listed('v1'));
      trackNetwork();
      for (const name of ['escalation', 'calm']) {
        const out = await first.get(`${ORIGIN}/music/${name}.mp3`);
        await out.response;
        await out.settled();
      }
      const kept = first.stores.get('uon-music-v1');
      expect([...(kept?.entries.keys() ?? [])].sort()).toEqual([`${ORIGIN}/music/calm.mp3?v=same`, `${ORIGIN}/music/escalation.mp3?v=v1`]);

      const second = boot([], 'b2', listed('v2'));
      for (const [key, response] of kept?.entries ?? []) await (await second.caches.open('uon-music-v1')).put(key, response);
      const { waits } = await second.dispatch('activate');
      await Promise.all(waits);
      const after = second.stores.get('uon-music-v1');
      expect([...(after?.entries.keys() ?? [])]).toEqual([`${ORIGIN}/music/calm.mp3?v=same`]);

      fetched.length = 0;
      const calm = await second.get(`${ORIGIN}/music/calm.mp3`, { headers: { Range: 'bytes=0-1' } });
      expect((await calm.response)?.status).toBe(206);
      expect(fetched).toEqual([]);
      const replaced = await second.get(`${ORIGIN}/music/escalation.mp3`, { headers: { Range: 'bytes=0-' } });
      await replaced.response;
      await replaced.settled();
      expect([...(after?.entries.keys() ?? [])].sort()).toEqual([`${ORIGIN}/music/calm.mp3?v=same`, `${ORIGIN}/music/escalation.mp3?v=v2`]);
    });

    it('lets a track that was never kept fail offline, so the game goes quiet', async () => {
      const sw = boot();
      network = async () => {
        throw new TypeError('offline');
      };
      const out = await sw.get(TRACK, { headers: { Range: 'bytes=0-' } });
      await expect(out.response).rejects.toBeInstanceOf(TypeError);
    });

    it('does not keep a failed response', async () => {
      const sw = boot();
      network = async () => new Response('nope', { status: 404 });
      const out = await sw.get(TRACK);
      expect((await out.response)?.status).toBe(404);
      await out.settled();
      expect(sw.stores.get('uon-music-v1')?.entries.size ?? 0).toBe(0);
    });

    it('fetches the whole file in the background when the first request was only a slice', async () => {
      const sw = boot();
      network = async (request) => {
        const range = request.headers.get('range');
        if (range) return new Response(bytes.subarray(4, 8), { status: 206, headers: { 'Content-Range': 'bytes 4-7/10' } });
        return new Response(bytes, { status: 200 });
      };
      const out = await sw.get(TRACK, { headers: { Range: 'bytes=4-7' } });
      await out.response;
      await out.settled();
      expect(fetched).toEqual([`GET ${TRACK} bytes=4-7`, `GET ${TRACK}`]);
      expect((await sw.stores.get('uon-music-v1')?.match(TRACK))?.status).toBe(200);
    });

    it('keeps at most twelve tracks, dropping the oldest', async () => {
      const sw = boot();
      trackNetwork();
      for (let i = 0; i < 14; i += 1) {
        const out = await sw.get(`${ORIGIN}/music/t${i}.mp3`);
        await out.response;
        await out.settled();
      }
      const urls = [...(sw.stores.get('uon-music-v1')?.entries.keys() ?? [])];
      expect(urls).toHaveLength(12);
      expect(urls).not.toContain(`${ORIGIN}/music/t0.mp3`);
      expect(urls).toContain(`${ORIGIN}/music/t13.mp3`);
    });
  });
});
