// What a player keeps between trips, and the one way to write it.

import type { DifficultyId } from '../../../shared/difficulty.ts';
import type { Jewels, Loadout } from '../../../shared/home-protocol.ts';
import { emptyLoadout } from '../../../shared/loadout.ts';
import { emptyShop } from './shop.ts';
import type { ShopState } from './shop.ts';

export type SaveResult = { kind: 'saved'; version: number } | { kind: 'conflict' } | { kind: 'failed'; reason: string };

/** Every write goes through `save()`, so a version check can catch a second tab. */
export interface HomeStore {
  load(): Promise<HomeSave>;
  save(next: HomeSave): Promise<SaveResult>;
}

export interface HomeSave {
  version: number;
  silver: number;
  rawJewels: Jewels;
  locker: Loadout;
  /** Taken out of the locker and still safe, until a trip opens. */
  hands: Loadout;
  openTrip: OpenTrip | null;
  /** `${simId}:${serial}` of every receipt credited, written in the same save as the credit. */
  appliedReceipts: readonly string[];
  ledger: readonly TripRecord[];
  shop: ShopState;
}

/** Written before a player counts as ready. Still here on load, it is a trip that never came home. */
export interface OpenTrip {
  level: number;
  mode: 'solo' | 'coop';
  /** A trip that never came home has no receipt, so its ledger row reads this instead. */
  difficulty: DifficultyId;
  startedAt: number;
}

export interface TripRecord {
  level: number;
  outcome: 'banked' | 'died';
  difficulty: DifficultyId;
  silver: number;
  jewels: Jewels;
  replay: boolean;
  at: number;
}

/** A first save with nothing in it, before `rollStock` has filled the shops. */
export function emptySave(shopSeed: number): HomeSave {
  return {
    version: 0,
    silver: 0,
    rawJewels: { small: 0, large: 0 },
    locker: emptyLoadout(),
    hands: emptyLoadout(),
    openTrip: null,
    appliedReceipts: [],
    ledger: [],
    shop: emptyShop(shopSeed),
  };
}
