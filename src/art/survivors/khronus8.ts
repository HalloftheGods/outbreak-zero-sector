// Skin 1, Khronus8: an older teen about to join the Marines. A plain red shirt tucked into
// olive recruit trousers, a dark leather belt and brown boots, dog tags on a chain and a high
// and tight haircut with the sides faded to skin. No insignia, logos or text. The tallest of
// the cast. Only the k and K outline letters map to outline ink; hair, belt, boots and far leg do not.

import { RAMPS } from '../palette.ts';
import type { Person } from './rig.ts';

const { blood, ink, metal, olive, skin, wood } = RAMPS;

const legend = {
  k: ink[0], K: ink[1],
  a: skin[0], b: skin[1], c: skin[2], d: skin[3],
  h: wood[0], i: wood[1], j: wood[2],
  t: blood[1], u: blood[2], v: blood[3],
  w: wood[0], s: metal[3], S: metal[2],
  r: olive[2], q: olive[1], p: olive[0], R: olive[2], Q: olive[1], P: olive[0],
  e: wood[0], f: wood[1], g: wood[2],
};

export const KHRONUS8: Person = {
  legend,
  spread: 0,
  farLegend: { ...legend, r: olive[1], q: olive[0], p: olive[0], R: olive[1], Q: olive[0], P: olive[0], g: wood[1], f: wood[0], e: wood[0] },
  // A step under the shirt with no lit stripe: the rig cannot darken a tone that starts on
  // the ramp floor, and a sleeve whose light matched the chest broke into red-on-red specks.
  sleeve: [blood[0], blood[1], blood[1]],
  cuff: [skin[1], skin[2], skin[3]],
  hand: [skin[1], skin[2], skin[3]],
  heads: {
    0: { dx: 1, rows: [
      '...hjjih..',
      '..hijiiih.',
      '.bhiiiiiih',
      '.bbhcdddcc',
      '.bhcccdkdc',
      '.bbccccccc',
      '..bbcccbcc',
      '..abccccb.',
      '...abbbb..',
    ] },
    1: { rows: [
      '...hjjiih.',
      '..hijiiiih',
      '.bhiiiiiih',
      '.bbcdddcdc',
      '.bbcdkdcdk',
      '.bccccccdc',
      '.abcccbccb',
      '..abccccb.',
      '...abbbb..',
    ] },
    2: { rows: [
      '...hjjih..',
      '..hijiiih.',
      '.chiiiiihb',
      '.bccddddbb',
      '.ccddddcbb',
      '.cckdcdkba',
      '.ccccccbba',
      '..ccbbcba.',
      '...cccba..',
    ] },
    6: { rows: [
      '...hjjih..',
      '..hjjiiih.',
      '.chiiiiihb',
      '.cbiiiiibb',
      '.cbhiiihbb',
      '.cbbhhhbbb',
      '.abbbbbbba',
      '..abbbbba.',
      '...abbba..',
    ] },
    7: { rows: [
      '...hjjiih.',
      '..hjjiiiih',
      '.chiiiiihb',
      '.cbiiiiihc',
      '.cbhiiihcc',
      '.bbbhhhccc',
      '.abbbbbccb',
      '..abbbbcb.',
      '...abbbb..',
    ] },
  },
  torsos: {
    0: { rows: [
      '...vvuuu..',
      '..vvvuuut.',
      '.vvvuuuuut',
      '.vvuuuuuut',
      '.vuuuuuutt',
      '.uuuuuuutt',
      '.uuuuuuttt',
      '.ttttttttt',
      '..wwwwwww.',
    ] },
    1: { rows: [
      '...vvuuuu..',
      '.vvvStttSuu',
      'vvvuuStSuut',
      'vvuuuuSuuut',
      'vuuuuusuutt',
      'uuuuuuuuttt',
      'uuuuuuuuttt',
      'ttttttttttt',
      '.wwwwwwwww.',
    ] },
    2: { rows: [
      '...vvuuuuu..',
      '.vvvStttSuu.',
      'vvvuuStSuuut',
      'vvuuuuSuuutt',
      'vuuuuusuuutt',
      'uuuuuuuuuttt',
      'uuuuuuuuuttt',
      'tttttttttttt',
      '.wwwwwwwwww.',
    ] },
    6: { rows: [
      '...vvuuuuu..',
      '.vvvvuuuuuu.',
      'vvvvuuuuuuut',
      'vvtuuuuuuutt',
      'vuutuuuuuttt',
      'uuuuuuuuuttt',
      'uuuuuuuutttt',
      'tttttttttttt',
      '.wwwwwwwwww.',
    ] },
    7: { rows: [
      '...vvuuuu..',
      '.vvvvuuuut.',
      'vvvvuuuuuut',
      'vvtuuuuuutt',
      'vuutuuuuttt',
      'uuuuuuuuttt',
      'uuuuuuuuttt',
      'ttttttttttt',
      '.wwwwwwwww.',
    ] },
  },
};
