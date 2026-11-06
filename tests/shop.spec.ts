import { describe, expect, it } from 'vitest';
import { scaleRounds } from '../shared/difficulty.ts';
import type { DifficultyId } from '../shared/difficulty.ts';
import { MERCHANT_IDS } from '../shared/home-protocol.ts';
import type { MerchantId } from '../shared/home-protocol.ts';
import { emptySave } from '../src/game/home/home-store.ts';
import { createBrowserHomeStore } from '../src/game/home/browser-home-store.ts';
import type { HomeSave } from '../src/game/home/home-store.ts';
import { HomeSync } from '../src/game/home/home-sync.ts';
import { MERCHANTS } from '../src/game/home/merchant-data.ts';
import { buy, rollStock, shopRows } from '../src/game/home/shop.ts';
import type { ShopContext } from '../src/game/home/shop.ts';
import { applyReceipt } from '../src/game/home/trip-ledger.ts';
import type { TripReceipt } from '../shared/home-protocol.ts';

const at = (merchant: MerchantId, overrides: Partial<ShopContext> = {}): ShopContext => ({
  highest: 10,
  station: merchant,
  difficulty: 'lights_out',
  ...overrides,
});

/** A save with the given silver and exactly this stock on one merchant's shelf. */
function stocked(merchant: MerchantId, items: Record<string, number>, silver = 1000): HomeSave {
  const save = rollStock(emptySave(1));
  const merchants = { ...save.shop.merchants, [merchant]: { items } };
  return { ...save, silver, shop: { ...save.shop, merchants } };
}

const withLocker = (save: HomeSave, locker: Partial<HomeSave['locker']>): HomeSave => ({ ...save, locker: { ...save.locker, ...locker } });
const withPistol = (save: HomeSave): HomeSave => withLocker(save, { guns: { pistol: {} } });

/** The browser's storage, in memory, shared by every tab opened on it. */
function memoryStorage(seed: HomeSave, failWrites = false) {
  const data = new Map<string, string>([['outbreak.home', JSON.stringify(seed)]]);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (failWrites) throw new Error('disk full');
      data.set(key, value);
    },
  };
}

type Storage = ReturnType<typeof memoryStorage>;

async function openTab(storage: Storage): Promise<HomeSync> {
  const sync = new HomeSync({ store: createBrowserHomeStore(storage), mode: 'solo', sendHome() {} });
  await sync.open();
  return sync;
}

const storedSave = (storage: Storage): HomeSave => JSON.parse(storage.data.get('outbreak.home') as string);

const death = (serial: number): TripReceipt => ({
  simId: 'sim', serial, outcome: 'died', level: 1, difficulty: 'lights_out', silver: 0, jewels: { small: 0, large: 0 },
  replay: false, score: 0, kills: 0, hordes: 0, seconds: 1, ending: false, gear: null,
});

