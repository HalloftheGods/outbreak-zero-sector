import { describe, expect, it, vi } from 'vitest';
import { parseHome, parseJoinHome } from '../server/home-packets.ts';
import { parseClientPacket } from '../server/packets.ts';
import { BUNKER_SEED } from '../shared/home-protocol.ts';
import type { HomeView, TripReceipt } from '../shared/home-protocol.ts';
import { FINAL_LEVEL, FIRST_LEVEL } from '../shared/levels.ts';
import { emptyLoadout } from '../shared/loadout.ts';
import type { PlayerEntity, SnapshotPacket } from '../shared/protocol.ts';
import { LocalSession } from '../src/network/local-session.ts';
import { isHomeView, isLoadout, isRoomHomeView, isTripReceipt } from '../src/network/home-guards.ts';
import { isPlayerEntity, isSnapshotPacket, isWelcomePacket } from '../src/network/packet-guards.ts';

/** A stand-in for the lane's real check: this spec is about what the parser does with its answer. */
vi.mock('../shared/loadout.ts', async (original) => {
  const real = await original<typeof import('../shared/loadout.ts')>();
  const accepted = (value: unknown): boolean => typeof value === 'object' && value !== null && 'guns' in value;
  return { ...real, validateLoadout: (value: unknown) => (accepted(value) ? real.emptyLoadout() : null) };
});

const receipt: TripReceipt = {
  simId: 'abc-01', serial: 3, outcome: 'banked', level: 2, difficulty: 'stay_close', silver: 40, jewels: { small: 1, large: 0 },
  replay: false, score: 100, kills: 4, hordes: 2, seconds: 90, ending: false, gear: emptyLoadout(),
};

const view: HomeView = { silver: 5, jewels: { small: 0, large: 1 }, station: 'forge', stationHold: 0.5, ready: false, receipt };

const player: PlayerEntity = {
  id: 'p1', name: 'ANA', skin: 0, x: 1, y: 2, angle: 0, moving: false, status: 'alive',
  health: 100, maxHealth: 100, weapon: 'pistol', ammo: 12, magSize: 12, reserve: 12,
  owned: ['pistol'], ammoBag: { pistol: 12, carbine: 0, shotgun: 0 }, mags: { pistol: 12, carbine: 0, shotgun: 0 },
  medkits: 0, indoors: null,
  reload: 0, bleedout: 0, revive: 0, score: 0, kills: 0, lastInputSeq: 3, knife: false, search: 0,
};

const snapshot: SnapshotPacket = {
  type: 'snapshot', tick: 9, phase: 'intermission', level: 0, mapSeed: BUNKER_SEED, wave: 0, intermission: 0, hostiles: 0,
  players: [player], zombies: [], bullets: [], pickups: [], exit: null, openedContainers: [], events: [], gameOver: null,
};

describe('parseHome', () => {
  it('passes every well-formed action', () => {
    expect(parseHome({ kind: 'pick_level', level: 3 })).toEqual({ kind: 'pick_level', level: 3 });
    expect(parseHome({ kind: 'ready', ready: true })).toEqual({ kind: 'ready', ready: true });
    expect(parseHome({ kind: 'ready', ready: true, ownsGun: true })).toEqual({ kind: 'ready', ready: true, ownsGun: true });
    expect(parseHome({ kind: 'leave_station' })).toEqual({ kind: 'leave_station' });
    expect(parseHome({ kind: 'highest', highest: FINAL_LEVEL })).toEqual({ kind: 'highest', highest: FINAL_LEVEL });
  });

  it('hands gear to the loadout check and keeps only what it returns', () => {
    expect(parseHome({ kind: 'equip', loadout: { guns: { laser: {} } } })).toEqual({ kind: 'equip', loadout: emptyLoadout() });
    expect(parseHome({ kind: 'equip', loadout: 'everything' })).toBeNull();
  });

  it.each([
    ['nothing', undefined],
    ['an array', []],
    ['an unknown kind', { kind: 'cheat' }],
    ['a kind off the prototype', { kind: 'toString' }],
    ['a level below the first', { kind: 'pick_level', level: FIRST_LEVEL - 1 }],
    ['a level past the last', { kind: 'pick_level', level: FINAL_LEVEL + 1 }],
    ['a fractional level', { kind: 'pick_level', level: 1.5 }],
    ['a ready that is not a flag', { kind: 'ready', ready: 'yes' }],
    ['an ownsGun that is not a flag', { kind: 'ready', ready: true, ownsGun: 1 }],
    ['a highest past the last', { kind: 'highest', highest: FINAL_LEVEL + 1 }],
  ])('refuses %s', (_name, value) => {
    expect(parseHome(value)).toBeNull();
  });
});

describe('parseJoinHome', () => {
  it('takes legal gear and a level', () => {
    expect(parseJoinHome({ loadout: { guns: {} }, highest: 4 })).toEqual({ loadout: emptyLoadout(), highest: 4 });
  });

  it('keeps having seen the ending, and leaves it off for no', () => {
    expect(parseJoinHome({ loadout: { guns: {} }, highest: 10, finished: true })).toMatchObject({ finished: true });
    expect(parseJoinHome({ loadout: { guns: {} }, highest: 10, finished: 'yes' })).not.toHaveProperty('finished');
  });

  it('turns no player away: bad gear becomes none, and a bad level the first', () => {
    expect(parseJoinHome({ loadout: 'all of it', highest: 99 })).toEqual({ loadout: emptyLoadout(), highest: FIRST_LEVEL });
  });

  it('is nothing for a client that sent nothing', () => {
    expect(parseJoinHome(undefined)).toBeUndefined();
    expect(parseJoinHome('home')).toBeUndefined();
  });
});

