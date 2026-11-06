// The two halves of what a player owns, locker and hands, and moving gear between them.

import type { Loadout } from '../../../shared/home-protocol.ts';
import type { HomeSave } from './home-store.ts';

type Counts<K extends string> = Record<K, number>;

function combine<K extends string>(from: Counts<K>, other: Counts<K>, sign: 1 | -1): Counts<K> {
  const keys = Object.keys(from) as K[];
  return Object.fromEntries(keys.map((key) => [key, Math.max(0, from[key] + sign * other[key])])) as Counts<K>;
}

function added(a: Loadout, b: Loadout): Loadout {
  return {
    guns: { ...a.guns, ...b.guns },
    ammoBag: combine(a.ammoBag, b.ammoBag, 1),
    parts: combine(a.parts, b.parts, 1),
    kits: combine(a.kits, b.kits, 1),
    medkits: a.medkits + b.medkits,
    knife: a.knife || b.knife,
    bottles: a.bottles + b.bottles,
  };
}

/** Takes what it can: the server may hand back more than this client knew of, such as a free pistol. */
function taken(pool: Loadout, gear: Loadout): Loadout {
  const guns = Object.fromEntries(Object.entries(pool.guns).filter(([weapon]) => !(weapon in gear.guns)));
  return {
    guns,
    ammoBag: combine(pool.ammoBag, gear.ammoBag, -1),
    parts: combine(pool.parts, gear.parts, -1),
    kits: combine(pool.kits, gear.kits, -1),
    medkits: Math.max(0, pool.medkits - gear.medkits),
    knife: pool.knife && !gear.knife,
    bottles: Math.max(0, pool.bottles - gear.bottles),
  };
}

/** The server's word on what is in hand. Only that comes out of the locker, so anything it refused is still there. */
export function settleHands(save: HomeSave, held: Loadout): HomeSave {
  return { ...save, hands: held, locker: taken(added(save.locker, save.hands), held) };
}