describe('merchant sales', () => {
  it('prices and level gates match the table', () => {
    const prices: Record<string, number> = {
      pistol: 50, carbine: 300, shotgun: 400, barrel: 120, grip: 120, magazine: 120, suppressor: 200, toolkit: 150,
      pistol_ammo: 10, carbine_ammo: 20, shells: 20, bottle: 5, knife: 100, medkit: 60,
      tranq_kit: 120, acid_kit: 150, piercing_kit: 150, incendiary_kit: 200,
    };
    const listed = MERCHANT_IDS.flatMap((id) => MERCHANTS[id].items);
    expect(Object.fromEntries(listed.map((item) => [item.id, item.price]))).toEqual(prices);

    const gates = { carbine: 2, shotgun: 3, suppressor: 4 };
    for (const [item, level] of Object.entries(gates)) {
      const save = stocked('gunsmith', { suppressor: 1 });
      expect(buy(save, 'gunsmith', item, at('gunsmith', { highest: level - 1 })), `${item} below`).toBeNull();
      expect(buy(save, 'gunsmith', item, at('gunsmith', { highest: level })), `${item} at`).not.toBeNull();
    }
  });

  it('a sale takes money, stock and adds to the locker in one save', () => {
    const save = withPistol(stocked('quartermaster', { pistol_ammo: 2 }));
    const next = buy(save, 'quartermaster', 'pistol_ammo', at('quartermaster'));
    expect(next?.silver).toBe(990);
    expect(next?.shop.merchants.quartermaster.items.pistol_ammo).toBe(1);
    expect(next?.locker.ammoBag.pistol).toBe(8);
    expect(save.silver).toBe(1000);
    expect(save.locker.ammoBag.pistol).toBe(0);
  });

  it('a sale through the store lands once, in the stored save', async () => {
    const storage = memoryStorage(withPistol(stocked('quartermaster', { pistol_ammo: 2 })));
    const tab = await openTab(storage);
    expect(await tab.buy('quartermaster', 'pistol_ammo', at('quartermaster'))).toBe('bought');
    const kept = storedSave(storage);
    expect([kept.silver, kept.locker.ammoBag.pistol, kept.shop.merchants.quartermaster.items.pistol_ammo]).toEqual([990, 8, 1]);
  });

  it('a failed save charges nothing', async () => {
    const storage = memoryStorage(withPistol(stocked('quartermaster', { pistol_ammo: 2 })), true);
    const tab = await openTab(storage);
    expect(await tab.buy('quartermaster', 'pistol_ammo', at('quartermaster'))).toBe('failed');
    expect(tab.saveError).toBe('disk full');
    expect(tab.save?.silver).toBe(1000);
    expect(storedSave(storage).silver).toBe(1000);
  });

  it('a conflict refreshes the shop and does not retry', async () => {
    const storage = memoryStorage(withPistol(stocked('quartermaster', { pistol_ammo: 2 })));
    const first = await openTab(storage);
    const second = await openTab(storage);
    const context = at('quartermaster');
    expect(await second.buy('quartermaster', 'pistol_ammo', context)).toBe('bought');
    expect(await first.buy('quartermaster', 'pistol_ammo', context)).toBe('conflict');
    // The losing tab now shows the winner's shelf, and the shelf lost one box, not two.
    expect(first.save?.shop.merchants.quartermaster.items.pistol_ammo).toBe(1);
    expect(first.save?.silver).toBe(990);
    expect(storedSave(storage).silver).toBe(990);
  });

  it('a refused sale never reaches the store', async () => {
    const storage = memoryStorage(stocked('medic', { medkit: 1 }, 10));
    const tab = await openTab(storage);
    const before = storage.data.get('outbreak.home');
    expect(await tab.buy('medic', 'medkit', at('medic'))).toBe('refused');
    expect(storage.data.get('outbreak.home')).toBe(before);
  });

  it('ten empty quit-trips leave stock unchanged, and a banked trip rolls it once', () => {
    const start = rollStock(emptySave(21));
    const afterQuits = Array.from({ length: 10 }, (_, index) => death(index + 1)).reduce(applyReceipt, start);
    expect(afterQuits.shop).toEqual(start.shop);
    const banked = applyReceipt(afterQuits, { ...death(11), outcome: 'banked' });
    expect(banked.shop.rolls).toBe(start.shop.rolls + 1);
  });

  it('stock survives a reload through the store', async () => {
    const storage = memoryStorage(withPistol(stocked('quartermaster', { pistol_ammo: 2 })));
    const tab = await openTab(storage);
    await tab.buy('quartermaster', 'pistol_ammo', at('quartermaster'));
    const reloaded = await openTab(storage);
    expect(reloaded.save?.shop).toEqual(tab.save?.shop);
    expect(shopRows(reloaded.save as HomeSave, 'quartermaster', at('quartermaster')).find((row) => row.item === 'pistol_ammo')?.stock).toBe(1);
  });

  it('a cap counts locker and gear in hand', () => {
    const save = withPistol(stocked('quartermaster', { pistol_ammo: 2 }));
    const held = (locker: number, hands: number): HomeSave => ({
      ...withLocker(save, { ammoBag: { pistol: locker, carbine: 0, shotgun: 0 } }),
      hands: { ...save.hands, ammoBag: { pistol: hands, carbine: 0, shotgun: 0 } },
    });
    const context = at('quartermaster');
    expect(buy(held(30, 22), 'quartermaster', 'pistol_ammo', context)).not.toBeNull();
    expect(buy(held(30, 23), 'quartermaster', 'pistol_ammo', context)).toBeNull();

    const medics = stocked('medic', { medkit: 2 });
    const twoAndOne = { ...withLocker(medics, { medkits: 2 }), hands: { ...medics.hands, medkits: 1 } };
    expect(buy(twoAndOne, 'medic', 'medkit', at('medic'))).toBeNull();
  });

  it('a box is refused at 56 of 60 rounds', () => {
    const save = withLocker(withPistol(stocked('quartermaster', { pistol_ammo: 2 })), { ammoBag: { pistol: 56, carbine: 0, shotgun: 0 } });
    expect(buy(save, 'quartermaster', 'pistol_ammo', at('quartermaster'))).toBeNull();
    const roomy = withLocker(save, { ammoBag: { pistol: 52, carbine: 0, shotgun: 0 } });
    expect(buy(roomy, 'quartermaster', 'pistol_ammo', at('quartermaster'))?.locker.ammoBag.pistol).toBe(60);
  });

  it('a gun you own is not offered, and a bought gun comes empty', () => {
    const save = stocked('gunsmith', {});
    const context = at('gunsmith');
    const bought = buy(save, 'gunsmith', 'carbine', context);
    expect(bought?.locker.guns.carbine).toEqual({});
    expect(bought?.locker.ammoBag.carbine).toBe(0);
    expect(shopRows(bought as HomeSave, 'gunsmith', context).map((row) => row.item)).not.toContain('carbine');
    expect(buy(bought as HomeSave, 'gunsmith', 'carbine', context)).toBeNull();

    const inHand = { ...save, hands: { ...save.hands, guns: { shotgun: {} } } };
    expect(shopRows(inHand, 'gunsmith', context).map((row) => row.item)).not.toContain('shotgun');
  });

  it('a roll replaces all stock, and stock survives a reload', () => {
    const save = stocked('quartermaster', { bottle: 99 });
    const rolled = rollStock(save);
    expect(rolled.shop.merchants.quartermaster.items.bottle).toBe(3);
    expect(rolled.shop.rolls).toBe(save.shop.rolls + 1);
    expect(JSON.parse(JSON.stringify(rolled)).shop).toEqual(rolled.shop);
  });

  it('a roll follows the table', () => {
    for (let seed = 1; seed < 40; seed++) {
      const { merchants } = rollStock(emptySave(seed)).shop;
      expect(merchants.quartermaster.items).toEqual({ pistol_ammo: 2, carbine_ammo: 2, shells: 1, bottle: 3, knife: 1 });
      expect(merchants.medic.items).toEqual({ medkit: 2 });
      const kits = Object.values(merchants.powder.items).reduce((sum, count) => sum + count, 0);
      expect(kits).toBe(2);
      const gunsmith = merchants.gunsmith.items;
      const parts = (gunsmith.barrel ?? 0) + (gunsmith.grip ?? 0) + (gunsmith.magazine ?? 0);
      expect(parts).toBe(2);
    }
  });

  it('saves roll different stock', () => {
    const shelves = new Set(Array.from({ length: 30 }, (_, seed) => JSON.stringify(rollStock(emptySave(seed + 1)).shop.merchants)));
    expect(shelves.size).toBeGreaterThan(5);
    const rerolled = Array.from({ length: 30 }, (_, seed) => JSON.stringify(rollStock(rollStock(emptySave(seed + 1))).shop.merchants));
    expect(new Set(rerolled).size).toBeGreaterThan(5);
  });

  it('box rounds scale with difficulty', () => {
    const rounds = (difficulty: DifficultyId): number | undefined =>
      buy(withPistol(stocked('quartermaster', { pistol_ammo: 2 })), 'quartermaster', 'pistol_ammo', at('quartermaster', { difficulty }))?.locker.ammoBag.pistol;
    expect(rounds('lights_out')).toBe(8);
    expect(rounds('night_light')).toBe(scaleRounds(8, 'night_light'));
    expect(rounds('undead_tired')).toBe(scaleRounds(8, 'undead_tired'));
    expect(rounds('undead_tired')).toBeLessThan(rounds('lights_out') as number);
  });

  it('boxes are rolled always and hidden if you own no such gun', () => {
    const { quartermaster } = rollStock(emptySave(3)).shop.merchants;
    expect(quartermaster.items.carbine_ammo).toBe(2);
    const bare = rollStock(emptySave(3));
    const context = at('quartermaster');
    expect(shopRows(bare, 'quartermaster', context).map((row) => row.item)).toEqual(['bottle', 'knife']);
    expect(buy({ ...bare, silver: 500 }, 'quartermaster', 'carbine_ammo', context)).toBeNull();
    const armed = withLocker(bare, { guns: { carbine: {}, pistol: {} } });
    expect(shopRows(armed, 'quartermaster', context).map((row) => row.item)).toEqual(['pistol_ammo', 'carbine_ammo', 'bottle', 'knife']);
  });

  it('buy is refused unless context.station is that merchant and no trip is open', () => {
    const save = stocked('medic', { medkit: 2 });
    expect(buy(save, 'medic', 'medkit', at('medic'))).not.toBeNull();
    expect(buy(save, 'medic', 'medkit', at('medic', { station: 'gunsmith' }))).toBeNull();
    expect(buy(save, 'medic', 'medkit', at('medic', { station: null }))).toBeNull();
    const out = { ...save, openTrip: { level: 1, mode: 'solo' as const, difficulty: 'lights_out' as const, startedAt: 0 } };
    expect(buy(out, 'medic', 'medkit', at('medic'))).toBeNull();
  });

  it('refuses what you cannot afford or the shelf lacks', () => {
    expect(buy(stocked('medic', { medkit: 2 }, 59), 'medic', 'medkit', at('medic'))).toBeNull();
    expect(buy(stocked('medic', { medkit: 0 }), 'medic', 'medkit', at('medic'))).toBeNull();
    expect(buy(stocked('medic', { medkit: 2 }), 'medic', 'nothing', at('medic'))).toBeNull();
    expect(shopRows(stocked('medic', { medkit: 0 }), 'medic', at('medic'))).toEqual([]);
  });
});
