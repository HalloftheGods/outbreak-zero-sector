import { describe, expect, it, vi } from 'vitest';
import { BUNKER_LEVEL, BUNKER_SEED, HOME_LOOP_LIVE, isBunkerMap, isBunkerSeed, MERCHANT_IDS, STATION_IDS } from '../shared/home-protocol.ts';
import type { HomeView } from '../shared/home-protocol.ts';
import { FINAL_LEVEL, FIRST_LEVEL, levelSeed } from '../shared/levels.ts';
import { emptyLoadout, loadoutOfEntity, mergeHome } from '../shared/loadout.ts';
import type { PlayerEntity, SnapshotPacket } from '../shared/protocol.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { buildArtBook } from '../src/art/index.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import { buy, shopRows } from '../src/game/home/shop.ts';
import { homeUi, shopContext } from '../src/game/home-hud.ts';
import { LocalSession } from '../src/network/local-session.ts';
import { homeSim } from './helpers/home-harness.ts';
import { input, SEED, steps } from './helpers/sim-harness.ts';

const STEPS = 600;
const QUIET_HOME: HomeView = { silver: 0, jewels: { small: 0, large: 0 }, station: null, stationHold: 0, ready: false, receipt: null };

function played(sim: GameSimulation): SnapshotPacket[] {
  sim.addPlayer('a', 'a');
  const frames: SnapshotPacket[] = [];
  for (let tick = 0; tick < STEPS; tick++) {
    sim.setInput('a', input({ seq: tick, right: tick % 80 < 40, down: tick % 80 >= 40, shoot: tick % 9 === 0, angle: tick * 0.1, search: tick % 60 < 20 }));
    sim.step();
    frames.push(sim.snapshot());
  }
  return frames;
}

describe('the home switch', () => {
  it('is off', () => {
    expect(HOME_LOOP_LIVE).toBe(false);
  });

  it('changes nothing when home is off', () => {
    const plain = played(new GameSimulation({ seed: SEED }));
    const off = played(new GameSimulation({ seed: SEED, home: false }));
    expect(off).toEqual(plain);
    for (const level of [FIRST_LEVEL, 2, FINAL_LEVEL]) expect(levelSeed(SEED, level)).toBe(levelSeed(SEED, level, 0));
  });

  it('puts nothing about home on the wire when it is off', () => {
    const [frame] = played(new GameSimulation({ seed: SEED }));
    expect(frame).not.toHaveProperty('home');
    expect(frame.players[0]).not.toHaveProperty('home');
  });
});

describe('a town seed', () => {
  it('differs from one attempt to the next and is never the bunker', () => {
    const seeds = [0, 1, 2, 3].map((attempt) => levelSeed(SEED, 2, attempt));
    expect(new Set(seeds).size).toBe(seeds.length);
    expect(seeds.some(isBunkerSeed)).toBe(false);
  });
});

describe('a home sim', () => {
  it('starts in an empty bunker at level 0', () => {
    const { sim, state } = homeSim();
    expect(isBunkerMap(sim.map)).toBe(true);
    expect(sim.level).toBe(BUNKER_LEVEL);
    expect(state.zombies).toEqual([]);
    expect(state.pickups).toEqual([]);
    expect(state.homeRun).toMatchObject({ tripLevel: null, pickedLevel: null, attempt: 0, roomHighest: FIRST_LEVEL, nextTreasure: 0, nextReceipt: 1 });
  });

  it('holds no waves or roamers however long it stands', () => {
    const { sim, state } = homeSim();
    steps(sim, STEPS);
    expect(state.wave).toBe(0);
    expect(state.zombies).toEqual([]);
    expect(sim.snapshot().mapSeed).toBe(BUNKER_SEED);
  });

  it('shows each player and the room their home state', () => {
    const { sim } = homeSim({ players: ['a', 'b'] });
    const frame = sim.snapshot();
    expect(frame.home).toEqual({ pickedLevel: null, roomHighest: FIRST_LEVEL });
    for (const player of frame.players) expect(player.home).toEqual(QUIET_HOME);
  });

  it('takes the highest level a player joins with', () => {
    const { sim, state } = homeSim({ players: [] });
    sim.addPlayer('a', 'a', null, undefined, { loadout: emptyLoadout(), highest: 4 });
    expect(state.players[0].home?.highest).toBe(4);
  });

  it('keeps what a death cost on this side of the wire', () => {
    const { sim, state } = homeSim();
    expect(state.players[0].home?.lost).toEqual({ silver: 0, jewels: { small: 0, large: 0 } });
    expect(sim.snapshot().players[0].home).not.toHaveProperty('lost');
  });

  it('accepts a home command before the lane has filled it', () => {
    const { sim } = homeSim();
    expect(() => sim.homeCommand('a', { kind: 'leave_station' })).not.toThrow();
    expect(() => sim.homeCommand('nobody', { kind: 'ready', ready: true })).not.toThrow();
  });
});

