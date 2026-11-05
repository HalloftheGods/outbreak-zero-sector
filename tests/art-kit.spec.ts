import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { dirClips, makeClip, mirrorSprite, PixelCanvas, rampMap, seeded } from '../src/art/kit.ts';
import { ALL_COLORS, darker, INK, lighter, RAMPS } from '../src/art/palette.ts';
import type { DrawnDir } from '../src/art/kit.ts';
import { encodePng } from '../tools/png.ts';

const RED = RAMPS.blood[2];
const BLUE = RAMPS.denim[1];

function opaque(canvas: PixelCanvas): string[] {
  const rows: string[] = [];
  for (let y = 0; y < canvas.h; y++) {
    let row = '';
    for (let x = 0; x < canvas.w; x++) row += canvas.get(x, y) === null ? '.' : '#';
    rows.push(row);
  }
  return rows;
}

function luminance(color: number): number {
  return 0.3 * (color >> 16) + 0.59 * ((color >> 8) & 255) + 0.11 * (color & 255);
}

describe('palette', () => {
  it('holds 64 unique colours at most', () => {
    expect(new Set(ALL_COLORS).size).toBe(ALL_COLORS.length);
    expect(ALL_COLORS.length).toBeLessThanOrEqual(64);
  });

  it('orders every ramp from dark to light', () => {
    for (const [name, ramp] of Object.entries(RAMPS)) {
      const levels = ramp.map(luminance);
      expect(levels, name).toEqual([...levels].sort((a, b) => a - b));
    }
  });

  it('steps along a ramp and clamps at the ends', () => {
    expect(darker(RAMPS.blood[2])).toBe(RAMPS.blood[1]);
    expect(lighter(RAMPS.blood[2], 5)).toBe(RAMPS.blood[3]);
    expect(darker(RAMPS.blood[0])).toBe(RAMPS.blood[0]);
  });
});

describe('PixelCanvas', () => {
  it('draws Bresenham lines end to end', () => {
    const canvas = new PixelCanvas(4, 4).line(0, 0, 3, 3, RED);
    expect(opaque(canvas)).toEqual(['#...', '.#..', '..#.', '...#']);
  });

  it('fills polygons', () => {
    const canvas = new PixelCanvas(5, 5).poly([[0, 0], [4, 0], [4, 4], [0, 4]], RED);
    expect(opaque(canvas).join('')).not.toContain('.');
  });

  it('fills an ellipse and outlines only its rim', () => {
    const filled = new PixelCanvas(9, 9).ellipse(4, 4, 3, 3, RED);
    const rim = new PixelCanvas(9, 9).ellipseOutline(4, 4, 3, 3, RED);
    expect(filled.get(4, 4)).toBe(RED);
    expect(rim.get(4, 4)).toBeNull();
    expect(rim.get(1, 4)).toBe(RED);
  });

  it('reads ascii grids and refuses unknown letters', () => {
    const canvas = PixelCanvas.fromGrid(['r.', '.b'], { r: RED, b: BLUE });
    expect([canvas.get(0, 0), canvas.get(1, 0), canvas.get(1, 1)]).toEqual([RED, null, BLUE]);
    expect(() => PixelCanvas.fromGrid(['z'], { r: RED })).toThrow(/legend/);
  });

  it('blits with flips and keeps what is under transparent pixels', () => {
    const src = PixelCanvas.fromGrid(['r.'], { r: RED });
    const dest = new PixelCanvas(2, 1).fill(BLUE).blit(src, 0, 0, { flipX: true });
    expect([dest.get(0, 0), dest.get(1, 0)]).toEqual([BLUE, RED]);
  });

  it('outlines only on the outside of the silhouette', () => {
    const canvas = new PixelCanvas(3, 3).px(1, 1, RED).outline();
    expect(opaque(canvas)).toEqual(['.#.', '###', '.#.']);
    expect(canvas.get(1, 1)).toBe(RED);
    expect(canvas.get(1, 0)).toBe(INK);
  });

  it('softens only the lit side of a selective outline', () => {
    const canvas = new PixelCanvas(3, 3).px(1, 1, RED).outline({ selective: true });
    expect(canvas.get(0, 1)).toBe(darker(RED, 2));
    expect(canvas.get(1, 0)).toBe(darker(RED, 2));
    expect(canvas.get(2, 1)).toBe(INK);
    expect(canvas.get(1, 2)).toBe(INK);
  });

  it('recolours through a ramp map, keeping the shading steps', () => {
    const canvas = new PixelCanvas(2, 1).px(0, 0, RAMPS.teal[0]).px(1, 0, RAMPS.teal[2]);
    canvas.recolor(rampMap(RAMPS.teal, RAMPS.violet));
    expect([canvas.get(0, 0), canvas.get(1, 0)]).toEqual([RAMPS.violet[0], RAMPS.violet[2]]);
  });

  it('lights the upper left of a part and shades the lower right', () => {
    const canvas = new PixelCanvas(4, 4).rect(0, 0, 4, 4, RAMPS.rot[1]).erase(0, 0).lightEdges();
    expect(canvas.get(1, 0)).toBe(RAMPS.rot[2]);
    expect(canvas.get(3, 3)).toBe(RAMPS.rot[0]);
  });

  it('bakes a sprite without trimming', () => {
    const sprite = new PixelCanvas(8, 6).px(3, 3, RED).toSprite(8, 6, 4, 5);
    expect(sprite).toMatchObject({ w: 8, h: 6, ax: 4, ay: 5 });
    expect(sprite.rgba).toHaveLength(8 * 6 * 4);
  });
});

describe('clips', () => {
  const marked = (x: number) => new PixelCanvas(4, 1).px(x, 0, RED).toSprite(4, 1, 1, 1);

  it('mirrors a sprite with its anchor', () => {
    const flipped = mirrorSprite(marked(0));
    expect(flipped.ax).toBe(3);
    expect(flipped.rgba[3 * 4 + 3]).toBe(255);
  });

  it('builds eight directions, drawing five and mirroring the W side', () => {
    const drawn: DrawnDir[] = [];
    const set = dirClips((dir) => {
      drawn.push(dir);
      return makeClip([marked(0)], 4);
    });
    expect(set).toHaveLength(8);
    expect([...drawn].sort((a, b) => a - b)).toEqual([0, 1, 2, 6, 7]);
    for (const west of [3, 4, 5]) expect(set[west].frames[0].rgba[3 * 4 + 3]).toBe(255);
    for (const east of [0, 1, 2, 6, 7]) expect(set[east].frames[0].rgba[3]).toBe(255);
  });
});

describe('seeded', () => {
  it('repeats for a seed', () => {
    const a = seeded(7);
    const b = seeded(7);
    expect([a(), a()]).toEqual([b(), b()]);
  });
});

describe('encodePng', () => {
  it('writes a valid signature, header and pixel data', () => {
    const rgba = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 0]);
    const png = encodePng(2, 1, rgba);
    expect([...png.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
    expect(png.readUInt32BE(16)).toBe(2);
    expect(png.readUInt32BE(20)).toBe(1);
    const idat = png.indexOf('IDAT');
    const body = inflateSync(png.subarray(idat + 4, idat + 4 + png.readUInt32BE(idat - 4)));
    expect([...body]).toEqual([0, ...rgba]);
  });

  it('refuses a buffer of the wrong size', () => {
    expect(() => encodePng(2, 2, new Uint8Array(4))).toThrow(/expected 16/);
  });
});
