import { describe, expect, it } from 'vitest';
import { containerLoot } from '../shared/container-loot.ts';
import { DIFFICULTIES } from '../shared/difficulty.ts';
import { ammoKillShare } from '../shared/loot.ts';
import type { PickupType } from '../shared/protocol.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { townWorth } from '../shared/treasure.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import type { HomeSave } from '../src/game/home/home-store.ts';
import { MERCHANTS } from '../src/game/home/merchant-data.ts';
import { boxRounds, buy, rollStock } from '../src/game/home/shop.ts';
import type { ShopContext } from '../src/game/home/shop.ts';
import { SEED, stateOf } from './helpers/sim-harness.ts';

const BOUGHT_SHARE_LIMIT = 0.15;

/** What Sarge's full shelf is worth in killing power, as pickups on a floor. */
function fullShelf(difficulty: ShopContext['difficulty']): { type: PickupType; rounds: number }[] {
  const boxes = MERCHANTS.quartermaster.items.flatMap((item) =>
    item.grant.kind === 'ammo' && item.stock.kind === 'fixed'
      ? Array.from({ length: item.stock.count }, () => ({ type: item.grant.kind === 'ammo' ? item.grant.ammo : 'pistol_ammo', rounds: boxRounds(item, difficulty) }))
      : [],
  );
  return boxes;
}

describe('merchant balance', () => {
  it('bought ammo stays under 15% of the town budget at every difficulty', () => {
    for (const { id } of DIFFICULTIES) {
      const state = stateOf(new GameSimulation({ seed: SEED, difficulty: id }));
      const town = ammoKillShare([...state.pickups, ...containerLoot(state)]);
      const bought = ammoKillShare(fullShelf(id));
      console.info(`${id}: bought ${bought.toFixed(3)} of the population, town ${town.toFixed(3)}, ratio ${(bought / town).toFixed(3)}`);
      expect(bought / town).toBeLessThan(BOUGHT_SHARE_LIMIT);
    }
  }, 60000);

  it('spending soak: a bot buys ammo, then a medkit, then a carbine over 20 trips and reports silver left', () => {
    const TRIPS = 20;
    // A third of a level 1 town's jewels, once smelted: 253 silver.
    const INCOME = Math.round(townWorth(1, false) / 3);
    let save: HomeSave = rollStock({ ...emptySave(11), locker: { ...emptySave(11).locker, guns: { pistol: {} } } });
    const bought: string[] = [];
    for (let trip = 1; trip <= TRIPS; trip++) {
      const highest = Math.min(10, 1 + Math.floor(trip / 2));
      const context = (station: ShopContext['station']): ShopContext => ({ highest, station, difficulty: 'lights_out' });
      save = { ...save, silver: save.silver + INCOME };
      for (const [merchant, item] of [['quartermaster', 'pistol_ammo'], ['medic', 'medkit'], ['gunsmith', 'carbine']] as const) {
        const next = buy(save, merchant, item, context(merchant));
        if (next) {
          save = next;
          bought.push(`${trip}:${item}`);
        }
      }
      // The trip burns the rounds and the medkit, and a banked trip rolls the shelves again.
      save = rollStock({ ...save, locker: { ...save.locker, ammoBag: { pistol: 0, carbine: 0, shotgun: 0 }, medkits: 0 } });
    }
    console.info(`spending soak: bought ${bought.join(' ')}; silver left ${save.silver}`);
    expect(save.silver).toBeGreaterThanOrEqual(0);
  });
});
