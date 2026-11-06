// Level 4, Abyssal Depths: a flooded underpass. Rain hazes the street beyond the tunnel, a
// survivor wades waist-deep toward it with a flashlight raised, a sedan sits drowned to its
// windows, and the leaking pipe drips into teal water. Under the surface, right where the lamp's
// reflection breaks, something huge is looking up.
//
// Lit by one sickly fluorescent under the bridge (teal u/T rims, and its column on the water)
// and by the rain haze behind (denim N/V). k is the ink outline and the silhouettes.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { ash, bone, concrete, denim, fire, ink, metal, rot, teal, wood } = RAMPS;

export const LEVEL_4_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    n: denim[0], N: denim[1], V: denim[2],
    t: teal[0], T: teal[1], u: teal[2],
    c: concrete[0], d: concrete[1], D: concrete[2], E: concrete[3],
    m: metal[0], M: metal[1], l: metal[2],
    b: wood[1], g: rot[1], G: rot[0],
    w: ash[0], W: ash[1], z: bone[2], Z: bone[3],
    o: fire[1], O: fire[3],
  },
  rows: [
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'dddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    'ccckccccccckccccccckccccccckccccccckccccccckccccccckcccc',
    'ccckccccccckccccccckccccccckccccccckccccccckccccccckcccc',
    'ddddddddddddddddddddddddDDDDDDEEEEEEEEEEEEEDDDDDDddddddd',
    'MMMMMMMMMMMbbMMMMMMMMMMMbbMMlllllllllllllllllMMMMMbbMMMM',
    'mmmmmmmmmmmbbmmmmmmmmmmmbbmmmmmmmmmmmmmmmmmmmmmmmmbbmmmm',
    'dccckccDKkKukkkkkkkkkkkkukkkkkkkkmkkkkkmkkkkkddcDduddddd',
    'cccdcccDkkkkkkkkkkkkkkkkkkkkkkkkmmmmmmmmmkkcccccDdddddkd',
    'ccdcckdDKkKTkKKkKnnnnnnnNnnnnnnkTuZZZZZuTkddcddcDkTddddd',
    'kdcccdcDKkKukKKkKnnNnnkNnnnnnnnnkTuuuuuTkcddcddcDduddddk',
    'dcccdckDkkkkkkkkknNnnnnkTnkkknnnnnnTnTnnncccccccDdkddddd',
    'ckcdcccDKkKKkKKkKnnnnnnnkkkkTknnnnnnnnnnncddcddcDddddddd',
    'ccdcccdDKkKKkKKkKNNNNNNNNkkkkkNNNnnnnNNNNcddcddcDddkdddd',
    'cdkccdcDkkkkkkkkkNNNnnnNNNkkkNNONnnnnNNVNcccccccDddddddd',
    'dcccdccDKkKTkKKkKNNNnnnNkkkkkTkoNnVnnNVNNcddcddcDdddkddd',
    'ccckcccDKkkkkkkkknnnnNnkkkkkkTkNNNnnnnnNNcddcddcDdTddddd',
    'ccdcccdDkllllllllknnnnnkkkkkkTNNNnnNnnnnncccccccDduddkdd',
    'cdcckdckMnnTnkMnnTkNnnnNkkkkkTnnnnnnnnnnncddcddcDddddddd',
    'GccGdckMnnTnnkMnnnTknnnnkkkkkTnnnnnnnnnnncddcddcGddGddGd',
    'gGgGkkMMMMMMMMMMMMMMkknnkkkkkknnnnnnnnnnncccccccgGgGgGgG',
    'gggkMlllllllllllllllMknnnkkkknnnnnnnnnnnncddcddcgggggggg',
    'TTTTTTuTTuTTuTTuTTuTTuTuuuuuuuuuuuuuuuuuuuuuTTTTTTTTTTTT',
    'tcccKKcKKtKKtKKtKKtKtttTkkkkkTttutuuZutuuttTuuTttdddtddd',
    'tcctccKKcKKtKKtKKtKtttttTTTTTttttuuZuuuutuTtTttTtTktdddt',
    'cctccKKcKKnKKtKKtKtttnnnnttttttttuuuuZuuuttttnundkkdddtd',
    'ctTTTKTKKTKKtKKtKnnnttttttttnnnnuutuuuutnnnutnnwwwwwTkdn',
    'nccctccctttnnnnttttttttnnnnttttttTTTnTTTttnnwTkWWWWwkkwn',
    'tcctcccncnttttTTTTTTTTttttttttnnnnTTTTtTnwwwWTkwwwwwwwww',
    'ccnccctctttttnnnnttttttttnnnnttttTTtTTTnwwWWwwTTTTTTTTTw',
    'nnnnnnnnttttnnnnnnnnttttnnnnnnnntTTTTTTTTWwwwwwwwwwwwwww',
    'nnnttttnnnnnnnnttttnnnnnnnnttttnnnnTTnwTwwwwwwwwwwwwwwww',
    'ttnnTTTTTTTTTTTnnnnnnnttttnnnnnnnnttnwwwwwkkkwwwwwwkkkww',
    'nnnnnttttnnnnnnnnttttnnnnnnnnttttnttwwTwwwwZzwwwwwwwwZzw',
    'nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnntnwwwwwwwwwwwwwwwwwwww',
    'nnnnnnnnnnnnnnnnnnTTTTTTTnnnnnnnnnnwwTTTTTTTTwwwwwwwwwww',
    'nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnwwwwTwwwwwwwwwTTTTTTT',
    'KnnnnnnnnKKKKnnnnnnnnKKKKnnnnnnnnKwwTwwwwwwwwwwwwwwwwwww',
    'nnnnKKKKnnnnnnnnKKKKnnnnnnnnKKKKnnwwwwTwwwwwwwwwwwwwwwww',
  ],
};
