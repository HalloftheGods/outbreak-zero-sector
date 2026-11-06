// The forge station: a blazing brick furnace under a steel hood, a white-hot bar on the anvil
// in the tongs, the hammer propped against the heel, sparks in the air and a tray of cut stones
// heaped in the firelight. Soot-black brick walls.
//
// Lit by the furnace mouth (left) and from the upper left. Fire o/s/S/Z, brick q/r/R, steel m/M/l/L,
// wood h/i/j, stones blood x/X/e, teal t/T/u and violet V/v/p with Z glints. k is the ink outline.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { blood, brick, concrete, fire, ink, metal, teal, violet, wood } = RAMPS;

export const FORGE_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    q: brick[0], r: brick[1], R: brick[2],
    o: fire[0], s: fire[1], S: fire[2], Z: fire[3],
    m: metal[0], M: metal[1], l: metal[2], L: metal[3],
    h: wood[0], i: wood[1], j: wood[2],
    b: blood[0], x: blood[1], X: blood[2], e: blood[3],
    t: teal[0], T: teal[1], u: teal[2],
    V: violet[0], v: violet[1], p: violet[2],
    c: concrete[0],
  },
  rows: [
    'KKKKqkKKklMMMMmmkkKKqKKkKKKKKkKKKKKkKKKKKkKKKKKkKKKKKkKK',
    'KKKKqkklMMMMMMMMmmkKqKKkKKKKKkKKKKKkKKKKKkKKKKKkKKKKKkKK',
    'kkkkkklkMMMMMMMMMkmkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'qKkklMMMMMMMMMMMMMMmmkKKqKkKqKKKkKKKKKkKKKKKMMMMMMMMMMMM',
    'qKklMMLMMMMMMMMMMMMMmmkKqKkKqKKKkKKKKKkKKKKokkkkkkkkkkkk',
    'klMMMlMMMMMMMMMMMMMkMMmmkkkkkkkkkkkkkkkokkkkkkkikkklkmkk',
    'LLLLLLLLLLllllllllllllllkmkKKkqKoKKkKKKKKkKKKKKiKKKlKmKK',
    'mmmmmmmmmmmmmmmmmmmmmmmmmKqKKkqKKKqkKKKKKksKKKoiKKKlKmKK',
    'RRRRRqRRRkRkRRkRRqrrrrqqkkkkkkkkkkkSkkskkkkkkkkikkklkmkk',
    'rrrrrqrrrkrkkrkrkqrrrrqqkKkKKoqKkKqKKKkKSKKKoKKiKKklKmKK',
    'qqqqqqqqqkkkkkkkqqqqqqqqkqkKKKqKkKqKKskKKKKKkKKiKKlKKKmK',
    'RRqRRRRkkRRRkRrrkkrrqrqqkkkkkkkskkkkkkkkkkkkkkkkkklkkkmk',
    'rrqrrrkRRkxxxxxkrqkrqrqqkqqqqkKKqSKkqKZKKZKKKslMmklKKkmK',
    'qqqqqkRRkxxxSxxxkqqkqqqqkqqsqkSKqKKkSKKKkkkkkkkkkklKKkmK',
    'RRRRkRRkxsxxSxxxxkrqkrqqkkkkkkkkkkZkkZkkkLllkkkkkklkkkmk',
    'rrrrkRRxxsSxSSxsxxqqkrqqkqkrqqqqkKKSqKkKklMmkjjjjjjjkKKK',
    'qqqqkRrossSoSSosoorqkqqqkqkqqkLMkkkkkkkKklMmkiiiiiihkKKK',
    'RRqRkkkossSoSSossokkkrqqkkkkklMkkZZZSSkkkkkkkkkkkkkkkkkk',
    'rrqrkRRossSSSSsssoqkkkkkkkSSklMkLLLLLLLLLLLLLLLLLkKKKkKK',
    'qqqqkRrossSSSSSsskSSlllllllklMklllllllllllllllllMkKKKkKK',
    'RRRRkkksssSSSSSskskkkllllMklMMkMMMMMMMMMMMMMMMMMMkkkkkkk',
    'rrrrkRRssSSSZSSSssqqkrkklklMMkMMMMMMMMMMMMMMMMMmmkkKKKKK',
    'qqqqkRrsSSZZZZZSSsrqkqqqkklMkllMMMMMMMMMMMMMMmkkkKkKKKKK',
    'RRqRkkksSSZZZZZSSskkkrqqklMkkkslMMMMMMMMMMMmmkkkkkkkkkkk',
    'rrqrkRRsSSZZZZZSSsqqkrqklMkqqkslMMMMMMMMMMMmmkKkKKKKKkKK',
    'qqqqkRroSsSZZSsSsorqkqklMqkqkslMMMMMMMMMMMMkeeXkKKKKKkKK',
    'RRRRkRRxoxsSoSxoxbqqkrklMkkkssllMMMMMMMMMMMeZeXxkkkkkkkk',
    'rrrrkRrbxbxoxbxkxbrqkklMkqkkkkkkkkkkkkkkkkkkXXxkVkkkKKKK',
    'kLLLLLLSSZZZZZZZSSLLLLLLkqkqqqkjjiiihiikktpvkxktukuuTkKK',
    'kMMMMMMMsssssssssMMMMMMMkkkkkkkjjiihkkppvkvVtXxkTuZuTtkk',
    'kqqqqqqqqqqqqqqqqqqqqqqkkqqqqkkjjkkkkpZpvVXkZXxZXkTTtkTx',
    'kkkkkkkkkkkkkkkkkkkkkkkkkqqqqkkjjVVbkkvvVkxbXxkpkVktkekk',
    'rrrrrroroooooooooorrrrrrrqqqqbkjjukekTkVkkukkepZVXxeeZxX',
    'qrrrrrrqrororororrqrrrrrqqqqqbkjjTeZxtkXxuZtbXkVkxbXkxkx',
    'qqrqrrrqrrrrrrrrrrqrrqrqqqqqqkkjjxkxkxuTVktkZXkZTVpvkZXk',
    'bbbbbbbqbqbqbqbqbqbbbbbbbbbbkkkjjkkkkkkkkkkkkkkkkkkkkkkk',
    'bcqqqqqqqqqbqqqqqqqqqqbcqccccckkkjjjjjjjjjjjjjjjjjjjjjjj',
    'kccccqcqcqcbcqcqcqcqcckccccccccckiiiiiiiiiiiiiiiiiiiiiii',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkiiiiiiiiiiiiiiiiiiiiiii',
    'cccckcccccccccckcccccccccckccccckhhhhhhhhhhhhhhhhhhhhhhh',
  ],
};
