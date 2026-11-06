// Skin 0, Night: long starfield hair (a night sky with a violet nebula and stars), a
// violet hoodie with a star on it, jeans and white sneakers. This is her default
// costume, "Starfield"; the others are in costumes/night.ts.
//
// Hair: a navy mass 'n' with a lit sheen 'o'/'X' arcing over the crown from the upper
// left. A violet nebula cloud ('w' rim, 'W' body, 'v' core, which is also the hoodie's
// light) with a teal glow ('j', 'J') sits on the back of the head, and a small wisp of
// it crosses the fringe and the fall beside the face, so the galaxy shows from every
// side. Stars are 'Y' over 'X', or a 'Y' cross with 'y' arms on the back; none touches
// the face. Every hair edge that lies on the hoodie stays navy, so violet hair never
// merges into the violet hoodie. 'N' (ink) is kept only where hair meets the face; the
// cell outline draws the outer edge, so the hair has no ring of its own.

import { RAMPS } from '../palette.ts';
import type { Person } from './rig.ts';

const { bone, denim, ink, skin, teal, violet } = RAMPS;

const legend = {
  k: ink[0], K: ink[1],
  a: skin[0], b: skin[1], c: skin[2], d: skin[3],
  N: ink[1], n: denim[0], o: denim[1], X: denim[2], y: denim[2], Y: bone[3],
  w: violet[0], W: violet[1], j: teal[0], J: teal[1],
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
    // Side: the nebula on the back of the head with a star under it, and a wisp of it
    // over the brow where the crown's sheen ends.
    0: { dy: HAIR_FALL, rows: [
      '...nnnnnn..',
      '..nnnooovW.',
      '.nnoXoooWWw',
      '.nooXonNNcd',
      '.nnownNcddc',
      '.nvWwnNckdc',
      '.nWWjnNcccc',
      '.nwjJnNbcbc',
      '.nnnYnNccc.',
      '.nnoXn.bb..',
      '..nonn.....',
      '...nn......',
    ] },
    1: { dy: HAIR_FALL, rows: [
      '....nnnnn...',
      '..nnnooovWn.',
      '.nnoXoooWWwn',
      '.nooXonNNnnn',
      '.nnonNcddcNn',
      '.nvWNckdckcn',
      '.nWwNcccccbn',
      '.nwjNccbcbn.',
      '.nYnNNcccbn.',
      '.nXnn.bbb.n.',
      '..nnn.......',
      '...n........',
    ] },
    // Front: the wisp crosses the fringe and runs down the shaded fall on her left; a
    // star sits on the lit fall below the cheek, clear of the face.
    2: { dy: HAIR_FALL, rows: [
      '....nnnnn...',
      '..nnoXovWn..',
      '.noooXonWwn.',
      '.ooNnnnnNnon',
      '.noNcddcNnWn',
      '.nockdckcNWn',
      '.nncccccbNwn',
      '.nncccbcbNnn',
      '.nYNcccbNnnn',
      '.nXn.bb.nnn.',
      '..nn....nn..',
      '..n......n..',
    ] },
    // Back: the showpiece. The nebula's lit core faces the upper left and its teal glow
    // trails down to the right; a cross star and two-pixel stars sit round it.
    6: { dy: HAIR_FALL, rows: [
      '....nnnnn...',
      '..nnoooonn..',
      '.nnoXXoonnn.',
      '.nooXonnnYnn',
      '.nonnnwwnXnn',
      '.nnnwvvWwnnn',
      '.nnwWvWWWwnn',
      '.nnnwWWwjJjn',
      '.nnynnwjJjnn',
      '.nyYynnnjnn.',
      '..nynnnnnn..',
      '...nnnnnn...',
    ] },
    7: { dy: HAIR_FALL, rows: [
      '....nnnnn...',
      '..nnnoooonn.',
      '.nnooXoonnnn',
      '.nooXonnnnNc',
      '.nonnnwwnNcc',
      '.nnnwvvWwNcb',
      '.nnwWvWWnNbb',
      '.nnnwWWjJn..',
      '.nnynwjJjn..',
      '.nyYynnjn...',
      '..nynnnn....',
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
