// Round kits: workbench loot on the floor and in the icons. Letters are the pickup legend.
// One tin with a clasp, told apart by the mark on its lid and the band across it.

import type { RoundKitId } from '../../../shared/round-effect-data.ts';
import type { Grid } from './shared.ts';

/** The lid mark is five pixels wide and three tall, set in a field of tin. */
const lid = (mark: readonly [string, string, string]): Grid => mark.map((row) => `nooo${row.replace(/\./g, 'o')}ooom`);

const tin = (mark: readonly [string, string, string], band: string): Grid => [
  '.nnnnnnnnnnn.',
  'npppppoppppon',
  'noooooYooooom',
  ...lid(mark),
  band,
  'noooooooooonm',
  '.mmmmmmmmmmm.',
];

/** Each kit's grid, and where its glint sits relative to the item. */
export const KIT_ART: Readonly<Record<RoundKitId, { readonly rows: Grid; readonly glint: readonly [number, number] }>> = {
  incendiary_kit: { rows: tin(['..B..', '.BCB.', '.CYC.'], 'nBBCBBBCBBCBm'), glint: [2, 1] },
  acid_kit: { rows: tin(['..c..', '.ccc.', '.cbc.'], 'nbcbccbcbbcbm'), glint: [2, 1] },
  piercing_kit: { rows: tin(['...e.', 'eeeee', '...e.'], 'nefefeefefefm'), glint: [2, 1] },
  tranq_kit: { rows: tin(['s.e..', '.eee.', '..e.s'], 'nsrsrrsrssrsm'), glint: [2, 1] },
};
