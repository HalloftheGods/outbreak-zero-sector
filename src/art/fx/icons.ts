// Interface art: crosshair, weapon and pickup icons, heart and skull. Each is a hand
// placed grid. Body grids get one dark outline so they hold on any background.

import type { PickupType, WeaponId } from '../../../shared/protocol.ts';
import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import { gridSprite } from './shared.ts';
import type { Grid } from './shared.ts';
import { BANDAGE, CARBINE_AMMO, PISTOL_AMMO, SHELLS } from './pickups.ts';

const { blood, bone, fire, ink, metal, olive, wood } = RAMPS;

const ICON: Legend = {
  k: ink[0], K: ink[1],
  e: bone[3], f: bone[2], g: bone[1], h: bone[0],
  r: blood[0], s: blood[1], t: blood[2], u: blood[3],
  m: metal[0], n: metal[1], o: metal[2], p: metal[3],
  a: olive[0], b: olive[1], c: olive[2],
  w: wood[0], x: wood[1], y: wood[2], z: wood[3],
  Y: fire[3], B: fire[2], C: fire[1], D: fire[0],
};

const CROSSHAIR: Grid = [
  '.....kkk.....',
  '.....kek.....',
  '.....kek.....',
  '.....kek.....',
  '.....kkk.....',
  'kkkkk.k.kkkkk',
  'keeekkukkeeek',
  'kkkkk.k.kkkkk',
  '.....kkk.....',
  '.....kek.....',
  '.....kek.....',
  '.....kek.....',
  '.....kkk.....',
];

const PISTOL: Grid = [
  '.................p..',
  '.oppppppppppppppppp.',
  '.onononoonnnnnnnnnn.',
  '.nnnnnnnnnnnnnnnnnm.',
  '.mmmmmmmmmmmmmmmmm..',
  '.mnnnnnn.m..m.......',
  '.nxxxxm..m.m........',
  '.xyyyxm...m.........',
  'xyzyxm..............',
  'xyyxxm..............',
  'xxxwwm..............',
];

const CARBINE: Grid = [
  '.........oooooooo.............',
  '.........nnnnnnnn.......p.....',
  'nn......oppppppppcccccccpn.nn.',
  'onnnnnnnopoooooooccbcbcbbppppp',
  'on...nnnonnnnnnnnbbabababnnnnn',
  'on.nnn..nnnnnnnnnbbbbbbba..nn.',
  'onnn.....mmnm..mnnm...........',
  'nn.......mnm.nn.noom..........',
  '........mnm.....noom..........',
  '........mnm......noom.........',
  '.......mmm.......nnom.........',
];

const SHOTGUN: Grid = [
  '...........oooo...............',
  '..........oppppppppppppppppppp',
  '.......xynoooooooooooooooooooo',
  '..zyyyyyzynnnnnnzzzzzzzyynnnnn',
  'zzyyyyyxxxnnmnnnyyyxyxyxxmmmmm',
  'zyyyxxxww.nmm.nnxxxxxxxxw.....',
  'yyxxxw....mm.m................',
  'yxxw.......m..................',
  'xw............................',
];

const MEDKIT: Grid = [
  '....nppn....',
  '....n..n....',
  'eeeeeeeeeeef',
  'eeeeeuteeeef',
  'eeeeeuteeeef',
  'eeuutttttsef',
  'eetttttttsef',
  'eeeeeutseeef',
  'eeeeeutseeff',
  'fggggggggggh',
];

const CARBINE_SMALL: Grid = [
  '...........op',
  '..........opn',
  '.........opn.',
  '........opn..',
  '.......opnn..',
  '......opnnom.',
  '.....opnn.nom',
  '....opnnm..nm',
  '...opnmnm....',
  '..onn.mnm....',
  '.onn...m.....',
  'onn..........',
  'nn...........',
];

const SHOTGUN_SMALL: Grid = [
  '...........pp',
  '..........pon',
  '.........pon.',
  '........pon..',
  '.......zyn...',
  '......zyx....',
  '.....pnw.....',
  '....ponn.....',
  '...zon.n.....',
  '..zyx........',
  '.zyx.........',
  'zyx..........',
  'yxw..........',
];

const HEART: Grid = [
  '..ttt...ttt..',
  '.tuuut.tttts.',
  'tueeuttttttss',
  'tueutttttttss',
  'tuutttttttsss',
  '.ttttttttsss.',
  '..ttttttsss..',
  '...tttsss....',
  '....tsss.....',
  '.....ss......',
];

const SKULL: Grid = [
  '...eeeeeee...',
  '.eeeeeeeeeff.',
  '.eeeeeeeefff.',
  'eeeeeeeeeefgg',
  'eekkkeeekkkfg',
  'eekkkeeekkkfg',
  'eekkkefekkkgg',
  '.eeeeeKeeefg.',
  '..feeKkKefg..',
  '...efffffg...',
  '...ekekekg...',
  '...fkfkfkg...',
];

/** Centres a body grid in a fixed cell, leaving room for the outline. */
function outlined(rows: Grid, w: number, h: number): PixelSprite {
  const width = Math.max(...rows.map((row) => row.length));
  const x = Math.floor((w - width) / 2);
  const y = Math.floor((h - rows.length) / 2);
  const canvas = new PixelCanvas(w, h).grid(x, y, rows, ICON).outline({ color: ink[0] });
  return canvas.toSprite(w, h, Math.floor(w / 2), Math.floor(h / 2));
}

export function buildCrosshair(): PixelSprite {
  return gridSprite(CROSSHAIR, ICON, 6, 6);
}

export function buildWeaponIcons(): Record<WeaponId, PixelSprite> {
  return { pistol: outlined(PISTOL, 32, 14), carbine: outlined(CARBINE, 32, 14), shotgun: outlined(SHOTGUN, 32, 14) };
}

export function buildPickupIcons(): Record<PickupType, PixelSprite> {
  return {
    medkit: outlined(MEDKIT, 15, 15),
    bandage: outlined(BANDAGE, 15, 15),
    pistol_ammo: outlined(PISTOL_AMMO, 15, 15),
    carbine_ammo: outlined(CARBINE_AMMO, 15, 15),
    shells: outlined(SHELLS, 15, 15),
    carbine: outlined(CARBINE_SMALL, 15, 15),
    shotgun: outlined(SHOTGUN_SMALL, 15, 15),
  };
}

export function buildHeart(): PixelSprite {
  return outlined(HEART, 15, 12);
}

export function buildSkull(): PixelSprite {
  return outlined(SKULL, 15, 14);
}
