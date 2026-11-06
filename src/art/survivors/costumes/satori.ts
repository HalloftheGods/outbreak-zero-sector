// Satori's costumes, default first. See ../costume.ts.
//
// Every cat keeps the tabby's build, grids and pose, so each is mostly a legend swap.
// Grids are redrawn only where a swap alone does not read: the black cat's hood eyes and
// collar, and the Siamese's hood eyes and dark ears and tail.

import type { DrawnDir } from '../../kit.ts';
import { RAMPS } from '../../palette.ts';
import type { Costume } from '../costume.ts';
import type { Facings, Part, Person } from '../rig.ts';
import { SATORI } from '../satori.ts';

const { acid, ash, blood, bone, denim, fire, metal, wood } = RAMPS;

const DRAWN: readonly DrawnDir[] = [0, 1, 2, 6, 7];

/** The same grids with some letters swapped, for a part that only changes colour. */
function swapLetters(facings: Partial<Facings>, swap: Readonly<Record<string, string>>): Partial<Facings> {
  const swapped: { [dir in DrawnDir]?: Part } = {};
  for (const dir of DRAWN) {
    const part = facings[dir];
    if (part) swapped[dir] = { ...part, rows: part.rows.map((row) => row.replace(/./g, (letter) => swap[letter] ?? letter)) };
  }
  return swapped;
}

// Black Cat. Built from the metal ramp's blue-greys, never outline ink, so it keeps an
// edge on the dark road: the lit rim is metal[2], the body metal[1], the shade metal[0].
// No stripes ('w' is the body colour), grey paws, yellow-green eyes on the hood and a red
// collar with a gold bell where the hood meets the neck.
const blackLegend = {
  ...SATORI.legend,
  t: metal[0], u: metal[1], v: metal[2], w: metal[1],
  z: ash[1], Z: ash[0],
  r: metal[2], q: metal[1], p: metal[0], R: metal[2], Q: metal[1], P: metal[0],
  g: ash[2], f: ash[1], e: ash[0],
  E: acid[2], C: blood[2], D: blood[1], B: fire[2],
};

const BLACK_CAT: Person = {
  ...SATORI,
  legend: blackLegend,
  farLegend: { ...blackLegend, r: metal[1], q: metal[0], p: metal[0], R: metal[1], Q: metal[0], P: metal[0], g: ash[1], f: ash[0], e: metal[0] },
  // The lit edge is a step past the rim, so the arm reads in front of the chest, as on the tabby.
  sleeve: [metal[0], metal[1], metal[3]],
  cuff: [metal[0], metal[1], metal[3]],
  hand: [ash[0], ash[1], ash[2]],
  heads: {
    0: { rows: [
      '...vu..ut..',
      '...vyuuyt..',
      '..vuuuuuuu.',
      '.vuuuuuEEuu',
      '.vuuuuuuccu',
      '.vuuuuucddc',
      '.vuuuucdkdc',
      '.vuuuucccyc',
      '.vuuuuucccK',
      '..vuuuzzcc.',
      '...CCCCDD..',
    ] },
    1: { rows: [
      '..vu....ut..',
      '..vyu..uyt..',
      '..vyuuuuyt..',
      '.vuuEEuuEEu.',
      '.vuuuuuuuuuu',
      '.vuuucccccuu',
      '.vuucdddddcu',
      '.vuucdkddkcu',
      '.vuuKcccyKcu',
      '..vuuzccczu.',
      '...CCCBBCC..',
    ] },
    2: { rows: [
      '.vu......ut.',
      '.vyu....uyt.',
      '.vyuuuuuuyt.',
      'vuEEuuuuEEut',
      'vuuccccccuut',
      'vucdddddcbut',
      'vuckdddkcbut',
      'vuKcdyycKbut',
      'vuuzccczbuut',
      '.vuuzzzzuut.',
      '..CCCBBCCC..',
    ] },
    6: { rows: [
      '.vu......ut.',
      '.vuu....uut.',
      '.vuuuuuuuut.',
      'vuuuuuuuuuut',
      'vuuuuuuuuuut',
      'vuuuuuuuuuut',
      'vuuuuuuuuuut',
      'vuuuuuuuuuut',
      'vuuuuuuuuutt',
      '.vuuuuuuutt.',
      '..CCCCCCDD..',
    ] },
    7: { rows: [
      '..vu.....ut.',
      '..vuu...uut.',
      '..vuuuuuuut.',
      '.vuuuuuuuuut',
      '.vuuuuuuuuuc',
      '.vuuuuuuuucc',
      '.vuuuuuuuucc',
      '.vuuuuuuuucb',
      '.vuuuuuuuuub',
      '..vuuuuuuut.',
      '...CCCCCDD..',
    ] },
  },
};