describe('a receipt key', () => {
  it('tells two sims apart, even on one seed', () => {
    const [first, second] = [homeSim(), homeSim()].map(({ state }) => state.homeRun?.simId);
    expect(first).toEqual(expect.any(String));
    expect(first).not.toBe(second);
  });

  it('counts for the room, not for each player', () => {
    const { state } = homeSim({ players: ['a', 'b'] });
    for (const player of state.players) expect(player.home).not.toHaveProperty('serial');
  });

  it('never repeats a serial after a restart or an emptied room', () => {
    const { sim, state } = homeSim();
    const run = state.homeRun!;
    const { simId } = run;
    run.nextReceipt = 5;
    sim.restart();
    sim.removePlayer('a');
    sim.setDifficulty('undead_tired');
    expect(state.homeRun).toMatchObject({ simId, nextReceipt: 5 });
  });
});

describe('gear between the sim and the save', () => {
  it('reads a loadout off the entity a client holds', () => {
    const [entity] = homeSim().sim.snapshot().players;
    expect(Object.keys(loadoutOfEntity(entity)).sort()).toEqual(Object.keys(emptyLoadout()).sort());
  });

  it('merges nothing home into an empty locker as nothing', () => {
    expect(mergeHome(emptyLoadout(), emptyLoadout())).toEqual(emptyLoadout());
  });
});

describe('the client seams', () => {
  it('plays a solo game from the bunker when asked', () => {
    vi.useFakeTimers();
    const session = new LocalSession();
    const frames: SnapshotPacket[] = [];
    session.onSnapshot = (frame) => frames.push(frame);
    session.connect({ name: 'ANA', homeLoop: true });
    session.sendHome({ kind: 'leave_station' });
    session.disconnect();
    vi.useRealTimers();
    expect(frames[0].mapSeed).toBe(BUNKER_SEED);
    expect(frames[0].players[0].name).toBe('ANA');
  });

  it('has no home state outside home mode', () => {
    const frame = new GameSimulation({ seed: SEED }).snapshot();
    expect(homeUi(frame, {} as PlayerEntity)).toBeNull();
  });

  it('opens a shop only at a merchant, and shuts it with the station', () => {
    const frame = homeSim().sim.snapshot();
    const at = (station: HomeView['station']): PlayerEntity => ({ home: { ...QUIET_HOME, station } }) as PlayerEntity;
    expect(homeUi(frame, at('medic'))).toMatchObject({ inBunker: true, station: 'medic', shop: 'medic' });
    expect(homeUi(frame, at('forge'))).toMatchObject({ station: 'forge', shop: null });
    expect(homeUi(frame, at(null))).toMatchObject({ station: null, shop: null });
  });

  it('builds a sale from what the screen already knows', () => {
    const frame = homeSim().sim.snapshot();
    const local = { home: { ...QUIET_HOME, station: 'medic' } } as PlayerEntity;
    const home = homeUi(frame, local, { save: null, highest: 4, difficulty: 'undead_tired' });
    expect(home).toMatchObject({ highest: 4, difficulty: 'undead_tired' });
    expect(shopContext(home!)).toEqual({ highest: 4, station: 'medic', difficulty: 'undead_tired' });
  });

  it('sells and lists nothing from an empty shop before the lane has filled it', () => {
    const context = { highest: FIRST_LEVEL, station: 'medic', difficulty: 'lights_out' } as const;
    expect(buy(emptySave(1), 'medic', 'medkit', context)).toBeNull();
    expect(Array.isArray(shopRows(emptySave(1), 'medic', context))).toBe(true);
  });

  it('keeps stock for every merchant in the save', () => {
    const { merchants } = emptySave(1).shop;
    expect(Object.keys(merchants).sort()).toEqual([...MERCHANT_IDS].sort());
  });

  it('has a figure and a portrait for every merchant', () => {
    const book = buildArtBook();
    for (const id of MERCHANT_IDS) {
      expect(book.merchants[id].portrait.w, id).toBeGreaterThan(0);
      expect(book.environment.props[id], id).toBeDefined();
    }
  });
});

describe('the bunker map', () => {
  it('has every station in it', () => {
    const { sim } = homeSim();
    expect(sim.map.stations?.map((station) => station.id).sort()).toEqual([...STATION_IDS].sort());
  });
});
