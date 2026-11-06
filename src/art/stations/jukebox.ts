// Jukebox: the bunker's jukebox glows in its dark brick corner. Pink, teal and amber neon tubes
// run up its pillars and round the arch, a record stands in the amber window with the tone arm on
// it, and notes drift up the wall. The checkerboard floor catches the glow in front, a crate holds
// an album sleeve on the left, and a skull in headphones nods along on the crates to the right.
//
// The neon is the light: violet V halos the brick and floor tiles near it. Wood and metal are the
// same timber and steel as the bunker's jukebox prop, lit from the upper left. k is the ink outline.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { ash, blood, bone, fire, ink, metal, skin, teal, violet, wood } = RAMPS;

export const JUKEBOX_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    v: violet[0], V: violet[1], P: violet[2], p: skin[3],
    t: teal[0], U: teal[1], T: teal[2],
    O: fire[0], o: fire[1], S: fire[2], Q: fire[3],
    w: wood[0], i: wood[1], j: wood[2], I: wood[3],
    m: metal[1], l: metal[2], L: metal[3],
    a: ash[0], x: blood[2], Z: bone[3],
  },
  rows: [
    'KKKKKkkKKvKKKvKvvKvvvvvKvvvkkKvvvvvKvvkvvKKvkKKKKkKKKKKK',
    'mmmmmmkkmmmmmmmmmmmmmmmmmmkSQkmmmmmmmmkkmmmmkKKKkKKKKKKk',
    'KKKKKKkkKKKKKKKKKKKKKKVKVkkkkkkKVKKKKKkkKKKKkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkIIIiiikkkkkkkkkkkkkkKkKKKKKKkKK',
    'KKkKKKKvkvKvvvKvvvvvVkkIIPPPPPPiikkvVvKvvvvvkkKKKKKKkKKK',
    'kkkkkkKkKkKKKKKKKKKkkIIPPppppppPPiikkVKKKKKKkkkSSSSkkkkk',
    'KKKKKKKvKvvKvvvvvKkkIPPpppwwwwpppPPikkVvvKvvkKKSKKSKKKKK',
    'KKKKvkvKvvvKvvvvvVkIPPpwwwTTTTwwwpPPikvVvKPvkKKSKkSKKKKK',
    'kkkkkKkKkPPKKKKKVkIPPpwwTTUUUUTTwwpPPikKKKPPkkSSkSSkkkkk',
    'KKkKvKvKKPvPvvKVkkIPpwTTUUSSSSUUTTwpPikkvvPvkKSSKSSKKKkK',
    'KKkKKvKvKPvvvvKvkIPpwwTUSSQQQQSlUTwwpPikVPPvkKkKKKKKKkKK',
    'kkkkKkKPPPKKKKKVkIPpwTUSSQkkkkQlSUTwpPikKKKKkkkkkkkkkkkk',
    'KKKvKKKPPPvKvvVkIPppwTUSQkKaaKkLSUTwppPikKvvkKKKKkkkkkKK',
    'KKKKvkvKvvvKvvvkIPpwTUSSkKakKKKkSSUTwpPikVvvkKKKkTZZZTkK',
    'kkkKkKkKKKKKKKVkIPpwTUSSkaKxxKKkSSUTwpPikKKKkkkkTZZZZZTk',
    'KKkKvKvKKvvvvvKkIPPwTUSSkKKxxKkkSSUTwPPikVvvkKKkUZkZkZUk',
    'KKkKKvKvKvvvvTVkIPPwTUoSkKkKKkKkSoUTwPPikvvvkKKkUZZZZZUk',
    'kkkkKkKkKKKKKTKkjPPwTUoSSkKKKKkSSQUTwPPikVKKkkkkkkZkZkkk',
    'KKKKkkkvKvvKTTVkjPPwTUQwwwkkkkwwwoUTwPPikKvvkkkkkkkkkkkK',
    'KKkkKaKkkvvKTTvkjPPwTUooooooooooooUTwPPikVvvkKkPIIIIIIkK',
    'kkKaKxKKKkKKKKVkjPPwTUokxkSkTkxkSQUTwPPikKKKkkkPIIIIIIkk',
    'KkkkkkkkkkkvvvKkjPPwTUQkkkkkkkkkkoUTwPPikVvvkKkPjjjjjwkK',
    'KkTTTTTTTUkvvvVkjPPwTUoOwOwOwOwOwoUTwPPikvvvkKkPjjjwwjkk',
    'kkTUPPPUUUkkKKKkjPPwTUoowowSSowowQUTwPPikVKKkkkPiwwiiikk',
    'KkTPPkPPUUkKKvVkjPPwTUQowoSQQSwowoUTwPPikKvvkKkPwjjjjjkK',
    'kkTUPPPUUUkkkkkkjPPwTUoowowSSowowoUTwPPikkkkkkkPiiiiiikK',
    'akUUUUUUUtkaakkkjPPwTUoOwOwOwOwOwQUTwPPikaakkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkakjPPwTUQkkkkkkkkkkoUTwPPikkaakPIIIIIIIIIk',
    'kIIIIIIIITkakkkkjPPwTUSwwwwwwwwwwSUTwPPikaaakPIIIIIIIIIk',
    'kIIIIIIIITkkkkkllllllllllllllllllllllllllkaakPjjjjjjjjwk',
    'kjjjjjjjjTkkkakmLmmLmmLmmLmmLmmLmmLmmLmmmkkakPjjjjjjwwjk',
    'kjjjjjjwwTkakKkmmmmmmmmmmmmmmmmmmmmmmmmmmkVakPiiiiiwiiik',
    'kiiiiwwiiTkaVVkkkkkkkkkkkkkkkkkkkkkkkkkkkkKKkPjjjwwjjjjk',
    'kjjwwjjjjTkaVkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkKkPjjwjjjjjjk',
    'kwwjjjjjjTkKKVVVPVKUtKKVVVVVKKKKKVVtUVVPKKKVkPiwiiiiiiik',
    'kiiiiiiiiTkKVVVVPKKKKKKVVVVVKKKKKVVtUVVKKKKKkPwjjjjjjjjk',
    'kkkkkkkkkkkKKKKKKVVUtVKKKKKKVVVVVVKKKKKPVVVVkPiiiiiiiiik',
    'kkkkaaaaaakkKKKKPVVUtVKKKKKKVVVVVVKKKKKKVVVVkkkkkkkkkkkk',
    'kkkaaaaaakkkKKKVPVVUtVKKKKKKVVVVVVKKKKKKVVVVaaakkkkkkaaa',
    'aakkkkkkaaaaaVVKKKKKKVVVVVVVKKKKKKKtUVVPVKKkkkkkaaaaaakk',
  ],
};
