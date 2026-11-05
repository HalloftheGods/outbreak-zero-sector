import { PART_ORDER, QUIRK_ORDER, UPGRADE_ORDER } from '../../shared/gun-upgrade-data.ts';
import type { GunQuirk, GunUpgrade } from '../../shared/gun-upgrade-data.ts';
import type { GunFit, PlayerGear } from '../../shared/gun-upgrades.ts';
import { WEAPON_ORDER } from '../../shared/protocol.ts';
import type { WeaponId } from '../../shared/protocol.ts';
import type { BenchView } from '../../shared/workbench.ts';

type Fields = Record<string, unknown>;

const isFields = (v: unknown): v is Fields => typeof v === 'object' && v !== null;
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isIdList = (v: unknown): boolean => Array.isArray(v) && v.every((id) => typeof id === 'string');

const isRankEntry = ([upgrade, rank]: [string, unknown]): boolean => UPGRADE_ORDER.includes(upgrade as GunUpgrade) && isCount(rank);

function isGunFit(v: unknown): v is GunFit {
  return isFields(v)
    && isFields(v.ranks)
    && Object.entries(v.ranks).every(isRankEntry)
    && (v.quirk === null || QUIRK_ORDER.includes(v.quirk as GunQuirk));
}

const isFitEntry = ([weapon, fit]: [string, unknown]): boolean => WEAPON_ORDER.includes(weapon as WeaponId) && isGunFit(fit);

export function isPlayerGear(v: unknown): v is PlayerGear {
  return isFields(v)
    && isFields(v.parts)
    && PART_ORDER.every((part) => isCount((v.parts as Fields)[part]))
    && isFields(v.fits)
    && Object.entries(v.fits).every(isFitEntry);
}

export function isBenchView(v: unknown): v is BenchView {
  return isFields(v)
    && isCount(v.level)
    && (v.secondsLeft === null || isCount(v.secondsLeft))
    && isIdList(v.riders)
    && isIdList(v.ready);
}
