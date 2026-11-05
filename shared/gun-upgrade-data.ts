import type { WeaponId } from './protocol.ts';

/** Loot for the workbench. A toolkit is spent moving an upgrade, never fitted. */
export type PartId = 'barrel' | 'grip' | 'magazine' | 'suppressor' | 'toolkit';
export type PartCounts = Record<PartId, number>;

export const PART_ORDER: readonly PartId[] = ['barrel', 'grip', 'magazine', 'suppressor', 'toolkit'];

export const PART_LABELS: Readonly<Record<PartId, string>> = {
  barrel: 'Barrel',
  grip: 'Grip',
  magazine: 'Magazine',
  suppressor: 'Suppressor',
  toolkit: 'Toolkit',
};

/** Most of any one part a player can carry; the next one stays on the floor. */
export const PART_CARRY_CAP = 6;

export type GunUpgrade = 'damage' | 'fireRate' | 'magazine' | 'reload' | 'suppressor';

export const UPGRADE_ORDER: readonly GunUpgrade[] = ['damage', 'fireRate', 'magazine', 'reload', 'suppressor'];

export interface UpgradeDef {
  readonly label: string;
  readonly cost: Readonly<Partial<PartCounts>>;
  readonly maxRank: number;
  /** Share of the stock stat each rank adds, or takes off for reload time and noise. */
  readonly gain: number;
}

export const UPGRADES: Readonly<Record<GunUpgrade, UpgradeDef>> = {
  damage: { label: 'Damage', cost: { barrel: 1 }, maxRank: 3, gain: 0.12 },
  fireRate: { label: 'Fire rate', cost: { grip: 1 }, maxRank: 3, gain: 0.1 },
  magazine: { label: 'Magazine', cost: { magazine: 1 }, maxRank: 3, gain: 0.25 },
  reload: { label: 'Reload speed', cost: { grip: 1, magazine: 1 }, maxRank: 3, gain: 0.15 },
  suppressor: { label: 'Suppressor', cost: { suppressor: 1 }, maxRank: 1, gain: 0.65 },
};

/** Ranks of every kind on one gun, a suppressor included, cannot pass this. */
export const GUN_SLOTS: Readonly<Record<WeaponId, number>> = { pistol: 3, carbine: 4, shotgun: 3 };

/**
 * Damage per second no build can pass, as a multiple of the stock gun. Level 10 fields 1.6 times
 * level 1's zombies with brutes among them, so a full gun helps there without winning it alone.
 */
export const GUN_POWER_CAP = 1.5;

export type GunQuirk = 'hot_loads' | 'hair_trigger' | 'deep_well' | 'slick_latch' | 'soft_report';

export const QUIRK_ORDER: readonly GunQuirk[] = ['hot_loads', 'hair_trigger', 'deep_well', 'slick_latch', 'soft_report'];

/** What a previous owner did to a gun. Every quirk gives something and costs something. */
export interface QuirkDef {
  readonly label: string;
  readonly note: string;
  readonly damage?: number;
  readonly fireInterval?: number;
  readonly magSize?: number;
  readonly reload?: number;
  readonly spread?: number;
  readonly noise?: number;
}

export const GUN_QUIRKS: Readonly<Record<GunQuirk, QuirkDef>> = {
  hot_loads: { label: 'Hot loads', note: 'Hits harder, and everything hears it', damage: 1.1, noise: 1.25 },
  hair_trigger: { label: 'Hair trigger', note: 'Fires faster, and wanders', fireInterval: 0.92, spread: 1.3 },
  deep_well: { label: 'Deep well', note: 'Holds more, and reloads slower', magSize: 1.2, reload: 1.15 },
  slick_latch: { label: 'Slick latch', note: 'Reloads faster, and holds less', reload: 0.8, magSize: 0.9 },
  soft_report: { label: 'Soft report', note: 'Quieter, and hits a little lighter', noise: 0.8, damage: 0.95 },
};

/** Share of the guns placed in a town that come with a quirk. */
export const GUN_QUIRK_ODDS = 0.4;

/** Parts a town holds. A run finds a fraction of them, and a death loses what was carried. */
export const PARTS_PER_TOWN = 4;
