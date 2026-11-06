// The Workbench card: a gunsmith's bench at night under one task lamp. The lamp clamps to the
// bench's back-left corner and its olive enamel shade pours warm light down onto a rag where a
// field-stripped kit lies out: suppressor, barrel, magazine and the wooden grip panels. Right of
// the light a blue vise holds the pistol they came off, its T-handle across the screw, with two
// loose rounds stood beside it. A pegboard of spanner, hammer, screwdrivers, pliers and a clamp
// hangs behind; a red pump oil can, a greasy rag over the edge and the red toolbox below it.
//
// Lit from the lamp, upper-left. The wall and the bench top step from wood l through j and i to h
// away from the bulb (fire y/Y with bone z), and the pegboard holes are one step darker than the
// board. Steel is metal m/M/n/N, the vise denim d/D/e, the rags bone b/c/z, the lamp shade olive
// g/G, the oil can and the toolbox blood r/R. k and K are the ink outline and the shadow under the bench.

import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { blood, bone, denim, fire, ink, metal, olive, wood } = RAMPS;

export const BENCH_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    h: wood[0], i: wood[1], j: wood[2], l: wood[3],
    m: metal[0], M: metal[1], n: metal[2], N: metal[3],
    d: denim[0], D: denim[1], e: denim[2],
    o: fire[0], O: fire[1], y: fire[2], Y: fire[3],
    b: bone[1], c: bone[2], z: bone[3],
    r: blood[1], R: blood[2],
    g: olive[1], G: olive[2],
  },
  rows: [
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
    'jijjjijjjijjjijjjijjjikkkkkjkkkkkkkkikkkikkkihikkkiihkhh',
    'jjjjjjjjkkkjjjjjjjjjjjkNkNkjkNNNNnMkikRkikGkiikNkNkkkkkk',
    'jjjjjjjkGGGkjjjjjjjjjjkNnNkjknnnnMMkikrkikgkiikNkNkGGGGg',
    'jjjijjkGGGggkkjijjjijjjkNkjikkkljkkkikrkikgkiiikNkkGkkkk',
    'jjjjjkkGGgggggkjjjjjjjjkNkjjjjkljkjiikkkikkkiikRknkGkihh',
    'jjjjknjkGgggggnkkjjjjjjkNkjjjjkljkjjikNkikNkiikRkrkGkikN',
    'jkkkkiklkgggggnyYklljijkNkjjjikljkjjjkNkiknkikRkikkGkhkn',
    'jkNnkklllkgggnyzzYkllljkNkjjjjkljkjjjknkiikiikRkikkGkikn',
    'jkkkklllllkkonyzzzYkyllknkjjjjkijkjjjjkiiiiiikRkikkgkkkn',
    'jjknklljllljkonYzzYkylkNknkijjkiikjijjihiiihkkkkikkggggh',
    'jjknkllllllllkkkkkyyllkNnnkkjjkkkkjjjjkkkiikNkiiiikkkkkk',
    'jjknkllllllllllllllllllkkkkkkkkkkkkkkkkkkkkikNkiiiiiiiii',
    'jiknkjllljllljllljllljllkNzNNNNNNNNNNNNNNNNkikNkihiiihii',
    'jjknklllllllllllllllllllynnnnnnnkkkkknNnNnMkiikkiiiiiiii',
    'jjknklllllllllllllllllllkMMMMMMMMMMMMMMMMMMkiikNkiiiiiii',
    'jjknklljllljllljllljllljkkkkkkkkkkkkmmmmmmmkiiikNkihiiih',
    'jjknklllllllllllllllllllkeeDDDDDDDdkkkknMMkiiiiikkkkiiii',
    'jjknklllllllllllllllllllkeDDDDDDDDdkjknMMkiiiiiiikNkiiii',
    'jknNkkllllllllllllllllljkkkkkkkkkkkkkknMMMkiiiiikRRrkiii',
    'hhhhhhhhhhhhhhhhhhhkkkkkkkkkkNnkkkkkkkkkkMMkhhhkRRRrrkhh',
    'jjbccccccccccccccccnkNNNNNNNknMkNNNNNNNkMMMkiikRzRRrrhki',
    'jbckkkkkkkkkkzzkykzkkkkkkkkkkMmkkkkkkkkkkkkkikRzRRRrrrhk',
    'jbckNkNNNNNMNzkkkkkzcbjjkeDDkkkkDDdkihkhkhhhhkRRRRRrrrhk',
    'lbckMkMMMMMmkzkNnMkMcbllkdnddddddndkjkOkOkiiikRRRRrrrrhk',
    'lbckkkkkkkkkkzkNnMkzcbllkkkkkkkkkkkkjkYkYkhiikMNNnnnnMMk',
    'lbczzzzzzzkkkkkNnMkzcblllljjjjjjjjjjhkykykhhikkkkkkkkkkk',
    'jbkkkkkkkkkNnkkMMmkzcbjjjiiiiiiiiiiihkkkkkhhhhhhhhhhhhhh',
    'jbkNNNNNNNNnMkkkkkkkbblljjjjjjjjjjjjjiiiiiiiiiiiiiiiiiii',
    'jbkkkkkkkkkkkkzzzklkbljjjjjjjjjjjjjjiiiiiiiikkkkkkkiiiii',
    'lbbczzzzzzzzzzznckjkllllllllllllllllllllllllkcccbbklllll',
    'ikjjjjjjzccccczcbklkiiiikkkkkkkkkkkkkkkijjjikcbcbikiiiii',
    'iikbbcbcbcbbjjjjjkkkiiiikjjjjjNnMjjjjjhiiiiikcbcbkjjjjii',
    'hhhkkbkbkbkkbkbkhhhhhhhhhhhhhhhhhhhhhhhhhhhhhkbbbkhhhhhh',
    'kkjiiikkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkbkbkiiikkk',
    'KkjiiikKKKKKKKKKKKKKKKKKKKKKkkkkkMMMkkkkkKKKKKkKkjiiikKK',
    'KkjiiikKKKKKKKKKKKKKKKKKKKKKkRRRRRRRRRRrkKKKKKKKkjiiikKK',
    'KkjiiikKKKKKKKKKKKKKKKKKKKKKkrrrrrNrrrrrkKKKKKKKkjiiikKK',
    'KkjiiihhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhjiiikKK',
  ],
};