describe('client packets', () => {
  it('carries a home action, and drops a bad one', () => {
    expect(parseClientPacket('{"type":"home","action":{"kind":"leave_station"}}')).toEqual({ type: 'home', action: { kind: 'leave_station' } });
    expect(parseClientPacket('{"type":"home","action":{"kind":"cheat"}}')).toBeNull();
  });

  it('reads home on a join, and adds nothing to a join without it', () => {
    const join = { type: 'join', name: 'Ann', token: 't1' };
    expect(parseClientPacket(JSON.stringify({ ...join, home: { loadout: { guns: {} }, highest: 2 } }))).toMatchObject({ home: { highest: 2 } });
    expect(parseClientPacket(JSON.stringify(join))).toEqual(join);
  });
});

describe('home guards', () => {
  it('accepts a whole view, and a frame carrying one', () => {
    expect(isHomeView(view)).toBe(true);
    expect(isPlayerEntity({ ...player, home: view })).toBe(true);
    expect(isSnapshotPacket({ ...snapshot, home: { pickedLevel: null, roomHighest: 1 } })).toBe(true);
    expect(isSnapshotPacket(snapshot)).toBe(true);
  });

  it('refuses a player or a frame whose home is malformed', () => {
    expect(isPlayerEntity({ ...player, home: { ...view, station: 'moon' } })).toBe(false);
    expect(isPlayerEntity({ ...player, home: { ...view, jewels: { small: 1 } } })).toBe(false);
    expect(isPlayerEntity({ ...player, home: { ...view, receipt: { ...receipt, serial: 'one' } } })).toBe(false);
    expect(isSnapshotPacket({ ...snapshot, home: { pickedLevel: 'two', roomHighest: 1 } })).toBe(false);
  });

  it('reads a receipt with no gear, and refuses an unknown outcome', () => {
    expect(isTripReceipt({ ...receipt, gear: null })).toBe(true);
    expect(isTripReceipt({ ...receipt, outcome: 'fled' })).toBe(false);
    expect(isTripReceipt({ ...receipt, difficulty: 'nightmare fuel' })).toBe(false);
  });

  it('checks a loadout gun by gun', () => {
    expect(isLoadout(emptyLoadout())).toBe(true);
    expect(isLoadout({ ...emptyLoadout(), guns: { pistol: {} } })).toBe(true);
    expect(isLoadout({ ...emptyLoadout(), guns: { laser: {} } })).toBe(false);
    expect(isLoadout({ ...emptyLoadout(), knife: 'yes' })).toBe(false);
  });

  it('reads a room view with or without a pick', () => {
    expect(isRoomHomeView({ pickedLevel: 3, roomHighest: 3 })).toBe(true);
    expect(isRoomHomeView({ pickedLevel: null, roomHighest: 1 })).toBe(true);
  });

  it('accepts a welcome with resumed, and refuses one that is not a flag', () => {
    const welcome = { type: 'welcome', yourId: 'a', tickRate: 30, mapSeed: 1 };
    expect(isWelcomePacket({ ...welcome, resumed: true })).toBe(true);
    expect(isWelcomePacket(welcome)).toBe(true);
    expect(isWelcomePacket({ ...welcome, resumed: 'yes' })).toBe(false);
  });
});

describe('solo', () => {
  it('welcome sends sim.map.seed', () => {
    const session = new LocalSession();
    const seeds: number[] = [];
    session.onWelcome = (packet) => seeds.push(packet.mapSeed);
    session.connect({ name: 'a', startLevel: 3 });
    expect(seeds).toEqual([session.sim?.map.seed]);
    session.disconnect();
    session.connect({ name: 'a', homeLoop: true });
    expect(seeds[1]).toBe(BUNKER_SEED);
    session.disconnect();
  });

  it('solo keeps one sim across trips', () => {
    const session = new LocalSession();
    const welcomes: number[] = [];
    session.onWelcome = (packet) => welcomes.push(packet.mapSeed);
    session.connect({ name: 'a', homeLoop: true });
    const sim = session.sim;
    session.requestRestart();
    expect(session.sim).toBe(sim);
    expect(welcomes).toHaveLength(1);
    session.disconnect();
  });

  it('says what difficulty it plays, as a server does', () => {
    const session = new LocalSession();
    const welcomes: unknown[] = [];
    session.onWelcome = (packet) => welcomes.push(packet.difficulty);
    session.connect({ name: 'a', difficulty: 'lights_out' });
    expect(welcomes).toEqual(['lights_out']);
    session.disconnect();
  });

  it('still starts a fresh city on a restart with home off', () => {
    const session = new LocalSession();
    session.connect({ name: 'a' });
    const sim = session.sim;
    session.requestRestart();
    expect(session.sim).not.toBe(sim);
    session.disconnect();
  });
});
