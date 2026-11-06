import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Loadout, OverrunReceipt } from '../shared/home-protocol.ts';
import { emptyLoadout } from '../shared/loadout.ts';
import type { PlayerHome, SimState } from '../shared/sim-state.ts';
import type { GameSimulation } from '../shared/simulation.ts';
import { GameController } from '../src/game/game-controller.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave, HomeStore } from '../src/game/home/home-store.ts';
import { fakeCanvas, installFakeBrowser } from './client-fake-dom.ts';
import type { FakeBrowser } from './client-fake-dom.ts';
import { driveToTown, playerNamed } from './helpers/home-harness.ts';
import { stateOf } from './helpers/sim-harness.ts';

const FRAME_MS = 1000 / 60;
const LOCAL = 'local';
const CARBINE: Loadout = { ...emptyLoadout(), guns: { carbine: {} } };

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

/** One slot, as one tab sees one localStorage. */
function memoryStore(initial: Partial<HomeSave> = {}): HomeStore {
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

const diedReceipt = (state: SimState, lost: Loadout): OverrunReceipt => ({
  simId: state.homeRun?.simId ?? '', serial: 900, outcome: 'died', share: 0, chest: null, silver: 0, jewels: { small: 0, large: 0 }, lost, kills: 3, seconds: 20,
});
const homeOf = (state: SimState): PlayerHome => playerNamed(state, LOCAL).home as PlayerHome;

describe('an overrun death and the town', () => {
  let browser: FakeBrowser;
  let game: GameController;
  let clock = 0;

  /** Frames and timers, with the save's promises settling between them. */
  async function pump(ms: number): Promise<void> {
    for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
      await vi.advanceTimersByTimeAsync(FRAME_MS);
      clock += FRAME_MS;
      browser.runFrame(clock);
    }
  }

  async function startHome(save: Partial<HomeSave> = {}): Promise<{ sim: GameSimulation; state: SimState }> {
    game = new GameController({ homeStore: () => memoryStore(save) });
    game.mount(fakeCanvas() as unknown as HTMLCanvasElement);
    await pump(100);
    game.startSolo('campaign');
    await pump(300);
    const sim = game.sim as GameSimulation;
    return { sim, state: stateOf(sim) };
  }

  function press(code: string): void {
    browser.dispatch('keydown', { code, repeat: false, target: null, preventDefault() {} });
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

  it('a body written off as the van left lands in town: the death is saved and recorded without a summary, and the keys are free', async () => {
    const { sim, state } = await startHome({ hands: CARBINE });
    driveToTown(sim, state, 1);
    await pump(400);
    homeOf(state).overrun = diedReceipt(state, CARBINE);
    await pump(300);
    const { home } = game.ui.value;
    expect(home?.inBunker).toBe(false);
    expect(home?.death).toBeNull();
    expect(home?.save?.overruns).toHaveLength(1);
    expect(home?.save?.overruns[0]).toMatchObject({ outcome: 'died', kills: 3 });
    expect(home?.save?.appliedReceipts).toContain(`${state.homeRun?.simId}:900`);
    press('KeyD');
    expect(game.input.dirX).toBe(1);
  });

  it('a fall summary still up when the van leaves is put away, so it never reads over the town', async () => {
    const { sim, state } = await startHome();
    homeOf(state).overrun = diedReceipt(state, { ...emptyLoadout(), medkits: 1 });
    await pump(300);
    expect(game.ui.value.home?.death?.overrun).toBeDefined();
    driveToTown(sim, state, 1);
    await pump(400);
    expect(game.ui.value.home?.inBunker).toBe(false);
    expect(game.ui.value.home?.death).toBeNull();
    expect(game.ui.value.home?.save?.overruns).toHaveLength(1);
    press('KeyD');
    expect(game.input.dirX).toBe(1);
  });
});
