import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../shared/constants.ts';
import { GUN_SLOTS, UPGRADES } from '../shared/gun-upgrade-data.ts';
import { BAR_SLOTS, gunBars, gunSlots, upgradeParts } from '../src/game/bench-view.ts';

const bar = (bars: ReturnType<typeof gunBars>, label: string) => bars.find((each) => each.label === label);

describe('the bench column bars', () => {
  it('scales a stock gun against the best stock gun at each stat, with nothing gained', () => {
    const bars = gunBars('pistol', undefined);
    expect(bars.map((each) => each.label)).toEqual(['Damage', 'Fire rate', 'Magazine', 'Reload', 'Quiet']);
    expect(bar(bars, 'Damage')).toMatchObject({ value: `${WEAPONS.pistol.damage}`, filled: 1, gained: 0, changed: false });
    expect(bar(bars, 'Reload')).toMatchObject({ value: '1.1s', filled: BAR_SLOTS });
    expect(bar(bars, 'Quiet')).toMatchObject({ value: '100% noise', filled: BAR_SLOTS });
    expect(bars.every((each) => each.filled >= 1 && each.filled <= BAR_SLOTS)).toBe(true);
  });

  it('lights the cells the work adds, and marks the number it moved', () => {
    const full = UPGRADES.magazine.maxRank;
    const mag = bar(gunBars('pistol', { ranks: { magazine: full }, quirk: null }), 'Magazine');
    const size = Math.round(WEAPONS.pistol.magSize * (1 + full * UPGRADES.magazine.gain));
    expect(mag).toMatchObject({ value: `${size}`, filled: 4, gained: 2, changed: true });
  });

  it('reads a suppressor as a quieter gun, and a shotgun by its pellets', () => {
    const bars = gunBars('shotgun', { ranks: { suppressor: 1 }, quirk: null });
    expect(bar(bars, 'Quiet')).toMatchObject({ value: '35% noise', filled: BAR_SLOTS, gained: 2 });
    expect(bar(bars, 'Damage')?.value).toBe(`${WEAPONS.shotgun.damage}x${WEAPONS.shotgun.pellets}`);
  });

  it('never lights fewer than one cell or more than the bar holds', () => {
    const bars = gunBars('carbine', { ranks: { damage: 3 }, quirk: 'hot_loads' });
    expect(bars.every((each) => each.filled >= 1 && each.filled <= BAR_SLOTS && each.gained <= each.filled)).toBe(true);
  });
});

describe('the bench column slots', () => {
  it('lists a slot per rank in upgrade order, then the empty ones', () => {
    expect(gunSlots('pistol', { ranks: { reload: 1, damage: 1 }, quirk: null })).toEqual(['damage', 'reload', null]);
    expect(gunSlots('carbine', undefined)).toEqual(Array.from({ length: GUN_SLOTS.carbine }, () => null));
  });

  it('names the parts a rank takes', () => {
    expect(upgradeParts('reload')).toEqual(['grip', 'magazine']);
    expect(upgradeParts('suppressor')).toEqual(['suppressor']);
  });
});
