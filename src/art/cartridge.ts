/**
 * The Install Game cartridge and the small icons on the how to install card.
 * The cartridge, label and all, is painted by cartridge-art.ts in the master palette and kept here as flat
 * rectangles. Its label says INSTALL and GAME in pixels; the button's aria-label says it in words.
 */
import type { GuideIcon } from '../game/pwa/ios-guide.ts';
import type { PixelCanvas } from './kit.ts';
import { CARTRIDGE_HEIGHT, CARTRIDGE_LABEL, CARTRIDGE_WIDTH, LABEL_SKY, drawCartridge } from './cartridge-art.ts';
import { RAMPS, toHex } from './palette.ts';
import type { Color } from './palette.ts';

export { CARTRIDGE_HEIGHT, CARTRIDGE_LABEL, CARTRIDGE_WIDTH };

/** One flat rectangle of a pixel picture: colour key, x, y, width, height. */
type Block = readonly [string, number, number, number, number];
type OpenBlock = [string, number, number, number, number];

interface Picture {
  readonly width: number;
  readonly height: number;
  readonly colors: Readonly<Record<string, string>>;
  readonly blocks: readonly Block[];
}

/** A palette colour's key is its ramp and step, such as blood2. */
function keyOf(color: Color): string {
  for (const [name, ramp] of Object.entries(RAMPS)) {
    const step = (ramp as readonly Color[]).indexOf(color);
    const found = step >= 0;
    if (found) return `${name}${step}`;
  }
  throw new Error(`cartridge: ${toHex(color)} is not in the master palette`);
}

function inLabel(x: number, y: number): boolean {
  const { x: left, y: top, width, height } = CARTRIDGE_LABEL;
  return x >= left && x < left + width && y >= top && y < top + height;
}

/**
 * Each row's runs of one colour, merged down while the run below matches, so the picture stays a few hundred rects.
 * The label's backing is one 'recess' rectangle, and runs of that colour inside it are left to show through.
 */
function pictureOf(canvas: PixelCanvas): Picture {
  const backing = LABEL_SKY;
  const colors: Record<string, string> = { recess: toHex(backing) };
  const blocks: OpenBlock[] = [['recess', CARTRIDGE_LABEL.x, CARTRIDGE_LABEL.y, CARTRIDGE_LABEL.width, CARTRIDGE_LABEL.height]];
  let open = new Map<string, OpenBlock>();
  for (let y = 0; y < canvas.h; y++) {
    const next = new Map<string, OpenBlock>();
    let x = 0;
    while (x < canvas.w) {
      const color = canvas.get(x, y);
      let end = x + 1;
      while (end < canvas.w && canvas.get(end, y) === color) end++;
      const showsBacking = color === backing && inLabel(x, y);
      const drawn = color !== null && !showsBacking;
      if (drawn) {
        const key = keyOf(color);
        colors[key] = toHex(color);
        const id = `${x},${end},${key}`;
        const above = open.get(id);
        const block: OpenBlock = above ?? [key, x, y, end - x, 0];
        if (!above) blocks.push(block);
        block[4]++;
        next.set(id, block);
      }
      x = end;
    }
    open = next;
  }
  return { width: canvas.w, height: canvas.h, colors, blocks };
}

const CARTRIDGE: Picture = pictureOf(drawCartridge());

const PRINT = '#2b2233';
const MARKER = '#dc2237';

const SHARE: Picture = {
  width: 12,
  height: 12,
  colors: { print: PRINT, marker: MARKER },
  blocks: [
    ['marker', 5, 0, 2, 1],
    ['marker', 4, 1, 4, 1],
    ['marker', 3, 2, 2, 1],
    ['marker', 7, 2, 2, 1],
    ['marker', 5, 2, 2, 6],
    ['print', 1, 5, 3, 1],
    ['print', 8, 5, 3, 1],
    ['print', 1, 6, 1, 5],
    ['print', 10, 6, 1, 5],
    ['print', 1, 11, 10, 1],
  ],
};

const PLUS: Picture = {
  width: 12,
  height: 12,
  colors: { print: PRINT, marker: MARKER },
  blocks: [
    ['print', 1, 1, 10, 1],
    ['print', 1, 10, 10, 1],
    ['print', 1, 2, 1, 8],
    ['print', 10, 2, 1, 8],
    ['marker', 5, 3, 2, 6],
    ['marker', 3, 5, 6, 2],
  ],
};

const MENU: Picture = {
  width: 12,
  height: 12,
  colors: { print: PRINT, marker: MARKER },
  blocks: [
    ['marker', 5, 1, 2, 2],
    ['marker', 5, 5, 2, 2],
    ['marker', 5, 9, 2, 2],
  ],
};

const DOWNLOAD: Picture = {
  width: 12,
  height: 12,
  colors: { print: PRINT, marker: MARKER },
  blocks: [
    ['marker', 5, 0, 2, 6],
    ['marker', 3, 5, 6, 1],
    ['marker', 4, 6, 4, 1],
    ['marker', 5, 7, 2, 1],
    ['print', 1, 9, 10, 1],
    ['print', 1, 10, 1, 1],
    ['print', 10, 10, 1, 1],
  ],
};

const ICONS: Readonly<Record<GuideIcon, Picture>> = { share: SHARE, plus: PLUS, menu: MENU, download: DOWNLOAD };

/** One <rect> per block, so the picture stays small and its edges stay crisp at any size. */
export function pictureSvg(picture: Picture): string {
  const rects = picture.blocks.map(([key, x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${picture.colors[key]}"/>`);
  const frame = `viewBox="0 0 ${picture.width} ${picture.height}" shape-rendering="crispEdges"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${frame}>${rects.join('')}</svg>`;
}

function dataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function cartridgeSrc(): string {
  return dataUri(pictureSvg(CARTRIDGE));
}

export function guideIconSrc(icon: GuideIcon): string {
  return dataUri(pictureSvg(ICONS[icon]));
}

export const CARTRIDGE_PICTURE: Picture = CARTRIDGE;
export const GUIDE_PICTURES: Readonly<Record<GuideIcon, Picture>> = ICONS;
