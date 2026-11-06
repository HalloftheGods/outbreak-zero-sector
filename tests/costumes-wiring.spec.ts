// The costume lists wired through (#7187): the art's lists, the art book's records and the
// roster's ids and names agree, index 0 is the look worn today, and no costume is drawn
// until something reads it.

import { describe, expect, it, vi } from 'vitest';
import { CHARACTERS, costumeIndexOf, costumesOf } from '../shared/characters.ts';
import { SURVIVOR_SKIN_COUNT, WEAPON_ORDER } from '../shared/protocol.ts';
import { inPalette } from '../src/art/palette.ts';
import { BANDUS } from '../src/art/survivors/bandus.ts';
import { downedClip } from '../src/art/survivors/fallen.ts';
import { NIGHT } from '../src/art/survivors/night.ts';
import { REX } from '../src/art/survivors/rex.ts';
import { SATORI } from '../src/art/survivors/satori.ts';
import { SOL } from '../src/art/survivors/sol.ts';
import { buildSurvivors, COSTUMES } from '../src/art/survivors.ts';
import type { PixelSprite, SurvivorArt } from '../src/art/types.ts';

// Every survivor record draws its downed clip once when it is built, so the calls count records.
vi.mock('../src/art/survivors/fallen.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/art/survivors/fallen.ts')>();
  return { ...real, downedClip: vi.fn(real.downedClip) };
});

const DEFAULT_PEOPLE = [NIGHT, BANDUS, SATORI, REX, SOL];
const SKINS = Array.from({ length: SURVIVOR_SKIN_COUNT }, (_, skin) => skin);

const recordsBuilt = (): number => vi.mocked(downedClip).mock.calls.length;

/** Every sprite a survivor record draws: portraits, the fallen clips and each weapon's clips. */
function spritesOf(record: SurvivorArt): PixelSprite[] {
  const weaponFrames = WEAPON_ORDER.flatMap((id) => {
    const { idle, walk, fire, reload } = record.weapons[id];
    return [idle, walk, fire, reload].flatMap((clips) => clips.flatMap((clip) => clip.frames));
  });
  return [record.portrait, ...record.portraits, ...record.downed.frames, ...record.dead.frames, ...weaponFrames];
}

/** Counts drawn pixels that are half transparent or off the palette. */
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

const samePixels = (a: PixelSprite, b: PixelSprite): boolean => a.w === b.w && a.h === b.h && a.rgba.every((value, i) => value === b.rgba[i]);

describe('costume wiring (#7187)', () => {
  it('lists the same costume ids and names, in the same order, in the art and the roster', () => {
    expect(COSTUMES).toHaveLength(CHARACTERS.length);
    const survivors = buildSurvivors();
    for (const skin of SKINS) {
      const art = COSTUMES[skin].map(({ id, name }) => ({ id, name }));
      expect(art).toEqual(costumesOf(skin));
      expect(survivors[skin].costumes).toHaveLength(costumesOf(skin).length);
    }
  });

  it('puts the default look first: the survivor drawn today, as the same record', () => {
    const survivors = buildSurvivors();
    for (const skin of SKINS) {
      const record = survivors[skin];
      expect(COSTUMES[skin][0].person).toBe(DEFAULT_PEOPLE[skin]);
      expect(record.costumes[0]).toBe(record);
      expect(costumeIndexOf(skin, costumesOf(skin)[0].id)).toBe(0);
      expect(costumeIndexOf(skin, 'no-such-look')).toBe(-1);
    }
  });

  it('draws no costume until one is read, and each only once', () => {
    const before = recordsBuilt();
    const survivors = buildSurvivors();
    expect(recordsBuilt() - before).toBe(SURVIVOR_SKIN_COUNT);
    for (const record of survivors) {
      expect(Object.keys(record)).not.toContain('costumes');
      expect(record.costumes[0]).toBe(record);
    }
    expect(recordsBuilt() - before).toBe(SURVIVOR_SKIN_COUNT);
    const aurora = survivors[0].costumes[1];
    expect(recordsBuilt() - before).toBe(SURVIVOR_SKIN_COUNT + 1);
    expect(survivors[0].costumes[1]).toBe(aurora);
    expect(recordsBuilt() - before).toBe(SURVIVOR_SKIN_COUNT + 1);
  });

  it('builds every costume record in the palette, wearing its own look and its survivor\'s bust', () => {
    const survivors = buildSurvivors();
    for (const skin of SKINS) {
      const own = survivors[skin];
      own.costumes.forEach((record, index) => {
        const label = `${CHARACTERS[skin].id}/${costumesOf(skin)[index].id}`;
        expect(record.select, label).toBe(own.select);
        expect(record.costumes, label).toBe(own.costumes);
        expect(Number.isFinite(record.gunDrop), label).toBe(true);
        const drawn = spritesOf(record);
        expect(drawn.every((sprite) => sprite.w > 0 && sprite.h > 0), label).toBe(true);
        expect(drawn.reduce((sum, sprite) => sum + offPalette(sprite), 0), label).toBe(0);
        const ownLook = index === 0 || !samePixels(record.portrait, own.portrait);
        expect(ownLook, label).toBe(true);
      });
    }
  });
});
