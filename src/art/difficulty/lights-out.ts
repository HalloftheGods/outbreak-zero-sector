// Lights Out: the last streetlight on the block has just died. Its glass still holds a red ember,
// a crescent moon hazes the sky at the end of the street, and three zombies shamble out of the
// dark toward the fading pool of light on the kerb, eyes glowing. Near-black brick and asphalt.
//
// Lit by the moon from the upper right (denim N rims on heads and backs) and by the ground glow
// from the lower left (ash w rims on legs and arms). k is the ink outline and the silhouettes.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { acid, ash, asphalt, blood, bone, brick, concrete, denim, fire, ink, metal, rot, wood } = RAMPS;

export const LIGHTS_OUT_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    n: denim[0], N: denim[1],
    A: asphalt[0], B: asphalt[1], C: asphalt[2],
    q: brick[0], r: brick[1], b: blood[0], x: blood[1],
    c: concrete[0], d: concrete[1], D: concrete[2],
    m: metal[0], M: metal[1], l: metal[2],
    i: wood[1], j: wood[2],
    o: fire[0], s: fire[1], S: fire[2],
    g: acid[1], G: acid[2], t: rot[0],
    w: ash[0], z: bone[2], Z: bone[3],
  },
  rows: [
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkknknknkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkknknnnnnnnknkkkkkkkkkkkkkk',
    'KkKkKkKkKkKkKkMllllllMkkKkKkKknknnNnNnNnnknkKkKkKkKkKkKk',
    'dddddddddddkkMkkkkkkkkMkkkkKKKKnnNNzZZNNnnKKKKKKKKKKKKKK',
    'ccccccccccckkMkKKKKKKkMlllMkKKnnNNzZZNNNNnnKKKKKKKKKKKKK',
    'brqqqqbrqqrkkMkKKKKKkxosSoxkKKKnnNzZNNNNnnKKKKKKKKKKKKKK',
    'bkkkkkkkkkkkkmkkKKKKKkbxxbkKKKnnNNzZZNNNNnnKKKKKKKKKKKKK',
    'bkkknkkkknkkkmMkKKKKKbKbKbKKKKKnnNNzZZNNnnKKKKKKKKKKKKKK',
    'qkkAkkkkAkkkkmMkKKKKKKKKKKKKKKnKnnNnNnNnnKnKkddddddddddd',
    'qkAkkkkAkkkkkmMkkkKKKKKKKKKKKKKnKnnnnnnnKnKkkccccccccccc',
    'bkkkkkkkkkkkkmMknKkkkKnKnKnKnKnKnKnKnKnKkkkKkqqqbrqqqqbr',
    'bkkkkkkkkkkkkmMknnnnnkkkknnnnnnnnnnnkkkknnnnkqkkkkkqkkkk',
    'bkkkkkkkkkkkkmMknnnnnnnnnkkkkkkkkkkknnnnnnnnkbkkknkbkjii',
    'bcccccccccckkmMknnnnnnnnnnnnnnnnnnnnnnnnnnnnkbkkAkkbkkkk',
    'qkkkkkkkkkkkkmMknnnnnnnnnnnnnnnnnnnnnnnnnnnnkbkAkkkbkijj',
    'qkkknkkkknkkkmMknnnnnnnnnkkkknnnnnnnnnnnnnnnkbkkkkkbkkkk',
    'bkkAkkkkAkkkkmMknnnnnnnnkkkkkkNnnnnnnnnnnnnnkqkkkkkqqqbr',
    'bkAkkkkAkkkkkmMknNnNnNnGkGkkkkkNnNnNnNnNnNnNkqcccccqqqbq',
    'bkkkkkkkkkkkkmMkNNNNNNNNkkkkkkkNNNNNNNNkkkNNkbbbbbbbbbbb',
    'bkkkkkkkkkkkkmMkNNNNNNNNtkkkkkkNNNNNNNkkkkNNkccccccccccc',
    'qcccccccccckkmMkNNNNNNNNNkkkkkNNNNNNNgkgkkNNkkMMMMMMMMMM',
    'qqcccccccbrkkmMkNnnnNNNkkkkkkkkNNnnnnNkkkkNNkkmmmkkkmmmm',
    'bbkkkkkkkbbkkmMknnnnNkkkkkkkkkkkNnnnnNkkkkkNkkMMokokNMMM',
    'brkKKKKKkqrkkmMknnKnkkwwwwkkkkkkkknnkkkkkkkkNkmmkkkkNmmm',
    'bqkKgKgKkqrkkmMknnnnknKnnnkkkkkkkknkwwKkkkkkkkMkkkkkkkMM',
    'bbkKKKKKkbbkkmMkKKKKKKKKKKwkkkkkKkKKKKkkkkkKkkkkkkkkkkmm',
    'qqkKKKKKkbrkkmMkKKKKKKKKKKwkkkkkKkKKKKwkkkkKkkkMkkkkkMMM',
    'AAAAAAAAAAAkMMMMkBBBBBBBBBwkkkkkBBAAAAwkkkkAAAAAkkkkkAAA',
    'BBBBABBBCBCkmMMlkCcCccCccCwkCkCkCCCBCBwkAkkBBBBBkkBkkBBB',
    'BBBBABBCCCCkkkkkkcccccCcccwkkckkCCCCCwkBABkkBBBBkkBkkBBB',
    'BBBBABCBCCCCCBccccccccCccwkkcckkkCCCCkkBABkkBBBkkkBkkkBB',
    'cccccccddddddDDDDDDDDDDDDwkDDDDkkdddkkkccckkkccccccccccc',
    'kkkkkkkkkkkkkkkkkkkkkkkkkwkkkkkwkkkkkkkkkkkkkkkkkkkkkkkk',
    'AAAABAABBBBBBBBCCCCCCcCCkkkCCCBkkkBBBBBAAAAAAAAAAAAAAAAB',
    'BAAAAAAABABBBBBBBCCBCCCCCBCBBBBBBBCABAAAAAAAAAAAAAABAAAA',
    'AAAAAAAAAAABBCBBBBBBBBBBBBBBBBCBBBAAAAAAAAAAAAABAAAAAAAA',
    'AAAAAAAAABAAAABABBBBBBBBBBCBBABAAAAAAAAAAAABAAAAAAAAAAAA',
    'wwwwwBAAAAwwwwwAAAAAwwwwwAAAAAwwwwwAAAABwwwwwAAAAAwwwwwA',
    'ABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAA',
    'AAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAA',
  ],
};
