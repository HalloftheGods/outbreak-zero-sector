// Rex's costume list (#7171): the default first, unique ids, every frame in the palette
// and the portrait frame, outline ink only on outline letters, and each costume a look of
// its own. Whether a costume reads well is judged by eye on rendered sheets; this spec
// does not check that.

import { describe, expect, it } from 'vitest';
import { WEAPON_ORDER } from '../shared/protocol.ts';
import type { DrawnDir } from '../src/art/kit.ts';
import { inPalette, RAMPS } from '../src/art/palette.ts';
import { idleClips, weaponClips } from '../src/art/survivors/clips.ts';
import { REX_COSTUMES } from '../src/art/survivors/costumes/rex.ts';
import { standingFrame } from '../src/art/survivors/fallen.ts';
import { PORTRAIT_FRAME } from '../src/art/survivors/portrait.ts';
import { REX } from '../src/art/survivors/rex.ts';
import type { Person } from '../src/art/survivors/rig.ts';
import type { PixelSprite } from '../src/art/types.ts';

const DRAWN_DIRS: readonly DrawnDir[] = [0, 1, 2, 6, 7];
const INKS = new Set<number>(RAMPS.ink);
const OUTLINE_LETTERS = ['k', 'K'];

function colorAt(sprite: PixelSprite, x: number, y: number): number | null {
  const i = (y * sprite.w + x) * 4;
  return sprite.rgba[i + 3] === 0 ? null : (sprite.rgba[i] << 16) | (sprite.rgba[i + 1] << 8) | sprite.rgba[i + 2];
}

/** Opaque pixels outside the portrait frame. */
function clipped(sprite: PixelSprite): number {
  const { x, y, w, h } = PORTRAIT_FRAME;
  let count = 0;
  for (let row = 0; row < sprite.h; row++) {
    for (let col = 0; col < sprite.w; col++) {
      const inside = col >= x && col < x + w && row >= y && row < y + h;
      const strays = !inside && colorAt(sprite, col, row) !== null;
      count += strays ? 1 : 0;
    }
  }
  return count;
}

/** Pixels with partial alpha, or opaque in a colour outside the palette. */
function badPixels(sprite: PixelSprite): number {
  let bad = 0;
  for (let i = 0; i < sprite.w * sprite.h; i++) {
    const alpha = sprite.rgba[i * 4 + 3];
    const color = (sprite.rgba[i * 4] << 16) | (sprite.rgba[i * 4 + 1] << 8) | sprite.rgba[i * 4 + 2];
    const partial = alpha !== 0 && alpha !== 255;
    const offPalette = alpha === 255 && !inPalette(color);
    bad += partial || offPalette ? 1 : 0;
  }
  return bad;
}

/** Every frame of every clip of every weapon, in a fixed order. */
function allFrames(person: Person): PixelSprite[] {
  const frames: PixelSprite[] = [];
  for (const weapon of WEAPON_ORDER) {
    for (const dirs of Object.values(weaponClips(person, weapon))) {
      for (const clip of dirs) frames.push(...clip.frames);
    }
  }
  return frames;
}

function portraitPoses(person: Person): PixelSprite[] {
  return [standingFrame(person, 0, 'stand', 0, 0, 0), ...idleClips(person, 'pistol').map((clip) => clip.frames[0])];
}

function facingKey(person: Person, dir: DrawnDir): string {
  return Array.from(idleClips(person, 'pistol')[dir].frames[0].rgba).join(',');
}

describe('Rex costumes (#7171)', () => {
  it('starts with the default green dinosaur and lists ids once each, in lowercase words', () => {
    expect(REX_COSTUMES[0]).toMatchObject({ id: 'green', person: REX });
    const ids = REX_COSTUMES.map((costume) => costume.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+$/);
    expect(ids).toEqual(['green', 'purple', 'red', 'triceratops']);
  });

  it('draws only grid letters its legend defines', () => {
    for (const { id, person } of REX_COSTUMES) {
      for (const parts of [person.heads, person.torsos, person.packs ?? {}]) {
        for (const [dir, part] of Object.entries(parts)) {
          const letters = new Set(part.rows.join('').replaceAll('.', ''));
          for (const letter of letters) expect(person.legend[letter], `${id} ${dir} ${letter}`).toBeDefined();
        }
      }
    }
  });

  it('keeps every frame of every clip in the palette, with alpha 0 or 255', () => {
    for (const { id, person } of REX_COSTUMES) {
      const frames = allFrames(person);
      expect(frames.map(badPixels), id).toEqual(frames.map(() => 0));
    }
  });

  it('keeps the front pose and the pistol facings inside the portrait frame', () => {
    for (const { id, person } of REX_COSTUMES) {
      const poses = portraitPoses(person);
      expect(poses.map(clipped), id).toEqual(poses.map(() => 0));
    }
  });

  it('never reaches further out of the portrait frame than the default does, in any frame', () => {
    const base = allFrames(REX).map(clipped);
    for (const { id, person } of REX_COSTUMES) {
      const over = allFrames(person).map(clipped).map((count, i) => Math.max(0, count - base[i]));
      expect(over, id).toEqual(base.map(() => 0));
    }
  });

  it('maps outline ink only to the outline letters, in the legend and the far legend', () => {
    for (const { id, person } of REX_COSTUMES) {
      for (const legend of [person.legend, person.farLegend]) {
        const inked = Object.entries(legend).filter(([, color]) => color !== null && INKS.has(color)).map(([letter]) => letter);
        for (const letter of inked) expect(OUTLINE_LETTERS, `${id} ${letter}`).toContain(letter);
      }
    }
  });

  it('keeps Rex’s build', () => {
    for (const { id, person } of REX_COSTUMES) {
      expect(person.spread, id).toBe(REX.spread);
      expect(person.shorter, id).toEqual(REX.shorter);
    }
  });

  it('differs from the default and from every other costume in at least one facing', () => {
    const keys = REX_COSTUMES.map(({ person }) => DRAWN_DIRS.map((dir) => facingKey(person, dir)));
    for (let a = 0; a < keys.length; a++) {
      for (let b = a + 1; b < keys.length; b++) {
        const same = DRAWN_DIRS.every((_, i) => keys[a][i] === keys[b][i]);
        expect(same, `${REX_COSTUMES[a].id} vs ${REX_COSTUMES[b].id}`).toBe(false);
      }
    }
  });
});
