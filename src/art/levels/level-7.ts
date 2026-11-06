// Quarantine Breach: the checkpoint has fallen. A zombie steps through the torn gap in the fence,
// framed against the red half of the light bar still strobing on an abandoned military truck, its
// blue half washing the sky over the canvas bed, where something else's eyes glint. A toppled
// floodlight on the ground rakes a pale beam across the yard and up the zombie's legs. A medical
// tent with a red cross, a dark watchtower, Jersey barriers and snapped hazard tape fill the yard.
//
// Lit red from behind (sky r/x/b, rims r), blue to the right (N/n/u), and from the ground by the
// beam (Z/z/E/D/d, rims z). Truck and tent olive o/O/P, fence and wire m/M/l, tape y. k is the ink.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { acid, asphalt, blood, bone, concrete, denim, fire, ink, metal, olive } = RAMPS;

export const LEVEL_7_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    b: blood[0], x: blood[1], r: blood[2], R: blood[3],
    n: denim[0], N: denim[1], u: denim[2],
    o: olive[0], O: olive[1], P: olive[2],
    c: concrete[0], d: concrete[1], D: concrete[2], E: concrete[3],
    m: metal[1], M: metal[2], l: metal[3],
    y: fire[2], Y: fire[3],
    z: bone[2], Z: bone[3],
    A: asphalt[0], B: asphalt[1],
    g: acid[2],
  },
  rows: [
    'kkkkkkkkkkkkkkbkbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk',
    'kkkkmkkkkkkbkbbbbbbbbbbbbbbxbxbxbxbxbxbxbxbxbbbbbbbbbbbb',
    'kkxxxxxxxxxxrbbbbbbbbbxbxbxbxxxxxxxxxxxxxxxbxbxbxbbbbbbb',
    'kkkkkkkkkkkkkrbbbbbxbxbxxxxxxxxxxxxrxxxxxuxxxxxxbxbxbbbb',
    'kkKKKKKKKKKkxbbbxbxbxxxxxxxxxxxxxxxrxxxxxuxxxxxxxxxbxbxb',
    'kkKkKkKkKkKkrbbxbxbxxxxxxxxxxrxrxrxrxrxrxuxxxxxxxxxxbxbx',
    'kkkkkkkkkkkkrbxbxxxxxxxxxxrxrxrrrrrrrrrrrurxrxxxxxxxxxxb',
    'kkmmmmmmmmmmrxbxxxxxxxxrxrxrrrrrrrrrrrrrrurrxrxrxxxxxxxx',
    'KkkkkkkkkkkkxbxxxxxxxxrxrxrrrrrrrrrrrrrrruNNNNNNNnxxxxxx',
    'kKkbkbbbbbbkxxbxxxxxxxxrxrrrrrrrrrrrrrrrNNNNNNNNNNNxxxxx',
    'KkkkbbbbbbbkxbxxxxxxxRRRRRRRRRRRRkkkkkkkkkkNuuuuuuuuuuuu',
    'kKlkklbblbklxxlxxlxxxxxrxrrrrrrrkRRRZkkZuuukNNNNNNNxxxxx',
    'KMkMMkMMkMMkMMxMMxMxkkkkrxrrrrrMOOOOOOOOOOOkNNNNNNNNNNNN',
    'KKMbKMkkMbbMrxMxxMxkkkkkkrxrrrrrokkkknkoookkOnOnOnOnOnOn',
    'MMMMMMMMMMMMMMMMMMMgkgkkkxrxrMMMokkknkkoookkoookoookooon',
    'KKkKkmKKkkbmxKbbbbMkkkkkkxxxxMxbokkkkkkoookkooooookkooon',
    'KKkkKmbKKPkmbbbbbbMbkkkkxxxxxMxxokxkkkkoookkoookokkkkoon',
    'KKkKKmKKkOrmxKbKbKkkkkkkkkxxMmxbokkkkkkoookkoookkgKgkoon',
    'bkkKbmKkZrZrkxKbkkkkkkkkkkkrrOOOooooooooookkooookkkkooon',
    'KkKkkmKkrrrrkbbKkkkkkkkkkkkkooookkkkkkkkkkkkoookokkkoooo',
    'KkbKKmkoZrZOrxbKzbmzkkkkkkkkooooooooooooookkoookoookoooo',
    'bkbKbkoooOOOOrbKbKmzkkkkkkkkroooooooooooMokkoooooooooooo',
    'bkKbkooookOOOOrbbbmzkkkkkkkkroooooooooooookkoookoookoooo',
    'byyKkoookkkPOOrKbKmxzkkkkkkrroxxxxkoooooookkooxxxxkkxxxx',
    'KkbkooookkkOPOOrKbmxzkkkkkrMzxkKKKkkkkkkkkkkkxkKKKkxkKKK',
    'bkkooookkkkOOPOOrbmmmzkkkkrkkkKkmkKkkkkkkkkkkkKkmkKkKkmk',
    'bkoooookkkkOOOPOOrmrMzkkMkkrkkKmMmKkkkkkkkkkkkKmMmKkKmMm',
    'kkooookkkkkkkOOOOrkkzkkkkkkrkkKkmkKkkkkkkkkkkkKkmkKkKkmk',
    'kkkkkkkkkkkkkkkkkykkzkkkkDkkrDDKKKDDDddddddcAcAKKKAccKKK',
    'kkkkkkkkkkkkkkkkkkkzkkEDDDkkrEEDDDDDDddddddccAcAcAcAAcAc',
    'AAAAAABAAAAAAAAAAByzkkEzEEkkrEEDDyDDDddddddcAcAcAcAccAcA',
    'AAAABAkkkkkAAAABADzkkkzzEzkkkEEDyxxEEEEEEEEEcAcAcAcAAcAc',
    'AABAAkMMMlkAABzzZzzkkkkzEzkkkkEDkDrDDDDDDDDDAcAEEEEEEEEA',
    'mmmmAkMllYZBZZZZZzzzzzzzEEEEEEEyDDDykkyykkyydAcDDDDDDDDc',
    'AAAAmkMlYZZAZZZZZzzzzzzzEEEEEEEDDDDddddddddddcDykkyykkyd',
    'AAAAAkmMMlZAzZZZZzzzzzzzEEEEEEEDDDDddddddddddADddddddddd',
    'AAAAmBkkkkkAAAAAEEEEEEzzEEEEEEEDDDkkkkkkkkkkkcDddddddddd',
    'AAAmAMAAAAAAAABAAAAAADEDDDDDDDDDDDDDDddddddccAkkkkkkkkkk',
    'AmmMMAAAAAAABAAAAAAAAAABAAdDdDDxxxxxxcccddnnnnnnAcAccAcA',
    'mAMAAAAAAABAAAAAAAAAABAAAAAAAAAcdcdcdccccccAAAAAAAcAAcAc',
  ],
};
