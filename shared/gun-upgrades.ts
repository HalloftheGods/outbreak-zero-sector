import { WEAPONS } from './constants.ts';
import type { WeaponStats } from './constants.ts';
import { GUN_POWER_CAP, GUN_QUIRKS, GUN_SLOTS, PART_CARRY_CAP, PART_ORDER, UPGRADES } from './gun-upgrade-data.ts';
import type { GunQuirk, GunUpgrade, PartCounts, PartId, QuirkDef } from './gun-upgrade-data.ts';
import type { PickupType, WeaponId } from './protocol.ts';
import { EFFECT_ORDER, GUN_EFFECTS } from './round-effect-data.ts';
import type { EffectDef, GunEffect, KitCounts } from './round-effect-data.ts';
import type { PickupState, PlayerState } from './sim-state.ts';

/** What has been done to one gun. Replaced whole, so a snapshot can hold on to it. */
export interface GunFit {
  readonly ranks: Readonly<Partial<Record<GunUpgrade, number>>>;
  readonly quirk: GunQuirk | null;
  /** What its rounds do, apart from its slots. Left off for plain rounds. */
  readonly effect?: GunEffect;
}

/** A player's parts and work, for snapshots. A gun with no entry is stock. */
export interface PlayerGear {
  readonly parts: Readonly<PartCounts>;
  readonly fits: Readonly<Partial<Record<WeaponId, GunFit>>>;
  /** Round kits carried, by the effect each fits. Left off with none. */
  readonly kits?: Readonly<KitCounts>;
}

export const STOCK_FIT: GunFit = { ranks: {}, quirk: null };
const NO_QUIRK: QuirkDef = { label: '', note: '' };
const NO_EFFECT: Pick<EffectDef, 'damage' | 'power'> = { power: 0 };

export const noParts = (): PartCounts => ({ barrel: 0, grip: 0, magazine: 0, suppressor: 0, toolkit: 0 });

export const isPartPickup = (type: PickupType): type is PartId => PART_ORDER.includes(type as PartId);

export const rankOf = (fit: GunFit | undefined, upgrade: GunUpgrade): number => fit?.ranks[upgrade] ?? 0;

export const effectOf = (fit: GunFit | undefined): GunEffect | null => fit?.effect ?? null;

export function slotsUsed(fit: GunFit | undefined): number {
  return Object.values(fit?.ranks ?? {}).reduce((sum, rank) => sum + rank, 0);
}

/** The stats a gun fires with: stock, then its quirk, upgrades and effect, held under the power cap with the effect counted in. */
export function gunStats(weapon: WeaponId, fit: GunFit | undefined): WeaponStats {
  const stock = WEAPONS[weapon];
  if (!fit) return stock;
  const quirk = fit.quirk ? GUN_QUIRKS[fit.quirk] : NO_QUIRK;
  const effect = fit.effect ? GUN_EFFECTS[fit.effect] : NO_EFFECT;
  const gain = (upgrade: GunUpgrade): number => rankOf(fit, upgrade) * UPGRADES[upgrade].gain;
  const damage = stock.damage * (1 + gain('damage')) * (quirk.damage ?? 1) * (effect.damage ?? 1);
  const fireIntervalMs = (stock.fireIntervalMs * (quirk.fireInterval ?? 1)) / (1 + gain('fireRate'));
  const power = (damage / stock.damage) * (stock.fireIntervalMs / fireIntervalMs);
  const cap = GUN_POWER_CAP / (1 + effect.power);
  return {
    ...stock,
    damage: power > cap ? (damage * cap) / power : damage,
    fireIntervalMs,
    magSize: Math.max(1, Math.round(stock.magSize * (1 + gain('magazine')) * (quirk.magSize ?? 1))),
    reloadMs: stock.reloadMs * (1 - gain('reload')) * (quirk.reload ?? 1),
    spreadRad: stock.spreadRad * (quirk.spread ?? 1),
    noiseRadius: stock.noiseRadius * (1 - gain('suppressor')) * (quirk.noise ?? 1),
  };
}

/** The stats of the gun in the player's hands. */
export const heldStats = (p: PlayerState): WeaponStats => gunStats(p.weapon, p.guns[p.weapon]?.fit);

