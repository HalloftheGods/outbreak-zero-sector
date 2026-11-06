// Escalation: the same night town, but the alarms have started. A car alarm on the shop front
// flashes its hazards and paints the street red-orange, a parachute flare hangs over the roofs
// where a survivor on the shop fired it, and zombies come out of both alleys toward the noise,
// one already in the foreground reaching into the light.
//
// Lit by the car from the street (fire o/s rims on the sides facing it) and by the flare from
// above (blood rims and the red sky halo). k is the ink outline and the silhouettes.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { acid, ash, asphalt, blood, bone, brick, concrete, denim, fire, ink, metal } = RAMPS;

export const LEVEL_2_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    n: denim[0], N: denim[1],
    A: asphalt[0], B: asphalt[1],
    q: brick[0], r: brick[1], R: brick[2],
    c: concrete[0], d: concrete[1], D: concrete[2],
    v: blood[0], u: blood[1], e: blood[2], E: blood[3],
    o: fire[0], s: fire[1], S: fire[2], W: fire[3],
    m: metal[0], M: metal[1], l: metal[2],
    a: ash[0], h: ash[1],
    g: acid[2], Z: bone[3],
  },
  rows: [
    'kkkkkkkkkkkkkkkaavkvvvvvvvvvkvkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkvaavvvhhhvvvvkvkkkkkkkkkNkkkkkkkkkkkkkNk',
    'kkkkkkkkkkkkNkkvkvvavhhhhhvvvvkvkkkkkkkkkkkkkkkkkkkkkkkk',
    'KkKkKkKkKkKkKkKkvvvvhauuuakvvvvkKkKkKkKkKkKkKkKkKkKkKkKk',
    'KKKKKKKKKKkKkKkvvNvuuauuuaukvvvvkKkKkKkKkKkKkKkKkKkKkKkK',
    'qqqqqqqqqKKKKKvvvvuuueaeaeuukEkvvKKKKKKKKKKKKKKKKKNKKKKK',
    'qqqqqqqqqKKKKKKvvuuueeEEEeeuEkkkKKKKKKKKKKKKKKKKKKKKKKKK',
    'qqkkqqkkqKKKKKvvvvuueEZZZEeuukkvvKKKKKKKKKKKKNKKKKKKKKKK',
    'qqkkqqkkqKKKKKKvvuuueeEEEeeukkkkKKKKKKKKKKKKKKKKKKKKKKKK',
    'qqkkqqkkqkkkkkkvuvuuueeeeeuukkkkuKnKnKnKnKnKnKnKnKnKnKnK',
    'qqrrqqrrqkkkkkkuuuuuuuuWuuuukkkunnnnnnnnnnnnnnnKKKKKKKKK',
    'qqqqqqqqqkkkkkknuuuuuuSuuWuukkuknnnnnnnnnkkkkkkqqqqqqqqq',
    'qqqqqqqqqkkgkgkunuuuuuuuSuuukknknnnnnnnnnkkkkkkqqqqqqqqq',
    'qqkkqqkkqkkkkskmumuuuSuuuuuuumummmmmmKKKKkkkkkkqqkkqqkkq',
    'qqkkqqkKqkkkksKrqrqrqqqrqrrrrrqrqqqqqqqqqksgkgKqqkkqqkkq',
    'qqkkrqKKrkkkgskrrKKKrrrKKKrqqqKKKrrqKkKqrskkkkkqrkkqqkkq',
    'qqrrrrRRrkkkkoKrrKKKrrrKKKrRrrKKKrrrKKKrrsgkkkKrrrrqqrrq',
    'rqrrrrrrrkkkksssrKKKrrRKvvRRRRvKvrrrKKKrrokkkKKrrrrqrqqq',
    'rrrqrqqrkkkkkkkksRRRrrrooorrRrooRrqqRRRsssokkkKqrqskkkqq',
    'rrKKrrvvRkkkkkvuuuuuuuuuuuououuuuuuMuMuokkkkkkkrrskkkkkq',
    'rrKvrRvvRkkkkovMMMMMMMMuuuuuuuuuMMMMMMMMMvkkkkkRrsgkkkkr',
    'qqvKrrvvrvkkkouuuuuuukkkkkkkkkkkkuuuuuuuuvokkkkrrokkkkkr',
    'rRRRRRooRukkukouMuMMkKuKKKkKKKKuKkMMMMMuMuokkkvRRookkkRr',
    'rrRRRRRRokkuukoooookKuKKKKkKKKKKKKkuouooookukkuRoookkkkk',
    'rrrrRrrRokksuukouukKKKKKKKkKKKKKKKKkMuuuuokuukssskkkkkkk',
    'oooooosskkkssskkkkoooolllllllllllllkkkksssssssskkkkkkkkk',
    'doooossssssSSSkSollMMMMMMkMMMMMMMMMMMMSksSssssssosokkkkk',
    'oooooosssssSSkWSMMMMMMMMMkMMMMMMMMMMMMEEkSSssssssookkkkk',
    'BvvvvuuuuuuookSMMmkkkmMMMkMMMMMMMMmkkkmEkooouuuuuokkkkkk',
    'vvvvvvuuuuuusukmmkKmKkmmmmmmmmmmmmkKmKkmkoouuuuuuokkkkkk',
    'Bvvvvvvuuuusuuukkkmlmkkkkkkkkkkkkkkmlmkkuouuuuuuvokkkkkk',
    'BBvvvvvvuuuuuuuuukkkkkkkkkkkkkkkkkkkkkkuuuuuuuuuuokkkkkk',
    'BvBvvvvvvuvuuuuuvuvvvvvvBvBBBvvvvvvuvuuuuuuuuuvuvokkkvkk',
    'BBvBvvvvvvvvuvuvvvvvvvvBvBBBBBvvvvvvuvuuuuuuuvuvvokkkBkk',
    'BBBvBvvvvvvvvvvvvvvvvvBvBBBBBBBvvvvvvvvuvuvuvvvvokkkBBBk',
    'DooooBvvvvsssssvvvvvoooooBBBBBooooovvvvvsssssvvvokkkoook',
    'BBBBBBBvBvBvvvvvBvBvBBBBBBBBBBBBBvBvvvvvvvvvvvvvokkkBBBk',
    'BABBBBBBBBBBvBvBBBBBBBBBBABABBBBBBBBvBvvvvvvvBvokkkkBBBk',
    'AAABBBBBBBBBBBBBBBBBBBBBAAAAABBBBBBBBBBvBvBvBBBokkkBBBAk',
    'AAAABABBBBBBBBBBBBBBBABAAAAAAABABBBBBBBBBBBBBBokkkkABAAk',
  ],
};
