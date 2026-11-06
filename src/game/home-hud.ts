// The home side of the Vue-facing state, and the commands the home screens call.

import { BASELINE_DIFFICULTY } from '../../shared/difficulty.ts';
import type { DifficultyId } from '../../shared/difficulty.ts';
import { isBunkerSeed, isMerchantId } from '../../shared/home-protocol.ts';
import type { Jewels, Loadout, MerchantId, StationId, TripReceipt } from '../../shared/home-protocol.ts';
import { FIRST_LEVEL } from '../../shared/levels.ts';
import type { PlayerEntity, SnapshotPacket } from '../../shared/protocol.ts';
import type { HomeSave } from './home/home-store.ts';
import type { ShopContext } from './home/shop.ts';

/** What a death cost, held on screen until the player wakes. */
export interface HomeDeath {
  readonly receipt: TripReceipt;
  /** The gear that went with them. */
  readonly lost: Loadout;
}

export interface HomeUi {
  /** In the bunker, not out on a trip. */
  readonly inBunker: boolean;
  /** The station this player has open. */
  readonly station: StationId | null;
  /** 0..1 through the hold on E. */
  readonly stationHold: number;
  /** The merchant whose shop is open. Follows `station`, so it shuts the moment the station clears. */
  readonly shop: MerchantId | null;
  readonly ready: boolean;
  /** Treasure in hand on this trip. */
  readonly carried: { readonly silver: number; readonly jewels: Jewels };
  readonly pickedLevel: number | null;
  /** The highest level anyone in the room can pick. */
  readonly roomHighest: number;
  /** This player's own highest level, which the shop's gates read. */
  readonly highest: number;
  readonly difficulty: DifficultyId;
  readonly receipt: TripReceipt | null;
  /** The save as last read, or null until it has loaded. */
  readonly save: HomeSave | null;
  /** 0..1 through the jewel on the forge. */
  readonly forgeProgress: number;
  /** Why the last save did not land, or null if it did. */
  readonly saveError: string | null;
  readonly death: HomeDeath | null;
}

/** What the home screens can ask for. Results come back through `UiState.home`. */
export interface HomeActions {
  pickLevel(level: number): void;
  equip(loadout: Loadout): void;
  closeStation(): void;
  smelt(): void;
  /** Builds its `ShopContext` from `UiState.home` with `shopContext`, so a screen never has to. */
  buy(merchant: MerchantId, item: string): void;
  wake(): void;
  continueFromEnding(): void;
}

/** Stubs until the client-run lane wires each to the store and the transport. */
export const NO_HOME_ACTIONS: HomeActions = {
  pickLevel() {},
  equip() {},
  closeStation() {},
  smelt() {},
  buy() {},
  wake() {},
  continueFromEnding() {},
};

/** What this client knows that no snapshot carries: from the store, its level progress and the welcome. */
export interface HomeFacts {
  readonly save: HomeSave | null;
  readonly highest: number;
  readonly difficulty: DifficultyId;
}

/** Until the client-run lane reads the real ones. */
const NO_HOME_FACTS: HomeFacts = { save: null, highest: FIRST_LEVEL, difficulty: BASELINE_DIFFICULTY };

export function shopContext(home: HomeUi): ShopContext {
  const { highest, station, difficulty } = home;
  return { highest, station, difficulty };
}

/** Null outside home mode, which is how every screen tells the two games apart once a run is on. */
export function homeUi(snapshot: SnapshotPacket, local: PlayerEntity, facts: HomeFacts = NO_HOME_FACTS): HomeUi | null {
  const { home } = local;
  if (!home) return null;
  const { station } = home;
  const atStall = station !== null && isMerchantId(station);
  return {
    inBunker: isBunkerSeed(snapshot.mapSeed),
    station,
    stationHold: home.stationHold,
    shop: atStall ? station : null,
    ready: home.ready,
    carried: { silver: home.silver, jewels: home.jewels },
    pickedLevel: snapshot.home?.pickedLevel ?? null,
    roomHighest: snapshot.home?.roomHighest ?? FIRST_LEVEL,
    highest: facts.highest,
    difficulty: facts.difficulty,
    receipt: home.receipt,
    save: facts.save,
    forgeProgress: 0,
    saveError: null,
    death: null,
  };
}
