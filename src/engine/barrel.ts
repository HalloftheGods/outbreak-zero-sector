import type { WeaponId } from '../../shared/protocol.ts';
import { ANCHOR_X, ANCHOR_Y } from '../art/survivors/cell.ts';
import { GUNS } from '../art/survivors/weapons.ts';
import type { DrawnDir } from '../art/kit.ts';

export interface BarrelOffset {
  readonly x: number;
  readonly y: number;
}

/** The west-facing half of the compass is the east half flipped. */
const MIRRORED: Readonly<Record<number, DrawnDir>> = { 3: 1, 4: 0, 5: 7 };

/** Where the gun's last pixel sits relative to the survivor's feet, by weapon and facing. */
export function barrelOffset(weapon: WeaponId, dir: number): BarrelOffset {
  const mirrored = MIRRORED[dir];
  const view = GUNS[weapon].views[mirrored ?? (dir as DrawnDir)];
  const x = view.at[0] + view.tip[0] - ANCHOR_X;
  const y = view.at[1] + view.tip[1] - ANCHOR_Y;
  return { x: mirrored === undefined ? x : -x, y };
}
