// The merchants' stock and sales, as pure steps over a save. The merchants lane fills the stubs here.

import type { DifficultyId } from '../../../shared/difficulty.ts';
import { MERCHANT_IDS } from '../../../shared/home-protocol.ts';
import type { MerchantId, StationId } from '../../../shared/home-protocol.ts';
import type { HomeSave } from './home-store.ts';

export interface MerchantStock {
  /** How many of each item are left, by item id. */
  items: Record<string, number>;
}

export interface ShopState {
  /** A random value kept in the save, so saves differ and reloading cannot reroll. */
  seed: number;
  /** Rolls so far, mixed with the seed. */
  rolls: number;
  merchants: Record<MerchantId, MerchantStock>;
}

/** What a sale depends on beyond the save. */
export interface ShopContext {
  /** The player's own highest level, which the level gates read. */
  highest: number;
  /** Buying is refused unless this is the merchant. */
  station: StationId | null;
  /** Boxes scale with it. */
  difficulty: DifficultyId;
}

/** One line on a merchant's screen. */
export interface ShopRow {
  item: string;
  price: number;
  /** How many are left. */
  stock: number;
}

export function emptyShop(seed: number): ShopState {
  const merchants = Object.fromEntries(MERCHANT_IDS.map((id) => [id, { items: {} }])) as Record<MerchantId, MerchantStock>;
  return { seed, rolls: 0, merchants };
}

/** Stub: leaves the stock as it is. */
export function rollStock(save: HomeSave): HomeSave {
  return save;
}

/** Stub: refuses every sale. */
export function buy(save: HomeSave, merchant: MerchantId, item: string, context: ShopContext): HomeSave | null {
  return null;
}

/** Stub: lists nothing. */
export function shopRows(save: HomeSave, merchant: MerchantId, context: ShopContext): ShopRow[] {
  return [];
}
