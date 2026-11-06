/**
 * The Install Game cartridge and the small icons on the how to install card.
 * All original: a plain grey cartridge with a grip, a label recess and gold contacts, in no console's shape.
 * The printed label is real text laid over the recess by InstallCartridge.vue, so it stays sharp and readable.
 */
import type { GuideIcon } from '../game/pwa/ios-guide.ts';

/** One flat rectangle of a pixel picture: colour key, x, y, width, height. */
type Block = readonly [string, number, number, number, number];

interface Picture {
  readonly width: number;
  readonly height: number;
  readonly colors: Readonly<Record<string, string>>;
  readonly blocks: readonly Block[];
}

export const CARTRIDGE_WIDTH = 24;
export const CARTRIDGE_HEIGHT = 28;
/** Where the label sits on the cartridge, in its own pixels. */
export const CARTRIDGE_LABEL = { x: 4, y: 8, width: 16, height: 11 } as const;

const gripRidges: Block[] = Array.from({ length: 8 }, (_, i): Block => ['groove', 4 + i * 2, 3, 1, 3]);
const contactGaps: Block[] = [7, 11, 15].map((x): Block => ['gap', x, 24, 1, 3]);

const CARTRIDGE: Picture = {
  width: CARTRIDGE_WIDTH,
  height: CARTRIDGE_HEIGHT,
  colors: {
    outline: '#17181f',
    plastic: '#8d909b',
    light: '#b9bcc7',
    shade: '#5b5e69',
    groove: '#4a4c57',
    recess: '#2c2d36',
    gold: '#c9a24a',
    gap: '#8a6c26',
  },
  blocks: [
    ['outline', 0, 2, 24, 22],
    ['outline', 2, 0, 20, 24],
    ['plastic', 2, 1, 20, 22],
    ['plastic', 1, 2, 22, 20],
    ['light', 2, 1, 20, 1],
    ['light', 1, 2, 1, 20],
    ['shade', 22, 2, 1, 20],
    ['shade', 2, 22, 20, 1],
    ...gripRidges,
    ['outline', 3, 7, 18, 13],
    ['recess', CARTRIDGE_LABEL.x, CARTRIDGE_LABEL.y, CARTRIDGE_LABEL.width, CARTRIDGE_LABEL.height],
    ['groove', 3, 21, 1, 1],
    ['groove', 20, 21, 1, 1],
    ['outline', 4, 24, 16, 4],
    ['gold', 5, 24, 14, 3],
    ...contactGaps,
  ],
};

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
