// Renders the art book to a PNG so it can be judged by eye.
//   node --experimental-strip-types tools/contact-sheet.ts <group> <outfile.png> [scale] [filter]
// group: survivors | zombies | environment | fx | ui | all | reference | scene | scene-night | town
// filter: keep only rows whose label contains this text, e.g. "skin0/pistol/walk".
// For town it is a crop instead, "x,y,w,h" in town pixels.
// Each row shows a 1x strip under its label, for a read at true size.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildArtBook } from '../src/art/index.ts';
import { referenceWalker } from '../src/art/zombies.ts';
import type { ArtBook, Clip, DirClips, PixelSprite } from '../src/art/types.ts';
import { WEAPON_ORDER } from '../shared/protocol.ts';
import { encodePng } from './png.ts';
import { renderScene } from './scene.ts';
import { drawSprite, drawText, Sheet } from './sheet.ts';
import { renderTown } from './town.ts';

const DIR_NAMES = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
const BACKGROUND = 0x3a3c4c;
const LABEL_COLUMN = 180;
const MAX_WIDTH = 1800;

interface Group {
  readonly tag: string;
  readonly sprites: readonly PixelSprite[];
}

interface Row {
  readonly label: string;
  readonly groups: readonly Group[];
}

const dirRow = (label: string, clips: DirClips): Row => ({
  label,
  groups: clips.map((clip, dir) => ({ tag: DIR_NAMES[dir], sprites: clip.frames })),
});

const clipRow = (label: string, clip: Clip): Row => ({ label, groups: [{ tag: '', sprites: clip.frames }] });

const spriteRow = (label: string, sprites: readonly PixelSprite[]): Row => ({ label, groups: [{ tag: '', sprites }] });

function survivorRows(book: ArtBook): Row[] {
  return book.survivors.flatMap((art, skin) => [
    ...WEAPON_ORDER.flatMap((id) => {
      const weapon = art.weapons[id];
      return [
        dirRow(`skin${skin}/${id}/idle`, weapon.idle),
        dirRow(`skin${skin}/${id}/walk`, weapon.walk),
        dirRow(`skin${skin}/${id}/fire`, weapon.fire),
        dirRow(`skin${skin}/${id}/reload`, weapon.reload),
      ];
    }),
    clipRow(`skin${skin}/downed`, art.downed),
    clipRow(`skin${skin}/dead`, art.dead),
  ]);
}

function zombieRows(book: ArtBook): Row[] {
  return Object.entries(book.zombies).flatMap(([type, art]) => [
    dirRow(`${type}/walk`, art.walk),
    dirRow(`${type}/attack`, art.attack),
    clipRow(`${type}/death`, art.death),
  ]);
}

function environmentRows(book: ArtBook): Row[] {
  const { tiles, props, buildings, interior, barrelFire } = book.environment;
  return [
    ...Object.entries(tiles).map(([kind, variants]) => spriteRow(`tile/${kind}`, variants)),
    ...Object.entries(props).map(([kind, sprite]) => spriteRow(`prop/${kind}`, [sprite])),
    ...Object.entries(buildings).map(([kind, variants]) => spriteRow(`building/${kind}`, variants)),
    spriteRow('interior', Object.values(interior)),
    clipRow('barrelFire', barrelFire),
  ];
}

function fxRows(book: ArtBook): Row[] {
  const { fx, pickups } = book;
  return [
    ...WEAPON_ORDER.map((id) => dirRow(`muzzle/${id}`, fx.muzzle[id])),
    dirRow('tracer', fx.tracer),
    clipRow('bulletImpact', fx.bulletImpact),
    clipRow('bloodBurst', fx.bloodBurst),
    spriteRow('bloodDecals', fx.bloodDecals),
    clipRow('acidBurst', fx.acidBurst),
    spriteRow('acidDecals', fx.acidDecals),
    clipRow('smokePuff', fx.smokePuff),
    spriteRow('shells', [fx.shellCasing, fx.shotgunShell]),
    ...Object.entries(pickups).map(([type, clip]) => clipRow(`pickup/${type}`, clip)),
  ];
}

function uiRows(book: ArtBook): Row[] {
  const { ui } = book;
  return [
    spriteRow('crosshair', [ui.crosshair]),
    spriteRow('weaponIcons', WEAPON_ORDER.map((id) => ui.weaponIcons[id])),
    spriteRow('pickupIcons', Object.values(ui.pickupIcons)),
    spriteRow('heart+skull', [ui.heart, ui.skull]),
    spriteRow('logo', [ui.logo]),
  ];
}

function referenceRows(): Row[] {
  const { idle, walk } = referenceWalker();
  return [spriteRow('walker/idle S', [idle]), spriteRow('walker/walk S', walk.frames)];
}

