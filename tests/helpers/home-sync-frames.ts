// A HomeSync over a store and hand-built frames, for the specs that watch what it saves and says.

import { BUNKER_SEED } from '../../shared/home-protocol.ts';
import type { HomeAction, HomeView, TripReceipt } from '../../shared/home-protocol.ts';
import { TICK_RATE } from '../../shared/constants.ts';
import { emptyLoadout } from '../../shared/loadout.ts';
import type { PlayerEntity, SnapshotPacket } from '../../shared/protocol.ts';
import { emptySave } from '../../src/game/home/home-store.ts';
import type { HomeSave, HomeStore, OpenTrip, SaveResult } from '../../src/game/home/home-store.ts';
import { HomeSync } from '../../src/game/home/home-sync.ts';

export const ME = 'me';
export const TOWN_SEED = 4242;
export const VAN = { x: 500, y: 500, progress: 0 };

export const QUIET: HomeView = { silver: 0, jewels: { small: 0, large: 0 }, station: null, stationHold: 0, ready: false, receipt: null, overrun: null };

export const entity = (patch: Partial<PlayerEntity> = {}): PlayerEntity => ({
  id: ME, name: 'ANA', skin: 0, x: 1, y: 2, angle: 0, moving: false, status: 'alive',
  health: 100, maxHealth: 100, weapon: 'pistol', ammo: 0, magSize: 12, reserve: 0,
  owned: [], ammoBag: { pistol: 0, carbine: 0, shotgun: 0 }, mags: { pistol: 0, carbine: 0, shotgun: 0 },
  medkits: 0, indoors: null,
  reload: 0, bleedout: 0, revive: 0, score: 0, kills: 0, lastInputSeq: 3, knife: false, search: 0,
  home: QUIET, ...patch,
});

export interface FrameOptions {
  readonly tick?: number;
  readonly mapSeed?: number;
  readonly level?: number;
  readonly picked?: number | null;
  readonly player?: Partial<PlayerEntity>;
  readonly home?: Partial<HomeView>;
}

export function frame({ tick = 100, mapSeed = BUNKER_SEED, level = 0, picked = null, player, home }: FrameOptions = {}): SnapshotPacket {
  return {
    type: 'snapshot', tick, phase: 'intermission', level, mapSeed, wave: 0, intermission: 0, hostiles: 0,
    players: [entity({ ...player, home: { ...QUIET, ...home } })], zombies: [], bullets: [], pickups: [], exit: VAN,
    openedContainers: [], events: [], gameOver: null, home: { pickedLevel: picked, roomHighest: 3 },
  };
}

export const atVan = { x: VAN.x, y: VAN.y };
export const inTown = { mapSeed: TOWN_SEED, level: 2 };

export const receipt = (patch: Partial<TripReceipt> = {}): TripReceipt => ({
  simId: 'sim-a', serial: 1, outcome: 'banked', level: 2, difficulty: 'stay_close', silver: 50, jewels: { small: 0, large: 0 },
  replay: false, score: 10, kills: 1, hordes: 1, seconds: 60, ending: false, gear: null, ...patch,
});

export const trip = (patch: Partial<OpenTrip> = {}): OpenTrip => ({ level: 2, mode: 'solo', difficulty: 'stay_close', startedAt: 1, ...patch });

/** A store over one shared slot, as two tabs see one localStorage, with the next results scripted when a test needs them. */
export function sharedStore(initial: Partial<HomeSave> = {}) {
  const slot: { save: HomeSave } = { save: { ...emptySave(7), ...initial } };
  const scripted: SaveResult[] = [];
  const store: HomeStore = {
    load: async () => slot.save,
    async save(next) {
      const forced = scripted.shift();
      if (forced) return forced;
      const stale = next.version !== slot.save.version;
      if (stale) return { kind: 'conflict' };
      const version = next.version + 1;
      slot.save = { ...next, version };
      return { kind: 'saved', version };
    },
  };
  return { slot, scripted, store };
}

export function syncOver(store: HomeStore, mode: 'solo' | 'coop' = 'solo') {
  const sent: HomeAction[] = [];
  const credited: TripReceipt[] = [];
  const sync = new HomeSync({ store, mode, sendHome: (action) => sent.push(action), onReceipt: (r) => credited.push(r) });
  return { sync, sent, credited };
}

export async function opened(store: HomeStore, mode: 'solo' | 'coop' = 'solo') {
  const parts = syncOver(store, mode);
  await parts.sync.open();
  parts.sync.welcomed({ type: 'welcome', yourId: ME, tickRate: TICK_RATE, mapSeed: BUNKER_SEED, difficulty: 'stay_close' });
  await parts.sync.settled();
  return parts;
}

export async function see(sync: HomeSync, ...frames: SnapshotPacket[]): Promise<void> {
  for (const next of frames) {
    sync.observe(next, ME);
    await sync.settled();
  }
}

export const readyCalls = (sent: readonly HomeAction[]) => sent.filter((action) => action.kind === 'ready');
export const equipCalls = (sent: readonly HomeAction[]) => sent.filter((action) => action.kind === 'equip');

export const lockerGuns = { ...emptyLoadout(), guns: { pistol: {}, carbine: {} }, ammoBag: { pistol: 10, carbine: 40, shotgun: 0 } };
export const holdingCarbine = { ...atVan, weapon: 'carbine', owned: ['carbine'], ammoBag: { pistol: 0, carbine: 40, shotgun: 0 } } as Partial<PlayerEntity>;
export const fitted = { ranks: { }, quirk: null, effect: 'acid' } as const;
