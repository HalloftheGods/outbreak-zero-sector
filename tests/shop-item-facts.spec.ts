import { describe, expect, it } from 'vitest';
import { AMMO_PICKUPS, MEDKIT_HEAL, WEAPONS } from '../shared/constants.ts';
import { scaleRounds } from '../shared/difficulty.ts';
import { MERCHANTS } from '../src/game/home/merchant-data.ts';
import { ITEM_ROWS, ITEM_SLOTS, itemFacts } from '../src/game/home/shop-item-facts.ts';

const everyItem = Object.values(MERCHANTS).flatMap((merchant) => merchant.items);

describe('shop item facts', () => {
  it('fits every item in the column: a note and at most ITEM_ROWS rows', () => {
    for (const item of everyItem) {
      const { note, rows } = itemFacts(item.grant, 'lights_out');
      expect(note.length, item.id).toBeGreaterThan(0);
      expect(rows.length, item.id).toBeGreaterThan(0);
      expect(rows.length, item.id).toBeLessThanOrEqual(ITEM_ROWS);
      for (const row of rows) expect(row.value, `${item.id} ${row.label}`).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it('bars the guns against each other, the best gun at a stat filling every cell', () => {
    const bars = (weapon: 'pistol' | 'carbine' | 'shotgun') => itemFacts({ kind: 'gun', weapon }, 'lights_out').rows;
    expect(bars('carbine').find((row) => row.label === 'Magazine')?.filled).toBe(ITEM_SLOTS);
    expect(bars('carbine').find((row) => row.label === 'Fire rate')?.filled).toBe(ITEM_SLOTS);
    expect(bars('shotgun').find((row) => row.label === 'Damage')?.value).toBe(`${WEAPONS.shotgun.damage}x${WEAPONS.shotgun.pellets}`);
    for (const row of bars('pistol')) expect(row.filled).toBeGreaterThanOrEqual(1);
  });

  it('counts an ammo box at the difficulty, as the sale does', () => {
    const box = (difficulty: 'lights_out' | 'night_light') =>
      itemFacts({ kind: 'ammo', ammo: 'pistol_ammo' }, difficulty).rows.find((row) => row.label === 'Box')?.value;
    expect(box('lights_out')).toBe(`${scaleRounds(AMMO_PICKUPS.pistol_ammo.rounds, 'lights_out')} rounds`);
    expect(box('night_light')).toBe(`${scaleRounds(AMMO_PICKUPS.pistol_ammo.rounds, 'night_light')} rounds`);
  });

  it('reads the medkit and parts off the game tables', () => {
    expect(itemFacts({ kind: 'medkit' }, 'lights_out').rows[0].value).toContain(`${MEDKIT_HEAL}`);
    expect(itemFacts({ kind: 'part', part: 'barrel' }, 'lights_out').rows[0]).toEqual({ label: 'Damage', value: '+12%, 3 ranks', filled: null });
    expect(itemFacts({ kind: 'part', part: 'grip' }, 'lights_out').note).toContain('Reload speed also takes a Magazine');
  });
});
