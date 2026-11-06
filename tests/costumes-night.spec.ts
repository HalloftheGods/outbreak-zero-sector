// Night's costume list (#7168): the default first, unique ids, and every costume a hair
// change only, drawn in the palette and inside the portrait frame.

import { describe, expect, it } from 'vitest';
import { WEAPON_ORDER } from '../shared/protocol.ts';
import type { DrawnDir } from '../src/art/kit.ts';
import { inPalette, RAMPS } from '../src/art/palette.ts';
import { idleClips, weaponClips } from '../src/art/survivors/clips.ts';
import { NIGHT_COSTUMES } from '../src/art/survivors/costumes/night.ts';
import { standingFrame } from '../src/art/survivors/fallen.ts';
import { NIGHT } from '../src/art/survivors/night.ts';
import { PORTRAIT_FRAME } from '../src/art/survivors/portrait.ts';
import { drawPose } from '../src/art/survivors/rig.ts';
import type { Person } from '../src/art/survivors/rig.ts';
import type { PixelSprite } from '../src/art/types.ts';

const DRAWN_DIRS: readonly DrawnDir[] = [0, 1, 2, 6, 7];
/** Head cells that belong to her face, which no costume may change. */
const FACE_LETTERS = new Set(['a', 'b', 'c', 'd', 'k', 'K', 'N']);
const INKS = new Set<number>(RAMPS.ink);

/** Counts opaque pixels that are off the palette or half transparent. */
function offPalette(sprite: PixelSprite): number {
  let bad = 0;
  for (let i = 0; i < sprite.rgba.length; i += 4) {
    const alpha = sprite.rgba[i + 3];
    const color = (sprite.rgba[i] << 16) | (sprite.rgba[i + 1] << 8) | sprite.rgba[i + 2];
    const drawn = alpha !== 0;
    const wrong = alpha !== 255 || !inPalette(color);
    bad += drawn && wrong ? 1 : 0;
  }
  return bad;
}

/** Counts opaque pixels outside the portrait frame. */
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

/** The front pose, all eight pistol facings standing and every pistol walk frame. */
function shownFrames(person: Person): PixelSprite[] {
  const walk = weaponClips(person, 'pistol').walk.flatMap((clip) => clip.frames);
  return [standingFrame(person, 0, 'stand', 0, 0, 0), ...idleClips(person, 'pistol').map((c) => c.frames[0]), ...walk];
}

describe('Night costumes (#7168)', () => {
  it('starts with the default Starfield look and gives every costume a unique lowercase id and a name', () => {
    expect(NIGHT_COSTUMES[0]).toEqual({ id: 'starfield', name: 'Starfield', person: NIGHT });
    const ids = NIGHT_COSTUMES.map((costume) => costume.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const costume of NIGHT_COSTUMES) {
      expect(costume.id).toMatch(/^[a-z]+$/);
      expect(costume.name.trim()).not.toBe('');
    }
  });

  it('lists Aurora and Nebula after the default', () => {
    expect(NIGHT_COSTUMES.map((costume) => costume.id)).toEqual(['starfield', 'aurora', 'nebula']);
  });

  it('draws every frame of every weapon in the palette, at full or no alpha', () => {
    for (const { id, person } of NIGHT_COSTUMES) {
      for (const weapon of WEAPON_ORDER) {
        const art = weaponClips(person, weapon);
        const frames = [art.idle, art.walk, art.fire, art.reload].flatMap((clips) => clips.flatMap((clip) => clip.frames));
        expect(frames.map(offPalette).filter((bad) => bad > 0), `${id} ${weapon}`).toEqual([]);
      }
    }
  });

  it('keeps the front pose, the standing facings and the walk inside the portrait frame', () => {
    for (const { id, person } of NIGHT_COSTUMES) {
      const frames = shownFrames(person);
      expect(frames.map(clipped), id).toEqual(frames.map(() => 0));
    }
  });

  it('changes only the hair: build, torso, arms and face cells are the default', () => {
    for (const { id, person } of NIGHT_COSTUMES) {
      expect(person.torsos, id).toBe(NIGHT.torsos);
      expect([person.spread, person.shorter, person.sleeve, person.cuff, person.hand], id)
        .toEqual([NIGHT.spread, NIGHT.shorter, NIGHT.sleeve, NIGHT.cuff, NIGHT.hand]);
      for (const dir of DRAWN_DIRS) {
        const mine = person.heads[dir];
        const base = NIGHT.heads[dir];
        expect([mine.rows.length, mine.dx, mine.dy], `${id} ${dir}`).toEqual([base.rows.length, base.dx, base.dy]);
        base.rows.forEach((row, y) => {
          [...row].forEach((letter, x) => {
            if (FACE_LETTERS.has(letter)) expect(mine.rows[y][x], `${id} facing ${dir} row ${y} col ${x}`).toBe(letter);
          });
        });
      }
      for (const letter of 'abcdkKN') expect(person.legend[letter], `${id} ${letter}`).toBe(NIGHT.legend[letter]);
    }
  });

  it('maps no new letter to outline ink', () => {
    for (const { id, person } of NIGHT_COSTUMES) {
      const inked = Object.entries(person.legend).filter(([, color]) => color !== null && INKS.has(color)).map(([letter]) => letter);
      expect(inked.sort(), id).toEqual(['K', 'N', 'k']);
    }
  });

  it('looks different from the default in at least one facing', () => {
    for (const { id, person } of NIGHT_COSTUMES.slice(1)) {
      const differs = DRAWN_DIRS.some((dir) => {
        const mine = drawPose(person, 'pistol', dir, {}).rgba;
        const base = drawPose(NIGHT, 'pistol', dir, {}).rgba;
        return mine.some((value, i) => value !== base[i]);
      });
      expect(differs, id).toBe(true);
    }
  });
});
