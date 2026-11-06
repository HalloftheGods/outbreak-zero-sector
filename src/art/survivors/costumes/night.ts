// Night's costumes, default first. See ../costume.ts.
//
// Every costume here changes only her hair: the heads' hair cells and the hair letters
// of the legend. Her face cells, hoodie, legs, build and tones are the default's. Each
// keeps navy where hair lies on the violet hoodie.

import { RAMPS } from '../../palette.ts';
import type { Costume } from '../costume.ts';
import { NIGHT } from '../night.ts';
import type { Facings, Person } from '../rig.ts';

const { blood, bone, denim, teal, violet } = RAMPS;

/** Her hair falls past the head's slot, over the shoulders, as in ../night.ts. */
const HAIR_FALL = 3;

/** The default Night with other hair: a legend swap plus new head grids. */
function withHair(hair: Readonly<Record<string, number>>, rows: Readonly<Record<keyof Facings, readonly string[]>>): Person {
  const heads: Facings = {
    0: { dy: HAIR_FALL, rows: rows[0] },
    1: { dy: HAIR_FALL, rows: rows[1] },
    2: { dy: HAIR_FALL, rows: rows[2] },
    6: { dy: HAIR_FALL, rows: rows[6] },
    7: { dy: HAIR_FALL, rows: rows[7] },
  };
  return {
    ...NIGHT,
    legend: { ...NIGHT.legend, ...hair },
    farLegend: { ...NIGHT.farLegend, ...hair },
    heads,
  };
}

// Aurora: each strand's colour travels down the fall, navy at the crown, then blue, violet
// and teal at the tips, with a short line of stars down one strand. n navy (crown,
// partings, every edge on the hoodie), o blue, X lit blue, h shaded violet, w violet,
// W lit violet, s shaded teal, i teal, j lit teal, Y a star.
const AURORA = withHair({
  n: denim[0], o: denim[1], X: denim[2],
  h: violet[0], w: violet[1], W: violet[2],
  s: teal[0], i: teal[1], j: teal[2],
  Y: bone[3],
}, {
  0: [
    '...nnnnnn..',
    '..nnoXXonn.',
    '.nnooXXonnn',
    '.ooXXonNNcd',
    '.oWYnoNcddc',
    '.oWwnoNckdc',
    '.oWwnWNcccc',
    '.ojinWNbcbc',
    '.ojinWNccc.',
    '.ojinn.bb..',
    '..ninn.....',
    '..nnn......',
  ],
  1: [
    '....nnnnn...',
    '..nnoXXonnn.',
    '.nnooXXonnnn',
    '.ooXXnnNNnno',
    '.oWwnNcddcNo',
    '.oWwNckdckco',
    '.oWwNcccccbo',
    '.ojiNccbcbh.',
    '.ojiNNcccbn.',
    '.njin.bbb.n.',
    '.nnnn.......',
    '...n........',
  ],
  2: [
    '....nnnnn...',
    '..nnoXXonn..',
    '.nnooXXonnn.',
    '.ooNnnnnNnon',
    '.ooNcddcNnon',
    '.oWckdckcNwn',
    '.oWcccccbNwn',
    '.oWcccbcbNwn',
    '.ijNcccbNiin',
    '.ijn.bb.nii.',
    '.nnn....nnn.',
    '..n......n..',
  ],
  // From behind, three strands parted by navy, each going blue, violet, teal; the turn
  // comes later in each strand from left to right, so the bands slant with the light.
  6: [
    '....nnnnn...',
    '..nnoXXoon..',
    '.nnooXXoonn.',
    '.ooXXoooonnn',
    '.oWYnoooonnn',
    '.oWwnoonoonn',
    '.oWwnWwnoonn',
    '.oYinWwnwhnn',
    '.ojinjinwhnn',
    '.ojinjinisnn',
    '.njYnjinisnn',
    '.nnnnnnnnnn.',
  ],
  7: [
    '....nnnnn...',
    '..nnoXXoonn.',
    '.nnooXXoonnn',
    '.ooXXoooonNc',
    '.oWYnooooNcc',
    '.oWwnoonoNcb',
    '.oWwnWwnhNbb',
    '.ojinWwnhn..',
    '.ojinjinhn..',
    '.nYinjinn...',
    '.nninjin....',
    '...nnnn.....',
  ],
});

// Nebula: one cloud sweeping across a navy mass, from the crown on the right down to the
// back of the head on the left. m violet cloud edge, w cloud body, W bright core,
// M crimson heart (back views only), y teal glow on the cloud's lit side, i its brightest
// glint, Y a star. The teal is a short glow, not a line along the cloud, so the cloud does
// not read as a hairband.
const NEBULA = withHair({
  n: denim[0], o: denim[1], X: denim[2],
  m: violet[0], w: violet[1], W: violet[2], M: blood[1],
  y: teal[1], i: teal[2],
  Y: bone[3],
}, {
  0: [
    '...nnnnnn..',
    '..nnooommn.',
    '.nnooiwWwmn',
    '.noyywWNNcd',
    '.nmwWWNcddc',
    '.nmwWmNckdc',
    '.nnmwmNcccc',
    '.nYnmnNbcbc',
    '.nXnnnNccc.',
    '.nnnnn.bb..',
    '..nnnn.....',
    '...nn......',
  ],
  1: [
    '....nnnnn...',
    '..nnooommnn.',
    '.nnooiwWwmnn',
    '.noyywWNNnnn',
    '.nmwWNcddcNn',
    '.nmwNckdckcn',
    '.nnmNcccccbn',
    '.nYnNccbcbn.',
    '.nXnNNcccbn.',
    '.nnnn.bbb.n.',
    '..nnn.......',
    '...n........',
  ],
  2: [
    '....nnnnn...',
    '..nnoomWmn..',
    '.noiwWmnnnn.',
    '.yyNnnnnNnon',
    '.wmNcddcNnon',
    '.mnckdckcNon',
    '.nncccccbNnn',
    '.nncccbcbNnn',
    '.nnNcccbNnnn',
    '.nnn.bb.nYn.',
    '..nn....nXn.',
    '..n......n..',
  ],
  6: [
    '....nnnnn...',
    '..nnooonmm..',
    '.nnoooimwmn.',
    '.nYooyywWwmn',
    '.nXomywWWMmn',
    '.nnmwWWWMmnn',
    '.nmwwWWmmYnn',
    '.nnmwwmnnXnn',
    '.nnnmmnnnnn.',
    '.nnnnnnnnnn.',
    '..nnnnnnnn..',
    '...nnnnnn...',
  ],
  7: [
    '....nnnnn...',
    '..nnooonmmn.',
    '.nnoooimwmnn',
    '.nYooyywWmNc',
    '.nXomywWWNcc',
    '.nnmwWWMmNcb',
    '.nmwwWMmnNbb',
    '.nnmwwmnYn..',
    '.nnnmmnnXn..',
    '.nnnnnnnn...',
    '..nnnnnn....',
    '...nnnn.....',
  ],
});

export const NIGHT_COSTUMES: readonly Costume[] = [
  { id: 'starfield', name: 'Starfield', person: NIGHT },
  { id: 'aurora', name: 'Aurora', person: AURORA },
  { id: 'nebula', name: 'Nebula', person: NEBULA },
];
