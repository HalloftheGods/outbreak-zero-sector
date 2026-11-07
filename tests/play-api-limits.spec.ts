import { describe, expect, it } from 'vitest';
import { ipKey, LIMITS, newSalt, RateLimiter, saltDay } from '../play-api/src/limits.ts';
import { dropPort53, iceServersFor, STUN_SERVER, type TurnEnv } from '../play-api/src/turn.ts';

const MINUTE = 60_000;

describe('RateLimiter', () => {
  it('allows up to the limit in a window, then refuses until it slides', () => {
    const limiter = new RateLimiter();
    const { limit } = LIMITS.connect[0];
    for (let i = 0; i < limit; i += 1) expect(limiter.take('a', 'connect', 1000)).toBe(true);
    expect(limiter.take('a', 'connect', 1000)).toBe(false);
    expect(limiter.take('b', 'connect', 1000)).toBe(true);
    expect(limiter.take('a', 'connect', 1000 + MINUTE + 1)).toBe(true);
  });

  it('checks every window: lookups stop at 100 an hour even when each minute is under 20', () => {
    const limiter = new RateLimiter();
    let now = 0;
    for (let i = 0; i < 100; i += 1) {
      if (i % 19 === 0) now += MINUTE + 1;
      expect(limiter.take('a', 'lookup', now)).toBe(true);
    }
    expect(limiter.take('a', 'lookup', now + MINUTE + 1)).toBe(false);
  });

  it('charges a miss after the fact and sweeps keys with nothing left', () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 10; i += 1) {
      limiter.take('a', 'lookup', 0);
      limiter.charge('a', 'lookup', 0);
    }
    expect(limiter.take('a', 'lookup', 0)).toBe(false);
    limiter.sweep(2 * 60 * MINUTE);
    expect(limiter.size).toBe(0);
  });
});

describe('ipKey', () => {
  it('is stable under one salt, differs across salts, and never contains the IP', async () => {
    const [one, two] = [await newSalt(), await newSalt()];
    const key = await ipKey(one, '203.0.113.9');
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    expect(await ipKey(one, '203.0.113.9')).toBe(key);
    expect(await ipKey(two, '203.0.113.9')).not.toBe(key);
    expect(saltDay(0)).not.toBe(saltDay(24 * 60 * MINUTE));
  });
});

describe('TURN', () => {
  const env = (over: Partial<TurnEnv> = {}): TurnEnv => ({ TURN_ENABLED: '1', TURN_KEY_ID: 'id', TURN_KEY_API_TOKEN: 'token', ...over });

  it('drops port 53 URLs and keeps 5349', () => {
    expect(
      dropPort53([
        { urls: ['turn:turn.cloudflare.com:53?transport=udp', 'turns:turn.cloudflare.com:5349?transport=tcp'], username: 'u', credential: 'c' },
        { urls: 'stun:stun.cloudflare.com:53' },
      ]),
    ).toEqual([{ urls: ['turns:turn.cloudflare.com:5349?transport=tcp'], username: 'u', credential: 'c' }]);
  });

  it('gives STUN only when switched off, unconfigured or failing', async () => {
    const never = (() => Promise.reject(new Error('no'))) as unknown as typeof fetch;
    expect(await iceServersFor(env({ TURN_ENABLED: '0' }), never)).toEqual([STUN_SERVER]);
    expect(await iceServersFor(env({ TURN_KEY_ID: undefined }), never)).toEqual([STUN_SERVER]);
    expect(await iceServersFor(env(), never)).toEqual([STUN_SERVER]);
  });

  it('mints with a bearer token and a 6 h ttl', async () => {
    let seen: { url: string; init?: RequestInit } | null = null;
    const fake = (async (url: string, init?: RequestInit) => {
      seen = { url, init };
      return Response.json({ iceServers: [{ urls: ['stun:stun.cloudflare.com:3478', 'turn:turn.cloudflare.com:53'] }] });
    }) as unknown as typeof fetch;
    expect(await iceServersFor(env(), fake)).toEqual([{ urls: ['stun:stun.cloudflare.com:3478'] }]);
    expect(seen!.url).toContain('/turn/keys/id/credentials/generate-ice-servers');
    expect((seen!.init?.headers as Record<string, string>).Authorization).toBe('Bearer token');
    expect(JSON.parse(String(seen!.init?.body))).toEqual({ ttl: 21600 });
  });
});
