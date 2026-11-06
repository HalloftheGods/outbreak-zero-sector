// The merchants' stock and sales, as pure steps over a save.

import { AMMO_PICKUPS, MEDKIT_MAX, WEAPONS } from '../../../shared/constants.ts';
import { scaleRounds } from '../../../shared/difficulty.ts';
import type { DifficultyId } from '../../../shared/difficulty.ts';
import { PART_CARRY_CAP } from '../../../shared/gun-upgrade-data.ts';
import { MERCHANT_IDS } from '../../../shared/home-protocol.ts';
import type { Loadout, MerchantId, StationId } from '../../../shared/home-protocol.ts';
import { BOTTLE_CARRY } from '../../../shared/bottles.ts';
import { createRng, pick } from '../../../shared/rng.ts';
import type { Rng } from '../../../shared/rng.ts';
import { KIT_CARRY_CAP } from '../../../shared/round-effect-data.ts';
import type { WeaponId } from '../../../shared/protocol.ts';
import type { HomeSave } from './home-store.ts';
import { MERCHANTS, itemOf } from './merchant-data.ts';
import type { ItemDef, MerchantDef } from './merchant-data.ts';

export interface MerchantStock {
  /** How many of each item are left, by item id. Items that are always on the shelf are not listed. */
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
  /** How many are left. Infinity for what is always on the shelf. */
  stock: number;
}

const ROLL_STRIDE = 0x9e3779b1;

export function emptyShop(seed: number): ShopState {
  const merchants = Object.fromEntries(MERCHANT_IDS.map((id) => [id, { items: {} }])) as Record<MerchantId, MerchantStock>;
  return { seed, rolls: 0, merchants };
}

function rollMerchant(def: MerchantDef, rng: Rng): MerchantStock {
  const items: Record<string, number> = {};
  const add = (id: string, count: number) => {
    items[id] = (items[id] ?? 0) + count;
  };
  for (const { id, stock } of def.items) {
    if (stock.kind === 'fixed') add(id, stock.count);
    if (stock.kind === 'chance' && rng() * stock.oneIn < 1) add(id, 1);
  }
  for (const [pool, draws] of Object.entries(def.pools)) {
    const members = def.items.filter(({ stock }) => stock.kind === 'pool' && stock.pool === pool);
    for (let draw = 0; draw < draws; draw++) add(pick(rng, members).id, 1);
  }
  return { items };
}

/** Replaces all stock. Called for a new save and again for each banked trip, never for a death or a quit. */
export function rollStock(save: HomeSave): HomeSave {
  const { seed, rolls } = save.shop;
  const rng = createRng(seed ^ Math.imul(rolls + 1, ROLL_STRIDE));
  const merchants = Object.fromEntries(MERCHANT_IDS.map((id) => [id, rollMerchant(MERCHANTS[id], rng)])) as Record<MerchantId, MerchantStock>;
  return { ...save, shop: { seed, rolls: rolls + 1, merchants } };
}

/** Rounds in one box at this difficulty, as town pickups scale. */
export const boxRounds = (item: ItemDef, difficulty: DifficultyId): number =>
  item.grant.kind === 'ammo' ? scaleRounds(AMMO_PICKUPS[item.grant.ammo].rounds, difficulty) : 0;

const ownsGun = (save: HomeSave, weapon: WeaponId): boolean => weapon in save.locker.guns || weapon in save.hands.guns;

/** Locker and gear in hand together, which is how caps and "own" are counted. */
function held(save: HomeSave, item: ItemDef): number {
  const { locker, hands } = save;
  const { grant } = item;
  if (grant.kind === 'ammo') {
    const { weapon } = AMMO_PICKUPS[grant.ammo];
    return locker.ammoBag[weapon] + hands.ammoBag[weapon];
  }
  if (grant.kind === 'part') return locker.parts[grant.part] + hands.parts[grant.part];
  if (grant.kind === 'kit') return locker.kits[grant.effect] + hands.kits[grant.effect];
  if (grant.kind === 'medkit') return locker.medkits + hands.medkits;
  if (grant.kind === 'bottle') return locker.bottles + hands.bottles;
  if (grant.kind === 'knife') return Number(locker.knife || hands.knife);
  return Number(ownsGun(save, grant.weapon));
}

