// What a merchant's screen shows, from the home state alone.

import type { MerchantId } from '../../../shared/home-protocol.ts';
import { shopContext } from '../home-hud.ts';
import type { HomeUi } from '../home-hud.ts';
import type { HomeSave } from './home-store.ts';
import { MERCHANTS, itemOf } from './merchant-data.ts';
import type { ItemGrant } from './merchant-data.ts';
import { buy, shopRows } from './shop.ts';
import type { ShopContext, ShopRow } from './shop.ts';

export interface MerchantLine {
  item: string;
  label: string;
  price: number;
  /** Infinity for what is always on the shelf. */
  stock: number;
  /** What buying it puts in the locker, which picks its icon and its facts. */
  grant: ItemGrant;
  /** The sale would go through right now. */
  canBuy: boolean;
  /** Why it would not, for the line under Buy; null when it would. */
  refusal: string | null;
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

/**
 * Says why `buy` turned a line down. Lines are only listed past their gate and while in stock,
 * so what is left is the counter, the silver, or a full pocket.
 */
function refusalOf(save: HomeSave, merchant: MerchantId, row: ShopRow, context: ShopContext): string | null {
  const sells = buy(save, merchant, row.item, context) !== null;
  if (sells) return null;
  const away = Boolean(save.openTrip);
  const offCounter = context.station !== merchant;
  const short = save.silver < row.price;
  if (away) return 'Not while out on a trip';
  if (offCounter) return 'Step up to the counter';
  if (short) return 'Not enough silver';
  return 'You carry all you can';
}

export function merchantView(home: HomeUi, merchant: MerchantId): MerchantView {
  const { name, role } = MERCHANTS[merchant];
  const { save } = home;
  const context = shopContext(home);
  const lines = (save ? shopRows(save, merchant, context) : []).flatMap((row) => {
    const def = itemOf(merchant, row.item);
    const listed = save !== null && def !== undefined;
    if (!listed) return [];
    const refusal = refusalOf(save, merchant, row, context);
    return [{ ...row, label: def.label, grant: def.grant, canBuy: refusal === null, refusal }];
  });
  return { name, role, greeting: greetingFor(merchant, save?.shop.seed ?? 0), silver: save?.silver ?? 0, lines };
}
