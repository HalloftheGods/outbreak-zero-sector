import { describe, expect, it } from 'vitest';
import { analyticsCookieNames, clearAnalyticsCookies, cookieDomains } from '../src/game/analytics/cookies.ts';
import { createConsent, loadConsent } from '../src/game/analytics/consent.ts';

function memoryStore(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('analytics consent', () => {
  it('is on by default, with no prompt to answer', () => {
    const consent = createConsent({ store: memoryStore(), optedOut: false });
    expect(consent.status.value).toBe('unset');
    expect(consent.allowed()).toBe(true);
    expect('prompting' in consent).toBe(false);
  });

  it('keeps a saved off off', () => {
    const store = memoryStore({ 'outbreak.analytics-consent': 'denied' });
    const consent = createConsent({ store, optedOut: false });
    expect(consent.status.value).toBe('denied');
    expect(consent.allowed()).toBe(false);
  });

  it('loads an old save that has never heard of analytics as on', () => {
    const store = memoryStore({ 'outbreak.prefs': '{"callsign":"ZED","serverAddress":""}' });
    expect(loadConsent(store)).toBe('unset');
  });

  it('keeps yes and no per browser, and says so to anyone listening', () => {
    const store = memoryStore();
    const consent = createConsent({ store, optedOut: false });
    const heard: string[] = [];
    consent.subscribe((status) => heard.push(status));
    consent.grant();
    expect(consent.allowed()).toBe(true);
    expect(createConsent({ store, optedOut: false }).allowed()).toBe(true);
    consent.deny();
    expect(consent.allowed()).toBe(false);
    expect(createConsent({ store, optedOut: false }).allowed()).toBe(false);
    expect(heard).toEqual(['granted', 'denied']);
  });

  it('follows a choice made in another tab at once', () => {
    const store = memoryStore();
    const events = new EventTarget();
    const consent = createConsent({ store, optedOut: false, events });
    const heard: string[] = [];
    consent.subscribe((status) => heard.push(status));
    store.setItem('outbreak.analytics-consent', 'denied');
    events.dispatchEvent(Object.assign(new Event('storage'), { key: 'outbreak.analytics-consent' }));
    expect(consent.allowed()).toBe(false);
    events.dispatchEvent(Object.assign(new Event('storage'), { key: 'something-else' }));
    expect(heard).toEqual(['denied']);
  });

  it('treats Global Privacy Control as off, and turning it on changes nothing', () => {
    const store = memoryStore({ 'outbreak.analytics-consent': 'granted' });
    const consent = createConsent({ store, optedOut: true });
    expect(consent.allowed()).toBe(false);
    consent.grant();
    expect(consent.allowed()).toBe(false);
    expect(consent.status.value).toBe('denied');
  });

  it('survives a store that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const consent = createConsent({ store: broken, optedOut: false });
    expect(() => consent.grant()).not.toThrow();
    expect(consent.allowed()).toBe(true);
  });

  it('names the cookies and the domains to clear', () => {
    expect(analyticsCookieNames('G-6D3R9CK91X')).toEqual(['_ga', '_ga_6D3R9CK91X', '_gid', '_gat']);
    expect(cookieDomains('undeadofnight.forthexp.com')).toEqual(['undeadofnight.forthexp.com', 'forthexp.com']);
    const jar = { writes: [] as string[], set cookie(value: string) { this.writes.push(value); }, get cookie() { return ''; } };
    clearAnalyticsCookies(jar, 'forthexp.com', 'G-6D3R9CK91X');
    expect(jar.writes.some((each) => each.startsWith('_ga_6D3R9CK91X=;') && each.includes('1970'))).toBe(true);
  });
});
