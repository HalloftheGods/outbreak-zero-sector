// Contamination Zone: a toxic spill behind the plant fence. A toppled yellow drum pours glowing
// ooze across the slab, two more leak beside it, and a hazmat-suited figure wades out of the
// green mist, visor lit by the pool, one arm reaching. A hazard sign hangs on the fence; the
// plant's chimneys and cooling tower stand against a sickly olive sky under a hazed sun.
//
// Lit by the pool from below (acid G rims on drums, boots and visor) and by the haze behind
// (rot U rims on the hood and shoulders). k is the ink outline, K the figure's silhouette.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { acid, bone, concrete, fire, ink, metal, olive, rot, teal } = RAMPS;

export const LEVEL_5_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    o: olive[0], O: olive[1], p: olive[2],
    r: rot[0], R: rot[1], u: rot[2], U: rot[3],
    a: acid[0], g: acid[1], G: acid[2],
    f: fire[0], F: fire[1], y: fire[2], Y: fire[3],
    c: concrete[0], d: concrete[1],
    m: metal[0], M: metal[1], l: metal[2],
    z: bone[2], Z: bone[3], t: teal[2],
  },
  rows: [
    'oooooooouuuuuuRuuuRRuRuRRuRRuuuuuooooooooooooooooooooooo',
    'ooooouuuRuRRRRuRRRRuRRRRuRRRRuRRRooooooooooooooooooooooo',
    'oouuuRRRuRRRRuRRRRuRRRRuRRRRuRRRRoooooUooooooooooooooooo',
    'oouRRRUuRRRRuRRRRoRRRRooRRRoooooooooooooooooooooooooUooo',
    'OrRrrrOoOoOoOoOoOoOoOoOoOoOoOoOoOUOoOoOoOoOoOoOoOoOoOoOo',
    'OORrrOOOOOOOOOUUUUUUOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
    'OOrrrOOOOOOOOUUUzzUUUOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
    'OOrrrOOOOOOOOUUzzzzUUOOOOOOOOOOOOOOOOOOOOOOOOOOUOOOOrOOO',
    'OOrrrOOORrOOOUzzZZzzUOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOrOOO',
    'OprrrpOprrOpOUzzZZzzUpRrrrrrrrrrrrOpOpOpOpOpOpOpOpOprpOp',
    'pprrrppprrpppUUzzzzUUppRrrrrrrrrrpppppppppppppkppppprppp',
    'pprrrppprrpppUUUzzUUUpppRrrUrrrrpppppppppppppkYkRrRrRrRr',
    'pprrrppprrpUppUUUUUUppppRrrrrrrrpppppppppppppkykRrrrrrrr',
    'pprrrppprrRrrrrrrrrpppppRrrrrrrrppkkkkkpppppkykykrrrrrrr',
    'UprrrpUprrrrrrrrrrrpUpUpRrrrrrrrUkUUUUKkrrUpkykykrGrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrkUKKKKKKkrrkyykyykUrrrrr',
    'rrrrrrrrrrrrGrrGrrrrrrrrrrrrrrrrkUGGGGtKkrrkyyyyykrrrGrr',
    'kkkkkkrrrrrrrKrrrrrrrrrKrrrrrrrrkUGGGGGKkrkyyykyyykrrKrr',
    'yyyYYykkkkkkkkKKKKKKKKKKKKKKKKKKkUKKKKKKkKkkkkkkkkkKKKKK',
    'fFFFFFkFyyyYYykKrKrKrKrKrKrKrKrKrkKlMKKkrKrKrKKKrKrKrKrK',
    'kkkkkkkffFFFFFkrKrkkyykKKrrryykkkkKmmKKkkkkKKrKryykkyKrr',
    'FyyYyGkkkkkkkkkkyyrKrKrkyykkrKrkUUKKKKKKKKkkkyKkrKrKrykk',
    'FykYyGkfFyyYyGkUpUUUUUUpUUUUUUUkUKKrKKKKKKKKKkKUpUUUUUUU',
    'FkkkyGkfFykYyGkUUUpUUUUppUUUUUUkUKKrKKKKkkkUKkKUUUUUUUUU',
    'FyyYyGkfFkkkyGkpUpGUUpUUpppuupUkUKKKrKKkupkkkpKpkkkkkkku',
    'kkkkkGkfGyyYyGkupppupUpuupUppuukUKkKKKKkUuuUppKkMllMMmmk',
    'FyyYyGkkkkkkkGkdddudddpdppduduukKKkkkkKkdGdpuuukmMMMmmmk',
    'FyyYygkfFyyYyGkpuupuuududppdupdukKKrKKKkuupuudukkkkkkkkk',
    'kkkkggkfFyyYgggddddddudddduuddddkKKKKrRkdddddudkGlMMmmmk',
    'dddddddkkkkkkkkkkkddddddddddddddkKKKkKRkdddddddkGMMMmmmk',
    'cccccckYYYkYYYYYkkkkcccRcRcRcRcRkKRkckKRkcccccckkkkkkkkk',
    'ccccckyyyykyyyyykYYykcuuuuuuuuuukgRkRkKgkcccccckGMMmfmmk',
    'cccckyyyyykyyyyykyaaykaaaagaggakgGgkukgGgkcRccckGMMffmmk',
    'cccckFyyyykyyyyykyaGFkggGggGgGgkkkkkakkkkkucRcckgMMmmmmk',
    'cccckFFFFFkFFFFFkFaGFkGggGGGGGGGZgggggaaauuuuRcRkkkkkkkc',
    'ccccckfFFFkFFFFFkFgGfkGGGGGGGZGGGGGGgggaaauuucRccccccccc',
    'cccccckfffkfffffkfGGfkGGGGGGGGGGGGGZgggaaauuuRcRcccccccc',
    'ccckkcckkkkkkkkkkkGGkGgggGZGGGGGgGgggggaauuuucRccccccccc',
    'cckccccccccRcRuuuugaaaggggggGggggggaaaauuuuRkRcccccccccc',
    'ccccccccccccccRcRuuuuuaagaaagaaaggauuuuuRcRccckccccccccc',
  ],
};