/** How many of the item fit in a pocket, counting the box as one unit. */
function carryLimit(item: ItemDef): number {
  const { grant } = item;
  if (grant.kind === 'ammo') return WEAPONS[AMMO_PICKUPS[grant.ammo].weapon].reserveCap;
  if (grant.kind === 'part') return PART_CARRY_CAP;
  if (grant.kind === 'kit') return KIT_CARRY_CAP;
  if (grant.kind === 'medkit') return MEDKIT_MAX;
  if (grant.kind === 'bottle') return BOTTLE_CARRY;
  return 1;
}

/** Shown on the screen at all: past its gate, and of use to what the player owns. */
function offered(save: HomeSave, item: ItemDef, context: ShopContext): boolean {
  if (context.highest < (item.gate ?? 0)) return false;
  const { grant } = item;
  if (grant.kind === 'gun') return !ownsGun(save, grant.weapon);
  if (grant.kind === 'ammo') return ownsGun(save, AMMO_PICKUPS[grant.ammo].weapon);
  return true;
}

function stockOf(save: HomeSave, merchant: MerchantId, item: ItemDef): number {
  if (item.stock.kind === 'always') return Infinity;
  return save.shop.merchants[merchant].items[item.id] ?? 0;
}

function fits(save: HomeSave, item: ItemDef, context: ShopContext): boolean {
  const amount = item.grant.kind === 'ammo' ? boxRounds(item, context.difficulty) : 1;
  return held(save, item) + amount <= carryLimit(item);
}

function granted(locker: Loadout, item: ItemDef, context: ShopContext): Loadout {
  const next: Loadout = { ...locker, guns: { ...locker.guns }, ammoBag: { ...locker.ammoBag }, parts: { ...locker.parts }, kits: { ...locker.kits } };
  const { grant } = item;
  if (grant.kind === 'gun') next.guns[grant.weapon] = {};
  if (grant.kind === 'ammo') next.ammoBag[AMMO_PICKUPS[grant.ammo].weapon] += boxRounds(item, context.difficulty);
  if (grant.kind === 'part') next.parts[grant.part] += 1;
  if (grant.kind === 'kit') next.kits[grant.effect] += 1;
  if (grant.kind === 'medkit') next.medkits += 1;
  if (grant.kind === 'bottle') next.bottles += 1;
  if (grant.kind === 'knife') next.knife = true;
  return next;
}

/** The money, the stock and the locker in one new save, or null if the sale is refused. The save in is untouched. */
export function buy(save: HomeSave, merchant: MerchantId, item: string, context: ShopContext): HomeSave | null {
  if (context.station !== merchant || save.openTrip) return null;
  const def = itemOf(merchant, item);
  if (!def || !offered(save, def, context)) return null;
  if (save.silver < def.price || stockOf(save, merchant, def) < 1 || !fits(save, def, context)) return null;
  const shelf = save.shop.merchants[merchant];
  const items = def.stock.kind === 'always' ? shelf.items : { ...shelf.items, [def.id]: stockOf(save, merchant, def) - 1 };
  const merchants = { ...save.shop.merchants, [merchant]: { items } };
  return { ...save, silver: save.silver - def.price, locker: granted(save.locker, def, context), shop: { ...save.shop, merchants } };
}

/** What the screen lists: what is on the shelf this trip and of use to the player. Sold-out lines drop off. */
export function shopRows(save: HomeSave, merchant: MerchantId, context: ShopContext): ShopRow[] {
  return MERCHANTS[merchant].items
    .filter((item) => offered(save, item, context) && stockOf(save, merchant, item) > 0)
    .map((item) => ({ item: item.id, price: item.price, stock: stockOf(save, merchant, item) }));
}
