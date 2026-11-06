// The Stay Close card: a tall survivor and a small kid, hand in hand, seen from behind as they
// walk down a dusk street. The flashlight in the adult's right hand throws a pale cone up the
// road that fades out just short of a lone zombie shambling against the teal glow on the horizon.
// Violet sky overhead with a crescent moon, dark house silhouettes either side, and one warm
// lit window on the right.
//
// The figures are backlit by the glow, so their rims are teal T. Sky V/v/t/T, road a/b/c with
// bone y centre dashes, sidewalks C with an E curb, beam Z/y/E, window s/S/o. k is the ink outline.

import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { asphalt, bone, concrete, denim, fire, ink, metal, olive, skin, teal, violet, wood } = RAMPS;

export const STAY_CLOSE_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    V: violet[0], v: violet[1], w: violet[2],
    t: teal[1], T: teal[2],
    z: bone[3], Z: bone[2], y: bone[1],
    s: fire[2], S: fire[3], o: fire[1],
    a: asphalt[0], b: asphalt[1], c: asphalt[2],
    C: concrete[0], E: concrete[2],
    j: olive[1], J: olive[0],
    h: wood[0], H: wood[1],
    d: denim[0], e: denim[1], u: denim[2],
    p: skin[1],
    m: metal[2],
  },
  rows: [
    'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVVVVzzzVVVVVVVVVVVVwVVVVVVVVVVVVVVVVVVVVVVVVwVVVVVVVVV',
    'VVVVVzzZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVVzzZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVzVVVVVVVVVVVVVVVVVVV',
    'VVVVzzZVVVVVVVVVwVVVvVvVvVvVvVvVvVvVvVvVvVvVvVVVvVVVVVVV',
    'VVVVzZZVVVVVVvVVVvVvVvVvVvVvwvVvVvVvVvVvVvVvVvVvVvVVVVVV',
    'vVvVvzZZvVvVvVvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvVvvvwvV',
    'VvvvVvZZZvvvVvvvvvvvvvvvvvvvvvvvvvvvvvvvvwvvvvvvvvvvVvvv',
    'vvvvvvvvvkkvvvvvvvvvvvvvvvvvtvtvtvtvtvvvvvvvvvvvvvkkvvvv',
    'vvvvkkvvvkkvvvvvvvvvvvvvvtvtvtvtvtvtvtvvvvvvvvvvvkkkkvvv',
    'vvvkkkkvvkkvvvtvtvtvtvtttvtttttttttttttttvtvtvtkkkkkkkvv',
    'vkkkkkkkkkktvvvtvtvtvtttttttttttttttttttttttvtkkkkkkkkkk',
    'kkkkkkkkkktvttttttttkkkkttttTtTtTtTtTttttttttkkkkkkkkkkk',
    'kkkkkkkkkkkttttttttkTTTTkttTtTtTtTtTtTttttttkkkkkkkkkkkk',
    'kkkkkkkkkkkkktttkkkTHHHhhkTTTTTTTkkTTTTTTtkkkKkkkkkkkKKK',
    'KKKKKKKKKKKKtktkkkkHHhhhhkTTTTTTkkkTTTTTTkkkkKkSSkSskKKK',
    'KKkkkkkKKKKKTtkkkkkHhhhhhkTTTTTTkkkkTTTTkkkkkkkSsksskKKK',
    'KKkvVVkKKKKKtkkkkkkphhhhpkTTTTTkkkkkkTTTkkkkkkkkkkkkkKKK',
    'KKkVVVkKKKKKkkKvVKKkhhhhkTTTTTkTkkkTkTTkkKvVKKkSsksskKKK',
    'KKkVVVkKKKKKTkKVVKKKkppkTTTTTTTTkkkTTTTTkKVVKKksoksokKKK',
    'KKkkkkkKKKKKKkKKKkkkTTTTkkkEcccckckcCCCKkKKKKKkkkkkkkKKK',
    'KKKKKKKKKKKKKkKKkTTjjjjjjTTkcEcckckccECCkKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKkTjjjjjjjjjjTkEEEEbcbcbcCCCCCkKKKKKKKKKKK',
    'KKKKKKKkkkkkKKKkTjjjjjjjjjJJkyEEyEbcbcbcECCCkKKKKKKKKKKK',
    'KKKKKKkTTTTTkCCkjjjkjjjjjkJJkyyEyEEbEbbbbbCCkKKKKKKKKKKK',
    'KKKKKkTuuuuuekCkjjjkjjjjjkJJkyyyEEEEbbbbbbbEkKKKKKKKKKKK',
    'KKKKKkuuuueeekkjjjkkjjjjjkJJkyyyyEyEEbEbbbbbkKKKKKKKKKKK',
    'KKKKKkuueeeeekkjjjkjjjjjjJkJJkyyyyEyEEbbbbbbbbECCCCCCCCC',
    'KKCCCkueeeeeekkjjkjjjjjjjJkJJkZyyyyybbbbbbbbbbbEECCCCCCC',
    'CCCCCCkeeeeekbkppkjjjjjjjJkJpkZyybbbbbbbbbbbbbbbbECCCCCC',
    'CCCCCkTTuuuekkkppkJJJJJJJJkpmzybbbbbbbbbbbbbbbbbbbEECCCC',
    'CCCCkTuuuueeeppkkbkJJJJJJJkkkbbbbbbbbbbbbbbbbbbbbbbbECCC',
    'CCCEkuueeeeekkkbbbkddddddddkbbbbbbbbbbbbbbbbbbbbbbbbbEEC',
    'CEEbkueeeeeekbbbbbkdddkkddekbbbbybbbbbbbbbbbbbbbbbbbbbbE',
    'Ebabakeeeeeekbababkdddkbkdekababybababababababababababab',
    'bbbabkdddddekbbabbkddkbakdekbbbabybabbbabbbabbbabbbabbba',
    'ababakddkkdekbababkddkabkkkkababayababababababababababab',
    'bababkddkakdkababkkkkkbabababababybababababababababababa',
    'aaaaakkkkakkkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'baaabaaabaaabaaabaaabaaabaaabaaabaaabaaabaaabaaabaaabaaa',
  ],
};
