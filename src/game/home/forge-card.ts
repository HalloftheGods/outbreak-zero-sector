// What the forge's card says: the jewels waiting, what they come to and how long, from the forge's own numbers.

import type { ForgeView } from '../home-screens.ts';
import { LARGE_JEWEL_SILVER, SMALL_JEWEL_SILVER } from './forge.ts';

export type JewelSize = 'small' | 'large';

/** Cells in the forge's bar: one jewel's smelt, read like a stat bar. */
export const FORGE_SLOTS = 10;

export const FORGE_LINE = 'Jewels become silver here, one at a time, while you stay.';

export interface JewelRow {
  readonly size: JewelSize;
  /** The pickup icon the jewel is on the ground. */
  readonly icon: 'jewel_small' | 'jewel_large';
  readonly label: string;
  readonly count: number;
  /** Silver one jewel of this size smelts into. */
  readonly each: number;
}

export interface ForgeCard {
  /** Small first, as the waiting list has always read. */
  readonly jewels: readonly [JewelRow, JewelRow];
  /** The silver every waiting jewel comes to once smelted. */
  readonly yieldSilver: number;
  readonly timeLeft: string;
  /** Cells of FORGE_SLOTS lit by the jewel on the forge. */
  readonly filled: number;
  /** The jewel being smelted: large ones go first, as smeltTick takes them. */
  readonly onForge: JewelSize | null;
  readonly status: string;
}

const EACH: Readonly<Record<JewelSize, number>> = { small: SMALL_JEWEL_SILVER, large: LARGE_JEWEL_SILVER };
const LABEL: Readonly<Record<JewelSize, string>> = { small: 'Small jewels', large: 'Large jewels' };

function jewelRow(size: JewelSize, count: number): JewelRow {
  return { size, icon: `jewel_${size}`, label: LABEL[size], count, each: EACH[size] };
}

export function forgeCard(view: ForgeView): ForgeCard {
  const { small, large } = view.waiting;
  const lit = Math.min(FORGE_SLOTS, Math.max(0, Math.floor(view.progress * FORGE_SLOTS)));
  const firstUp: JewelSize = large > 0 ? 'large' : 'small';
  return {
    jewels: [jewelRow('small', small), jewelRow('large', large)],
    yieldSilver: small * SMALL_JEWEL_SILVER + large * LARGE_JEWEL_SILVER,
    timeLeft: `${Math.ceil(view.secondsLeft)}s`,
    filled: view.idle ? 0 : lit,
    onForge: view.idle ? null : firstUp,
    status: view.idle ? 'No jewels to smelt.' : 'Step away and the rest wait.',
  };
}
