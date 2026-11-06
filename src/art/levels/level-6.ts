// Blackout: the power is out. A survivor, back to us, raises a flashlight down a concrete
// corridor toward a steel blast door left open a crack; the beam lands on the door wheel and the
// hazard-striped sill, and catches a grey face with yellow eyes squeezing through the black gap.
// Caged emergency bulbs stain the walls red, pipes run overhead, dust turns in the beam.
//
// Lit by the flashlight (bone and metal highlights on the door, a grey haze in the air) and by the
// red bulbs (blood and brick halos, a red rim on the survivor). k is the ink outline and the dark.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { ash, asphalt, blood, bone, brick, concrete, fire, ink, metal } = RAMPS;

export const LEVEL_6_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    A: asphalt[0], B: asphalt[1], C: asphalt[2],
    c: concrete[0], d: concrete[1], D: concrete[2], E: concrete[3],
    m: metal[0], M: metal[1], l: metal[2], L: metal[3],
    q: brick[0], Q: brick[1], b: blood[0], r: blood[1], R: blood[2], X: blood[3],
    h: ash[1], w: ash[2], z: bone[2], Z: bone[3],
    o: fire[0], e: fire[2],
  },
  rows: [
    'BCCCBBKKKKCCCBBBBBmmMMmmBBmMmmBBBBBBBBBBmmMMMmmBBBBBBBBC',
    'MMCCBBBKKKCCCKkkkkkmmMMmkkmMMmkkkkkkkkkkmmMMmmkkkkkkkkKC',
    'MMMMBBBBBKCCCKKkkkkkmmMmmkkmMmkkkkkkkkkmmMMmmkkkkkkkkKKC',
    'MMMMMMBBBBqCqKKKKkkkkmMMmkkmMmkkkkkkkkkmmMMmmkkkkkkKKKKC',
    'KMMMMMMMBqbbbqKKKCBBBBmMMmBBmMmBBBBBBBBmMMmmBBBBBBCKKKKq',
    'KCCMMMMMQQbQbbbKKCCBBBBmMMmBmMmBBBBBBBmmMmmBBBBBBCCKKKbb',
    'KCCCKKMQQrmMmQbbKCCKKkkkmMmkkmmkkkkkkkmMMmkkkkkKKCCKBbbQ',
    'KCCCKKqbbrRXRrbbqCCKKCBBBmMmBmMBBBBBBBmMmBBBBBCKKCCBqbQr',
    'KCCCKKKbbQQRrrQQBCCKKCCBBBmMmBMmBBBBBmMMmBBBBCCKKCCBMQQr',
    'KCCCKKKKbbbQbbQMMMCBbbbKkkkmmkmmkkkkkmMmkkkkKCqbbbbMMMbb',
    'BCCCKKKKKqbbbqKKKMMQrmQbKccccccccccccccccccKKqbrmrQqKKKq',
    'BCCCBBKKKKqCqKKKKCqQrXrbqccccccccccccccccccBBMQrXQbKKKKC',
    'BCCCBBBBBBCCCKKKKCCbQQrQMccmmmmmmmMlkkkkkccMMbbQQQbqKKKC',
    'BCCCBBBBBBCCCBBBKCCKbbbKKccmlMMlMMllkhwhkccKKCqbbbqKBBBC',
    'BCCCBBBBBBCCCBBBBCCBBCCKKccMMMLZLMlLkwwhkccKKCCBBCCBBBBC',
    'BCCCBBBBBBCCCBBBBCCBBCCBBcdMMLMmMLlLkekekccBBCCBBCCBBBBC',
    'BCCCBBBBBBCCCBBBBCCBBCCBCcdMLllmllLLkhwhkccBBCCBBCCBBBBC',
    'KCCCKKKKKKCCCKKKKCCKKCCKccdMZmmZmmZLkkhkkccKKCCKKCCKKKKC',
    'KCCCKKKKKKCCCKKKKCCKKCCKCcdMLllmllhwkkkkkccKKCCKKCCKKKKC',
    'KCCCKKKKKKCCCKKKKCCKKCCCccdMMLzmMLwhkkkkkcckkCCKKCCKKKKC',
    'KCCCKbbbbKCCCKKKBCCkkCCccccMMMLlzMlhkkkkkccBBCCkkCCBKKKC',
    'KCCCbrkkkkbCCBBkkCCkBCCCcccmlMMlMMllkkkkkccKKCCBkCCkkBBC',
    'KCCbrkkkkkkCCkkkBCCBKCcccccmmzmmmmMlkkkkkccKKCCKBCCBkkkC',
    'KCCbkkkkkkkCCBBBBCCKKCdcdkzeekkeekkeekkookkBBCCKKCCBBBBC',
    'BCCbkkkkkkkCCBBKKCCKKCccDDDDDDdzccCCKBBBKKKKBCCKKCCKKBBC',
    'kCCbkkkkkkCCCKKKKCCBBcdDEzDDEddddcccCCCCCCCCCCCBBCCKKKKC',
    'kCCCkkkkkkCCCKKKKCCBBdDDDDdzccccccccCCCCCCCCCCCBBCCKKKKC',
    'BCCCBkkkkkCCCKKKBCCBKcddcCBCCCCCCCkBBBKKKKKBBBBKBCCBKKKC',
    'BCbbrKKKKkkkkCBBBCCCcDDzcCCCCCCCCCCCCCCCCCCCCCCCCCCBBBKC',
    'BbrKKBBBKKkkkkkkCCCCdDdCCCCCCCCCCCCCCCCCCCCCCCCCCCCBBBBC',
    'KbKKBKKKBKkkkkkkkmlZdcKKzKKKBBBBBkkKKKKKBBBBBBKKKKKBBBBC',
    'bkKKBKKKBKkkkkkkkmmzKKBBBBBBKKKKKkkBBBBBKKKKKKBBBBBBBBBC',
    'rkKKBKKKBKkkkkkkKKKKKBBBBBBKKKKKkkkkBBBBBKKKKKKBBBBBBBBC',
    'bkKKBKKKBKkkkkkCCCCCCCCCCCCCCCCCCCCCCCCCCCCCbqbbqbbCCCCC',
    'bkKKKBBBKKkkkkkCCCCCCCCCCCCCCCCCCCCCCCCCCCbbqbrrrbqbbCCC',
    'bkkKKKKKKkkkkkkkBBKKKKKKKKBBBBBBkkkkKKKKKKBBbbqbbqbKKKKK',
    'bkkkkkkkkkkkkkkkKBBBBBBBBBKKKKKKkkkkBBBBBBKKKKKKKKKBBBBB',
    'bkkkkkkkkkkkkkkkkBBBBBBBBKKKKKKKkkkkBBBBBBBKKKKKKKKKBBBB',
    'bkkkkkkkkkkkkkkkkKKKKKKKKBBBBBBBkkkkKKKKKKKBBBBBBBBBKKKK',
    'bkkkkkkkkkkkkkkkkkKKKKKKBBBBBBBBkkkkKKKKKKKKBBBBBBBBBKKK',
  ],
};
