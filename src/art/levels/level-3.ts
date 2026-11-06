// Level 3, Into the Breach: an industrial yard at dusk. The sun sinks behind the sawtooth sheds,
// and a zombie stands black against it in the torn-open gap of a chain-link fence. Two survivors,
// seen from behind, close on the breach: one with a crowbar, one with a rifle over the shoulder.
// Smokestacks on the left trail lit smoke; on the right a rust-red gantry crane's cab burns and sheds sparks.
//
// Everything is backlit, so the figures are ink k with fire o/s rims on the sun side. Sky V/v/p/o/s/S
// with sun Z, sheds b, crane rust q/r, fence mesh k/m with M rails, ground lit q/r/R toward the sun.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { ash, asphalt, blood, brick, concrete, fire, ink, metal, violet, wood } = RAMPS;

export const LEVEL_3_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    V: violet[0], v: violet[1], p: violet[2],
    b: blood[0], x: blood[1], e: blood[3],
    o: fire[0], s: fire[1], S: fire[2], Z: fire[3],
    q: brick[0], r: brick[1], R: brick[2],
    h: wood[0], i: wood[1],
    m: metal[0], M: metal[1], l: metal[2],
    A: asphalt[0], B: asphalt[1],
    c: concrete[0],
    w: ash[0], W: ash[1],
  },
  rows: [
    'VVVVVVVVVWwWVWwWVVwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVVVVWwWwwwwwwwwwwwVVWVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVVwWwwwwwwwwwwwwwwwwwwVVwVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVVwwwwwxxxVxxxVxxxVwwwVwwwVwVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVwwxxxVVxVwwwwwwxVVxxkVrxrVrVrVrVrVrVrVrVrVrVrVrVrVrVr',
    'vVvwewvVvVwwwwwxxxvVvVvkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'VvkkkkkvVvwwwxVvVvVvVvVkqqVvqqVvqqVvqqVvqqVvqqVvqqVvqqVv',
    'vvvkkovvvwwwvvvvvvvvvvvkvvqqvvqqvvqqvvqqvvqqvvqqvvqqvvqq',
    'vvvrrovvkkkkkvvvvvvvvvvkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'vvvkkovvvkkovvvvvvvvvvvvpvpvpvpvkrkkvvvvvvvvkrkkkkkvkrvv',
    'vvvkkovkvrrovokvvvvvvvppppppppppkkkkvpvvvvvvkqkeeSkvkqvv',
    'kkkkkkkkkkkkkokvpvppppppppppppppppkppppvpvvvkqkeeekvkqvv',
    'KKKKKKKKKKKKKokppppppppppopopopoppkoooppppvpkZkkkkkpkrvp',
    'KKKKKKKKKKKKKokpppppopooooSSSSSoookoooooppppSqSvpvpkkqpv',
    'KhiKkkKSsKhiKokppppooooooSZZZZZSookooopppZppkqpsppkpkqpp',
    'KhhKkkKssKhhKokpopooooooSZZZZZZZSkokooopoppSksppkkppkrpp',
    'KhhKkhKssKhhKokoooobbooSZZZkkkZZZSkkoooosoppkqppkkppkqpp',
    'KKKKKKKKKKKKKokoooobbosSZZkkkkkZZSsooobboospkqpkppkpkqpp',
    'KKKKKKKKKKKKKokoooobbssSZZkkkekZZSssosboooookrkppppkkrpp',
    'lhhlkolhhlhhloklookobssSZZZkkkZZZSsslookooloklkploklkqlp',
    'MMMMkoMMMMMMMMMMMMkoMMsSbbkkkkkkZSsMMMoklMMMMMMMMokMMMMM',
    'KmKmkoKmKmKmKkkmbmkoMmkbbkbkkkkbkbbkMMokkmbmkmbmkokmkmbm',
    'KKmKkomKKKmsssmbbbkoMMkbbkbkkkkbkbmkbbMkbkmbkqmbkokbkqmb',
    'KmqmkoqmqmskkkkobmkMMmkbbbbkkkkbbbbMMmokbkbmsssmbokmkmbm',
    'mKhhkohhmhkkkkkombkoMMkbbbbkkbkbbbMbMbokmkokkkksmokkmrbb',
    'KmkmkokmkmkkkkkobmkobMkbbbbkbbkbbbMMkmokbkokkkkkbokmkmbm',
    'KKmhkomhhhmkkkoccckockccccrksRkkcccckcokcckkkkkkcokckqmc',
    'KmkmkokmsssskkkssskockcccrkksRRrcccckmokcmkokkkmcokmkmcm',
    'mKhhkohskkkkkkkkksoomkccrRRRsRRRrBccmkokssskkkkssokcmqcc',
    'KmkmkoskkkkkkkkkkkoockcrRRRRsRRRRrccckooskkkkkkkkskmkmcm',
    'KKkokokkkkkkkkkkkkoockrRRRRRsRRRRRrcBkookkkkkkkkkkkckrmc',
    'kkkkkkkkkkkkkkkkkkokkkkkkkkkkkkkkkkkkkkokkkkkkkkkkkkkkkk',
    'qqqqqqkkkqkkkkkkqkoqqqqMqrrRsRrrqrqqqqqokqkkkkkkqkkqqqqq',
    'qqqqqqkkkokkkkkkqkoqrqrrMrRRsRMrMrrqrqqokqkkkkkkqkkqqqqq',
    'qqqqqqkkqqkkkkkkqkororrrrRRRsRRMrrrrqrqokqkkkkkkqkkqqqqq',
    'qqqqqqkkqqkkkkkkrqkqrrrrRRRRsRRRRrrrrqrkrqkkkkkkqqkqqqqq',
    'qqqqqqkkqqkkkkkkorkorrrrRRRRRRRRRorrrrqrqrokkkkkkqqqqqqq',
    'qqqqqqqqqqkkkqkkorrkrrrRRRRRRRRRRRrrrrrrrqokkqkkkqqqqqqq',
    'qqqqqqqrqrkkkrkkorrrkrRRRRRRRRRRRRRrrrrrrrokkrkkkroqqqqq',
    'qqqqqqrqrqkkkqkkorrrkRRRRRRRRRRRRRRRrrrrrrokkqkkkqrqqqqq',
  ],
};
