import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Loadout } from '../shared/home-protocol.ts';
import { emptyLoadout } from '../shared/loadout.ts';
import { GameController } from '../src/game/game-controller.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave, HomeStore } from '../src/game/home/home-store.ts';
import { fakeCanvas, installFakeBrowser } from './client-fake-dom.ts';
import type { FakeBrowser } from './client-fake-dom.ts';
import { playerNamed, standAtVan } from './helpers/home-harness.ts';
import { stateOf } from './helpers/sim-harness.ts';

const FRAME_MS = 1000 / 60;
const LOCAL = 'local';
const GEAR: Loadout = { ...emptyLoadout(), guns: { pistol: {} }, ammoBag: { pistol: 30, carbine: 0, shotgun: 0 }, medkits: 2 };

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

/** One slot that outlives the controller's runs, as one browser's localStorage does. */
function sharedStore(initial: Partial<HomeSave>): HomeStore {
  let slot: HomeSave = { ...emptySave(7), ...initial };
  return {
    load: async () => slot,
    async save(next) {
      const stale = next.version !== slot.version;
      if (stale) return { kind: 'conflict' };
      const version = next.version + 1;
      slot = { ...next, version };
      return { kind: 'saved', version };
    },
  };
}

describe('quitting from the van before it leaves', () => {
  let browser: FakeBrowser;
  let game: GameController;
  let clock = 0;

  async function pump(ms: number): Promise<void> {
    for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
      await vi.advanceTimersByTimeAsync(FRAME_MS);
      clock += FRAME_MS;
      browser.runFrame(clock);
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
    browser = installFakeBrowser();
    vi.stubGlobal('localStorage', memoryStorage());
    clock = 0;
  });

  afterEach(() => {
    game?.dispose();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is not a death: no trip was made, so the gear in hand is still in hand on the next Campaign run', async () => {
    const store = sharedStore({ hands: GEAR });
    game = new GameController({ homeStore: () => store });
    game.mount(fakeCanvas() as unknown as HTMLCanvasElement);
    await pump(100);
    game.startSolo('campaign');
    await pump(300);
    const sim = game.sim as NonNullable<typeof game.sim>;
    const state = stateOf(sim);
    const me = playerNamed(state, LOCAL);
    game.home.pickLevel(1);
    standAtVan(state, me);
    await pump(500);
    expect(me.home?.ready).toBe(true);
    expect((await store.load()).openTrip).not.toBeNull();

    game.toMenu();
    await pump(100);
    expect((await store.load()).openTrip).toBeNull();

    game.startSolo('arcade');
    await pump(300);
    game.toMenu();
    game.startSolo('campaign');
    await pump(300);
    const after = await store.load();
    expect(after.ledger).toEqual([]);
    expect(after.hands).toEqual(GEAR);
    expect(game.ui.value.home?.inBunker).toBe(true);
  });
});
