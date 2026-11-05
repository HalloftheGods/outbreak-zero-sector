import { WEAPONS } from '../../shared/constants.ts';
import { UPGRADE_ORDER, UPGRADES } from '../../shared/gun-upgrade-data.ts';
import type { GunUpgrade, PartId } from '../../shared/gun-upgrade-data.ts';
import { canFit, canMove, gunStats, noParts, rankOf } from '../../shared/gun-upgrades.ts';
import type { GunFit, PlayerGear } from '../../shared/gun-upgrades.ts';
import { levelDef } from '../../shared/levels.ts';
import type { PlayerEntity, SnapshotPacket, WeaponId } from '../../shared/protocol.ts';

export const NO_GEAR: PlayerGear = { parts: noParts(), fits: {} };

/** The bench as this player sees it. */
export interface BenchHud {
  /** The town just left, and the one the van is headed for. */
  readonly level: number;
  readonly nextTitle: string;
  readonly secondsLeft: number | null;
  readonly youReady: boolean;
  /** People on their feet not ready yet, you included. */
  readonly waitingFor: number;
}

export function benchHud(snapshot: SnapshotPacket, local: PlayerEntity): BenchHud | null {
  const bench = snapshot.bench;
  if (!bench) return null;
  return {
    level: bench.level,
    nextTitle: levelDef(bench.level + 1).title,
    secondsLeft: bench.secondsLeft,
    youReady: bench.ready.includes(local.id),
    waitingFor: bench.riders.length - bench.ready.length,
  };
}

export interface BenchRow {
  readonly upgrade: GunUpgrade;
  readonly label: string;
  readonly rank: number;
  readonly maxRank: number;
  readonly cost: readonly PartId[];
  readonly fittable: boolean;
  /** Guns a toolkit could carry a rank of this to. */
  readonly moves: readonly WeaponId[];
}

/** One row per upgrade for a gun, with what can be done about it right now. */
export function benchRows(weapon: WeaponId, owned: readonly WeaponId[], gear: PlayerGear): BenchRow[] {
  const here = { weapon, fit: gear.fits[weapon] };
  return UPGRADE_ORDER.map((upgrade) => {
    const { label, maxRank, cost } = UPGRADES[upgrade];
    const accepts = (target: WeaponId): boolean => canMove(gear.parts, upgrade, here, { weapon: target, fit: gear.fits[target] });
    return {
      upgrade,
      label,
      maxRank,
      rank: rankOf(here.fit, upgrade),
      cost: Object.keys(cost) as PartId[],
      fittable: canFit(gear.parts, weapon, here.fit, upgrade),
      moves: owned.filter(accepts),
    };
  });
}

/** What the gun fires like with this work on it. */
export function statLines(weapon: WeaponId, fit: GunFit | undefined): readonly string[] {
  const stats = gunStats(weapon, fit);
  const pellets = stats.pellets > 1 ? ` x${stats.pellets}` : '';
  return [
    `Damage ${Math.round(stats.damage)}${pellets}`,
    `${(1000 / stats.fireIntervalMs).toFixed(1)} shots/s`,
    `Magazine ${stats.magSize}`,
    `Reload ${(stats.reloadMs / 1000).toFixed(1)}s`,
    `Noise ${Math.round((stats.noiseRadius / WEAPONS[weapon].noiseRadius) * 100)}%`,
  ];
}