function rowsFor(group: string, book: ArtBook): Row[] {
  switch (group) {
    case 'survivors': return survivorRows(book);
    case 'zombies': return zombieRows(book);
    case 'environment': return environmentRows(book);
    case 'fx': return fxRows(book);
    case 'ui': return uiRows(book);
    case 'reference': return referenceRows();
    case 'all': return [...survivorRows(book), ...zombieRows(book), ...environmentRows(book), ...fxRows(book), ...uiRows(book)];
    default: throw new Error(`Unknown sheet "${group}"`);
  }
}

interface Placed {
  readonly sprite: PixelSprite;
  readonly x: number;
  readonly y: number;
}

interface Laid {
  readonly placed: readonly Placed[];
  readonly tags: readonly { readonly text: string; readonly x: number; readonly y: number }[];
  readonly height: number;
}

/** Flows a row's sprites left to right, wrapping at MAX_WIDTH. Coordinates are relative to the row. */
function layoutRow(row: Row, scale: number): Laid {
  const gap = 2 * scale;
  const groupGap = 6 * scale;
  const tagHeight = row.groups.some((group) => group.tag) ? 8 : 0;
  const placed: Placed[] = [];
  const tags: { text: string; x: number; y: number }[] = [];
  let x = LABEL_COLUMN;
  let y = 4;
  let lineHeight = 0;
  for (const group of row.groups) {
    const groupWidth = group.sprites.reduce((sum, sprite) => sum + sprite.w * scale + gap, 0);
    if (x > LABEL_COLUMN && x + groupWidth > MAX_WIDTH) {
      x = LABEL_COLUMN;
      y += lineHeight + 4;
      lineHeight = 0;
    }
    if (group.tag) tags.push({ text: group.tag, x, y });
    for (const sprite of group.sprites) {
      if (x > LABEL_COLUMN && x + sprite.w * scale > MAX_WIDTH) {
        x = LABEL_COLUMN;
        y += lineHeight + 4;
        lineHeight = 0;
      }
      placed.push({ sprite, x, y: y + tagHeight });
      x += sprite.w * scale + gap;
      lineHeight = Math.max(lineHeight, sprite.h * scale + tagHeight);
    }
    x += groupGap;
  }
  return { placed, tags, height: y + lineHeight + 6 };
}

function renderRows(rows: readonly Row[], scale: number): Sheet {
  const laid = rows.map((row) => layoutRow(row, scale));
  const width = Math.max(
    LABEL_COLUMN + 40,
    ...laid.flatMap((row) => row.placed.map((item) => item.x + item.sprite.w * scale + 8)),
  );
  // Tall enough for the label and its 1x strip.
  const heights = laid.map((row, i) => Math.max(row.height, 14 + Math.max(...rows[i].groups.flatMap((g) => g.sprites.map((s) => s.h))) + 6));
  const sheet = new Sheet(width, heights.reduce((sum, h) => sum + h, 4), BACKGROUND);
  let y = 4;
  laid.forEach((row, i) => {
    drawText(sheet, rows[i].label.toUpperCase(), 4, y + 4, 0xfaf2d4);
    let strip = 4;
    for (const sprite of rows[i].groups.flatMap((group) => group.sprites)) {
      if (strip + sprite.w > LABEL_COLUMN - 4) break;
      drawSprite(sheet, sprite, strip, y + 14, 1);
      strip += sprite.w + 1;
    }
    for (const tag of row.tags) drawText(sheet, tag.text, tag.x, y + tag.y, 0xa8a492);
    for (const item of row.placed) drawSprite(sheet, item.sprite, item.x, y + item.y, scale);
    sheet.hline(0, y + heights[i] - 1, width, 0x2c2e3a);
    y += heights[i];
  });
  return sheet;
}

function main(): void {
  const [group, outfile, scaleArg, filter] = process.argv.slice(2);
  if (!group || !outfile) {
    console.error('usage: contact-sheet.ts <survivors|zombies|environment|fx|ui|all|reference|scene|scene-night|town> <outfile.png> [scale] [filter]');
    process.exit(1);
  }
  const started = performance.now();
  const book = buildArtBook();
  const buildMs = performance.now() - started;
  const isScene = group === 'scene' || group === 'scene-night';
  const isTown = group === 'town';
  const defaultScale = isTown ? 1 : 4;
  const scale = Number(scaleArg ?? (isScene ? 3 : defaultScale));
  let sheet: Sheet;
  if (isScene) {
    sheet = renderScene(book, scale, group === 'scene-night');
  } else if (isTown) {
    sheet = renderTown(book, scale, filter);
  } else {
    const rows = rowsFor(group, book).filter((row) => !filter || row.label.includes(filter));
    if (rows.length === 0) throw new Error(`No rows match "${filter}"`);
    sheet = renderRows(rows, scale);
  }
  mkdirSync(dirname(outfile), { recursive: true });
  writeFileSync(outfile, encodePng(sheet.w, sheet.h, sheet.data));
  console.log(`${outfile} ${sheet.w}x${sheet.h}, art book built in ${buildMs.toFixed(0)}ms`);
}

main();
