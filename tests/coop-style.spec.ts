import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { startGameServer } from '../server/server.ts';
import type { RunningGameServer } from '../server/server.ts';
import { isBunkerSeed } from '../shared/home-protocol.ts';
import type { Loadout } from '../shared/home-protocol.ts';
import { emptyLoadout } from '../shared/loadout.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { AudioEngine } from '../src/audio/audio-engine.ts';
import { GameController } from '../src/game/game-controller.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave, HomeStore } from '../src/game/home/home-store.ts';
import { loadStyle, saveStyle } from '../src/game/style-pref.ts';
import { fakeCanvas, installFakeBrowser } from './client-fake-dom.ts';
import type { FakeBrowser } from './client-fake-dom.ts';
import { SEED, stateOf } from './helpers/sim-harness.ts';
import { TestClient } from './helpers/ws-client.ts';

const WAIT_MS = 4000;
const FRAME_MS = 16;

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const GEAR: Loadout = { ...emptyLoadout(), guns: { pistol: {} }, ammoBag: { pistol: 30, carbine: 0, shotgun: 0 }, medkits: 2 };

/** A save the spec can see being read, one slot deep like a tab's localStorage. */
function watchedStore(initial: Partial<HomeSave> = {}): { store: HomeStore; loads: () => number } {
  let slot: HomeSave = { ...emptySave(7), ...initial };
  let loads = 0;
  return {
    loads: () => loads,
    store: {
      load: async () => {
        loads += 1;
        return slot;
      },
      async save(next) {
        const version = next.version + 1;
        slot = { ...next, version };
        return { kind: 'saved', version };
      },
    },
  };
}

/** The real controller on a real socket into a real server, a frame at a time. */
describe('co-op following the room\'s style', () => {
  let browser: FakeBrowser;
  let server: RunningGameServer;
  let sim: GameSimulation;
  let clock = 0;
  const games: GameController[] = [];
  const sockets: TestClient[] = [];

  async function until<T>(find: () => T | undefined | null | false): Promise<T> {
    const deadline = Date.now() + WAIT_MS;
    for (;;) {
      clock += FRAME_MS;
      browser.runFrame(clock);
      const found = find();
      if (found) return found;
      if (Date.now() > deadline) throw new Error('timed out');
      await new Promise((resolve) => setTimeout(resolve, 4));
    }
  }

  /** A title screen with the art baked, ready for a Start press. */
  async function title(store: HomeStore): Promise<GameController> {
    const game = new GameController({ homeStore: () => store });
    games.push(game);
    game.mount(fakeCanvas() as unknown as HTMLCanvasElement);
    await until(() => game.ui.value.art);
    game.setServerAddress(`ws://127.0.0.1:${server.port}`);
    return game;
  }

  /** Somebody already in the room, on a plain socket. */
  async function roomOf(style: 'campaign' | 'arcade'): Promise<TestClient> {
    const host = new TestClient(server.port);
    sockets.push(host);
    await host.join('Host', 'host-token', style);
    return host;
  }

  const inRun = (game: GameController): Promise<unknown> => until(() => game.ui.value.screen === 'game' && game.ui.value.hud !== null);

  beforeEach(async () => {
    browser = installFakeBrowser();
    vi.stubGlobal('localStorage', memoryStorage());
    vi.stubGlobal('sessionStorage', memoryStorage());
    vi.stubGlobal('WebSocket', WebSocket);
    clock = 0;
    sim = new GameSimulation({ seed: SEED, workbench: 'timed' });
    server = await startGameServer({ port: 0, simulation: sim });
  });

  afterEach(async () => {
    for (const game of games.splice(0)) game.dispose();
    for (const socket of sockets.splice(0)) socket.socket.terminate();
    await server.close();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('an empty room takes the joiner\'s remembered style, and its gear goes in with it', async () => {
    const { store, loads } = watchedStore({ hands: GEAR });
    const game = await title(store);
    expect(game.ui.value.style).toBe('campaign');
    game.startCoop();
    await inRun(game);
    expect(sim.playsHome).toBe(true);
    expect(loads()).toBeGreaterThan(0);
    expect(game.ui.value).toMatchObject({ runStyle: 'campaign', mode: 'coop' });
    expect(game.ui.value.home).toMatchObject({ inBunker: true });
    expect(stateOf(sim).players[0].medkits).toBe(2);
  });

  it('a Campaign player in an Arcade room plays Arcade, and nothing touches their save or their choice', async () => {
    await roomOf('arcade');
    const { store, loads } = watchedStore({ hands: GEAR });
    const setStyle = vi.spyOn(AudioEngine.prototype, 'setStyle');
    const game = await title(store);
    game.startCoop('campaign');
    await inRun(game);

    expect(game.ui.value).toMatchObject({ style: 'campaign', runStyle: 'arcade', home: null });
    expect(setStyle).toHaveBeenLastCalledWith('arcade');
    expect(loads()).toBe(0);
    expect(sim.playsHome).toBe(false);
    expect(loadStyle()).toBe('campaign');
  });

  it('an Arcade player invited into a Campaign room follows it and brings their gear, and still remembers Arcade', async () => {
    saveStyle('arcade');
    await roomOf('campaign');
    const { store, loads } = watchedStore({ hands: GEAR });
    const setStyle = vi.spyOn(AudioEngine.prototype, 'setStyle');
    const game = await title(store);
    expect(game.ui.value.style).toBe('arcade');
    game.startCoop();
    await inRun(game);
    await until(() => game.ui.value.home);

    expect(game.ui.value).toMatchObject({ style: 'arcade', runStyle: 'campaign' });
    expect(setStyle).toHaveBeenLastCalledWith('campaign');
    expect(loads()).toBeGreaterThan(0);
    expect(stateOf(sim).players.find((player) => player.name !== 'Host')?.medkits).toBe(2);
    expect(loadStyle()).toBe('arcade');
  });

  it('drops the run\'s style on the way back to the title, and solo plays the remembered one again', async () => {
    saveStyle('arcade');
    await roomOf('campaign');
    const game = await title(watchedStore().store);
    game.startCoop();
    await inRun(game);
    game.toMenu();
    expect(game.ui.value).toMatchObject({ screen: 'title', runStyle: null, style: 'arcade' });

    game.startSolo();
    await inRun(game);
    expect(game.ui.value).toMatchObject({ mode: 'solo', runStyle: 'arcade', home: null });
    expect(isBunkerSeed(game.sim?.map.seed ?? 0)).toBe(false);
  });

  it('a refresh into a room playing another style comes back to its body, in the room\'s style', async () => {
    await roomOf('campaign');
    const first = await title(watchedStore({ hands: GEAR }).store);
    first.startCoop();
    await inRun(first);
    await until(() => sim.playerCount === 2);
    first.dispose();
    games.length = 0;
    await until(() => sim.playerCount === 1);

    saveStyle('arcade');
    const back = await title(watchedStore({ hands: GEAR }).store);
    back.startCoop();
    await inRun(back);
    await until(() => back.ui.value.home);
    expect(back.ui.value).toMatchObject({ style: 'arcade', runStyle: 'campaign' });
    expect(sim.playerCount).toBe(2);
  });

  it('says why when the save cannot be read for a Campaign room, and lets go of the socket', async () => {
    await roomOf('campaign');
    const broken: HomeStore = { load: () => Promise.reject(new Error('no')), save: () => Promise.reject(new Error('no')) };
    const game = await title(broken);
    game.startCoop();
    await until(() => game.ui.value.error);
    expect(game.ui.value).toMatchObject({ connecting: false, runStyle: null });
    expect(sim.playerCount).toBe(1);
  });
});
