import type { PartCounts } from './gun-upgrade-data.ts';
import { effectOf, STOCK_FIT } from './gun-upgrades.ts';
import type { GunFit } from './gun-upgrades.ts';
import type { PickupType, WeaponId } from './protocol.ts';
import { EFFECT_ORDER, GUN_EFFECTS, KIT_CARRY_CAP, KIT_ORDER } from './round-effect-data.ts';
import type { GunEffect, KitCounts, RoundKitId } from './round-effect-data.ts';
import type { PlayerState } from './sim-state.ts';

export const noKits = (): KitCounts => ({ incendiary: 0, acid: 0, piercing: 0, tranq: 0 });

export const isKitPickup = (type: PickupType): type is RoundKitId => KIT_ORDER.includes(type as RoundKitId);

export const effectOfKit = (kit: RoundKitId): GunEffect => EFFECT_ORDER.find((effect) => GUN_EFFECTS[effect].kit === kit) as GunEffect;

/** False leaves it lying there: the bag holds no more of this kit. */
export function takeKit(p: PlayerState, kit: RoundKitId): boolean {
  const effect = effectOfKit(kit);
  const roomInBag = p.kits[effect] < KIT_CARRY_CAP;
  if (roomInBag) p.kits[effect] += 1;
  return roomInBag;
}

/** A kit of what the gun already fires would be spent for nothing. Anything else goes over what is there. */
export function canFitEffect(kits: Readonly<KitCounts>, fit: GunFit | undefined, effect: GunEffect): boolean {
  return kits[effect] > 0 && effectOf(fit) !== effect;
}

/** Uses the kit, and whatever the gun fired before is gone. False changes nothing. */
export function fitEffect(p: PlayerState, weapon: WeaponId, effect: GunEffect): boolean {
  const gun = p.guns[weapon];
  const fittable = gun !== undefined && canFitEffect(p.kits, gun.fit, effect);
  if (!fittable) return false;
  p.kits[effect] -= 1;
  gun.fit = { ...(gun.fit ?? STOCK_FIT), effect };
  return true;
}

/** Whether a toolkit can take the effect off one gun and put it on the other, which must have none to lose. */
export function canMoveEffect(
  parts: Readonly<PartCounts>,
  from: { readonly weapon: WeaponId; readonly fit: GunFit | undefined },
  to: { readonly weapon: WeaponId; readonly fit: GunFit | undefined },
): boolean {
  const twoGuns = from.weapon !== to.weapon;
  return twoGuns && parts.toolkit > 0 && effectOf(from.fit) !== null && effectOf(to.fit) === null;
}

function withoutEffect(fit: GunFit): GunFit {
  return { ranks: fit.ranks, quirk: fit.quirk };
}

/** Spends a toolkit and moves the effect between two guns the player owns. False changes nothing. */
export function moveEffect(p: PlayerState, from: WeaponId, to: WeaponId): boolean {
  const source = p.guns[from];
  const target = p.guns[to];
  const movable = source && target && canMoveEffect(p.parts, { weapon: from, fit: source.fit }, { weapon: to, fit: target.fit });
  if (!movable) return false;
  const effect = effectOf(source.fit) as GunEffect;
  p.parts.toolkit -= 1;
  source.fit = withoutEffect(source.fit as GunFit);
  target.fit = { ...(target.fit ?? STOCK_FIT), effect };
  return true;
}
