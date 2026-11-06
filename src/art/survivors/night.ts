// Skin 0, Night: long dark hair that shimmers with blue galaxy colours, a violet hoodie
// with a star on it, jeans and white sneakers.
//
// Hair: a dark denim mass 'n' with a lit sheen band 'o' arcing over the crown from the
// upper left, 'X' strand highlights inside it, and at most two 'Y' over 'X' glints per
// facing. 'N' (ink) is kept only where hair meets the face; the cell outline draws the
// outer edge, so the hair has no ring of its own.

import { RAMPS } from '../palette.ts';
import type { Person } from './rig.ts';

const { bone, denim, ink, skin, teal, violet } = RAMPS;

const legend = {
  k: ink[0], K: ink[1],
  a: skin[0], b: skin[1], c: skin[2], d: skin[3],
  N: ink[1], n: denim[0], o: denim[1], X: denim[2], y: teal[2], Y: bone[3],
  t: violet[0], u: violet[1], v: violet[2], z: bone[3],
  r: denim[2], q: denim[1], p: denim[0], R: denim[2], Q: denim[1], P: denim[0],
  e: bone[0], f: bone[1], g: bone[2],
};

/** Her hair falls past the head's slot, over the shoulders, so it hangs this far down. */
const HAIR_FALL = 3;

export const NIGHT: Person = {
  legend,
  spread: -1,
  shorter: { legs: 1, torso: 0 },
  farLegend: { ...legend, r: denim[1], q: denim[0], p: denim[0], R: denim[1], Q: denim[0], P: denim[0], g: bone[1], f: bone[0], e: bone[0] },
  sleeve: [violet[0], violet[1], violet[2]],
  cuff: [violet[0], violet[1], violet[2]],
  hand: [skin[1], skin[2], skin[3]],
  heads: {
    0: { dy: HAIR_FALL, rows: [
      '...nnnnnn..',
      '..nnnooonn.',
      '.nnoXooonnn',
      '.nooXonNNcd',
      '.nnonnNcddc',
      '.nYonnNckdc',
      '.nXnnnNcccc',
      '.nnonnNbcbc',
      '.nnonnNccc.',
      '.nnonn.bb..',
      '..nonn.....',
      '...nn......',
    ] },
    1: { dy: HAIR_FALL, rows: [
      '....nnnnn...',
      '..nnnooonnn.',
      '.nnoXooonnnn',
      '.nooXonNNnnn',
      '.nnonNcddcNn',
      '.nYoNckdckcn',
      '.nXnNcccccbn',
      '.nonNccbcbn.',
      '.nonNNcccbn.',
      '.nonn.bbb.n.',
      '..nnn.......',
      '...n........',
    ] },
    2: { dy: HAIR_FALL, rows: [
      '....nnnnn...',
      '..nnoXoonn..',
      '.noooXonnnn.',
      '.ooNnnnnNnon',
      '.noNcddcNnon',
      '.nockdckcNon',
      '.nncccccbNnn',
      '.nncccbcbNnn',
      '.noNcccbNnnn',
      '.non.bb.nnn.',
      '..nn....nn..',
      '..n......n..',
    ] },
    6: { dy: HAIR_FALL, rows: [
      '....nnnnn...',
      '..nnnoooon..',
      '.nnooXooonn.',
      '.ooXoXonnnnn',
      '.ooXonnnnonn',
      '.nonnnonnonn',
      '.nonYnonnonn',
      '.nonXnonnnnn',
      '.nnnnnonYnn.',
      '.nnonnnnXnn.',
      '..nonnnnnn..',
      '...nnnnnn...',
    ] },
    7: { dy: HAIR_FALL, rows: [
      '....nnnnn...',
      '..nnnoooonn.',
      '.nnooXooonnn',
      '.ooXoXonnnNc',
      '.ooXonnnnNcc',
      '.nonnnonnNcb',
      '.nonYnonnNbb',
      '.nonXnonnn..',
      '.nnnnnonnn..',
      '.nnonnnnn...',
      '..nonnnn....',
      '...nnnn.....',
    ] },
  },
  // Torsos: a lit cluster on the upper-left shoulder, a shaded mass in the lower right
  // and a shaded hem; the star is a sparkle (bone centre, lit violet arms); back views
  // get a fold from each armpit toward the spine.
  torsos: {
    0: { rows: [
      '...uuuuu.',
      '..vvuuuuu',
      '.vvvuuuuu',
      '.vvuuuuut',
      '.uuuuuutt',
      '.uuuuuutt',
      '.uuuuuttt',
      '.uuuuuttt',
      '..ttttttt',
    ] },
    1: { rows: [
      '...uuuuu..',
      '.vvvuuuuuu',
      'vvvuuuvuuu',
      'vvuuuvzvut',
      'uuuuuuvutt',
      'uuuuuuuutt',
      'uuuuuuuttt',
      'uuuuuuuttt',
      '.tttttttt.',
    ] },
    2: { rows: [
      '...uuuuu..',
      '.vvvuuuuu.',
      'vvvuuvuuut',
      'vvuuvzvuut',
      'uuuuuvuutt',
      'uuuuuuuutt',
      'uuuuuuuttt',
      'uuuuuuuttt',
      '.tttttttt.',
    ] },
    6: { rows: [
      '...uuuuu..',
      '.vvuuuuuu.',
      'vvvuuuuutt',
      'vvtuuuutut',
      'vuutuutuut',
      'uuuuuuuutt',
      'uuuuuuuutt',
      'uuuuuuuttt',
      '.tttttttt.',
    ] },
    7: { rows: [
      '...uuuuu..',
      '.vvuuuuuu.',
      'vvvuuuuutt',
      'vvtuuuutut',
      'vuutuutuut',
      'uuuuuuuutt',
      'uuuuuuuutt',
      'uuuuuuuttt',
      '.tttttttt.',
    ] },
  },
};
