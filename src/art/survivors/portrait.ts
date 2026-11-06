// The title screen's picture of a survivor: the standing figure, cropped to one frame
// the whole cast shares, so a smaller survivor looks smaller beside the others.

import type { DirClips, PixelSprite } from '../types.ts';
import { spriteToCanvas } from '../kit.ts';
import { standingFrame } from './fallen.ts';
import type { Person } from './rig.ts';

/**
 * Where the portrait is cut from a survivor cell, in art pixels. It holds every opaque pixel of
 * the front pose and the seven weapon-ready facings for all five skins, so no gun or tail is
 * sheared (tests/sprite-look-7120.spec.ts keeps it so).
 */
export const PORTRAIT_FRAME = { x: 4, y: 7, w: 32, h: 30 } as const;
const FRAME_X = PORTRAIT_FRAME.x;
const FRAME_Y = PORTRAIT_FRAME.y;
const FRAME_W = PORTRAIT_FRAME.w;
const FRAME_H = PORTRAIT_FRAME.h;
/** The facing that looks at the viewer, in dirFromAngle order. */
const FRONT_FACING = 2;

function framed(sprite: PixelSprite): PixelSprite {
  return spriteToCanvas(sprite).crop(FRAME_X, FRAME_Y, FRAME_W, FRAME_H).toSprite();
}

export function portraitOf(person: Person): PixelSprite {
  return framed(standingFrame(person, 0, 'stand', 0, 0, 0));
}

/**
 * All eight facings at the portrait's crop, in dirFromAngle order (0=E 1=SE 2=S ...), so a
 * turn in place never changes the figure's size or position. The front is the portrait itself;
 * the other seven are the weapon-ready standing frames, since the hands-down pose is only drawn
 * facing the viewer.
 */
export function portraitsOf(person: Person, standing: DirClips): readonly PixelSprite[] {
  return standing.map((each, facing) => (facing === FRONT_FACING ? portraitOf(person) : framed(each.frames[0])));
}
