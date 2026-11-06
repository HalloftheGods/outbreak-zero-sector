// Final Stand: the city burns at the end. Towers blaze against a crimson sky full of smoke and
// embers, a gutted high-rise stands in the haze, and under the skyline a wall of fire stretches
// across the street with the horde packed behind it, arms up against the glow. In front, the last
// barricade: a wrecked car on the left, sandbags on the right, and one survivor in the gap between
// them, back to us, rifle shouldered.
//
// Everything is backlit by the fire. The horde is a red x crowd behind a black k front rank, the
// barricade and survivor are near-black with s/S rims, and F is the white-hot heart of the blaze.
import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';

const { asphalt, blood, brick, fire, ink, metal, wood } = RAMPS;

export const LEVEL_10_CARD: CardDef = {
  legend: {
    k: ink[0], K: ink[1],
    b: blood[0], x: blood[1], X: blood[2],
    o: fire[0], s: fire[1], S: fire[2], F: fire[3],
    q: brick[0], r: brick[1],
    m: metal[0], M: metal[1], l: metal[2],
    h: wood[0], i: wood[1], j: wood[2],
    A: asphalt[0], B: asphalt[1],
  },
  rows: [
    'qKKKqqqKKKqsoqoqqqSqqqbbbbbbbbbbbbbqqqqqqqqqqqqKKKKKKKKK',
    'sqqqqKqqqqossqsoFrrrrbbbbbbbbbbbbbbbbbrbqqqqqqqqqqqKqqqq',
    'rrrqqrqqqqsSsqsSqrbbSbbbsbbbsbbbbbbbbbbbboqrrrrrqqqqqqqq',
    'bqqoqsqqqosSSsSsbxbSbxbobxsobxbxbxbxbxbxbsoqoxbrrrqqqqrr',
    'oqqsoqqqqsSFSSFsxxxxxxxxxoxxxxxxxxxxSxxxossssoxqqqqqqqxx',
    'srosSrrrxSFFFFFSxxxxxxxxxxxxxxxxxxxxxxxxsSsxsSqqqqqqqoqx',
    'SssSsxxxxKKKKKKxxxxxxxxxxxxxxxxxxxxxxxxosSSsSsxrrrorrsxx',
    'SFSSsoxxxKKKKKKxxxxxxxxxxxxxxxxxxxxxxxxsSFSSFsxxxxsxosSx',
    'FFFFSsXxXKKKKKKxXxXxXxXxXxXxXxXxqxXxXxXSFFFFFSXxXoSssSsx',
    'KKKKKKXXXKKKKKKXoXXXXXXXXXXsXXXqXXXqqSXKKKKKKXXXXsSFSSso',
    'KKKKKKoXXKSKsKKoSoXXXXXXXXoXXXXqqXXqqXXKKKKKKXXXKSFFFFSs',
    'KKKKKoSoXKKKKKKSFSXXXXXXXXXXXXXqqqqqqXXKKKKKKXXXKKKKKKKK',
    'KKKKKSFSoKKKoKKKKKoXoXoXoXoXoXoqoqqoqqoKKKSKKKKKKoKoKsKK',
    'KsKsKKKKKKKKKKKKKKooooooooooooqqqqqqqqoKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKsKSKKKKKoooooooooooFqqoqoqKKKKKKsKKKoKKKKsKKKK',
    'KKKsKKKoKKKKKKKKKKKKKsosoFososqqqqqqKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKoKKKSKKKKKssssssssqqqoqoKKKKsKoKKKKKKKKKKoKK',
    'KoKoKKKsKKKKKKKKKKKKKKKsssssssqqqlkqKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKKKKKskkkkssqqlkqqKKKKKKKKKKKKKKKKKKKK',
    'sssssssssssssssSsSsSsSskKKKKkFsMkSsSsSsSssssssssssssssss',
    'sssssssSsSSSSSSSSSSFSFFkKKKKkFMkFFSFSSSSSSSSSSsSssssssss',
    'ssssSkSSSSkxSSFSxSkkFFFkKKKKkMkFFkFFFxkSFSSSSSSSSsksssss',
    'ssxskkskkSkxkkxSxxkkxFFxkKKkMkFFxkSkkxkSkkxSSxkksskkssss',
    'kkxxkkkkksksxkkxkkkkkSssKKKKKssSxkkkkkkxxskxsxkkskkkxkks',
    'kkxkkxkkosoxkkkkxxkksKKKKKKKKKKKsxkkkkxxosokxkkkkkxkkskk',
    'kkksxxkkosokkkkkkkksKKKKKKKKKKKKKskskkxkosokkxkkkkxxosok',
    'kkosoxosSsokxkkskkksKKKhiiihKKKKsxosokosSsoxkxkskkxxoSok',
    'ooSoskkkkkkkkkksooossKKhjiihKKKsooSosossSssoooosooosSsoo',
    'ssSsksXxxxkxxXXskSsSoKKhiiihKKKokkSSSSkkSSSSkkSSSSkkSSSS',
    'sSFksXxxxxkxxxXxsksSoKKhhhhhKKKohsiiiihsiiiihsiiiihsiiii',
    'kkksssssssssssssssskoKKKKKKKKKKohhiiiihhiiiihhiiiihhiiii',
    'kSMmmmmmmmMkmmmmmmmMkkiiiiiiiiikkjjkkjjjjkkjjjjkkjjjjkkj',
    'kmmmmmmmmmmkmmmmmmmmkKKKKKkKKKKKkiihhiiiihhiisihhiiiihhi',
    'kmmmmmmmmmmkmmsmmmmmkKKKKkkkKKKKkiihhiiiihhiiiihhiiiihhi',
    'kKmSkkkkmmmmmmmkkkkmkKKKKkAkKKKKkkjjjjkkjjjjkkjjjjkkjjjj',
    'kKKkkKKkkKKKKKkkKKkkokKKkxAhkKKkohiiSihhiiiihhiiiihhiiii',
    'kkkkKmmKkkkkkkkKmmKkokKKkBAhkKKkohiiiihhiiiihhiiiihhiiii',
    'kkkKmMMmKkkkkkKmMMsKkKKKkAAkkKKKkjjkkjjjjkkjjjjkkjjjSkkj',
    'kkkkKmmKkkkkkkkKmmKkKKKKkBBAkKKKKkihhiiiihhiiiihhiiiihhi',
    'kkkkkKKkkkkkkkkkKKkkkkkkkABAkkkkkkihhiiiihhiiiihhiiiihhi',
  ],
};
