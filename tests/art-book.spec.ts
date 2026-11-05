import { beforeAll, describe, expect, it, vi } from 'vitest';
import { PROP_KINDS, SURVIVOR_SKIN_COUNT, TILE_KINDS, TILE_SIZE, WEAPON_ORDER } from '../shared/protocol.ts';
import { buildArtBook } from '../src/art/index.ts';
import { inPalette, toHex } from '../src/art/palette.ts';
import type { ArtBook, Clip, DirClips, PixelSprite } from '../src/art/types.ts';

const BUILD_BUDGET_MS = 3000;

function isSprite(value: object): value is PixelSprite {
  return 'rgba' in value;
}

/** Every sprite in the book, with the path that reached it, so a failure names the art. */
function collectSprites(value: unknown, path: string, out: [string, PixelSprite][]): void {
  if (typeof value !== 'object' || value === null) return;
  if (isSprite(value)) {
    out.push([path, value]);
    return;
  }
  for (const [key, child] of Object.entries(value)) collectSprites(child, `${path}/${key}`, out);
}

function allDirClips(book: ArtBook): [string, DirClips][] {
  const clips: [string, DirClips][] = [['fx/tracer', book.fx.tracer]];
  for (const id of WEAPON_ORDER) clips.push([`fx/muzzle/${id}`, book.fx.muzzle[id]]);
  for (const [type, art] of Object.entries(book.zombies)) {
    clips.push([`zombies/${type}/walk`, art.walk], [`zombies/${type}/attack`, art.attack]);
  }
  book.survivors.forEach((art, skin) => {
    for (const id of WEAPON_ORDER) {
      for (const [name, set] of Object.entries(art.weapons[id])) clips.push([`survivors/${skin}/${id}/${name}`, set]);
    }
  });
  return clips;
}

function allClips(book: ArtBook): [string, Clip][] {
  const single: [string, Clip][] = [
    ['environment/barrelFire', book.environment.barrelFire],
    ['fx/bulletImpact', book.fx.bulletImpact],
    ['fx/bloodBurst', book.fx.bloodBurst],
    ['fx/acidBurst', book.fx.acidBurst],
    ['fx/smokePuff', book.fx.smokePuff],
    ...Object.entries(book.pickups).map(([type, clip]): [string, Clip] => [`pickups/${type}`, clip]),
    ...Object.entries(book.zombies).map(([type, art]): [string, Clip] => [`zombies/${type}/death`, art.death]),
    ...book.survivors.flatMap((art, skin): [string, Clip][] => [
      [`survivors/${skin}/downed`, art.downed],
      [`survivors/${skin}/dead`, art.dead],
    ]),
  ];
  const directional = allDirClips(book).flatMap(([name, set]) => set.map((clip, dir): [string, Clip] => [`${name}/${dir}`, clip]));
  return [...single, ...directional];
}

describe('art book', () => {
  let book: ArtBook;
  const sprites: [string, PixelSprite][] = [];

  beforeAll(() => {
    book = buildArtBook();
    collectSprites(book, 'book', sprites);
  });

  it('stores w*h*4 bytes per sprite with a sane anchor', () => {
    expect(sprites.length).toBeGreaterThan(0);
    const bad = sprites.filter(([, s]) => s.rgba.length !== s.w * s.h * 4 || s.ax < 0 || s.ax > s.w || s.ay < 0 || s.ay > s.h);
    expect(bad.map(([path]) => path)).toEqual([]);
  });

  it('uses only full or zero alpha', () => {
    const bad = sprites.filter(([, s]) => {
      for (let i = 3; i < s.rgba.length; i += 4) if (s.rgba[i] !== 0 && s.rgba[i] !== 255) return true;
      return false;
    });
    expect(bad.map(([path]) => path)).toEqual([]);
  });

  it('draws every sprite with something visible', () => {
    const blank = sprites.filter(([, s]) => !s.rgba.some((value, i) => i % 4 === 3 && value === 255));
    expect(blank.map(([path]) => path)).toEqual([]);
  });

  it('keeps every opaque colour in the master palette', () => {
    const strays = new Map<string, string>();
    for (const [path, s] of sprites) {
      for (let i = 0; i < s.rgba.length; i += 4) {
        if (s.rgba[i + 3] === 0) continue;
        const color = (s.rgba[i] << 16) | (s.rgba[i + 1] << 8) | s.rgba[i + 2];
        if (!inPalette(color)) strays.set(toHex(color), path);
      }
    }
    expect([...strays]).toEqual([]);
  });

  it('gives every DirClips eight clips', () => {
    const bad = allDirClips(book).filter(([, clips]) => clips.length !== 8);
    expect(bad.map(([name]) => name)).toEqual([]);
  });

  it('gives every clip frames and a frame rate', () => {
    const bad = allClips(book).filter(([, clip]) => clip.frames.length === 0 || clip.fps <= 0);
    expect(bad.map(([name]) => name)).toEqual([]);
  });

  it('keeps all frames of a clip the same size and anchor', () => {
    const bad = allClips(book).filter(([, { frames }]) =>
      frames.some((f) => f.w !== frames[0].w || f.h !== frames[0].h || f.ax !== frames[0].ax || f.ay !== frames[0].ay),
    );
    expect(bad.map(([name]) => name)).toEqual([]);
  });

  it('has art for every skin and weapon', () => {
    expect(book.survivors).toHaveLength(SURVIVOR_SKIN_COUNT);
    for (const art of book.survivors) expect(Object.keys(art.weapons).sort()).toEqual([...WEAPON_ORDER].sort());
  });

  it('has square tiles of every kind', () => {
    for (const kind of TILE_KINDS) {
      const variants = book.environment.tiles[kind];
      expect(variants?.length, kind).toBeGreaterThan(0);
      for (const tile of variants) expect([kind, tile.w, tile.h]).toEqual([kind, TILE_SIZE, TILE_SIZE]);
    }
  });

  it('has a sprite for every prop', () => {
    expect(PROP_KINDS.filter((kind) => !book.environment.props[kind])).toEqual([]);
  });

  it('builds within budget', async () => {
    const times: number[] = [];
    for (let run = 0; run < 3; run++) {
      vi.resetModules();
      const fresh = await import('../src/art/index.ts');
      const started = performance.now();
      fresh.buildArtBook();
      times.push(performance.now() - started);
    }
    // About 600ms cold in the browser; a busy suite triples that, and the title screen builds art off the first paint.
    expect(Math.min(...times)).toBeLessThan(BUILD_BUDGET_MS);
  }, BUILD_BUDGET_MS * 4);
});
