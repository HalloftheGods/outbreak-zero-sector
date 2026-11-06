import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUNKER_SEED, isBunkerSeed } from '../shared/home-protocol.ts';
import type { Loadout } from '../shared/home-protocol.ts';
import { FINAL_LEVEL } from '../shared/levels.ts';
import { emptyLoadout } from '../shared/loadout.ts';
import type { GameSimulation } from '../shared/simulation.ts';
import { WorldRenderer } from '../src/engine/world-renderer.ts';
import { GameController } from '../src/game/game-controller.ts';
import { homeLoopOn } from '../src/game/home-mode.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave, HomeStore } from '../src/game/home/home-store.ts';
import { hordeStatus } from '../src/game/hud-state.ts';
import { levelLine } from '../src/game/level-hud.ts';
import { loadLevelProgress } from '../src/game/level-progress.ts';
import { loadBest, loadLeaderboard } from '../src/game/storage.ts';
import { fakeCanvas, installFakeBrowser } from './client-fake-dom.ts';
import type { FakeBrowser } from './client-fake-dom.ts';
import { bankTrip, driveToTown, playerNamed, standAtStation, standAtVan } from './helpers/home-harness.ts';
import { stateOf } from './helpers/sim-harness.ts';

const FRAME_MS = 1000 / 60;
const LOCAL = 'local';

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
      if (next.version !== slot.version) return { kind: 'conflict' };
      const version = next.version + 1;
      slot = { ...next, version };
      return { kind: 'saved', version };
    },
  };
}

const gear = (patch: Partial<Loadout> = {}): Loadout => ({ ...emptyLoadout(), ...patch });

