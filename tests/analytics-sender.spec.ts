import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createConsent } from '../src/game/analytics/consent.ts';
import { createSender } from '../src/game/analytics/sender.ts';
import type { SenderPage } from '../src/game/analytics/sender.ts';

function fakePage(hostname = 'undeadofnight.forthexp.com', href = 'https://undeadofnight.forthexp.com/?join=10.0.0.5:9000') {
  const scripts: string[] = [];
  const cookieWrites: string[] = [];
  const page: SenderPage = {
    hostname,
    href,
    cookies: {
      get cookie() {
        return '';
      },
      set cookie(value: string) {
        cookieWrites.push(value);
      },
    },
    globals: {},
    addScript: (src) => void scripts.push(src),
  };
  return { page, scripts, cookieWrites };
}

function memoryStore() {
  const data: Record<string, string> = {};
  return { getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => void (data[key] = value) };
}

function setup(options: { hostname?: string; dev?: boolean; optedOut?: boolean } = {}) {
  const fake = fakePage(options.hostname);
  const consent = createConsent({ store: memoryStore(), optedOut: options.optedOut ?? false });
  const logs: unknown[][] = [];
  const sender = createSender({ consent, page: fake.page, dev: options.dev ?? false, log: (...args) => void logs.push(args) });
  const layer = () => (fake.page.globals.dataLayer ?? []) as ArrayLike<unknown>[];
  const sent = () => layer().map((each) => Array.from(each)).filter((each) => each[0] === 'event');
  return { ...fake, consent, sender, logs, layer, sent };
}

describe('analytics sender', () => {
  it('has no Google tag in index.html', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(html).not.toContain('googletagmanager');
    expect(html).not.toContain('gtag(');
  });

  it('sends by default, with no answer needed', () => {
    const { sender, scripts, sent } = setup();
    sender.track('title_view');
    expect(scripts).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-6D3R9CK91X']);
    expect(sent()).toEqual([['event', 'title_view', {}]]);
  });

  it('makes no request when a saved off is loaded', () => {
    const { page, scripts } = fakePage();
    const store = memoryStore();
    store.setItem('outbreak.analytics-consent', 'denied');
    const consent = createConsent({ store, optedOut: false });
    const sender = createSender({ consent, page, dev: false });
    sender.track('title_view');
    expect(scripts).toEqual([]);
    expect(page.globals.dataLayer).toBeUndefined();
  });

  it('loads the script once after a yes and then sends allowed events', () => {
    const { sender, consent, scripts, sent } = setup();
    consent.grant();
    sender.track('run_start', { mode: 'solo', callsign: 'ZED' });
    sender.track('title_view');
    expect(scripts).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-6D3R9CK91X']);
    expect(sent()).toEqual([
      ['event', 'run_start', { mode: 'solo' }],
      ['event', 'title_view', {}],
    ]);
  });

  it('configures Google with the page address stripped of its query and no ad features', () => {
    const { consent, layer } = setup();
    consent.grant();
    const config = layer().map((each) => Array.from(each)).find((each) => each[0] === 'config');
    expect(config?.[2]).toMatchObject({
      send_page_view: false,
      page_location: 'https://undeadofnight.forthexp.com/',
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  });

  it('withdrawing stops sending at once and clears the _ga cookies', () => {
    const { sender, consent, sent, cookieWrites, page } = setup();
    consent.grant();
    sender.track('title_view');
    consent.deny();
    sender.track('run_start', { mode: 'solo' });
    expect(sent()).toHaveLength(1);
    expect(page.globals['ga-disable-G-6D3R9CK91X']).toBe(true);
    expect(cookieWrites.some((each) => each.startsWith('_ga=;'))).toBe(true);
    consent.grant();
    expect(page.globals['ga-disable-G-6D3R9CK91X']).toBe(false);
  });

  it('never sends under Global Privacy Control', () => {
    const { sender, consent, scripts, layer } = setup({ optedOut: true });
    expect(consent.status.value).toBe('denied');
    consent.grant();
    sender.track('title_view');
    expect(scripts).toEqual([]);
    expect(layer()).toEqual([]);
  });

  it('never sends from localhost or 127.0.0.1', () => {
    for (const hostname of ['localhost', '127.0.0.1', 'dev.localhost']) {
      const { sender, consent, scripts, layer } = setup({ hostname });
      consent.grant();
      sender.track('title_view');
      expect(scripts).toEqual([]);
      expect(layer()).toEqual([]);
    }
  });

  it('in a dev build only logs what it would send', () => {
    const { sender, consent, scripts, logs } = setup({ dev: true });
    sender.track('title_view');
    expect(logs).toEqual([['[analytics] would send title_view', {}]]);
    logs.length = 0;
    consent.grant();
    sender.track('run_start', { mode: 'coop', callsign: 'ZED' });
    expect(scripts).toEqual([]);
    expect(logs).toEqual([['[analytics] would send run_start', { mode: 'coop' }]]);
  });

  it('stays silent when the script cannot be added', () => {
    const { page } = fakePage();
    const broken: SenderPage = {
      ...page,
      addScript: () => {
        throw new Error('blocked');
      },
    };
    const consent = createConsent({ store: memoryStore(), optedOut: false });
    const sender = createSender({ consent, page: broken, dev: false });
    expect(() => consent.grant()).not.toThrow();
    expect(() => sender.track('title_view')).not.toThrow();
  });

  it('drops an event that is not on the list', () => {
    const { sender, consent, sent } = setup();
    consent.grant();
    sender.track('typed_text', { text: 'hello' });
    expect(sent()).toEqual([]);
  });
});
