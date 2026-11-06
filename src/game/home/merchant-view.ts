// What a merchant's screen shows, from the home state alone.

import type { MerchantId } from '../../../shared/home-protocol.ts';
import { shopContext } from '../home-hud.ts';
import type { HomeUi } from '../home-hud.ts';
import { MERCHANTS, itemOf } from './merchant-data.ts';
import { buy, shopRows } from './shop.ts';

export interface MerchantLine {
  item: string;
  label: string;
  price: number;
  /** Infinity for what is always on the shelf. */
  stock: number;
  /** The sale would go through right now. */
  canBuy: boolean;
}

export interface MerchantView {
  name: string;
  role: string;
  greeting: string;
  silver: number;
  lines: MerchantLine[];
}

const GREETING_STRIDE = 7;

/** One line from the short list, held for a given save so it does not change under the player's eyes. */
function greetingFor(merchant: MerchantId, seed: number): string {
  const { greetings } = MERCHANTS[merchant];
  return greetings[(seed + merchant.length * GREETING_STRIDE) % greetings.length];
}

export function merchantView(home: HomeUi, merchant: MerchantId): MerchantView {
  const { name, role } = MERCHANTS[merchant];
  const { save } = home;
  const context = shopContext(home);
  const lines = (save ? shopRows(save, merchant, context) : []).map((row) => ({
    ...row,
    label: itemOf(merchant, row.item)?.label ?? row.item,
    canBuy: save !== null && buy(save, merchant, row.item, context) !== null,
  }));
  return { name, role, greeting: greetingFor(merchant, save?.shop.seed ?? 0), silver: save?.silver ?? 0, lines };
}