describe('the run from the bunker', () => {
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

  async function boot(save: Partial<HomeSave> = {}): Promise<void> {
    game?.dispose();
    game = new GameController({ homeLoop: true, homeStore: () => memoryStore(save) });
    game.mount(fakeCanvas() as unknown as HTMLCanvasElement);
    await pump(100);
  }

  /** Into the bunker, with the world on screen. */
  async function startHome(save: Partial<HomeSave> = {}): Promise<{ sim: GameSimulation; state: ReturnType<typeof stateOf> }> {
    await boot(save);
    game.startSolo();
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

  it('Play starts in the bunker', async () => {
    const { sim } = await startHome();
    expect(game.ui.value).toMatchObject({ screen: 'game', homeLoop: true });
    expect(sim.map.seed).toBe(BUNKER_SEED);
    expect(game.ui.value.home).toMatchObject({ inBunker: true });
  });

  it('?home turns home mode on in a dev build only', () => {
    expect(homeLoopOn('?home', true)).toBe(true);
    expect(homeLoopOn('?home', false)).toBe(false);
    expect(homeLoopOn('', true)).toBe(false);
    expect(homeLoopOn('?homestead', true)).toBe(false);
    expect(homeLoopOn('', false, true)).toBe(true);
    Object.assign(window.location, { search: '?home' });
    const asked = new GameController();
    expect(asked.ui.value.homeLoop).toBe(true);
    asked.dispose();
  });

  it('plays the old game when home mode is off', async () => {
    game = new GameController({ homeLoop: false });
    game.mount(fakeCanvas() as unknown as HTMLCanvasElement);
    await pump(100);
    game.startSolo();
    await pump(300);
    expect(game.sim?.map.seed).not.toBe(BUNKER_SEED);
    expect(game.ui.value.home).toBeNull();
  });

  describe('the hint', () => {
    it('a first visit shows the hint pointing to the van, and a later one does not', async () => {
      await startHome();
      expect(game.ui.value.banner?.title).toMatch(/van/i);

      const trip = { level: 1, outcome: 'died', difficulty: 'lights_out', silver: 0, jewels: { small: 0, large: 0 }, replay: false, at: 1 } as const;
      await startHome({ ledger: [trip] });
      expect(game.ui.value.banner).toBeNull();
    });

    it('owning a gun but boarding without one prompts at the van', async () => {
      const { state } = await startHome({ locker: gear({ guns: { pistol: {} } }) });
      const me = playerNamed(state, LOCAL);
      game.home.pickLevel(1);
      standAtVan(state, me);
      await pump(1000);
      expect(game.ui.value.banner?.title).toMatch(/no gun/i);
      expect(me.home?.ready).toBe(false);

      press('Enter');
      await pump(200);
      expect(me.home?.ready).toBe(true);
    });

    it('boards at once with nothing owned, for the free pistol', async () => {
      const { state } = await startHome();
      const me = playerNamed(state, LOCAL);
      game.home.pickLevel(1);
      standAtVan(state, me);
      await pump(1000);
      expect(me.home?.ready).toBe(true);
    });
  });

  it('the bunker shows no horde timer, level card or town weather', async () => {
    const setTheme = vi.spyOn(WorldRenderer.prototype, 'setTheme');
    await startHome();
    const { hud, levelCard } = game.ui.value;
    expect(setTheme).toHaveBeenCalledWith('bunker');
    expect(levelCard).toBeNull();
    expect(hud?.level).toBe(0);
    expect(hordeStatus(hud!).title).not.toMatch(/horde/i);
    expect(levelLine(hud!.level)).not.toMatch(/level/i);
  });

  describe('a trip out', () => {
    it('a death shows the summary and wakes in the bunker, with no game over screen', async () => {
      const { sim, state } = await startHome({ hands: gear({ guns: { carbine: {} } }) });
      driveToTown(sim, state, 1, true);
      await pump(400);
      expect(isBunkerSeed(game.sim!.map.seed)).toBe(false);

      playerNamed(state, LOCAL).status = 'dead';
      await pump(600);
      const { screen, result, home } = game.ui.value;
      expect(screen).toBe('game');
      expect(result).toBeNull();
      expect(home?.inBunker).toBe(true);
      expect(home?.death?.receipt.outcome).toBe('died');
      expect(home?.death?.lost.guns.carbine).toBeDefined();

      game.home.wake();
      await pump(100);
      expect(game.ui.value.home?.death).toBeNull();
    });

    it('a carried player does not unlock on arrival, and does at the van', async () => {
      const { sim, state } = await startHome();
      driveToTown(sim, state, 3, true);
      await pump(600);
      expect(loadLevelProgress().highest).toBe(1);

      bankTrip(sim, state);
      await pump(600);
      expect(loadLevelProgress().highest).toBe(4);
    });

    it('the best trip is recorded from a receipt, banked or not', async () => {
      const { sim, state } = await startHome();
      driveToTown(sim, state, 1, true);
      await pump(400);
      const me = playerNamed(state, LOCAL);
      Object.assign(me, { score: 120, kills: 7, status: 'dead' });
      await pump(600);
      expect(loadBest()).toMatchObject({ score: 120, kills: 7, trip: true });
      expect(loadLeaderboard()[0]).toMatchObject({ score: 120, trip: true });

      game.home.wake();
      driveToTown(sim, state, 1, true);
      await pump(400);
      me.score = 300;
      bankTrip(sim, state);
      await pump(600);
      expect(loadBest()).toMatchObject({ score: 300, trip: true });
    });
  });

  describe('the ending', () => {
    async function clearFinalLevel(sim: GameSimulation, state: ReturnType<typeof stateOf>): Promise<void> {
      driveToTown(sim, state, FINAL_LEVEL, true);
      await pump(400);
      bankTrip(sim, state);
      await pump(600);
    }

    it('a first clear of level 10 plays the ending and returns to the bunker without toMenu, and a later clear does not', async () => {
      const { sim, state } = await startHome();
      const toMenu = vi.spyOn(game, 'toMenu');
      await clearFinalLevel(sim, state);
      expect(game.ui.value.screen).toBe('gameover');
      expect(game.ui.value.result?.stats.outcome).toBe('victory');

      game.home.continueFromEnding();
      await pump(200);
      expect(toMenu).not.toHaveBeenCalled();
      expect(game.ui.value).toMatchObject({ screen: 'game', result: null });
      expect(game.sim).toBe(sim);
      expect(game.ui.value.home?.inBunker).toBe(true);

      await clearFinalLevel(sim, state);
      expect(game.ui.value.screen).toBe('game');
    });

    it('the credits end in the bunker, not on the title', async () => {
      const { sim, state } = await startHome();
      await clearFinalLevel(sim, state);
      game.toMenu();
      await pump(200);
      expect(game.ui.value.screen).toBe('game');
      expect(game.sim).toBe(sim);
    });
  });

  describe('a station', () => {
    async function atGunsmith() {
      const { sim, state } = await startHome();
      const me = playerNamed(state, LOCAL);
      standAtStation(state, me, 'gunsmith');
      (me.home as NonNullable<typeof me.home>).station = 'gunsmith';
      await pump(300);
      return { sim, state, me };
    }

    it('a shop holds input without pausing the run, and closes when the station clears', async () => {
      const { state, me } = await atGunsmith();
      expect(game.ui.value.home?.shop).toBe('gunsmith');
      expect(game.ui.value.paused).toBe(false);

      press('KeyD');
      expect(game.input.dirX).toBe(0);
      const tick = state.tick;
      await pump(300);
      expect(state.tick).toBeGreaterThan(tick);

      (me.home as NonNullable<typeof me.home>).station = null;
      await pump(300);
      expect(game.ui.value.home?.shop).toBeNull();
      expect(game.input.dirX).toBe(1);
    });

    it('Esc closes a station before it toggles pause', async () => {
      await atGunsmith();
      press('Escape');
      await pump(300);
      expect(game.ui.value.paused).toBe(false);
      expect(game.ui.value.home?.station).toBeNull();

      press('Escape');
      expect(game.ui.value.paused).toBe(true);
    });
  });
});