// Siamese. A cream body with dark brown points: ears (H I J), paws and tail, and blue
// eyes on the hood. No stripes ('w' is the body colour).
const siameseLegend = {
  ...SATORI.legend,
  t: bone[1], u: bone[2], v: bone[3], w: bone[2],
  z: bone[3], Z: bone[2],
  r: bone[3], q: bone[2], p: bone[1], R: bone[3], Q: bone[2], P: bone[1],
  g: wood[2], f: wood[1], e: wood[0],
  H: wood[2], I: wood[1], J: wood[0],
  E: denim[2],
};

/** The tabby's tail letters moved onto the brown point letters. */
const POINT_LETTERS = { v: 'H', u: 'I', w: 'I', t: 'J' };

const SIAMESE: Person = {
  ...SATORI,
  legend: siameseLegend,
  farLegend: { ...siameseLegend, r: bone[2], q: bone[1], p: bone[0], R: bone[2], Q: bone[1], P: bone[0], g: wood[1], f: wood[0], e: wood[0] },
  sleeve: [bone[1], bone[2], bone[3]],
  cuff: [bone[1], bone[2], bone[3]],
  // A step lighter than the feet, so a paw on the dark gun grip still reads.
  hand: [wood[1], wood[2], wood[3]],
  packs: swapLetters(SATORI.packs ?? {}, POINT_LETTERS),
  heads: {
    0: { rows: [
      '...HI..IJ..',
      '...HyIIyJ..',
      '..vuuuuuuu.',
      '.vuuuuuEEuu',
      '.vuuuuuuccu',
      '.vuuuuucddc',
      '.vuuuucdkdc',
      '.vuuuucccyc',
      '.vuuuuucccK',
      '..vuuuzzcc.',
      '...uuuuuu..',
    ] },
    1: { rows: [
      '..HI....IJ..',
      '..HyI..IyJ..',
      '..HyIuuIyJ..',
      '.vuuEEuuEEu.',
      '.vuuuuuuuuuu',
      '.vuuucccccuu',
      '.vuucdddddcu',
      '.vuucdkddkcu',
      '.vuuKcccyKcu',
      '..vuuzccczu.',
      '...uuuzzuu..',
    ] },
    2: { rows: [
      '.HI......IJ.',
      '.HyI....IyJ.',
      '.HyIuuuuIyJ.',
      'vuEEuuuuEEut',
      'vuuccccccuut',
      'vucdddddcbut',
      'vuckdddkcbut',
      'vuKcdyycKbut',
      'vuuzccczbuut',
      '.vuuzzzzuut.',
      '..uuuuuuut..',
    ] },
    6: { rows: [
      '.HI......IJ.',
      '.HII....IIJ.',
      '.HuuuuuuuuJ.',
      'vuuuuuuuuuut',
      'vuuuuuuuuuut',
      'vuuuuuuuuuut',
      'vuuuuuuuuuut',
      'vuuuuuuuuuut',
      'vuuuuuuuuutt',
      '.vuuuuuuutt.',
      '..uuuuuutt..',
    ] },
    7: { rows: [
      '..HI.....IJ.',
      '..HII...IIJ.',
      '..HuuuuuuuJ.',
      '.vuuuuuuuuut',
      '.vuuuuuuuuuc',
      '.vuuuuuuuucc',
      '.vuuuuuuuucc',
      '.vuuuuuuuucb',
      '.vuuuuuuuuub',
      '..vuuuuuuut.',
      '...uuuuutt..',
    ] },
  },
};

// Grey Tabby. The tabby's own grids in cool grey with darker dashes; cream tummy and paws.
const greyLegend = {
  ...SATORI.legend,
  t: metal[1], u: metal[2], v: metal[3], w: metal[0],
  r: metal[3], q: metal[2], p: metal[1], R: metal[3], Q: metal[2], P: metal[1],
};

const GREY_TABBY: Person = {
  ...SATORI,
  legend: greyLegend,
  farLegend: { ...SATORI.farLegend, t: metal[1], u: metal[2], v: metal[3], w: metal[0], r: metal[2], q: metal[1], p: metal[0], R: metal[2], Q: metal[1], P: metal[0] },
  sleeve: [metal[1], metal[2], metal[3]],
  cuff: [metal[1], metal[2], metal[3]],
};

export const SATORI_COSTUMES: readonly Costume[] = [
  { id: 'tabby', name: 'Tabby', person: SATORI },
  { id: 'black', name: 'Black Cat', person: BLACK_CAT },
  { id: 'siamese', name: 'Siamese', person: SIAMESE },
  { id: 'grey', name: 'Grey Tabby', person: GREY_TABBY },
];
