import { afterEach, describe, expect, it } from 'vitest';
import { startGameServer } from '../server/server.ts';
import type { RunningGameServer } from '../server/server.ts';
import type { Loadout } from '../shared/home-protocol.ts';
import { emptyLoadout, loadoutOfEntity } from '../shared/loadout.ts';
import type { PlayerState, SimState } from '../shared/sim-state.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { createBrowserHomeStore } from '../src/game/home/browser-home-store.ts';
import type { HomeSave } from '../src/game/home/home-store.ts';
import { bankTrip, driveToTown, playerNamed, quietTown, standAtVan } from './helpers/home-harness.ts';
import { browserWith, HomeTab, waitFor } from './helpers/home-socket.ts';
import { SEED, stateOf } from './helpers/sim-harness.ts';

const GEAR: Loadout = { ...emptyLoadout(), guns: { pistol: {} }, ammoBag: { pistol: 30, carbine: 0, shotgun: 0 }, medkits: 2 };
const MODDED_CARBINE: Loadout = { ...emptyLoadout(), guns: { carbine: { fit: { ranks: { damage: 1 }, quirk: null } } } };

const heldBy = (tab: HomeTab): Loadout => loadoutOfEntity(tab.me as NonNullable<HomeTab['me']>);

/** What a solo run in the same browser leaves on file while the co-op tab is closed. */
async function soloInBetween(storage: ReturnType<typeof browserWith>, change: (save: HomeSave) => HomeSave): Promise<void> {
  const store = createBrowserHomeStore(storage);
  const result = await store.save(change(await store.load()));
  expect(result.kind).toBe('saved');
}

/** A bunker body leaving is the one case where the save, not the room, is the newer word on the gear. */
describe('a body left in the bunker does not outlive a newer save', () => {
  let server: RunningGameServer;
  let sim: GameSimulation;
  let state: SimState;
  const tabs: HomeTab[] = [];

  async function openRoom(): Promise<void> {
    sim = new GameSimulation({ seed: SEED, workbench: 'timed', home: true });
    state = stateOf(sim);
    server = await startGameServer({ port: 0, simulation: sim });
  }

  const tabOn = (storage: ReturnType<typeof browserWith>): HomeTab => {
    const tab = new HomeTab(server.port, storage);
    tabs.push(tab);
    return tab;
  };

  /** Somebody who stays in the room the whole time. */
  async function host(): Promise<HomeTab> {
    const tab = await tabOn(browserWith()).join({ token: 'host' });
    await tab.nextFrame();
    return tab;
  }

  afterEach(async () => {
    for (const tab of tabs.splice(0)) tab.crash();
    await server.close();
  });

  it('a solo death in between is not undone by the rejoin: the hands stay empty', async () => {
    await openRoom();
    await host();
    const storage = browserWith({ hands: GEAR });
    const tab = await tabOn(storage).join({ token: 'back-and-forth' });
    await tab.nextFrame();
    expect(heldBy(tab)).toEqual(GEAR);
    tab.crash();
    await waitFor(() => state.players.length === 1);

    const dead = (save: HomeSave): HomeSave => ({ ...save, hands: emptyLoadout(), locker: emptyLoadout() });
    await soloInBetween(storage, dead);

    const back = await tabOn(storage).join({ token: 'back-and-forth' });
    await back.nextFrame();
    await back.nextFrame();
    expect(back.welcome?.resumed).toBeUndefined();
    expect(heldBy(back)).toEqual(emptyLoadout());
    expect(back.save.hands).toEqual(emptyLoadout());
    expect(back.save.locker).toEqual(emptyLoadout());
  });

  it('gear banked in the locker in between stays there, mod and all, and the room hears the higher level', async () => {
    await openRoom();
    await host();
    const storage = browserWith({ hands: { ...emptyLoadout(), guns: { carbine: {} } } });
    const tab = await tabOn(storage).join({ token: 'banker' });
    await tab.nextFrame();
    tab.crash();
    await waitFor(() => state.players.length === 1);

    const banked = (save: HomeSave): HomeSave => ({ ...save, hands: emptyLoadout(), locker: MODDED_CARBINE });
    await soloInBetween(storage, banked);

    const back = await tabOn(storage).join({ token: 'banker', highest: 2 });
    await back.nextFrame();
    await back.nextFrame();
    expect(back.save.locker).toEqual(MODDED_CARBINE);
    expect(back.save.hands).toEqual(emptyLoadout());
    expect(back.client.lastSnapshot?.home?.roomHighest).toBe(2);
  });

  it('quitting from the van while a teammate has not arrived calls the trip off: the gear stays in hand on file and on rejoin', async () => {
    await openRoom();
    await host();
    const storage = browserWith({ hands: GEAR });
    const tab = await tabOn(storage).join({ token: 'quitter' });
    await tab.nextFrame();
    tab.client.send({ type: 'home', action: { kind: 'pick_level', level: 1 } });
    await waitFor(() => tab.client.lastSnapshot?.home?.pickedLevel);
    standAtVan(state, playerNamed(state, tab.id));
    await waitFor(() => tab.save.openTrip);
    await waitFor(() => playerNamed(state, tab.id).home?.ready);

    tab.sync.leave();
    tab.client.socket.close();
    await waitFor(() => state.players.length === 1);
    expect(state.departed.size).toBe(0);

    const back = await tabOn(storage).join({ token: 'quitter' });
    await back.nextFrame();
    await back.nextFrame();
    expect(back.save.openTrip).toBeNull();
    expect(back.save.ledger).toEqual([]);
    expect(back.save.hands).toEqual(GEAR);
    expect(heldBy(back)).toEqual(GEAR);
  });

  it('a body home from a trip with a result nobody has credited yet is still kept for its owner', async () => {
    await openRoom();
    const friend = await host();
    const tab = await tabOn(browserWith({ hands: GEAR })).join({ token: 'owed' });
    await tab.nextFrame();
    driveToTown(sim, state);
    quietTown(state);
    await waitFor(() => friend.save.openTrip && tab.save.openTrip);
    bankTrip(sim, state);
    const body: PlayerState = playerNamed(state, tab.id);
    expect(body.home?.receipt).not.toBeNull();
    tab.crash();
    await waitFor(() => state.players.length === 1);
    expect(state.departed.size).toBe(1);
  });
});
