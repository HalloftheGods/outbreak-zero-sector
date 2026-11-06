// Satori's costume list (#7170): the tabby first, then the black cat, Siamese and grey
// tabby. Each must stay in the palette and the portrait frame like the default, keep
// outline ink off its fills, and look different from the tabby.

import { describe, expect, it } from 'vitest';
import { WEAPON_ORDER } from '../shared/protocol.ts';
import type { Legend } from '../src/art/kit.ts';
import { inPalette, RAMPS } from '../src/art/palette.ts';
import type { Color } from '../src/art/palette.ts';
import { idleClips, weaponClips } from '../src/art/survivors/clips.ts';
import { SATORI_COSTUMES } from '../src/art/survivors/costumes/satori.ts';
import { standingFrame } from '../src/art/survivors/fallen.ts';
import { PORTRAIT_FRAME } from '../src/art/survivors/portrait.ts';
import { farLegsLegend } from '../src/art/survivors/rig.ts';
import type { Person } from '../src/art/survivors/rig.ts';
import { SATORI } from '../src/art/survivors/satori.ts';
import type { PixelSprite } from '../src/art/types.ts';

const INKS = new Set<Color>(RAMPS.ink);
/** Letters drawn as outline in the grids; every other letter is a fill. */
const OUTLINE = ['k', 'K'];

function framesOf(person: Person): PixelSprite[] {
  const frames: PixelSprite[] = [standingFrame(person, 0, 'stand', 0, 0, 0)];
  for (const weapon of WEAPON_ORDER) {
    for (const clips of Object.values(weaponClips(person, weapon))) {
      for (const clip of clips) frames.push(...clip.frames);
    }
  }
  return frames;
}

/** How many opaque pixels are off the palette or half transparent. */
function offPalette(sprite: PixelSprite): number {
  let count = 0;
  for (let i = 0; i < sprite.rgba.length; i += 4) {
    const alpha = sprite.rgba[i + 3];
    const color = (sprite.rgba[i] << 16) | (sprite.rgba[i + 1] << 8) | sprite.rgba[i + 2];
    const drawn = alpha !== 0;
    const wrong = alpha !== 255 || !inPalette(color);
    count += drawn && wrong ? 1 : 0;
  }
  return count;
}

/** How many opaque pixels of the cell fall outside the portrait frame. */
function clipped(sprite: PixelSprite): number {
  const { x, y, w, h } = PORTRAIT_FRAME;
  let count = 0;
  for (let row = 0; row < sprite.h; row++) {
    for (let col = 0; col < sprite.w; col++) {
      const inside = col >= x && col < x + w && row >= y && row < y + h;
      const opaque = sprite.rgba[(row * sprite.w + col) * 4 + 3] !== 0;
      count += !inside && opaque ? 1 : 0;
    }
  }
  return count;
}

function inkFills(legend: Legend): string[] {
  return Object.entries(legend)
    .filter(([letter, color]) => color !== null && INKS.has(color) && !OUTLINE.includes(letter))
    .map(([letter]) => letter);
}

describe("Satori's costumes (#7170)", () => {
  it('starts with the default tabby', () => {
    expect(SATORI_COSTUMES[0]).toMatchObject({ id: 'tabby', person: SATORI });
  });

  it('lists the tabby, black cat, Siamese and grey tabby under unique lowercase ids', () => {
    const ids = SATORI_COSTUMES.map((costume) => costume.id);
    expect(ids).toEqual(['tabby', 'black', 'siamese', 'grey']);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+$/);
    expect(SATORI_COSTUMES.map((costume) => costume.name)).toEqual(['Tabby', 'Black Cat', 'Siamese', 'Grey Tabby']);
  });

  it('keeps Satori’s build', () => {
    for (const { id, person } of SATORI_COSTUMES) {
      expect({ spread: person.spread, shorter: person.shorter, thick: person.thick }, id).toEqual({
        spread: SATORI.spread, shorter: SATORI.shorter, thick: SATORI.thick,
      });
    }
  });

  it('draws every frame of every weapon in the palette, with alpha 0 or 255', () => {
    for (const { id, person } of SATORI_COSTUMES) {
      const frames = framesOf(person);
      expect(frames.map(offPalette), id).toEqual(frames.map(() => 0));
    }
  });

  it('keeps the front pose and all eight pistol facings inside the portrait frame', () => {
    for (const { id, person } of SATORI_COSTUMES) {
      const sprites = [standingFrame(person, 0, 'stand', 0, 0, 0), ...idleClips(person, 'pistol').map((clip) => clip.frames[0])];
      expect(sprites.map(clipped), id).toEqual(sprites.map(() => 0));
    }
  });

  it('maps only the outline letters to ink, near and far', () => {
    for (const { id, person } of SATORI_COSTUMES) {
      expect(inkFills(person.legend), `${id} legend`).toEqual([]);
      expect(inkFills(farLegsLegend(person)), `${id} far legs`).toEqual([]);
    }
  });

  it('looks different from the tabby in at least one facing', () => {
    const tabby = idleClips(SATORI, 'pistol').map((clip) => Array.from(clip.frames[0].rgba).join());
    for (const { id, person } of SATORI_COSTUMES.slice(1)) {
      const facings = idleClips(person, 'pistol').map((clip) => Array.from(clip.frames[0].rgba).join());
      expect(facings.some((facing, dir) => facing !== tabby[dir]), id).toBe(true);
    }
  });
});
