// Silent Ruins: a ruined main street at night, seen down its length to where it ends. A full,
// cold moon hangs over the collapsed storefronts on the left; the shop row on the right still
// stands, and one upstairs window there flickers warm behind a broken blind. A wrecked sedan with
// a caved roof sits nose-in at the kerb, a puddle holds the moon, and a single shambler stands
// against the faint glow at the far end of the street.
//
// Lit by the moon from the upper left: denim O rims on rooflines and on the moon's halo, metal M
// rims on the ruined walls, and the shop row's faces in concrete d/D. Sky K/v/n/N, road A/B with
// metal M centre dashes, window s/S/o/f with a brick q surround. k is the ink outline.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { asphalt, bone, brick, concrete, denim, fire, ink, metal, violet } = RAMPS;

export const LEVEL_1_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    v: violet[0],
    n: denim[0], N: denim[1], O: denim[2],
    z: bone[2], Z: bone[3],
    M: metal[1], l: metal[2], L: metal[3],
    A: asphalt[0], B: asphalt[1],
    c: concrete[0], d: concrete[1], D: concrete[2],
    q: brick[0], r: brick[1],
    f: fire[0], o: fire[1], s: fire[2], S: fire[3],
  },
  rows: [
    'KKKKKKKKKKKKNKNKNKNKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKO',
    'KKKKKKKKKKKKKNKNKNKKKKKKKKKKKOKKKKKKKKKKKKKKKKKKKKKKKOOD',
    'vKvOvKvKvKNNNNOOONNNNKvKvKvKvKvKvKvKvKvKvKvKOKvKvKvKODDD',
    'KKKvKKKvKKKNOOZZZOONKKKvKKKvKKKZKKKvKKKvKKKvKKKvKKOODDDD',
    'vvvKvvvKNvNOZZZZzZZONvNKvvvKvvvKvvvKOvvKvvvKvvvZvODDDDkD',
    'MMKvvvKvvNNOZzzZZZZONNKvvvKvvvKvvvKvvvKvvvKvvvKvODDDqkkD',
    'KKMMvvvvNNOZZZZZZZZZONNvvvvvvvvvvvvvvvvvvvvvvvvvDDqsqkkD',
    'KKKKMvvvvNOZZZZZZzZzONvvvvvvvvvvvvvvvvvvOvvvvvvvqosSqkkD',
    'KKKKKMvvNNOZzZZZZZzzONNvvvvOvvvvvvvvvvvvvvvMvMvvqoSSqkkD',
    'KkkKKKvvvNNOZZZZZzzONNvvvvvvvvvvvvvvvvvvvvvMvMOcqoSSqkkD',
    'KkkKkkMvvNNNNNNNNNNNNvNvvvvvvvvvvvOvvvvcvMvMOOdcqosfqkkD',
    'KkkKkkKvvvvNNNNNNNNNnnnnnnnnvvvvvvvvvvOcvMOOdddcqfffqkkD',
    'KKKKkkKMnvNvNNOOONNvNvnvnvnvnvnvnvnvOOdcOOdddkkcqfssqkkD',
    'KKKKKKMMMMMnvNvNvNvnvnvnvnvnvnvnvnvOdddcddkkdkkcqossqkkD',
    'KkkKKKKKnvnMnvNnMMNnnvnnnvnnnvnnnOOddkkcddkkdkkcqossqDDD',
    'KkkKkkKKMnnnvnnnKKMMvnnnvnknvnnnvddkdkkcddkkdkkcqooooDDD',
    'KkkKkkKKKnnnnnnnKKKKMMnnnkkkkknnndkkdkkcddkkdkkcooDDDDDD',
    'KKKKkkddddnnnnnnKKKKKKMMnnkknKKKndkkdkkcddkddddcDlllllll',
    'KKKKKKKKKndnnnNnNKKKKKKKNnkkNKKKKdkkdddcdllllllcllllllll',
    'qqrqqqqKKndDDnnNKKkKKKKKnOkOkKKKKllllllcllllccccdddddddd',
    'qqqqrqqKKnDccDNnKKkKKkKKDOkOkKKKKckkkkkcckkMkkkcdkkkkkkd',
    'KkMkkMkKKDdcccDNKKKKKdDDADDAAABBBckkkkkcckkMMkkcdkkklkkd',
    'KkkkkMkKKcckkcdDKKcdDDAAAMADDdBBBckkkkkcckkMMkkcdkkklkkd',
    'KkkkkkkKKckckcdddcDDABBAAAAAADddcckkkkkcckkkMkkcdkkklkkd',
    'KkkkkkkkkkkckkkkDDBAAAAAAAMAAADDddddkkkcckkkkkkcdkkMlkkd',
    'KKKKKKkllllkkllllkAAdAAAAAMAAABBDddcdddcckkkkkkcdkkMkkkd',
    'KDKKckNKkLKkkKKkKlkcDdAAAAAAAABBBDDddddcdcckkkkcdkkMkkkd',
    'dcDckNKkLkKkkKkkkKlkckAAAAMAAABBBBBDDdcddddccckcdkkkkkkd',
    'cdkkllllllllllllllllkkkAAAMAAABBBBBBBDddddcddddcdkkkkkkd',
    'kckNNNNNNNNNNNNNNNNNNNkAAAMBBABBBBBBBBDDdcddddcddddkkkkd',
    'cdknnnnnnnknnnnnnknnnnkAAAAAABBBBBBBBBBBDDdddcddddcdddkd',
    'ddknnOnnnnknnnnnnknqqnkAAAAAnnnnnnnnBBBBBBDdcddddcddddcd',
    'dDkknnnnnnknnnnnnknnnkkAAAnnnnnNOZNnnnnBBBBDDdddcddddcdd',
    'DAAkkkkMkkkkkkkkkkkkMkAAAnnnnnnNOZNnnnBBBBBBBDDcddddcddd',
    'DDDDkMkMkABAAAAAkkkMkABAAAAnnnnnNOnnnBBBBBBBBBBDdddcdddd',
    'dddDDDlMAAAAAAAAAkkkAAAAAAAMMABBBBBBBBBBBBBBBBBBDDcddddc',
    'ccdddDDAMAABAAOAAAAABAAABAAMMABBBBBBkBBBBBBBBBOBBBDdddcd',
    'kcccddDkAAAABAAAAABAkAAAAAAAAABBBBBBBkBBBBBBBBBNBBBDDcdd',
    'kkkcccckAAAAAABNAABkAkAAAAAABABBBBBBBkBBBBBBBBBBBBBBBDDd',
    'kkkkkkkkAABAAAAAAAAAAAAAAAAAAABBBBBBBBkBBBBBBBBBBBBBBBBD',
  ],
};
