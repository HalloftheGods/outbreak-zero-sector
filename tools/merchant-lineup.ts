// Draws the five survivors beside the four merchants, portraits on top and stall figures below, so
// the merchants can be judged against the cast they should match.
//   node --experimental-strip-types tools/merchant-lineup.ts <outfile.png> [scale]

import { writeFileSync } from 'node:fs';
import { MERCHANT_IDS } from '../shared/home-protocol.ts';
import { buildArtBook } from '../src/art/index.ts';
import type { PixelSprite } from '../src/art/types.ts';
import { encodePng } from './png.ts';

const [out = 'merchant-lineup.png', scaleArg = '6'] = process.argv.slice(2);
const scale = Number(scaleArg);
const art = buildArtBook();
const GAP = 4;
const BACKGROUND = [0x3a, 0x3c, 0x4c, 255];

const portraits: PixelSprite[] = [...art.survivors.map((s) => s.portrait), ...MERCHANT_IDS.map((id) => art.merchants[id].portrait)];
const figures: PixelSprite[] = MERCHANT_IDS.map((id) => art.environment.props[id]);
const rows = [portraits, figures];
const cellW = Math.max(...rows.flat().map((s) => s.w)) + GAP;
const rowH = rows.map((row) => Math.max(...row.map((s) => s.h)) + GAP);
const w = cellW * portraits.length * scale;
const h = rowH.reduce((a, b) => a + b, 0) * scale;
const rgba = new Uint8ClampedArray(w * h * 4);
for (let i = 0; i < w * h; i++) rgba.set(BACKGROUND, i * 4);

let top = 0;
rows.forEach((row, r) => {
  row.forEach((sprite, col) => {
    const ox = col * cellW + Math.floor((cellW - sprite.w) / 2);
    const oy = top + rowH[r] - GAP / 2 - sprite.h;
    for (let y = 0; y < sprite.h; y++) for (let x = 0; x < sprite.w; x++) {
      const at = (y * sprite.w + x) * 4;
      const clear = sprite.rgba[at + 3] === 0;
      if (clear) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const to = (((oy + y) * scale + dy) * w + (ox + x) * scale + dx) * 4;
        rgba.set(sprite.rgba.subarray(at, at + 4), to);
      }
    }
  });
  top += rowH[r];
});
writeFileSync(out, encodePng(w, h, rgba));
