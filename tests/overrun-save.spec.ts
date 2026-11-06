import { describe, expect, it } from 'vitest';
import { createBrowserHomeStore } from '../src/game/home/browser-home-store.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave, OverrunRecord } from '../src/game/home/home-store.ts';

const HOME_KEY = 'outbreak.home';
const PROGRESS_KEY = 'outbreak.level-progress';
const PROGRESS = '{"highest":4,"finished":false}';

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

/** A save as it was written before the overrun: no records, no open overrun, no stall counts. */
function oldSave(): Record<string, unknown> {
  const { overruns: _records, openOverrun: _open, ...before } = { ...emptySave(7), version: 3, silver: 120 };
  return before;
}

const record: OverrunRecord = {
  outcome: 'fled', share: 0.5, highest: 4, difficulty: 'lights_out', kills: 9, merchantsLost: ['medic', 'powder'], silver: 0, at: 1000,
};

describe('a save from before the overrun', () => {
  it('loads unchanged, with no records, no open overrun and every stall open', async () => {
    const memory = memoryStore({ [HOME_KEY]: JSON.stringify(oldSave()), [PROGRESS_KEY]: PROGRESS });
    const loaded = await createBrowserHomeStore(memory).load();
    expect(loaded).toEqual({ ...oldSave(), overruns: [], openOverrun: null });
    for (const stock of Object.values(loaded.shop.merchants)) {
      expect(stock.closedTrips ?? 0).toBe(0);
      expect(stock.thinTrips ?? 0).toBe(0);
    }
  });

  it('leaves the level progress alone through a load and a save', async () => {
    const memory = memoryStore({ [HOME_KEY]: JSON.stringify(oldSave()), [PROGRESS_KEY]: PROGRESS });
    const store = createBrowserHomeStore(memory);
    const loaded = await store.load();
    expect(await store.save(loaded)).toEqual({ kind: 'saved', version: 4 });
    expect(memory.data.get(PROGRESS_KEY)).toBe(PROGRESS);
  });
});

describe('a save with the overrun in it', () => {
  const withOverrun = (patch: Partial<HomeSave> = {}): HomeSave => ({
    ...emptySave(7),
    overruns: [record],
    openOverrun: { simId: 'sim-a', mode: 'coop', startedAt: 2000 },
    ...patch,
  });

  it('reads back what it wrote', async () => {
    const memory = memoryStore();
    const store = createBrowserHomeStore(memory);
    const next = withOverrun();
    next.shop.merchants.medic = { items: {}, closedTrips: 3 };
    next.shop.merchants.powder = { items: {}, thinTrips: 2 };
    await store.save(next);
    expect(await store.load()).toEqual({ ...next, version: 1 });
  });

  it('drops a bad record alone, and a bad open overrun becomes none', async () => {
    const bad = { ...record, merchantsLost: ['the mayor'] };
    const raw = { ...withOverrun(), overruns: [record, bad, { ...record, outcome: 'won' }], openOverrun: { simId: 'sim-a', mode: 'party' } };
    const loaded = await createBrowserHomeStore(memoryStore({ [HOME_KEY]: JSON.stringify(raw) })).load();
    expect(loaded.overruns).toEqual([record]);
    expect(loaded.openOverrun).toBeNull();
  });

  it('refuses a stall count that is not a number, as any bad stock is', async () => {
    const raw = withOverrun();
    const broken = { ...raw, shop: { ...raw.shop, merchants: { ...raw.shop.merchants, medic: { items: {}, closedTrips: 'two' } } } };
    const loaded = await createBrowserHomeStore(memoryStore({ [HOME_KEY]: JSON.stringify(broken) })).load();
    expect(loaded.shop.merchants.medic.closedTrips).toBeUndefined();
    expect(loaded.shop.seed).not.toBe(raw.shop.seed);
  });
});
