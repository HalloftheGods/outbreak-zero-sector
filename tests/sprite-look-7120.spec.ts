import { describe, expect, it } from 'vitest';
import { buildSurvivors } from '../src/art/survivors.ts';
import { idleClips } from '../src/art/survivors/clips.ts';
import { standingFrame } from '../src/art/survivors/fallen.ts';
import { KHRONUS8 } from '../src/art/survivors/khronus8.ts';
import { NIGHT } from '../src/art/survivors/night.ts';
import { PORTRAIT_FRAME } from '../src/art/survivors/portrait.ts';
import { REX } from '../src/art/survivors/rex.ts';
import { SATORI } from '../src/art/survivors/satori.ts';
import { SOL } from '../src/art/survivors/sol.ts';
import type { PixelSprite } from '../src/art/types.ts';

const CAST = [NIGHT, KHRONUS8, SATORI, REX, SOL];

function opaque(sprite: PixelSprite, x: number, y: number): boolean {
  return sprite.rgba[(y * sprite.w + x) * 4 + 3] !== 0;
}

/** How many opaque pixels of the cell fall outside the portrait frame. */
function clipped(sprite: PixelSprite): number {
  const { x, y, w, h } = PORTRAIT_FRAME;
  let count = 0;
  for (let row = 0; row < sprite.h; row++) {
    for (let col = 0; col < sprite.w; col++) {
      const inside = col >= x && col < x + w && row >= y && row < y + h;
      if (!inside && opaque(sprite, col, row)) count++;
    }
  }
  return count;
}

describe('survivor portrait frame (#7120)', () => {
  it('keeps every opaque pixel of the front pose and all eight pistol facings, for every skin', () => {
    for (const person of CAST) {
      const sprites = [standingFrame(person, 0, 'stand', 0, 0, 0), ...idleClips(person, 'pistol').map((c) => c.frames[0])];
      expect(sprites.map(clipped)).toEqual(sprites.map(() => 0));
    }
  });

  it('gives every portrait and turnaround facing the frame size', () => {
    const size = `${PORTRAIT_FRAME.w}x${PORTRAIT_FRAME.h}`;
    for (const art of buildSurvivors()) {
      const shown = [art.portrait, ...art.portraits];
      expect(shown.map((each) => `${each.w}x${each.h}`)).toEqual(shown.map(() => size));
    }
  });
});
