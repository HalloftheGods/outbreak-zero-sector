// The Solo card: one hooded kid with a backpack, seen from behind, standing alone in the left
// lane of an empty country road at night. A big full moon hangs over the treeline on the upper
// left, telephone poles march down the right verge to the vanishing point, and a blank road
// sign stands on the left verge. The kid's flashlight throws the only warm light in the scene,
// a beam up the road to a pool on the asphalt, while the moon casts a long shadow behind them.
//
// Lit by the moon from the upper left: denim u rims on the hood and arm, metal m on the sign,
// wood H on the left of the near pole. Sky V/d/e/u, moon z/Z/y, road a/b/c with bone n/y/Z
// lines, grass g/G/J, backpack j/J/q, beam o/s/S. k is the ink outline and the cast shadow.

import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { asphalt, bone, denim, fire, grass, ink, metal, olive, skin, violet, wood } = RAMPS;

export const SOLO_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    V: violet[0], v: violet[1], w: violet[2],
    d: denim[0], e: denim[1], u: denim[2],
    n: bone[0], y: bone[1], Z: bone[2], z: bone[3],
    a: asphalt[0], b: asphalt[1], c: asphalt[2],
    g: grass[0], G: grass[1],
    J: olive[0], j: olive[1], q: olive[2],
    h: wood[0], H: wood[1],
    M: metal[1], m: metal[2],
    p: skin[1],
    o: fire[1], s: fire[2], S: fire[3],
  },
  rows: [
    'VVVVvVvVvuuuuuvVvVvVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVKKVVV',
    'VVVVVvVuuuzzzuuuVvVVVVVVVVVVVVVVVVVVVVVVVVzVVVVkVVkkkkVV',
    'VVVVvVuuzzzzzzzuuVvVVVVVVVVVVzVVVVVVVVVVVVVVVVkkkkkkkkkk',
    'dVdvduuzzzzzzzzzuudvdVdVdVdVdVdVdVdVdVdVdVdVdVKhhhhhhhhh',
    'VdvdvuzzZZzzzzzzzuvdvdVdVdVdVdVdVdVdVdVdVdVdVKkkkkkkkkkk',
    'ddduuuzzzzzzzzzzzuuuddddddddddddddddwdddddddddddddkHhkKd',
    'ddeduzzzzzzzZZzzzZudeddddddddddddddddddddddddKddddkhhkdd',
    'ddduuzzzzzzzzZzzZZuuddddwdddddddddddddddddddKdwdddkHhkdd',
    'ddeduzzzZzzzzzzZZyudeddddddddddddddddddddddKdddddKkHhkzd',
    'ddduuuzzzzzzzzZZyuuudddddddddddddddddddddddKdkdKKdkHhkdd',
    'deeeuuzzzzZZzZyyyuueeededededededwdededededkkkkkdekHhkde',
    'edeeeuuzzzzzyZyyuueeedededededededededededKdKkKdedkHhked',
    'eeeeeeuuzzzZZyyuueeeeeeeeezeeeeeeeeeeeeeKKKKKkKeeekhhkee',
    'eweeKueuuuZZyuuueueeeeeeeeeeeeeeeeeeeeeekkkeekKKeekHhkee',
    'KKKKKKeeuuuuuuueeeeeeeeeKKKeeeeeeeeeeKKKKkKeKkKKKKkHhkee',
    'KKKKKKKeuuuuuuueueKeueueKKKKueueueueukkkukKKKkKKKKkHhkue',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKkKKkKKKkKKKKkHhkKK',
    'gggggggggggggggggggggggggggggggggaaaggkggkgggkggggkHhkgg',
    'ggggggkgggggggggggggggggggggggggaaaaagkggkgggkggggkhhkgg',
    'ggggGkmkgggggggGggkkkkggggGgggbbbbbbbbkggkgggkggGgkHhkgg',
    'ggggkmMMkgGggggggkuuuekggggggbbbbbbbbbbggkgGgkggggkHhkGg',
    'gggkmMMMMkggggggkuueeeekgggbbbbbbbbbbbbbgkgggkgggGkHhkgg',
    'GgkmMMkMMMkGggggkueeeeedkgnbbbosSsSsSsobnkggGkggggkHhkgG',
    'gggkmMMMMkggggggkueeeeedknbbbosSSSSSSSsobngggkggggkHhkgg',
    'gGggkmMMkgggGgggkueeeeddpkbbbbosSsSsSsobbbnggkggggkhhkgg',
    'gggggkmkggggggggkkdeeddkkkbbbbbsssbobbbbbbbngkggggkHhkgg',
    'ggGggkMkgggggGgkuukqqjjkekbbbbossbobbbbbbbbbykGgggkHhkgg',
    'gggggkMkGgggggkuekqjjjjJkekbbossbobbbbbbbbbbbkggggkHhkgg',
    'JggGgkMkggggggkuekJJJJJJkdkbbSSbbbbbbbbbbbbbbbyGgJkHhkgg',
    'gggggkMkgGggJgkuekjjyjjJkdmMSSbcbcbcbcbcbcbcbcbyggkHhkJg',
    'GggJGkMkggJgggkdekjjjjJJkkkkcbcZcbcbcbcbcbcbcbcbygkhhkgg',
    'kJGggkMkJgGggykpkkddddddkcbcbcbZbcbcbcbcbcbcbcbcbykHhkGg',
    'kgkggGMkggggyccckVvVkVVVkccccccZcccccccccccccccccckHhkgJ',
    'kGkgJkMkgGyccccckVvVkkVVkccccccZcccccccccccccccccckHhkgG',
    'kkkGgkGggkccccckkkkkckkkkccccccccccccccccccccccccckHhkgg',
    'kkkkgkgGckccGcccckkkkkkkkkcccccccccccccccccccccccckHhkgg',
    'kkkkGkykckGckcccccckkkkkkkkkkccccccccccccccccccccckhhkyg',
    'kkkkkkkkkkkkkccccccccckkkkkkkkkkcccccccccccccccccckHhkcc',
    'kkkkkkkkkkkkkkcccccccccckkkkkkkkkkkccccccccccccccccccccc',
    'kkkkkkkkkkkkkkkccccccccccckkkkkkkkkkkkcccccccccccccccccc',
  ],
};
