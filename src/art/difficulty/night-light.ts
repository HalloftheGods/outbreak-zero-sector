// The Night Light On card: a child's bedroom at night, safe and calm. A plug-in crescent-moon
// night light glows on the wall above the bed, its warm halo fading from fire through lamplit
// tan wallpaper into violet and denim shadow. Below it a teddy sits against the pillow on a
// red-and-cream patchwork quilt between a wooden headboard and footboard. On the left a curtained
// window shows stars, a crescent moon and sleeping rooftops with one lit window, and its cool
// moonlight falls across the floorboards with the mullion's shadow.
//
// Lit from the night light. Its halo is fire Y/y/O, then the wall runs wood l/j/i into violet p
// and denim d, with faint wallpaper stars P/D in the dark. The moon lamp is bone z ringed by Y.
// Wood is h/i/j/l, the quilt blood m/r/R/s and bone x/Z/z, the curtains violet p/P/v, the teddy's
// bow and the moonlight denim D/e. k and K are the ink outline and the night sky's top.

import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { blood, bone, denim, fire, ink, violet, wood } = RAMPS;

export const NIGHT_LIGHT_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    d: denim[0], D: denim[1], e: denim[2],
    p: violet[0], P: violet[1], v: violet[2],
    O: fire[1], y: fire[2], Y: fire[3],
    h: wood[0], i: wood[1], j: wood[2], l: wood[3],
    x: bone[1], Z: bone[2], z: bone[3],
    m: blood[0], r: blood[1], R: blood[2], s: blood[3],
  },
  rows: [
    'ddddddDdddddddDddddpppPppppppijiiiiiijjjjjjjjjjjijiiiiji',
    'ddddddddddddddddddppppppppppiiiiiiiijjjjjjjjjjjjjjjiiiii',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkpiiiiiijjjjjjjjjjjjjjjjjjjjjii',
    'jiiiiiiiiiiiiiiiiiiiiiiiijjiiiiijjjjjjjjljllljljjjjjjjji',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkiiiiijjjjjjllllllllllllljjjjjj',
    'dkPpdPkkkkkkkkkkkkkkvPpvkiiiiijjjjjjllllllllllllllljjjjj',
    'dkPpdPkhhhiijiiZjjjkvPpvkiiiijjjjjjlllllOOOOOOOllllljjjj',
    'dkPpdPkKzZKKiiZKZKKkvPpvkiiiiijjjjllllOOOOyyyOOOOlllljjj',
    'dkPpdPkzzKKKjiKzKKKkvPpvkiiiijjjjllllOOOyyYYYyyOOOlllljj',
    'dkPpdPkzzKdKiidKdKdkvPpvkiiijjjjllllOOyyyYzzYyyyyOOllllj',
    'dkPpdPkdzZddjidddddkvPpvkijiijjjjlllOOyyYzzzyyyyyOOllljj',
    'dkPpdPkdddddiidddZdkvPpvkiiijjjjllllOyyyYzzyyyyyyyOllllj',
    'dkPpdPkhiiiijjjjjjlkvPpvkiiijjkkkllOkkkyYzzyyyyyyyOOlljj',
    'dkPpdPkDxDDDiiDDxppkvPpvkiiijkiZikkkjZlkYzzzyyyyyyOllllj',
    'dkPpdPkDDDppjiDDpppkvPpvkiiiikiijjjjjjlkYzzzYyyYyOOllljj',
    'dkPpdPkDppppiiDpyppkvPpvkiiijjkijjjjjlkyyYzzzzzYyOOllllj',
    'dkPpdPkpppppjipppppkvPpvkiiiijkikjjjklkOyyYYYYYOOOlllljj',
    'dkRRRRkpppppiipppppkRRRRkijiiikijZZZjlkOOOyyyOOOOlkkkkjj',
    'dkPpdPkhhhiijijjjjjkvPpvkiiiijkiZZkzZlklOOOOOOOlllkkkkjj',
    'dkPpdPkkkkkkkkkkkkkkvPpvkiiiiijkiZZZlkllllkkkklllkliihkj',
    'dkPpdPkiiiiijjjjjjlkvPpvkiiiiikkDeDeekklkzzzzzzklkljihkj',
    'dkPpdPkkkkkkkkkkkkkkvPkkkpiiikijjjjjjllkZzzzzzZzkkljjhki',
    'dkPpdPkddddddddddppkvvkkpppiikikjjZjjklkZZzZzZZZkkljjhki',
    'dkPpdPkdddddddddddpkvkijkkkkkkikjZZzjklkZZZZZZZZkkljihki',
    'dkPpdPkdddDdddddddDkvkijkrrrrZkZZkjjkZzkzkZZZZkzzkliihki',
    'dkPpdPkddddddddddddkvkijkrrrrZkkkksskkkkzsssszzzzkjiihki',
    'dkPpdPkddddddddddddkvkijkmmmmxxxxrrrrxxxxRRRRxxxxkjiihki',
    'dkPpdPkddddddddddddkvkhjkmmmmxxxxrrrrxxxxRRRRxxxxkjiihkp',
    'dkkkkkkdddddddDddddkkkhikxxxxrrrrxxxxrrrrxxxxrrrrkjiiKkp',
    'dddddddddddddddddddddkhikxxxxrrrrxxxxrrrrxxxxrrrrkjihKkp',
    'KKKKKKKKKKKKKKKKKKKKKkhikmkmkmkmkmkmkmkmkmkmkmkmkkjhhKki',
    'kkkkkkkkkkkkkkkkkkkkkkhikhhhhhhhhihiiiiiiiiiiiiiikihhKkk',
    'KKKKKKiDDDDDDiiDDDDDDkhikkkkkkkkkkkkkkkkkkkkkkkkkkihhKki',
    'KKKKKKKiDDDDDDiiDDDDDkhikkkkkkkkkkkkkkkkkkkkkkkkkkihhKki',
    'KKKKKKKKDDDDDDDhhDDDDkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkh',
    'KKKKKKKKKiiiiiiiiiiiiiiiihhiiiiiiiiihjijijjjjjijihiiiiii',
    'KKKKKKKKKKiDDDDDDiiDDDDDDDhhiiiiiiiihiiiiijijiiiihiiiiii',
    'KKKKKKKKKKKDDDDDDDhhDDDDDDDKKKKhKhhhhhhhhhhhhhhhhhhhhhKh',
    'KKKKKKKKKKKDDDDDDDiiDDDDDDiKhhihiiiiiiiihiiiiiiiiiiiiKih',
    'KKKKKKKKKKKKDDDDDDDiiDDDDDDihhhhhihiiiiihiiiiiiiiiiihKhh',
  ],
};
