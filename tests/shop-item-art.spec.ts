import { describe, expect, it } from 'vitest';
import { buildBottle, buildPickupIcons, buildWeaponIcons } from '../src/art/fx/icons.ts';
import { MERCHANTS } from '../src/game/home/merchant-data.ts';
import { itemSprite } from '../src/game/home/shop-item-art.ts';

const icons = { weaponIcons: buildWeaponIcons(), pickupIcons: buildPickupIcons(), bottle: buildBottle() };
const everyItem = Object.values(MERCHANTS).flatMap((merchant) => merchant.items);

describe('shop item art', () => {
  it('draws every item any merchant sells with an icon from the art book', () => {
    const known = new Set([...Object.values(icons.weaponIcons), ...Object.values(icons.pickupIcons), icons.bottle]);
    for (const item of everyItem) expect(known.has(itemSprite(icons, item.grant)), item.id).toBe(true);
  });

  it('uses the HUD icon for guns and the bottle, and the pickup for the rest', () => {
    expect(itemSprite(icons, { kind: 'gun', weapon: 'carbine' })).toBe(icons.weaponIcons.carbine);
    expect(itemSprite(icons, { kind: 'bottle' })).toBe(icons.bottle);
    expect(itemSprite(icons, { kind: 'ammo', ammo: 'shells' })).toBe(icons.pickupIcons.shells);
    expect(itemSprite(icons, { kind: 'part', part: 'suppressor' })).toBe(icons.pickupIcons.suppressor);
    expect(itemSprite(icons, { kind: 'kit', effect: 'incendiary' })).toBe(icons.pickupIcons.incendiary_kit);
    expect(itemSprite(icons, { kind: 'medkit' })).toBe(icons.pickupIcons.medkit);
    expect(itemSprite(icons, { kind: 'knife' })).toBe(icons.pickupIcons.knife);
  });

  it('gives no two different items on one shelf the same icon', () => {
    for (const merchant of Object.values(MERCHANTS)) {
      const sprites = merchant.items.map((item) => itemSprite(icons, item.grant));
      expect(new Set(sprites).size, merchant.id).toBe(sprites.length);
    }
  });
});
