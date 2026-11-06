// The Home Loop's vocabulary: what crosses the sim/client boundary for the bunker, a trip and
// the van. Pure data, types and small checks, so it loads in the browser, Node and vitest alike.

import type { DifficultyId } from './difficulty.ts';
import type { PartCounts } from './gun-upgrade-data.ts';
import type { GunFit } from './gun-upgrades.ts';
import type { WeaponId, WorldMap } from './protocol.ts';
import type { KitCounts } from './round-effect-data.ts';

/** The one switch. Off, players see nothing of any of this. */
export const HOME_LOOP_LIVE = false;

/** The bunker is a map like any other, reached by a seed no town can have. */
export const BUNKER_SEED = -1;
/** `sim.level` in the bunker, which clamps to level 1's look and triggers no town rule. */
export const BUNKER_LEVEL = 0;

export const MERCHANT_IDS = ['gunsmith', 'quartermaster', 'medic', 'powder'] as const;
export type MerchantId = (typeof MERCHANT_IDS)[number];

export const STATION_IDS = ['bench', 'forge', 'locker', 'level_map', 'jukebox', ...MERCHANT_IDS] as const;
export type StationId = (typeof STATION_IDS)[number];

export interface Station {
  readonly id: StationId;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface Jewels {
  small: number;
  large: number;
}

/** Gear as it leaves one side for the other: taken out of the locker, or brought home by the van. */
export interface Loadout {
  guns: Partial<Record<WeaponId, { fit?: GunFit }>>;
  ammoBag: Record<WeaponId, number>;
  parts: PartCounts;
  kits: KitCounts;
  medkits: number;
  knife: boolean;
  bottles: number;
}

/** What a player brings to the room. The server checks it is legal, and cannot prove it was earned. */
export interface JoinHome {
  loadout: Loadout;
  highest: number;
  /** Has seen the ending, so clearing the last level is a normal trip. Left off for no. */
  finished?: boolean;
}

export type HomeAction =
  | { kind: 'pick_level'; level: number }
  | { kind: 'equip'; loadout: Loadout }
  /** `ownsGun`: the locker holds a gun, so boarding empty-handed is a choice and no free pistol is issued. Left off for no. */
  | { kind: 'ready'; ready: boolean; ownsGun?: boolean }
  | { kind: 'leave_station' }
  | { kind: 'highest'; highest: number };

/** How a trip ended for one player. State, not an event, so a slow client cannot lose it. */
export interface TripReceipt {
  simId: string;
  serial: number;
  outcome: 'banked' | 'died';
  level: number;
  /** `sim.difficulty`, which the ledger records. */
  difficulty: DifficultyId;
  /** Banked: what to credit. Died: what was lost, for the summary and the ledger, and never credited. */
  silver: number;
  /** As `silver`. */
  jewels: Jewels;
  /** A level below the highest anyone in the room has reached. */
  replay: boolean;
  score: number;
  kills: number;
  hordes: number;
  seconds: number;
  /** The first clear of the last level: the ending plays. */
  ending: boolean;
  /** What came home, or null when nothing did. */
  gear: Loadout | null;
}

/** One player's side of the bunker and the trip, on PlayerEntity. */
export interface HomeView {
  /** Carried on this trip. The bank lives in the browser and never goes on the wire. */
  silver: number;
  jewels: Jewels;
  station: StationId | null;
  /** 0..1 through the hold on E. */
  stationHold: number;
  ready: boolean;
  receipt: TripReceipt | null;
}

/** The room's side, on SnapshotPacket. */
export interface RoomHomeView {
  pickedLevel: number | null;
  roomHighest: number;
}

export const isBunkerSeed = (seed: number): boolean => seed === BUNKER_SEED;

export const isBunkerMap = (map: WorldMap): boolean => isBunkerSeed(map.seed);

export const isMerchantId = (station: StationId): station is MerchantId => MERCHANT_IDS.includes(station as MerchantId);
