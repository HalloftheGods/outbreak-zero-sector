// The six emote icons (shared/emotes.ts): 16x16, picture only, no letters. Each grid gets
// one dark outline so it holds on snow, asphalt and the HUD alike.

import type { EmoteId } from '../../../shared/emotes.ts';
import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Grid } from './shared.ts';

const { blood, bone, ink, olive, teal } = RAMPS;

const SIZE = 16;

const LEGEND: Legend = {
  k: ink[0],
  e: bone[3], f: bone[2], g: bone[1],
  s: blood[1], t: blood[2], u: blood[3],
  a: olive[2], b: olive[1],
  N: teal[1], T: teal[2],
};

/** Four fingers up and a red mark each side: someone needs help. */
const HELP: Grid = [
  't..e.e.e.e.t',
  '.t.e.e.e.e.t',
  '...e.e.e.e..',
  '...eeeeeee..',
  'e..eeeeeee..',
  'ee.eeeeeee..',
  '.eeeeeeeeg..',
  '..eeeeeegg..',
  '...eeeegg...',
  '....eggg....',
];

/** A flat palm held up: hold on. */
const WAIT: Grid = [
  '..e.e.e.e...',
  '..e.e.e.e...',
  '..e.e.e.e...',
  '..eeeeeeee..',
  'e.eeeeeeee..',
  'eeeeeeeeeg..',
  '.eeeeeeeegg.',
  '..eeeeeegg..',
  '...eeeegg...',
  '....gggg....',
];

const GO: Grid = [
  '......b.....',
  '......bb....',
  '......baa...',
  'aaaaaaaaaa..',
  'aaaaaaaaaaa.',
  'bbbbbbbbbb..',
  '......baa...',
  '......bb....',
  '......b.....',
];

const THANKS: Grid = [
  '.ttt....ttt.',
  'tuuut..ttttt',
  'tueeuttttttt',
  'tueuttttttts',
  'tuutttttttss',
  '.ttttttttss.',
  '..ttttttss..',
  '...tttsss...',
  '....tss.....',
  '.....s......',
];

/** A skull with a red exclamation mark beside it. */
const DANGER: Grid = [
  '.eeeeeee...uu.',
  'eeeeeeeee..tt.',
  'ekkkeekkk..tt.',
  'ekkkeekkk..tt.',
  'eeeeeeeee..tt.',
  '.eeekeee...ss.',
  '..eeeeee......',
  '..ekekek..uu..',
];

/** A thumb up on a fist, with a teal cuff. */
const NICE: Grid = [
  '....ee......',
  '....ee......',
  '....eee.....',
  '....eeee....',
  'NN..eeeeeee.',
  'NNeeeeeeeeef',
  'NNeeeeeeeeef',
  'NNeeeeeeeeef',
  'NNeeeeeeeeef',
  'NT.eeeeeeff.',
];

const GRIDS: Readonly<Record<EmoteId, Grid>> = { help: HELP, go: GO, thanks: THANKS, wait: WAIT, danger: DANGER, nice: NICE };

function icon(rows: Grid): PixelSprite {
  const width = Math.max(...rows.map((row) => row.length));
  const x = Math.floor((SIZE - width) / 2);
  const y = Math.floor((SIZE - rows.length) / 2);
  const canvas = new PixelCanvas(SIZE, SIZE).grid(x, y, rows, LEGEND).outline({ color: ink[0] });
  return canvas.toSprite(SIZE, SIZE, SIZE / 2, SIZE / 2);
}

export function buildEmoteIcons(): Record<EmoteId, PixelSprite> {
  const entries = Object.entries(GRIDS) as [EmoteId, Grid][];
  return Object.fromEntries(entries.map(([id, rows]) => [id, icon(rows)])) as Record<EmoteId, PixelSprite>;
}
