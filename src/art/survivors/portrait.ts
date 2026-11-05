// The title screen's picture of a survivor: the standing figure, cropped to one frame
// the whole cast shares, so a smaller survivor looks smaller beside the others.

import type { PixelSprite } from '../types.ts';
import { spriteToCanvas } from '../kit.ts';
import { standingFrame } from './fallen.ts';
import type { Person } from './rig.ts';

const FRAME_X = 8;
const FRAME_Y = 7;
const FRAME_W = 24;
const FRAME_H = 29;

export function portraitOf(person: Person): PixelSprite {
  const standing = spriteToCanvas(standingFrame(person, 0, 'stand', 0, 0, 0));
  return standing.crop(FRAME_X, FRAME_Y, FRAME_W, FRAME_H).toSprite();
}
