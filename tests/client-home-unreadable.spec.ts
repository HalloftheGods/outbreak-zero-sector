import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Loadout } from '../shared/home-protocol.ts';
import { emptyLoadout } from '../shared/loadout.ts';
import { GameController } from '../src/game/game-controller.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave, HomeStore, OpenTrip } from '../src/game/home/home-store.ts';
import { fakeCanvas, installFakeBrowser } from './client-fake-dom.ts';
import type { FakeBrowser } from './client-fake-dom.ts';

const FRAME_MS = 1000 / 60;
const GEAR: Loadout = { ...emptyLoadout(), guns: { pistol: {} }, ammoBag: { pistol: 30, carbine: 0, shotgun: 0 }, medkits: 2 };
/** Out with friends, and for all this tab knows still out. Only a Campaign run may settle it. */
const STILL_OUT: OpenTrip = { level: 3, mode: 'coop', difficulty: 'stay_close', startedAt: 1 };

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

interface FlakyStore extends HomeStore {
  readonly slot: () => HomeSave;
  readonly writes: () => number;
}

/** A save whose first read fails, and which counts every write after that. */
function flakyStore(initial: Partial<HomeSave>): FlakyStore {
  let slot: HomeSave = { ...emptySave(7), ...initial };
  let reads = 0;
  let writes = 0;
  return {
    slot: () => slot,
    writes: () => writes,
    async load() {
      reads += 1;
      if (reads === 1) throw new Error('the disk is having a moment');
      return slot;
    },
    async save(next) {
      writes += 1;
      const version = next.version + 1;
      slot = { ...next, version };
      return { kind: 'saved', version };
    },
  };
}

describe('a Campaign save that cannot be read', () => {
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

  it('says so, and the Arcade run after it leaves the save alone', async () => {
    const store = flakyStore({ hands: GEAR, openTrip: STILL_OUT });
    game = new GameController({ homeStore: () => store });
    game.mount(fakeCanvas() as unknown as HTMLCanvasElement);
    await pump(100);

    game.startSolo('campaign');
    await pump(300);
    expect(game.ui.value.error).toBe('The game could not open your saved home.');
    expect(game.ui.value.screen).toBe('title');

    game.startSolo('arcade');
    await pump(300);
    expect(game.ui.value.screen).toBe('game');
    expect(game.ui.value.runStyle).toBe('arcade');
    expect(store.writes()).toBe(0);
    expect(store.slot().hands).toEqual(GEAR);
    expect(store.slot().openTrip).toEqual(STILL_OUT);
  });
});
