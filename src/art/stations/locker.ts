// The locker room: a row of dented steel lockers with stencilled numbers. The nearest stands open on
// a rifle, an ammo box and a medkit, a bare bulb hangs warm over the concrete, and a duffel waits
// on the bench in front.
//
// Lit by the bulb from the upper left (J and f on the wall, D on the locker edges); the lockers fall
// into denim shadow toward the right. k is the ink outline.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { blood, bone, concrete, denim, fire, ink, metal, olive, wood } = RAMPS;

export const LOCKER_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    n: denim[0], N: denim[1], D: denim[2],
    m: metal[0], M: metal[1], l: metal[2], L: metal[3],
    c: concrete[0], d: concrete[1], e: concrete[2], f: concrete[3],
    s: fire[1], S: fire[2], Y: fire[3],
    i: wood[1], j: wood[2], J: wood[3],
    u: olive[0], v: olive[1], V: olive[2],
    z: bone[1], Z: bone[3], x: blood[2],
  },
  rows: [
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'LLLLLLmlmLLkLLLLllllmmllllllllllllllllllllllmmllllllllll',
    'MMMMMMkMkMkNkMMMMMMMmmMMMMMMMMMMMMMMMMMMMMMMmmMMMMMMMMMM',
    'kkkkkkkkkkkNLkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'eeeffffkfekNLLlkkekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'fefffffkfekNLLlllkkLLLLLLLLLLkLLLLllllklllllMMMkMMMMMMMM',
    'fffffffkfekNLLlllMkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'ffffffJkJekNLLlllMkkkkkkkkkkkkDDNNNNNnkDNNNNNNnkNnnnnnnn',
    'eeefefkMkfkNLLlllMkkkkkkkZZZkkDDNNNNNnkDNNNNNNnkNnnnnnnn',
    'ffJffJmlmJkNLLlllMkkVVVVkZxZkkDDkkkkNnkDNkkkkNnkNnkkkknn',
    'fffJfJsYsJkNLLMMMMkkvSvvkxxxkkDDDDDDNnkDNDDDDNnkNnNNNNnn',
    'ffJJfsYYYskNMMlllMkkuuuukzxzkkDDkkkkNnkDNkkkkNnkNnkkkknn',
    'fffJfsYYYskNLLMMMMkLLLLLLLLLLkDDDDDDNnkDNDDDDNnkNnNNNNnn',
    'eefeffsSsfkNMMlllMkMMMMMMMMMMkDDkkkkNnkDNkkkkNnkNnkkkknn',
    'fffJfJJJJfkNLLMMMMkkkkkkkkkkkkDDDDDDNnkDNDDDDNnkNnNNNNnn',
    'ffffffJfJekNMMlllMkKKKKKKkLkKkDDNNNNNnkDNNNNNNnkNnnnnnnn',
    'fffffffffekNLLlllMkKKnnnnkLkDkDDzzNNNnkDNzzNNNnkNnMnMnnn',
    'fefffffffekNLLlllMkKKnnnnkLkDkDDNNzNNnkDNNNzNNnkNnMnMnnn',
    'dddeeeeeeekNLLlllMkKKnnnkJLkDkDDNzNNNnkDNNzNNNnkNnMMMnnn',
    'eeeedefekkkkkLlllMkKKnnnkJMkDkDDzNNNNnkDNNNzNknkNnnnMnnn',
    'eeeedeekjjjjjklllMkKKnnnkJjkDkDNzzzNlnkDNzzNklkkNnnnMnln',
    'eeeekkkjkkkkkjkkkMkKKnnkJjkkDkDNNNnnMnkDNnnNklkkNnKKnnMn',
    'dekkVVVjVVVVVjVVVkkKKnnklMknDkDNNNnNDnkDNnNDkMkkNnKnNnkn',
    'ckVVVVVjVuulVjVVVVVkKnnkMmlkDkDNNNNDDnkDNNDDkkkkNnnNNnnn',
    'dkvVvvvivvvvvivvvvvkKnnkJjkkDkDNkkkkNnkDNkkkkNnkNnkkkknn',
    'dkvVvvvivuuuuiuuuuukKnkJjjknDkDNDDDDNnkDNDDDDNnkNnNNNNnn',
    'dkuvuuuiuuuuuiuuuuukKkJJjiknDkDNkkkkNnkDNkkkkNnkNnkkkknn',
    'dkuuuuuiuuuuuiuuuuukKkJjjiknDkDNDDDDNnkDNDDDDNnkNnNNNNnn',
    'cckuuuuiuuuuuiuuuukkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkKKkKKKKKKKK',
    'JJJJJJJJJJJJJJJJJJjjjjjjjjjjjjjjjjjjjjjjjjjjkkKkKkKKKKkK',
    'JJJJJJJJJijjjjjjjjjjjijjjjjjjjjjjijjjjjjjjjjkccccccccccc',
    'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiikccccccccccc',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkccccccccccc',
    'KKkjikKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKkjikKKKKKccccccccc',
    'eekiikKfKfKfKfKfKeKeKeKeKdKdKdKdKdKcKckiikKcKcKckkkkkccc',
    'efkiikffffffffffffefeeeeeeddddddddddcdkiikccccckMkMkMkcc',
    'eekiikfffffffffffefeeeeeededdddddddcdckiikcccccckkkkkccc',
    'eekkkkffffffffffefeeeeeededdddddddddcckkkkcccccccccccccc',
  ],
};
