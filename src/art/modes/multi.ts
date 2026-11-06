// The Multiplayer card: four survivors in different hoods huddled back to back around a campfire
// on a night street, each sweeping a flashlight out a different way. The bear hood and the tabby
// hood stand behind the fire, seen from behind with their lights raised at two far zombies on the
// horizon; the dino hood and the purple hoodie stand in front, turned out to the sides, their
// beams fanning down the kerbs. A full moon sits over the group against a violet sky.
//
// Figures are lit from the upper left with a warm firelit rim on their inner edges (O). Sky K/V/v
// with w stars, moon z/Z/y, street a/b/c with a k horizon, firelight on the road h/H, fire
// o/O/s/S/z over W/X/H logs. Beams are bone y with a Z core. Bear W/X/H, tabby O/s/o stripes,
// dino G/A/g with an s crest and z teeth, purple v/w/V with Z drawstrings, skin P/p, denim d/e,
// zombie eyes A. k is the ink outline.

import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { acid, asphalt, bone, denim, fire, ink, skin, violet, wood } = RAMPS;

export const MULTI_CARD: CardDef = {
  legend: {
    k: ink[0],
    K: ink[1],
    V: violet[0],
    v: violet[1],
    w: violet[2],
    d: denim[0],
    e: denim[1],
    z: bone[3],
    Z: bone[2],
    y: bone[1],
    a: asphalt[0],
    b: asphalt[1],
    c: asphalt[2],
    o: fire[0],
    O: fire[1],
    s: fire[2],
    S: fire[3],
    h: wood[0],
    H: wood[1],
    W: wood[2],
    X: wood[3],
    g: acid[0],
    G: acid[1],
    A: acid[2],
    p: skin[1],
    P: skin[2],
  },
  rows: [
    'KKKKKKKKKKKKKKKKKKKKKKKKKvKvKvKvKKKKKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKwKKKKKKKKKKKKKKvKzzzzvKvKKKKwKKKKKKKKKKKKKKKKKK',
    'VKVKVKVKVKVKVKVKVKVKwKVvVzzzzzZvVKVKVKVKVKVKVKVKVwVKVKVK',
    'VVVwVVVVVVVVVVVVVVVVVVvVvzzZzZZVvVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVVVVVVVvVzzzZZyvVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVkkVVVVVVVVVVVwVVVVVVVvzZZZZyVvVVVVVVVVVwVVVVVVVVkkVVV',
    'VVkkkkyVVVVVVVVVVVVVVVVVVvZyZyVvVVVVVVVVVVVVVVVVVVkkkkVV',
    'VVkkAkVyVVVVwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVykAkkVV',
    'VkkkkVyyyVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVyyykkkkV',
    'kkkkkkkkyyVVVVVVkkkVVVVkkkVVVVVkVVVVVVVVkVVVVVVykkkkkkkk',
    'kkkkyyykkvVvVvVkXXWkVvkWHHkvVvVkskVvVvkokvVvVvVkkyyykkkk',
    'vkkkyyyZyyvKKKKkXWkkkkkkHHkvvvvksOkkkkOokKKKKKKyyZyykkkv',
    'vkkkkyyZZyyKKKKKkXXXWWWWHkvvvvvksOOOOoookKKKKKyyZZykkkkv',
    'vkkykyyZZZyKKKKKkXXWWWWWHkKKKKKksooOOoookKKKKKyZZZykykky',
    'vkyvykyyyZZKKKKKkXWWWWWHHkKKKKKkssOOOOOokKKKKKZZyykyyvkv',
    'kkkkkykykyyZkkkkkXWWWWWHHkkkkkkkssoooOOokkkkkZyykykykkkk',
    'bbbbbbbbbbbbzkbbkWWWWWHHHkbbbbbksssOOOOOkbbkzbbbbbbbbbbb',
    'cccbcccbcckbkkkbckWWWHHHkcsbcccbkossOoOkcckpkccbcccbcccb',
    'aaaaaaaaakskkskkXXkkkkkkHHkaaassskkkkkkookokaaaabaaaaaaa',
    'aaabaaaaakkkkkkkXWWWWWWWHHkaabkssOOOOOOOookkkkkaaaaaaaab',
    'aaaaaaaakAAGGGkskWWWWWWWHXksaaksoooOOOOOokvvvVVkabaaaaaa',
    'aaaabaakAAGGGGgkkWWWWWWHHXkaaaksssOOOooOkwvvvvVVkaaaaaaa',
    'aaaaaaakAGzkzkGgskWWWWWWkXkaaakskOOOOOOkwvkkkkvVkabaaaaa',
    'aaaaabakAkHHHkGgkWWWWWWWkXkaoakskooOOOOkwvkKKKkVkaaaaaaa',
    'aaaaaaakAkPPPpkgkWWWWWWHkpoaOokPksOOOOOkwkPpppkVkaabaaaa',
    'aaaaaabkAkPkPkkgkkeeddddkkOoOOhokeeeeddkwkkpkpkVkaaaaaaa',
    'baaaaaakGkPPppkgkkedkkddkoOOsOoOkeekkedkwkPPppkvkaaabaaa',
    'aaaaaaabkGkppkggkkedkkddkOOssSOOkeekkedkwwkPPkvkaaaaaaaa',
    'abaaaaakkGGkkGGggkKKkkKKoOsSSSsOoKKkkKkwwvvkkvvkkaaaabaa',
    'aaaaaakAAGGGGGGGggkhHhHhOsSSSSSsOhHhhkwwvvZvvZvVVkhaaaaa',
    'aabhakAkGGGGGGGGgOkHhHhHOsSSzSSsOHhHhkOwvvZvvZvvkVkhaaba',
    'aaaakAkkGGGGGGGGgOkhHHHkWoOsSSOoHkHHHkOwvvvvvvvvkkVkhaaa',
    'aaakPkakGGGGGGGggOkHHHHkXWkOooHWHkHHHkOwwvvvvvvvkhkpkhab',
    'aahzkahkGGGGGGGggOkHHHHHkkWXkHWkkHHHHkOwwvvvvvvvkbhkzaaa',
    'aayybhakGGGGGGGkgpkHHHHHHHkkkHkkHHHHhkPwkvvvvvvvkhahyyaa',
    'ayZyhahkkeedddddkkHhHhHHHHHHHHHHHhHhHhkkeeeeeddkkahayZya',
    'yyZyahahkeddkdddkhhhhHhHhHhHhHhHhHhHhhhkeeekeedkahaayZyy',
    'yZZyaaaakedkhkddkhhhhhhhhhhhhhhhhhhhhhhkeekakedkhaabyZZy',
    'ZZZyaabakedkakddkhahhhhhhhhhhhhhhhhhahakeekhkedkaaaayZZZ',
    'yyyyaaaakHHkakHHkahahahahahahahahahahahkKKkakKKkaaayyyyy',
  ],
};
