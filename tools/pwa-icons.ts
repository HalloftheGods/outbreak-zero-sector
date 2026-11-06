/**
 * Draws the app icons from the zombie head in public/favicon.svg, one square of the 16 by 16 grid at a time.
 * Run: node --experimental-strip-types tools/pwa-icons.ts
 * The Hall of the Gods name is not drawn on any of them.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GRID = 16;
const root = fileURLToPath(new URL('../', import.meta.url));

export type Rgb = readonly [number, number, number];

interface Edge {
  readonly x: number;
  readonly from: number;
  readonly to: number;
}

function parseHex(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Every vertical edge of a path made only of M, H, V and Z (upper case is absolute, lower case relative). */
function verticalEdges(d: string): Edge[] {
  const edges: Edge[] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const close = (): void => {
    const open = startY !== y;
    if (open) edges.push({ x: startX, from: Math.min(y, startY), to: Math.max(y, startY) });
    x = startX;
    y = startY;
  };
  for (const [, command, args] of d.matchAll(/([MmHhVvZz])([^MmHhVvZz]*)/g)) {
    const numbers = args.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    const relative = command === command.toLowerCase();
    const letter = command.toUpperCase();
    if (letter === 'Z') close();
    if (letter === 'M') {
      x = relative ? x + numbers[0] : numbers[0];
      y = relative ? y + numbers[1] : numbers[1];
      startX = x;
      startY = y;
    }
    if (letter === 'H') x = relative ? x + numbers[0] : numbers[0];
    if (letter === 'V') {
      const next = relative ? y + numbers[0] : numbers[0];
      edges.push({ x, from: Math.min(y, next), to: Math.max(y, next) });
      y = next;
    }
  }
  return edges;
}

function paint(grid: Rgb[][], x: number, y: number, w: number, h: number, color: Rgb): void {
  for (let row = y; row < y + h; row += 1) for (let col = x; col < x + w; col += 1) grid[row][col] = color;
}

/** The favicon is flat rectangles and axis-aligned outlines, so an even-odd scan of the vertical edges fills it. */
export function readGrid(svg: string): Rgb[][] {
  const grid: Rgb[][] = Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => [0, 0, 0] as Rgb));
  for (const [, tag, attrs] of svg.matchAll(/<(rect|path)\b([^>]*)\/>/g)) {
    const fill = /fill="(#[0-9a-fA-F]{6})"/.exec(attrs)?.[1];
    if (!fill) continue;
    const color = parseHex(fill);
    if (tag === 'rect') {
      paint(grid, 0, 0, GRID, GRID, color);
      continue;
    }
    const edges = verticalEdges(/\sd="([^"]+)"/.exec(attrs)?.[1] ?? '');
    for (let row = 0; row < GRID; row += 1) {
      const crossings = edges
        .filter((edge) => edge.from <= row && row < edge.to)
        .map((edge) => edge.x)
        .sort((a, b) => a - b);
      for (let i = 0; i + 1 < crossings.length; i += 2) paint(grid, crossings[i], row, crossings[i + 1] - crossings[i], 1, color);
    }
  }
  return grid;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Buffer): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size: number, pixel: (x: number, y: number) => Rgb): Buffer {
  const rows = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const at = y * (size * 3 + 1);
    for (let x = 0; x < size; x += 1) Buffer.from(pixel(x, y)).copy(rows, at + 1 + x * 3);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}

/** The head fills `fill` of the width, centred, on the game's ink colour. Maskable icons keep it inside the safe circle. */
export function drawIcon(grid: Rgb[][], size: number, fill: number): Buffer {
  const ink: Rgb = [11, 12, 16];
  const cell = Math.floor((size * fill) / GRID);
  const offset = Math.floor((size - cell * GRID) / 2);
  return encodePng(size, (x, y) => {
    const gx = Math.floor((x - offset) / cell);
    const gy = Math.floor((y - offset) / cell);
    const inside = x >= offset && y >= offset && gx < GRID && gy < GRID;
    return inside ? grid[gy][gx] : ink;
  });
}

function main(): void {
  const grid = readGrid(readFileSync(`${root}public/favicon.svg`, 'utf8'));
  mkdirSync(`${root}public/icons`, { recursive: true });
  writeFileSync(`${root}public/icons/icon-192.png`, drawIcon(grid, 192, 0.9));
  writeFileSync(`${root}public/icons/icon-512.png`, drawIcon(grid, 512, 0.9));
  writeFileSync(`${root}public/icons/icon-maskable-512.png`, drawIcon(grid, 512, 0.7));
  writeFileSync(`${root}public/apple-touch-icon.png`, drawIcon(grid, 180, 0.82));
}

const ranDirectly = process.argv[1] === fileURLToPath(import.meta.url);
if (ranDirectly) main();
