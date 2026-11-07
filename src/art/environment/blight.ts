// The blighted-country props: marsh reeds with cattails and a giant glowing fungus.
// Every stalk, leaf and cap row is hand-stamped, so nothing here is generated.

import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import { bake } from './common.ts';

const { ink, wood, olive, rot, bone, grass, teal, acid } = RAMPS;

export function buildReeds(): PixelSprite {
  const c = new PixelCanvas(24, 38);
  const ground = 35;
  c.ellipse(12, ground - 1, 9, 1, ink[1]);

  // Stalks from the root out to their tips: [x0, x1, top]. Thin, slightly leaning, varied height.
  const stalks: [number, number, number][] = [
    [6, 3, 12], [8, 7, 6], [10, 10, 1], [12, 13, 8], [14, 16, 3], [16, 19, 10], [18, 21, 15], [11, 5, 18],
  ];
  const tones = [olive[1], teal[1], olive[2], olive[1], teal[1], olive[2], teal[1], olive[1]];
  stalks.forEach(([x0, x1, top], i) => c.line(x0, ground - 3, x1, top, tones[i]));

  // Drooping blade leaves arcing off the stalks.
  c.line(8, 26, 3, 22, olive[2]).line(3, 22, 1, 27, olive[1]);
  c.line(15, 24, 20, 20, teal[2]).line(20, 20, 22, 26, teal[1]);
  c.line(12, 30, 7, 29, teal[2]).line(7, 29, 5, 32, teal[1]);

  // Cattail heads: brown sausages near the tips of four stalks.
  const HEAD: Legend = { h: wood[3], b: wood[2], d: wood[1], t: wood[0] };
  c.grid(9, 3, ['hb', 'hb', 'hb', 'bd', '.d'], HEAD);
  c.grid(15, 5, ['hb', 'hb', 'hb', 'bd', '.d'], HEAD);
  c.grid(2, 14, ['hb', 'hb', 'bd', '.d'], HEAD);
  c.grid(18, 12, ['hb', 'hb', 'bd', '.d'], HEAD);

  // Muddy root clump.
  c.rect(6, ground - 3, 12, 2, grass[1]).rect(8, ground - 4, 8, 1, grass[2]).px(7, ground - 4, teal[0]);
  c.outline({ selective: true });
  return c.toSprite(c.w, c.h, 12, ground);
}

// A pale stalk lit from the left, under a dome that glows lime on top and goes dark
// at the gills.
const FUNGUS: Legend = {
  L: acid[2], l: acid[1], g: acid[0], s: bone[3], e: bone[2], m: bone[1], d: bone[0],
  v: rot[0], w: olive[0], y: rot[2], k: ink[1],
};

/** Centres a stamp row inside the cap width, so the dome stays symmetric. */
function dome(rows: string[], width: number): string[] {
  return rows.map(r => {
    const pad = (width - r.length) / 2;
    return '.'.repeat(Math.floor(pad)) + r + '.'.repeat(Math.ceil(pad));
  });
}

export function buildFungus(): PixelSprite {
  const c = new PixelCanvas(36, 44);
  const ground = 40;
  c.ellipse(18, ground - 1, 11, 2, ink[1]);

  // Stalk, eight wide, flaring at the root and ringed once under the cap.
  c.grid(14, 14, [
    'eeemmmdd', 'eemmmmdd', 'eemmmmdd', 'sesssmmd', 'emmmmmdd', 'emmmmddd', 'eemmmmdd', 'emmmmmdd',
    'eemmmmdd', 'eemmmddd', 'emmmmmdd', 'emmmmddd', 'eemmmmdd', 'emmmmmdd', 'eemmmmdd', 'emmmmddd',
    'eemmmmdd', 'emmmmmdd', 'eemmmddd', 'emmmmmdd', 'eemmmmdd', 'emmmmmdd',
  ], FUNGUS);
  c.grid(12, 34, [
    '.eemmmmmdd.', 'eemmmmmmmdd', 'emmmmmmmddd', 'dddddddddd.',
  ], FUNGUS);

  // Dome. Rows are centred: crown, lit shoulders, then the rim sinking to green.
  c.grid(4, 2, dome([
    'LLLLLLLLLL',
    'LLLLLLLLLLLLLL',
    'LLLLsLLLLLLLLLLLl',
    'LLLLLLLLLLLLLLLLLLll',
    'LLsLLLLLLLLLLsLLLLlllL',
    'LLLLLLLLLLLLLLLLLLLLlllll',
    'LLLLLsLLLLLLLLLLLLLLLllllll',
    'LLLLLLLLLLLLsLLLLLLLllllllll',
    'llllllllllllllllllllllllllll',
    'lllsllllllllllllsllllllllgg',
    'gggggggggggggggggggggggggggg',
  ], 28), FUNGUS);
  // Gills under the rim: dark ribbed underside.
  c.grid(4, 13, dome([
    'vvwvvwvvwvvwvvwvvwvvwvvwvv',
    '.vvvwvvvwvvvwvvvwvvvwvvv.',
    '...vvvvvvvvvvvvvvvvvvv...',
  ], 28), FUNGUS);
  // Glow bleeding off the cap onto the air and a few spores drifting up.
  c.px(3, 8, acid[0]).px(32, 8, acid[0]);

  // Two small fungi at the root.
  c.grid(8, 36, ['.lLl', 'lgggg', '.ee.', '.em.'], FUNGUS);
  c.grid(25, 35, ['.lLl.', 'lLLgg', '.mmd.', '.mmd.'], FUNGUS);
  c.outline({ selective: true });
  return bake(c, 14, 10, ground);
}
