/** Hand-set 5px caps. '#' is ink. Glyphs may be any width; rows of one glyph match. */
const GLYPHS: Readonly<Record<string, string>> = {
  A: '.#./#.#/###/#.#/#.#', B: '##./#.#/##./#.#/##.', C: '.##/#../#../#../.##',
  D: '##./#.#/#.#/#.#/##.', E: '###/#../##./#../###', F: '###/#../##./#../#..',
  G: '.##/#../#.#/#.#/.##', H: '#.#/#.#/###/#.#/#.#', I: '###/.#./.#./.#./###',
  J: '..#/..#/..#/#.#/.#.', K: '#.#/#.#/##./#.#/#.#', L: '#../#../#../#../###',
  M: '#...#/##.##/#.#.#/#...#/#...#', N: '#..#/##.#/#.##/#..#/#..#', O: '.#./#.#/#.#/#.#/.#.',
  P: '##./#.#/##./#../#..', Q: '.#./#.#/#.#/##./.##', R: '##./#.#/##./#.#/#.#',
  S: '.##/#../.#./..#/##.', T: '###/.#./.#./.#./.#.', U: '#.#/#.#/#.#/#.#/###',
  V: '#.#/#.#/#.#/#.#/.#.', W: '#...#/#...#/#.#.#/##.##/#...#', X: '#.#/#.#/.#./#.#/#.#',
  Y: '#.#/#.#/.#./.#./.#.', Z: '###/..#/.#./#../###',
  0: '.#./#.#/#.#/#.#/.#.', 1: '.#./##./.#./.#./###', 2: '##./..#/.#./#../###',
  3: '##./..#/.#./..#/##.', 4: '#.#/#.#/###/..#/..#', 5: '###/#../##./..#/##.',
  6: '.##/#../##./#.#/.#.', 7: '###/..#/.#./.#./.#.', 8: '.#./#.#/.#./#.#/.#.',
  9: '.#./#.#/.##/..#/##.',
  '+': '.../.#./###/.#./...', '-': '.../.../###/.../...', '.': '././././#',
  ':': './#/./#/.', '!': '#/#/#/./#', '?': '##./..#/.#./.../.#.', "'": '#/#/././.',
  '/': '..#/..#/.#./#../#..', '_': '.../.../.../.../###', ' ': '../../../../..',
};

export const FONT_HEIGHT = 5;
const LETTER_GAP = 1;
const FALLBACK = '?';

type GlyphRows = readonly string[];

const parsed = new Map<string, GlyphRows>(
  Object.entries(GLYPHS).map(([char, rows]) => [char, rows.split('/')]),
);

export function glyphRows(char: string): GlyphRows {
  return parsed.get(char.toUpperCase()) ?? parsed.get(FALLBACK)!;
}

export function textWidth(text: string): number {
  let width = 0;
  for (const char of text) width += glyphRows(char)[0].length + LETTER_GAP;
  return Math.max(0, width - LETTER_GAP);
}

interface Atlas {
  readonly canvas: HTMLCanvasElement;
  readonly slots: Map<string, number>;
}

const atlases = new Map<string, Atlas>();

function buildAtlas(color: string): Atlas {
  const canvas = document.createElement('canvas');
  const slots = new Map<string, number>();
  let width = 0;
  for (const [char, rows] of parsed) {
    slots.set(char, width);
    width += rows[0].length;
  }
  canvas.width = width;
  canvas.height = FONT_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  for (const [char, rows] of parsed) {
    const origin = slots.get(char)!;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === '#') ctx.fillRect(origin + x, y, 1, 1);
      }
    });
  }
  return { canvas, slots };
}

function atlasFor(color: string): Atlas {
  let atlas = atlases.get(color);
  if (!atlas) {
    atlas = buildAtlas(color);
    atlases.set(color, atlas);
  }
  return atlas;
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
  const atlas = atlasFor(color);
  let penX = Math.round(x);
  const penY = Math.round(y);
  for (const char of text) {
    const key = char.toUpperCase();
    const rows = glyphRows(key);
    const width = rows[0].length;
    const slot = atlas.slots.get(parsed.has(key) ? key : FALLBACK)!;
    ctx.drawImage(atlas.canvas, slot, 0, width, FONT_HEIGHT, penX, penY, width, FONT_HEIGHT);
    penX += width + LETTER_GAP;
  }
}

/** Text with a one-pixel dark outline, for reading over a busy scene. */
export function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  color: string,
  outline = '#0b0c10',
): void {
  const x = Math.round(centerX - textWidth(text) / 2);
  drawText(ctx, text, x - 1, y, outline);
  drawText(ctx, text, x + 1, y, outline);
  drawText(ctx, text, x, y - 1, outline);
  drawText(ctx, text, x, y + 1, outline);
  drawText(ctx, text, x, y, color);
}
