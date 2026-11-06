// The Hive: inside the nest. Ribbed flesh folds funnel toward a black tunnel mouth where
// hunched shapes crowd the throat, a dozen eyes catching the light. Egg-sacs glow acid green on
// the floor and the right wall, webs fill the ceiling corners, one wrapped body hangs from the
// roof and another lies sunk in the folds, and a lone survivor wades the slime pool below.
//
// Lit only by the egg-sacs (low left, small cluster upper right) and the slime pool: fold crests
// near them turn rot green, the pool lights the mouth's lower lip behind the survivor's head, and
// the rest stays blood and skin-deep dark. Violet spores drift like the level's lamps. k is ink.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { acid, ash, blood, bone, fire, ink, rot, skin, skinDeep, violet } = RAMPS;

export const LEVEL_9_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    q: skinDeep[0], p: skin[0], P: skin[1],
    b: blood[0], r: blood[1], R: blood[2],
    v: violet[2], V: violet[1],
    a: acid[0], g: acid[1], G: acid[2], f: fire[2],
    u: rot[1], U: rot[2], y: rot[3],
    w: ash[1], W: ash[2],
    e: bone[1], E: bone[2], Z: bone[3],
  },
  rows: [
    'WWWWbqkkkkqqbrrrWqqkkkkkkkkkkkkkkkVkkkkkkkqqbrrrbqqkkWWW',
    'WWWwwWWWwWWbrrrbWqkkkkkkkqqqqqqqqqVqkkkkkkkqqbrrwWWwwkWW',
    'WWwwWkkwkqbWwWWbWkkkvkqqqqqqqqqqqqVqqqqkkkkkqbWWWwwqwWWk',
    'WwwqkWkwqbwwrbbkkkkkkqqbbbbbbbbbbVbbbbqqkkkkkqbbrrwWwwwk',
    'rwVWkkWwqbwrrbkPPekkqqbbrRRRRRRRRVRRrbbqqkkkkqqbrrwbqkwk',
    'rWqWVwwqWWwrbkwkkwekqbrRRRRRRRRRRVRRRRrbqqkkkkqqbWrwwWkk',
    'rWqkWwVVVrwWbkePPwwkbrRRRbababbbbbVbRRRrbvqkkkkqkkakkwkk',
    'rWwwwWqbwwVVWkwweEekrRRRbqRrRpRrparabRRRrbqqkkkkagggawqk',
    'bwqkkWqbwrrbqkeewwekrRRbqRrRpRrprrprqbRRrrbqkkkkgZGGgkqk',
    'bWkkkkWwrrbqkkweEewkRRbqRrRKaaaKKKrapqbRRrbbqkkkgZGGgkpk',
    'bWkkwwwwrrbqkkwwewekRbqRgKgKakakkKKarrqbRRrbqkkkgGGGgkkk',
    'bqWwkqbWrrbqkkeewwekVqRrRKKkakakKKKgraaqbRrbbpkkgGGGgaga',
    'bqwkkqbrWrbqkkkweekRbqrrKKkkgkaKGKGKKrrqbRRrppkkgGGGggGg',
    'bqWkkqbvrrqqkkkewwkbRraaKkkkkkaKKKKKKKprqbRrbpkkagggaGGG',
    'bqWkkqbrrrqqkkkkekRRqrpKKkkkkkgKKKKKKKrrqbRrbqgGgaakkgGg',
    'bqkkkqbrrrbqkkkRRrRbqprKkKKKkkkkkkkkkKrpqbRrbkGGGkpuuaga',
    'bqkkkqbrrrbqRRRqbrRbqrrKKGKGKkkkkkkkkKprqbRrbqgGgppuukkk',
    'bqkkkkqbrRRRkkkqbrRRbrpKKKKKKKkkkkkkgKgrbRRrbqkkkqprrbqk',
    'bqkkkkqRRRbqkkkqqbRRbprKKKKKKKkkkkkkkKrpbRRbqqvkkqbrrbqk',
    'rbqkkRRbrrRqkkkkqbRRbrrKKKKKKKkkkkkkkKprVVRbqkkkkqbrrbqk',
    'rbqRRkqprrRbqkkkqbRRRrpKKkkkkkkKKKKkKKrrRRVVqkkkqbrrrbqk',
    'rRRkkkpppuRppkkkqqbRRuUKKkkkkkKfKfKKKKUuRRbqVkkkqbrrbvqk',
    'RppkkaaakRupvkkkkqbRRbuUKKkkkKKKKKKKKUubRRbqkVkkqbrrbqkk',
    'rppkagggakupppkkkqbRRRuuUKKgkgKKKKKaKauRRRbqkkVqqbrrbqkk',
    'uukagZGggakuupagapqbRRbUyKKKkKKKKKKKKUbRRbqqkkkVVrrrbqkk',
    'uukgZZGGggkUukgGgkqbRRRbUyyKKkkkKKyyUbRRRbqkkkkqbVVVVqkk',
    'uuagZGGGGgaUuaGGGkpprRRbbUUykkkkkyUUbbRRrbqkkkqqbVrbqVVk',
    'uuagGuuGGgakakgGgkkpbRRRvbUUkkkkkUUpRRRRbqkkkkqbrrVbqkkV',
    'uUagGuGuGgagggagakkpqbRRRRbqqkkkpppRRRRvqqkkkkqbrrVqqkkk',
    'uUkggGuugggZGGgakkkkpqpRRRRkkkkkkkkkkkpqqkkkkqbbrrVqkkkw',
    'uUkaggGggagZGGgakkkkkpkkkkkkkkkkkkkaaaaaawkkkqbrrrbqkkkw',
    'pukkagggakgGGGgappukkkaaaGkkkkkkkkkgggaaaawaakkkbrrrrrwq',
    'uagggaaakkgGGGgkupkkaaaaagkkgkkkkgkgaggggaawwfkkkkkkkkwb',
    'kgZGGgkagggaGGgkkkkkaaGaGgkkgkkkkgkggggagggakwwewEewewkk',
    'kgGGGgkgZGGgggappukkaaaaagkaZkkkkgkggaggggakewEewwewEewk',
    'kgGGGgaguuGgakkuppqkkkaaaakagkkkkgkkgggaaGakwwewEewwewek',
    'pagggakguGugkpppkkkkkkkkkkaaakkakkaaaaaaakkkkkwewwewekkq',
    'kkkkkpkaguuappkkkkqqqqkkkkkppkkkkkkkkkkkkkqqqkkkkkkkkkkk',
    'kqppppppkkkkkkkkqqbbbbbqkkkkkkkkpkkpppppkkkkkkkkqbbbbbqk',
    'qbrruuupppkkkkkqbbrrrrrbqkkkkkkppkkuuuppqkkkkkqqbrrrrrbq',
  ],
};