function hasRoomFor(weapon: WeaponId, fit: GunFit | undefined, upgrade: GunUpgrade): boolean {
  return slotsUsed(fit) < GUN_SLOTS[weapon] && rankOf(fit, upgrade) < UPGRADES[upgrade].maxRank;
}

const costOf = (upgrade: GunUpgrade): [PartId, number][] => Object.entries(UPGRADES[upgrade].cost) as [PartId, number][];

export function canFit(parts: Readonly<PartCounts>, weapon: WeaponId, fit: GunFit | undefined, upgrade: GunUpgrade): boolean {
  const affordable = costOf(upgrade).every(([part, count]) => parts[part] >= count);
  return affordable && hasRoomFor(weapon, fit, upgrade);
}

/** Whether a toolkit can take a rank of this upgrade off one gun and put it on the other. */
export function canMove(
  parts: Readonly<PartCounts>,
  upgrade: GunUpgrade,
  from: { readonly weapon: WeaponId; readonly fit: GunFit | undefined },
  to: { readonly weapon: WeaponId; readonly fit: GunFit | undefined },
): boolean {
  const twoGuns = from.weapon !== to.weapon;
  return twoGuns && parts.toolkit > 0 && rankOf(from.fit, upgrade) > 0 && hasRoomFor(to.weapon, to.fit, upgrade);
}

function withRank(fit: GunFit | undefined, upgrade: GunUpgrade, change: number): GunFit {
  const base = fit ?? STOCK_FIT;
  return { ...base, ranks: { ...base.ranks, [upgrade]: rankOf(fit, upgrade) + change } };
}

/** A magazine that shrank hands its extra rounds back to the bag. */
function settleMagazine(p: PlayerState, weapon: WeaponId): void {
  const gun = p.guns[weapon];
  if (!gun) return;
  const extra = Math.max(0, gun.ammo - gunStats(weapon, gun.fit).magSize);
  gun.ammo -= extra;
  p.ammoBag[weapon] += extra;
}

/** Spends the parts and adds a rank. False changes nothing. */
export function fitUpgrade(p: PlayerState, weapon: WeaponId, upgrade: GunUpgrade): boolean {
  const gun = p.guns[weapon];
  const fittable = gun !== undefined && canFit(p.parts, weapon, gun.fit, upgrade);
  if (!fittable) return false;
  for (const [part, count] of costOf(upgrade)) p.parts[part] -= count;
  gun.fit = withRank(gun.fit, upgrade, 1);
  return true;
}

/** Spends a toolkit and moves one rank between two guns the player owns. False changes nothing. */
export function moveUpgrade(p: PlayerState, upgrade: GunUpgrade, from: WeaponId, to: WeaponId): boolean {
  const source = p.guns[from];
  const target = p.guns[to];
  const movable = source && target && canMove(p.parts, upgrade, { weapon: from, fit: source.fit }, { weapon: to, fit: target.fit });
  if (!movable) return false;
  p.parts.toolkit -= 1;
  source.fit = withRank(source.fit, upgrade, -1);
  target.fit = withRank(target.fit, upgrade, 1);
  settleMagazine(p, from);
  return true;
}

/** False leaves it lying there: the bag holds no more of this part. */
export function takePart(p: PlayerState, part: PartId): boolean {
  const roomInBag = p.parts[part] < PART_CARRY_CAP;
  if (roomInBag) p.parts[part] += 1;
  return roomInBag;
}

/** A found gun comes as its last owner left it. */
export function foundGunFit(item: PickupState): GunFit | undefined {
  return item.quirk ? { ranks: {}, quirk: item.quirk } : undefined;
}

/** The field for a player's snapshot, left off for someone with no parts or kits and only stock guns. */
export function gearField(p: PlayerState): { gear?: PlayerGear } {
  const worked = Object.entries(p.guns).filter(([, gun]) => gun.fit);
  const hasKits = EFFECT_ORDER.some((effect) => p.kits[effect] > 0);
  const hasGear = worked.length > 0 || hasKits || PART_ORDER.some((part) => p.parts[part] > 0);
  if (!hasGear) return {};
  const fits = Object.fromEntries(worked.map(([weapon, gun]) => [weapon, gun.fit]));
  return { gear: { parts: { ...p.parts }, fits, ...(hasKits ? { kits: { ...p.kits } } : {}) } };
}
