// Rex's costumes, default first. See ../costume.ts.
//
// Purple Dino and Red Dino are the green suit in other colours: the same hood, spikes,
// tail and build. The triceratops is a different hood on the same build: a frill with an
// orange rim behind the head, two brow horns and a nose horn, a beak where the felt teeth
// were, no spikes down the back and a plain tail. In every costume the mittens are the
// spike colour and the forearms are the suit's dark shade, so the arms read in front of
// the body.

import { RAMPS } from '../../palette.ts';
import type { Color } from '../../palette.ts';
import type { Costume } from '../costume.ts';
import { REX } from '../rex.ts';
import type { Facings, Person, Tone } from '../rig.ts';

const { blood, bone, denim, fire, teal, violet } = RAMPS;

/** Rex's suit in other colours. The suit tone is dark, mid, light; the spikes are light, then dark. */
function dinoSuit(suit: Tone, spikes: readonly [Color, Color], mittens: Tone): Person {
  const [dark, mid, light] = suit;
  const legend = {
    ...REX.legend,
    t: dark, u: mid, v: light,
    s: spikes[0], S: spikes[1],
    r: light, q: mid, p: dark, R: light, Q: mid, P: dark,
    f: dark, g: mid,
  };
  return {
    ...REX,
    legend,
    farLegend: { ...legend, r: mid, q: dark, p: dark, R: mid, Q: dark, P: dark, g: dark, f: dark, e: bone[1] },
    sleeve: [dark, mid, light],
    cuff: [dark, dark, mid],
    hand: mittens,
  };
}

const PURPLE_DINO = dinoSuit([violet[0], violet[1], violet[2]], [teal[2], teal[1]], [teal[0], teal[1], teal[2]]);

/** Blood red, darker than the cat's orange, with pale bone spikes and mittens. */
const RED_DINO = dinoSuit([blood[1], blood[2], blood[3]], [bone[3], bone[2]], [bone[1], bone[2], bone[3]]);

const BLUE_SUIT = dinoSuit([denim[0], denim[1], denim[2]], [fire[2], fire[1]], [fire[0], fire[1], fire[2]]);

// The frill uses the spike letters (s, S) for its rim and the suit's dark shade (t) for
// its face; the horns use the belly letters (z, Z). The felt eyes are spike orange so they
// stay apart from the horns. The face rows under each hood are Rex's.
const TRICERATOPS_HEADS: Facings = {
  0: { rows: [
    '.sssS.....z...',
    'sttttS...zZ.z.',
    'stttttuvvzvuZ.',
    'stttuvvvvvvvvu',
    'stttuvvstvvvvu',
    '.sttuvvvvvvvvu',
    '..suuvuuuuuuzZ',
    '...uuubbbbc...',
    '...uuucdkdc...',
    '...uuucdccc...',
    '....uuucccb...',
    '.....uuuu.....',
  ] },
  1: { rows: [
    '..ss..ss..SS...',
    '.ssssssSSSSS...',
    'sttttzttttzS...',
    'stttuzZuvvzZS..',
    'sttuuvzZvvzZuS.',
    'sttuuvstvvstvu.',
    '.suuuvvvzZvvvt.',
    '..uuubbbbbbb...',
    '..uuuckddkcb...',
    '..uuucdccccb...',
    '...uuuccccb....',
    '....uuuuuu.....',
  ] },
  2: { rows: [
    '...ss..ss..SS...',
    '..ssssssSSSSSS..',
    '.sttzttttttzttS.',
    'stttzZuvvvuzZttS',
    'sttuzZvvvvvzZttS',
    'sttustuvvustuttS',
    '.suvvvvzZvvuutS.',
    '..uubbbbbbbbut..',
    '..uuckdcdkcbut..',
    '..uudcccccbbut..',
    '...uucccccbut...',
    '....uuuuuutt....',
  ] },
  6: { rows: [
    '...ss..ss..SS...',
    '..ssssssSSSSSS..',
    '.svvvvvvvuuuuuS.',
    'svvvvvvvuuuuuttS',
    'svvvvvvuuuuutttS',
    '.svvvvuuuuuuttS.',
    '..ssttttttttSS..',
    '..uvvvvvvvuuut..',
    '..uvvvvvvvuuut..',
    '..uuvvvvuuuutt..',
    '...uuuuuuuutt...',
    '....uuuuuutt....',
  ] },
  7: { rows: [
    '...ss..ss..SS..',
    '..ssssssSSSSS..',
    '.svvvvvvvvuuuS.',
    'svvvvvvvvuuuutS',
    'svvvvvvvuuuutS.',
    'svvvvvvuuuuttS.',
    '.ssttttttttSS..',
    '..uvvvvvvvuucc.',
    '..uuvvvvuuucbb.',
    '...uuuuuuutt...',
    '....uuuuuut....',
  ] },
};

const PLAIN_TAIL = [
  '.......uvu',
  '.....uvvuu',
  '...uvvuuut',
  'uuvvuuuut.',
  'uttttt....',
];

const TRICERATOPS: Person = {
  ...BLUE_SUIT,
  heads: TRICERATOPS_HEADS,
  packs: {
    0: { dx: -9, dy: 1, rows: PLAIN_TAIL },
    1: { dx: -9, dy: 1, rows: PLAIN_TAIL },
    2: { dx: -9, dy: 1, rows: PLAIN_TAIL },
    6: { dy: 6, rows: [
      '.uvvu.',
      '.uvvut',
      '.uvvu.',
      '.uvut.',
      '.uvu..',
      '.uut..',
      '.ut...',
    ] },
    7: { dx: -3, dy: 6, rows: [
      '..uvvu',
      '.uuvvu',
      '..uvvt',
      '.uvut.',
      '.uvu..',
      '.uut..',
      'ut....',
    ] },
  },
  torsos: {
    ...REX.torsos,
    0: { rows: [
      '...vuuuu.',
      '.vvvuuuzt',
      '.vuuuuzzt',
      '.vuuuuzzt',
      '.vuuuuzZt',
      '.vuuuuzZt',
      '.uuuuuZtt',
      '..ttttttt',
    ] },
    6: { rows: [
      '...vvuuu..',
      '.vvvvuuuu.',
      'vvvvuuuuut',
      'vvvuuuuutt',
      'vvuuuuuutt',
      'vuuuuuuttt',
      'uuuuuuuttt',
      '.tttttttt.',
    ] },
    7: { rows: [
      '...vvuuu..',
      '.vvvvvvvu.',
      'vvvvvuvuut',
      'vvvuuuuutt',
      'vvuuuuuttt',
      'vuuuuuuttt',
      'uuuuuuuttt',
      '.tttttttt.',
    ] },
  },
};

export const REX_COSTUMES: readonly Costume[] = [
  { id: 'green', name: 'Green Dino', person: REX },
  { id: 'purple', name: 'Purple Dino', person: PURPLE_DINO },
  { id: 'red', name: 'Red Dino', person: RED_DINO },
  { id: 'triceratops', name: 'Triceratops', person: TRICERATOPS },
];
