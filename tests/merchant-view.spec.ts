import { describe, expect, it } from 'vitest';
import { emptySave } from '../src/game/home/home-store.ts';
import { merchantView } from '../src/game/home/merchant-view.ts';
import { rollStock } from '../src/game/home/shop.ts';
import type { HomeUi } from '../src/game/home-hud.ts';

function homeAt(station: HomeUi['station'], silver: number, highest = 1): HomeUi {
  const save = { ...rollStock(emptySave(2)), silver };
  return {
    inBunker: true, station, stationHold: 0, shop: station === 'medic' ? 'medic' : null, ready: false,
    carried: { silver: 0, jewels: { small: 0, large: 0 } }, pickedLevel: null, roomHighest: 1, highest,
    difficulty: 'lights_out', receipt: null, save, forgeProgress: 0, saveError: null, death: null,
  };
}

describe('merchant view', () => {
  it('lists the shelf and marks what the player can buy now', () => {
    const rich = merchantView(homeAt('medic', 100), 'medic');
    expect(rich.lines).toEqual([{ item: 'medkit', label: 'Medkit', price: 60, stock: 2, canBuy: true }]);
    expect(rich.name).toBe('Doc');
    expect(merchantView(homeAt('medic', 10), 'medic').lines[0].canBuy).toBe(false);
  });

  it('cannot buy when the station is another', () => {
    expect(merchantView(homeAt('gunsmith', 100), 'medic').lines[0].canBuy).toBe(false);
  });

  it('holds one greeting for a save and shows an empty shelf before the save loads', () => {
    const home = homeAt('medic', 100);
    expect(merchantView(home, 'medic').greeting).toBe(merchantView(home, 'medic').greeting);
    expect(merchantView({ ...home, save: null }, 'medic').lines).toEqual([]);
  });
});
